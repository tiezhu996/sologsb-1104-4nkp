import type { DisassemblyStep } from '../types/step'

/** 同一件工具在步序中连续出现的一段 */
export interface ToolSegment {
  /** 该段起始步序号（seq，从 1 开始） */
  startSeq: number
  /** 该段结束步序号（含） */
  endSeq: number
  /** 该段包含的步数 */
  count: number
}

export interface ToolCardRow {
  tool: string
  /** 使用该工具的总步数 */
  stepCount: number
  /** 该工具各步停留秒数之和 */
  totalHoldSec: number
  /** 连续段；超过一段说明被别的工具隔断 */
  segments: ToolSegment[]
}

export interface ProcessCardSummary {
  totalSteps: number
  toolKinds: number
  totalHoldSec: number
  rows: ToolCardRow[]
}

/**
 * 按工具归拢步序：累计停留秒数多的排前面；
 * 同一件工具被别的步骤隔断时，拆成多个连续段并标出各段所在步。
 */
export function summarizeByTool(steps: DisassemblyStep[]): ProcessCardSummary {
  const grouped = new Map<string, { stepCount: number; totalHoldSec: number; segments: ToolSegment[] }>()

  steps.forEach((step) => {
    const entry = grouped.get(step.tool) ?? { stepCount: 0, totalHoldSec: 0, segments: [] }
    const last = entry.segments[entry.segments.length - 1]
    if (last && last.endSeq + 1 === step.seq) {
      last.endSeq = step.seq
      last.count += 1
    } else {
      entry.segments.push({ startSeq: step.seq, endSeq: step.seq, count: 1 })
    }
    entry.stepCount += 1
    entry.totalHoldSec += step.holdSec
    grouped.set(step.tool, entry)
  })

  const rows = Array.from(grouped, ([tool, stats]) => ({ tool, ...stats }))
    .sort((a, b) => b.totalHoldSec - a.totalHoldSec || a.tool.localeCompare(b.tool, 'zh-Hans-CN'))

  return {
    totalSteps: steps.length,
    toolKinds: rows.length,
    totalHoldSec: rows.reduce((total, row) => total + row.totalHoldSec, 0),
    rows,
  }
}

/** 把一段连续步格式化成「第 a–b 步」或「第 a 步」 */
export function formatSegmentRange(segment: ToolSegment): string {
  return segment.startSeq === segment.endSeq
    ? `第 ${segment.startSeq} 步`
    : `第 ${segment.startSeq}–${segment.endSeq} 步`
}

/** 预计工时（秒）= 总停留秒数 + 每步准备秒数 × 总步数 */
export function estimateWorkSec(totalHoldSec: number, totalSteps: number, prepSecPerStep: number): number {
  return totalHoldSec + prepSecPerStep * totalSteps
}

/** 把秒数格式化成便于师傅读工时的文案：不足 1 分钟只给秒，超过则补充分钟 */
export function formatDuration(totalSec: number): string {
  if (totalSec < 60) return `${totalSec} 秒`
  const minutes = Math.floor(totalSec / 60)
  const remainSec = totalSec % 60
  return remainSec === 0 ? `${minutes} 分` : `${minutes} 分 ${remainSec} 秒`
}
