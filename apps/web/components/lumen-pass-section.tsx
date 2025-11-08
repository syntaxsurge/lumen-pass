'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import { ArrowRight, ShieldCheck } from 'lucide-react'
import { useMemo } from 'react'

import { useStellarWallet } from '@/hooks/use-stellar-wallet'
import { formatXlm } from '@/lib/stellar/format'
import {
  fetchLumenPassConfig,
  fetchLumenPassPrice,
  fetchMembershipState,
  subscribeToLumenPass
} from '@/lib/stellar/lumen-pass-service'

import styles from './lumen-pass-section.module.css'

function formatExpiry(expiresAtMs: number | null) {
  if (!expiresAtMs) return 'Never purchased'
  if (expiresAtMs < Date.now()) return 'Expired'
  return formatDistanceToNow(expiresAtMs, { addSuffix: true })
}

export function LumenPassSection() {
  const wallet = useStellarWallet()
  const queryClient = useQueryClient()

  const configQuery = useQuery({
    queryKey: ['lumenpass', 'config'],
    queryFn: fetchLumenPassConfig
  })

  const priceQuery = useQuery({
    queryKey: ['lumenpass', 'price'],
    queryFn: fetchLumenPassPrice
  })

  const membershipQuery = useQuery({
    queryKey: ['lumenpass', 'membership', wallet.address],
    queryFn: () => fetchMembershipState(wallet.address as string),
    enabled: Boolean(wallet.address)
  })

  const subscribeMutation = useMutation({
    mutationFn: async () => {
      if (!wallet.address || !wallet.signTransaction) {
        throw new Error('Connect a Stellar wallet first.')
      }
      const tx = await subscribeToLumenPass({
        publicKey: wallet.address,
        signTransaction: wallet.signTransaction
      })
      const { result } = await tx.signAndSend()
      await queryClient.invalidateQueries({
        queryKey: ['lumenpass', 'membership', wallet.address]
      })
      return result
    }
  })

  const durationDays = useMemo(() => {
    const ledgers = configQuery.data?.duration_ledgers ?? 0
    if (!ledgers) return null
    const seconds = ledgers * 5
    return Math.max(1, Math.round(seconds / 86400))
  }, [configQuery.data?.duration_ledgers])

  const priceDisplay = useMemo(() => {
    if (priceQuery.isLoading || !priceQuery.data) return 'Loading…'
    return `${formatXlm(priceQuery.data)} XLM`
  }, [priceQuery.data, priceQuery.isLoading])

  const membershipStatus = useMemo(() => {
    if (!wallet.isConnected) return 'Connect to check access'
    if (membershipQuery.isLoading) return 'Checking membership…'
    if (!membershipQuery.data?.isActive) return 'Not an active member yet'
    return `Active • renews ${formatExpiry(membershipQuery.data.expiresAtMs)}`
  }, [membershipQuery.data, membershipQuery.isLoading, wallet.isConnected])

  const handleSubscribe = () => {
    if (!wallet.isConnected) {
      wallet.connect()
      return
    }
    subscribeMutation.mutate()
  }

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <div>
          <p className={styles.kicker}>LumenPass Access</p>
          <h2>Invoke the contract directly from the browser</h2>
          <p className={styles.muted}>
            This UI calls the `subscribe` entrypoint generated from the Rust Soroban contract in
            /contracts/lumen-pass. Wallets Kit signs the transaction and submits it to your chosen
            network.
          </p>
        </div>
      </div>

      <div className={styles.stats}>
        <article>
          <span>Price</span>
          <strong>{priceDisplay}</strong>
          <small>Collected via the Stellar Asset Contract (native XLM)</small>
        </article>
        <article>
          <span>Duration</span>
          <strong>
            {durationDays ? `${durationDays} day${durationDays > 1 ? 's' : ''}` : 'Loading…'}
          </strong>
          <small>Ledger-based access window from contract config</small>
        </article>
        <article>
          <span>Status</span>
          <strong>{membershipStatus}</strong>
          <small>Based on wallet membership lookup</small>
        </article>
      </div>

      <div className={styles.actions}>
        <button
          type='button'
          className={styles.primary}
          onClick={handleSubscribe}
          disabled={subscribeMutation.isPending || priceQuery.isLoading}
        >
          <ShieldCheck size={18} />
          {wallet.isConnected ? 'Activate membership' : 'Connect Stellar wallet'}
          <ArrowRight size={16} />
        </button>
        {wallet.isConnected && (
          <button type='button' className={styles.secondary} onClick={wallet.disconnect}>
            Disconnect
          </button>
        )}
      </div>
    </section>
  )
}
