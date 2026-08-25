import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { CargoLine } from '@/lib/types'
import { X, Plus } from 'lucide-react'

export function CargoLinesEditor({ lines, onChange }: { lines: CargoLine[]; onChange: (l: CargoLine[]) => void }) {
  const upd = (i: number, k: keyof CargoLine, v: any) => { const n = [...lines]; (n[i] as any)[k] = v; onChange(n) }
  const num = (v: string) => (v === '' ? null : Number(v))
  const add = () => onChange([...lines, { description: '', package_type: '', quantity: 1, weight_kg: null, length_cm: null, width_cm: null, height_cm: null }])
  const del = (i: number) => onChange(lines.filter((_, j) => j !== i))

  return (
    <div className="space-y-2">
      {lines.map((ln, i) => (
        <div key={i} className="rounded-md border p-2 space-y-1">
          <div className="flex items-center gap-1">
            <Input className="h-7 text-xs flex-1" placeholder="Description" value={ln.description ?? ''} onChange={(e) => upd(i, 'description', e.target.value)} />
            <button onClick={() => del(i)} className="text-muted-foreground hover:text-destructive"><X className="h-4 w-4" /></button>
          </div>
          <div className="grid grid-cols-3 gap-1">
            <Input className="h-7 text-xs" placeholder="Pkg type" value={ln.package_type ?? ''} onChange={(e) => upd(i, 'package_type', e.target.value)} />
            <Input className="h-7 text-xs" type="number" placeholder="Qty" value={ln.quantity ?? ''} onChange={(e) => upd(i, 'quantity', num(e.target.value))} />
            <Input className="h-7 text-xs" type="number" placeholder="Wt kg" value={ln.weight_kg ?? ''} onChange={(e) => upd(i, 'weight_kg', num(e.target.value))} />
          </div>
          <div className="grid grid-cols-3 gap-1">
            <Input className="h-7 text-xs" type="number" placeholder="L cm" value={ln.length_cm ?? ''} onChange={(e) => upd(i, 'length_cm', num(e.target.value))} />
            <Input className="h-7 text-xs" type="number" placeholder="W cm" value={ln.width_cm ?? ''} onChange={(e) => upd(i, 'width_cm', num(e.target.value))} />
            <Input className="h-7 text-xs" type="number" placeholder="H cm" value={ln.height_cm ?? ''} onChange={(e) => upd(i, 'height_cm', num(e.target.value))} />
          </div>
        </div>
      ))}
      <button onClick={add} className="inline-flex items-center gap-1 text-xs text-[#0A2472]"><Plus className="h-3 w-3" /> Add cargo line</button>
      {lines.length === 0 ? <p className="text-xs text-muted-foreground">No cargo lines detected.</p> : null}
    </div>
  )
}
