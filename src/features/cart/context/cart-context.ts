import { createContext } from 'react'
import type { CartContextType } from '@/features/cart/types/cart.types'

export const CartContext = createContext<CartContextType | null>(null)
