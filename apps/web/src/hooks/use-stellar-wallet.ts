'use client'

import { useMemo } from 'react'

import { STELLAR_NETWORK_PASSPHRASE } from '@/lib/stellar/config'
import { useStellarWalletContext } from '@/providers/stellar-wallet-provider'

export function useStellarWallet() {
  const context = useStellarWalletContext()

  const signTransaction = useMemo(() => {
    if (!context.kit) return null
    return async (xdr: string) => {
      return context.kit!.signTransaction(xdr, {
        networkPassphrase: STELLAR_NETWORK_PASSPHRASE,
        address: context.address ?? undefined,
        accountToSign: context.address ?? undefined
      })
    }
  }, [context.address, context.kit])

  return {
    address: context.address,
    publicKey: context.address,
    status: context.status,
    isConnected: context.status === 'connected',
    connect: context.connect,
    disconnect: context.disconnect,
    signTransaction
  }
}
