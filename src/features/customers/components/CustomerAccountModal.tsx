import { useEffect, useId, useRef, useState } from 'react'
import { Loader2, Mail, RefreshCcw, ShieldCheck, UserRound, X } from 'lucide-react'
import { sendEmailVerification, sendPasswordResetEmail } from 'firebase/auth'
import { useCustomerAuth } from '@/features/customers/hooks/useCustomerAuth'
import { formatCpf, formatPhone, isValidCpf, isValidPhone } from '@/features/customers/utils/customer.utils'
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock'
import { subscribePaidOrders } from '@/features/customers/services/order.service'
import { updateCustomerProfile } from '@/features/customers/services/customer.service'
import type { Order } from '@/features/customers/types/order.types'
import { auth } from '@/services/firebase'

interface CustomerAccountModalProps {
  onClose: () => void
}

const INPUT_CLASS =
  'h-11 w-full rounded-xl border border-neutral-200 bg-baruc-cream px-3.5 text-base text-neutral-900 placeholder:text-neutral-400 focus:border-baruc-gold focus:outline-none focus:ring-2 focus:ring-baruc-gold/25'
const LABEL_CLASS = 'text-xs font-semibold text-neutral-600'

export const CustomerAccountModal = ({ onClose }: CustomerAccountModalProps) => {
  const { user, customer, refreshCustomer } = useCustomerAuth()
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const titleId = useId()
  const nameId = useId()
  const cpfId = useId()
  const birthId = useId()
  const phoneId = useId()

  const [fullName, setFullName] = useState(customer?.fullName ?? '')
  const [cpf, setCpf] = useState(customer?.cpf ?? '')
  const [birthDate, setBirthDate] = useState(customer?.birthDate ?? '')
  const [phone, setPhone] = useState(customer?.phone ?? '')
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState('')
  const [resendMsg, setResendMsg] = useState('')
  const [orders, setOrders] = useState<Order[]>([])
  const [ordersLoading, setOrdersLoading] = useState(true)

  useBodyScrollLock(true)

  useEffect(() => {
    setFullName(customer?.fullName ?? '')
    setCpf(customer?.cpf ?? '')
    setBirthDate(customer?.birthDate ?? '')
    setPhone(customer?.phone ?? '')
  }, [customer])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    const focusTimer = window.setTimeout(() => closeButtonRef.current?.focus({ preventScroll: true }), 50)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.clearTimeout(focusTimer)
    }
  }, [onClose])

  useEffect(() => {
    if (!user?.uid) {
      setOrdersLoading(false)
      return
    }
    const unsubscribe = subscribePaidOrders(
      user.uid,
      (nextOrders) => {
        setOrders(nextOrders)
        setOrdersLoading(false)
      },
      () => setOrdersLoading(false),
    )
    return unsubscribe
  }, [user?.uid])

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!user) return
    setSaveError('')
    setSaveSuccess('')

    if (fullName.trim().length < 3) {
      setSaveError('Informe seu nome completo.')
      return
    }
    if (!isValidCpf(cpf)) {
      setSaveError('CPF inválido.')
      return
    }
    if (!birthDate) {
      setSaveError('Informe a data de nascimento.')
      return
    }
    if (!isValidPhone(phone)) {
      setSaveError('Telefone inválido.')
      return
    }

    setIsSaving(true)
    try {
      await updateCustomerProfile(user.uid, {
        fullName: fullName.trim(),
        cpf: formatCpf(cpf),
        birthDate,
        phone: formatPhone(phone),
      })
      await refreshCustomer?.()
      setSaveSuccess('Dados salvos com sucesso.')
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Não foi possível salvar seus dados.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleResendVerification = async () => {
    setResendMsg('')
    try {
      if (auth?.currentUser) {
        await sendEmailVerification(auth.currentUser)
        setResendMsg('E-mail de verificação reenviado.')
      }
    } catch {
      setResendMsg('Não foi possível reenviar. Tente novamente.')
    }
  }

  const handleResetPassword = async () => {
    setResendMsg('')
    const email = user?.email
    if (!email || !auth) return
    try {
      await sendPasswordResetEmail(auth, email)
      setResendMsg('E-mail de redefinição de senha enviado.')
    } catch {
      setResendMsg('Não foi possível enviar o e-mail de redefinição.')
    }
  }

  return (
    <div className="fixed inset-0 z-[75] flex items-end justify-center sm:items-center sm:p-4">
      <div onClick={onClose} className="absolute inset-0 bg-black/70 backdrop-blur-sm" aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex max-h-[100dvh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-h-[92dvh] sm:max-w-lg sm:rounded-2xl"
      >
        <div className="flex items-center justify-between gap-3 bg-baruc-green px-5 py-4 text-baruc-gold">
          <div className="flex items-center gap-2.5">
            <UserRound className="h-5 w-5" aria-hidden="true" />
            <h2 id={titleId} className="font-serif text-xl font-semibold">Minha Conta</h2>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:bg-baruc-greenLight active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-baruc-gold"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="no-scrollbar flex-1 overflow-y-auto overscroll-contain p-5">
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-baruc-gold/30 bg-baruc-goldLight/40 px-3 py-2 text-sm">
            {customer?.emailVerified ? (
              <>
                <ShieldCheck className="h-4 w-4 text-baruc-green" aria-hidden="true" />
                <span className="font-medium text-baruc-green">Conta verificada</span>
              </>
            ) : (
              <>
                <Mail className="h-4 w-4 text-amber-700" aria-hidden="true" />
                <span className="font-medium text-amber-800">E-mail pendente de verificação</span>
              </>
            )}
          </div>

          <form onSubmit={handleSave} className="flex flex-col gap-3.5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor={nameId} className={LABEL_CLASS}>Nome completo</label>
              <input id={nameId} className={INPUT_CLASS} value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor={cpfId} className={LABEL_CLASS}>CPF</label>
              <input id={cpfId} className={INPUT_CLASS} value={cpf} onChange={(e) => setCpf(formatCpf(e.target.value))} inputMode="numeric" placeholder="000.000.000-00" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor={birthId} className={LABEL_CLASS}>Data de nascimento</label>
              <input id={birthId} type="date" className={INPUT_CLASS} value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor={phoneId} className={LABEL_CLASS}>Telefone para contato</label>
              <input id={phoneId} className={INPUT_CLASS} value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} inputMode="tel" autoComplete="tel" placeholder="(00) 00000-0000" />
            </div>

            <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-3 text-sm">
              <p className="text-xs font-semibold text-neutral-500">E-mail cadastrado</p>
              <p className="font-medium text-neutral-800">{customer?.email || user?.email || '—'}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {!customer?.emailVerified && (
                  <button type="button" onClick={() => void handleResendVerification()} className="inline-flex items-center gap-1 rounded-lg border border-baruc-gold/40 px-2.5 py-1.5 text-xs font-semibold text-baruc-green hover:bg-baruc-goldLight/50">
                    <RefreshCcw className="h-3.5 w-3.5" aria-hidden="true" /> Reenviar verificação
                  </button>
                )}
                <button type="button" onClick={() => void handleResetPassword()} className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 px-2.5 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-white">
                  Redefinir senha
                </button>
              </div>
              {resendMsg && <p className="mt-2 text-xs text-neutral-600">{resendMsg}</p>}
            </div>

            {saveError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">{saveError}</p>}
            {saveSuccess && <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm font-medium text-emerald-700">{saveSuccess}</p>}

            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl border border-baruc-gold bg-baruc-green px-4 text-sm font-bold text-baruc-gold transition-all hover:bg-baruc-greenDark active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              Salvar dados
            </button>
          </form>

          <section className="mt-6 border-t border-neutral-200 pt-5">
            <h3 className="font-serif text-lg font-semibold text-baruc-green">Meus Pedidos Confirmados</h3>
            {ordersLoading ? (
              <p className="mt-3 text-sm text-neutral-500">Carregando pedidos...</p>
            ) : orders.length === 0 ? (
              <p className="mt-3 text-sm text-neutral-500">Você ainda não possui pedidos confirmados.</p>
            ) : (
              <div className="mt-3 overflow-x-auto rounded-xl border border-neutral-200">
                <table className="w-full text-sm">
                  <thead className="bg-baruc-cream text-neutral-600">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold">Data</th>
                      <th className="px-3 py-2 text-left font-semibold">Produtos</th>
                      <th className="px-3 py-2 text-right font-semibold">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id} className="border-t border-neutral-100">
                        <td className="px-3 py-2 text-neutral-500">{order.createdAt.toLocaleDateString('pt-BR')}</td>
                        <td className="px-3 py-2 text-neutral-700">
                          {order.items.slice(0, 2).map((item) => `${item.productName}${item.color ? ` (${item.color})` : ''}${item.size ? ` ${item.size}` : ''} x${item.quantity}`).join(', ')}
                          {order.items.length > 2 ? ` +${order.items.length - 2}` : ''}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-baruc-green">
                          {order.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}