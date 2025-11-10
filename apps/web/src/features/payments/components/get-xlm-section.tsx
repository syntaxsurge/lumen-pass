'use client'

import Link from 'next/link'

import { ArrowUpRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { STELLAR_TESTNET_HUB_URL, SETTLEMENT_TOKEN_SYMBOL } from '@/lib/config'

export function GetXlmSection() {
  return (
    <div className='rounded-2xl border border-border/70 bg-background/70 p-6 shadow-sm'>
      <div className='space-y-4'>
        <div className='space-y-2'>
          <h2 className='text-xl font-semibold text-foreground'>
            Get {SETTLEMENT_TOKEN_SYMBOL}
          </h2>
          <p className='mt-2 max-w-2xl text-sm text-muted-foreground'>
            Use Stellar tools to fund your Testnet account with{' '}
            {SETTLEMENT_TOKEN_SYMBOL}
            before managing invoices, payouts, and goals. The link opens in a
            new tab so you can follow the on-chain flow with your connected
            wallet.
          </p>
          <p className='max-w-2xl text-sm text-muted-foreground'>
            Start from the{' '}
            <Link
              href={STELLAR_TESTNET_HUB_URL}
              target='_blank'
              rel='noreferrer noopener'
              className='font-medium text-primary underline underline-offset-4'
            >
              Stellar Laboratory
            </Link>{' '}
            and follow the guided steps to fund your account.
          </p>
          <div className='rounded-xl border border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground'>
            <p className='font-medium text-foreground'>
              Quick funding checklist
            </p>
            <ol className='mt-2 list-decimal space-y-1 pl-5'>
              <li>Connect a Stellar-compatible wallet.</li>
              <li>Create/fund a Testnet account.</li>
              <li>Get {SETTLEMENT_TOKEN_SYMBOL} to use across the app.</li>
            </ol>
          </div>
        </div>

        <div className='flex flex-col items-start gap-3 sm:flex-row'>
          <Button asChild>
            <Link
              href={STELLAR_TESTNET_HUB_URL}
              target='_blank'
              rel='noreferrer noopener'
            >
              Open Stellar Laboratory
              <ArrowUpRight className='ml-2 h-4 w-4' />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
