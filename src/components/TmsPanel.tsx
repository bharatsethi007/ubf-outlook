import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { type EmailData } from '@/lib/office'
import { tmsExtract, tmsCommit } from '@/lib/api'
import { LText, LNum, LSelect, LCheck } from '@/components/fields'
import type { TmsExtractResponse, TmsFields, TmsCargoRaw } from '@/lib/types'
import { Send, Loader2, RefreshCw, AlertTriangle, Plus, Trash2 } from 'lucide-react'

const NAVY = '#0A2472'
const ORDER_OPTS = [{ v: 'transfer', t: 'Transfer (pickup + delivery)' }, { v: 'pick-up', t: 'Pick-up only' }, { v: 'drop-off', t: 'Drop-off only' }]
const CARGO_OPTS = [{ v: 'carton', t: 'Carton' }, { v: 'pallet', t: 'Pallet' }]
const emptyLine = (): TmsCargoRaw => ({ type: 'carton', units: null, weight_kg: null, length_cm: null, width_cm: null, height_cm: null, marks: null })

export function TmsPanel({ email }: { email: EmailData }) {
  const [ext, setExt] = useState<TmsExtractResponse | null>(null)
  const [f, setF] = useState<TmsFields | null>(null)
  const [cargo, setCargo] = useState<TmsCargoRaw[]>([])
  const [busy, setBusy] = useState(true)
  const [committing, setCommitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function run() {
    setBusy(true); setError(null)
    try {
      const r = await tmsExtract(email)
      setExt(r); setF(r.fields); setCargo(r.cargo_lines?.length ? r.cargo_lines : [emptyLine()])
    } catch (e: any) { setError(e.message) } finally { setBusy(false) }
  }
  useEffect(() => { run() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const set = (patch: Partial<TmsFields>) => setF((p) => (p ? { ...p, ...patch } : p))
  const setLine = (i: number, patch: Partial<TmsCargoRaw>) => setCargo((ls) => ls.map((l, j) => (j === i ? { ...l, ...patch } : l)))

  async function handleCommit() {
    if (!f || !ext) return
    setCommitting(true)
    try {
      const payload = { fields: f, cargo_lines: cargo, low_confidence: ext.low_confidence, email_meta: ext.email_meta }
      const r = await tmsCommit(payload)
      if (r.duplicate) toast.warning(`Job already added: ${r.consignment_no}`)
      else toast.success(`Job ${r.consignment_no} added to dispatch`, { description: 'Open the dispatch board to assign a driver.' })
    } catch (e: any) { toast.error('Could not add job', { description: e.message }) } finally { setCommitting(false) }
  }

  return (
    <>
      {ext?.existing && (
        <div className="mb-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>A job already exists for this email: <b>{ext.existing.consignment_no}</b>{ext.existing.staff_email ? ` (by ${ext.existing.staff_email})` : ''}.</span>
        </div>
      )}

      <div className="flex justify-end mb-2">
        <button onClick={run} className="text-xs text-muted-foreground inline-flex items-center gap-1"><RefreshCw className={`h-3 w-3 ${busy ? 'animate-spin' : ''}`} />Re-analyse</button>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {busy ? <div className="space-y-2"><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /></div>
      : f ? (
        <div className="space-y-4">
          <LSelect label="Job type" value={f.order_type} onChange={(v) => set({ order_type: v || 'transfer' })} options={ORDER_OPTS} />

          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">Collection (pickup)</p>
            <div className="grid grid-cols-2 gap-2">
              <LText label="Company" value={f.sender_company ?? ''} onChange={(v) => set({ sender_company: v || null })} />
              <LText label="Contact" value={f.sender_contact ?? ''} onChange={(v) => set({ sender_contact: v || null })} />
              <LText label="Phone" value={f.sender_phone ?? ''} onChange={(v) => set({ sender_phone: v || null })} />
              <LText label="Email" value={f.sender_email ?? ''} onChange={(v) => set({ sender_email: v || null })} />
            </div>
            <div className="mt-2"><LText label="Address" value={f.sender_address ?? ''} onChange={(v) => set({ sender_address: v || null })} /></div>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">Delivery (drop-off)</p>
            <div className="grid grid-cols-2 gap-2">
              <LText label="Company" value={f.receiver_company ?? ''} onChange={(v) => set({ receiver_company: v || null })} />
              <LText label="Contact" value={f.receiver_contact ?? ''} onChange={(v) => set({ receiver_contact: v || null })} />
              <LText label="Phone" value={f.receiver_phone ?? ''} onChange={(v) => set({ receiver_phone: v || null })} />
              <LText label="Email" value={f.receiver_email ?? ''} onChange={(v) => set({ receiver_email: v || null })} />
            </div>
            <div className="mt-2"><LText label="Address" value={f.receiver_address ?? ''} onChange={(v) => set({ receiver_address: v || null })} /></div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <LText label="Pickup by" value={f.preferred_pickup_at ?? ''} onChange={(v) => set({ preferred_pickup_at: v || null })} placeholder="2026-08-29 09:00" />
            <LText label="Deliver by" value={f.preferred_delivery_at ?? ''} onChange={(v) => set({ preferred_delivery_at: v || null })} placeholder="2026-08-29 15:00" />
            <LText label="Reference" value={f.reference ?? ''} onChange={(v) => set({ reference: v || null })} />
            <LText label="PO number" value={f.po_number ?? ''} onChange={(v) => set({ po_number: v || null })} />
          </div>
          <LText label="Delivery instructions" value={f.delivery_instructions ?? ''} onChange={(v) => set({ delivery_instructions: v || null })} />

          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <LCheck label="Urgent" checked={f.urgent} onChange={(v) => set({ urgent: v })} />
            <LCheck label="Tail-lift" checked={f.tail_lift_required} onChange={(v) => set({ tail_lift_required: v })} />
            <LCheck label="Fragile" checked={f.fragile} onChange={(v) => set({ fragile: v })} />
            <LCheck label="Temp control" checked={f.temperature_control} onChange={(v) => set({ temperature_control: v })} />
            <LCheck label="Signature" checked={f.signature_required} onChange={(v) => set({ signature_required: v })} />
            <LCheck label="Dangerous goods" checked={f.is_dg} onChange={(v) => set({ is_dg: v })} />
          </div>
          {f.is_dg ? <LText label="DG reason" value={f.dangerous_goods_reason ?? ''} onChange={(v) => set({ dangerous_goods_reason: v || null })} /> : null}

          <Separator />
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Cargo</p>
              <button onClick={() => setCargo((ls) => [...ls, emptyLine()])} className="text-xs text-muted-foreground inline-flex items-center gap-1"><Plus className="h-3 w-3" />Add line</button>
            </div>
            <div className="space-y-3">
              {cargo.map((ln, i) => (
                <div key={i} className="rounded-md border p-2 space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <LSelect label="Type" value={ln.type} onChange={(v) => setLine(i, { type: v || 'carton' })} options={CARGO_OPTS} />
                    <LNum label="Units" value={ln.units} onChange={(v) => setLine(i, { units: v })} />
                    <LNum label="Weight kg" value={ln.weight_kg} onChange={(v) => setLine(i, { weight_kg: v })} />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <LNum label="L cm" value={ln.length_cm} onChange={(v) => setLine(i, { length_cm: v })} />
                    <LNum label="W cm" value={ln.width_cm} onChange={(v) => setLine(i, { width_cm: v })} />
                    <LNum label="H cm" value={ln.height_cm} onChange={(v) => setLine(i, { height_cm: v })} />
                  </div>
                  {cargo.length > 1 ? (
                    <button onClick={() => setCargo((ls) => ls.filter((_, j) => j !== i))} className="text-xs text-destructive inline-flex items-center gap-1"><Trash2 className="h-3 w-3" />Remove</button>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          {ext?.low_confidence?.length ? (
            <p className="text-[11px] text-amber-600">Check the highlighted-risk fields: {ext.low_confidence.join(', ')}.</p>
          ) : null}

          <Button className="w-full text-white hover:opacity-90" style={{ backgroundColor: NAVY }} disabled={committing} onClick={handleCommit}>
            {committing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
            {ext?.existing ? `Already on dispatch (${ext.existing.consignment_no})` : 'Add job to dispatch'}
          </Button>
        </div>
      ) : null}
    </>
  )
}
