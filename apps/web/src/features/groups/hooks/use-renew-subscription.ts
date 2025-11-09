import { useCallback, useState } from 'react'

import { api } from '@/convex/_generated/api'
import { useApiMutation } from '@/hooks/use-api-mutation'
import { useStellarWallet } from '@/hooks/use-stellar-wallet'
import { subscribe } from '@/lib/stellar/lumen-pass-service'

import { useGroupContext } from '../context/group-context'

type RenewResult = {
  endsOn: number | null
  txHash: string | null
}

export function useRenewSubscription() {
  const { group } = useGroupContext()
  const wallet = useStellarWallet()
  const { mutate, pending: isMutating } = useApiMutation(
    api.groups.renewSubscription
  )
  const [isTransacting, setIsTransacting] = useState(false)

  const renew = useCallback(async (): Promise<RenewResult> => {
    if (!group?._id) {
      throw new Error('Group context is unavailable.')
    }
    if (!wallet.address || !wallet.signTransaction) {
      wallet.connect()
      throw new Error('Connect your wallet to renew the subscription.')
    }

    setIsTransacting(true)
    try {
      const receipt = await subscribe({
        publicKey: wallet.address,
        signTransaction: wallet.signTransaction
      })

      const result = (await mutate({
        groupId: group._id,
        ownerAddress: wallet.address,
        paymentTxHash: receipt.txHash ?? undefined
      })) as { endsOn: number } | undefined

      return {
        endsOn: result?.endsOn ?? null,
        txHash: receipt.txHash ?? null
      }
    } finally {
      setIsTransacting(false)
    }
  }, [group?._id, mutate, wallet])

  return {
    renew,
    isRenewing: isTransacting || isMutating
  }
}
