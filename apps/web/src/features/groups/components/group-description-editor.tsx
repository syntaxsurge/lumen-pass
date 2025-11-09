'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useMutation } from 'convex/react'
import { AlertOctagon } from 'lucide-react'
import { toast } from 'sonner'

import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { useWalletAccount } from '@/hooks/use-wallet-account'

type GroupDescriptionEditorProps = {
  groupId: Id<'groups'>
  initialContent?: string
  editable?: boolean
  className?: string
}

const MAX_LENGTH = 40_000

function parseContent(raw?: string) {
  if (!raw) return undefined
  try {
    return JSON.parse(raw)
  } catch (error) {
    console.warn('Failed to parse group description', error)
    return undefined
  }
}

export function GroupDescriptionEditor({
  groupId,
  initialContent,
  editable = false,
  className
}: GroupDescriptionEditorProps) {
  const { address } = useWalletAccount()
  const updateDescription = useMutation(api.groups.updateDescription)
  const [mounted, setMounted] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  const handlePersist = useCallback(() => {
    if (!editable) return
    if (!address) return
    const value = textareaRef.current?.value ?? ''
    const serialized = JSON.stringify({ markdown: value })

    if (serialized.length > MAX_LENGTH) {
      toast.error('Description is too long. Not saved.', {
        duration: 2000,
        icon: <AlertOctagon />
      })
      return
    }

    updateDescription({
      id: groupId,
      description: serialized,
      ownerAddress: address
    }).catch(() => {
      toast.error('Unable to save changes. Please retry.')
    })
  }, [address, editable, groupId, updateDescription])

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <textarea
      ref={textareaRef}
      defaultValue={parseContent(initialContent)?.markdown ?? ''}
      onChange={handlePersist as any}
      disabled={!editable}
      className={className}
      rows={12}
      style={{
        width: '100%',
        background: 'transparent',
        color: 'inherit',
        border: '1px solid rgba(148,163,184,0.4)',
        borderRadius: 12,
        padding: 12,
        fontFamily: 'system-ui, sans-serif'
      }}
    />
  )
}
