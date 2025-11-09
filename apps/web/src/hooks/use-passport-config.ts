'use client'

// Passport/wagmi are removed in the Stellar build. Keep a no-op
// export so existing imports compile without changing call sites.
export function usePassportConfig() {
  return null
}
