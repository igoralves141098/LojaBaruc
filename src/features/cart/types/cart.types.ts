import type { Product } from '@/features/catalog/types/product.types'

export interface CartItem {
  product: Product
  selectedSize: string
  selectedColor?: string
  quantity: number
}

export interface CartContextType {
  items: CartItem[]
  isOpen: boolean
  openCart: () => void
  closeCart: () => void
  addItem: (product: Product, size: string, quantity?: number, color?: string) => void
  removeItem: (productId: string, size: string, color?: string) => void
  updateQuantity: (productId: string, size: string, quantity: number, color?: string) => void
  clearCart: () => void
  totalItems: number
  subtotal: number
  totalDiscount: number
  totalPrice: number
  hasPriceOnRequest: boolean
}
