import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { type EmailData } from '@/lib/office'
import { bookingExtract, bookingCommit } from '@/lib/api'
import { LText, LNum, LSelect, LCheck } from '@/components/fields'
import { PartiesSection } from '@/components/PartiesSection'
import { CargoLinesEditor } from '@/components/CargoLinesEditor'
import { AiRates } from '@/components/AiRates'
import type { BookingExtractResponse, BookingFields, CargoLine, Resolution } from '@/lib/types'
import { Send, Loader2, Bot, RefreshCw, AlertTriangle } from 'lucide-react'

const NAVY = '#0A2472'
const MODULE_OPTS = [{ v: 'EA', t: 'Export Air' }, { v: 'ES', t: 'Export Sea' }, { v: 'IA', t: 'Import Air' }, { v: 'IS', t: 'Import Sea' }]

export function BookingPanel({ email }: { email: EmailData }) {
  const [ext, setExt] = useState<BookingExtractResponse | null>(null)
  const [f, setF] = useState<BookingFields | null>(null)
  const [cargo, setCargo] = useState<CargoLine[]>([])
  const [roles, setRoles] = useState<string[]>([])
  const [resolutions, setResolutions] = useState<Resolution[]>([])
  const [busy, setBusy] = useState(true)
  const [committing, setCommitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function run() {
    setBusy(true); setError(null)
    try {
      const r = await bookingExtract(email)
      setExt(r); setF(r.fields)
      setCargo((r.cargo_lines || []).map((c) => ({ description: c.goods_desc, package_type: null, quantity: c.pieces, weight_kg: c.weight_kg, length_cm: c.length_cm, width_cm: c.width_cm, height_cm: c.height_cm })))
      setRoles(r.parties.map((p) => p.role)); setResolutions(r.parties.map(() => ({ type: 'none' })))
    } catch (e: any) { setError(e.message) } finally { setBusy(false) }
  }
  useEffect(() => { run() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleCommit() {
    if (!f || !ext) return
    if (!f.module) { toast.error('Pick a module (EA/ES/IA/IS) first'); return }
    setCommitting(true)
    try {
      const cargo_lines = cargo.map((c) => ({ pieces: c.quantity, weight_kg: c.weight_kg, length_cm: c.length_cm, width_cm: c.width_cm, height_cm: c.height_cm, goods_desc: c.description }))
      const payload = { fields: f, cargo_lines, parties: ext.parties.map((p, i) => ({ name: p.name, email: p.email, role: roles[i], resolution: resolutions[i] })), low_confidence: ext.low_confidence, email_meta: ext.email_meta }
      const r = await bookingCommit(payload)
      if (r.duplicate) toast.warning(`Booking already exists: ${r.booking_ref}`)
      else toast.success(`Booking ${r.booking_ref} created`, { description: 'Open it in the portal to complete.' })
    } catch (e: any) { toast.error('Commit failed', { description: e.message }) } finally { setCommitting(false) }
  }

  return (
    <>
      {ext?.existing && (
        <div className="mb-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>A booking already exists for this email: <b>{ext.existing.booking_ref}</b>{ext.existing.staff_email ? ` (by ${ext.existing.staff_email})` : ''}.</span>
        </div>
      )}
      <Tabs defaultValue="main" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="main">Booking</TabsTrigger>
          <TabsTrigger value="rates"><Bot className="h-3.5 w-3.5 mr-1" />AI Rates</TabsTrigger>
        </TabsList>
        <TabsContent value="main" className="mt-3 space-y-4">
          <div className="flex justify-end"><button onClick={run} className="text-xs text-muted-foreground inline-flex items-center gap-1"><RefreshCw className={`h-3 w-3 ${busy ? 'animate-spin' : ''}`} />Re-analyse</button></div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {busy ? <div className="space-y-2"><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /></div>
          : f && ext ? (
            <>
              <section className="space-y-1">
                <LSelect label="Module (direction)" value={f.module ?? ''} onChange={(v) => setF({ ...f, module: v })} options={MODULE_OPTS} />
                {!f.module ? <p className="text-[11px] text-amber-600">Pick the module to enable commit.</p> : null}
              </section>
              <PartiesSection parties={ext.parties} roles={roles} resolutions={resolutions} setRoles={setRoles} setResolutions={setResolutions} proceedWord="create the booking" />
              <section className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Routing</p>
                <div className="grid grid-cols-2 gap-2">
                  <LText label="POL" value={f.pol_code ?? ''} onChange={(v) => setF({ ...f, pol_code: v })} />
                  <LText label="POD" value={f.pod_code ?? ''} onChange={(v) => setF({ ...f, pod_code: v })} />
                  <LText label="Origin" value={f.origin ?? ''} onChange={(v) => setF({ ...f, origin: v })} />
                  <LText label="Destination" value={f.destination ?? ''} onChange={(v) => setF({ ...f, destination: v })} />
                  <LText label="Incoterm" value={f.incoterm ?? ''} onChange={(v) => setF({ ...f, incoterm: v })} />
                  <LText label="Commodity" value={f.commodity ?? ''} onChange={(v) => setF({ ...f, commodity: v })} />
                </div>
              </section>
              <section className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Shipper</p>
                <LText label="Address" value={f.shipper_address ?? ''} onChange={(v) => setF({ ...f, shipper_address: v })} />
                <div className="grid grid-cols-2 gap-2">
                  <LText label="City" value={f.shipper_city ?? ''} onChange={(v) => setF({ ...f, shipper_city: v })} />
                  <LText label="Country" value={f.shipper_country ?? ''} onChange={(v) => setF({ ...f, shipper_country: v })} />
                </div>
              </section>
              <section className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Consignee</p>
                <LText label="Address" value={f.consignee_address ?? ''} onChange={(v) => setF({ ...f, consignee_address: v })} />
                <div className="grid grid-cols-2 gap-2">
                  <LText label="City" value={f.consignee_city ?? ''} onChange={(v) => setF({ ...f, consignee_city: v })} />
                  <LText label="Country" value={f.consignee_country ?? ''} onChange={(v) => setF({ ...f, consignee_country: v })} />
                </div>
              </section>
              <section className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Cargo</p>
                <div className="grid grid-cols-3 gap-2">
                  <LNum label="Pieces" value={f.pieces} onChange={(v) => setF({ ...f, pieces: v })} />
                  <LNum label="Gross wt kg" value={f.gross_weight_kg} onChange={(v) => setF({ ...f, gross_weight_kg: v })} />
                  <LNum label="Volume m³" value={f.volume_m3} onChange={(v) => setF({ ...f, volume_m3: v })} />
                </div>
                <CargoLinesEditor lines={cargo} onChange={setCargo} />
              </section>
              <section className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Dates & flags</p>
                <div className="grid grid-cols-2 gap-2">
                  <LText label="Cargo ready" value={f.cargo_ready_date ?? ''} onChange={(v) => setF({ ...f, cargo_ready_date: v })} placeholder="YYYY-MM-DD" />
                  <LText label="ETD" value={f.etd ?? ''} onChange={(v) => setF({ ...f, etd: v })} placeholder="YYYY-MM-DD" />
                </div>
                <div className="flex flex-wrap gap-4">
                  <LCheck label="Dangerous goods" checked={f.is_dg} onChange={(v) => setF({ ...f, is_dg: v })} />
                  <LCheck label="Temp controlled" checked={f.is_temp_controlled} onChange={(v) => setF({ ...f, is_temp_controlled: v })} />
                </div>
              </section>
              {ext.low_confidence.length > 0 ? <p className="text-xs text-amber-600">⚠ Needs review: {ext.low_confidence.join(', ')}</p> : null}
              <Separator />
              <Button className="w-full text-white hover:opacity-90" style={{ backgroundColor: NAVY }} disabled={committing || !f.module} onClick={handleCommit}>
                {committing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                {ext.existing ? 'Open existing booking' : 'Create booking in Portal'}
              </Button>
            </>
          ) : null}
        </TabsContent>
        <TabsContent value="rates" className="mt-3">
          <AiRates initialPol={f?.pol_code ?? ''} initialPod={f?.pod_code ?? ''} initialMode={['EA', 'IA'].includes(f?.module ?? '') ? 'air' : 'sea'} initialType="" accountId={(resolutions.find((r) => r.type === 'customer') as any)?.account_id ?? null} />
        </TabsContent>
      </Tabs>
    </>
  )
}
