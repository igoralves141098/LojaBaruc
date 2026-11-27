import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
} from 'firebase/firestore'
import { db } from '@/services/firebase'
import type { Order, OrderDeliveryMethod, OrderItem, OrderPaymentMethod } from '@/features/orders/order.types'

const ORDERS_COLLECTION = 'orders'
const PRODUCTS_COLLECTION = 'products'

const toDate = (value: unknown): Date | null => {
  if (!value) return null
  if (value instanceof Date) return value
  if (value instanceof Timestamp) return value.toDate()
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    const fn = (value as { toDate?: () => Date }).toDate
    if (typeof fn === 'function') return fn.call(value)
  }
  return null
}

const generateOrderCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let suffix = ''
  for (let i = 0; i < 5; i += 1) suffix += chars[Math.floor(Math.random() * chars.length)]
  return `BRC-${suffix}`
}

const normalizeItem = (item: unknown): OrderItem | null => {
  if (typeof item !== 'object' || item === null) return null
  const r = item as Record<string, unknown>
  const quantity = typeof r.quantity === 'number' && Number.isFinite(r.quantity) ? Math.max(0, r.quantity) : 0
  const unitPrice = typeof r.unitPrice === 'number' && Number.isFinite(r.unitPrice) ? r.unitPrice : 0
  const subtotal = typeof r.subtotal === 'number' && Number.isFinite(r.subtotal) ? r.subtotal : unitPrice * quantity
  return {
    productId: String(r.productId ?? ''),
    name: String(r.name ?? r.productName ?? 'Produto'),
    sku: String(r.sku ?? ''),
    colorName: String(r.colorName ?? r.color ?? ''),
    colorHex: String(r.colorHex ?? ''),
    size: String(r.size ?? ''),
    quantity,
    unitPrice,
    subtotal,
  }
}

const normalizeOrder = (id: string, data: Record<string, unknown>): Order => {
  const itemsRaw = Array.isArray(data.items) ? data.items : []
  const items = itemsRaw.map(normalizeItem).filter((i): i is OrderItem => i !== null)
  const status = data.status === 'paid' ? 'paid' : 'pending'
  const paymentMethod: OrderPaymentMethod =
    data.paymentMethod === 'PIX' || data.paymentMethod === 'Cartão' || data.paymentMethod === 'Combinar'
      ? data.paymentMethod
      : 'Combinar'
  const deliveryMethod: OrderDeliveryMethod =
    data.deliveryMethod === 'Entrega' || data.deliveryMethod === 'Retirada na Loja'
      ? data.deliveryMethod
      : data.deliveryType === 'Retirada na Loja'
        ? 'Retirada na Loja'
        : 'Entrega'

  return {
    id,
    orderCode: String(data.orderCode ?? data.shortCode ?? id),
    customerId: typeof data.customerId === 'string' ? data.customerId : data.uid ? String(data.uid) : null,
    customerName: String(data.customerName ?? ''),
    customerEmail: String(data.customerEmail ?? ''),
    customerCpf: String(data.customerCpf ?? ''),
    customerPhone: String(data.customerPhone ?? ''),
    items,
    totalAmount: typeof data.totalAmount === 'number' ? data.totalAmount : typeof data.total === 'number' ? data.total : 0,
    paymentMethod,
    deliveryMethod,
    status,
    createdAt: toDate(data.createdAt),
    paidAt: toDate(data.paidAt),
  }
}

export interface CreateOrderInput {
  customerId: string | null
  customerName: string
  customerEmail: string
  customerCpf: string
  customerPhone: string
  items: OrderItem[]
  totalAmount: number
  paymentMethod: OrderPaymentMethod
  deliveryMethod: OrderDeliveryMethod
}

export const createPendingOrder = async (input: CreateOrderInput): Promise<string> => {
  if (!db) throw new Error('Firebase não configurado.')
  const orderCode = generateOrderCode()
  const ref = doc(collection(db, ORDERS_COLLECTION))
  await setDoc(ref, {
    orderCode,
    customerId: input.customerId,
    customerName: input.customerName.trim(),
    customerEmail: input.customerEmail.trim(),
    customerCpf: input.customerCpf.trim(),
    customerPhone: input.customerPhone.trim(),
    items: input.items,
    totalAmount: input.totalAmount,
    paymentMethod: input.paymentMethod,
    deliveryMethod: input.deliveryMethod,
    status: 'pending',
    createdAt: serverTimestamp(),
    paidAt: null,
  })
  return orderCode
}

