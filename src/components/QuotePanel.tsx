import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { type EmailData } from '@/lib/office'
import { extractQuote, commitQuote } from '@/lib/api'
import { LText, LNum, LSelect, LCheck } from '@/components/fields'
import { PartiesSection } from '@/components/PartiesSection'
import { CargoLinesEditor } from '@/components/CargoLinesEditor'
import { AiRates } from '@/components/AiRates'
import type { ExtractResponse, Fields, CargoLine, Resolution } from '@/lib/types'
import { Send, Loader2, Bot, RefreshCw, AlertTriangle } from 'lucide-react'

const NAVY = '#0A2472'
const MODE_OPTS = [{ v: 'sea', t: 'Sea' }, { v: 'air', t: 'Air' }]
const TYPE_OPTS = [{ v: 'FCL', t: 'FCL' }, { v: 'LCL', t: 'LCL' }, { v: 'air', t: 'Air' }]

export function QuotePanel({ email }: { email: EmailData }) {
  const [extract, setExtract] = useState<ExtractResponse | null>(null)
  const [fields, setFields] = useState<Fields | null>(null)
  const [cargo, setCargo] = useState<CargoLine[]>([])
  const [roles, setRoles] = useState<string[]>([])
  const [resolutions, setResolutions] = useState<Resolution[]>([])
  const [busy, setBusy] = useState(true)
  const [committing, setCommitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function run() {
    setBusy(true); setError(null)
    try {
      const r: ExtractResponse = await extractQuote(email)
      setExtract(r); setFields(r.fields); setCargo(r.cargo_lines)
      setRoles(r.parties.map((p) => p.role)); setResolutions(r.parties.map(() => ({ type: 'none' })))
    } catch (e: any) { setError(e.message) } finally { setBusy(false) }
  }
  useEffect(() => { run() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleCommit() {
    if (!fields || !extract) return
    setCommitting(true)
    try {
      const payload = {
        doc_type: extract.doc_type, fields, cargo_lines: cargo,
        parties: extract.parties.map((p, i) => ({ name: p.name, email: p.email, role: roles[i], resolution: resolutions[i] })),
        low_confidence: extract.low_confidence, email_meta: extract.email_meta,
      }
      const r = await commitQuote(payload)
      if (r.duplicate) toast.warning(`Quote already exists: ${r.quote_no}`)
      else toast.success(`Quote ${r.quote_no} created`, { description: 'Open it in the portal to price and send.' })
    } catch (e: any) { toast.error('Commit failed', { description: e.message }) } finally { setCommitting(false) }
  }

  return (
    <>
      {extract?.existing && (
        <div className="mb-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>A quote already exists for this email: <b>{extract.existing.quote_no}</b>{extract.existing.staff_email ? ` (by ${extract.existing.staff_email})` : ''}.</span>
        </div>
      )}
      <Tabs defaultValue="main" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="main">Quote</TabsTrigger>
          <TabsTrigger value="rates"><Bot className="h-3.5 w-3.5 mr-1" />AI Rates</TabsTrigger>
        </TabsList>
        <TabsContent value="main" className="mt-3 space-y-4">
          <div className="flex justify-end"><button onClick={run} className="text-xs text-muted-foreground inline-flex items-center gap-1"><RefreshCw className={`h-3 w-3 ${busy ? 'animate-spin' : ''}`} />Re-analyse</button></div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {busy ? <div className="space-y-2"><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /></div>
          : fields && extract ? (
            <>
              <PartiesSection parties={extract.parties} roles={roles} resolutions={resolutions} setRoles={setRoles} setResolutions={setResolutions} proceedWord="create the quote" />
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
              {extract.low_confidence.length > 0 ? <p className="text-xs text-amber-600">⚠ Needs review: {extract.low_confidence.join(', ')}</p> : null}
              <Separator />
              <Button className="w-full text-white hover:opacity-90" style={{ backgroundColor: NAVY }} disabled={committing} onClick={handleCommit}>
                {committing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                {extract.existing ? 'Open existing quote' : 'Create quote in Portal'}
              </Button>
            </>
          ) : null}
        </TabsContent>
        <TabsContent value="rates" className="mt-3">
          <AiRates initialPol={fields?.pol_code ?? ''} initialPod={fields?.pod_code ?? ''} initialMode={fields?.shipment_mode ?? ''} initialType={fields?.shipment_type ?? ''} accountId={(resolutions.find((r) => r.type === 'customer') as any)?.account_id ?? null} />
        </TabsContent>
      </Tabs>
    </>
  )
}
