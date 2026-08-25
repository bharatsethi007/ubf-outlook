export type Match = {
  account_id?: string
  id?: string
  name: string
  city?: string | null
  country?: string | null
  trusted?: boolean
  score: number
}
export type Party = {
  name: string
  email: string | null
  role: string
  customer_matches: Match[]
  agent_matches: Match[]
}
export type CargoLine = {
  ord?: number
  description: string | null
  package_type: string | null
  quantity: number | null
  weight_kg: number | null
  length_cm: number | null
  width_cm: number | null
  height_cm: number | null
}
export type Fields = {
  shipment_mode: string | null
  shipment_type: string | null
  incoterms: string | null
  origin: string | null
  destination: string | null
  pol_code: string | null
  pod_code: string | null
  pickup_address: string | null
  commodity: string | null
  cargo_value: number | null
  cargo_value_currency: string | null
  is_hazardous: boolean
  need_refrigeration: boolean
  reefer_temp_c: number | null
  dg_un_number: string | null
  dg_class: string | null
}
export type ExistingQuote = { quote_no: string; created_at: string; staff_email: string | null }
export type ExtractResponse = {
  ok: boolean
  doc_type: string
  existing: ExistingQuote | null
  fields: Fields
  cargo_lines: CargoLine[]
  parties: Party[]
  low_confidence: string[]
  email_meta: Record<string, unknown>
  error?: string
}
export type Resolution =
  | { type: 'customer'; account_id: string; name: string }
  | { type: 'agent'; id: string; name: string }
  | { type: 'create_customer'; name: string }
  | { type: 'create_agent'; name: string }
  | { type: 'none' }
