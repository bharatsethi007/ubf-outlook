import { FileText, PackageCheck, Truck, MessageSquareWarning } from 'lucide-react'

const NAVY = '#0A2472'
export type AppView = 'quote' | 'booking' | 'tms' | 'complaints'

const TILES: { view: AppView; label: string; Icon: typeof FileText; hint: string }[] = [
  { view: 'quote', label: 'Quote', Icon: FileText, hint: 'Draft a quote from this email' },
  { view: 'booking', label: 'Booking', Icon: PackageCheck, hint: 'Draft a booking from this email' },
  { view: 'tms', label: 'TMS', Icon: Truck, hint: 'Add a transport job' },
  { view: 'complaints', label: 'Complaints', Icon: MessageSquareWarning, hint: 'Log a complaint' },
]

export function Home({ onPick }: { onPick: (v: AppView) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {TILES.map(({ view, label, Icon, hint }) => (
        <button
          key={view}
          onClick={() => onPick(view)}
          className="flex flex-col items-center justify-center gap-2 rounded-xl border bg-card p-4 text-center transition hover:shadow-sm hover:-translate-y-0.5"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full text-white" style={{ backgroundColor: NAVY }}>
            <Icon className="h-5 w-5" />
          </span>
          <span className="text-sm font-medium">{label}</span>
          <span className="text-[11px] leading-tight text-muted-foreground">{hint}</span>
        </button>
      ))}
    </div>
  )
}
