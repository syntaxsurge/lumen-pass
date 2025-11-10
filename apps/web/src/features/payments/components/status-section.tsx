'use client'

import {
  getBadgeContractAddress,
  getInvoiceRegistryAddress,
  getMarketplaceContractAddress,
  getMembershipContractAddress,
  getNativeAssetContractAddress,
  getRegistrarContractAddress,
  getSplitRouterContractAddress
} from '@/lib/config'
import { getContractUrl } from '@/lib/stellar/explorer'

const RPC_CARDS = [
  {
    name: 'Stellar Testnet RPC',
    description: 'Soroban RPC hosted by the Stellar Dev Foundation.',
    explorerUrl: 'https://horizon-testnet.stellar.org',
    status: 'Operational',
    latency: '<250ms'
  }
] as const

const ORACLE_CARDS = [
  {
    name: 'Pyth XLM/USD',
    description: 'Updated every few seconds; feeds UI conversions.',
    freshness: 'Fresh'
  }
] as const

type ContractCard = {
  name: string
  role: string
  contractId: string
  explorerUrl?: string | null
}

function getContractCards(): ContractCard[] {
  const registryId = getInvoiceRegistryAddress()
  const membershipId = getMembershipContractAddress()
  const marketplaceId = getMarketplaceContractAddress()
  const badgeId = getBadgeContractAddress()
  const registrarId = getRegistrarContractAddress()
  const splitRouterId = getSplitRouterContractAddress()
  const nativeAssetId = getNativeAssetContractAddress()

  const cards: ContractCard[] = [
    {
      name: 'LumenPass Membership',
      role: 'Manages paid member passes and renewals.',
      contractId: membershipId,
      explorerUrl: membershipId ? getContractUrl(membershipId) : null
    },
    {
      name: 'Membership Marketplace',
      role: 'Handles listings/transfers for secondary membership sales.',
      contractId: marketplaceId,
      explorerUrl: marketplaceId ? getContractUrl(marketplaceId) : null
    },
    {
      name: 'Registrar',
      role: 'Maps human-friendly handles to contract instances.',
      contractId: registrarId,
      explorerUrl: registrarId ? getContractUrl(registrarId) : null
    },
    {
      name: 'Badge/NFT Contract',
      role: 'Issues creator badges and classroom credentials.',
      contractId: badgeId,
      explorerUrl: badgeId ? getContractUrl(badgeId) : null
    },
    {
      name: 'Invoice Registry',
      role: 'Stores issued invoices and settlement proofs.',
      contractId: registryId,
      explorerUrl: registryId ? getContractUrl(registryId) : null
    },
    {
      name: 'Split Router',
      role: 'Splits payouts across collaborators in a single transaction.',
      contractId: splitRouterId,
      explorerUrl: splitRouterId ? getContractUrl(splitRouterId) : null
    },
    {
      name: 'Native Asset Contract',
      role: 'Soroban asset contract used for XLM transfers.',
      contractId: nativeAssetId,
      explorerUrl: nativeAssetId ? getContractUrl(nativeAssetId) : null
    }
  ]

  return cards
}

export function StatusOverviewBanner() {
  return (
    <div className='rounded-2xl border border-border bg-card/60 p-4 shadow-sm'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <p className='text-sm font-medium text-foreground'>Platform status</p>
          <p className='text-xs text-muted-foreground'>
            Stellar Testnet and the Quickstart environment are online.
          </p>
        </div>
        <span className='inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase text-emerald-600'>
          All systems go
        </span>
      </div>
    </div>
  )
}

export function StatusSection() {
  const contractCards = getContractCards()

  return (
    <div className='space-y-8'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h2 className='text-xl font-semibold text-foreground'>
            LumenPass infrastructure
          </h2>
          <p className='text-sm text-muted-foreground'>
            Quick snapshot of the RPC endpoints, smart contracts, and oracle
            feeds powering the dashboard.
          </p>
        </div>
      </div>

      <div className='space-y-3'>
        <h3 className='text-sm font-medium text-foreground'>RPC endpoints</h3>
        <div className='grid gap-4 md:grid-cols-2'>
          {RPC_CARDS.map(card => (
            <div
              key={card.name}
              className='rounded-2xl border border-border/70 bg-background/70 p-4'
            >
              <div className='flex items-center justify-between'>
                <p className='text-sm font-medium text-foreground'>
                  {card.name}
                </p>
                <span className='text-xs font-semibold text-emerald-500'>
                  {card.status}
                </span>
              </div>
              <p className='mt-2 text-sm text-muted-foreground'>
                {card.description}
              </p>
              <p className='mt-2 text-xs text-muted-foreground'>
                Latency target: {card.latency}
              </p>
              <a
                href={card.explorerUrl}
                target='_blank'
                rel='noreferrer'
                className='mt-3 inline-flex text-xs font-medium text-primary underline-offset-4 hover:underline'
              >
                Open explorer
              </a>
            </div>
          ))}
        </div>
      </div>

      <div className='space-y-3'>
        <h3 className='text-sm font-medium text-foreground'>Smart contracts</h3>
        {contractCards.length === 0 ? (
          <p className='text-xs text-muted-foreground'>
            No contract IDs configured. Set the environment variables in
            `.env`/`apps/web/.env` to populate this list.
          </p>
        ) : (
          <div className='grid gap-4 md:grid-cols-2'>
            {contractCards.map(card => (
              <div
                key={card.name}
                className='rounded-2xl border border-border/70 bg-background/70 p-4'
              >
                <div className='flex items-center justify-between'>
                  <p className='text-sm font-medium text-foreground'>
                    {card.name}
                  </p>
                </div>
                <p className='mt-1 text-xs font-mono text-muted-foreground break-all'>
                  {card.contractId || 'Not configured'}
                </p>
                <p className='mt-2 text-sm text-muted-foreground'>
                  {card.role}
                </p>
                {card.explorerUrl ? (
                  <a
                    href={card.explorerUrl}
                    target='_blank'
                    rel='noreferrer'
                    className='mt-3 inline-flex text-xs font-medium text-primary underline-offset-4 hover:underline'
                  >
                    View on Horizon
                  </a>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className='space-y-3'>
        <h3 className='text-sm font-medium text-foreground'>Oracle feeds</h3>
        <div className='grid gap-4 md:grid-cols-2'>
          {ORACLE_CARDS.map(card => (
            <div
              key={card.name}
              className='rounded-2xl border border-border/70 bg-background/70 p-4'
            >
              <div className='flex items-center justify-between'>
                <p className='text-sm font-medium text-foreground'>
                  {card.name}
                </p>
                <span className='text-xs font-semibold text-emerald-500'>
                  {card.freshness}
                </span>
              </div>
              <p className='mt-2 text-sm text-muted-foreground'>
                {card.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      <p className='text-xs text-muted-foreground'>
        These snapshots are updated manually for now. For production deployments,
        wire up the Stellar Horizon metrics API or your favourite observability
        stack.
      </p>
    </div>
  )
}
