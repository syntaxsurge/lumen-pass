'use client'

import { ReactNode, useMemo } from 'react'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ThemeProviderProps } from 'next-themes'

import { ConvexClientProvider } from '@/providers/convex-client-provider'
import { StellarWalletProvider } from '@/providers/stellar-wallet-provider'

type AppProvidersProps = {
  children: ReactNode
}

/**
 * Aggregates theme, Stellar Wallet Kit, and Convex providers so the rest of the app
 * can rely on a single source of truth for wallet connectivity and data.
 */
export function AppProviders({ children }: AppProvidersProps) {
  const queryClient = useMemo(() => new QueryClient(), [])

  return (
    <QueryClientProvider client={queryClient}>
      <StellarWalletProvider>
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </StellarWalletProvider>
    </QueryClientProvider>
  )
}
