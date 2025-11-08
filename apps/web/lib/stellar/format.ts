const STROOPS_PER_XLM = BigInt(10_000_000)
const ZERO = BigInt(0)

export function formatXlm(amount: bigint, fractionDigits = 2) {
  const isNegative = amount < ZERO
  const absolute = isNegative ? -amount : amount
  const whole = absolute / STROOPS_PER_XLM
  const fraction = absolute % STROOPS_PER_XLM
  const padded = fraction.toString().padStart(7, '0')
  const trimmed = padded.slice(0, fractionDigits).replace(/0+$/, '')
  const prefix = isNegative ? '-' : ''
  return trimmed ? `${prefix}${whole}.${trimmed}` : `${prefix}${whole}`
}
