import { createContext } from 'react'
import type { User } from 'firebase/auth'
import type {
  Customer,
  CustomerProfileInput,
  CustomerSignUpInput,
} from '@/features/customers/types/customer.types'

export const LOGIN_REQUIRED_FOR_CART_MESSAGE =
  'Faça login ou cadastre-se para adicionar peças ao carrinho e finalizar sua compra.'

export interface CustomerAuthContextValue {
  user: User | null
  customer: Customer | null
  isLoading: boolean
  isConfigured: boolean
  error: string
  needsProfile: boolean
  needsEmailVerification: boolean
  isAuthModalOpen: boolean
  authModalReason: string
  openAuthModal: (reasonMessage?: string) => void
  closeAuthModal: () => void
  signIn: (email: string, password: string) => Promise<void>
  signUp: (input: CustomerSignUpInput, password: string) => Promise<void>
  completeProfile: (input: CustomerProfileInput) => Promise<void>
  verifyEmail: () => Promise<void>
  resendVerification: () => Promise<void>
  signOut: () => Promise<void>
  refreshCustomer?: () => Promise<void>
  canResend?: boolean
  resendCooldown?: number
}

export const CustomerAuthContext = createContext<CustomerAuthContextValue | null>(null)
