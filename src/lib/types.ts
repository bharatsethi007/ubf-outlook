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

export type RateOption = {
  product: 'FCL' | 'LCL' | 'AIR'
  carrier: string | null
  container_type: string | null
  buy: number | null
  sell: number | null
  currency: string | null
  transit_days: number | null
  via: string | null
  valid_to: string | null
  confidence: string | null
  unit: string | null
  min_charge?: number | null
  air_breaks?: Record<string, number | null>
}
export type PastQuote = {
  quote_no: string
  customer: string | null
  status: string
  mode: string | null
  type: string | null
  pol: string | null
  pod: string | null
  created_at: string
  total_sell: number | null
  currency: string | null
  margin_pct: number | null
}

export type BookingCargoRaw = {
  ord?: number
  pieces: number | null
  weight_kg: number | null
  length_cm: number | null
  width_cm: number | null
  height_cm: number | null
  goods_desc: string | null
}
export type BookingFields = {
  module: string | null
  incoterm: string | null
  origin: string | null
  destination: string | null
  pol_code: string | null
  pod_code: string | null
  commodity: string | null
  goods_description: string | null
  packing_type: string | null
  pieces: number | null
  gross_weight_kg: number | null
  volume_m3: number | null
  shipper_address: string | null
  shipper_city: string | null
  shipper_country: string | null
  shipper_phone: string | null
  shipper_email: string | null
  consignee_address: string | null
  consignee_city: string | null
  consignee_country: string | null
  consignee_phone: string | null
  consignee_email: string | null
  notify_name: string | null
  notify_address: string | null
  notify_country: string | null
  cargo_ready_date: string | null
  etd: string | null
  is_dg: boolean
  un_number: string | null
  dg_class: string | null
  is_temp_controlled: boolean
  temp_range: string | null
}
export type BookingExistingRef = { booking_ref: string; created_at: string; staff_email: string | null }
export type BookingExtractResponse = {
  ok: boolean
  doc_type: string
  existing: BookingExistingRef | null
  module_guess: string | null
  fields: BookingFields
  cargo_lines: BookingCargoRaw[]
  parties: Party[]
  low_confidence: string[]
  email_meta: Record<string, unknown>
  error?: string
}

export type TmsCargoRaw = {
  ord?: number
  type: string
  units: number | null
  weight_kg: number | null
  length_cm: number | null
  width_cm: number | null
  height_cm: number | null
  marks: string | null
}
export type TmsFields = {
  order_type: string
  sender_company: string | null
  sender_contact: string | null
  sender_phone: string | null
  sender_email: string | null
  sender_address: string | null
  sender_additional_info: string | null
  receiver_company: string | null
  receiver_contact: string | null
  receiver_phone: string | null
  receiver_email: string | null
  receiver_address: string | null
  receiver_additional_info: string | null
  preferred_pickup_at: string | null
  preferred_delivery_at: string | null
  reference: string | null
  po_number: string | null
  delivery_instructions: string | null
  urgent: boolean
  tail_lift_required: boolean
  fragile: boolean
  temperature_control: boolean
  signature_required: boolean
  is_dg: boolean
  dangerous_goods_reason: string | null
}
export type TmsExistingRef = { consignment_no: string; created_at: string; staff_email: string | null }
export type TmsExtractResponse = {
  ok: boolean
  doc_type: string
  existing: TmsExistingRef | null
  fields: TmsFields
  cargo_lines: TmsCargoRaw[]
  low_confidence: string[]
  email_meta: Record<string, unknown>
  error?: string
}
