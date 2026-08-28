import { type EmailData } from '@/lib/office'

// Placeholder — complaint capture is built once its scope is confirmed.
export function ComplaintsPanel({ email }: { email: EmailData }) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">Log a complaint from this email.</p>
      <p className="text-xs text-muted-foreground">
        Subject: <b className="text-foreground">{email.subject || '(none)'}</b>
      </p>
      <p className="text-[11px] text-amber-600">Complaints capture is coming next.</p>
    </div>
  )
}
