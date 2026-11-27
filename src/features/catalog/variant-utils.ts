import { slugify } from '@/features/catalog/product-normalizer'
import { findVariant, getVariantStock } from '@/features/catalog/stock'
import type { Product, ProductColorVariant } from '@/features/catalog/types/product.types'

export const getVariantSku = (product: Pick<Product, 'sku'>, variant: ProductColorVariant): string => {
  const suffix = slugify(variant.colorName).replace(/-/g, '').toUpperCase()
  return suffix.length > 0 ? `${product.sku}-${suffix}` : product.sku
}

export const buildVariantProduct = (
  product: Product,
  variant?: ProductColorVariant,
): Product => {
  if (!variant) return product
  return {
    ...product,
    imageUrl: variant.imageUrl || product.imageUrl,
    sku: getVariantSku(product, variant),
  }
}

export const getVariantAvailableSizes = (variant: ProductColorVariant): string[] =>
  variant.sizes.filter((entry) => entry.stock > 0).map((entry) => entry.size)

export const getFirstAvailableSize = (variant: ProductColorVariant, fallback: string): string =>
  getVariantAvailableSizes(variant)[0] ?? fallback

export const resolveSelectedVariant = (
  product: Pick<Product, 'variants'>,
  colorName?: string,
): ProductColorVariant | undefined => findVariant(product, colorName)

export const getVariantTotal = (variant: ProductColorVariant): number => getVariantStock(variant)
