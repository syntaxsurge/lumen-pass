'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode, useState } from 'react'

import { StellarWalletProvider } from '@/providers/stellar-wallet-provider'

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <StellarWalletProvider>{children}</StellarWalletProvider>
    </QueryClientProvider>
  )
}