export const subscribeAllOrders = (
  onData: (orders: Order[]) => void,
  onError: (message: string) => void,
): (() => void) => {
  if (!db) {
    onError('Firebase não configurado. Defina as variáveis VITE_FIREBASE_* no ambiente.')
    return () => undefined
  }

  const q = query(collection(db, ORDERS_COLLECTION))
  return onSnapshot(
    q,
    (snapshot) => {
      const orders = snapshot.docs.map((d) => normalizeOrder(d.id, d.data() as Record<string, unknown>))
      onData(orders.sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0)))
    },
    (error) => {
      onError(
        error.code === 'permission-denied'
          ? 'Acesso negado aos pedidos. Confira as regras do Firestore.'
          : `Falha ao carregar pedidos: ${error.message}`,
      )
    },
  )
}

const clampStock = (value: unknown): number => {
  const n = typeof value === 'number' && Number.isFinite(value) ? Math.floor(value) : 0
  return Math.max(0, n)
}

export const confirmOrderPayment = async (orderId: string): Promise<void> => {
  const firestore = db
  if (!firestore) throw new Error('Firebase não configurado.')

  await runTransaction(firestore, async (transaction) => {
    const orderRef = doc(firestore, ORDERS_COLLECTION, orderId)
    const orderSnap = await transaction.get(orderRef)
    if (!orderSnap.exists()) throw new Error('Pedido não encontrado.')
    const orderData = orderSnap.data() as Record<string, unknown>
    if (orderData.status === 'paid') return

    const itemsRaw = Array.isArray(orderData.items) ? orderData.items : []
    const items = itemsRaw.map(normalizeItem).filter((i): i is OrderItem => i !== null)

    // Read all referenced products
    const productRefs = Array.from(new Set(items.map((i) => i.productId).filter(Boolean))).map((pid) =>
      doc(firestore, PRODUCTS_COLLECTION, pid),
    )
    const productSnaps = await Promise.all(productRefs.map((ref) => transaction.get(ref)))

    const updates = new Map<string, { ref: ReturnType<typeof doc>; data: Record<string, unknown> }>()
    productSnaps.forEach((snap, idx) => {
      if (snap.exists()) {
        updates.set(productRefs[idx].id, { ref: productRefs[idx], data: snap.data() as Record<string, unknown> })
      }
    })

    for (const item of items) {
      const entry = updates.get(item.productId)
      if (!entry) continue
      const product = { ...entry.data }
      const variants = Array.isArray(product.variants) ? [...product.variants] : []

      if (variants.length > 0) {
        let remaining = item.quantity
        const nextVariants = variants.map((v) => {
          if (typeof v !== 'object' || v === null) return v
          const variant = { ...(v as Record<string, unknown>) }
          const colorName = String(variant.colorName ?? '')
          if (colorName !== item.colorName) return variant
          const sizes = Array.isArray(variant.sizes) ? [...variant.sizes] : []
          const nextSizes = sizes.map((s) => {
            if (typeof s !== 'object' || s === null) return s
            const sizeEntry = { ...(s as Record<string, unknown>) }
            if (String(sizeEntry.size ?? '') !== item.size) return sizeEntry
            const current = clampStock(sizeEntry.stock)
            const deducted = Math.min(current, remaining)
            remaining -= deducted
            sizeEntry.stock = current - deducted
            return sizeEntry
          })
          variant.sizes = nextSizes
          // Recalculate variant stock from sizes if they exist
          if (nextSizes.length > 0) {
            variant.stock = nextSizes.reduce((sum, s) => {
              const se = s as Record<string, unknown>
              return sum + clampStock(se.stock)
            }, 0)
          }
          return variant
        })
        product.variants = nextVariants
        product.stock = nextVariants.reduce((sum, v) => {
          const vr = v as Record<string, unknown>
          const sizes = Array.isArray(vr.sizes) ? vr.sizes : []
          if (sizes.length > 0) {
            return sum + sizes.reduce((s2, s) => s2 + clampStock((s as Record<string, unknown>).stock), 0)
          }
          return sum + clampStock(vr.stock)
        }, 0)
      } else {
        product.stock = clampStock(product.stock) - Math.min(clampStock(product.stock), item.quantity)
      }

      entry.data = product
      updates.set(item.productId, entry)
    }

    updates.forEach(({ ref, data }) => {
      transaction.set(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true })
    })

    transaction.set(
      orderRef,
      { status: 'paid', paidAt: serverTimestamp() },
      { merge: true },
    )
  })
}

export const deleteOrder = async (orderId: string): Promise<void> => {
  if (!db) throw new Error('Firebase não configurado.')
  await deleteDoc(doc(db, ORDERS_COLLECTION, orderId))
}

// Compatibility helpers used by existing code paths; keep them safe.
export const saveOrder = async (_uid: string, _order: unknown): Promise<string> => {
  throw new Error('Use createPendingOrder para criar pedidos.')
}
