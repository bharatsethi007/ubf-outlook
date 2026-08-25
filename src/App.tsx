import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'sonner'
import { readCurrentEmail, getSavedSecret, saveSecret, type EmailData } from '@/lib/office'
import { extractQuote, commitQuote } from '@/lib/api'
import { LText, LNum, LSelect, LCheck } from '@/components/fields'
import { PartyCard } from '@/components/PartyCard'
import { CargoLinesEditor } from '@/components/CargoLinesEditor'
import type { ExtractResponse, Fields, CargoLine, Resolution } from '@/lib/types'
import { Send, Loader2, Bot, KeyRound, RefreshCw } from 'lucide-react'

const NAVY = '#0A2472'
const MODE_OPTS = [{ v: 'sea', t: 'Sea' }, { v: 'air', t: 'Air' }]
const TYPE_OPTS = [{ v: 'FCL', t: 'FCL' }, { v: 'LCL', t: 'LCL' }, { v: 'air', t: 'Air' }]

function pickInitial(p: ExtractResponse['parties'][number]): Resolution {
  const c = p.customer_matches[0], a = p.agent_matches[0]
  const cs = c?.score ?? 0, as = a?.score ?? 0
  if (p.role === 'agent' && as >= 0.75) return { type: 'agent', id: a.id!, name: a.name }
  if (cs >= 0.75 && cs >= as) return { type: 'customer', account_id: c.account_id!, name: c.name }
  if (as >= 0.75) return { type: 'agent', id: a.id!, name: a.name }
  return { type: 'create_customer', name: p.name }
}

