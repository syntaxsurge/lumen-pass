import {
  SETTLEMENT_TOKEN_DECIMALS,
  SETTLEMENT_TOKEN_SYMBOL
} from '@/lib/config'

const DEFAULT_MAX_FRACTION_DIGITS = 4
const DECIMAL_FACTOR = 10n ** BigInt(SETTLEMENT_TOKEN_DECIMALS)

type FormatOptions = {
  minimumFractionDigits?: number
  maximumFractionDigits?: number
}

function normalizeInput(value: string | number) {
  const str = typeof value === 'number' ? value.toString() : value.trim()
  if (!str) return '0'
  if (!/^\d*(\.\d+)?$/.test(str)) {
    throw new Error('Enter a positive numeric amount.')
  }
  return str
}

function toBigIntFromDecimal(value: string) {
  const [wholePart, fractionalPart = ''] = value.split('.')
  const paddedFraction =
    fractionalPart.padEnd(SETTLEMENT_TOKEN_DECIMALS, '0') ||
    '0'.repeat(SETTLEMENT_TOKEN_DECIMALS)
  const fractionSlice = paddedFraction.slice(0, SETTLEMENT_TOKEN_DECIMALS)
  const whole = BigInt(wholePart || '0')
  const fraction = BigInt(fractionSlice || '0')
  return whole * DECIMAL_FACTOR + fraction
}

/**
 * Converts a human readable amount (e.g. "1.5") into stroops (7 decimals).
 */
export function parseSettlementTokenAmount(value: string | number): bigint {
  const normalized = normalizeInput(value)
  return toBigIntFromDecimal(normalized)
}

function toNumber(amount: bigint) {
  return Number(amount) / Number(DECIMAL_FACTOR)
}

export function formatSettlementToken(amount: bigint, options?: FormatOptions) {
  const maximumFractionDigits =
    options?.maximumFractionDigits ?? DEFAULT_MAX_FRACTION_DIGITS
  const minimumFractionDigits = options?.minimumFractionDigits ?? 0
  const formatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits,
    maximumFractionDigits
  })
  return `${formatter.format(toNumber(amount))} ${SETTLEMENT_TOKEN_SYMBOL}`
}

export function describeSettlementAmount(amount: number | string) {
  return `${amount} ${SETTLEMENT_TOKEN_SYMBOL}`
}
