export const OFFICIAL_SIZES = ['P', 'M', 'G', 'GG'] as const

export interface ProductTechnicalSheet {
  fabric?: string
  fit?: string
  composition?: string
  origin?: string
  care?: string
}

export interface Product {
  id: string
  sku: string
  name: string
  description: string
  price: number | null
  originalPrice?: number
  imageUrl: string
  category: string
  categorySlug: string
  niche: string
  sizes: string[]
  colors: string[]
  inStock: boolean
  stock: number
  fullDescription?: string
  technicalSheet?: ProductTechnicalSheet
  specifications?: string[]
  badge?: string
}
