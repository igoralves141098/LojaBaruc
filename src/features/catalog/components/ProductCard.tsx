import { memo, useEffect, useRef, useState } from 'react'
import { Check, MessageCircle, ShoppingBag } from 'lucide-react'
import { useCart } from '@/features/cart/hooks/useCart'
import type { Product } from '@/features/catalog/types/product.types'
import { WhatsAppService } from '@/services/whatsapp.service'
import { calculateDiscountPercent, formatCurrency } from '@/utils/formatters'

interface ProductCardProps {
  product: Product
}

const FEEDBACK_DURATION_MS = 1200

const ProductCardComponent = ({ product }: ProductCardProps) => {
  const { addItem } = useCart()
  const [selectedSize, setSelectedSize] = useState<string>(product.sizes[0] ?? 'Único')
  const [justAdded, setJustAdded] = useState<boolean>(false)
  const timeoutRef = useRef<number | null>(null)

  const discount = calculateDiscountPercent(product.price, product.originalPrice)
  const isUnavailable = !product.inStock

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current)
    }
  }, [])

  const handleAddToCart = () => {
    addItem(product, selectedSize, 1)
    setJustAdded(true)
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current)
    timeoutRef.current = window.setTimeout(() => setJustAdded(false), FEEDBACK_DURATION_MS)
  }

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-sm transition-shadow duration-300 hover:shadow-xl">
      <div className="relative aspect-square overflow-hidden bg-neutral-100">
        <img
          src={product.imageUrl}
          alt={product.name}
          loading="lazy"
          decoding="async"
          width={800}
          height={800}
          className={`h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 ${
            isUnavailable ? 'opacity-60 grayscale' : ''
          }`}
        />

        <div className="pointer-events-none absolute inset-x-3 top-3 flex items-start justify-between gap-2">
          {product.badge && !isUnavailable ? (
            <span className="rounded-full border border-baruc-gold/40 bg-baruc-green px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-baruc-gold shadow-sm">
              {product.badge}
            </span>
          ) : (
            <span />
          )}
          {discount !== null && !isUnavailable && (
            <span className="rounded-full bg-baruc-gold px-2.5 py-1 text-xs font-bold text-baruc-green shadow-sm">
              -{discount}%
            </span>
          )}
        </div>

        {isUnavailable && (
          <div className="absolute inset-0 flex items-center justify-center bg-baruc-green/30">
            <span className="rounded-full border border-baruc-gold/50 bg-baruc-green px-5 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-baruc-gold shadow-lg">
              Esgotado
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-baruc-goldDark">
            {product.category}
          </span>
          <span className="font-mono text-[10px] text-neutral-400">{product.sku}</span>
        </div>

        <div className="flex flex-col gap-1">
          <h3 className="line-clamp-2 font-serif text-xl font-semibold leading-tight text-baruc-green">
            {product.name}
          </h3>
          <p className="line-clamp-2 text-sm leading-relaxed text-neutral-500">{product.description}</p>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-xl font-bold text-neutral-900">{formatCurrency(product.price)}</span>
          {product.originalPrice !== undefined && discount !== null && (
            <span className="text-sm text-neutral-400 line-through">{formatCurrency(product.originalPrice)}</span>
          )}
        </div>

        <fieldset className="mt-auto" disabled={isUnavailable}>
          <legend className="mb-2 text-xs font-medium text-neutral-500">
            Tamanho: <span className="font-semibold text-neutral-800">{selectedSize}</span>
          </legend>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={`Tamanhos de ${product.name}`}>
            {product.sizes.map((size) => {
              const isSelected = size === selectedSize
              return (
                <button
                  key={size}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => setSelectedSize(size)}
                  className={`inline-flex h-10 min-w-10 items-center justify-center rounded-lg border px-3 text-sm font-semibold transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-baruc-gold ${
                    isSelected
                      ? 'border-baruc-green bg-baruc-green text-baruc-gold'
                      : 'border-neutral-200 bg-white text-neutral-700 hover:border-baruc-gold'
                  }`}
                >
                  {size}
                </button>
              )
            })}
          </div>
        </fieldset>

        {isUnavailable ? (
          <a
            href={WhatsAppService.generateAvailabilityUrl(product)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-baruc-gold/60 bg-baruc-goldLight px-4 text-sm font-semibold text-baruc-green transition-all hover:bg-baruc-gold/30 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-baruc-gold focus-visible:ring-offset-2"
          >
            <MessageCircle className="h-5 w-5" aria-hidden="true" />
            Avise-me na reposição
          </a>
        ) : (
          <button
            type="button"
            onClick={handleAddToCart}
            aria-live="polite"
            className={`inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold transition-all duration-150 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-baruc-gold focus-visible:ring-offset-2 ${
              justAdded
                ? 'border-baruc-gold bg-baruc-gold text-baruc-green'
                : 'border-baruc-gold/30 bg-baruc-green text-baruc-gold hover:bg-baruc-greenDark'
            }`}
          >
            {justAdded ? (
              <>
                <Check className="h-5 w-5" aria-hidden="true" />
                Adicionado ao Carrinho ✓
              </>
            ) : (
              <>
                <ShoppingBag className="h-5 w-5" aria-hidden="true" />
                Adicionar ao Carrinho
              </>
            )}
          </button>
        )}
      </div>
    </article>
  )
}

export const ProductCard = memo(ProductCardComponent)
