import { getApps, initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'

export interface FirebaseWebConfig {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
}

const readConfig = (): FirebaseWebConfig => ({
  apiKey: (import.meta.env.VITE_FIREBASE_API_KEY ?? '').trim(),
  authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? '').trim(),
  projectId: (import.meta.env.VITE_FIREBASE_PROJECT_ID ?? '').trim(),
  storageBucket: (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? '').trim(),
  messagingSenderId: (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '').trim(),
  appId: (import.meta.env.VITE_FIREBASE_APP_ID ?? '').trim(),
})

export const firebaseConfig: FirebaseWebConfig = readConfig()

export const isFirebaseConfigured = (config: FirebaseWebConfig = firebaseConfig): boolean =>
  config.apiKey.length > 0 &&
  config.authDomain.length > 0 &&
  config.projectId.length > 0 &&
  config.appId.length > 0

const createApp = (config: FirebaseWebConfig): FirebaseApp | null => {
  if (!isFirebaseConfigured(config)) return null
  return getApps().length > 0 ? getApps()[0] : initializeApp(config)
}

export const firebaseApp: FirebaseApp | null = createApp(firebaseConfig)

export const db: Firestore | null = firebaseApp ? getFirestore(firebaseApp) : null

export const auth: Auth | null = firebaseApp ? getAuth(firebaseApp) : null

export const cloudEnabled: boolean = db !== null
