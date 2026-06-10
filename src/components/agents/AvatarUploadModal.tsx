import { useEffect, useRef, useState } from 'react'
import { ImagePlus, Trash2, Upload } from 'lucide-react'
import type { Agent } from '@/types'
import { supabaseEnabled } from '@/lib/supabase'
import { AVATAR_ACCEPT, uploadAvatar, validateAvatarFile } from '@/services/supabase/storage'
import { useToast } from '@/hooks/useToast'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'

interface AvatarUploadModalProps {
  open: boolean
  onClose: () => void
  agent: Agent
  /** Persist the new avatar URL (or `undefined` to clear it). */
  onSave: (avatarUrl: string | undefined) => void
}

/** Read a File into a data URL — local-mock fallback when Supabase isn't configured. */
function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Could not read that image.'))
    reader.readAsDataURL(file)
  })
}

export function AvatarUploadModal({ open, onClose, agent, onSave }: AvatarUploadModalProps) {
  const { toast } = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [removed, setRemoved] = useState(false)
  const [busy, setBusy] = useState(false)

  // Reset whenever the modal opens, and revoke any object URL on cleanup.
  useEffect(() => {
    if (open) {
      setFile(null)
      setRemoved(false)
      setBusy(false)
    }
  }, [open])

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  function pickFile(next: File) {
    const error = validateAvatarFile(next)
    if (error) {
      toast({ title: 'Unsupported image', description: error, variant: 'error' })
      return
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(URL.createObjectURL(next))
    setFile(next)
    setRemoved(false)
  }

  function handleRemove() {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    setFile(null)
    setRemoved(true)
  }

  async function handleSave() {
    setBusy(true)
    try {
      if (file) {
        const url = supabaseEnabled
          ? await uploadAvatar(file, agent.avatarUrl)
          : await readAsDataUrl(file)
        onSave(url)
        toast({ title: 'Profile picture updated', variant: 'success' })
      } else if (removed) {
        onSave(undefined)
        toast({ title: 'Profile picture removed', variant: 'success' })
      }
      onClose()
    } catch (e) {
      toast({
        title: 'Upload failed',
        description: e instanceof Error ? e.message : 'Please try again.',
        variant: 'error',
      })
    } finally {
      setBusy(false)
    }
  }

  const shownSrc = removed ? undefined : previewUrl ?? agent.avatarUrl
  const dirty = file !== null || removed
  const hasImage = Boolean(shownSrc)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Profile picture"
      description="Upload a photo so teammates can recognize you."
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" loading={busy} disabled={!dirty || busy} onClick={handleSave}>
            {!busy && <Upload className="h-3.5 w-3.5" />} Save
          </Button>
        </>
      }
    >
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
        <Avatar
          name={agent.fullName}
          src={shownSrc}
          size="xl"
          className="h-24 w-24 ring-4 ring-white shadow-card"
        />

        <div className="flex-1 space-y-3 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <Button variant="secondary" size="sm" onClick={() => inputRef.current?.click()} disabled={busy}>
              <ImagePlus className="h-3.5 w-3.5" /> Choose image
            </Button>
            {hasImage && (
              <Button variant="ghost" size="sm" onClick={handleRemove} disabled={busy} className="text-red-500 hover:bg-red-50 hover:text-red-600">
                <Trash2 className="h-3.5 w-3.5" /> Remove
              </Button>
            )}
          </div>
          <p className="text-[13px] text-slate-500">
            JPG, PNG, WebP, or GIF · up to 5 MB. Square images look best.
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={AVATAR_ACCEPT}
          className="hidden"
          onChange={(e) => {
            const next = e.target.files?.[0]
            if (next) pickFile(next)
            e.target.value = '' // allow re-picking the same file
          }}
        />
      </div>
    </Modal>
  )
}
