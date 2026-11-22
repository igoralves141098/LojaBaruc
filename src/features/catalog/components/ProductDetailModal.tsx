import { useEffect, useId, useRef, useState } from 'react'
import { Check, MessageCircle, ShoppingBag, X } from 'lucide-react'
import { useCart } from '@/features/cart/hooks/useCart'
import { getStock, getStockLevel } from '@/features/catalog/stock'
import type { Product, ProductTechnicalSheet } from '@/features/catalog/types/product.types'
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock'
import { WhatsAppService } from '@/services/whatsapp.service'
import { calculateDiscountPercent, formatCurrency } from '@/utils/formatters'

type DetailTab = 'description' | 'technical' | 'specifications'

interface ProductDetailModalProps {
  product: Product | null
  onClose: () => void
}

const TABS: Array<{ id: DetailTab; label: string }> = [
  { id: 'description', label: 'Descrição' },
  { id: 'technical', label: 'Ficha Técnica' },
  { id: 'specifications', label: 'Especificações' },
]

const TECHNICAL_LABELS: Array<{ key: keyof ProductTechnicalSheet; label: string }> = [
  { key: 'fabric', label: 'Tecido' },
  { key: 'fit', label: 'Modelagem' },
  { key: 'composition', label: 'Composição' },
  { key: 'origin', label: 'Origem' },
  { key: 'care', label: 'Cuidados' },
]

const FEEDBACK_DURATION_MS = 1400

