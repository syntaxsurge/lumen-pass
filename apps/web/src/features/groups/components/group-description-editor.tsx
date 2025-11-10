'use client'

import '@blocknote/core/fonts/inter.css'
import '@blocknote/mantine/style.css'

import { useCallback, useEffect, useState } from 'react'

import { BlockNoteView } from '@blocknote/mantine'
import { useCreateBlockNote } from '@blocknote/react'
import { useMutation } from 'convex/react'
import { AlertOctagon } from 'lucide-react'
import { useTheme } from 'next-themes'
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

function isBlockNoteBlocks(value: unknown): boolean {
  if (!Array.isArray(value)) return false
  // Very light validation: array of objects with a string `type` key
  return value.every(
    (item: unknown) =>
      item !== null &&
      typeof item === 'object' &&
      typeof (item as Record<string, unknown>).type === 'string'
  )
}

function parseContent(raw?: string) {
  if (!raw) return undefined
  try {
    const parsed = JSON.parse(raw)
    // Only pass through if the stored value looks like BlockNote blocks.
    if (isBlockNoteBlocks(parsed)) return parsed
    // Older entries may store a different shape (e.g. { markdown: string }).
    // In that case, fall back to empty initial content to avoid runtime errors.
    return undefined
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
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  const editor = useCreateBlockNote({
    initialContent: parseContent(initialContent)
  })

  const handlePersist = useCallback(() => {
    if (!editable) return
    if (!address) return
    if (!editor.document) return

    const serialized = JSON.stringify(editor.document, null, 2)

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
  }, [address, editable, editor.document, groupId, updateDescription])

  useEffect(() => {
    setMounted(true)
  }, [])

  const blocknoteTheme = mounted && resolvedTheme === 'dark' ? 'dark' : 'light'

  return (
    <BlockNoteView
      editor={editor}
      editable={editable}
      theme={blocknoteTheme}
      onChange={handlePersist}
      className={className}
    />
  )
}
