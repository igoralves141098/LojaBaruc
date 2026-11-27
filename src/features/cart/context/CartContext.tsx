import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { CartContext } from '@/features/cart/context/cart-context'
import type { CartContextType, CartItem } from '@/features/cart/types/cart.types'
import { getStock } from '@/features/catalog/stock'
import type { Product } from '@/features/catalog/types/product.types'

const STORAGE_KEY = '@BarucMasculina:cart-v2'
const MAX_QUANTITY_PER_ITEM = 99

const isSameLine = (item: CartItem, productId: string, size: string, color?: string): boolean =>
  item.product.id === productId && item.selectedSize === size && (item.selectedColor ?? '') === (color ?? '')

const getProductTotal = (items: CartItem[], productId: string): number =>
  items
    .filter((item) => item.product?.id === productId)
    .reduce((total, item) => total + item.quantity, 0)

const clampQuantity = (quantity: number): number =>
  Math.min(MAX_QUANTITY_PER_ITEM, Math.max(1, Math.floor(quantity)))

const isValidCartItem = (value: unknown): value is CartItem => {
  if (typeof value !== 'object' || value === null) return false
  const item = value as Record<string, unknown>
  const product = item.product as Record<string, unknown> | null | undefined
  return (
    typeof item.selectedSize === 'string' &&
    (item.selectedColor === undefined || typeof item.selectedColor === 'string') &&
    typeof item.quantity === 'number' &&
    item.quantity > 0 &&
    typeof product === 'object' &&
    product !== null &&
    typeof product.id === 'string' &&
    typeof product.name === 'string'
  )
}

const readStoredCart = (): CartItem[] => {
  try {
    if (typeof window === 'undefined') return []
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isValidCartItem).map((item) => ({ ...item, quantity: clampQuantity(item.quantity) }))
  } catch {
    return []
  }
}

const writeStoredCart = (items: CartItem[]): void => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    return
  }
}

interface CartProviderProps {
  children: ReactNode
}

export const CartProvider = ({ children }: CartProviderProps) => {
  const [items, setItems] = useState<CartItem[]>(readStoredCart)
  const [isOpen, setIsOpen] = useState<boolean>(false)

  useEffect(() => {
    writeStoredCart(items)
  }, [items])

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) setItems(readStoredCart())
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const openCart = useCallback(() => setIsOpen(true), [])
  const closeCart = useCallback(() => setIsOpen(false), [])

  const addItem = useCallback((product: Product, size: string, quantity: number = 1, color?: string) => {
    if (!product?.id) return
    const stock = getStock(product)
    if (stock <= 0) return

    const safeQuantity = clampQuantity(quantity)
    const safeSize = size || product.sizes?.[0] || 'Único'
    const safeColor = color || undefined

    setItems((current) => {
      const currentTotal = getProductTotal(current, product.id)
      const remaining = stock - currentTotal
      if (remaining <= 0) return current

      const quantityToAdd = Math.min(safeQuantity, remaining)
      const existing = current.find((item) => isSameLine(item, product.id, safeSize, safeColor))

      if (existing) {
        return current.map((item) =>
          isSameLine(item, product.id, safeSize, safeColor)
            ? { ...item, product, quantity: clampQuantity(item.quantity + quantityToAdd) }
            : item,
        )
      }
      return [...current, { product, selectedSize: safeSize, selectedColor: safeColor, quantity: quantityToAdd }]
    })
  }, [])

  const removeItem = useCallback((productId: string, size: string, color?: string) => {
    setItems((current) => current.filter((item) => !isSameLine(item, productId, size, color)))
  }, [])

  const updateQuantity = useCallback((productId: string, size: string, quantity: number, color?: string) => {
    setItems((current) => {
      if (quantity <= 0) return current.filter((item) => !isSameLine(item, productId, size, color))

      const line = current.find((item) => isSameLine(item, productId, size, color))
      if (!line) return current

      const stock = getStock(line.product)
      const otherLinesTotal = current
        .filter((item) => item.product?.id === productId && !isSameLine(item, productId, size, color))
        .reduce((total, item) => total + item.quantity, 0)
      const maxForLine = stock - otherLinesTotal
      if (maxForLine <= 0) return current

      const nextQuantity = Math.min(clampQuantity(quantity), maxForLine)
      return current.map((item) =>
        isSameLine(item, productId, size, color) ? { ...item, quantity: nextQuantity } : item,
      )
    })
  }, [])

  const clearCart = useCallback(() => setItems([]), [])

  const totals = useMemo(() => {
    return items.reduce(
      (acc, { product, quantity }) => {
        acc.totalItems += quantity
        if (product.price === null) {
          acc.hasPriceOnRequest = true
          return acc
        }
        const listPrice =
          product.originalPrice !== undefined && product.originalPrice > product.price
            ? product.originalPrice
            : product.price
        acc.subtotal += listPrice * quantity
        acc.totalPrice += product.price * quantity
        return acc
      },
      { totalItems: 0, subtotal: 0, totalPrice: 0, hasPriceOnRequest: false },
    )
  }, [items])

  const value = useMemo<CartContextType>(
    () => ({
      items,
      isOpen,
      openCart,
      closeCart,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      totalItems: totals.totalItems,
      subtotal: Math.round(totals.subtotal * 100) / 100,
      totalDiscount: Math.round((totals.subtotal - totals.totalPrice) * 100) / 100,
      totalPrice: Math.round(totals.totalPrice * 100) / 100,
      hasPriceOnRequest: totals.hasPriceOnRequest,
    }),
    [items, isOpen, openCart, closeCart, addItem, removeItem, updateQuantity, clearCart, totals],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
