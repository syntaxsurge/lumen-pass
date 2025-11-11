/* eslint-disable import/order */
'use client'

import { useMemo } from 'react'
import { ConvexProvider, ConvexReactClient } from 'convex/react'

interface ConvexClientProviderProps {
  children: React.ReactNode
}

export const ConvexClientProvider = ({
  children
}: ConvexClientProviderProps) => {
  // Always call hooks; decide SSR/client inside the memo to satisfy lint rules.
  const convex = useMemo(() => {
    if (typeof window === 'undefined') return null
    const url = process.env.NEXT_PUBLIC_CONVEX_URL
    try {
      return url ? new ConvexReactClient(url) : null
    } catch {
      return null
    }
  }, [])

  if (!convex) return <>{children}</>
  return <ConvexProvider client={convex}>{children}</ConvexProvider>
}
