'use client'

import { useEffect, useMemo, useState } from 'react'

import { useMutation, useQuery } from 'convex/react'
import {
  ArrowUpRight,
  AtSign,
  Calendar,
  CheckCircle2,
  FileText,
  User,
  Wallet as WalletIcon
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { api } from '@/convex/_generated/api'
import type { Doc } from '@/convex/_generated/dataModel'
import { useStellarWallet } from '@/hooks/use-stellar-wallet'
import { SETTLEMENT_TOKEN_SYMBOL } from '@/lib/config'
import {
  parseSettlementTokenAmount,
  formatSettlementToken
} from '@/lib/settlement-token'
import { STELLAR_NETWORK_PASSPHRASE } from '@/lib/stellar/config'
import { getTransactionUrl } from '@/lib/stellar/explorer'
import { formatStroopsAsDecimal } from '@/lib/stellar/paylink-service'
import { formatTimestampRelative } from '@/lib/time'

type PayPageClientProps = {
  handle: string
  invoiceSlug?: string
  expectedAmount?: string
}

type PaidDetailItem = {
  label: string
  value: string
  icon: LucideIcon
  title?: string
}

function truncateAddress(value: string, front = 6, back = 4) {
  if (value.length <= front + back + 1) return value
  return `${value.slice(0, front)}…${value.slice(-back)}`
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
  const invoiceOwner = useQuery(
    api.users.getById,
    invoice ? { userId: invoice.ownerId } : 'skip'
  )
  const markPaid = useMutation(api.invoices.markPaid)

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

  const paidAtFormatted = useMemo(() => {
    if (!invoice?.paidAt) return null
    return formatTimestampRelative(invoice.paidAt)
  }, [invoice?.paidAt])

  const dueDateFormatted = useMemo(() => {
    if (!invoice?.dueAt) return null
    return formatTimestampRelative(invoice.dueAt)
  }, [invoice?.dueAt])

  const amountPaidDisplay = useMemo(() => {
    if (!invoice) return null
    return formatSettlementToken(BigInt(invoice.totalAmount))
  }, [invoice])

  const paymentExplorerUrl = useMemo(() => {
    if (!invoice?.paymentTxHash) return null
    return getTransactionUrl(invoice.paymentTxHash)
  }, [invoice?.paymentTxHash])

  const paidDetailItems = useMemo<PaidDetailItem[]>(() => {
    if (!invoice) return []
    const items: PaidDetailItem[] = []
    if (invoice.number) {
      items.push({
        label: 'Invoice number',
        value: invoice.number,
        icon: FileText
      })
    }
    if (paidAtFormatted) {
      items.push({ label: 'Paid', value: paidAtFormatted, icon: Calendar })
    }
    if (dueDateFormatted) {
      items.push({ label: 'Due date', value: dueDateFormatted, icon: Calendar })
    }
    if (paylink) {
      items.push({
        label: 'Pay handle',
        value: `@${paylink.handle}`,
        icon: AtSign
      })
    }
    if (invoice.customerName) {
      items.push({
        label: 'Billed to',
        value: invoice.customerName,
        icon: User
      })
    }
    if (invoice.payerAddress) {
      items.push({
        label: 'Payer wallet',
        value: truncateAddress(invoice.payerAddress),
        title: invoice.payerAddress,
        icon: WalletIcon
      })
    }
    return items
  }, [dueDateFormatted, invoice, paidAtFormatted, paylink])

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

  if (invoice && invoice.status === 'paid') {
    const paidHeroTitle =
      invoice.title ?? paylink.title ?? 'Invoice payment confirmed'

    return (
      <div className='space-y-6 rounded-3xl border border-border/70 bg-card/80 p-8 shadow-lg'>
        <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <p className='text-sm font-medium text-muted-foreground'>
              Payment for @{paylink.handle}
            </p>
            <h1 className='text-3xl font-semibold text-foreground'>
              {paidHeroTitle}
            </h1>
            {paylink.description ? (
              <p className='text-sm text-muted-foreground'>
                {paylink.description}
              </p>
            ) : null}
          </div>
          <Badge variant='secondary'>Paid</Badge>
        </div>

        <div className='rounded-3xl border border-border/70 bg-background/70 p-6'>
          <div className='relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 p-6'>
            <div className='pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/20 opacity-70 blur-3xl' />
            <div className='relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
              <div className='flex items-center gap-3'>
                <span className='flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary'>
                  <CheckCircle2 className='h-6 w-6' />
                </span>
                <div>
                  <p className='text-xs font-semibold uppercase tracking-widest text-primary'>
                    Payment complete
                  </p>
                  <h2 className='text-xl font-semibold text-foreground'>
                    {invoice.number
                      ? `Invoice #${invoice.number}`
                      : 'Receipt ready'}
                  </h2>
                </div>
              </div>
              {amountPaidDisplay ? (
                <Badge variant='outline' className='text-base font-semibold'>
                  {amountPaidDisplay}
                </Badge>
              ) : null}
            </div>
            {paidAtFormatted ? (
              <p className='relative mt-4 text-sm text-muted-foreground'>
                Paid {paidAtFormatted}
              </p>
            ) : null}
          </div>

          {paidDetailItems.length > 0 ? (
            <div className='mt-6 grid gap-4 md:grid-cols-2'>
              {paidDetailItems.map(item => {
                const Icon = item.icon
                return (
                  <div
                    key={item.label}
                    className='flex items-start gap-3 rounded-2xl border border-border/60 bg-card/80 p-4'
                  >
                    <span className='mt-1 flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary'>
                      <Icon className='h-4 w-4' />
                    </span>
                    <div>
                      <p className='text-xs uppercase tracking-wide text-muted-foreground'>
                        {item.label}
                      </p>
                      <p
                        className='mt-1 text-sm font-medium text-foreground'
                        title={item.title ?? item.value}
                      >
                        {item.value}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : null}

          {invoice.notes ? (
            <div className='mt-6 rounded-2xl border border-border/60 bg-card/80 p-4'>
              <p className='text-xs uppercase tracking-wide text-muted-foreground'>
                Notes
              </p>
              <p className='mt-2 text-sm leading-relaxed text-foreground'>
                {invoice.notes}
              </p>
            </div>
          ) : null}

          {paymentExplorerUrl ? (
            <a
              href={paymentExplorerUrl}
              target='_blank'
              rel='noreferrer'
              className='mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary underline-offset-4 hover:underline'
            >
              View transaction on Horizon
              <ArrowUpRight className='h-4 w-4' />
            </a>
          ) : null}
        </div>
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
    try {
      setSending(true)
      if (wallet.signTransaction) {
        // Prefer in-app signing with the connected Wallets Kit instance
        const { submitNativePaymentViaWallet } = await import(
          '@/lib/stellar/paylink-service'
        )
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

        if (invoice && invoiceSlug && invoiceOwner?.walletAddress) {
          try {
            const { verifyNativePayment } = await import(
              '@/lib/stellar/verify-payment'
            )
            const verification = await verifyNativePayment({
              hash: txHash,
              to: paylink.receivingAddress,
              from: wallet.address,
              amountStroops: BigInt(invoice.totalAmount),
              memoText: normalizeMemo() ?? null
            })

            if (verification.ok) {
              await markPaid({
                ownerAddress: invoiceOwner.walletAddress,
                slug: invoiceSlug,
                paymentTxHash: txHash,
                paidAt: Date.now()
              })
              toast.success(`Invoice ${invoice.number} marked as paid`)
            } else {
              console.warn('[verifyNativePayment]', verification)
              toast.warning(
                'Payment detected. Creator dashboard will sync shortly.'
              )
            }
          } catch (error) {
            console.error('[verifyNativePayment] failed', error)
            toast.warning(
              'Payment submitted. Refresh later once the creator confirms.'
            )
          }
        }
      } else {
        // Fallback to SEP-7 if no signer function is available
        const amountDecimal = formatStroopsAsDecimal(amountStroops)
        const params = new URLSearchParams()
        params.set('destination', paylink.receivingAddress)
        params.set('amount', amountDecimal)
        const memo = normalizeMemo()
        if (memo) params.set('memo', `TEXT:${memo.slice(0, 28)}`)
        params.set('network_passphrase', STELLAR_NETWORK_PASSPHRASE)
        const url = `web+stellar:pay?${params.toString()}`
        window.location.href = url
      }
    } catch (error) {
      console.error(error)
      toast.error('Unable to trigger wallet payment. Please try again.')
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
            <p className='text-sm text-muted-foreground'>
              {paylink.description}
            </p>
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
