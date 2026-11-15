import { Menu, Phone, Search, ShoppingBag, Truck, X } from 'lucide-react'
import { BarucLogo } from '@/components/ui/BarucLogo'
import { InstagramIcon } from '@/components/ui/InstagramIcon'
import { STORE_INSTAGRAM_HANDLE, STORE_INSTAGRAM_URL } from '@/config/env'
import { useCart } from '@/features/cart/hooks/useCart'
import { WhatsAppService } from '@/services/whatsapp.service'

interface HeaderProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  onOpenMenu: () => void
  onGoHome: () => void
}

export const Header = ({ searchQuery, onSearchChange, onOpenMenu, onGoHome }: HeaderProps) => {
  const { totalItems, openCart } = useCart()
  const badgeLabel = totalItems > 99 ? '99+' : String(totalItems)

  return (
    <header className="sticky top-0 z-30 border-b border-baruc-gold/25 bg-baruc-green text-white shadow-md">
      <div className="border-b border-baruc-gold/20 bg-baruc-greenDark/95">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-5 gap-y-1 px-4 py-2 text-[11px] font-medium tracking-wide text-neutral-200 sm:justify-between sm:px-6 sm:text-xs lg:px-8">
          <a
            href={STORE_INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 transition-colors hover:text-baruc-gold focus:outline-none focus-visible:ring-2 focus-visible:ring-baruc-gold"
          >
            <InstagramIcon className="h-3.5 w-3.5 text-baruc-gold" aria-hidden="true" />
            {STORE_INSTAGRAM_HANDLE}
          </a>
          <a
            href={WhatsAppService.generateGeneralUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 transition-colors hover:text-baruc-gold focus:outline-none focus-visible:ring-2 focus-visible:ring-baruc-gold"
          >
            <Phone className="h-3.5 w-3.5 text-baruc-gold" aria-hidden="true" />
            83-99909-1885
          </a>
          <span className="inline-flex items-center gap-1.5 font-semibold text-baruc-gold">
            <Truck className="h-3.5 w-3.5" aria-hidden="true" />
            Envio para todo o Brasil
          </span>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-[1fr_auto] items-center gap-x-3 gap-y-3 px-4 py-3 sm:px-6 md:grid-cols-[auto_1fr_auto] md:gap-x-8 lg:px-8">
        <div className="flex items-center gap-2.5 justify-self-start sm:gap-3">
          <button
            type="button"
            onClick={onOpenMenu}
            aria-label="Abrir menu de categorias"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-baruc-gold/40 bg-baruc-greenLight/50 text-baruc-gold transition-colors hover:bg-baruc-gold hover:text-baruc-green active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-baruc-gold"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={onGoHome}
            aria-label="Ir para a página inicial da BARUC"
            className="rounded-lg text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-baruc-gold"
          >
            <BarucLogo />
          </button>
        </div>

        <div className="relative col-span-2 row-start-2 w-full md:col-span-1 md:row-start-1 md:mx-auto md:max-w-xl">
          <label htmlFor="catalog-search" className="sr-only">
            Buscar produtos
          </label>
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-baruc-gold/80"
            aria-hidden="true"
          />
          <input
            id="catalog-search"
            type="search"
            inputMode="search"
            enterKeyHint="search"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            placeholder="Buscar polo, linho, short, jaqueta..."
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            className="h-11 w-full appearance-none rounded-xl border border-baruc-gold/30 bg-baruc-greenDark/90 pl-11 pr-11 text-base text-white placeholder:text-neutral-300 transition-colors focus:border-baruc-gold focus:outline-none focus:ring-2 focus:ring-baruc-gold/25"
          />
          {searchQuery.length > 0 && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Limpar busca"
              className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-neutral-300 transition-colors hover:text-baruc-gold active:scale-95"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={openCart}
          aria-label={`Abrir carrinho com ${totalItems} ${totalItems === 1 ? 'item' : 'itens'}`}
          className="relative inline-flex min-h-[44px] items-center gap-2 justify-self-end rounded-xl border border-baruc-gold/50 bg-baruc-greenLight/60 px-3.5 text-sm font-semibold text-baruc-gold transition-colors hover:bg-baruc-gold hover:text-baruc-green active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-baruc-gold focus-visible:ring-offset-2 focus-visible:ring-offset-baruc-green sm:px-4"
        >
          <ShoppingBag className="h-5 w-5" aria-hidden="true" />
          <span className="hidden sm:inline">Carrinho</span>
          {totalItems > 0 && (
            <span
              aria-hidden="true"
              className="absolute -right-2 -top-2 flex h-6 min-w-6 items-center justify-center rounded-full border-2 border-baruc-green bg-baruc-gold px-1.5 text-xs font-bold text-baruc-green"
            >
              {badgeLabel}
            </span>
          )}
        </button>
      </div>
    </header>
  )
}

