import type { DisassemblyStep } from '../types/step'

export interface ToolSegment {
  /** 该段覆盖的起始步序号（seq，从 1 开始） */
  startSeq: number
  /** 该段覆盖的结束步序号 */
  endSeq: number
  /** 该段在步骤数组中的起始下标，用于点击定位 */
  startIndex: number
  /** 段内停留秒数合计 */
  holdSec: number
  /** 段内步数 */
  stepCount: number
}

export interface ToolSummary {
  tool: DisassemblyStep['tool']
  /** 总步数（被隔断的各段相加） */
  stepCount: number
  /** 累计停留秒数 */
  totalHoldSec: number
  /** 第一次出现的步序号，累计停留相同时按它排序 */
  firstSeq: number
  /** 同一件工具被其他步骤隔断时，这里会有多段 */
  segments: ToolSegment[]
}

/**
 * 把已按 seq 排好序的步骤按工具归拢，并切出每件工具被隔断的各连续段。
 */
export function summarizeToolsByTool(steps: DisassemblyStep[]): ToolSummary[] {
  const summaries = new Map<DisassemblyStep['tool'], ToolSummary>()

  steps.forEach((step, index) => {
    const existing = summaries.get(step.tool)
    const seq = index + 1

    if (!existing) {
      summaries.set(step.tool, {
        tool: step.tool,
        stepCount: 1,
        totalHoldSec: step.holdSec,
        firstSeq: seq,
        segments: [{
          startSeq: seq,
          endSeq: seq,
          startIndex: index,
          holdSec: step.holdSec,
          stepCount: 1,
        }],
      })
      return
    }

    const lastSegment = existing.segments[existing.segments.length - 1]
    const previousStep = steps[index - 1]
    const continues = previousStep?.tool === step.tool

    if (continues && lastSegment) {
      lastSegment.endSeq = seq
      lastSegment.holdSec += step.holdSec
      lastSegment.stepCount += 1
    } else {
      existing.segments.push({
        startSeq: seq,
        endSeq: seq,
        startIndex: index,
        holdSec: step.holdSec,
        stepCount: 1,
      })
    }

    existing.stepCount += 1
    existing.totalHoldSec += step.holdSec
  })

  // 累计停留多的排前面，相同则先出场的工具在前
  return [...summaries.values()].sort(
    (a, b) => b.totalHoldSec - a.totalHoldSec || a.firstSeq - b.firstSeq,
  )
}

/** 把一段序号格式化成「第 a 步」或「第 a–b 步」。 */
export function formatSegmentRange(segment: ToolSegment): string {
  if (segment.startSeq === segment.endSeq) return `第 ${segment.startSeq} 步`
  return `第 ${segment.startSeq}–${segment.endSeq} 步`
}

/** 按每步准备秒数估算的总工时：各步停留时间之外，再为每一步加上准备时间。 */
export function estimateTotalWorkSec(
  totalHoldSec: number,
  stepCount: number,
  prepSecPerStep: number,
): number {
  return totalHoldSec + stepCount * prepSecPerStep
}
