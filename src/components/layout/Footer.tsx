import { Clock, Mail, MapPin, MessageCircle } from 'lucide-react'
import { BarucLogo } from '@/components/ui/BarucLogo'
import { env } from '@/config/env'
import { EmailService } from '@/services/email.service'
import { WhatsAppService } from '@/services/whatsapp.service'

export const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="mt-auto border-t border-baruc-gold/25 bg-baruc-green text-neutral-200">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3 lg:px-8">
        <div className="flex flex-col gap-4">
          <BarucLogo />
          <p className="max-w-xs text-sm leading-relaxed text-neutral-300">
            Moda masculina com curadoria, acabamento impecável e atendimento personalizado. Escolha suas peças e
            finalize direto pelo WhatsApp.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="font-serif text-xl font-semibold tracking-wide text-baruc-gold">Funcionamento</h2>
          <p className="flex items-start gap-2 text-sm text-neutral-300">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-baruc-gold" aria-hidden="true" />
            Segunda a Sábado • 9h às 19h
          </p>
          <p className="flex items-start gap-2 text-sm text-neutral-300">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-baruc-gold" aria-hidden="true" />
            Entregas na região e retirada na loja
          </p>
        </div>

        <div className="flex flex-col gap-3 md:items-end md:text-right">
          <h2 className="font-serif text-xl font-semibold tracking-wide text-baruc-gold">Atendimento</h2>
          <p className="text-sm text-neutral-300">Dúvidas sobre tamanhos, trocas ou pagamentos?</p>
          <div className="flex flex-wrap gap-2 md:justify-end">
            <a
              href={WhatsAppService.generateGeneralUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-baruc-gold bg-baruc-gold px-5 text-sm font-bold text-baruc-green shadow-sm transition-all hover:bg-baruc-goldDark active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-baruc-gold focus-visible:ring-offset-2 focus-visible:ring-offset-baruc-green"
            >
              <MessageCircle className="h-5 w-5" aria-hidden="true" />
              Falar no WhatsApp
            </a>
            <a
              href={EmailService.generateContactUrl()}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-baruc-gold/40 bg-baruc-greenLight/50 px-4 text-sm font-semibold text-baruc-gold transition-all hover:border-baruc-gold hover:bg-baruc-greenLight active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-baruc-gold focus-visible:ring-offset-2 focus-visible:ring-offset-baruc-green"
            >
              <Mail className="h-4 w-4" aria-hidden="true" />
              Enviar E-mail
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-baruc-gold/15">
        <p className="mx-auto max-w-7xl px-4 py-5 text-center text-xs tracking-wide text-neutral-400 sm:px-6 lg:px-8">
          © {currentYear} {env.storeName}. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  )
}
