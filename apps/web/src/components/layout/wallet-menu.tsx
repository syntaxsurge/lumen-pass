'use client'

import { Button } from '@/components/ui/button'
import { useWalletAccount } from '@/hooks/use-wallet-account'
import { summarizeAccount } from '@/lib/stellar/format'

export function WalletMenu() {
  const { address, isConnected, connect, disconnect } = useWalletAccount()

  if (!isConnected) {
    return (
      <div className='flex items-center gap-2'>
        <Button type='button' size='sm' onClick={connect}>
          Connect wallet
        </Button>
      </div>
    )
  }

  const short = summarizeAccount(address, { fallback: 'Wallet' })

  return (
    <div className='flex items-center gap-2'>
      <Button type='button' variant='outline' size='sm' disabled>
        Stellar
      </Button>
      <Button
        type='button'
        size='sm'
        onClick={disconnect}
        className='flex items-center gap-2'
      >
        <span>{short}</span>
      </Button>
    </div>
  )
}
