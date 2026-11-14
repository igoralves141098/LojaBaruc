export interface Product {
  id: string
  sku: string
  name: string
  description: string
  price: number
  originalPrice?: number
  imageUrl: string
  category: string
  sizes: string[]
  inStock: boolean
  badge?: string
}
