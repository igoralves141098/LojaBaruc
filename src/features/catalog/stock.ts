import { DEFAULT_STOCK } from '@/features/catalog/product-normalizer'
import type { Product } from '@/features/catalog/types/product.types'

export type StockLevel = 'out' | 'low' | 'available'

export const getStock = (product: Pick<Product, 'stock'>): number =>
  typeof product.stock === 'number' && Number.isFinite(product.stock) ? Math.max(0, product.stock) : DEFAULT_STOCK

export const getStockLevel = (stock: number): StockLevel => {
  if (stock <= 0) return 'out'
  if (stock <= 3) return 'low'
  return 'available'
}

export const isOutOfStock = (product: Pick<Product, 'stock'>): boolean => getStock(product) <= 0

export const isLowStock = (product: Pick<Product, 'stock'>): boolean => {
  const stock = getStock(product)
  return stock > 0 && stock <= 3
}

export const getStockLabel = (product: Pick<Product, 'stock'>): string => {
  const stock = getStock(product)
  if (stock <= 0) return 'Esgotado'
  if (stock <= 3) return `Últimas ${stock} ${stock === 1 ? 'unidade' : 'unidades'}`
  return `Restam ${stock} unidades`
}
