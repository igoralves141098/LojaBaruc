import { fallbackProducts } from '@/features/catalog/data/fallbackProducts'
import type { Product } from '@/features/catalog/types/product.types'

const PRODUCTS_ENDPOINT = `${import.meta.env.BASE_URL}api/products.json`
const REQUEST_TIMEOUT_MS = 8000

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string')

const isProduct = (value: unknown): value is Product => {
  if (!isRecord(value)) return false
  return (
    typeof value.id === 'string' &&
    typeof value.sku === 'string' &&
    typeof value.name === 'string' &&
    typeof value.description === 'string' &&
    typeof value.price === 'number' &&
    (value.originalPrice === undefined || typeof value.originalPrice === 'number') &&
    typeof value.imageUrl === 'string' &&
    typeof value.category === 'string' &&
    isStringArray(value.sizes) &&
    value.sizes.length > 0 &&
    typeof value.inStock === 'boolean' &&
    (value.badge === undefined || typeof value.badge === 'string')
  )
}

const cloneFallback = (): Product[] => fallbackProducts.map((product) => ({ ...product, sizes: [...product.sizes] }))

export const fetchProducts = async (): Promise<Product[]> => {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(PRODUCTS_ENDPOINT, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(`Falha ao carregar produtos: HTTP ${response.status}`)
    }

    const payload: unknown = await response.json()

    if (!Array.isArray(payload)) {
      throw new Error('Formato inválido: a resposta não é uma lista de produtos')
    }

    const products = payload.filter(isProduct)

    if (products.length === 0) {
      throw new Error('Nenhum produto válido encontrado na resposta')
    }

    return products
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('[product.service] Usando catálogo de fallback em memória.', error)
    }
    return cloneFallback()
  } finally {
    window.clearTimeout(timeoutId)
  }
}
