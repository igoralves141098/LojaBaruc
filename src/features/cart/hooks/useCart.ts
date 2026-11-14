import { useContext } from 'react'
import { CartContext } from '@/features/cart/context/cart-context'
import type { CartContextType } from '@/features/cart/types/cart.types'

export const useCart = (): CartContextType => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart deve ser utilizado dentro de um <CartProvider>.')
  }
  return context
}
