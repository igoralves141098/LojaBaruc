import { firebaseApp, firebaseConfig, isFirebaseConfigured } from '@/services/firebase'

const MAX_DIMENSION = 900
const QUALITY = 0.82
const MAX_DATA_URL_CHARS = 320_000
const STORAGE_UPLOAD_TIMEOUT_MS = 12000

const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result)
      else reject(new Error('Não foi possível ler o arquivo de imagem.'))
    }
    reader.onerror = () => reject(reader.error ?? new Error('Não foi possível ler o arquivo de imagem.'))
    reader.readAsDataURL(file)
  })

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Arquivo de imagem inválido.'))
    image.src = src
  })

const toSafeFileName = (name: string): string =>
  name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    .slice(0, 48) || 'imagem'

export interface CompressImageOptions {
  maxDimension?: number
  quality?: number
}

export const compressImageToDataUrl = async (
  file: File,
  options: CompressImageOptions = {},
): Promise<string> => {
  const maxDimension = options.maxDimension ?? MAX_DIMENSION
  const quality = options.quality ?? QUALITY
  const dataUrl = await readFileAsDataUrl(file)
  const image = await loadImage(dataUrl)

  const scale = Math.min(1, maxDimension / Math.max(image.width, image.height))
  const width = Math.max(1, Math.round(image.width * scale))
  const height = Math.max(1, Math.round(image.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) return dataUrl

  context.drawImage(image, 0, 0, width, height)

  const encode = (nextQuality: number): string => {
    const webp = canvas.toDataURL('image/webp', nextQuality)
    if (webp.startsWith('data:image/webp')) return webp
    return canvas.toDataURL('image/jpeg', nextQuality)
  }

  let result = encode(quality)
  let currentQuality = quality
  while (result.length > MAX_DATA_URL_CHARS && currentQuality > 0.5) {
    currentQuality = Math.max(0.5, Math.round((currentQuality - 0.1) * 100) / 100)
    result = encode(currentQuality)
  }

  return result
}

const uploadToFirebaseStorage = async (file: File, path: string): Promise<string> => {
  if (!firebaseApp || !isFirebaseConfigured(firebaseConfig) || firebaseConfig.storageBucket.length === 0) {
    throw new Error('Firebase Storage não configurado.')
  }

  const { getDownloadURL, getStorage, ref, uploadBytes } = await import('firebase/storage')
  const storage = getStorage(firebaseApp)
  const storageRef = ref(storage, path)

  const uploadPromise = uploadBytes(storageRef, file, {
    contentType: file.type || 'image/jpeg',
  }).then((snapshot) => getDownloadURL(snapshot.ref))

  const timeoutPromise = new Promise<never>((_, reject) => {
    window.setTimeout(() => reject(new Error('Tempo esgotado ao enviar a imagem para o Storage.')), STORAGE_UPLOAD_TIMEOUT_MS)
  })

  void uploadPromise.catch(() => undefined)

  return Promise.race([uploadPromise, timeoutPromise])
}

export const uploadProductImage = async (file: File, folder = 'products'): Promise<string> => {
  const safeName = toSafeFileName(file.name)
  const path = `${folder}/${Date.now()}-${safeName}`

  try {
    return await uploadToFirebaseStorage(file, path)
  } catch {
    return compressImageToDataUrl(file)
  }
}
