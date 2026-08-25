import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

export function LText({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</Label>
      <Input className="h-8 text-sm" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}
export function LNum({ label, value, onChange, placeholder }: { label: string; value: number | null; onChange: (v: number | null) => void; placeholder?: string }) {
  return (
    <div>
      <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</Label>
      <Input type="number" className="h-8 text-sm" value={value ?? ''} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))} />
    </div>
  )
}
export function LSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { v: string; t: string }[] }) {
  return (
    <div>
      <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</Label>
      <select className="h-8 w-full rounded-md border bg-background px-2 text-sm" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">—</option>
        {options.map((o) => <option key={o.v} value={o.v}>{o.t}</option>)}
      </select>
    </div>
  )
}
export function LCheck({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  )
}
