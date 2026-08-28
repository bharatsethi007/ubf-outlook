import { type EmailData } from '@/lib/office'

// Placeholder — email → TMS job extraction is built in the next step.
export function TmsPanel({ email }: { email: EmailData }) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">Add a transport job from this email.</p>
      <p className="text-xs text-muted-foreground">
        Subject: <b className="text-foreground">{email.subject || '(none)'}</b>
      </p>
      <p className="text-[11px] text-amber-600">TMS extraction is coming in the next step.</p>
    </div>
  )
}
