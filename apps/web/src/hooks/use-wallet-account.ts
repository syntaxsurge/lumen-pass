'use client'

import { useCallback, useMemo } from 'react'

import { useStellarWallet } from '@/hooks/use-stellar-wallet'

type WalletAccount = {
  address: string | null
  chainId: number | null
  originAddress: string | null
  originChain: string | null
  status: 'idle' | 'connecting' | 'connected'
  isConnected: boolean
  connect: () => void
  disconnect: () => void
  publicClient: null
  walletClient: null
}

/**
 * Stellar-backed wallet state compatible with the rest of the app.
 */
export function useWalletAccount(): WalletAccount {
  const wallet = useStellarWallet()

  const connect = useCallback(() => {
    wallet.connect()
  }, [wallet])

  const disconnect = useCallback(() => {
    wallet.disconnect()
  }, [wallet])

  return useMemo(
    () => ({
      address: wallet.address ?? null,
      chainId: null,
      originAddress: wallet.address ?? null,
      originChain: null,
      status: wallet.status,
      isConnected: wallet.isConnected,
      connect,
      disconnect,
      publicClient: null,
      walletClient: null
    }),
    [connect, disconnect, wallet.address, wallet.isConnected, wallet.status]
  )
}
