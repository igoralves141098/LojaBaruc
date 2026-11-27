import { collection, onSnapshot, query, where } from 'firebase/firestore'
import type { Order } from '@/features/customers/types/order.types'
import { db } from '@/services/firebase'

const ORDERS_COLLECTION = 'orders'



export const subscribePaidOrders = (
  uid: string,
  onData: (orders: Order[]) => void,
  onError: (message: string) => void,
): (() => void) => {
  if (!db) {
    onError('Firebase não configurado. Defina as variáveis VITE_FIREBASE_* no ambiente.')
    return () => undefined
  }

  const q = query(
    collection(db, ORDERS_COLLECTION, uid, 'orders'),
    where('status', '==', 'paid'),
  )

  return onSnapshot(
    q,
    (snapshot) => {
      const orders = snapshot.docs.map((document) => {
        const data = document.data()
        return {
          id: document.id,
          uid: String(data.uid ?? uid),
          items: Array.isArray(data.items) ? data.items : [],
          total: typeof data.total === 'number' ? data.total : 0,
          status: data.status === 'paid' ? 'paid' : data.status === 'cancelled' ? 'cancelled' : 'pending',
          paymentMethod: data.paymentMethod,
          deliveryType: data.deliveryType,
          createdAt: data.createdAt?.toDate?.() ?? new Date(),
          updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
        } as Order
      })
      onData(orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()))
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