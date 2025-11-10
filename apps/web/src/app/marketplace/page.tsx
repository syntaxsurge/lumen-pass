'use client'

import { useMemo, useState } from 'react'

import { useMutation, useQuery } from 'convex/react'
import { Plus, ShoppingCart, XCircle } from 'lucide-react'
import { Client as MarketplaceClient } from 'marketplace'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api } from '@/convex/_generated/api'
import type { Doc } from '@/convex/_generated/dataModel'
import { useWalletAccount } from '@/hooks/use-wallet-account'
import {
  getNativeAssetContractAddress,
  getMarketplaceContractAddress,
  SETTLEMENT_TOKEN_SYMBOL
} from '@/lib/config'
import {
  parseSettlementTokenAmount,
  formatSettlementToken
} from '@/lib/settlement-token'
import {
  STELLAR_NETWORK_PASSPHRASE,
  STELLAR_RPC_URL
} from '@/lib/stellar/config'

// @ts-ignore

type ListingForm = { id: string; price: string }

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

  const [open, setOpen] = useState(false)
  const form = useForm<ListingForm>({ defaultValues: { id: '', price: '' } })

  // Access wallet kit sign via hook

  const wallet = (
    require('@/hooks/use-stellar-wallet') as any
  ).useStellarWallet()
  const client = useMarketplaceClient(wallet.publicKey, wallet.signTransaction)

  const onCreate = async (values: ListingForm) => {
    if (!address) return toast.error('Connect your wallet to list')
    if (!client) return toast.error('Wallet not ready')
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
      setOpen(false)
      form.reset({ id: '', price: '' })
    } catch (e) {
      console.error(e)
      toast.error(e instanceof Error ? e.message : 'Failed to list')
    }
  }

  const onBuy = async (l: Doc<'marketplaceListings'>) => {
    if (!address) return toast.error('Connect your wallet to buy')
    if (!client) return toast.error('Wallet not ready')
    try {
      const token = getNativeAssetContractAddress()
      const tx = await client.buy({
        token,
        id: BigInt(l.listingId),
        buyer: address
      })
      const { hash } = await tx.signAndSend()
      await recordTx({ listingId: l.listingId, txHash: hash })
      toast.success('Purchased')
    } catch (e) {
      console.error(e)
      toast.error(e instanceof Error ? e.message : 'Failed to buy')
    }
  }

  const onCancel = async (l: Doc<'marketplaceListings'>) => {
    if (!address) return toast.error('Connect your wallet to cancel')
    if (!client) return toast.error('Wallet not ready')
    try {
      const tx = await client.cancel({
        id: BigInt(l.listingId),
        seller: address
      })
      const { hash } = await tx.signAndSend()
      await cancelListing({
        ownerAddress: address,
        listingId: l.listingId,
        txHash: hash
      })
      toast.success('Listing canceled')
    } catch (e) {
      console.error(e)
      toast.error(e instanceof Error ? e.message : 'Failed to cancel')
    }
  }

  return (
    <div className='mx-auto w-full max-w-5xl space-y-8 p-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-bold text-foreground'>Marketplace</h1>
        <Button
          type='button'
          size='sm'
          className='gap-2'
          onClick={() => setOpen(true)}
        >
          <Plus className='h-4 w-4' /> New Listing
        </Button>
      </div>

      {/* Create form */}
      {open && (
        <form
          onSubmit={form.handleSubmit(onCreate)}
          className='grid grid-cols-1 gap-3 rounded-2xl border border-border/70 bg-background/70 p-4 md:grid-cols-3'
        >
          <div>
            <label className='text-xs text-muted-foreground'>
              Listing ID (uint)
            </label>
            <Input
              placeholder='e.g. 1'
              {...form.register('id', { required: true })}
            />
          </div>
          <div>
            <label className='text-xs text-muted-foreground'>
              Price ({SETTLEMENT_TOKEN_SYMBOL})
            </label>
            <Input
              placeholder='0.00'
              {...form.register('price', { required: true })}
            />
          </div>
          <div className='flex items-end justify-end gap-2'>
            <Button
              type='button'
              variant='ghost'
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type='submit'>Create</Button>
          </div>
        </form>
      )}

      <section className='space-y-3'>
        <h2 className='text-sm font-semibold text-foreground'>
          Active Listings
        </h2>
        <div className='grid gap-3 md:grid-cols-2'>
          {(listings ?? []).map(l => (
            <div
              key={l._id}
              className='rounded-xl border border-border/70 bg-background/70 p-4'
            >
              <p className='text-sm font-medium text-foreground'>
                Listing #{l.listingId}
              </p>
              <p className='text-xs text-muted-foreground'>
                Price: {formatSettlementToken(BigInt(l.price))}
              </p>
              <div className='mt-3 flex gap-2'>
                <Button
                  type='button'
                  size='sm'
                  className='gap-2'
                  onClick={() => onBuy(l)}
                >
                  <ShoppingCart className='h-4 w-4' /> Buy
                </Button>
                {myListings?.some(m => m._id === l._id) && (
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    className='gap-2'
                    onClick={() => onCancel(l)}
                  >
                    <XCircle className='h-4 w-4' /> Cancel
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
