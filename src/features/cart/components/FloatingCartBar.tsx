import { ChevronRight, ShoppingBag } from 'lucide-react'
import { useCart } from '@/features/cart/hooks/useCart'
import { formatCurrency, formatPrice } from '@/utils/formatters'

export const FloatingCartBar = () => {
  const { totalItems, totalPrice, hasPriceOnRequest, isOpen, openCart } = useCart()

  if (totalItems === 0 || isOpen) return null

  return (
    <div className="bottom-safe fixed inset-x-4 z-30 animate-slide-up sm:hidden">
      <button
        type="button"
        onClick={openCart}
        className="flex min-h-[56px] w-full items-center justify-between gap-3 rounded-2xl border border-baruc-gold/50 bg-baruc-green px-4 py-2.5 text-left shadow-2xl shadow-baruc-green/40 transition-transform active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-baruc-gold"
      >
        <span className="flex items-center gap-3">
          <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-baruc-greenLight">
            <ShoppingBag className="h-5 w-5 text-baruc-gold" aria-hidden="true" />
            <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-baruc-gold px-1 text-[11px] font-bold text-baruc-green">
              {totalItems > 99 ? '99+' : totalItems}
            </span>
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-[11px] text-baruc-gold/80">
              {totalItems} {totalItems === 1 ? 'item' : 'itens'}
            </span>
            <span className="text-base font-bold text-white tabular-nums">
              {hasPriceOnRequest && totalPrice === 0 ? formatPrice(null) : formatCurrency(totalPrice)}
            </span>
          </span>
        </span>
        <span className="flex items-center gap-1 rounded-xl bg-baruc-gold px-3.5 py-2 text-sm font-bold text-baruc-green">
          Ver Carrinho
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </span>
      </button>
    </div>
  )
}
