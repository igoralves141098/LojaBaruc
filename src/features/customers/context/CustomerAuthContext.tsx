import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from 'firebase/auth'
import { CustomerAuthContext, type CustomerAuthContextValue } from '@/features/customers/context/customer-context'
import {
  saveCustomerProfile,
  subscribeCustomer,
  updateCustomerVerification,
} from '@/features/customers/services/customer.service'
import type {
  Customer,
  CustomerProfileInput,
  CustomerSignUpInput,
} from '@/features/customers/types/customer.types'
import { auth } from '@/services/firebase'

const ADMIN_EMAIL = 'loja.baruccg@gmail.com'
const RESEND_COOLDOWN_MS = 30_000

type ProfileStatus = 'idle' | 'loading' | 'found' | 'missing' | 'error'

const isAdminEmail = (email: string | null | undefined): boolean =>
  (email ?? '').trim().toLowerCase() === ADMIN_EMAIL

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

const mapProfileError = (error: unknown): string =>
  error instanceof Error && error.message.trim().length > 0
    ? error.message
    : 'Não foi possível salvar seus dados. Tente novamente.'

interface CustomerAuthProviderProps {
  children: ReactNode
}

export const CustomerAuthProvider = ({ children }: CustomerAuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null)
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [profileStatus, setProfileStatus] = useState<ProfileStatus>('idle')
  const [isLoading, setIsLoading] = useState<boolean>(auth !== null)
  const [error, setError] = useState<string>('')
  const [resendCooldown, setResendCooldown] = useState<number>(0)
  const signupInProgressRef = useRef<boolean>(false)
  const isConfigured = auth !== null

  useEffect(() => {
    if (!auth) return

    const unsubscribe = onAuthStateChanged(
      auth,
      (nextUser) => {
        setUser(nextUser)
        if (!nextUser) {
          setCustomer(null)
          setProfileStatus('idle')
          setIsLoading(false)
          return
        }
        if (isAdminEmail(nextUser.email)) {
          setCustomer(null)
          setProfileStatus('idle')
          setIsLoading(false)
          return
        }
        setProfileStatus('loading')
      },
      () => {
        setUser(null)
        setCustomer(null)
        setProfileStatus('error')
        setIsLoading(false)
      },
    )

    return unsubscribe
  }, [])

  useEffect(() => {
    if (!user || isAdminEmail(user.email)) return

    const unsubscribe = subscribeCustomer(
      user.uid,
      (nextCustomer) => {
        if (!nextCustomer && signupInProgressRef.current) {
          setIsLoading(false)
          return
        }
        setCustomer(nextCustomer)
        setProfileStatus(nextCustomer ? 'found' : 'missing')
        setIsLoading(false)
      },
      () => {
        setCustomer(null)
        setProfileStatus('error')
        setIsLoading(false)
      },
    )

    return unsubscribe
  }, [user])

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = window.setInterval(() => {
        setResendCooldown((prev) => (prev > 1 ? prev - 1 : 0))
      }, 1000)
      return () => window.clearInterval(timer)
    }
  }, [resendCooldown])

  const needsProfile =
    user !== null && !isAdminEmail(user.email) && profileStatus === 'missing'

  const needsEmailVerification =
    user !== null &&
    !isAdminEmail(user.email) &&
    profileStatus !== 'missing' &&
    customer?.emailVerified === false

  const canResend = resendCooldown === 0 && isConfigured

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
    let accountCreated = false
    signupInProgressRef.current = true
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password)
      accountCreated = true
      await updateProfile(credential.user, { displayName: input.fullName.trim() })
      await sendEmailVerification(credential.user)
      await saveCustomerProfile(credential.user.uid, { ...input, email })
    } catch (authError) {
      if (accountCreated) setProfileStatus('missing')
      const message = mapAuthError(authError)
      setError(message)
      throw new Error(message, { cause: authError })
    } finally {
      signupInProgressRef.current = false
    }
  }, [])

  const completeProfile = useCallback(async (input: CustomerProfileInput) => {
    if (!auth) throw new Error('Firebase Auth não configurado.')
    const currentUser = auth.currentUser
    if (!currentUser) throw new Error('Sessão expirada. Entre novamente.')

    setError('')
    try {
      await updateProfile(currentUser, { displayName: input.fullName.trim() })
      await saveCustomerProfile(currentUser.uid, {
        ...input,
        email: currentUser.email ?? '',
      })
      setProfileStatus('loading')
    } catch (profileError) {
      const message = mapProfileError(profileError)
      setError(message)
      throw new Error(message, { cause: profileError })
    }
  }, [])

  const verifyEmail = useCallback(async () => {
    if (!auth) throw new Error('Firebase Auth não configurado.')
    const currentUser = auth.currentUser
    if (!currentUser) throw new Error('Sessão expirada. Entre novamente.')
    setError('')
    try {
      await currentUser.reload()
      if (currentUser.emailVerified === true && customer) {
        await updateCustomerVerification(customer.uid, true, 'active')
        setCustomer((prev) => (prev ? { ...prev, emailVerified: true, status: 'active' } : prev))
      }
    } catch (verifyError) {
      const message = mapProfileError(verifyError)
      setError(message)
      throw new Error(message, { cause: verifyError })
    }
  }, [auth, customer, updateCustomerVerification])

  const resendVerification = useCallback(async () => {
    if (!auth) throw new Error('Firebase Auth não configurado.')
    if (!canResend) return
    const currentUser = auth.currentUser
    if (!currentUser) throw new Error('Sessão expirada. Entre novamente.')
    setError('')
    try {
      await sendEmailVerification(currentUser)
      setResendCooldown(RESEND_COOLDOWN_MS / 1000)
    } catch (resendError) {
      const message = mapProfileError(resendError)
      setError(message)
      throw new Error(message, { cause: resendError })
    }
  }, [auth, canResend])

  const signOut = useCallback(async () => {
    if (!auth) return
    setError('')
    await firebaseSignOut(auth)
    setCustomer(null)
    setProfileStatus('idle')
    setResendCooldown(0)
  }, [])

    const refreshCustomer = useCallback(async () => {
    if (!auth?.currentUser) return
    await auth.currentUser.reload()
    setUser({ ...auth.currentUser })
  }, [])

  const value = useMemo<CustomerAuthContextValue>(
    () => ({
      user,
      customer,
      isLoading,
      isConfigured,
      error,
      needsProfile,
      needsEmailVerification,
      signIn,
      signUp,
      completeProfile,
      verifyEmail,
      resendVerification,
      signOut,
      refreshCustomer,
      canResend,
      resendCooldown,
    }),
    [
      user,
      customer,
      isLoading,
      isConfigured,
      error,
      needsProfile,
      needsEmailVerification,
      signIn,
      signUp,
      completeProfile,
      verifyEmail,
      resendVerification,
      signOut,
      refreshCustomer,
      canResend,
      resendCooldown,
    ],
  )

  return <CustomerAuthContext.Provider value={value}>{children}</CustomerAuthContext.Provider>
}
