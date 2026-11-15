import { env } from '@/config/env'

export const EmailService = {
  generateContactUrl(subject = `Atendimento ${env.storeName}`): string {
    const body = `Olá! Vim pelo catálogo online da ${env.storeName} e gostaria de atendimento.`
    return `mailto:${env.contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  },
} as const
