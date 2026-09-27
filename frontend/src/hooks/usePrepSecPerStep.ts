import { useCallback, useState } from 'react'

const PREP_SEC_STORAGE_KEY = 'gbmortise:prepSecPerStep'
const DEFAULT_PREP_SEC = 3

function readStoredPrepSec(): number {
  try {
    const raw = window.localStorage.getItem(PREP_SEC_STORAGE_KEY)
    if (raw === null) return DEFAULT_PREP_SEC
    const parsed = Number.parseInt(raw, 10)
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : DEFAULT_PREP_SEC
  } catch {
    return DEFAULT_PREP_SEC
  }
}

/**
 * 每步准备秒数：按师傅自己的节奏调整，默认 3 秒；
 * 写入 localStorage，重开拆装步序页仍保留。
 */
export function usePrepSecPerStep(): {
  prepSec: number
  setPrepSec: (value: number) => void
  resetPrepSec: () => void
  isDefault: boolean
} {
  const [prepSec, setPrepSecState] = useState<number>(readStoredPrepSec)

  const setPrepSec = useCallback((value: number) => {
    const next = Math.max(0, Math.floor(Number.isFinite(value) ? value : DEFAULT_PREP_SEC))
    setPrepSecState(next)
    try {
      window.localStorage.setItem(PREP_SEC_STORAGE_KEY, String(next))
    } catch {
      // 隐私模式等场景下 localStorage 不可写，仅保留内存中的值
    }
  }, [])

  const resetPrepSec = useCallback(() => {
    setPrepSec(DEFAULT_PREP_SEC)
  }, [setPrepSec])

  return { prepSec, setPrepSec, resetPrepSec, isDefault: prepSec === DEFAULT_PREP_SEC }
}
