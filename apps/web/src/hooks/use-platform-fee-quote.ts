'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { SUBSCRIPTION_PRICE_USD } from '@/lib/config'
import { getCoingeckoUsdPrice } from '@/lib/pricing/coingecko'
import { formatSettlementToken } from '@/lib/settlement-token'
import { getPrice as getLumenPassPrice } from '@/lib/stellar/lumen-pass-service'

export type PlatformFeeQuote = {
  amount: bigint
  displayAmount: string
}

type UsePlatformFeeQuoteOptions = {
  autoFetch?: boolean
}

const USD_FORMATTER = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2
})

function formatSubscriptionUsdLabel() {
  const parsed = Number(SUBSCRIPTION_PRICE_USD)
  if (!Number.isFinite(parsed)) {
    return `$${SUBSCRIPTION_PRICE_USD} USD/month`
  }
  return `${USD_FORMATTER.format(parsed)}/month`
}

async function fetchPlatformQuote(): Promise<PlatformFeeQuote> {
  const usdTarget = Number(SUBSCRIPTION_PRICE_USD)
  let amount: bigint | null = null

  if (Number.isFinite(usdTarget) && usdTarget > 0) {
    try {
      const xlmUsd = await getCoingeckoUsdPrice('stellar')
      if (xlmUsd && xlmUsd > 0) {
        const lumens = usdTarget / xlmUsd
        const stroops = BigInt(Math.round(lumens * 10 ** 7))
        if (stroops > 0n) {
          amount = stroops
        }
      }
    } catch (error) {
      console.warn('[platform-fee] coingecko lookup failed', error)
    }
  }

  if (!amount) {
    const fallback = await getLumenPassPrice()
    if (typeof fallback === 'bigint' && fallback > 0n) {
      amount = fallback
    }
  }

  const resolved = amount ?? 0n
  return {
    amount: resolved,
    displayAmount: formatSettlementToken(resolved, {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0
    })
  }
}

export function usePlatformFeeQuote(options: UsePlatformFeeQuoteOptions = {}) {
  const { autoFetch = false } = options
  const [quote, setQuote] = useState<PlatformFeeQuote | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const next = await fetchPlatformQuote()
      setQuote(next)
      return next
    } catch (err) {
      const normalized =
        err instanceof Error ? err : new Error('Failed to fetch price')
      setError(normalized)
      throw normalized
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!autoFetch) return
    void refresh()
  }, [autoFetch, refresh])

  const usdLabel = useMemo(() => formatSubscriptionUsdLabel(), [])
  const settlementLabel = useMemo(
    () => (quote ? `${quote.displayAmount}/month` : null),
    [quote]
  )

  return {
    quote,
    label: usdLabel,
    usdLabel,
    settlementLabel,
    loading,
    error,
    refresh
  }
}