export default function App() {
  const [email, setEmail] = useState<EmailData | null>(null)
  const [extract, setExtract] = useState<ExtractResponse | null>(null)
  const [fields, setFields] = useState<Fields | null>(null)
  const [cargo, setCargo] = useState<CargoLine[]>([])
  const [roles, setRoles] = useState<string[]>([])
  const [resolutions, setResolutions] = useState<Resolution[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [committing, setCommitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [needsSecret, setNeedsSecret] = useState(false)
  const [secretInput, setSecretInput] = useState('')

  useEffect(() => {
    readCurrentEmail().then((e) => { setEmail(e); return e })
      .then((e) => runExtract(e))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  async function runExtract(e: EmailData) {
    if (!getSavedSecret()) { setNeedsSecret(true); return }
    setBusy(true); setError(null)
    try {
      const r: ExtractResponse = await extractQuote(e)
      setExtract(r); setFields(r.fields); setCargo(r.cargo_lines)
      setRoles(r.parties.map((p) => p.role))
      setResolutions(r.parties.map(pickInitial))
    } catch (err: any) {
      if (err.code === 'NO_SECRET' || err.code === 'UNAUTH') { setNeedsSecret(true); return }
      setError(err.message)
    } finally { setBusy(false) }
  }

  async function handleSaveSecret() {
    const v = secretInput.trim(); if (!v) return
    try { await saveSecret(v); setSecretInput(''); setNeedsSecret(false); if (email) runExtract(email) }
    catch (e: any) { toast.error('Could not save', { description: e.message }) }
  }

  async function handleCommit() {
    if (!fields || !extract) return
    setCommitting(true)
    try {
      const payload = {
        doc_type: extract.doc_type,
        fields, cargo_lines: cargo,
        parties: (extract.parties || []).map((p, i) => ({ name: p.name, email: p.email, role: roles[i], resolution: resolutions[i] })),
        low_confidence: extract.low_confidence,
        email_meta: extract.email_meta,
      }
      const r = await commitQuote(payload)
      toast.success(`Quote ${r.quote_no} created`, { description: 'Open it in the portal to price and send.' })
    } catch (e: any) {
      toast.error('Commit failed', { description: e.message })
    } finally { setCommitting(false) }
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-3">
      <Toaster position="top-center" richColors />
      <header className="flex items-center justify-between mb-2">
        <img src={`${import.meta.env.BASE_URL}assets/ubf-logo.png`} alt="UB Freight" className="h-6" />
        <div className="flex items-center gap-2">
          {email ? <button title="Re-analyse" onClick={() => runExtract(email)} className="text-muted-foreground hover:text-foreground"><RefreshCw className={`h-4 w-4 ${busy ? 'animate-spin' : ''}`} /></button> : null}
          <button title="Set access key" onClick={() => setNeedsSecret((v) => !v)} className="text-muted-foreground hover:text-foreground"><KeyRound className="h-4 w-4" /></button>
        </div>
      </header>

      <div className="flex items-center gap-2 mb-2">
        <Badge style={{ backgroundColor: NAVY }} className="text-white">QUOTE REQUEST</Badge>
        <span className="text-xs text-muted-foreground">Quotation · AI extracted</span>
      </div>

      {needsSecret && (
        <Card className="mb-3 border-dashed">
          <CardContent className="py-3 space-y-2">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">UBF access key (one-time)</p>
            <input type="password" className="w-full rounded-md border px-2 py-1 text-sm bg-background" placeholder="Paste the key"
              value={secretInput} onChange={(e) => setSecretInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleSaveSecret() }} />
            <Button size="sm" className="w-full" onClick={handleSaveSecret}>Save key</Button>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="quote" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="quote">Quote</TabsTrigger>
          <TabsTrigger value="assistant"><Bot className="h-3.5 w-3.5 mr-1" />Assistant</TabsTrigger>
        </TabsList>

        <TabsContent value="quote" className="mt-3 space-y-4">
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {loading || busy ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-1/2" /><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" />
            </div>
          ) : fields && extract ? (
            <>
              <section className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Parties</p>
                {extract.parties.length === 0 ? <p className="text-xs text-muted-foreground">No parties detected.</p> : null}
                {extract.parties.map((p, i) => (
                  <PartyCard key={i} party={p} role={roles[i] ?? p.role}
                    onRoleChange={(r) => setRoles((prev) => prev.map((x, j) => j === i ? r : x))}
                    value={resolutions[i] ?? { type: 'none' }}
                    onChange={(r) => setResolutions((prev) => prev.map((x, j) => j === i ? r : x))} />
                ))}
              </section>

              <section className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Shipment</p>
                <div className="grid grid-cols-2 gap-2">
                  <LSelect label="Mode" value={fields.shipment_mode ?? ''} onChange={(v) => setFields({ ...fields, shipment_mode: v })} options={MODE_OPTS} />
                  <LSelect label="Type" value={fields.shipment_type ?? ''} onChange={(v) => setFields({ ...fields, shipment_type: v })} options={TYPE_OPTS} />
                  <LText label="POL" value={fields.pol_code ?? ''} onChange={(v) => setFields({ ...fields, pol_code: v })} />
                  <LText label="POD" value={fields.pod_code ?? ''} onChange={(v) => setFields({ ...fields, pod_code: v })} />
                  <LText label="Origin" value={fields.origin ?? ''} onChange={(v) => setFields({ ...fields, origin: v })} />
                  <LText label="Destination" value={fields.destination ?? ''} onChange={(v) => setFields({ ...fields, destination: v })} />
                  <LText label="Incoterms" value={fields.incoterms ?? ''} onChange={(v) => setFields({ ...fields, incoterms: v })} />
                  <LText label="Commodity" value={fields.commodity ?? ''} onChange={(v) => setFields({ ...fields, commodity: v })} />
                </div>
                <LText label="Pickup address" value={fields.pickup_address ?? ''} onChange={(v) => setFields({ ...fields, pickup_address: v })} />
              </section>

              <section className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Cargo</p>
                <CargoLinesEditor lines={cargo} onChange={setCargo} />
              </section>

              <section className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Flags</p>
                <div className="flex flex-wrap gap-4">
                  <LCheck label="Hazardous" checked={fields.is_hazardous} onChange={(v) => setFields({ ...fields, is_hazardous: v })} />
                  <LCheck label="Reefer" checked={fields.need_refrigeration} onChange={(v) => setFields({ ...fields, need_refrigeration: v })} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <LNum label="Cargo value" value={fields.cargo_value} onChange={(v) => setFields({ ...fields, cargo_value: v })} />
                  <LText label="Currency" value={fields.cargo_value_currency ?? ''} onChange={(v) => setFields({ ...fields, cargo_value_currency: v })} />
                </div>
              </section>

              {extract.low_confidence.length > 0 ? (
                <p className="text-xs text-amber-600">⚠ Needs review: {extract.low_confidence.join(', ')}</p>
              ) : null}

              <Separator />
              <Button className="w-full text-white hover:opacity-90" style={{ backgroundColor: NAVY }} disabled={committing} onClick={handleCommit}>
                {committing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                Create quote in Portal
              </Button>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Open an email and it'll be analysed automatically.</p>
          )}
        </TabsContent>

        <TabsContent value="assistant" className="mt-3">
          <Card><CardContent className="py-10 text-center text-sm text-muted-foreground"><Bot className="h-6 w-6 mx-auto mb-2 opacity-60" />Assistant chat lands here next.</CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
