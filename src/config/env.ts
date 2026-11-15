const DEFAULT_WHATSAPP_PHONE = '5583999091885'
const DEFAULT_STORE_NAME = 'BARUC - Loja Masculina'
const DEFAULT_CONTACT_EMAIL = 'contato@baruc.com.br'

export const STORE_INSTAGRAM_HANDLE = '@baruc_lojamf'
export const STORE_INSTAGRAM_URL = 'https://www.instagram.com/baruc_lojamf/'

const sanitizePhone = (raw: string | undefined): string => {
  const digits = (raw ?? '').replace(/\D/g, '')
  return digits.length >= 10 ? digits : DEFAULT_WHATSAPP_PHONE
}

const sanitizeText = (raw: string | undefined, fallback: string): string => {
  const value = (raw ?? '').trim()
  return value.length > 0 ? value : fallback
}

const sanitizeEmail = (raw: string | undefined): string => {
  const value = (raw ?? '').trim()
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? value : DEFAULT_CONTACT_EMAIL
}

export interface AppEnv {
  readonly whatsappPhone: string
  readonly storeName: string
  readonly contactEmail: string
}

export const env: AppEnv = Object.freeze({
  whatsappPhone: sanitizePhone(import.meta.env.VITE_WHATSAPP_PHONE),
  storeName: sanitizeText(import.meta.env.VITE_STORE_NAME, DEFAULT_STORE_NAME),
  contactEmail: sanitizeEmail(import.meta.env.VITE_CONTACT_EMAIL),
})
