const DEFAULT_WHATSAPP_PHONE = '5583999091885'
const DEFAULT_WHATSAPP_DISPLAY = '83-99909-1885'
const DEFAULT_STORE_NAME = 'BARUC - Loja Masculina'
const DEFAULT_CONTACT_EMAIL = 'contato@baruc.com.br'
const DEFAULT_INSTAGRAM_HANDLE = '@baruc_lojamf'
const DEFAULT_INSTAGRAM_URL = 'https://www.instagram.com/baruc_lojamf/'

const sanitizePhone = (raw: string | undefined): string => {
  const digits = (raw ?? '').replace(/\D/g, '')
  return digits.length >= 10 ? digits : DEFAULT_WHATSAPP_PHONE
}

const sanitizeText = (raw: string | undefined, fallback: string): string => {
  const value = (raw ?? '').trim()
  return value.length > 0 ? value : fallback
}

const sanitizeInstagramHandle = (raw: string | undefined): string => {
  const value = (raw ?? '').trim().replace(/^@+/, '')
  return value.length > 0 ? `@${value}` : DEFAULT_INSTAGRAM_HANDLE
}

const sanitizeUrl = (raw: string | undefined, fallback: string): string => {
  const value = (raw ?? '').trim()
  return /^https?:\/\//i.test(value) ? value : fallback
}

const sanitizeEmail = (raw: string | undefined): string => {
  const value = (raw ?? '').trim()
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? value : DEFAULT_CONTACT_EMAIL
}

export interface AppEnv {
  readonly whatsappPhone: string
  readonly whatsappDisplay: string
  readonly storeName: string
  readonly contactEmail: string
  readonly instagramHandle: string
  readonly instagramUrl: string
}

export const env: AppEnv = Object.freeze({
  whatsappPhone: sanitizePhone(import.meta.env.VITE_WHATSAPP_PHONE),
  whatsappDisplay: sanitizeText(import.meta.env.VITE_WHATSAPP_DISPLAY, DEFAULT_WHATSAPP_DISPLAY),
  storeName: sanitizeText(import.meta.env.VITE_STORE_NAME, DEFAULT_STORE_NAME),
  contactEmail: sanitizeEmail(import.meta.env.VITE_CONTACT_EMAIL),
  instagramHandle: sanitizeInstagramHandle(import.meta.env.VITE_INSTAGRAM_HANDLE),
  instagramUrl: sanitizeUrl(import.meta.env.VITE_INSTAGRAM_URL, DEFAULT_INSTAGRAM_URL),
})
