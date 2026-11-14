import type { Product } from '@/features/catalog/types/product.types'

export interface CartItem {
  product: Product
  selectedSize: string
  quantity: number
}

export interface CartContextType {
  items: CartItem[]
  isOpen: boolean
  openCart: () => void
  closeCart: () => void
  addItem: (product: Product, size: string, quantity?: number) => void
  removeItem: (productId: string, size: string) => void
  updateQuantity: (productId: string, size: string, quantity: number) => void
  clearCart: () => void
  totalItems: number
  subtotal: number
  totalDiscount: number
  totalPrice: number
}
