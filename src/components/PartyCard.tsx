import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { searchEntities } from '@/lib/api'
import type { Party, Match, Resolution } from '@/lib/types'
import { UserPlus, Search, ChevronDown, ChevronRight } from 'lucide-react'

const ROLES = ['customer', 'agent', 'shipper', 'consignee', 'notify', 'other']

function resLabel(v: Resolution): string {
  if (v.type === 'customer') return `✓ ${v.name}`
  if (v.type === 'agent') return `✓ ${v.name} · agent`
  if (v.type === 'create_customer') return `＋ new customer`
  if (v.type === 'create_agent') return `＋ new agent`
  return 'skipped'
}

function Row({ active, onClick, title, meta, score }: { active: boolean; onClick: () => void; title: string; meta?: string; score?: number }) {
  return (
    <button onClick={onClick}
      className={`w-full text-left rounded-md border px-2 py-1.5 text-sm flex items-center gap-2 ${active ? 'border-[#0A2472] bg-[#0A2472]/5' : 'hover:bg-muted/40'}`}>
      <span className={`h-3 w-3 rounded-full border shrink-0 ${active ? 'bg-[#0A2472] border-[#0A2472]' : 'border-muted-foreground'}`} />
      <span className="flex-1 truncate">{title}{meta ? <span className="text-muted-foreground"> · {meta}</span> : null}</span>
      {score != null ? <span className="text-[11px] text-muted-foreground shrink-0">{score.toFixed(2)}</span> : null}
    </button>
  )
}

export function PartyCard({ party, value, onChange, role, onRoleChange, defaultOpen }: {
  party: Party; value: Resolution; onChange: (r: Resolution) => void; role: string; onRoleChange: (r: string) => void; defaultOpen: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const [custom, setCustom] = useState<{ customers: Match[]; agents: Match[] } | null>(null)
  const [q, setQ] = useState('')
  const [searching, setSearching] = useState(false)

  const customers = custom?.customers ?? party.customer_matches
  const agents = custom?.agents ?? party.agent_matches

  async function doSearch() {
    if (q.trim().length < 2) return
    setSearching(true)
    try { setCustom(await searchEntities(q.trim())) } finally { setSearching(false) }
  }

  const isCust = (m: Match) => value.type === 'customer' && value.account_id === m.account_id
  const isAgent = (m: Match) => value.type === 'agent' && value.id === m.id

  return (
    <Card>
      <CardContent className="py-2.5 space-y-2">
        <button className="w-full flex items-center gap-2 text-left" onClick={() => setOpen((o) => !o)}>
          {open ? <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{party.name}</p>
            <p className="text-[11px] text-muted-foreground truncate">{resLabel(value)}{party.email ? ` · ${party.email}` : ''}</p>
          </div>
          <select className="h-7 rounded-md border bg-background px-1 text-xs shrink-0" value={role}
            onClick={(e) => e.stopPropagation()} onChange={(e) => onRoleChange(e.target.value)}>
            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </button>

        {open && (
          <>
            {customers.length > 0 && (
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground pl-1">Customers</p>
                {customers.slice(0, 4).map((m) => (
                  <Row key={'c' + m.account_id} active={isCust(m)} title={m.name} meta={[m.city, m.country].filter(Boolean).join(', ')} score={m.score}
                    onClick={() => onChange({ type: 'customer', account_id: m.account_id!, name: m.name })} />
                ))}
              </div>
            )}
            {agents.length > 0 && (
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground pl-1">Agents</p>
                {agents.slice(0, 4).map((m) => (
                  <Row key={'a' + m.id} active={isAgent(m)} title={m.name} meta={[m.country, m.trusted ? 'trusted' : ''].filter(Boolean).join(' · ')} score={m.score}
                    onClick={() => onChange({ type: 'agent', id: m.id!, name: m.name })} />
                ))}
              </div>
            )}

            <div className="flex items-center gap-1">
              <Input className="h-7 text-xs" placeholder="Search customers / agents…" value={q}
                onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') doSearch() }} />
              <button onClick={doSearch} className="rounded-md border px-2 py-1 text-xs shrink-0" disabled={searching}>
                <Search className="h-3 w-3" />
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              <button onClick={() => onChange({ type: 'create_customer', name: party.name })}
                className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs ${value.type === 'create_customer' ? 'border-[#0A2472] bg-[#0A2472]/5' : 'hover:bg-muted/40'}`}>
                <UserPlus className="h-3 w-3" /> New customer
              </button>
              <button onClick={() => onChange({ type: 'create_agent', name: party.name })}
                className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs ${value.type === 'create_agent' ? 'border-[#0A2472] bg-[#0A2472]/5' : 'hover:bg-muted/40'}`}>
                <UserPlus className="h-3 w-3" /> New agent
              </button>
              <button onClick={() => onChange({ type: 'none' })}
                className={`rounded-md border px-2 py-1 text-xs ${value.type === 'none' ? 'border-[#0A2472] bg-[#0A2472]/5' : 'hover:bg-muted/40'}`}>
                Skip
              </button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
