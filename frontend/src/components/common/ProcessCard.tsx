import { useEffect, useMemo, useState } from 'react'
import { usePrepSeconds, DEFAULT_PREP_SEC_PER_STEP } from '../../hooks/usePrepSeconds'
import type { DisassemblyStep } from '../../types/step'
import {
  estimateTotalWorkSec,
  formatSegmentRange,
  summarizeToolsByTool,
} from '../../utils/processCard'

interface ProcessCardProps {
  jointTypeId: string
  steps: DisassemblyStep[]
  /** 点击分段时定位到对应步骤 */
  onLocateStep?: (index: number) => void
}

function formatMinutes(totalSec: number): string {
  return (totalSec / 60).toFixed(1)
}

export function ProcessCard({ jointTypeId, steps, onLocateStep }: ProcessCardProps) {
  const { prepSec, updatePrepSec, resetPrepSec } = usePrepSeconds(jointTypeId)
  const [draft, setDraft] = useState(String(prepSec))

  useEffect(() => {
    setDraft(String(prepSec))
  }, [prepSec])

  const summaries = useMemo(() => summarizeToolsByTool(steps), [steps])
  const totalHoldSec = useMemo(
    () => steps.reduce((total, step) => total + step.holdSec, 0),
    [steps],
  )
  const stepCount = steps.length
  const toolKindCount = summaries.length
  const estimatedTotalSec = estimateTotalWorkSec(totalHoldSec, stepCount, prepSec)
  const maxHoldSec = summaries[0]?.totalHoldSec ?? 0

  const handlePrepChange = (raw: string) => {
    setDraft(raw)
    const next = Number.parseInt(raw, 10)
    if (Number.isFinite(next) && next >= 0) updatePrepSec(next)
  }

  const handlePrepBlur = () => {
    setDraft(String(prepSec))
  }

  return (
    <section className="panel p-5" aria-label="工具工艺卡" data-testid="process-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-[0.24em] text-wood-500">PROCESS CARD</p>
          <h2 className="mt-1 text-lg font-semibold text-wood-900">工具工艺卡</h2>
          <p className="mt-1 text-xs text-stone-500">按工具归拢步序，累计停留多的工具排前面。</p>
        </div>
        <div
          className="flex flex-wrap gap-x-4 gap-y-1 rounded-xl bg-wood-50 px-4 py-2 text-xs text-stone-600"
          data-testid="process-card-summary"
        >
          <span>总步数 <strong className="text-wood-700">{stepCount}</strong></span>
          <span>工具种数 <strong className="text-wood-700">{toolKindCount}</strong></span>
          <span>总停留 <strong className="text-wood-700">{totalHoldSec}</strong> 秒</span>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-wood-100 bg-white px-4 py-3">
          <label htmlFor="prep-sec-input" className="text-xs font-medium text-stone-600">
            每步准备秒数（按自己的节奏估工时）
          </label>
          <div className="mt-2 flex items-center gap-3">
            <div className="flex w-28 items-center rounded-lg border border-wood-100 bg-white focus-within:border-wood-500 focus-within:ring-2 focus-within:ring-wood-100">
              <input
                id="prep-sec-input"
                type="number"
                min="0"
                step="1"
                className="min-w-0 flex-1 rounded-lg bg-transparent px-2.5 py-1.5 text-sm text-stone-800 outline-none"
                value={draft}
                onChange={(event) => handlePrepChange(event.target.value)}
                onBlur={handlePrepBlur}
                aria-label="每步准备秒数"
                data-testid="prep-sec-input"
              />
              <span className="border-l border-wood-100 px-2 py-1.5 text-xs text-stone-500">秒</span>
            </div>
            <button
              type="button"
              onClick={resetPrepSec}
              className="text-xs text-wood-700 underline-offset-2 hover:underline"
            >
              恢复默认 {DEFAULT_PREP_SEC_PER_STEP} 秒
            </button>
          </div>
        </div>
        <div className="rounded-xl border border-amber-100 bg-amber-50/70 px-4 py-3">
          <p className="text-xs font-medium text-amber-900">预计工时</p>
          <p className="mt-1 text-2xl font-bold text-amber-900" data-testid="estimated-total-sec">
            {estimatedTotalSec}
            <span className="ml-1 text-sm font-medium">秒</span>
            <span className="ml-2 text-xs font-normal text-amber-900/70">（约 {formatMinutes(estimatedTotalSec)} 分钟）</span>
          </p>
          <p className="mt-1 text-[11px] leading-5 text-amber-900/70">
            停留 {totalHoldSec} 秒 ＋ 每步准备 {prepSec} 秒 × {stepCount} 步
          </p>
        </div>
      </div>

      <ol className="mt-4 space-y-3" data-testid="tool-summary-list">
        {summaries.map((summary) => (
          <li
            key={summary.tool}
            className="rounded-xl border border-stone-200 bg-white p-3.5"
            data-testid="tool-summary-row"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 min-w-8 items-center justify-center rounded-lg bg-wood-700 px-2 text-sm font-semibold text-white">
                  {summary.tool}
                </span>
                <span className="text-sm text-stone-700">
                  走 <strong className="text-stone-900">{summary.stepCount}</strong> 步
                </span>
              </div>
              <span className="text-sm text-stone-700">
                停留 <strong className="text-wood-700">{summary.totalHoldSec}</strong> 秒
              </span>
            </div>

            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-stone-100">
              <div
                className="h-full rounded-full bg-wood-500"
                style={{ width: `${maxHoldSec > 0 ? (summary.totalHoldSec / maxHoldSec) * 100 : 0}%` }}
              />
            </div>

            <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-xs text-stone-600">
              {summary.segments.length > 1 && (
                <span className="font-medium text-stone-500">
                  被隔断为 {summary.segments.length} 段：
                </span>
              )}
              {summary.segments.map((segment) => (
                <button
                  key={`${segment.startSeq}-${segment.endSeq}`}
                  type="button"
                  onClick={() => onLocateStep?.(segment.startIndex)}
                  className="rounded-full border border-wood-100 bg-wood-50 px-2.5 py-1 text-wood-700 transition hover:border-wood-500 hover:bg-white"
                  title="定位到该步"
                >
                  {formatSegmentRange(segment)}
                  {summary.segments.length > 1 && <span className="text-stone-500"> · {segment.holdSec} 秒</span>}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
