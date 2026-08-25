import { getSavedSecret } from './office'
import type { RateOption, PastQuote } from './types'

const BASE = 'https://cpnkudbdzgnzmodhsrbf.supabase.co/functions/v1'

async function post(path: string, body: unknown): Promise<any> {
  const secret = getSavedSecret()
  if (!secret) { const e: any = new Error('No access key'); e.code = 'NO_SECRET'; throw e }
  const res = await fetch(`${BASE}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-ubf-secret': secret },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (res.status === 401) { const e: any = new Error('unauthorized'); e.code = 'UNAUTH'; throw e }
  if (!res.ok || data.ok === false) throw new Error(data.error || `HTTP ${res.status}`)
  return data
}

export const extractQuote = (email: unknown) => post('quote-extract', email)
export const searchEntities = (query: string) =>
  post('entity-search', { query }) as Promise<{ customers: any[]; agents: any[] }>
export const commitQuote = (payload: unknown) => post('quote-commit', payload)

export const searchRates = (body: { pol?: string; pod: string; mode?: string; type?: string; container?: string }) =>
  post('rate-search', body) as Promise<{ options: RateOption[] }>
export const similarQuotes = (body: { pol?: string; pod?: string; account?: string }) =>
  post('similar-quotes', body) as Promise<{ quotes: PastQuote[] }>
