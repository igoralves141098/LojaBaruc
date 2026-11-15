import { useEffect, useId, useRef } from 'react'
import { ChevronRight, Home, Layers, Mail, MessageCircle, X } from 'lucide-react'
import { BarucLogo } from '@/components/ui/BarucLogo'
import { env } from '@/config/env'
import {
  ALL_CATEGORIES,
  ALL_PRODUCTS_TAB,
  type CategoryFilterValue,
  type NicheGroup,
} from '@/features/catalog/hooks/useCatalog'
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock'
import { EmailService } from '@/services/email.service'
import { WhatsAppService } from '@/services/whatsapp.service'

interface SidebarMenuProps {
  isOpen: boolean
  onClose: () => void
  onGoHome: () => void
  nicheGroups: NicheGroup[]
  totalProducts: number
  selectedCategory: CategoryFilterValue
  onSelectCategory: (category: CategoryFilterValue) => void
}

export const SidebarMenu = ({
  isOpen,
  onClose,
  onGoHome,
  nicheGroups,
  totalProducts,
  selectedCategory,
  onSelectCategory,
}: SidebarMenuProps) => {
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const titleId = useId()

  useBodyScrollLock(isOpen)

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    const focusTimer = window.setTimeout(() => closeButtonRef.current?.focus({ preventScroll: true }), 50)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.clearTimeout(focusTimer)
    }
  }, [isOpen, onClose])

  const handleSelect = (category: CategoryFilterValue) => {
    onSelectCategory(category)
    onClose()
  }

  const handleHome = () => {
    onGoHome()
    onClose()
  }

  return (
    <div className={isOpen ? 'pointer-events-auto' : 'pointer-events-none'} aria-hidden={!isOpen} inert={!isOpen}>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`fixed inset-y-0 left-0 z-50 flex w-full max-w-xs flex-col bg-baruc-cream shadow-2xl transition-transform duration-300 ease-out will-change-transform sm:max-w-sm ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <header className="flex items-center justify-between gap-3 border-b border-baruc-gold/30 bg-baruc-green px-5 pb-4 pt-[calc(1rem+env(safe-area-inset-top))] text-baruc-gold">
          <div className="flex items-center gap-3">
            <BarucLogo variant="monogram" className="h-9" />
            <div>
              <h2 id={titleId} className="font-serif text-xl font-semibold leading-none tracking-wide text-baruc-gold">
                Menu
              </h2>
              <p className="mt-1 text-xs text-baruc-gold/80">{env.storeName}</p>
            </div>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Fechar menu"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-baruc-gold/30 transition-colors hover:bg-baruc-greenLight active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-baruc-gold"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        <nav
          aria-label="Navegação da loja"
          className="no-scrollbar flex flex-1 flex-col gap-5 overflow-y-auto overscroll-contain px-4 py-5"
        >
          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              onClick={handleHome}
              className={`flex min-h-[44px] w-full items-center justify-between rounded-xl border px-3.5 text-sm font-semibold transition-all active:scale-[0.98] ${
                selectedCategory === ALL_CATEGORIES
                  ? 'border-baruc-gold bg-baruc-green text-baruc-gold shadow-sm'
                  : 'border-neutral-200 bg-white text-neutral-800 hover:border-baruc-gold'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Home className="h-4 w-4 text-baruc-goldDark" aria-hidden="true" />
                Página Inicial
              </span>
              <ChevronRight className="h-4 w-4 opacity-70" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => handleSelect(ALL_PRODUCTS_TAB)}
              className={`flex min-h-[44px] w-full items-center justify-between rounded-xl border px-3.5 text-sm font-semibold transition-all active:scale-[0.98] ${
                selectedCategory === ALL_PRODUCTS_TAB
                  ? 'border-baruc-gold bg-baruc-green text-baruc-gold shadow-sm'
                  : 'border-neutral-200 bg-white text-neutral-800 hover:border-baruc-gold'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Layers className="h-4 w-4 text-baruc-goldDark" aria-hidden="true" />
                Todos os Produtos
              </span>
              <span className="rounded-full bg-baruc-goldLight px-2 py-0.5 text-xs font-bold text-baruc-green tabular-nums">
                {totalProducts}
              </span>
            </button>
          </div>

          {nicheGroups.map((group) => {
            const isMacroActive = selectedCategory === group.niche
            const hasMultipleSubcategories = group.categories.length > 1

            return (
              <section key={group.niche} className="flex flex-col gap-2">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.22em] text-baruc-goldDark">
                    {group.niche}
                  </h3>
                  {hasMultipleSubcategories && (
                    <button
                      type="button"
                      onClick={() => handleSelect(group.niche)}
                      aria-current={isMacroActive ? 'true' : undefined}
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition-colors ${
                        isMacroActive
                          ? 'bg-baruc-green text-baruc-gold'
                          : 'bg-baruc-goldLight/80 text-baruc-green hover:bg-baruc-gold/40'
                      }`}
                    >
                      Ver todas ({group.totalCount})
                    </button>
                  )}
                </div>
                <ul className="flex flex-col gap-1.5">
                  {group.categories.map(({ name, count }) => {
                    const isActive = selectedCategory === name
                    return (
                      <li key={name}>
                        <button
                          type="button"
                          onClick={() => handleSelect(name)}
                          aria-current={isActive ? 'true' : undefined}
                          className={`flex min-h-[42px] w-full items-center justify-between rounded-xl border px-3.5 text-left text-sm transition-all active:scale-[0.98] ${
                            isActive
                              ? 'border-baruc-gold bg-baruc-green font-semibold text-baruc-gold shadow-sm'
                              : 'border-neutral-200/80 bg-white font-medium text-neutral-700 hover:border-baruc-gold'
                          }`}
                        >
                          <span className="truncate pr-2">{name}</span>
                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${
                              isActive ? 'bg-baruc-gold text-baruc-green' : 'bg-neutral-100 text-neutral-600'
                            }`}
                          >
                            {count}
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </section>
            )
          })}
        </nav>

        <footer className="flex flex-col gap-2 border-t border-baruc-gold/30 bg-white px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4">
          <a
            href={WhatsAppService.generateGeneralUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-baruc-gold bg-baruc-green px-4 text-sm font-bold text-baruc-gold shadow-sm transition-all hover:bg-baruc-greenDark active:scale-[0.98]"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            Atendimento WhatsApp
          </a>
          <a
            href={EmailService.generateContactUrl()}
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-baruc-cream px-4 text-sm font-semibold text-baruc-green transition-all hover:border-baruc-gold active:scale-[0.98]"
          >
            <Mail className="h-4 w-4 text-baruc-goldDark" aria-hidden="true" />
            Enviar E-mail
          </a>
        </footer>
      </aside>
    </div>
  )
}
