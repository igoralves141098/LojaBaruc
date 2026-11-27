import type {
  Product,
  ProductColorVariant,
  ProductSizeStock,
  ProductTechnicalSheet,
} from '@/features/catalog/types/product.types'

export const DEFAULT_STOCK = 10
export const DEFAULT_VARIANT_COLOR = '#C5A059'

const normalizeKey = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()

export const deriveNiche = (category: string): string => {
  const normalized = normalizeKey(category)
  if (normalized.includes('short') || normalized.includes('bermuda')) return 'Shorts'
  if (normalized.includes('sueter')) return 'Suéter'
  if (normalized.includes('jaqueta') || normalized.includes('casaco')) return 'Jaqueta'
  return 'Camisas'
}

export const slugify = (value: string): string =>
  normalizeKey(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

export const normalizeStock = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, Math.floor(value))
  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10)
    if (Number.isFinite(parsed)) return Math.max(0, parsed)
  }
  return DEFAULT_STOCK
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const toStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : []

const normalizeVariantStock = (value: unknown): number => {
  if (value === undefined || value === null) return 0
  if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, Math.floor(value))
  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10)
    if (Number.isFinite(parsed)) return Math.max(0, parsed)
  }
  return 0
}

const normalizeVariantSizes = (value: unknown): ProductSizeStock[] => {
  const sizes: ProductSizeStock[] = []

  const pushSize = (size: unknown, stock: unknown): void => {
    if (typeof size !== 'string' || size.trim().length === 0) return
    const normalizedSize = size.trim()
    if (sizes.some((entry) => entry.size === normalizedSize)) return
    sizes.push({ size: normalizedSize, stock: normalizeVariantStock(stock) })
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      if (isRecord(item)) {
        pushSize(item.size, item.stock)
      } else if (typeof item === 'string') {
        pushSize(item, 0)
      }
    }
    return sizes
  }

  if (isRecord(value)) {
    for (const [size, stock] of Object.entries(value)) {
      pushSize(size, stock)
    }
  }

  return sizes
}

const toVariants = (value: unknown): ProductColorVariant[] => {
  if (!Array.isArray(value)) return []

  const variants: ProductColorVariant[] = []
  value.forEach((item, index) => {
    if (!isRecord(item)) return
    const colorName = typeof item.colorName === 'string' ? item.colorName.trim() : ''
    if (colorName.length === 0) return
    const colorHex =
      typeof item.colorHex === 'string' && item.colorHex.trim().length > 0
        ? item.colorHex.trim()
        : DEFAULT_VARIANT_COLOR
    const imageUrl = typeof item.imageUrl === 'string' ? item.imageUrl.trim() : ''
    const id =
      typeof item.id === 'string' && item.id.trim().length > 0
        ? item.id.trim()
        : `variant-${index}-${slugify(colorName) || 'cor'}`
    variants.push({ id, colorName, colorHex, imageUrl, sizes: normalizeVariantSizes(item.sizes) })
  })
  return variants
}

const toTechnicalSheet = (value: unknown): ProductTechnicalSheet | undefined => {
  if (!isRecord(value)) return undefined
  const sheet: ProductTechnicalSheet = {
    fabric: typeof value.fabric === 'string' ? value.fabric : undefined,
    fit: typeof value.fit === 'string' ? value.fit : undefined,
    composition: typeof value.composition === 'string' ? value.composition : undefined,
    origin: typeof value.origin === 'string' ? value.origin : undefined,
    care: typeof value.care === 'string' ? value.care : undefined,
  }
  return Object.values(sheet).some((entry) => typeof entry === 'string' && entry.length > 0) ? sheet : undefined
}

export const getVariantStock = (variant: Pick<ProductColorVariant, 'sizes'>): number =>
  variant.sizes.reduce((total, entry) => total + normalizeVariantStock(entry.stock), 0)

export const normalizeProduct = (raw: unknown, fallbackId?: string): Product | null => {
  if (!isRecord(raw)) return null

  const name = typeof raw.name === 'string' ? raw.name.trim() : ''
  const id =
    (typeof raw.id === 'string' && raw.id.trim().length > 0 ? raw.id.trim() : undefined) ??
    fallbackId ??
    (name.length > 0 ? slugify(name) : undefined)

  if (!id || name.length === 0) return null

  const category =
    (typeof raw.category === 'string' && raw.category.trim().length > 0 ? raw.category.trim() : '') ||
    'Camisas'
  const niche =
    (typeof raw.niche === 'string' && raw.niche.trim().length > 0 ? raw.niche.trim() : '') ||
    deriveNiche(category)

  const price = raw.price === null || raw.price === undefined ? null : Number(raw.price)
  const originalPrice = raw.originalPrice === undefined ? undefined : Number(raw.originalPrice)
  const variants = toVariants(raw.variants)
  const variantColors = variants.map((variant) => variant.colorName)
  const variantSizes = variants.flatMap((variant) => variant.sizes.map((entry) => entry.size))
  const rootStock = normalizeStock(raw.stock)
  const stock = variants.length > 0 ? variants.reduce((total, variant) => total + getVariantStock(variant), 0) : rootStock
  const sizes = toStringArray(raw.sizes)
  const colors = toStringArray(raw.colors)
  const specifications = toStringArray(raw.specifications)

  return {
    id,
    sku: (typeof raw.sku === 'string' && raw.sku.trim().length > 0 ? raw.sku.trim() : '') || id.toUpperCase(),
    name,
    description: typeof raw.description === 'string' ? raw.description : '',
    price: price !== null && Number.isFinite(price) ? price : null,
    originalPrice:
      originalPrice !== undefined && Number.isFinite(originalPrice) ? originalPrice : undefined,
    imageUrl: typeof raw.imageUrl === 'string' ? raw.imageUrl : '',
    category,
    categorySlug:
      (typeof raw.categorySlug === 'string' && raw.categorySlug.trim().length > 0
        ? raw.categorySlug.trim()
        : '') || slugify(category),
    niche,
    sizes:
      variants.length > 0 && variantSizes.length > 0
        ? Array.from(new Set(variantSizes))
        : sizes.length > 0
          ? sizes
          : ['P', 'M', 'G', 'GG'],
    colors: variants.length > 0 ? variantColors : colors,
    inStock: stock > 0,
    stock,
    variants: variants.length > 0 ? variants : undefined,
    fullDescription:
      typeof raw.fullDescription === 'string' && raw.fullDescription.trim().length > 0
        ? raw.fullDescription
        : undefined,
    technicalSheet: toTechnicalSheet(raw.technicalSheet),
    specifications: specifications.length > 0 ? specifications : undefined,
    badge: typeof raw.badge === 'string' && raw.badge.trim().length > 0 ? raw.badge.trim() : undefined,
  }
}
