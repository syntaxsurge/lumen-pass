'use client'

import { useMemo, useState } from 'react'

import { useMutation, useQuery } from 'convex/react'
import { ArrowUpRight, ShoppingCart, Sparkles, XCircle } from 'lucide-react'
import { Client as MarketplaceClient } from 'marketplace'
import { toast } from 'sonner'

import { LoadingIndicator } from '@/components/feedback/loading-indicator'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { api } from '@/convex/_generated/api'
import type { Doc } from '@/convex/_generated/dataModel'
import { useStellarWallet } from '@/hooks/use-stellar-wallet'
import { useWalletAccount } from '@/hooks/use-wallet-account'
import {
  SETTLEMENT_TOKEN_SYMBOL,
  getMarketplaceContractAddress,
  getNativeAssetContractAddress
} from '@/lib/config'
import {
  formatSettlementToken,
  parseSettlementTokenAmount
} from '@/lib/settlement-token'
import {
  STELLAR_NETWORK_PASSPHRASE,
  STELLAR_RPC_URL
} from '@/lib/stellar/config'
import { formatTimestampRelative } from '@/lib/time'

const LIST_COOLDOWN_MS = 60_000
const CANCEL_COOLDOWN_MS = 30_000
const DEFAULT_LISTING_DURATION_MS = 1000 * 60 * 60 * 24 * 3
const TRANSFER_COOLDOWN_MS = 1000 * 60 * 60 * 24

type ListingFormState = { id: string; price: string }
type ExpiryFilter = 'any' | '7d' | '30d' | 'no-expiry'
type Filters = { search: string; expiry: ExpiryFilter }

const filterOptions: { label: string; value: ExpiryFilter }[] = [
  { label: 'Any expiration', value: 'any' },
  { label: 'Ends within 7 days', value: '7d' },
  { label: 'Ends within 30 days', value: '30d' },
  { label: 'No expiry', value: 'no-expiry' }
]

function useMarketplaceClient(
  publicKey?: string,
  signTransaction?: (xdr: string) => Promise<string>
) {
  return useMemo(() => {
    const contractId = getMarketplaceContractAddress()
    if (!contractId || !publicKey || !signTransaction) return null
    return new MarketplaceClient({
      contractId,
      rpcUrl: STELLAR_RPC_URL,
      networkPassphrase: STELLAR_NETWORK_PASSPHRASE,
      publicKey,
      signTransaction
    })
  }, [publicKey, signTransaction])
}

type MarketplaceListingDoc = Doc<'marketplaceListings'>
type EnrichedListing = MarketplaceListingDoc & { expiresAt: number | null }

function decorateListing(listing: MarketplaceListingDoc): EnrichedListing {
  const expiresAt = listing.updatedAt
    ? listing.updatedAt + DEFAULT_LISTING_DURATION_MS
    : null
  return { ...listing, expiresAt }
}

function formatCooldown(ms: number) {
  if (ms <= 0) return null
  const seconds = Math.ceil(ms / 1000)
  if (seconds < 60) return `${seconds}s remaining`
  const minutes = Math.ceil(seconds / 60)
  return `${minutes}m remaining`
}

function shorten(value?: string) {
  if (!value) return ''
  if (value.length <= 10) return value
  return `${value.slice(0, 6)}…${value.slice(-4)}`
}

