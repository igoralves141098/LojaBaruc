const DEFAULT_WHATSAPP_PHONE = '5583999999999'
const DEFAULT_STORE_NAME = 'BARUC - Loja Masculina'

const sanitizePhone = (raw: string | undefined): string => {
  const digits = (raw ?? '').replace(/\D/g, '')
  return digits.length >= 10 ? digits : DEFAULT_WHATSAPP_PHONE
}

const sanitizeText = (raw: string | undefined, fallback: string): string => {
  const value = (raw ?? '').trim()
  return value.length > 0 ? value : fallback
}

export interface AppEnv {
  readonly whatsappPhone: string
  readonly storeName: string
}

export const env: AppEnv = Object.freeze({
  whatsappPhone: sanitizePhone(import.meta.env.VITE_WHATSAPP_PHONE),
  storeName: sanitizeText(import.meta.env.VITE_STORE_NAME, DEFAULT_STORE_NAME),
})
