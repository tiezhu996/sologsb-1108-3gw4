import { computed, ref, type Ref } from 'vue'

export interface CompensationAdvice {
  minutes: number
  factor: number
  delta: number
  advice: string
}

export function calculateCompensatedMinutes(
  baseMinutes: number,
  actualTempC: number,
  referenceTempC = 20
): number {
  const safeBase = Math.max(0.1, baseMinutes)
  const delta = actualTempC - referenceTempC
  const factor = delta >= 0 ? Math.pow(0.9, delta) : Math.pow(1.1, Math.abs(delta))
  return Math.max(0.25, Math.round(safeBase * factor * 100) / 100)
}

export function getCompensationAdvice(
  baseMinutes: number,
  actualTempC: number,
  referenceTempC = 20
): CompensationAdvice {
  const delta = Math.round((actualTempC - referenceTempC) * 10) / 10
  const minutes = calculateCompensatedMinutes(baseMinutes, actualTempC, referenceTempC)
  const factor = delta >= 0 ? Math.pow(0.9, delta) : Math.pow(1.1, Math.abs(delta))
  const direction = delta > 0 ? '缩短' : delta < 0 ? '延长' : '维持'
  const advice = delta === 0
    ? '实测温度等于配方基准，按原时间执行'
    : `实测温度${delta > 0 ? '偏高' : '偏低'} ${Math.abs(delta).toFixed(1)}°C，建议${direction}至 ${minutes.toFixed(2)} 分钟`
  return { minutes, factor: Math.round(factor * 1000) / 1000, delta, advice }
}

export function useTempCompensate(referenceTempC: Ref<number> = ref(20)) {
  const actualTempC = ref(referenceTempC.value)
  const advice = computed(() => getCompensationAdvice(10, actualTempC.value, referenceTempC.value))

  function compensate(baseMinutes: number, tempC = actualTempC.value): number {
    return calculateCompensatedMinutes(baseMinutes, tempC, referenceTempC.value)
  }

  function suggest(baseMinutes: number, tempC = actualTempC.value): CompensationAdvice {
    return getCompensationAdvice(baseMinutes, tempC, referenceTempC.value)
  }

  return { referenceTempC, actualTempC, advice, compensate, suggest }
}
