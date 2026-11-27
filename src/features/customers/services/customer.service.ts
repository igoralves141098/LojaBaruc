import {
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type DocumentData,
} from 'firebase/firestore'
import type { Customer, CustomerSignUpInput } from '@/features/customers/types/customer.types'
import { db } from '@/services/firebase'

const CUSTOMERS_COLLECTION = 'customers'

const toDate = (value: unknown): Date | null => {
  if (value === null || value === undefined) return null
  if (value instanceof Date) return value
  if (typeof value === 'object' && 'toDate' in value) {
    const toDateFn = (value as { toDate?: () => Date }).toDate
    if (typeof toDateFn === 'function') {
      try {
        return toDateFn.call(value)
      } catch {
        return null
      }
    }
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }
  return null
}

const toStringValue = (value: unknown): string => (typeof value === 'string' ? value : '')
const toBooleanValue = (value: unknown): boolean => value === true

export const normalizeCustomer = (uid: string, data: DocumentData): Customer => ({
  uid: typeof data.uid === 'string' && data.uid.length > 0 ? data.uid : uid,
  fullName: toStringValue(data.fullName),
  email: toStringValue(data.email),
  cpf: toStringValue(data.cpf),
  birthDate: toStringValue(data.birthDate),
  phone: toStringValue(data.phone),
  emailVerified: toBooleanValue(data.emailVerified),
  status: (() => {
    const raw = data.status
    if (raw === 'pending_verification' || raw === 'active' || raw === 'inactive') return raw
    return data.emailVerified === true ? 'active' : 'pending_verification'
  })(),
  createdAt: toDate(data.createdAt),
  updatedAt: toDate(data.updatedAt),
})

export const isCustomersCloudReady = (): boolean => db !== null

export const subscribeCustomers = (
  onData: (customers: Customer[]) => void,
  onError: (message: string) => void,
): (() => void) => {
  if (!db) {
    onError('Firebase não configurado. Defina as variáveis VITE_FIREBASE_* no ambiente.')
    return () => undefined
  }

  return onSnapshot(
    collection(db, CUSTOMERS_COLLECTION),
    (snapshot) => {
      const customers = snapshot.docs
        .map((document) => normalizeCustomer(document.id, document.data()))
        .sort((a, b) => a.fullName.localeCompare(b.fullName, 'pt-BR'))
      onData(customers)
    },
    (error) => {
      onError(
        error.code === 'permission-denied'
          ? 'Acesso negado aos clientes. Confira as regras do Firestore para administradores.'
          : `Falha ao carregar clientes: ${error.message}`,
      )
    },
  )
}

export const subscribeCustomer = (
  uid: string,
  onData: (customer: Customer | null) => void,
  onError: (message: string) => void,
): (() => void) => {
  if (!db) {
    onData(null)
    return () => undefined
  }

  return onSnapshot(
    doc(db, CUSTOMERS_COLLECTION, uid),
    (snapshot) => {
      onData(snapshot.exists() ? normalizeCustomer(snapshot.id, snapshot.data()) : null)
    },
    (error) => onError(error.message),
  )
}

export const saveCustomerProfile = async (uid: string, input: CustomerSignUpInput): Promise<void> => {
  if (!db) throw new Error('Firebase não configurado.')
  await setDoc(doc(db, CUSTOMERS_COLLECTION, uid), {
    uid,
    fullName: input.fullName.trim(),
    email: input.email.trim().toLowerCase(),
    cpf: input.cpf.trim(),
    birthDate: input.birthDate,
    phone: input.phone.trim(),
    emailVerified: false,
    status: 'pending_verification',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export const updateCustomerProfile = async (
  uid: string,
  input: { fullName?: string; cpf?: string; birthDate?: string; phone?: string },
): Promise<void> => {
  if (!db) throw new Error('Firebase não configurado.')
  await setDoc(
    doc(db, CUSTOMERS_COLLECTION, uid),
    {
      fullName: input.fullName?.trim(),
      cpf: input.cpf?.trim(),
      birthDate: input.birthDate,
      phone: input.phone?.trim(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}

export const updateCustomerVerification = async (
  uid: string,
  emailVerified: boolean,
  status: Customer['status'],
): Promise<void> => {
  if (!db) throw new Error('Firebase não configurado.')
  await setDoc(
    doc(db, CUSTOMERS_COLLECTION, uid),
    {
      emailVerified,
      status,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}
