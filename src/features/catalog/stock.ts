import { DEFAULT_STOCK, getVariantStock } from '@/features/catalog/product-normalizer'
import type { Product, ProductColorVariant } from '@/features/catalog/types/product.types'

export { getVariantStock }

export type StockLevel = 'out' | 'low' | 'available'

type StockProduct = Pick<Product, 'stock'> & { variants?: ProductColorVariant[] }

export const findVariant = (
  product: Pick<Product, 'variants'>,
  colorName?: string,
): ProductColorVariant | undefined => {
  if (!colorName || !product.variants || product.variants.length === 0) return undefined
  return product.variants.find((variant) => variant.colorName === colorName)
}

export const getStock = (product: StockProduct): number => {
  if (product.variants && product.variants.length > 0) {
    return product.variants.reduce((total, variant) => total + getVariantStock(variant), 0)
  }
  return typeof product.stock === 'number' && Number.isFinite(product.stock)
    ? Math.max(0, product.stock)
    : DEFAULT_STOCK
}

export const getColorStock = (product: StockProduct, colorName?: string): number => {
  const variant = findVariant(product, colorName)
  return variant ? getVariantStock(variant) : getStock(product)
}

export const getSizeStock = (product: StockProduct, colorName: string | undefined, size: string): number => {
  const variant = findVariant(product, colorName)
  if (!variant) return getStock(product)
  return variant.sizes.find((entry) => entry.size === size)?.stock ?? 0
}

export const getStockLevel = (stock: number): StockLevel => {
  if (stock <= 0) return 'out'
  if (stock <= 3) return 'low'
  return 'available'
}

export const isOutOfStock = (product: StockProduct): boolean => getStock(product) <= 0

export const isLowStock = (product: StockProduct): boolean => {
  const stock = getStock(product)
  return stock > 0 && stock <= 3
}

export const getStockLabel = (product: StockProduct): string => {
  const stock = getStock(product)
  if (stock <= 0) return 'Esgotado'
  if (stock <= 3) return `Últimas ${stock} ${stock === 1 ? 'unidade' : 'unidades'}`
  return `Restam ${stock} unidades`
}
