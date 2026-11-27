import { createContext } from 'react'
import type { User } from 'firebase/auth'
import type { Customer, CustomerSignUpInput } from '@/features/customers/types/customer.types'

export interface CustomerAuthContextValue {
  user: User | null
  customer: Customer | null
  isLoading: boolean
  isConfigured: boolean
  error: string
  signIn: (email: string, password: string) => Promise<void>
  signUp: (input: CustomerSignUpInput, password: string) => Promise<void>
  signOut: () => Promise<void>
}

export const CustomerAuthContext = createContext<CustomerAuthContextValue | null>(null)
