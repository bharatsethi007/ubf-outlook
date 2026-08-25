declare const Office: any

export type EmailData = {
  subject: string
  fromName: string
  fromEmail: string
  receivedIso: string | null
  internetMessageId: string | null
  staffEmail: string
  body: string
}

export function readCurrentEmail(): Promise<EmailData> {
  return new Promise((resolve, reject) => {
    const mailbox = Office?.context?.mailbox
    const item = mailbox?.item
    if (!item) {
      reject(new Error('No email is open. Select a message in your inbox, then open UBF Portal.'))
      return
    }
    const from = item.from || {}
    const base = {
      subject: item.subject || '',
      fromName: from.displayName || '',
      fromEmail: from.emailAddress || '',
      receivedIso: item.dateTimeCreated ? new Date(item.dateTimeCreated).toISOString() : null,
      internetMessageId: item.internetMessageId || null,
      staffEmail: mailbox?.userProfile?.emailAddress || '',
      body: '',
    }
    item.body.getAsync(Office.CoercionType.Text, (res: any) => {
      if (res.status === Office.AsyncResultStatus.Succeeded) resolve({ ...base, body: res.value || '' })
      else reject(new Error(res.error?.message || 'Could not read the email body.'))
    })
  })
}