const ProductDetailModalContent = ({ product, onClose }: { product: Product; onClose: () => void }) => {
  const { addItem } = useCart()
  const [activeTab, setActiveTab] = useState<DetailTab>('description')
  const [selectedSize, setSelectedSize] = useState<string>(() => product.sizes[0] ?? 'P')
  const [selectedColor, setSelectedColor] = useState<string | undefined>(() => product.colors[0])
  const [justAdded, setJustAdded] = useState<boolean>(false)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const timeoutRef = useRef<number | null>(null)
  const titleId = useId()

  useBodyScrollLock(true)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    const focusTimer = window.setTimeout(() => closeButtonRef.current?.focus({ preventScroll: true }), 50)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.clearTimeout(focusTimer)
    }
  }, [onClose])

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current)
    }
  }, [])

  const stock = getStock(product)
  const stockLevel = getStockLevel(stock)
  const isOutOfStock = stock <= 0
  const discount = calculateDiscountPercent(product.price, product.originalPrice)
  const technicalEntries = TECHNICAL_LABELS.filter(({ key }) => {
    const value = product.technicalSheet?.[key]
    return typeof value === 'string' && value.trim().length > 0
  })

  const handleAddToCart = () => {
    if (isOutOfStock) return
    addItem(product, selectedSize, 1, selectedColor)
    setJustAdded(true)
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current)
    timeoutRef.current = window.setTimeout(() => setJustAdded(false), FEEDBACK_DURATION_MS)
  }

  const stockBadgeClass =
    stockLevel === 'out'
      ? 'border-red-200 bg-red-50 text-red-700'
      : stockLevel === 'low'
        ? 'border-amber-300 bg-amber-50 text-amber-700'
        : 'border-emerald-200 bg-emerald-50 text-emerald-700'

  const stockText =
    stockLevel === 'out'
      ? 'Esgotado'
      : stockLevel === 'low'
        ? `Últimas ${stock} ${stock === 1 ? 'unidade' : 'unidades'}`
        : `Restam ${stock} unidades`

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4">
      <div onClick={onClose} className="absolute inset-0 bg-black/65 backdrop-blur-sm" aria-hidden="true" />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex max-h-[100dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-h-[92dvh] sm:max-w-5xl sm:rounded-3xl"
      >
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          aria-label="Fechar detalhes do produto"
          className="absolute right-3 top-[calc(0.75rem+env(safe-area-inset-top))] z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-baruc-green/90 text-baruc-gold shadow-lg backdrop-blur transition-colors hover:bg-baruc-green active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-baruc-gold"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>

        <div className="no-scrollbar grid flex-1 overflow-y-auto overscroll-contain pb-[calc(1rem+env(safe-area-inset-bottom))] sm:grid-cols-2 sm:pb-0">
          <div className="relative bg-neutral-100">
            <img
              src={product.imageUrl}
              alt={product.name}
              width={900}
              height={1100}
              className="h-64 w-full object-cover sm:h-full sm:max-h-[92dvh]"
            />
            {discount !== null && !isOutOfStock && (
              <span className="absolute left-4 top-[calc(1rem+env(safe-area-inset-top))] rounded-full bg-baruc-gold px-3 py-1 text-xs font-bold text-baruc-green shadow sm:top-4">
                -{discount}%
              </span>
            )}
          </div>

          <div className="flex flex-col gap-4 p-5 sm:max-h-[92dvh] sm:overflow-y-auto sm:p-7">
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-baruc-goldDark">
                {product.category}
              </span>
              <h2 id={titleId} className="font-serif text-2xl font-semibold leading-tight text-baruc-green sm:text-3xl">
                {product.name}
              </h2>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="font-mono text-[11px] text-neutral-400">SKU: {product.sku}</span>
                <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${stockBadgeClass}`}>
                  {stockText}
                </span>
              </div>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-neutral-900">{formatCurrency(product.price ?? 0)}</span>
              {product.originalPrice !== undefined && discount !== null && (
                <span className="text-base text-neutral-400 line-through">{formatCurrency(product.originalPrice)}</span>
              )}
            </div>

            {product.colors.length > 0 && (
              <fieldset disabled={isOutOfStock}>
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
            )}

            <fieldset disabled={isOutOfStock}>
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

            {isOutOfStock ? (
              <a
                href={WhatsAppService.generateAvailabilityUrl(product)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-baruc-gold/60 bg-baruc-goldLight px-4 text-sm font-semibold text-baruc-green transition-all hover:bg-baruc-gold/30 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-baruc-gold"
              >
                <MessageCircle className="h-5 w-5" aria-hidden="true" />
                Consultar reposição no WhatsApp
              </a>
            ) : (
              <button
                type="button"
                onClick={handleAddToCart}
                className={`inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold transition-all duration-150 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-baruc-gold focus-visible:ring-offset-2 ${
                  justAdded
                    ? 'border-baruc-gold bg-baruc-gold text-baruc-green'
                    : 'border-baruc-gold/30 bg-baruc-green text-baruc-gold hover:bg-baruc-greenDark'
                }`}
              >
                {justAdded ? (
                  <>
                    <Check className="h-5 w-5" aria-hidden="true" />
                    Adicionado ao Carrinho
                  </>
                ) : (
                  <>
                    <ShoppingBag className="h-5 w-5" aria-hidden="true" />
                    Adicionar ao Carrinho
                  </>
                )}
              </button>
            )}

            <div className="mt-1 flex flex-col gap-3">
              <div className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto border-b border-neutral-200 px-1">
                {TABS.map((tab) => {
                  const isActive = tab.id === activeTab
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      aria-selected={isActive}
                      role="tab"
                      className={`relative shrink-0 px-3 py-2.5 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-baruc-gold ${
                        isActive ? 'text-baruc-green' : 'text-neutral-400 hover:text-neutral-600'
                      }`}
                    >
                      {tab.label}
                      {isActive && <span className="absolute inset-x-1 bottom-0 h-0.5 rounded-full bg-baruc-gold" />}
                    </button>
                  )
                })}
              </div>

              {activeTab === 'description' && (
                <p className="whitespace-pre-line text-sm leading-relaxed text-neutral-600">
                  {product.fullDescription || product.description || 'Descrição em breve.'}
                </p>
              )}

              {activeTab === 'technical' && (
                technicalEntries.length > 0 ? (
                  <dl className="overflow-hidden rounded-xl border border-neutral-200">
                    {technicalEntries.map(({ key, label }, index) => (
                      <div
                        key={key}
                        className={`flex gap-3 px-3.5 py-2.5 text-sm ${index % 2 === 0 ? 'bg-baruc-cream' : 'bg-white'}`}
                      >
                        <dt className="w-28 shrink-0 font-semibold text-baruc-green">{label}</dt>
                        <dd className="text-neutral-600">{product.technicalSheet?.[key]}</dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <p className="text-sm text-neutral-500">
                    Ficha técnica detalhada disponível sob consulta pelo WhatsApp.
                  </p>
                )
              )}

              {activeTab === 'specifications' && (
                product.specifications && product.specifications.length > 0 ? (
                  <ul className="flex flex-col gap-2">
                    {product.specifications.map((specification) => (
                      <li key={specification} className="flex items-start gap-2 text-sm text-neutral-600">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-baruc-goldDark" aria-hidden="true" />
                        <span>{specification}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-neutral-500">Especificações disponíveis sob consulta.</p>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export const ProductDetailModal = ({ product, onClose }: ProductDetailModalProps) => {
  if (!product) return null
  return <ProductDetailModalContent key={product.id} product={product} onClose={onClose} />
}


