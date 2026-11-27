import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Loader2, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react'
import { useCart } from '@/features/cart/hooks/useCart'
import type { CartItem } from '@/features/cart/types/cart.types'
import { getStock } from '@/features/catalog/stock'
import { useCustomerAuth } from '@/features/customers/hooks/useCustomerAuth'
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock'
import { createPendingOrder } from '@/features/orders/order.service'
import type { OrderItem, OrderPaymentMethod, OrderDeliveryMethod } from '@/features/orders/order.types'
import { WhatsAppService } from '@/services/whatsapp.service'
import { formatCurrency, formatPrice } from '@/utils/formatters'

const PAYMENT_METHODS = ['PIX', 'Cartão', 'Combinar'] as const
const DELIVERY_TYPES = ['Entrega', 'Retirada na Loja'] as const

type PaymentMethod = (typeof PAYMENT_METHODS)[number]
type DeliveryType = (typeof DELIVERY_TYPES)[number]

interface CartLineProps {
  item: CartItem
  canIncrement: boolean
  maxStock: number
  onIncrement: () => void
  onDecrement: () => void
  onRemove: () => void
}

const CartLine = ({ item, canIncrement, maxStock, onIncrement, onDecrement, onRemove }: CartLineProps) => {
  const { product, selectedSize, selectedColor, quantity } = item
  const name = product?.name ?? 'Produto'
  const imageUrl = product?.imageUrl || '/placeholder-product.png'
  const sku = product?.sku ?? '—'
  const price = typeof product?.price === 'number' ? product.price : null

  return (
    <li className="flex gap-3 rounded-2xl border border-neutral-200/80 bg-white p-3 shadow-sm">
      <img
        src={imageUrl}
        alt={name}
        loading="lazy"
        decoding="async"
        width={96}
        height={96}
        className="h-24 w-20 shrink-0 rounded-xl object-cover sm:w-24"
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 font-serif text-lg font-semibold leading-tight text-baruc-green">
            {name}
          </h3>
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remover ${name} tamanho ${selectedSize}${selectedColor ? ` cor ${selectedColor}` : ''}`}
            className="-mr-1 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-600 active:scale-95"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <span className="rounded-md border border-baruc-gold/40 bg-baruc-goldLight px-2 py-0.5 text-xs font-semibold text-baruc-green">
            Tam: {selectedSize || '—'}
          </span>
          {selectedColor && (
            <span className="rounded-md border border-neutral-200 bg-white px-2 py-0.5 text-xs font-semibold text-neutral-700">
              Cor: {selectedColor}
            </span>
          )}
          <span className="font-mono text-[10px] text-neutral-400">{sku}</span>
        </div>
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div className="flex items-center rounded-xl border border-neutral-200 bg-neutral-50">
            <button
              type="button"
              onClick={onDecrement}
              aria-label="Diminuir quantidade"
              className="flex h-10 w-10 items-center justify-center rounded-l-xl text-baruc-green transition-colors hover:bg-neutral-100 active:scale-95"
            >
              <Minus className="h-4 w-4" aria-hidden="true" />
            </button>
            <span className="w-8 text-center text-sm font-bold tabular-nums" aria-live="polite">
              {quantity}
            </span>
            <button
              type="button"
              onClick={onIncrement}
              disabled={!canIncrement}
              aria-label={canIncrement ? 'Aumentar quantidade' : `Limite de estoque atingido, máximo de ${maxStock} unidades`}
              className="flex h-10 w-10 items-center justify-center rounded-r-xl text-baruc-green transition-colors hover:bg-neutral-100 active:scale-95 disabled:cursor-not-allowed disabled:text-neutral-300 disabled:hover:bg-transparent"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <div className="text-right">
            <p className="text-base font-bold text-neutral-900">
              {price === null ? formatPrice(null) : formatCurrency(price * quantity)}
            </p>
            {quantity > 1 && price !== null && (
              <p className="text-[11px] text-neutral-400">{formatCurrency(price)} cada</p>
            )}
          </div>
        </div>
        {!canIncrement && (
          <p className="mt-1.5 text-[11px] font-semibold text-amber-600">
            Limite de estoque atingido (máx. {maxStock} un.)
          </p>
        )}
      </div>
    </li>
  )
}

export const CartDrawer = () => {
  const {
    items,
    isOpen,
    closeCart,
    removeItem,
    updateQuantity,
    clearCart,
    totalItems,
    subtotal,
    totalDiscount,
    totalPrice,
    hasPriceOnRequest,
  } = useCart()

  const { customer, user } = useCustomerAuth()
  const [customerName, setCustomerName] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('')
  const [deliveryType, setDeliveryType] = useState<DeliveryType | ''>('')
  const [orderSaving, setOrderSaving] = useState<boolean>(false)
  const [orderError, setOrderError] = useState<string>('')
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const titleId = useId()
  const nameInputId = useId()

  useBodyScrollLock(isOpen)

  const effectiveCustomerName = customerName ?? customer?.fullName ?? ''

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeCart()
    }
    window.addEventListener('keydown', handleKeyDown)
    const focusTimer = window.setTimeout(() => closeButtonRef.current?.focus({ preventScroll: true }), 50)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.clearTimeout(focusTimer)
    }
  }, [isOpen, closeCart])

  const checkoutUrl = useMemo(
    () =>
      WhatsAppService.generateCartCheckoutUrl({
        items,
        subtotal,
        totalDiscount,
        totalPrice,
        hasPriceOnRequest,
        customerName: effectiveCustomerName,
        paymentMethod,
        deliveryType,
      }),
    [items, subtotal, totalDiscount, totalPrice, hasPriceOnRequest, effectiveCustomerName, paymentMethod, deliveryType],
  )

  const handleCheckout = async () => {
    setOrderError('')
    setOrderSaving(true)
    try {
      const orderItems: OrderItem[] = items.map((item) => {
        const unitPrice = typeof item.product?.price === 'number' ? item.product.price : 0
        const qty = item.quantity
        const selectedVariant = item.product?.variants?.find((v) => v.colorName === item.selectedColor)
        return {
          productId: item.product?.id ?? '',
          name: item.product?.name ?? 'Produto',
          sku: item.product?.sku ?? '',
          colorName: item.selectedColor ?? selectedVariant?.colorName ?? '',
          colorHex: selectedVariant?.colorHex ?? '',
          size: item.selectedSize ?? '',
          quantity: qty,
          unitPrice,
          subtotal: unitPrice * qty,
        }
      })

      const orderCode = await createPendingOrder({
        customerId: customer?.uid ?? user?.uid ?? null,
        customerName: effectiveCustomerName || customer?.fullName || user?.displayName || '',
        customerEmail: customer?.email ?? user?.email ?? '',
        customerCpf: customer?.cpf ?? '',
        customerPhone: customer?.phone ?? '',
        items: orderItems,
        totalAmount: totalPrice,
        paymentMethod: (paymentMethod || 'Combinar') as OrderPaymentMethod,
        deliveryMethod: (deliveryType || 'Entrega') as OrderDeliveryMethod,
      })

      const url = WhatsAppService.generateCartCheckoutUrl({
        items,
        subtotal,
        totalDiscount,
        totalPrice,
        hasPriceOnRequest,
        customerName: effectiveCustomerName,
        paymentMethod,
        deliveryType,
        orderShortCode: orderCode,
      })
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (err) {
      setOrderError(err instanceof Error ? err.message : 'Não foi possível salvar o pedido.')
      window.open(checkoutUrl, '_blank', 'noopener,noreferrer')
    } finally {
      setOrderSaving(false)
    }
  }

  const isEmpty = items.length === 0

  return (
    <div className={isOpen ? 'pointer-events-auto' : 'pointer-events-none'} aria-hidden={!isOpen} inert={!isOpen}>
      <div
        onClick={closeCart}
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-baruc-cream shadow-2xl transition-transform duration-300 ease-out will-change-transform ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <header className="flex items-center justify-between gap-3 border-b border-baruc-gold/30 bg-baruc-green px-5 pb-4 pt-[calc(1rem+env(safe-area-inset-top))] text-baruc-gold">
          <div className="flex items-center gap-3">
            <ShoppingBag className="h-6 w-6" aria-hidden="true" />
            <div>
              <h2 id={titleId} className="font-serif text-2xl font-semibold leading-none tracking-wide">
                Seu Carrinho
              </h2>
              <p className="mt-1 text-xs text-baruc-gold/80">
                {totalItems} {totalItems === 1 ? 'peça selecionada' : 'peças selecionadas'}
              </p>
            </div>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={closeCart}
            aria-label="Fechar carrinho"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-baruc-gold/30 transition-colors hover:bg-baruc-greenLight active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-baruc-gold"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        {isEmpty ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-baruc-gold/40 bg-baruc-goldLight">
              <ShoppingBag className="h-8 w-8 text-baruc-goldDark" aria-hidden="true" />
            </div>
            <h3 className="font-serif text-2xl font-semibold text-baruc-green">Seu carrinho está vazio</h3>
            <p className="max-w-xs text-sm text-neutral-500">
              Explore o catálogo e adicione as peças que combinam com o seu estilo.
            </p>
            <button
              type="button"
              onClick={closeCart}
              className="inline-flex min-h-[44px] items-center rounded-xl border border-baruc-gold/30 bg-baruc-green px-6 text-sm font-semibold text-baruc-gold transition-colors hover:bg-baruc-greenDark active:scale-[0.98]"
            >
              Continuar comprando
            </button>
          </div>
        ) : (
          <>
            <div className="no-scrollbar flex-1 overflow-y-auto overscroll-contain px-4 py-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">Itens</span>
                <button
                  type="button"
                  onClick={clearCart}
                  className="min-h-[36px] rounded-lg px-2 text-xs font-medium text-neutral-500 underline-offset-2 transition-colors hover:text-red-600 hover:underline"
                >
                  Esvaziar carrinho
                </button>
              </div>

              <ul className="flex flex-col gap-3">
                  {items.map((item) => {
                    const productId = item.product?.id ?? 'unknown'
                    const productTotal = items
                      .filter((line) => line.product?.id === productId)
                      .reduce((total, line) => total + line.quantity, 0)
                    const maxStock = item.product ? getStock(item.product) : 99

                    return (
                      <CartLine
                        key={`${productId}-${item.selectedSize}-${item.selectedColor ?? ''}`}
                        item={item}
                        canIncrement={productTotal < maxStock}
                        maxStock={maxStock}
                        onIncrement={() => updateQuantity(productId, item.selectedSize, item.quantity + 1, item.selectedColor)}
                        onDecrement={() => updateQuantity(productId, item.selectedSize, item.quantity - 1, item.selectedColor)}
                        onRemove={() => removeItem(productId, item.selectedSize, item.selectedColor)}
                      />
                    )
                  })}
              </ul>

              <section className="mt-5 flex flex-col gap-4 rounded-2xl border border-baruc-gold/30 bg-white p-4">
                <h3 className="font-serif text-lg font-semibold text-baruc-green">Dados para o pedido</h3>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor={nameInputId} className="text-xs font-medium text-neutral-600">
                    Seu Nome (opcional)
                  </label>
                  <input
                    id={nameInputId}
                    type="text"
                    autoComplete="name"
                    autoCapitalize="words"
                    enterKeyHint="done"
                    maxLength={60}
                    value={effectiveCustomerName}
                    onChange={(event) => setCustomerName(event.target.value)}
                    placeholder="Como devemos te chamar?"
                    className="h-11 w-full rounded-xl border border-neutral-200 bg-baruc-cream px-3.5 text-base text-neutral-900 placeholder:text-neutral-400 focus:border-baruc-gold focus:outline-none focus:ring-2 focus:ring-baruc-gold/25"
                  />
                </div>

                <fieldset className="flex flex-col gap-1.5">
                  <legend className="mb-1.5 text-xs font-medium text-neutral-600">Forma de Pagamento</legend>
                  <div className="grid grid-cols-3 gap-2">
                    {PAYMENT_METHODS.map((method) => {
                      const isActive = paymentMethod === method
                      return (
                        <button
                          key={method}
                          type="button"
                          aria-pressed={isActive}
                          onClick={() => setPaymentMethod(isActive ? '' : method)}
                          className={`min-h-[44px] rounded-xl border text-sm font-semibold transition-all active:scale-[0.97] ${
                            isActive
                              ? 'border-baruc-gold bg-baruc-green text-baruc-gold'
                              : 'border-neutral-200 bg-white text-neutral-700 hover:border-baruc-gold'
                          }`}
                        >
                          {method}
                        </button>
                      )
                    })}
                  </div>
                </fieldset>

                <fieldset className="flex flex-col gap-1.5">
                  <legend className="mb-1.5 text-xs font-medium text-neutral-600">Recebimento</legend>
                  <div className="grid grid-cols-2 gap-2">
                    {DELIVERY_TYPES.map((type) => {
                      const isActive = deliveryType === type
                      return (
                        <button
                          key={type}
                          type="button"
                          aria-pressed={isActive}
                          onClick={() => setDeliveryType(isActive ? '' : type)}
                          className={`min-h-[44px] rounded-xl border px-2 text-sm font-semibold transition-all active:scale-[0.97] ${
                            isActive
                              ? 'border-baruc-gold bg-baruc-green text-baruc-gold'
                              : 'border-neutral-200 bg-white text-neutral-700 hover:border-baruc-gold'
                          }`}
                        >
                          {type}
                        </button>
                      )
                    })}
                  </div>
                </fieldset>
              </section>
            </div>

            <footer className="border-t border-baruc-gold/30 bg-white px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.15)]">
              <dl className="flex flex-col gap-1.5 text-sm">
                <div className="flex justify-between text-neutral-600">
                  <dt>Subtotal</dt>
                  <dd className="tabular-nums">{formatCurrency(subtotal)}</dd>
                </div>
                {totalDiscount > 0 && (
                  <div className="flex justify-between font-medium text-baruc-goldDark">
                    <dt>Economia</dt>
                    <dd className="tabular-nums">-{formatCurrency(totalDiscount)}</dd>
                  </div>
                )}
                <div className="mt-1 flex items-baseline justify-between border-t border-dashed border-neutral-200 pt-2">
                  <dt className="font-serif text-xl font-semibold text-baruc-green">Total</dt>
                  <dd className="text-2xl font-bold tabular-nums text-baruc-green">
                    {hasPriceOnRequest && totalPrice === 0 ? formatPrice(null) : formatCurrency(totalPrice)}
                  </dd>
                </div>
              </dl>
              {orderError && (
                <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
                  {orderError}
                </p>
              )}
              {hasPriceOnRequest && (
                <p className="mt-2 text-xs text-neutral-500">
                  Itens a confirmar: o valor final será confirmado pelo WhatsApp.
                </p>
              )}

              <button
                type="button"
                onClick={() => void handleCheckout()}
                disabled={orderSaving}
                className="mt-4 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-baruc-gold bg-baruc-green px-4 text-sm font-bold uppercase tracking-wide text-baruc-gold shadow-lg transition-all hover:bg-baruc-greenDark active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 focus:outline-none focus-visible:ring-2 focus-visible:ring-baruc-gold focus-visible:ring-offset-2"
              >
                {orderSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                )}
                <span>Finalizar Pedido no WhatsApp</span>
              </button>
              <p className="mt-2 text-center text-[11px] text-neutral-400">
                Você será direcionado ao WhatsApp com o resumo do pedido.
              </p>
            </footer>
          </>
        )}
      </aside>
    </div>
  )
}
