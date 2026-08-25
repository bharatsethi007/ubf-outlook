import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { searchEntities } from '@/lib/api'
import type { Party, Match, Resolution } from '@/lib/types'
import { UserPlus, ChevronDown, ChevronRight, Check, X } from 'lucide-react'

const ROLES = ['customer', 'agent', 'shipper', 'consignee', 'notify', 'other']

function resLabel(v: Resolution): string {
  if (v.type === 'customer') return `${v.name}`
  if (v.type === 'agent') return `${v.name} · agent`
  if (v.type === 'create_customer') return `New customer: ${v.name}`
  if (v.type === 'create_agent') return `New agent: ${v.name}`
  return 'Not selected'
}

export function PartyCard({ party, value, onChange, role, onRoleChange, defaultOpen }: {
  party: Party; value: Resolution; onChange: (r: Resolution) => void; role: string; onRoleChange: (r: string) => void; defaultOpen: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [q, setQ] = useState('')
  const [remote, setRemote] = useState<{ customers: Match[]; agents: Match[] } | null>(null)
  const [searching, setSearching] = useState(false)

  const customers = remote?.customers ?? party.customer_matches
  const agents = remote?.agents ?? party.agent_matches
  const selected = value.type !== 'none'

  useEffect(() => {
    if (!pickerOpen) return
    const t = setTimeout(async () => {
      if (q.trim().length < 2) { setRemote(null); return }
      setSearching(true)
      try { setRemote(await searchEntities(q.trim())) } finally { setSearching(false) }
    }, 250)
    return () => clearTimeout(t)
  }, [q, pickerOpen])

  function choose(r: Resolution) { onChange(r); setPickerOpen(false); setQ(''); setRemote(null) }

  return (
    <Card>
      <CardContent className="py-2.5 space-y-2">
        <button className="w-full flex items-center gap-2 text-left" onClick={() => setOpen((o) => !o)}>
          {open ? <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{party.name}</p>
            <p className={`text-[11px] truncate ${selected ? 'text-foreground' : 'text-amber-600'}`}>{resLabel(value)}{party.email ? ` · ${party.email}` : ''}</p>
          </div>
          <select className="h-7 rounded-md border bg-background px-1 text-xs shrink-0" value={role}
            onClick={(e) => e.stopPropagation()} onChange={(e) => onRoleChange(e.target.value)}>
            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </button>

        {open && (
          <div className="space-y-1">
            {/* trigger row */}
            <button onClick={() => setPickerOpen((o) => !o)}
              className="w-full flex items-center justify-between rounded-md border px-2 py-1.5 text-sm hover:bg-muted/40">
              <span className={`truncate ${selected ? '' : 'text-muted-foreground'}`}>{selected ? resLabel(value) : 'Select or create…'}</span>
              {pickerOpen ? <X className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />}
            </button>

            {/* inline panel — expands in place, pushes cards below down (no overlay) */}
            {pickerOpen && (
              <div className="rounded-md border bg-muted/20 p-1 space-y-1">
                <Input autoFocus className="h-7 text-xs bg-background" placeholder="Type to search customers / agents…"
                  value={q} onChange={(e) => setQ(e.target.value)} />
                {searching ? <p className="text-[11px] text-muted-foreground px-1">Searching…</p> : null}

                {customers.length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground px-1 pt-1">Customers</p>
                    {customers.slice(0, 6).map((m) => {
                      const active = value.type === 'customer' && value.account_id === m.account_id
                      return (
                        <button key={'c' + m.account_id} onClick={() => choose({ type: 'customer', account_id: m.account_id!, name: m.name })}
                          className="w-full text-left rounded px-2 py-1 text-sm hover:bg-background flex items-center gap-2">
                          {active ? <Check className="h-3 w-3 text-[#0A2472] shrink-0" /> : <span className="w-3 shrink-0" />}
                          <span className="flex-1 truncate">{m.name}<span className="text-muted-foreground"> · {[m.city, m.country].filter(Boolean).join(', ')}</span></span>
                          <span className="text-[11px] text-muted-foreground shrink-0">{m.score.toFixed(2)}</span>
                        </button>
                      )
                    })}
                  </div>
                )}

                {agents.length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground px-1 pt-1">Agents</p>
                    {agents.slice(0, 6).map((m) => {
                      const active = value.type === 'agent' && value.id === m.id
                      return (
                        <button key={'a' + m.id} onClick={() => choose({ type: 'agent', id: m.id!, name: m.name })}
                          className="w-full text-left rounded px-2 py-1 text-sm hover:bg-background flex items-center gap-2">
                          {active ? <Check className="h-3 w-3 text-[#0A2472] shrink-0" /> : <span className="w-3 shrink-0" />}
                          <span className="flex-1 truncate">{m.name}<span className="text-muted-foreground"> · {[m.country, m.trusted ? 'trusted' : ''].filter(Boolean).join(' · ')}</span></span>
                          <span className="text-[11px] text-muted-foreground shrink-0">{m.score.toFixed(2)}</span>
                        </button>
                      )
                    })}
                  </div>
                )}

                {q.trim().length >= 2 && customers.length === 0 && agents.length === 0 && !searching ? (
                  <p className="text-[11px] text-muted-foreground px-2 py-1">No matches — create below.</p>
                ) : null}

                <div className="border-t pt-1 mt-1 space-y-0.5">
                  <button onClick={() => choose({ type: 'create_customer', name: party.name })}
                    className="w-full text-left rounded px-2 py-1 text-sm hover:bg-background flex items-center gap-2">
                    <UserPlus className="h-3 w-3 shrink-0" /> Create new customer “{party.name}”
                  </button>
                  <button onClick={() => choose({ type: 'create_agent', name: party.name })}
                    className="w-full text-left rounded px-2 py-1 text-sm hover:bg-background flex items-center gap-2">
                    <UserPlus className="h-3 w-3 shrink-0" /> Create new agent “{party.name}”
                  </button>
                  <button onClick={() => choose({ type: 'none' })}
                    className="w-full text-left rounded px-2 py-1 text-sm text-muted-foreground hover:bg-background">
                    Skip this party
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
