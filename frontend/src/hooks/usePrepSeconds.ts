import { useCallback, useEffect, useState } from 'react'

export const DEFAULT_PREP_SEC_PER_STEP = 3
const STORAGE_KEY_PREFIX = 'gbmortise.prepSecPerStep.'

function storageKey(jointTypeId: string): string {
  return `${STORAGE_KEY_PREFIX}${jointTypeId}`
}

function readPrepSec(jointTypeId: string): number {
  try {
    const raw = window.localStorage.getItem(storageKey(jointTypeId))
    if (raw === null) return DEFAULT_PREP_SEC_PER_STEP
    const parsed = Number.parseInt(raw, 10)
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : DEFAULT_PREP_SEC_PER_STEP
  } catch {
    // 隐私模式等场景下 localStorage 不可用，退回默认值即可
    return DEFAULT_PREP_SEC_PER_STEP
  }
}

/**
 * 每步准备秒数，默认 3 秒；师傅按自己节奏调整后写入 localStorage，
 * 重开同一榫卯类型的步序页时仍然保留。
 */
export function usePrepSeconds(jointTypeId: string) {
  const [prepSec, setPrepSec] = useState<number>(() => readPrepSec(jointTypeId))

  useEffect(() => {
    setPrepSec(readPrepSec(jointTypeId))
  }, [jointTypeId])

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey(jointTypeId), String(prepSec))
    } catch {
      // 存储失败不影响页面上的估算
    }
  }, [jointTypeId, prepSec])

  const updatePrepSec = useCallback((value: number) => {
    setPrepSec(Number.isFinite(value) && value > 0 ? Math.floor(value) : 0)
  }, [])

  const resetPrepSec = useCallback(() => {
    setPrepSec(DEFAULT_PREP_SEC_PER_STEP)
  }, [])

  return { prepSec, updatePrepSec, resetPrepSec }
}
