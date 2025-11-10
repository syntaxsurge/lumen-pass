'use client'

import { useEffect, useMemo, useState } from 'react'

import { useQuery } from 'convex/react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { api } from '@/convex/_generated/api'
import type { Doc } from '@/convex/_generated/dataModel'
import { useStellarWallet } from '@/hooks/use-stellar-wallet'
import {
  parseSettlementTokenAmount,
  formatSettlementToken
} from '@/lib/settlement-token'
import {
  submitNativePaymentViaWallet,
  formatStroopsAsDecimal
} from '@/lib/stellar/paylink-service'
import { SETTLEMENT_TOKEN_SYMBOL } from '@/lib/config'
import { formatTimestampRelative } from '@/lib/time'

type PayPageClientProps = {
  handle: string
  invoiceSlug?: string
  expectedAmount?: string
}

function formatInvoiceStatus(invoice: Doc<'invoices'> | null | undefined) {
  if (!invoice) return null
  switch (invoice.status) {
    case 'paid':
      return <Badge variant='secondary'>Paid</Badge>
    case 'issued':
      return <Badge variant='outline'>Awaiting payment</Badge>
    default:
      return <Badge variant='outline'>Draft</Badge>
  }
}

export function PayPageClient({
  handle,
  invoiceSlug,
  expectedAmount
}: PayPageClientProps) {
  const wallet = useStellarWallet()
  const paylink = useQuery(api.paylinks.getByHandle, { handle })
  const invoice = useQuery(
    api.invoices.getBySlug,
    invoiceSlug ? { slug: invoiceSlug } : 'skip'
  )

  const amountLabel = useMemo(() => {
    if (invoice) return formatSettlementToken(BigInt(invoice.totalAmount))
    if (expectedAmount) {
      try {
        return formatSettlementToken(BigInt(expectedAmount))
      } catch {
        return `${expectedAmount} XLM`
      }
    }
    return 'Flexible amount'
  }, [expectedAmount, invoice])

  const derivedDefaultAmount = useMemo(() => {
    try {
      if (invoice) return formatStroopsAsDecimal(BigInt(invoice.totalAmount))
      if (expectedAmount) return formatStroopsAsDecimal(BigInt(expectedAmount))
    } catch {
      return ''
    }
    return ''
  }, [expectedAmount, invoice])

  const [amountInput, setAmountInput] = useState(derivedDefaultAmount)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (derivedDefaultAmount) {
      setAmountInput(derivedDefaultAmount)
    }
  }, [derivedDefaultAmount])

  if (paylink === undefined) {
    return (
      <div className='rounded-2xl border border-border/70 bg-card/80 p-10 text-center text-sm text-muted-foreground'>
        Loading pay handle…
      </div>
    )
  }

  if (!paylink) {
    return (
      <div className='rounded-2xl border border-dashed border-border/70 bg-muted/10 p-10 text-center text-sm text-muted-foreground'>
        This pay handle is unavailable. Double-check the link and try again.
      </div>
    )
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(paylink.receivingAddress)
      toast.success('Receiving address copied.')
    } catch (error) {
      console.error(error)
      toast.error('Unable to copy right now.')
    }
  }

  const normalizeMemo = () => {
    if (invoice?.number) return invoice.number
    if (invoiceSlug) return invoiceSlug
    return undefined
  }

  const handleWalletPay = async () => {
    if (!paylink) {
      toast.error('Pay handle unavailable.')
      return
    }
    if (!wallet.address) {
      wallet.connect()
      return
    }
    const amountStroops = (() => {
      if (invoice) {
        return BigInt(invoice.totalAmount)
      }
      if (amountInput) {
        return parseSettlementTokenAmount(amountInput)
      }
      return null
    })()
    if (!amountStroops || amountStroops <= 0n) {
      toast.error('Enter a valid amount before paying.')
      return
    }
    if (!wallet.signTransaction) {
      toast.error('Wallet must support transaction signing.')
      return
    }
    try {
      setSending(true)
      const txHash = await submitNativePaymentViaWallet({
        publicKey: wallet.address,
        destination: paylink.receivingAddress,
        amount: amountStroops,
        memo: normalizeMemo(),
        signTransaction: wallet.signTransaction
      })
      toast.success('Payment submitted on Stellar.', {
        description: txHash
      })
    } catch (error) {
      console.error(error)
      toast.error(
        error instanceof Error ? error.message : 'Unable to submit payment.'
      )
    } finally {
      setSending(false)
    }
  }

  return (
    <div className='space-y-6 rounded-3xl border border-border/70 bg-card/80 p-8 shadow-lg'>
      <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <p className='text-sm font-medium text-muted-foreground'>
            Paying @{paylink.handle}
          </p>
          <h1 className='text-3xl font-semibold text-foreground'>
            {paylink.title ?? 'Support this creator'}
          </h1>
          {paylink.description ? (
            <p className='text-sm text-muted-foreground'>{paylink.description}</p>
          ) : null}
        </div>
        {formatInvoiceStatus(invoice)}
      </div>

      <Separator />

      <div className='grid gap-4 md:grid-cols-2'>
        <div className='space-y-2 rounded-2xl border border-border/70 bg-background/70 p-4'>
          <p className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
            Amount due
          </p>
          <p className='text-2xl font-bold text-foreground'>{amountLabel}</p>
          {invoice?.dueAt ? (
            <p className='text-xs text-muted-foreground'>
              Due {formatTimestampRelative(invoice.dueAt)}
            </p>
          ) : null}
        </div>

        <div className='space-y-2 rounded-2xl border border-border/70 bg-background/70 p-4'>
          <p className='text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
            Receiving address
          </p>
          <div className='flex items-center gap-2'>
            <Input
              value={paylink.receivingAddress}
              readOnly
              className='font-mono text-sm'
            />
            <Button type='button' variant='secondary' onClick={handleCopy}>
              Copy
            </Button>
          </div>
          <p className='text-xs text-muted-foreground'>
            Send the amount above directly from your Stellar wallet. Include any
            memo the creator provided.
          </p>
        </div>
      </div>

      <div className='rounded-2xl border border-dashed border-border/70 bg-muted/10 p-4 text-sm text-muted-foreground'>
        {invoice ? (
          <p>
            After you submit payment, your creator will mark invoice{' '}
            <span className='font-semibold'>{invoice.number}</span> as paid
            inside LumenPass. Keep your transaction hash for reference.
          </p>
        ) : (
          <p>
            This pay handle does not reference a specific invoice. Send any
            amount and share your transaction hash with the creator so they can
            verify it in LumenPass.
          </p>
        )}
      </div>

      <div className='rounded-2xl border border-border/70 bg-background/70 p-4'>
        {wallet.address ? (
          <p className='text-sm text-foreground'>
            Connected as <span className='font-mono'>{wallet.address}</span>.
            Use your wallet to send the payment, then refresh this page for the
            latest status.
          </p>
        ) : (
          <Button type='button' onClick={() => wallet.connect()}>
            Connect wallet
          </Button>
        )}
      </div>

      <div className='space-y-4 rounded-2xl border border-border/70 bg-background/70 p-4'>
        <div className='flex flex-col gap-1'>
          <p className='text-sm font-semibold text-foreground'>
            Pay with your connected wallet
          </p>
          <p className='text-xs text-muted-foreground'>
            LumenPass will build a native XLM payment transaction and submit it
            through your wallet kit. Amounts include {SETTLEMENT_TOKEN_SYMBOL}{' '}
            (7 decimals).
          </p>
        </div>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
          <Input
            type='text'
            value={amountInput}
            disabled={Boolean(invoice)}
            onChange={event => setAmountInput(event.target.value)}
            placeholder={`Amount in ${SETTLEMENT_TOKEN_SYMBOL}`}
            className='sm:flex-1'
          />
          <Button
            type='button'
            onClick={handleWalletPay}
            disabled={sending}
            className='w-full sm:w-auto'
          >
            {wallet.address ? 'Pay with wallet' : 'Connect wallet'}
          </Button>
        </div>
        {invoice ? (
          <p className='text-xs text-muted-foreground'>
            Amount locked by invoice #{invoice.number}. Use your connected
            wallet to settle automatically.
          </p>
        ) : (
          <p className='text-xs text-muted-foreground'>
            Enter any XLM amount. A memo will be attached so the creator can
            reconcile the transaction.
          </p>
        )}
      </div>
    </div>
  )
}
