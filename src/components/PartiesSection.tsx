import type { Dispatch, SetStateAction } from 'react'
import { PartyCard } from './PartyCard'
import type { Party, Resolution } from '@/lib/types'

const COLLAPSED_ROLES = ['other', 'notify']

export function PartiesSection({ parties, roles, resolutions, setRoles, setResolutions, proceedWord }: {
  parties: Party[]; roles: string[]; resolutions: Resolution[];
  setRoles: Dispatch<SetStateAction<string[]>>; setResolutions: Dispatch<SetStateAction<Resolution[]>>; proceedWord: string
}) {
  const missing = parties.filter((p, i) => ['customer', 'agent'].includes(roles[i] ?? p.role) && ((resolutions[i]?.type ?? 'none') === 'none'))
  return (
    <section className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Parties</p>
      {parties.length === 0 ? <p className="text-xs text-muted-foreground">No parties detected.</p> : null}
      {parties.map((p, i) => (
        <PartyCard key={i} party={p} role={roles[i] ?? p.role}
          defaultOpen={!COLLAPSED_ROLES.includes(roles[i] ?? p.role)}
          onRoleChange={(r) => setRoles((prev) => prev.map((x, j) => (j === i ? r : x)))}
          value={resolutions[i] ?? { type: 'none' }}
          onChange={(r) => setResolutions((prev) => prev.map((x, j) => (j === i ? r : x)))} />
      ))}
      {missing.length ? <p className="text-xs text-amber-600">⚠ No selection for: {missing.map((p) => p.name).join(', ')} — these won't be linked. You can still {proceedWord}.</p> : null}
    </section>
  )
}
