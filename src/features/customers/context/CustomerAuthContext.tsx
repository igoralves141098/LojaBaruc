import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from 'firebase/auth'
import { CustomerAuthContext, type CustomerAuthContextValue } from '@/features/customers/context/customer-context'
import { saveCustomerProfile, subscribeCustomer } from '@/features/customers/services/customer.service'
import type { Customer, CustomerSignUpInput } from '@/features/customers/types/customer.types'
import { auth } from '@/services/firebase'

const mapAuthError = (error: unknown): string => {
  const code = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : ''
  switch (code) {
    case 'auth/invalid-email':
      return 'E-mail inválido.'
    case 'auth/email-already-in-use':
      return 'Este e-mail já está cadastrado. Faça login.'
    case 'auth/weak-password':
      return 'A senha deve ter no mínimo 6 caracteres.'
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'E-mail ou senha incorretos.'
    case 'auth/too-many-requests':
      return 'Muitas tentativas. Aguarde alguns minutos e tente novamente.'
    case 'auth/network-request-failed':
      return 'Falha de conexão. Verifique sua internet.'
    case 'auth/operation-not-allowed':
      return 'Login por e-mail/senha não está habilitado no Firebase Authentication.'
    default:
      return 'Não foi possível concluir. Tente novamente.'
  }
}

interface CustomerAuthProviderProps {
  children: ReactNode
}

export const CustomerAuthProvider = ({ children }: CustomerAuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null)
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(auth !== null)
  const [error, setError] = useState<string>('')
  const isConfigured = auth !== null

  useEffect(() => {
    if (!auth) return

    const unsubscribe = onAuthStateChanged(
      auth,
      (nextUser) => {
        setUser(nextUser)
        if (!nextUser) {
          setCustomer(null)
          setIsLoading(false)
        }
      },
      () => {
        setUser(null)
        setCustomer(null)
        setIsLoading(false)
      },
    )

    return unsubscribe
  }, [])

  useEffect(() => {
    if (!user) return

    const unsubscribe = subscribeCustomer(
      user.uid,
      (nextCustomer) => {
        setCustomer(nextCustomer)
        setIsLoading(false)
      },
      () => {
        setCustomer(null)
        setIsLoading(false)
      },
    )

    return unsubscribe
  }, [user])

  const signIn = useCallback(async (email: string, password: string) => {
    if (!auth) throw new Error('Firebase Auth não configurado.')
    setError('')
    try {
      await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password)
    } catch (authError) {
      const message = mapAuthError(authError)
      setError(message)
      throw new Error(message, { cause: authError })
    }
  }, [])

  const signUp = useCallback(async (input: CustomerSignUpInput, password: string) => {
    if (!auth) throw new Error('Firebase Auth não configurado.')
    setError('')
    const email = input.email.trim().toLowerCase()
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password)
      await updateProfile(credential.user, { displayName: input.fullName.trim() })
      await saveCustomerProfile(credential.user.uid, { ...input, email })
    } catch (authError) {
      const message = mapAuthError(authError)
      setError(message)
      throw new Error(message, { cause: authError })
    }
  }, [])

  const signOut = useCallback(async () => {
    if (!auth) return
    setError('')
    await firebaseSignOut(auth)
    setCustomer(null)
  }, [])

  const value = useMemo<CustomerAuthContextValue>(
    () => ({ user, customer, isLoading, isConfigured, error, signIn, signUp, signOut }),
    [user, customer, isLoading, isConfigured, error, signIn, signUp, signOut],
  )

  return <CustomerAuthContext.Provider value={value}>{children}</CustomerAuthContext.Provider>
}
