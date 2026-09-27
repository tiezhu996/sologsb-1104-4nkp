import { useEffect, useState } from 'react'
import { usePrepSecPerStep } from '../../hooks/usePrepSecPerStep'
import type { DisassemblyStep } from '../../types/step'
import {
  estimateWorkSec,
  formatDuration,
  formatSegmentRange,
  summarizeByTool,
} from '../../utils/processCard'

interface CraftCardProps {
  steps: DisassemblyStep[]
}

/** 拆装步序工艺卡：按工具归拢步数与停留秒数，并按师傅节奏估算工时 */
export function CraftCard({ steps }: CraftCardProps) {
  const { prepSec, setPrepSec, resetPrepSec, isDefault } = usePrepSecPerStep()
  const [draft, setDraft] = useState(String(prepSec))
  const summary = summarizeByTool(steps)
  const estimatedSec = estimateWorkSec(summary.totalHoldSec, summary.totalSteps, prepSec)

  // 重置等外部改动后，让输入框与已保存的准备秒数保持一致
  useEffect(() => {
    setDraft(String(prepSec))
  }, [prepSec])

  const handleDraftChange = (value: string) => {
    setDraft(value)
    const parsed = Number.parseInt(value, 10)
    if (Number.isFinite(parsed) && parsed >= 0) setPrepSec(parsed)
  }

  const handleBlur = () => {
    const parsed = Number.parseInt(draft, 10)
    if (!Number.isFinite(parsed) || parsed < 0) setDraft(String(prepSec))
  }

  return (
    <section className="panel p-5" data-testid="craft-card" aria-label="拆装工艺卡">
      <div className="flex flex-col gap-4 border-b border-wood-100 pb-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-wood-900">工艺卡 · 按工具归拢</h2>
          <p className="mt-1 text-xs leading-5 text-stone-500">
            累计停留秒数多的工具排在前面；同一件工具被别的步骤隔断时，会分段标出所在步。
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <label className="text-xs text-stone-500">
            每步准备秒数
            <input
              type="number"
              min={0}
              step={1}
              value={draft}
              onChange={(event) => handleDraftChange(event.target.value)}
              onBlur={handleBlur}
              className="input-field mt-1 w-28 text-sm"
              aria-label="每步准备秒数"
              data-testid="prep-sec-input"
            />
          </label>
          {!isDefault && (
            <button type="button" onClick={resetPrepSec} className="secondary-button px-3 py-2 text-xs">
              恢复默认 3 秒
            </button>
          )}
          <div className="rounded-xl bg-wood-50 px-4 py-2 text-right">
            <p className="text-[11px] text-stone-500">预计工时</p>
            <p className="text-lg font-bold text-wood-700" data-testid="estimated-work">
              {estimatedSec} 秒
              <span className="ml-1 text-xs font-normal text-stone-500">（{formatDuration(estimatedSec)}）</span>
            </p>
            <p className="mt-0.5 text-[11px] text-stone-400">
              停留 {summary.totalHoldSec} 秒 + 准备 {prepSec} 秒 × {summary.totalSteps} 步
            </p>
          </div>
        </div>
      </div>

      <ol className="mt-4 space-y-3" aria-label="工具工时明细">
        {summary.rows.map((row) => (
          <li
            key={row.tool}
            className="rounded-xl border border-stone-200 bg-white px-4 py-3"
            data-testid="craft-tool-row"
          >
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-wood-900">
                <span aria-hidden="true" className="h-2 w-2 rounded-full bg-wood-500" />
                {row.tool}
              </span>
              <span className="text-xs text-stone-500">走 <strong className="text-stone-800">{row.stepCount}</strong> 步</span>
              <span className="text-xs text-stone-500">
                停留合计 <strong className="text-stone-800">{row.totalHoldSec}</strong> 秒
              </span>
              {row.segments.length === 1 ? (
                <span className="ml-auto text-xs text-stone-400">{formatSegmentRange(row.segments[0])}</span>
              ) : (
                <span className="ml-auto inline-flex items-center gap-2 text-xs text-amber-800">
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 font-medium">
                    被隔断，分 {row.segments.length} 段
                  </span>
                  {row.segments.map((segment) => (
                    <span key={`${segment.startSeq}-${segment.endSeq}`} className="rounded bg-amber-50 px-2 py-0.5">
                      {formatSegmentRange(segment)}
                    </span>
                  ))}
                </span>
              )}
            </div>
          </li>
        ))}
      </ol>

      <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-wood-100 pt-4 text-center">
        <div className="rounded-lg bg-wood-50/70 px-3 py-2">
          <dt className="text-[11px] text-stone-500">总步数</dt>
          <dd className="mt-0.5 text-base font-bold text-wood-700" data-testid="craft-total-steps">{summary.totalSteps}</dd>
        </div>
        <div className="rounded-lg bg-wood-50/70 px-3 py-2">
          <dt className="text-[11px] text-stone-500">工具种数</dt>
          <dd className="mt-0.5 text-base font-bold text-wood-700" data-testid="craft-tool-kinds">{summary.toolKinds}</dd>
        </div>
        <div className="rounded-lg bg-wood-50/70 px-3 py-2">
          <dt className="text-[11px] text-stone-500">总停留秒数</dt>
          <dd className="mt-0.5 text-base font-bold text-wood-700" data-testid="craft-total-hold">{summary.totalHoldSec}</dd>
        </div>
      </dl>
    </section>
  )
}
