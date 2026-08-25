import { useEffect, useState, useCallback } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { searchRates, similarQuotes } from '@/lib/api'
import type { RateOption, PastQuote } from '@/lib/types'
import { Search, Copy, Zap, BadgeDollarSign } from 'lucide-react'

const NAVY = '#0A2472'
const MODE_OPTS = [{ v: 'sea', t: 'Sea' }, { v: 'air', t: 'Air' }]
const TYPE_OPTS = [{ v: 'FCL', t: 'FCL' }, { v: 'LCL', t: 'LCL' }, { v: 'air', t: 'Air' }]
const CTR_OPTS = ['', '20GP', '40GP', '40HQ', '20RF', '40RF']
const ACCENT: Record<string, string> = { FCL: '#0A2472', LCL: '#0d9488', AIR: '#F26A21' }

function money(cur: string | null, n: number | null) {
  if (n == null) return '—'
  return `${cur ?? ''} ${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`.trim()
}
function marginPct(buy: number | null, sell: number | null) {
  if (buy == null || sell == null || sell === 0) return null
  return Math.round(((sell - buy) / sell) * 100)
}
function marginClass(m: number | null) {
  if (m == null) return 'text-muted-foreground'
  if (m <= 0) return 'text-red-600'
  if (m < 15) return 'text-amber-600'
  return 'text-green-600'
}
function confColor(c?: string | null) {
  return c === 'green' ? 'bg-green-500' : c === 'amber' ? 'bg-amber-500' : c === 'red' ? 'bg-red-500' : 'bg-muted-foreground'
}

