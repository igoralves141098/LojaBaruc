import { useId, useState, type FormEvent } from 'react'
import { KeyRound, Loader2, Lock, X } from 'lucide-react'

interface AdminLoginModalProps {
  onClose: () => void
  signIn: (email: string, password: string) => Promise<void>
  isConfigured: boolean
}

export const AdminLoginModal = ({ onClose, signIn, isConfigured }: AdminLoginModalProps) => {
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const emailId = useId()
  const passwordId = useId()

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isSubmitting) return
    setError('')

    if (email.trim().length === 0 || password.length === 0) {
      setError('Informe e-mail e senha.')
      return
    }

    setIsSubmitting(true)
    try {
      await signIn(email, password)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Não foi possível entrar.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div onClick={onClose} className="absolute inset-0 bg-black/70 backdrop-blur-sm" aria-hidden="true" />

      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between gap-3 bg-baruc-green px-5 py-4 text-baruc-gold">
          <div className="flex items-center gap-2.5">
            <Lock className="h-5 w-5" aria-hidden="true" />
            <h2 className="font-serif text-xl font-semibold">Área Restrita</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar área restrita"
            className="flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:bg-baruc-greenLight active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-baruc-gold"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5">
          <p className="text-sm text-neutral-500">
            Acesso exclusivo para administradores da BARUC. Entre com suas credenciais do Firebase.
          </p>

          {!isConfigured && (
            <p className="rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-3 text-xs font-medium text-amber-800">
              Firebase não configurado. Defina as chaves VITE_FIREBASE_* no arquivo .env e na Vercel.
            </p>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor={emailId} className="text-xs font-semibold text-neutral-600">
              E-mail
            </label>
            <input
              id={emailId}
              type="email"
              inputMode="email"
              autoComplete="username"
              enterKeyHint="next"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-11 w-full rounded-xl border border-neutral-200 bg-baruc-cream px-3.5 text-base text-neutral-900 placeholder:text-neutral-400 focus:border-baruc-gold focus:outline-none focus:ring-2 focus:ring-baruc-gold/25"
              placeholder="admin@baruc.com.br"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor={passwordId} className="text-xs font-semibold text-neutral-600">
              Senha
            </label>
            <div className="relative">
              <KeyRound
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
                aria-hidden="true"
              />
              <input
                id={passwordId}
                type="password"
                autoComplete="current-password"
                enterKeyHint="go"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-11 w-full rounded-xl border border-neutral-200 bg-baruc-cream pl-10 pr-3.5 text-base text-neutral-900 placeholder:text-neutral-400 focus:border-baruc-gold focus:outline-none focus:ring-2 focus:ring-baruc-gold/25"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !isConfigured}
            className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl border border-baruc-gold bg-baruc-green px-4 text-sm font-bold text-baruc-gold transition-all hover:bg-baruc-greenDark active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-baruc-gold focus-visible:ring-offset-2"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Lock className="h-4 w-4" aria-hidden="true" />}
            Entrar no painel
          </button>
        </form>
      </div>
    </div>
  )
}
