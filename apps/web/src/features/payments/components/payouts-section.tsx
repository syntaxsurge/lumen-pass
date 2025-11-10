'use client'

import { useState } from 'react'

import { useMutation, useQuery } from 'convex/react'
import { Loader2, Plus, Trash2, Send } from 'lucide-react'
import { useForm, useFieldArray } from 'react-hook-form'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { api } from '@/convex/_generated/api'
import type { Doc } from '@/convex/_generated/dataModel'
import { useStellarWallet } from '@/hooks/use-stellar-wallet'
import { useWalletAccount } from '@/hooks/use-wallet-account'
import { SETTLEMENT_TOKEN_SYMBOL } from '@/lib/config'
import { parseSettlementTokenAmount } from '@/lib/settlement-token'
import { executeSplit } from '@/lib/stellar/split-router-service'

type Recipient = { address: string; shareBps: number; label?: string }

type ScheduleForm = {
  name: string
  recipients: Recipient[]
}

export function PayoutsSection() {
  const { address } = useWalletAccount()
  const stellarWallet = useStellarWallet()
  const schedules = useQuery(
    api.payouts.listSchedules,
    address ? { ownerAddress: address } : 'skip'
  )
  const createSchedule = useMutation(api.payouts.createSchedule)
  const recordExecution = useMutation(api.payouts.recordExecution)

  const [openCreate, setOpenCreate] = useState(false)
  const [busy, setBusy] = useState(false)

  const form = useForm<ScheduleForm>({
    defaultValues: { name: '', recipients: [{ address: '', shareBps: 10000 }] }
  })
  const recipients = useFieldArray({
    control: form.control,
    name: 'recipients'
  })

  const onCreate = async (values: ScheduleForm) => {
    if (!address) return toast.error('Connect your wallet first.')
    try {
      setBusy(true)
      await createSchedule({
        ownerAddress: address,
        name: values.name,
        recipients: values.recipients
      })
      toast.success('Schedule created')
      setOpenCreate(false)
      form.reset({ name: '', recipients: [{ address: '', shareBps: 10000 }] })
    } catch (e) {
      console.error(e)
      toast.error(e instanceof Error ? e.message : 'Failed to create schedule')
    } finally {
      setBusy(false)
    }
  }

  async function execute(schedule: Doc<'payoutSchedules'>, amountStr: string) {
    if (!address) return toast.error('Connect your wallet first.')
    const amount = parseSettlementTokenAmount(amountStr)
    if (amount <= 0n) return toast.error('Enter a positive amount')
    try {
      setBusy(true)
      const signer = stellarWallet.signTransaction
      if (!signer) throw new Error('Wallet not connected')
      const recipients = schedule.recipients.map(r => ({
        address: r.address,
        shareBps: r.shareBps
      }))
      const res = await executeSplit({
        publicKey: address,
        signTransaction: signer,
        recipients,
        amount
      })
      const txHash = (res as unknown as { hash?: string })?.hash ?? ''
      await recordExecution({
        ownerAddress: address,
        scheduleId: schedule._id,
        txHash,
        totalAmount: amount.toString(),
        executedAt: Date.now()
      })
      toast.success('Payout executed')
    } catch (e) {
      console.error(e)
      toast.error(e instanceof Error ? e.message : 'Failed to execute payout')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className='space-y-8'>
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-xl font-semibold text-foreground'>
            Split payouts
          </h2>
          <p className='text-sm text-muted-foreground'>
            Distribute {SETTLEMENT_TOKEN_SYMBOL} across collaborators in one
            transaction.
          </p>
        </div>
        <Dialog open={openCreate} onOpenChange={setOpenCreate}>
          <DialogTrigger asChild>
            <Button type='button' size='sm' className='gap-2'>
              <Plus className='h-4 w-4' /> New schedule
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create payout schedule</DialogTitle>
              <DialogDescription>
                Addresses must be valid Stellar public keys. Shares must total
                10000 bps.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onCreate)}
                className='space-y-4'
              >
                <FormField
                  control={form.control}
                  name='name'
                  rules={{ required: true }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder='Revenue split' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className='space-y-3'>
                  {recipients.fields.map((f, i) => (
                    <div key={f.id} className='grid grid-cols-12 gap-2'>
                      <FormField
                        control={form.control}
                        name={`recipients.${i}.address`}
                        rules={{ required: true }}
                        render={({ field }) => (
                          <FormItem className='col-span-8'>
                            <FormLabel>Recipient (G...)</FormLabel>
                            <FormControl>
                              <Input placeholder='GABC...' {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`recipients.${i}.shareBps`}
                        rules={{ required: true, min: 0, max: 10000 }}
                        render={({ field }) => (
                          <FormItem className='col-span-3'>
                            <FormLabel>Share (bps)</FormLabel>
                            <FormControl>
                              <Input
                                type='number'
                                min={0}
                                max={10000}
                                step={1}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className='col-span-1 flex items-end'>
                        <Button
                          type='button'
                          variant='ghost'
                          size='icon'
                          onClick={() => recipients.remove(i)}
                          disabled={recipients.fields.length === 1}
                        >
                          <Trash2 className='h-4 w-4' />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={() =>
                      recipients.append({ address: '', shareBps: 0 })
                    }
                    className='gap-2'
                  >
                    <Plus className='h-4 w-4' /> Add recipient
                  </Button>
                </div>
                <DialogFooter>
                  <Button type='submit' disabled={busy}>
                    Create
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {!schedules ? (
        <div className='flex items-center justify-center gap-3 rounded-2xl border border-border/70 bg-muted/20 p-10 text-sm text-muted-foreground'>
          <Loader2 className='h-5 w-5 animate-spin text-primary' /> Loading
          schedules…
        </div>
      ) : schedules.length === 0 ? (
        <div className='rounded-2xl border border-dashed border-border/70 bg-muted/20 p-8 text-center text-sm text-muted-foreground'>
          No schedules yet. Create one to get started.
        </div>
      ) : (
        <div className='space-y-4'>
          {schedules.map(s => (
            <div
              key={s._id}
              className='rounded-2xl border border-border/70 bg-background/70 p-4'
            >
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-semibold text-foreground'>
                    {s.name}
                  </p>
                  <p className='text-xs text-muted-foreground'>
                    {s.recipients.length} recipients
                  </p>
                </div>
                <ExecuteDialog schedule={s} onExecute={execute} busy={busy} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ExecuteDialog({
  schedule,
  onExecute,
  busy
}: {
  schedule: Doc<'payoutSchedules'>
  onExecute: (s: Doc<'payoutSchedules'>, amount: string) => Promise<unknown>
  busy: boolean
}) {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const handle = async () => {
    await onExecute(schedule, amount)
    setOpen(false)
    setAmount('')
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type='button' size='sm' className='gap-2'>
          <Send className='h-4 w-4' /> Execute
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Execute payout</DialogTitle>
          <DialogDescription>
            Enter the total amount ({SETTLEMENT_TOKEN_SYMBOL}) to split across
            recipients.
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-3'>
          <div>
            <FormLabel>Total amount ({SETTLEMENT_TOKEN_SYMBOL})</FormLabel>
            <Input
              placeholder='0.00'
              value={amount}
              onChange={e => setAmount(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type='button' onClick={handle} disabled={busy}>
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
