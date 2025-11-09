'use client'

const RPC_CARDS = [
  {
    name: 'Stellar Testnet RPC',
    description: 'Soroban RPC hosted by the Stellar Dev Foundation.',
    explorerUrl: 'https://horizon-testnet.stellar.org',
    status: 'Operational',
    latency: '<250ms'
  },
  {
    name: 'Quickstart (Docker)',
    description: 'Local quickstart with --enable-soroban-rpc.',
    explorerUrl: 'http://localhost:8000',
    status: 'Operational',
    latency: '<20ms'
  }
] as const

const ORACLE_CARDS = [
  {
    name: 'Pyth XLM/USD',
    description: 'Updated every few seconds; feeds UI conversions.',
    freshness: 'Fresh'
  },
  {
    name: 'Pyth BTC/USD',
    description: 'Used for showcase savings goals and analytics.',
    freshness: 'Fresh'
  }
] as const

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
  return (
    <div className='space-y-8'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h2 className='text-xl font-semibold text-foreground'>
            LumenPass infrastructure
          </h2>
          <p className='text-sm text-muted-foreground'>
            Quick snapshot of the RPC endpoints and oracle feeds powering the
            dashboard.
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
