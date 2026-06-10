import { useEffect, useState } from 'react'
import { Copy, Link2, Mail, MoreHorizontal, Pencil, Plus, Power, Send, Ticket, Trash2 } from 'lucide-react'
import { useAppStore } from '@/app/store'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { isValidEmail, sendInviteEmail } from '@/services/invites'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input, Field } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Dropdown, DropdownItem } from '@/components/ui/Dropdown'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatShortDate, relativeTime } from '@/lib/dateRanges'

const origin = typeof window !== 'undefined' ? window.location.origin : ''
const linkFor = (code: string) => `${origin}/sign-up?invite=${code}`

export function InvitesPage() {
  const inviteCodes = useAppStore((s) => s.inviteCodes)
  const sentInvites = useAppStore((s) => s.sentInvites)
  const teams = useAppStore((s) => s.teams)
  const createInviteCode = useAppStore((s) => s.createInviteCode)
  const updateInviteCode = useAppStore((s) => s.updateInviteCode)
  const deleteInviteCode = useAppStore((s) => s.deleteInviteCode)
  const recordSentInvite = useAppStore((s) => s.recordSentInvite)
  const { account, isOwner, isAdmin, isLeader } = useAuth()
  const { toast } = useToast()

  const canManage = isOwner || isAdmin
  const canSend = isOwner || isAdmin || isLeader

  // Email invite sender
  const [email, setEmail] = useState('')
  const [sendTeamId, setSendTeamId] = useState(teams[0]?.id ?? '')
  const [sending, setSending] = useState(false)

  // Code create/edit modal
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [teamId, setTeamId] = useState(teams[0]?.id ?? '')
  const [active, setActive] = useState(true)

  // Delete confirm
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; code: string } | null>(null)

  useEffect(() => {
    if (!modalOpen) return
    if (editingId) {
      const c = inviteCodes.find((x) => x.id === editingId)
      if (c) { setCode(c.code); setTeamId(c.teamId); setActive(c.active) }
    } else {
      setCode(''); setTeamId(teams[0]?.id ?? ''); setActive(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalOpen, editingId])

  function copy(text: string, label: string) {
    navigator.clipboard?.writeText(text)
    toast({ title: `${label} copied`, description: text, variant: 'success' })
  }

  async function handleSend() {
    if (!isValidEmail(email)) { toast({ title: 'Enter a valid email address.', variant: 'error' }); return }
    setSending(true)
    // Use the team's active code, or create one on the fly.
    let invite = inviteCodes.find((c) => c.teamId === sendTeamId && c.active)
    if (!invite) {
      const team = teams.find((t) => t.id === sendTeamId)
      const generated = `${(team?.name ?? 'TEAM').replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 8)}${Math.floor(10 + Math.random() * 89)}`
      invite = createInviteCode({ code: generated, teamId: sendTeamId, createdBy: account?.fullName ?? 'Leader' }) ?? undefined
    }
    if (!invite) { setSending(false); toast({ title: 'Could not create invite code', variant: 'error' }); return }
    const link = linkFor(invite.code)
    const res = await sendInviteEmail(email, link)
    setSending(false)
    if (res.ok) {
      recordSentInvite({ email, teamId: sendTeamId, code: invite.code, link, sentBy: account?.fullName ?? 'Leader' })
      toast({ title: 'Invite sent', description: `Sign-up link emailed to ${email}`, variant: 'success' })
      setEmail('')
    } else {
      toast({ title: 'Could not send invite', description: res.error, variant: 'error' })
    }
  }

  function saveCode() {
    if (!code.trim()) return
    if (editingId) {
      updateInviteCode(editingId, { code, teamId, active })
      toast({ title: 'Invite code updated', description: code.toUpperCase(), variant: 'success' })
    } else {
      const created = createInviteCode({ code, teamId, createdBy: account?.fullName ?? 'Admin' })
      if (!created) { toast({ title: 'Could not create code', variant: 'error' }); return }
      toast({ title: 'Invite code created', description: `${created.code} → ${created.teamName}`, variant: 'success' })
    }
    setModalOpen(false)
    setEditingId(null)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invites"
        description="Send invites by email and manage team invite codes. New signups route to a team automatically."
        actions={
          canManage ? (
            <Button variant="primary" size="sm" onClick={() => { setEditingId(null); setModalOpen(true) }}>
              <Plus className="h-3.5 w-3.5" /> Create Invite Code
            </Button>
          ) : undefined
        }
      />

      {/* Email invite sender */}
      {canSend && (
        <Card className="p-5">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-electric-50 text-electric"><Mail className="h-4.5 w-4.5" /></span>
            <div>
              <h3 className="text-[15px] font-bold text-ink">Invite by email</h3>
              <p className="text-[12.5px] text-slate-500">We'll email a personalized sign-up link that routes them to the team.</p>
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Field label="Email address">
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="newagent@email.com" inputMode="email" />
              </Field>
            </div>
            <div className="sm:w-56">
              <Field label="Route to team">
                <Select value={sendTeamId} onChange={(e) => setSendTeamId(e.target.value)} options={teams.map((t) => ({ label: t.name, value: t.id }))} />
              </Field>
            </div>
            <Button variant="primary" className="h-10 sm:w-auto" loading={sending} onClick={handleSend}>
              {!sending && <Send className="h-4 w-4" />} Send Invite
            </Button>
          </div>

          {sentInvites.length > 0 && (
            <div className="mt-5 border-t border-slate-100 pt-4">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">Recently sent</p>
              <div className="space-y-1.5">
                {sentInvites.slice(0, 6).map((s) => (
                  <div key={s.id} className="flex items-center gap-3 text-[12.5px]">
                    <Mail className="h-3.5 w-3.5 shrink-0 text-slate-300" />
                    <span className="font-semibold text-ink">{s.email}</span>
                    <span className="text-slate-400">→ {s.teamName} · {s.code}</span>
                    <span className="ml-auto text-[11px] text-slate-400">{relativeTime(s.sentAt)}</span>
                    <button onClick={() => copy(s.link, 'Invite link')} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-ink" title="Copy link"><Link2 className="h-3.5 w-3.5" /></button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Invite codes */}
      <div>
        <h2 className="mb-3 text-[15px] font-bold text-ink">Team invite codes</h2>
        {inviteCodes.length === 0 ? (
          <EmptyState icon={Ticket} title="No invite codes yet" description="Create one to start routing signups to a team." />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {inviteCodes.map((c) => {
              const link = linkFor(c.code)
              return (
                <Card key={c.id} className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-electric-50 text-electric"><Ticket className="h-5 w-5" /></span>
                      <div>
                        <p className="font-mono text-[15px] font-extrabold tracking-tight text-ink">{c.code}</p>
                        <p className="text-[12px] text-slate-400">{c.teamName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge tone={c.active ? 'green' : 'neutral'} dot>{c.active ? 'Active' : 'Inactive'}</Badge>
                      {canManage && (
                        <Dropdown
                          align="right"
                          trigger={() => <span className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-ink"><MoreHorizontal className="h-4 w-4" /></span>}
                        >
                          {(close) => (
                            <>
                              <DropdownItem onClick={() => { setEditingId(c.id); setModalOpen(true); close() }}><Pencil className="h-4 w-4" /> Edit</DropdownItem>
                              <DropdownItem onClick={() => { updateInviteCode(c.id, { active: !c.active }); toast({ title: c.active ? 'Code deactivated' : 'Code activated', variant: 'info' }); close() }}>
                                <Power className="h-4 w-4" /> {c.active ? 'Deactivate' : 'Activate'}
                              </DropdownItem>
                              <DropdownItem className="text-red-500 hover:bg-red-50 hover:text-red-600" onClick={() => { close(); setConfirmDelete({ id: c.id, code: c.code }) }}><Trash2 className="h-4 w-4" /> Delete</DropdownItem>
                            </>
                          )}
                        </Dropdown>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-[12px] text-slate-400">
                    <span>{c.usageCount} signups</span>
                    <span>Created {formatShortDate(c.createdAt)}</span>
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <Button variant="secondary" size="sm" className="flex-1" onClick={() => copy(c.code, 'Code')}><Copy className="h-3.5 w-3.5" /> Code</Button>
                    <Button variant="secondary" size="sm" className="flex-1" onClick={() => copy(link, 'Invite link')}><Link2 className="h-3.5 w-3.5" /> Link</Button>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Create / Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingId(null) }}
        title={editingId ? 'Edit Invite Code' : 'Create Invite Code'}
        description="Signups using this code route to the selected team."
        footer={
          <>
            <Button variant="secondary" onClick={() => { setModalOpen(false); setEditingId(null) }}>Cancel</Button>
            <Button variant="primary" onClick={saveCode}>{editingId ? 'Save Changes' : 'Create Code'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Code">
            <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="TEAM25" autoFocus />
          </Field>
          <Field label="Team">
            <Select value={teamId} onChange={(e) => setTeamId(e.target.value)} options={teams.map((t) => ({ label: t.name, value: t.id }))} />
          </Field>
          {editingId && (
            <Field label="Status">
              <Select value={active ? 'active' : 'inactive'} onChange={(e) => setActive(e.target.value === 'active')} options={[{ label: 'Active', value: 'active' }, { label: 'Inactive', value: 'inactive' }]} />
            </Field>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title="Delete invite code"
        message={`Delete invite code "${confirmDelete?.code}"? Anyone who already signed up keeps their team — but the code will no longer work.`}
        confirmLabel="Delete code"
        danger
        onConfirm={() => { if (confirmDelete) { deleteInviteCode(confirmDelete.id); toast({ title: 'Invite code deleted', variant: 'success' }) } }}
        onClose={() => setConfirmDelete(null)}
      />
    </div>
  )
}
