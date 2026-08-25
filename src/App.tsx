import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'sonner'
import { readCurrentEmail, getSavedSecret, saveSecret, type EmailData } from '@/lib/office'
import { Send, Loader2, Bot, KeyRound } from 'lucide-react'

const NAVY = '#0A2472'
const ENDPOINT = 'https://cpnkudbdzgnzmodhsrbf.supabase.co/functions/v1/quote-from-email'

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</Label>
      <p className="text-sm break-words">{value || '—'}</p>
    </div>
  )
}

export default function App() {
  const [email, setEmail] = useState<EmailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [needsSecret, setNeedsSecret] = useState(false)
  const [secretInput, setSecretInput] = useState('')

  useEffect(() => {
    readCurrentEmail()
      .then((e) => setEmail(e))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  async function handleSaveSecret() {
    const val = secretInput.trim()
    if (!val) return
    try {
      await saveSecret(val)
      setSecretInput('')
      setNeedsSecret(false)
      toast.success('Connected. Try Send again.')
    } catch (e: any) {
      toast.error('Could not save', { description: e.message })
    }
  }

  async function handleSend() {
    if (!email) return
    const secret = getSavedSecret()
    if (!secret) { setNeedsSecret(true); return }
    setSending(true)
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-ubf-secret': secret },
        body: JSON.stringify(email),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.ok) {
        const msg = String(data.error || `HTTP ${res.status}`)
        if (res.status === 401 || msg.toLowerCase().includes('unauthor')) {
          setNeedsSecret(true)
          toast.error('Secret rejected — re-enter it below.')
        } else {
          toast.error('Send failed', { description: msg })
        }
        return
      }
      toast.success(`Draft quote ${data.quote_no} created`, {
        description: data.low_confidence?.length
          ? `Review in portal: ${data.low_confidence.join(', ')}`
          : 'Open it in the portal to complete and send.',
      })
    } catch (e: any) {
      toast.error('Send failed', { description: e.message })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-3">
      <Toaster position="top-center" richColors />
      <header className="flex items-center justify-between mb-3">
        <img src={`${import.meta.env.BASE_URL}assets/ubf-logo.png`} alt="UB Freight" className="h-6" />
        <button
          className="text-muted-foreground hover:text-foreground"
          title="Set access key"
          onClick={() => setNeedsSecret((v) => !v)}
        >
          <KeyRound className="h-4 w-4" />
        </button>
      </header>

      {needsSecret && (
        <Card className="mb-3 border-dashed">
          <CardContent className="py-3 space-y-2">
            <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">
              UBF access key (one-time)
            </Label>
            <input
              type="password"
              className="w-full rounded-md border px-2 py-1 text-sm bg-background"
              placeholder="Paste the key"
              value={secretInput}
              onChange={(e) => setSecretInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSaveSecret() }}
            />
            <Button size="sm" className="w-full" onClick={handleSaveSecret}>Save key</Button>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="quote" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="quote">Quote</TabsTrigger>
          <TabsTrigger value="assistant">
            <Bot className="h-3.5 w-3.5 mr-1" />
            Assistant
          </TabsTrigger>
        </TabsList>

        <TabsContent value="quote" className="mt-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Send quote to Portal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {error ? (
                <p className="text-sm text-destructive">{error}</p>
              ) : loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : email ? (
                <>
                  <Field label="Subject" value={email.subject || '(no subject)'} />
                  <Field
                    label="From"
                    value={`${email.fromName} ${email.fromEmail ? '<' + email.fromEmail + '>' : ''}`.trim()}
                  />
                  <div>
                    <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Body</Label>
                    <ScrollArea className="h-40 mt-1 rounded-md border bg-muted/30 p-2">
                      <p className="text-xs whitespace-pre-wrap text-muted-foreground">
                        {email.body || '(empty)'}
                      </p>
                    </ScrollArea>
                  </div>
                  <Badge variant="secondary" className="text-[11px]">Ready to send</Badge>
                </>
              ) : null}

              <Separator />
              <Button
                className="w-full text-white hover:opacity-90"
                style={{ backgroundColor: NAVY }}
                disabled={!email || sending}
                onClick={handleSend}
              >
                {sending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                Send to UBF Portal
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assistant" className="mt-3">
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              <Bot className="h-6 w-6 mx-auto mb-2 opacity-60" />
              Assistant chat lands here next — the shadcn chat UI drops straight in.
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
