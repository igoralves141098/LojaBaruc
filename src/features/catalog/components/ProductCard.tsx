import { memo, useEffect, useRef, useState } from 'react'
import { Check, MessageCircle, ShoppingBag } from 'lucide-react'
import { useCart } from '@/features/cart/hooks/useCart'
import { ProductColorPicker } from '@/features/catalog/components/ProductColorPicker'
import { getStock, getVariantStock, isOutOfStock } from '@/features/catalog/stock'
import type { Product, ProductColorVariant } from '@/features/catalog/types/product.types'
import {
  buildVariantProduct,
  getFirstAvailableSize,
  getVariantAvailableSizes,
} from '@/features/catalog/variant-utils'
import { WhatsAppService } from '@/services/whatsapp.service'
import { calculateDiscountPercent, formatCurrency } from '@/utils/formatters'

interface ProductCardProps {
  product: Product
  onOpenDetails?: (product: Product) => void
}

const FEEDBACK_DURATION_MS = 1200

const ProductCardComponent = ({ product, onOpenDetails }: ProductCardProps) => {
  const { addItem } = useCart()
  const variants = product.variants ?? []
  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>(variants[0]?.id)
  const [selectedSize, setSelectedSize] = useState<string>(product.sizes[0] ?? 'P')
  const [selectedColor, setSelectedColor] = useState<string | undefined>(product.colors[0])
  const [justAdded, setJustAdded] = useState<boolean>(false)
  const timeoutRef = useRef<number | null>(null)

  const selectedVariant = variants.find((variant) => variant.id === selectedVariantId)
  const displayImage = selectedVariant?.imageUrl || product.imageUrl
  const selectedColorName = selectedVariant?.colorName ?? selectedColor
  const colorStock = selectedVariant ? getVariantStock(selectedVariant) : getStock(product)
  const totalStock = getStock(product)

  const discount = calculateDiscountPercent(product.price, product.originalPrice)
  const isUnavailable = isOutOfStock(product)
  const isColorUnavailable = colorStock <= 0
  const lowStock = colorStock > 0 && colorStock <= 3

  const sizeOptions = selectedVariant
    ? selectedVariant.sizes.map((entry) => ({ size: entry.size, stock: entry.stock }))
    : product.sizes.map((size) => ({ size, stock: totalStock }))

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current)
    }
  }, [])

  const handleSelectVariant = (variant: ProductColorVariant) => {
    setSelectedVariantId(variant.id)
    setSelectedSize(getFirstAvailableSize(variant, variant.sizes[0]?.size ?? product.sizes[0] ?? 'P'))
  }

  const handleAddToCart = () => {
    if (colorStock <= 0) return
    const cartProduct = buildVariantProduct(product, selectedVariant)
    addItem(cartProduct, selectedSize, 1, selectedColorName)
    setJustAdded(true)
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current)
    timeoutRef.current = window.setTimeout(() => setJustAdded(false), FEEDBACK_DURATION_MS)
  }

  const unavailableForWhatsApp = buildVariantProduct(product, selectedVariant)
  const hasAvailableSizeForColor =
    selectedVariant === undefined || getVariantAvailableSizes(selectedVariant).length > 0

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-sm transition-shadow duration-300 hover:shadow-xl">
      <button
        type="button"
        onClick={() => onOpenDetails?.(product)}
        aria-label={`Ver detalhes de ${product.name}`}
        className="relative block aspect-square w-full overflow-hidden bg-neutral-100 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-baruc-gold"
      >
        <img
          src={displayImage}
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

        {(isUnavailable || isColorUnavailable) && (
          <div className="absolute inset-0 flex items-center justify-center bg-baruc-green/30">
            <span className="rounded-full border border-baruc-gold/50 bg-baruc-green px-5 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-baruc-gold shadow-lg">
              Produto indisponível
            </span>
          </div>
        )}
      </button>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-baruc-goldDark">
            {product.category}
          </span>
          <span className="font-mono text-[10px] text-neutral-400">{product.sku}</span>
        </div>

        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={() => onOpenDetails?.(product)}
            className="text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-baruc-gold"
          >
            <h3 className="line-clamp-2 font-serif text-xl font-semibold leading-tight text-baruc-green">
              {product.name}
            </h3>
          </button>
          <p className="line-clamp-2 text-sm leading-relaxed text-neutral-500">{product.description}</p>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-xl font-bold text-neutral-900">
            {formatCurrency(product.price ?? 0)}
          </span>
          {product.originalPrice !== undefined && discount !== null && (
            <span className="text-sm text-neutral-400 line-through">{formatCurrency(product.originalPrice)}</span>
          )}
        </div>

        {lowStock && (
          <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden="true" />
            Últimas {colorStock} {colorStock === 1 ? 'unidade' : 'unidades'}
          </p>
        )}

        {variants.length > 0 ? (
          <ProductColorPicker
            variants={variants}
            selectedId={selectedVariantId}
            onSelect={handleSelectVariant}
            disabled={isUnavailable}
          />
        ) : (
          product.colors.length > 0 && (
            <fieldset disabled={isUnavailable}>
              <legend className="mb-2 text-xs font-medium text-neutral-500">
                Cor: <span className="font-semibold text-neutral-800">{selectedColor}</span>
              </legend>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={`Cores de ${product.name}`}>
                {product.colors.map((color) => {
                  const isSelected = color === selectedColor
                  return (
                    <button
                      key={color}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => setSelectedColor(color)}
                      className={`inline-flex h-9 items-center justify-center rounded-lg border px-3 text-xs font-semibold transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-baruc-gold ${
                        isSelected
                          ? 'border-baruc-green bg-baruc-green text-baruc-gold'
                          : 'border-neutral-200 bg-white text-neutral-700 hover:border-baruc-gold'
                      }`}
                    >
                      {color}
                    </button>
                  )
                })}
              </div>
            </fieldset>
          )
        )}

        <fieldset className="mt-auto" disabled={isUnavailable}>
          <legend className="mb-2 text-xs font-medium text-neutral-500">
            Tamanho: <span className="font-semibold text-neutral-800">{selectedSize}</span>
          </legend>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={`Tamanhos de ${product.name}`}>
            {sizeOptions.map(({ size, stock: sizeStock }) => {
              const isSelected = size === selectedSize
              const isSizeUnavailable = sizeStock <= 0
              return (
                <button
                  key={size}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  disabled={isSizeUnavailable}
                  onClick={() => setSelectedSize(size)}
                  className={`inline-flex h-10 min-w-10 items-center justify-center rounded-lg border px-3 text-sm font-semibold transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:line-through focus:outline-none focus-visible:ring-2 focus-visible:ring-baruc-gold ${
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

        {isUnavailable || isColorUnavailable || !hasAvailableSizeForColor ? (
          <div className="flex flex-col gap-2">
            <p className="text-center text-xs font-bold uppercase tracking-wide text-red-700">Produto indisponível</p>
            <a
              href={WhatsAppService.generateAvailabilityUrl(unavailableForWhatsApp)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-baruc-gold/60 bg-baruc-goldLight px-4 text-sm font-semibold text-baruc-green transition-all hover:bg-baruc-gold/30 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-baruc-gold focus-visible:ring-offset-2"
            >
              <MessageCircle className="h-5 w-5" aria-hidden="true" />
              Avise-me na reposição
            </a>
          </div>
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
