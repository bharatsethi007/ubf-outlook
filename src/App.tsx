import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'sonner'
import { readCurrentEmail, getSavedSecret, saveSecret, type EmailData } from '@/lib/office'
import { QuotePanel } from '@/components/QuotePanel'
import { BookingPanel } from '@/components/BookingPanel'
import { TmsPanel } from '@/components/TmsPanel'
import { CsFeedbackPanel } from '@/components/CsFeedbackPanel'
import { Home, type AppView } from '@/components/Home'
import { KeyRound, ChevronLeft } from 'lucide-react'

type View = 'home' | AppView
const TITLES: Record<AppView, string> = { quote: 'Quote', booking: 'Booking', tms: 'TMS', cs_feedback: 'CS Feedbacks' }

function initialView(): View {
  try {
    const m = new URLSearchParams(window.location.search).get('mode')
    if (m === 'quote' || m === 'booking' || m === 'tms' || m === 'cs_feedback') return m
  } catch { /* noop */ }
  return 'home'
}

export default function App() {
  const [view, setView] = useState<View>(initialView())
  const [email, setEmail] = useState<EmailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [needsSecret, setNeedsSecret] = useState(false)
  const [secretInput, setSecretInput] = useState('')
  const [hasSecret, setHasSecret] = useState(!!getSavedSecret())

  useEffect(() => {
    readCurrentEmail().then(setEmail).catch((e) => setError(e.message)).finally(() => setLoading(false))
    if (!getSavedSecret()) setNeedsSecret(true)
  }, [])

  async function handleSaveSecret() {
    const v = secretInput.trim(); if (!v) return
    try { await saveSecret(v); setSecretInput(''); setNeedsSecret(false); setHasSecret(true) }
    catch (e: any) { toast.error('Could not save', { description: e.message }) }
  }

  const onHome = view === 'home'

  return (
    <div className="min-h-screen bg-background text-foreground p-3">
      <Toaster position="top-center" richColors />
      <header className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {!onHome && (
            <button title="Back to menu" onClick={() => setView('home')} className="text-muted-foreground hover:text-foreground">
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          <img src={`${import.meta.env.BASE_URL}assets/ubf-logo.png`} alt="UB Freight" className="h-6" />
        </div>
        <button title="Set access key" onClick={() => setNeedsSecret((v) => !v)} className="text-muted-foreground hover:text-foreground"><KeyRound className="h-4 w-4" /></button>
      </header>

      <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-3">
        UBF Intelligence{onHome ? '' : ` · ${TITLES[view]}`}
      </p>

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

      {error ? <p className="text-sm text-destructive mb-2">{error}</p> : null}

      {onHome ? (
        <Home onPick={setView} />
      ) : loading ? (
        <p className="text-sm text-muted-foreground">Reading email…</p>
      ) : !hasSecret ? (
        <p className="text-sm text-muted-foreground">Enter your access key to begin.</p>
      ) : !email ? (
        <p className="text-sm text-muted-foreground">Open an email to analyse it.</p>
      ) : view === 'quote' ? (
        <QuotePanel key="q" email={email} />
      ) : view === 'booking' ? (
        <BookingPanel key="b" email={email} />
      ) : view === 'tms' ? (
        <TmsPanel key="t" email={email} />
      ) : (
        <CsFeedbackPanel key="c" email={email} />
      )}
    </div>
  )
}
