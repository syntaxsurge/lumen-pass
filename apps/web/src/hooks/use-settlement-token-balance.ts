'use client'

import { useEffect, useMemo, useState } from 'react'

import { getNativeAssetContractAddress } from '@/lib/config'
import { parseSettlementTokenAmount } from '@/lib/settlement-token'
import { STELLAR_HORIZON_URL } from '@/lib/stellar/config'

type Params = {
  address?: string | null
}

type Result = {
  value: bigint | null
  tokenAddress: string | null
  isSupportedChain: boolean
  isLoading: boolean
  isError: boolean
}

const HORIZON_BASE = STELLAR_HORIZON_URL.replace(/\/$/, '')

type HorizonBalance = {
  asset_type?: string
  balance?: string
}

export function useSettlementTokenBalance({ address }: Params): Result {
  const [value, setValue] = useState<bigint | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)
  const tokenAddress = useMemo(() => {
    const nativeAddress = getNativeAssetContractAddress()
    return nativeAddress || null
  }, [])

  useEffect(() => {
    let cancelled = false

    async function fetchBalance() {
      if (!address) {
        setValue(null)
        setIsLoading(false)
        setIsError(false)
        return
      }

      setIsLoading(true)
      setIsError(false)

      try {
        const response = await fetch(`${HORIZON_BASE}/accounts/${address}`)

        if (response.status === 404) {
          if (!cancelled) {
            setValue(0n)
            setIsError(false)
          }
          return
        }

        if (!response.ok) {
          throw new Error(`Horizon responded with ${response.status}`)
        }

        const payload = await response.json()
        const balances: HorizonBalance[] = Array.isArray(payload?.balances)
          ? (payload.balances as HorizonBalance[])
          : []
        const nativeEntry = balances.find(item => item?.asset_type === 'native')
        const amount =
          typeof nativeEntry?.balance === 'string'
            ? parseSettlementTokenAmount(nativeEntry.balance)
            : 0n

        if (!cancelled) {
          setValue(amount)
        }
      } catch (error) {
        if (!cancelled) {
          console.error('[wallet] unable to fetch balance', error)
          setValue(null)
          setIsError(true)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    fetchBalance()

    const interval = setInterval(fetchBalance, 15_000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [address])

  return {
    value,
    tokenAddress,
    isSupportedChain: true,
    isLoading,
    isError
  }
}
