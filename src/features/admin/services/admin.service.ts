import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  writeBatch,
  type DocumentData,
} from 'firebase/firestore'
import { normalizeProduct } from '@/features/catalog/product-normalizer'
import type { Product } from '@/features/catalog/types/product.types'
import { cloudEnabled, db } from '@/services/firebase'

const PRODUCTS_COLLECTION = 'products'

export const isAdminCloudReady = (): boolean => cloudEnabled && db !== null

export const toFirestoreProduct = (product: Product): DocumentData => ({
  id: product.id,
  deleted: false,
  sku: product.sku,
  name: product.name,
  description: product.description,
  fullDescription: product.fullDescription ?? null,
  price: product.price,
  originalPrice: product.originalPrice ?? null,
  imageUrl: product.imageUrl,
  category: product.category,
  categorySlug: product.categorySlug,
  niche: product.niche,
  sizes: product.sizes,
  colors: product.colors,
  inStock: product.stock > 0,
  stock: product.stock,
  technicalSheet: product.technicalSheet
    ? {
        fabric: product.technicalSheet.fabric ?? null,
        fit: product.technicalSheet.fit ?? null,
        composition: product.technicalSheet.composition ?? null,
        origin: product.technicalSheet.origin ?? null,
        care: product.technicalSheet.care ?? null,
      }
    : null,
  specifications: product.specifications ?? [],
  badge: product.badge ?? null,
})

const mapSnapshotProduct = (id: string, data: DocumentData): Product | null => {
  if (data.deleted === true) return null
  return normalizeProduct(data, id)
}

export const subscribeProducts = (
  onData: (products: Product[]) => void,
  onError: (message: string) => void,
): (() => void) => {
  if (!cloudEnabled || !db) {
    onError('Firebase não configurado. Defina as variáveis VITE_FIREBASE_* no ambiente.')
    return () => undefined
  }

  return onSnapshot(
    collection(db, PRODUCTS_COLLECTION),
    (snapshot) => {
      const products: Product[] = []
      snapshot.forEach((document) => {
        const product = mapSnapshotProduct(document.id, document.data())
        if (product) products.push(product)
      })
      products.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
      onData(products)
    },
    (error) => {
      onError(
        error.code === 'permission-denied'
          ? 'Acesso negado. Confira se o seu usuário é administrador ativo no Firestore (admins/UID com active: true).'
          : `Falha ao carregar produtos: ${error.message}`,
      )
    },
  )
}

export const saveProduct = async (product: Product): Promise<void> => {
  if (!db) throw new Error('Firebase não configurado.')
  await setDoc(doc(db, PRODUCTS_COLLECTION, product.id), toFirestoreProduct(product), { merge: true })
}

export const removeProduct = async (productId: string): Promise<void> => {
  if (!db) throw new Error('Firebase não configurado.')
  await setDoc(doc(db, PRODUCTS_COLLECTION, productId), { deleted: true }, { merge: true })
}

export const importProducts = async (products: Product[]): Promise<number> => {
  if (!db) throw new Error('Firebase não configurado.')
  if (products.length === 0) return 0

  const batch = writeBatch(db)
  for (const product of products) {
    batch.set(doc(db, PRODUCTS_COLLECTION, product.id), toFirestoreProduct(product), { merge: true })
  }
  await batch.commit()
  return products.length
}
