import { collection, getDocs, type DocumentData } from 'firebase/firestore'
import { normalizeProduct } from '@/features/catalog/product-normalizer'
import type { Product } from '@/features/catalog/types/product.types'
import { cloudEnabled, db } from '@/services/firebase'

const PRODUCTS_ENDPOINT = `${import.meta.env.BASE_URL}api/products.json`
const REQUEST_TIMEOUT_MS = 8000

const resolveImageUrl = (imageUrl: string): string => {
  if (imageUrl.length === 0) return imageUrl
  return /^(https?:)?\/\//.test(imageUrl) ||
    imageUrl.startsWith('/') ||
    imageUrl.startsWith('data:') ||
    imageUrl.startsWith('blob:')
    ? imageUrl
    : `${import.meta.env.BASE_URL}${imageUrl}`
}

const withResolvedImage = (product: Product): Product => ({
  ...product,
  imageUrl: resolveImageUrl(product.imageUrl),
  variants: product.variants?.map((variant) => ({
    ...variant,
    imageUrl: resolveImageUrl(variant.imageUrl),
  })),
})

const fetchLocalProducts = async (): Promise<Product[]> => {
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

    return payload
      .map((item) => normalizeProduct(item))
      .filter((product): product is Product => product !== null)
      .map(withResolvedImage)
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('[product.service] Não foi possível carregar o catálogo local.', error)
    }
    return []
  } finally {
    window.clearTimeout(timeoutId)
  }
}

const withTimeout = <T>(promise: Promise<T>, timeoutMs: number): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error('Tempo esgotado ao consultar o Firestore')), timeoutMs)
    promise.then(
      (value) => {
        window.clearTimeout(timer)
        resolve(value)
      },
      (error) => {
        window.clearTimeout(timer)
        reject(error)
      },
    )
  })

interface RemoteCatalog {
  products: Product[]
  deletedIds: string[]
  total: number
}

const fetchRemoteProducts = async (): Promise<RemoteCatalog> => {
  if (!cloudEnabled || !db) return { products: [], deletedIds: [], total: 0 }

  try {
    const snapshot = await withTimeout(getDocs(collection(db, 'products')), REQUEST_TIMEOUT_MS)
    const products: Product[] = []
    const deletedIds: string[] = []

    snapshot.forEach((docSnapshot) => {
      const data: DocumentData = docSnapshot.data()
      if (data.deleted === true) {
        deletedIds.push(docSnapshot.id)
        return
      }
      const product = normalizeProduct(data, docSnapshot.id)
      if (product) products.push(withResolvedImage(product))
    })

    return { products, deletedIds, total: snapshot.size }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('[product.service] Firestore indisponível, usando catálogo local.', error)
    }
    return { products: [], deletedIds: [], total: 0 }
  }
}

export const fetchRemoteCatalog = fetchRemoteProducts
export const fetchLocalCatalog = fetchLocalProducts

export const fetchProducts = async (): Promise<Product[]> => {
  const [localProducts, remote] = await Promise.all([fetchLocalProducts(), fetchRemoteProducts()])

  if (remote.total === 0) return localProducts

  const merged = new Map<string, Product>(localProducts.map((product) => [product.id, product]))
  for (const product of remote.products) {
    merged.set(product.id, product)
  }
  for (const deletedId of remote.deletedIds) {
    merged.delete(deletedId)
  }

  return [...merged.values()]
}
