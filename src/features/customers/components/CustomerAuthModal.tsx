import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { Loader2, Lock, LogOut, Mail, RefreshCcw, ShieldCheck, UserRound, X } from 'lucide-react'
import { useCustomerAuth } from '@/features/customers/hooks/useCustomerAuth'
import {
  formatCpf,
  formatPhone,
  isValidCpf,
  isValidPhone,
} from '@/features/customers/utils/customer.utils'
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock'

type AuthMode = 'login' | 'signup'

interface CustomerAuthModalProps {
  onClose: () => void
}

const INPUT_CLASS =
  'h-11 w-full rounded-xl border border-neutral-200 bg-baruc-cream px-3.5 text-base text-neutral-900 placeholder:text-neutral-400 focus:border-baruc-gold focus:outline-none focus:ring-2 focus:ring-baruc-gold/25'
const LABEL_CLASS = 'text-xs font-semibold text-neutral-600'

export const CustomerAuthModal = ({ onClose }: CustomerAuthModalProps) => {
  const {
    signIn,
    signUp,
    completeProfile,
    verifyEmail,
    resendVerification,
    signOut,
    isConfigured,
    error: contextError,
    needsProfile,
    needsEmailVerification,
    user,
    canResend,
    resendCooldown,
    authModalReason,
  } = useCustomerAuth()
  const isCompleting = needsProfile
  const isVerifying = needsEmailVerification
  const [mode, setMode] = useState<AuthMode>('login')
  const [fullName, setFullName] = useState<string>(() => (needsProfile ? user?.displayName ?? '' : ''))
  const [email, setEmail] = useState<string>('')
  const [cpf, setCpf] = useState<string>('')
  const [birthDate, setBirthDate] = useState<string>('')
  const [phone, setPhone] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const titleId = useId()
  const nameId = useId()
  const emailId = useId()
  const cpfId = useId()
  const birthId = useId()
  const phoneId = useId()
  const passwordId = useId()

  useBodyScrollLock(true)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isCompleting || isVerifying) {
          void signOut()
        } else {
          onClose()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    const focusTimer = window.setTimeout(() => closeButtonRef.current?.focus({ preventScroll: true }), 50)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.clearTimeout(focusTimer)
    }
  }, [onClose, isCompleting, isVerifying, signOut])

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode)
    setError('')
  }

  const handleExit = () => {
    if (isCompleting || isVerifying) {
      void signOut()
    }
    onClose()
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isSubmitting) return
    setError('')

    if (isCompleting) {
      if (fullName.trim().length < 3) {
        setError('Informe seu nome completo.')
        return
      }
      if (!isValidCpf(cpf)) {
        setError('Informe um CPF válido.')
        return
      }
      if (!birthDate) {
        setError('Informe sua data de nascimento.')
        return
      }
      if (!isValidPhone(phone)) {
        setError('Informe um telefone válido com DDD.')
        return
      }

      setIsSubmitting(true)
      try {
        await completeProfile({ fullName: fullName.trim(), cpf, birthDate, phone })
        onClose()
      } catch (submitError) {
        setError(submitError instanceof Error ? submitError.message : 'Não foi possível salvar seus dados.')
      } finally {
        setIsSubmitting(false)
      }
      return
    }

    if (isVerifying) {
      setIsSubmitting(true)
      try {
        await verifyEmail()
        onClose()
      } catch (submitError) {
        setError(submitError instanceof Error ? submitError.message : 'Não foi possível verificar o e-mail.')
      } finally {
        setIsSubmitting(false)
      }
      return
    }

    if (mode === 'login') {
      if (email.trim().length === 0 || password.length === 0) {
        setError('Informe e-mail e senha.')
        return
      }
      setIsSubmitting(true)
      try {
        await signIn(email, password)
        onClose()
      } catch (submitError) {
        setError(submitError instanceof Error ? submitError.message : 'Não foi possível entrar.')
      } finally {
        setIsSubmitting(false)
      }
      return
    }

    if (fullName.trim().length < 3) {
      setError('Informe seu nome completo.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Informe um e-mail válido.')
      return
    }
    if (!isValidCpf(cpf)) {
      setError('Informe um CPF válido.')
      return
    }
    if (!birthDate) {
      setError('Informe sua data de nascimento.')
      return
    }
    if (!isValidPhone(phone)) {
      setError('Informe um telefone válido com DDD.')
      return
    }
    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.')
      return
    }

    setIsSubmitting(true)
    try {
      await signUp({ fullName: fullName.trim(), email, cpf, birthDate, phone }, password)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Não foi possível cadastrar.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const displayError = error || contextError
  const showProfileFields = mode === 'signup' || isCompleting
  const verifyEmailAddress = user?.email || email

  return (
    <div className="fixed inset-0 z-[75] flex items-end justify-center sm:items-center sm:p-4">
      <div
        onClick={isCompleting || isVerifying ? undefined : onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex max-h-[100dvh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-h-[92dvh] sm:max-w-md sm:rounded-2xl"
      >
        <div className="flex items-center justify-between gap-3 bg-baruc-green px-5 py-4 text-baruc-gold">
          <div className="flex items-center gap-2.5">
            <UserRound className="h-5 w-5" aria-hidden="true" />
            <h2 id={titleId} className="font-serif text-xl font-semibold">
              {isCompleting
                ? 'Completar Cadastro'
                : isVerifying
                  ? 'Confirme seu cadastro'
                  : mode === 'login'
                    ? 'Entrar na sua conta'
                    : 'Criar minha conta'}
            </h2>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={handleExit}
            className="flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:bg-baruc-greenLight active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-baruc-gold"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {!isCompleting && !isVerifying && (
          <div className="grid grid-cols-2 gap-1 border-b border-neutral-200 bg-baruc-cream p-2">
            <button
              type="button"
              onClick={() => switchMode('login')}
              aria-pressed={mode === 'login'}
              className={`min-h-[40px] rounded-lg text-sm font-semibold transition-colors ${
                mode === 'login' ? 'bg-baruc-green text-baruc-gold' : 'text-neutral-600 hover:bg-white'
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => switchMode('signup')}
              aria-pressed={mode === 'signup'}
              className={`min-h-[40px] rounded-lg text-sm font-semibold transition-colors ${
                mode === 'signup' ? 'bg-baruc-green text-baruc-gold' : 'text-neutral-600 hover:bg-white'
              }`}
            >
              Cadastrar
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="no-scrollbar flex flex-1 flex-col gap-3.5 overflow-y-auto overscroll-contain p-5">
          {authModalReason && (
            <p role="status" className="rounded-xl border border-baruc-gold/40 bg-baruc-goldLight px-3.5 py-3 text-sm font-medium text-baruc-green">
              {authModalReason}
            </p>
          )}

          {!isConfigured && (
            <p className="rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-3 text-xs font-medium text-amber-800">
              Firebase não configurado. Defina as chaves VITE_FIREBASE_* no ambiente.
            </p>
          )}

          {isCompleting && (
            <p className="rounded-xl border border-baruc-gold/40 bg-baruc-goldLight px-3.5 py-3 text-sm font-medium text-baruc-green">
              Sua conta de acesso já existe, mas faltam alguns dados para concluir o cadastro.
            </p>
          )}

          {isVerifying && (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-baruc-gold/40 bg-baruc-goldLight p-4">
              <Mail className="h-6 w-6 text-baruc-gold" aria-hidden="true" />
              <p className="text-sm font-medium text-baruc-green text-center">
                Enviamos um link de confirmação para{' '}
                <span className="font-semibold">{verifyEmailAddress}</span>
              </p>
              <p className="text-xs text-neutral-500 text-center">
                Abra seu e-mail e clique no link de confirmação antes de concluir o cadastro.
              </p>
            </div>
          )}

          {showProfileFields && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor={nameId} className={LABEL_CLASS}>
                Nome completo
              </label>
              <input
                id={nameId}
                type="text"
                autoComplete="name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Seu nome completo"
                className={INPUT_CLASS}
              />
            </div>
          )}

          {isCompleting ? (
            <div className="flex flex-col gap-1.5">
              <span className={LABEL_CLASS}>E-mail</span>
              <div className="flex min-h-[44px] items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-100 px-3.5 text-sm text-neutral-600">
                <Mail className="h-4 w-4 text-neutral-400" aria-hidden="true" />
                <span className="truncate">{user?.email ?? '—'}</span>
              </div>
            </div>
          ) : !isVerifying && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor={emailId} className={LABEL_CLASS}>
                E-mail
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
                <input
                  id={emailId}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="voce@email.com"
                  className={`${INPUT_CLASS} pl-10`}
                />
              </div>
            </div>
          )}

          {showProfileFields && (
            <>
              <div className="flex flex-col gap-1.5">
                <label htmlFor={cpfId} className={LABEL_CLASS}>
                  CPF
                </label>
                <input
                  id={cpfId}
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  value={cpf}
                  onChange={(event) => setCpf(formatCpf(event.target.value))}
                  placeholder="000.000.000-00"
                  className={INPUT_CLASS}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor={birthId} className={LABEL_CLASS}>
                  Data de nascimento
                </label>
                <input
                  id={birthId}
                  type="date"
                  value={birthDate}
                  onChange={(event) => setBirthDate(event.target.value)}
                  className={INPUT_CLASS}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor={phoneId} className={LABEL_CLASS}>
                  Telefone para contato
                </label>
                <input
                  id={phoneId}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(event) => setPhone(formatPhone(event.target.value))}
                  placeholder="(00) 00000-0000"
                  className={INPUT_CLASS}
                />
              </div>
            </>
          )}

          {!isCompleting && !isVerifying && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor={passwordId} className={LABEL_CLASS}>
                Senha
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
                <input
                  id={passwordId}
                  type="password"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={mode === 'signup' ? 'Mínimo 6 caracteres' : 'Sua senha'}
                  className={`${INPUT_CLASS} pl-10`}
                />
              </div>
            </div>
          )}

          {isVerifying && (
            <>
              <button
                type="button"
                onClick={() => void verifyEmail()}
                disabled={isSubmitting}
                className={`min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border px-4 text-sm font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-baruc-gold ${
                  isSubmitting
                    ? 'border-neutral-300 bg-neutral-100 text-neutral-500 cursor-not-allowed opacity-60'
                    : 'border-baruc-gold bg-baruc-green text-baruc-gold hover:bg-baruc-greenDark'
                }`}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <>
                    <RefreshCcw className="h-4 w-4" aria-hidden="true" />
                    Já confirmei meu e-mail (Concluir cadastro)
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => void resendVerification()}
                disabled={!canResend || isSubmitting}
                className={`min-h-[40px] w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  canResend ? 'text-baruc-green hover:bg-baruc-goldLight' : 'text-neutral-400'
                }`}
              >
                {canResend ? 'Reenviar confirmação' : `Reenviar em ${resendCooldown}s`}
              </button>

              <button
                type="button"
                onClick={handleExit}
                className="min-h-[40px] w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-4 text-xs font-semibold text-neutral-600 transition-colors hover:bg-neutral-100"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Alterar e-mail / Sair
              </button>
            </>
          )}

          {displayError && (
            <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
              {displayError}
            </p>
          )}

          {!isCompleting && !isVerifying && (
            <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-neutral-500">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-baruc-goldDark" aria-hidden="true" />
              Seus dados são usados apenas para identificação e contato sobre seus pedidos.
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !isConfigured}
            className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl border border-baruc-gold bg-baruc-green px-4 text-sm font-bold text-baruc-gold transition-all hover:bg-baruc-greenDark active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-baruc-gold focus-visible:ring-offset-2"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {isCompleting
              ? 'Salvar cadastro'
              : isVerifying
                ? 'Confirmar cadastro'
                : mode === 'login'
                  ? 'Entrar'
                  : 'Criar conta'}
          </button>

          {!user && (
            <button
              type="button"
              onClick={onClose}
              className="min-h-[38px] w-full rounded-xl px-4 text-xs font-medium text-neutral-400 transition-colors hover:bg-baruc-cream hover:text-baruc-green focus:outline-none focus-visible:ring-2 focus-visible:ring-baruc-gold"
            >
              Continuar navegando sem login
            </button>
          )}
        </form>
      </div>
    </div>
  )
}