export function AiRates({ initialPol, initialPod, initialMode, initialType, accountId }: {
  initialPol: string; initialPod: string; initialMode: string; initialType: string; accountId: string | null
}) {
  const [pol, setPol] = useState(initialPol)
  const [pod, setPod] = useState(initialPod)
  const [mode, setMode] = useState(initialMode || 'sea')
  const [type, setType] = useState(initialType)
  const [container, setContainer] = useState('')
  const [options, setOptions] = useState<RateOption[] | null>(null)
  const [past, setPast] = useState<PastQuote[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const run = useCallback(async () => {
    if (!pod.trim()) { setErr('Enter a destination (POD) to search.'); return }
    setLoading(true); setErr(null)
    try {
      const P = pol.trim().toUpperCase(), D = pod.trim().toUpperCase()
      const [r, s] = await Promise.all([
        searchRates({ pol: P, pod: D, mode, type, container }),
        similarQuotes({ pol: P, pod: D, account: accountId ?? undefined }),
      ])
      setOptions(r.options || [])
      setPast(s.quotes || [])
    } catch (e: any) { setErr(e.message) } finally { setLoading(false) }
  }, [pol, pod, mode, type, container, accountId])

  useEffect(() => { if (initialPod.trim()) run() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const withSell = (options ?? []).filter((o) => o.sell != null && o.sell > 0)
  const bestSell = withSell.length ? Math.min(...withSell.map((o) => o.sell as number)) : null
  const withTransit = (options ?? []).filter((o) => o.transit_days != null)
  const fastest = withTransit.length ? Math.min(...withTransit.map((o) => o.transit_days as number)) : null

  function copyRate(o: RateOption) {
    const m = marginPct(o.buy, o.sell)
    const txt = `${o.product} ${o.carrier ?? ''} ${o.container_type ?? ''} ${pol}->${pod} | buy ${money(o.currency, o.buy)} sell ${money(o.currency, o.sell)}${m != null ? ` (${m}%)` : ''}`.replace(/\s+/g, ' ').trim()
    if (!navigator.clipboard) { toast.error('Clipboard unavailable'); return }
    navigator.clipboard.writeText(txt).then(() => toast.success('Rate copied'), () => toast.error('Copy failed'))
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border p-3 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div><Label className="text-[11px] uppercase tracking-wide text-muted-foreground">POL</Label><Input className="h-8 text-sm" value={pol} onChange={(e) => setPol(e.target.value)} placeholder="e.g. CNSHK" /></div>
          <div><Label className="text-[11px] uppercase tracking-wide text-muted-foreground">POD</Label><Input className="h-8 text-sm" value={pod} onChange={(e) => setPod(e.target.value)} placeholder="e.g. NZAKL" /></div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <select className="h-8 rounded-md border bg-background px-2 text-sm" value={mode} onChange={(e) => setMode(e.target.value)}>{MODE_OPTS.map((o) => <option key={o.v} value={o.v}>{o.t}</option>)}</select>
          <select className="h-8 rounded-md border bg-background px-2 text-sm" value={type} onChange={(e) => setType(e.target.value)}><option value="">Any</option>{TYPE_OPTS.map((o) => <option key={o.v} value={o.v}>{o.t}</option>)}</select>
          <select className="h-8 rounded-md border bg-background px-2 text-sm" value={container} onChange={(e) => setContainer(e.target.value)} disabled={mode === 'air'}>{CTR_OPTS.map((c) => <option key={c} value={c}>{c || 'Any ctr'}</option>)}</select>
        </div>
        <Button className="w-full text-white hover:opacity-90" style={{ backgroundColor: NAVY }} onClick={run} disabled={loading}>
          <Search className="h-4 w-4 mr-2" />{loading ? 'Searching…' : 'Search rates'}
        </Button>
      </div>

      {err ? <p className="text-sm text-destructive">{err}</p> : null}

      {loading ? (
        <div className="space-y-2"><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /></div>
      ) : options ? (
        <>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Rate options</p>
            {options.length === 0 ? <p className="text-xs text-muted-foreground">No active rates for this lane. Try a different POL/POD, or add a rate card in the portal.</p> : null}
            {options.map((o, i) => {
              const m = marginPct(o.buy, o.sell)
              const isBest = o.sell != null && o.sell === bestSell
              const isFast = o.transit_days != null && o.transit_days === fastest
              return (
                <div key={i} className="rounded-lg border p-3 space-y-1.5" style={{ borderLeft: `3px solid ${ACCENT[o.product] ?? NAVY}` }}>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px]">{o.product}</Badge>
                    <span className="text-sm font-medium truncate flex-1">{o.carrier ?? '—'}{o.container_type ? ` · ${o.container_type}` : ''}</span>
                    {isBest ? <span className="inline-flex items-center gap-0.5 text-[10px] text-green-700"><BadgeDollarSign className="h-3 w-3" />Best</span> : null}
                    {isFast ? <span className="inline-flex items-center gap-0.5 text-[10px] text-[#F26A21]"><Zap className="h-3 w-3" />Fastest</span> : null}
                    <span className={`h-2.5 w-2.5 rounded-full ${confColor(o.confidence)}`} title={o.confidence ?? ''} />
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-muted-foreground">Buy <b className="text-foreground">{money(o.currency, o.buy)}</b></span>
                    <span className="text-muted-foreground">Sell <b className="text-foreground">{money(o.currency, o.sell)}</b></span>
                    <span className={`font-medium ${marginClass(m)}`}>{m != null ? `${m}%` : '—'}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="truncate">{[o.transit_days != null ? `${o.transit_days}d` : null, o.via ? `via ${o.via}` : null, o.valid_to ? `valid ${o.valid_to}` : null].filter(Boolean).join(' · ') || o.unit}</span>
                    <button onClick={() => copyRate(o)} className="inline-flex items-center gap-1 hover:text-foreground shrink-0"><Copy className="h-3 w-3" />Copy</button>
                  </div>
                </div>
              )
            })}
          </div>

          {past && past.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Similar past quotes</p>
              {past.map((p, i) => (
                <div key={i} className="rounded-md border px-3 py-2 flex items-center gap-2 text-sm">
                  <span className="font-medium shrink-0">{p.quote_no}</span>
                  <span className="text-muted-foreground truncate flex-1">{p.customer ?? '—'}</span>
                  {p.total_sell != null ? <span className="text-[11px] shrink-0">{money(p.currency, p.total_sell)}{p.margin_pct != null ? ` · ${Math.round(p.margin_pct)}%` : ''}</span> : null}
                  <StatusChip status={p.status} />
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Enter a lane and search to see live rates and past quotes.</p>
      )}
    </div>
  )
}

function StatusChip({ status }: { status: string }) {
  const map: Record<string, string> = { won: 'bg-green-100 text-green-700', lost: 'bg-red-100 text-red-700', open: 'bg-muted text-muted-foreground', crosswin: 'bg-amber-100 text-amber-700' }
  return <span className={`text-[10px] rounded px-1.5 py-0.5 shrink-0 ${map[status] ?? 'bg-muted text-muted-foreground'}`}>{status}</span>
}
