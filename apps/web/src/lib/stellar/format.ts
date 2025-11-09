const DEFAULT_PREFIX = 6
const DEFAULT_SUFFIX = 4

type SummarizeOptions = {
  fallback?: string
  prefixLength?: number
  suffixLength?: number
}

export function summarizeAccount(
  address?: string | null,
  options: SummarizeOptions = {}
): string {
  const fallback = options.fallback ?? 'Unknown account'
  if (!address || address.length === 0) {
    return fallback
  }

  const prefix = options.prefixLength ?? DEFAULT_PREFIX
  const suffix = options.suffixLength ?? DEFAULT_SUFFIX

  if (address.length <= prefix + suffix + 3) {
    return address
  }

  return `${address.slice(0, prefix)}…${address.slice(-suffix)}`
}
