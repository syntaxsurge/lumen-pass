'use client'

import {
  FREIGHTER_ID,
  StellarWalletsKit,
  allowAllModules
} from '@creit.tech/stellar-wallets-kit'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react'
import type { ReactNode } from 'react'

import { STELLAR_NETWORK_PASSPHRASE } from '@/lib/stellar/config'

const STORAGE_KEY = 'lumenpass:selected-wallet'

type WalletStatus = 'idle' | 'connecting' | 'connected'

type WalletContextValue = {
  address: string | null
  status: WalletStatus
  connect: () => Promise<void>
  disconnect: () => void
  kit: StellarWalletsKit | null
}

const StellarWalletContext = createContext<WalletContextValue | undefined>(
  undefined
)

function readSelectedWallet() {
  if (typeof window === 'undefined') return FREIGHTER_ID
  return window.localStorage.getItem(STORAGE_KEY) ?? FREIGHTER_ID
}

export function StellarWalletProvider({ children }: { children: ReactNode }) {
  const walletNetwork = STELLAR_NETWORK_PASSPHRASE
  const [kit, setKit] = useState<StellarWalletsKit | null>(null)
  const [address, setAddress] = useState<string | null>(null)
  const [status, setStatus] = useState<WalletStatus>('idle')

  useEffect(() => {
    if (typeof window === 'undefined') return
    const selectedWalletId = readSelectedWallet()
    const instance = new StellarWalletsKit({
      network: walletNetwork,
      modules: allowAllModules(),
      selectedWalletId
    })
    instance.setWallet(selectedWalletId)
    setKit(instance)

    instance
      .getAddress()
      .then(({ address }) => {
        if (address) {
          setAddress(address)
          setStatus('connected')
        }
      })
      .catch(() => setStatus('idle'))
  }, [])

  const connect = useCallback(async () => {
    if (!kit) return
    setStatus('connecting')
    try {
      await kit.openModal({
        onWalletSelected: async option => {
          kit.setWallet(option.id)
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(STORAGE_KEY, option.id)
          }
          const { address } = await kit.getAddress()
          setAddress(address)
          setStatus('connected')
          return option.id
        }
      })
    } catch (error) {
      console.error('[wallet] failed to connect', error)
      setStatus(address ? 'connected' : 'idle')
    }
  }, [address, kit])

  const disconnect = useCallback(() => {
    if (!kit) return
    kit.disconnect()
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY)
    }
    setAddress(null)
    setStatus('idle')
  }, [kit])

  const value = useMemo(
    () => ({ address, status, connect, disconnect, kit }),
    [address, connect, disconnect, kit, status]
  )

  return (
    <StellarWalletContext.Provider value={value}>
      {children}
    </StellarWalletContext.Provider>
  )
}

export function useStellarWalletContext() {
  const context = useContext(StellarWalletContext)
  if (!context) {
    throw new Error('useStellarWalletContext must be used within StellarWalletProvider')
  }
  return context
}
