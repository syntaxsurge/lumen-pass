'use client'

import { useEffect, useMemo, useRef } from 'react'

import { useMutation, useQuery } from 'convex/react'

import { api } from '@/convex/_generated/api'

import { useWalletAccount } from './use-wallet-account'

export function useWalletUser() {
  const wallet = useWalletAccount()
  const ensureUser = useMutation(api.users.store)
  const currentUser = useQuery(
    api.users.currentUser,
    wallet.address ? { address: wallet.address } : 'skip'
  )
  const attemptedRef = useRef(false)

  useEffect(() => {
    if (!wallet.address) {
      attemptedRef.current = false
      return
    }
    if (typeof currentUser === 'undefined') {
      return
    }
    if (currentUser === null && !attemptedRef.current) {
      attemptedRef.current = true
      ensureUser({ address: wallet.address }).catch(error => {
        console.warn('[wallet-user] failed to persist user', error)
        attemptedRef.current = false
      })
    }
    if (currentUser) {
      attemptedRef.current = false
    }
  }, [wallet.address, currentUser, ensureUser])

  const isEnsuringUser =
    Boolean(wallet.address) &&
    (typeof currentUser === 'undefined' || currentUser === null)
  const isUserReady = !wallet.address || Boolean(currentUser)

  return useMemo(
    () => ({
      ...wallet,
      user: currentUser ?? null,
      isEnsuringUser,
      isUserReady
    }),
    [currentUser, isEnsuringUser, isUserReady, wallet]
  )
}
