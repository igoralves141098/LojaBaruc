import { useContext } from 'react'
import { CustomerAuthContext, type CustomerAuthContextValue } from '@/features/customers/context/customer-context'

export const useCustomerAuth = (): CustomerAuthContextValue => {
  const context = useContext(CustomerAuthContext)
  if (!context) {
    throw new Error('useCustomerAuth deve ser utilizado dentro de um <CustomerAuthProvider>.')
  }
  return context
}