export default function MarketplacePage() {
  const { address } = useWalletAccount()
  const listings = useQuery(api.marketplace.listActive, {})
  const myListings = useQuery(
    api.marketplace.listMine,
    address ? { ownerAddress: address } : 'skip'
  )
  const createListing = useMutation(api.marketplace.createListing)
  const cancelListing = useMutation(api.marketplace.cancelListing)
  const recordTx = useMutation(api.marketplace.recordTx)
  const stats = useQuery(
    api.marketplace.getUserStats,
    address ? { ownerAddress: address } : 'skip'
  )

  const [filters, setFilters] = useState<Filters>({
    search: '',
    expiry: 'any'
  })
  const [listDialogOpen, setListDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const wallet = useStellarWallet()
  const normalizedSigner = useMemo<
    ((xdr: string) => Promise<string>) | undefined
  >(() => {
    if (!wallet.signTransaction) return undefined
    return async (xdr: string) => {
      const raw = await wallet.signTransaction!(xdr)
      if (typeof raw === 'string') return raw
      const obj = raw as any
      const candidate =
        obj?.signedTxXdr ??
        obj?.signedXDR ??
        obj?.signed_xdr ??
        obj?.envelope_xdr ??
        obj?.signedTx ??
        obj?.tx ??
        obj?.xdr
      if (typeof candidate !== 'string')
        throw new Error('Wallet returned no signed XDR')
      return candidate
    }
  }, [wallet.signTransaction])

  const client = useMarketplaceClient(
    wallet.publicKey ?? undefined,
    normalizedSigner
  )

  const decoratedListings = useMemo<EnrichedListing[]>(
    () => (listings ?? []).map(decorateListing),
    [listings]
  )
  const myActiveListings = useMemo(
    () => (myListings ?? []).filter(entry => entry.active),
    [myListings]
  )

  const filteredListings = useMemo(() => {
    const term = filters.search.trim().toLowerCase()
    const now = Date.now()
    return decoratedListings.filter(entry => {
      const matchesSearch =
        !term ||
        entry.listingId.toLowerCase().includes(term) ||
        formatSettlementToken(BigInt(entry.price)).toLowerCase().includes(term)
      if (!matchesSearch) return false
      if (filters.expiry === 'no-expiry') return true
      if (filters.expiry === 'any') return true
      const windowMs =
        filters.expiry === '7d'
          ? 7 * 86_400 * 1000
          : filters.expiry === '30d'
            ? 30 * 86_400 * 1000
            : null
      if (!windowMs || !entry.expiresAt) return true
      return entry.expiresAt > now && entry.expiresAt - now <= windowMs
    })
  }, [decoratedListings, filters])

  const listCooldownRemaining = stats?.lastListAt
    ? Math.max(0, LIST_COOLDOWN_MS - (Date.now() - stats.lastListAt))
    : 0
  const cancelCooldownRemaining = stats?.lastCancelAt
    ? Math.max(0, CANCEL_COOLDOWN_MS - (Date.now() - stats.lastCancelAt))
    : 0
  const transferCooldownRemaining = stats?.lastBuyAt
    ? Math.max(0, TRANSFER_COOLDOWN_MS - (Date.now() - stats.lastBuyAt))
    : 0

  const heroCanList = Boolean(
    address &&
      client &&
      listCooldownRemaining === 0 &&
      transferCooldownRemaining === 0
  )

  const listContract = getMarketplaceContractAddress()

  const onCreate = async (values: ListingFormState) => {
    if (!address) {
      toast.error('Connect your wallet to list')
      return
    }
    if (!client) {
      toast.error('Wallet not ready')
      return
    }
    if (!values.id || !values.price) {
      toast.error('Provide a listing id and price')
      return
    }
    if (stats?.lastListAt && Date.now() - stats.lastListAt < LIST_COOLDOWN_MS) {
      const secs = Math.ceil(
        (LIST_COOLDOWN_MS - (Date.now() - stats.lastListAt)) / 1000
      )
      toast.error(`Please wait ${secs}s before creating another listing.`)
      return
    }
    if (
      stats?.lastBuyAt &&
      Date.now() - stats.lastBuyAt < TRANSFER_COOLDOWN_MS
    ) {
      const hours = Math.ceil(
        (TRANSFER_COOLDOWN_MS - (Date.now() - stats.lastBuyAt)) / 1000 / 60 / 60
      )
      toast.error(
        `Transfer cooldown active. Try again in ~${hours}h after purchasing.`
      )
      return
    }
    setIsSubmitting(true)
    const price = parseSettlementTokenAmount(values.price)
    const id = BigInt(values.id)
    try {
      const tx = await client.list({ id, seller: address, price })
      const { hash } = await tx.signAndSend()
      await createListing({
        ownerAddress: address,
        listingId: id.toString(),
        price: price.toString(),
        txHash: hash
      })
      toast.success('Listing created')
      setListDialogOpen(false)
    } catch (e) {
      console.error(e)
      toast.error(e instanceof Error ? e.message : 'Failed to list')
    } finally {
      setIsSubmitting(false)
    }
  }

  const onBuy = async (entry: MarketplaceListingDoc) => {
    if (!address) return toast.error('Connect your wallet to buy')
    if (!client) return toast.error('Wallet not ready')
    try {
      const token = getNativeAssetContractAddress()
      const tx = await client.buy({
        token,
        id: BigInt(entry.listingId),
        buyer: address
      })
      const { hash } = await tx.signAndSend()
      await recordTx({
        listingId: entry.listingId,
        txHash: hash,
        buyerAddress: address
      })
      toast.success('Purchased')
    } catch (e) {
      console.error(e)
      toast.error(e instanceof Error ? e.message : 'Failed to buy')
    }
  }

  const onCancel = async (entry: MarketplaceListingDoc) => {
    if (!address) return toast.error('Connect your wallet to cancel')
    if (!client) return toast.error('Wallet not ready')
    if (
      stats?.lastCancelAt &&
      Date.now() - stats.lastCancelAt < CANCEL_COOLDOWN_MS
    ) {
      const secs = Math.ceil(
        (CANCEL_COOLDOWN_MS - (Date.now() - stats.lastCancelAt)) / 1000
      )
      return toast.error(`Please wait ${secs}s before canceling again.`)
    }
    try {
      const tx = await client.cancel({
        id: BigInt(entry.listingId),
        seller: address
      })
      const { hash } = await tx.signAndSend()
      await cancelListing({
        ownerAddress: address,
        listingId: entry.listingId,
        txHash: hash
      })
      toast.success('Listing canceled')
    } catch (e) {
      console.error(e)
      toast.error(e instanceof Error ? e.message : 'Failed to cancel')
    }
  }

  const isLoading = !listings

  return (
    <div className='relative min-h-screen overflow-hidden bg-gradient-to-br from-background via-background to-muted/20'>
      <div className='pointer-events-none absolute inset-0 overflow-hidden'>
        <div className='absolute -left-12 top-0 h-96 w-96 rounded-full bg-primary/5 blur-3xl' />
        <div className='absolute -right-12 top-1/3 h-80 w-80 rounded-full bg-accent/5 blur-3xl' />
        <div className='absolute bottom-0 left-1/2 h-72 w-72 rounded-full bg-primary/5 blur-3xl' />
      </div>
      <section className='relative mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 py-12'>
        <Hero
          listingCount={decoratedListings.length}
          canList={heroCanList}
          onList={() => {
            if (!address) {
              toast.error('Connect your wallet to list')
              return
            }
            if (!client) {
              toast.error('Wallet not ready')
              return
            }
            setListDialogOpen(true)
          }}
        />

        <div className='flex flex-col gap-8 lg:flex-row'>
          <aside className='w-full max-w-xs flex-shrink-0 space-y-6 rounded-xl border border-border/50 bg-card/80 p-6 shadow-lg backdrop-blur-sm'>
            <FilterControls filters={filters} onChange={setFilters} />
            <Separator className='bg-border/50' />
            <div className='space-y-4 rounded-lg bg-muted/30 p-4'>
              <div>
                <p className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
                  Settlement token
                </p>
                <p className='mt-1 text-2xl font-bold text-foreground'>
                  {SETTLEMENT_TOKEN_SYMBOL}
                </p>
                <p className='mt-1 text-xs text-muted-foreground'>
                  Listings settle to your Stellar wallet instantly.
                </p>
              </div>
              <div>
                <p className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
                  Marketplace contract
                </p>
                <p className='mt-1 text-sm font-semibold text-foreground'>
                  {listContract ? shorten(listContract) : 'Not configured'}
                </p>
                <p className='text-xs text-muted-foreground'>
                  Configure via `NEXT_PUBLIC_MARKETPLACE_CONTRACT_ID`.
                </p>
              </div>
            </div>
          </aside>

          <main className='flex-1 space-y-8'>
            <StatsGrid
              activeCount={decoratedListings.length}
              myCount={myActiveListings.length}
              lastUpdated={decoratedListings[0]?.updatedAt}
            />

            {transferCooldownRemaining > 0 && (
              <div className='rounded-2xl border border-amber-500/40 bg-amber-500/10 p-5 text-amber-900 dark:border-amber-300/40 dark:bg-amber-400/10 dark:text-amber-100'>
                <p className='text-sm font-semibold uppercase tracking-wider'>
                  Transfer cooldown active
                </p>
                <p className='mt-1 text-base'>
                  You recently purchased a listing. You can create a new listing
                  once the 24h cooldown ends (
                  {formatCooldown(transferCooldownRemaining) ?? 'soon'}).
                </p>
              </div>
            )}

            {address ? (
              <MyListingsPanel
                listings={myActiveListings}
                onCancel={onCancel}
                cancelCooldownMs={cancelCooldownRemaining}
              />
            ) : (
              <div className='rounded-xl border border-border/50 bg-card/70 p-6 text-sm text-muted-foreground'>
                Connect your Stellar wallet to manage or list items you own.
              </div>
            )}

            {isLoading ? (
              <div className='rounded-xl border border-border/50 bg-card/60'>
                <LoadingIndicator />
              </div>
            ) : filteredListings.length === 0 ? (
              <div className='rounded-xl border border-border/50 bg-card/60 py-16 text-center'>
                <p className='text-sm text-muted-foreground'>
                  No listings match your filters. Try broadening your search.
                </p>
              </div>
            ) : (
              <div className='grid gap-6 lg:grid-cols-2'>
                {filteredListings.map(entry => (
                  <ListingCard
                    key={entry._id}
                    listing={entry}
                    onBuy={() => onBuy(entry)}
                    isMine={Boolean(
                      myActiveListings?.some(item => item._id === entry._id)
                    )}
                    onCancel={() => onCancel(entry)}
                    cancelCooldownMs={cancelCooldownRemaining}
                  />
                ))}
              </div>
            )}

            {decoratedListings.length > 0 && (
              <LiveListings listings={decoratedListings} />
            )}
          </main>
        </div>
      </section>
      <ListDialog
        open={listDialogOpen}
        onOpenChange={setListDialogOpen}
        onSubmit={onCreate}
        isSubmitting={isSubmitting}
        cooldownMs={listCooldownRemaining}
        transferCooldownMs={transferCooldownRemaining}
        walletReady={Boolean(address)}
        clientReady={Boolean(client)}
      />
    </div>
  )
}

function Hero({
  listingCount,
  canList,
  onList
}: {
  listingCount: number
  canList: boolean
  onList: () => void
}) {
  return (
    <div className='relative overflow-hidden rounded-2xl border border-border/30 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-10 py-16 text-white shadow-2xl md:px-14'>
      <div className='absolute -right-12 top-12 h-72 w-72 rounded-full bg-primary/20 blur-3xl' />
      <div className='absolute -bottom-12 left-16 h-64 w-64 rounded-full bg-accent/20 blur-3xl' />
      <div className='relative space-y-6'>
        <div className='inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 backdrop-blur-sm'>
          <div className='h-2 w-2 animate-pulse rounded-full bg-primary' />
          <p className='text-xs font-semibold uppercase tracking-wider text-white/90'>
            LumenPass Marketplace
          </p>
        </div>
        <h1 className='text-5xl font-bold leading-tight sm:text-6xl'>
          Discover & Trade
          <br />
          Wallet-Native{' '}
          <span className='bg-gradient-to-r from-brand-teal to-accent bg-clip-text text-transparent drop-shadow-sm'>
            Memberships
          </span>
        </h1>
        <p className='max-w-2xl text-lg leading-relaxed text-slate-300'>
          List new passes, browse live listings, and settle every trade in XLM.
          Cooldown-aware controls keep secondary sales predictable.
        </p>
        <div className='flex flex-wrap items-center gap-4 pt-4'>
          <Button
            onClick={onList}
            disabled={!canList}
            className='h-12 px-8 font-semibold'
            size='lg'
          >
            List Your Membership
          </Button>
          {!canList && (
            <p className='text-sm text-slate-300'>
              Connect your wallet to start listing
            </p>
          )}
          <div className='rounded-lg bg-white/10 px-4 py-2 text-left text-slate-200/90'>
            <p className='text-xs font-semibold uppercase tracking-wider text-white/70'>
              Live Listings
            </p>
            <p className='text-xl font-bold text-white'>
              {listingCount.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function FilterControls({
  filters,
  onChange
}: {
  filters: Filters
  onChange: (next: Filters) => void
}) {
  return (
    <div className='space-y-5'>
      <div>
        <h3 className='mb-3 text-sm font-bold text-foreground'>Search</h3>
        <Input
          id='marketplace-search'
          placeholder='Search listings or price...'
          value={filters.search}
          onChange={event =>
            onChange({ ...filters, search: event.target.value })
          }
          className='h-11'
        />
      </div>
      <div className='space-y-3'>
        <h3 className='text-sm font-bold text-foreground'>
          Listing Expiration
        </h3>
        <Select
          value={filters.expiry}
          onValueChange={value =>
            onChange({ ...filters, expiry: value as ExpiryFilter })
          }
        >
          <SelectTrigger id='marketplace-expiry' className='h-11'>
            <SelectValue placeholder='Any expiration' />
          </SelectTrigger>
          <SelectContent>
            {filterOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className='text-xs leading-relaxed text-muted-foreground'>
          Filter live listings by their remaining duration window.
        </p>
      </div>
    </div>
  )
}

function StatsGrid({
  activeCount,
  myCount,
  lastUpdated
}: {
  activeCount: number
  myCount: number
  lastUpdated?: number
}) {
  return (
    <div className='grid gap-4 rounded-2xl border border-border/40 bg-card/80 p-6 shadow-lg backdrop-blur-sm sm:grid-cols-3'>
      <StatItem label='Active listings' value={activeCount.toLocaleString()} />
      <StatItem label='My listings live' value={myCount.toLocaleString()} />
      <StatItem
        label='Last update'
        value={
          lastUpdated ? formatTimestampRelative(lastUpdated) : 'Awaiting data'
        }
      />
    </div>
  )
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
        {label}
      </dt>
      <dd className='mt-1 text-2xl font-bold text-foreground'>{value}</dd>
    </div>
  )
}

function MyListingsPanel({
  listings,
  onCancel,
  cancelCooldownMs
}: {
  listings: MarketplaceListingDoc[]
  onCancel: (entry: MarketplaceListingDoc) => void
  cancelCooldownMs: number
}) {
  if (!listings.length) {
    return (
      <div className='rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-6 text-sm text-muted-foreground'>
        You have not listed anything yet. Create a listing to see it here.
      </div>
    )
  }

  const cooldownLabel = formatCooldown(cancelCooldownMs)

  return (
    <div className='space-y-4 rounded-2xl border border-border/60 bg-card/80 p-6 shadow-lg backdrop-blur-sm'>
      <div className='flex items-center justify-between'>
        <div>
          <p className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
            My live listings
          </p>
          <h3 className='text-xl font-bold text-foreground'>
            {listings.length} active
          </h3>
        </div>
        <Sparkles className='h-5 w-5 text-primary' />
      </div>
      <div className='grid gap-4 sm:grid-cols-2'>
        {listings.map(item => (
          <div
            key={item._id}
            className='group rounded-xl border border-border/40 bg-muted/30 p-4 transition-all hover:border-primary/60 hover:bg-muted/50'
          >
            <div className='flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
              <span>Listing #{item.listingId}</span>
              <span>{formatTimestampRelative(item.updatedAt)}</span>
            </div>
            <p className='mt-2 text-2xl font-bold text-foreground'>
              {formatSettlementToken(BigInt(item.price))}
            </p>
            <p className='text-xs text-muted-foreground'>Settle in XLM</p>
            <div className='mt-3 flex justify-end'>
              <Button
                size='sm'
                variant='outline'
                onClick={() => onCancel(item)}
                disabled={cancelCooldownMs > 0}
                className='gap-2'
              >
                <XCircle className='h-4 w-4' />
                Cancel
              </Button>
            </div>
          </div>
        ))}
      </div>
      {cooldownLabel && (
        <p className='text-xs text-muted-foreground'>
          Cancellation cooldown active — {cooldownLabel}
        </p>
      )}
    </div>
  )
}

function ListingCard({
  listing,
  onBuy,
  isMine,
  onCancel,
  cancelCooldownMs
}: {
  listing: EnrichedListing
  onBuy: () => void
  isMine: boolean
  onCancel: () => void
  cancelCooldownMs: number
}) {
  const expiresLabel = listing.expiresAt
    ? formatTimestampRelative(listing.expiresAt)
    : 'No expiry'
  const cooldownLabel = formatCooldown(cancelCooldownMs)

  return (
    <div className='flex flex-col overflow-hidden rounded-2xl border border-border/50 bg-card/80 shadow-lg backdrop-blur-xl'>
      <div className='border-b border-border/40 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-5 py-4'>
        <div className='flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-white/70'>
          <span>Listing #{listing.listingId}</span>
          <span>{isMine ? 'My listing' : 'Secondary'}</span>
        </div>
        <p className='mt-2 text-3xl font-bold text-white'>
          {formatSettlementToken(BigInt(listing.price))}
        </p>
        <p className='text-xs text-slate-300'>Expires {expiresLabel}</p>
      </div>
      <div className='flex flex-1 flex-col gap-4 p-5'>
        <div className='grid grid-cols-2 gap-3 text-sm'>
          <div>
            <p className='text-xs uppercase tracking-wider text-muted-foreground'>
              Listed
            </p>
            <p className='font-semibold text-foreground'>
              {formatTimestampRelative(listing.createdAt ?? listing.updatedAt)}
            </p>
          </div>
          <div>
            <p className='text-xs uppercase tracking-wider text-muted-foreground'>
              Last updated
            </p>
            <p className='font-semibold text-foreground'>
              {formatTimestampRelative(listing.updatedAt)}
            </p>
          </div>
        </div>
        <div className='mt-auto grid grid-cols-2 gap-2'>
          <Button className='w-full gap-2' onClick={onBuy}>
            <ShoppingCart className='h-4 w-4' />
            Buy now
          </Button>
          {isMine ? (
            <Button
              className='w-full gap-2'
              variant='outline'
              onClick={onCancel}
              disabled={cancelCooldownMs > 0}
            >
              <XCircle className='h-4 w-4' />
              Cancel
            </Button>
          ) : (
            <Button className='w-full gap-2' variant='secondary'>
              <ArrowUpRight className='h-4 w-4' />
              Details
            </Button>
          )}
        </div>
        {isMine && cooldownLabel && (
          <p className='text-xs text-muted-foreground'>{cooldownLabel}</p>
        )}
      </div>
    </div>
  )
}

function LiveListings({ listings }: { listings: EnrichedListing[] }) {
  const ordered = [...listings].sort((a, b) => b.updatedAt - a.updatedAt)

  return (
    <div className='space-y-5 rounded-2xl border border-border/50 bg-card/80 p-6 shadow-lg backdrop-blur-sm'>
      <div>
        <h3 className='text-xl font-bold text-foreground'>Live Market</h3>
        <p className='mt-1 text-sm text-muted-foreground'>
          Secondary opportunities across every creator.
        </p>
      </div>
      <ScrollArea className='h-[360px] pr-3'>
        <div className='space-y-3'>
          {ordered.map(entry => (
            <div
              key={entry._id}
              className='group rounded-lg border border-border/30 bg-muted/20 p-4 transition-colors hover:bg-muted/40'
            >
              <div className='flex items-start justify-between gap-3'>
                <div>
                  <p className='font-semibold text-foreground'>
                    Listing #{entry.listingId}
                  </p>
                  <p className='text-xs text-muted-foreground'>
                    Listed {formatTimestampRelative(entry.updatedAt)}
                  </p>
                  <p className='text-xs text-muted-foreground'>
                    Expires{' '}
                    {entry.expiresAt
                      ? formatTimestampRelative(entry.expiresAt)
                      : 'No expiry'}
                  </p>
                </div>
                <div className='rounded-lg bg-primary/10 px-3 py-2 text-right'>
                  <p className='text-xs font-medium text-muted-foreground'>
                    Price
                  </p>
                  <p className='text-lg font-bold text-foreground'>
                    {formatSettlementToken(BigInt(entry.price))}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

function ListDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  cooldownMs,
  transferCooldownMs,
  walletReady,
  clientReady
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: ListingFormState) => Promise<void>
  isSubmitting: boolean
  cooldownMs: number
  transferCooldownMs: number
  walletReady: boolean
  clientReady: boolean
}) {
  const [form, setForm] = useState<ListingFormState>({ id: '', price: '' })

  const cooldownLabel = formatCooldown(cooldownMs)
  const transferCooldownLabel = formatCooldown(transferCooldownMs)
  const transferReady = transferCooldownMs === 0
  const disabledReason = (() => {
    if (!walletReady) return 'Connect your wallet to list.'
    if (!clientReady) return 'Wallet is preparing signing permissions.'
    if (transferCooldownMs > 0) {
      return (
        transferCooldownLabel ??
        'Transfer cooldown active. Please wait before listing.'
      )
    }
    if (cooldownMs > 0) return cooldownLabel ?? 'Cooldown active.'
    return null
  })()

  const canSubmit =
    walletReady &&
    clientReady &&
    cooldownMs === 0 &&
    transferCooldownMs === 0 &&
    form.id &&
    form.price

  return (
    <Dialog
      open={open}
      onOpenChange={value => {
        if (!value) {
          setForm({ id: '', price: '' })
        }
        onOpenChange(value)
      }}
    >
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>List a membership</DialogTitle>
          <DialogDescription>
            Set a listing id and price. Trades settle in{' '}
            {SETTLEMENT_TOKEN_SYMBOL}.
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-4'>
          <div className='rounded-2xl border border-border/50 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 text-white shadow-inner'>
            <div className='flex items-center justify-between gap-4'>
              <div>
                <p className='text-xs font-semibold uppercase tracking-wider text-white/70'>
                  Transfer status
                </p>
                <p className='text-xl font-bold'>
                  {transferReady ? 'Ready to list' : 'Cooldown active'}
                </p>
                <p className='text-sm text-white/80'>
                  {transferReady
                    ? 'Your latest purchase is cleared for transfer.'
                    : `Available in ${transferCooldownLabel ?? 'a moment'}.`}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                  transferReady
                    ? 'bg-emerald-400/20 text-emerald-100'
                    : 'bg-amber-400/20 text-amber-100'
                }`}
              >
                {transferReady ? 'Ready' : 'Waiting'}
              </span>
            </div>
            <div className='mt-4 grid grid-cols-3 gap-3 text-sm text-white/80'>
              <div>
                <p className='text-[0.65rem] uppercase tracking-wider text-white/60'>
                  Listing window
                </p>
                <p className='font-semibold'>≈3 days</p>
              </div>
              <div>
                <p className='text-[0.65rem] uppercase tracking-wider text-white/60'>
                  Cooldown buffer
                </p>
                <p className='font-semibold'>24 hours</p>
              </div>
              <div>
                <p className='text-[0.65rem] uppercase tracking-wider text-white/60'>
                  Settlement asset
                </p>
                <p className='font-semibold'>{SETTLEMENT_TOKEN_SYMBOL}</p>
              </div>
            </div>
          </div>
          <div className='rounded-2xl bg-muted/40 p-4 text-sm text-muted-foreground'>
            Listings remain live for ~3 days before automatically expiring.
            Cooldowns prevent spam and keep on-chain fees predictable across the
            marketplace.
          </div>
          <div className='space-y-2'>
            <Label htmlFor='listing-id'>Listing ID (uint)</Label>
            <Input
              id='listing-id'
              placeholder='e.g. 1'
              value={form.id}
              onChange={event =>
                setForm({ ...form, id: event.target.value.trim() })
              }
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='listing-price'>
              Price ({SETTLEMENT_TOKEN_SYMBOL})
            </Label>
            <Input
              id='listing-price'
              placeholder='0.00'
              value={form.price}
              type='number'
              min='0'
              step='0.000001'
              onChange={event =>
                setForm({ ...form, price: event.target.value.trim() })
              }
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type='button'
            variant='ghost'
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type='button'
            onClick={() => onSubmit(form)}
            disabled={!canSubmit || isSubmitting}
          >
            {isSubmitting ? 'Listing...' : 'Create listing'}
          </Button>
        </DialogFooter>
        {transferCooldownMs > 0 ? (
          <CooldownBanner message={disabledReason ?? ''} tone='amber' />
        ) : cooldownMs > 0 ? (
          <CooldownBanner message={disabledReason ?? ''} tone='slate' />
        ) : disabledReason ? (
          <p className='pt-2 text-xs text-muted-foreground'>{disabledReason}</p>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function CooldownBanner({
  message,
  tone = 'amber'
}: {
  message?: string
  tone?: 'amber' | 'slate'
}) {
  const palette =
    tone === 'amber'
      ? {
          border: 'border-amber-500/50',
          bg: 'bg-amber-500/15',
          dot: 'bg-amber-400',
          text: 'text-amber-900 dark:text-amber-100'
        }
      : {
          border: 'border-slate-500/40',
          bg: 'bg-slate-500/10',
          dot: 'bg-slate-400',
          text: 'text-slate-900 dark:text-slate-100'
        }
  const label =
    message && message.trim().length
      ? message
      : 'Cooldown active. Please try again soon.'
  return (
    <div
      className={`mt-3 flex items-center gap-2 rounded-lg border ${palette.border} ${palette.bg} px-3 py-2 text-sm font-medium ${palette.text}`}
      role='status'
    >
      <span
        className={`h-2 w-2 rounded-full ${palette.dot}`}
        aria-hidden='true'
      />
      <span>{label}</span>
    </div>
  )
}
