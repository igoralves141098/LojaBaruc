import { useCallback, useEffect, useState } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth'
import { auth } from '@/services/firebase'

export interface AdminAuthState {
  user: User | null
  isLoading: boolean
  isConfigured: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const mapAuthError = (error: unknown): string => {
  const code = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : ''
  switch (code) {
    case 'auth/invalid-email':
      return 'E-mail inválido.'
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
      return 'Não foi possível entrar. Tente novamente.'
  }
}

export const useAdminAuth = (): AdminAuthState => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(auth !== null)
  const isConfigured = auth !== null

  useEffect(() => {
    if (!auth) return

    const unsubscribe = onAuthStateChanged(
      auth,
      (nextUser) => {
        setUser(nextUser)
        setIsLoading(false)
      },
      () => {
        setUser(null)
        setIsLoading(false)
      },
    )

    return unsubscribe
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    if (!auth) throw new Error('Firebase Auth não configurado.')
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password)
    } catch (error) {
      throw new Error(mapAuthError(error), { cause: error })
    }
  }, [])

  const signOut = useCallback(async () => {
    if (!auth) return
    await firebaseSignOut(auth)
  }, [])

  return { user, isLoading, isConfigured, signIn, signOut }
}
