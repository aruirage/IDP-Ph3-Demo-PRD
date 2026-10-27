/** 案件 ID：CLAIM- + YYYYMMDD + 六位当日创建序号，如 CLAIM-20260828000148 */
export const CASE_ID_PATTERN = /^CLAIM-\d{8}\d{6}$/

export function formatCaseId(createdAt: string, daySequence: number): string {
  const datePart = createdAt.slice(0, 10).replace(/-/g, '')
  const seqPart = String(daySequence).padStart(6, '0')
  return `CLAIM-${datePart}${seqPart}`
}

/** 原型动态建案时生成 ID（序号取当前时刻毫秒低位，仅演示用） */
export function generateCaseId(receivedAt: string): string {
  const seq = (Date.now() % 999999) + 1
  return formatCaseId(receivedAt, seq)
}

export const CASE_ID_PLACEHOLDER = 'CLAIM-YYYYMMDD000001'
