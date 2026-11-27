import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CheckCircle2,
  DownloadCloud,
  Loader2,
  LogOut,
  MessageCircle,
  Package,
  Search,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import { AdminLoginModal } from '@/features/admin/components/AdminLoginModal'
import { useAdminAuth } from '@/features/admin/hooks/useAdminAuth'
import { importProducts, isAdminCloudReady, subscribeProducts } from '@/features/admin/services/admin.service'
import { fetchLocalCatalog } from '@/features/catalog/services/product.service'
import { getStock } from '@/features/catalog/stock'
import type { Product } from '@/features/catalog/types/product.types'
import { deleteCustomer, subscribeCustomers } from '@/features/customers/services/customer.service'
import type { Customer } from '@/features/customers/types/customer.types'
import { formatDateBR, formatDateTimeBR, onlyDigits, toWhatsAppLink } from '@/features/customers/utils/customer.utils'
import { confirmOrderPayment, deleteOrder, subscribeAllOrders } from '@/features/orders/order.service'
import type { Order } from '@/features/orders/order.types'
import { formatCurrency } from '@/utils/formatters'

interface AdminDashboardProps {
  onClose: () => void
}

type AdminTab = 'products' | 'customers' | 'orders'
type OrderFilter = 'all' | 'pending' | 'paid'

const normalizeSearch = (value: string): string =>
  value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()

export const AdminDashboard = ({ onClose }: AdminDashboardProps) => {
  const { user, isLoading: isAuthLoading, isConfigured, signIn, signOut } = useAdminAuth()
  const [activeTab, setActiveTab] = useState<AdminTab>('products')
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [loadError, setLoadError] = useState('')
  const [actionError, setActionError] = useState('')
  const [isImporting, setIsImporting] = useState(false)
  const [importMessage, setImportMessage] = useState('')
  const [customers, setCustomers] = useState<Customer[]>([])
  const [customerSearch, setCustomerSearch] = useState('')
  const [customersError, setCustomersError] = useState('')
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true)
  const [orders, setOrders] = useState<Order[]>([])
  const [ordersError, setOrdersError] = useState('')
  const [isLoadingOrders, setIsLoadingOrders] = useState(true)
  const [orderFilter, setOrderFilter] = useState<OrderFilter>('all')
  const [orderSearch, setOrderSearch] = useState('')
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deletingCustomerId, setDeletingCustomerId] = useState<string | null>(null)

  const cloudReady = isAdminCloudReady()

  useEffect(() => {
    if (!user || !cloudReady) return
    return subscribeProducts(
      (next) => { setProducts(next); setLoadError('') },
      (msg) => setLoadError(msg),
    )
  }, [user, cloudReady])

  useEffect(() => {
    if (!user || !cloudReady) return
    return subscribeCustomers(
      (next) => { setCustomers(next); setCustomersError(''); setIsLoadingCustomers(false) },
      (msg) => { setCustomersError(msg); setIsLoadingCustomers(false) },
    )
  }, [user, cloudReady])

  useEffect(() => {
    if (!user || !cloudReady) return
    return subscribeAllOrders(
      (next) => { setOrders(next); setOrdersError(''); setIsLoadingOrders(false) },
      (msg) => { setOrdersError(msg); setIsLoadingOrders(false) },
    )
  }, [user, cloudReady])

  const filteredCustomers = useMemo(() => {
    const q = normalizeSearch(customerSearch)
    const digits = onlyDigits(customerSearch)
    if (!q && !digits) return customers
    return customers.filter((c) => {
      const hay = normalizeSearch(`${c.fullName} ${c.email} ${c.cpf} ${c.phone}`)
      if (q && hay.includes(q)) return true
      if (digits) return onlyDigits(`${c.cpf}${c.phone}`).includes(digits)
      return false
    })
  }, [customers, customerSearch])

  const totalStock = useMemo(() => products.reduce((t, p) => t + getStock(p), 0), [products])

  const paidOrders = useMemo(() => orders.filter((o) => o.status === 'paid'), [orders])
  const pendingOrders = useMemo(() => orders.filter((o) => o.status === 'pending'), [orders])
  const paidTotal = useMemo(() => paidOrders.reduce((sum, o) => sum + o.totalAmount, 0), [paidOrders])
  const pendingTotal = useMemo(() => pendingOrders.reduce((sum, o) => sum + o.totalAmount, 0), [pendingOrders])

  const filteredOrders = useMemo(() => {
    const q = normalizeSearch(orderSearch)
    return orders.filter((o) => {
      if (orderFilter !== 'all' && o.status !== orderFilter) return false
      if (!q) return true
      const hay = normalizeSearch(
        `${o.orderCode} ${o.customerName} ${o.customerEmail} ${o.customerCpf} ${o.customerPhone} ${o.items.map((i) => `${i.name} ${i.sku} ${i.colorName} ${i.size}`).join(' ')}`,
      )
      return hay.includes(q)
    })
  }, [orders, orderFilter, orderSearch])

  const handleImport = useCallback(async () => {
    setIsImporting(true); setActionError(''); setImportMessage('')
    try {
      const local = await fetchLocalCatalog()
      const imported = await importProducts(local)
      setImportMessage(`${imported} produtos importados do JSON local para o Firestore.`)
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Falha ao importar o JSON local.')
    } finally { setIsImporting(false) }
  }, [])

  const handleConfirmPayment = async (orderId: string) => {
    setConfirmingId(orderId); setOrdersError('')
    try { await confirmOrderPayment(orderId) }
    catch (e) { setOrdersError(e instanceof Error ? e.message : 'Falha ao confirmar pagamento.') }
    finally { setConfirmingId(null) }
  }

  const handleDeleteOrder = async (orderId: string) => {
    if (!window.confirm('Excluir este pedido? Esta ação não pode ser desfeita.')) return
    setDeletingId(orderId); setOrdersError('')
    try { await deleteOrder(orderId) }
    catch (e) { setOrdersError(e instanceof Error ? e.message : 'Falha ao excluir pedido.') }
    finally { setDeletingId(null) }
  }

  const handleDeleteCustomer = async (customer: Customer) => {
    if (!window.confirm(`Excluir o cliente ${customer.fullName}? Esta ação não pode ser desfeita.`)) return
    setDeletingCustomerId(customer.uid)
    setCustomersError('')
    try {
      await deleteCustomer(customer.uid)
      setCustomers((current) => current.filter((item) => item.uid !== customer.uid))
    } catch (e) {
      setCustomersError(e instanceof Error ? e.message : 'Falha ao excluir cliente.')
    } finally {
      setDeletingCustomerId(null)
    }
  }

  const handleGoToStore = () => {
    if (window.location.hash === '#admin') {
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`)
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-baruc-cream">
      <header className="sticky top-0 z-10 border-b border-baruc-gold/30 bg-baruc-green text-baruc-gold">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="h-6 w-6" aria-hidden="true" />
            <div>
              <h1 className="font-serif text-xl font-semibold leading-none">Painel BARUC</h1>
              <p className="mt-1 text-[11px] text-baruc-gold/80">{user?.email ?? 'Área restrita'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {user && (
              <button type="button" onClick={() => void signOut()} className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-baruc-gold/40 px-3 text-xs font-semibold transition-colors hover:bg-baruc-greenLight focus:outline-none focus-visible:ring-2 focus-visible:ring-baruc-gold">
                <LogOut className="h-4 w-4" aria-hidden="true" /> Sair
              </button>
            )}
            <button type="button" onClick={handleGoToStore} aria-label="Fechar painel e voltar à loja" className="flex h-10 w-10 items-center justify-center rounded-lg border border-baruc-gold/40 transition-colors hover:bg-baruc-greenLight focus:outline-none focus-visible:ring-2 focus-visible:ring-baruc-gold">
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      {isAuthLoading ? (
        <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-baruc-goldDark" aria-hidden="true" /></div>
      ) : !isConfigured ? (
        <div className="mx-auto max-w-lg px-4 py-16 text-center">
          <h2 className="font-serif text-2xl font-semibold text-baruc-green">Firebase não configurado</h2>
          <p className="mt-2 text-sm text-neutral-600">Cadastre as variáveis VITE_FIREBASE_* no ambiente para habilitar o painel.</p>
        </div>
      ) : !user ? (
        <AdminLoginModal onClose={handleGoToStore} signIn={signIn} isConfigured={isConfigured} />
      ) : (
        <main className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-6 sm:px-6">
          <nav className="flex gap-1 rounded-2xl border border-neutral-200 bg-white p-1.5" aria-label="Seções do painel">
            {([
              { id: 'products', label: 'Produtos', icon: Package },
              { id: 'customers', label: 'Clientes', icon: Users },
              { id: 'orders', label: 'Vendas', icon: ShoppingBag },
            ] as const).map(({ id, label, icon: Icon }) => (
              <button key={id} type="button" onClick={() => setActiveTab(id)} aria-pressed={activeTab === id}
                className={`inline-flex min-h-[42px] flex-1 items-center justify-center gap-2 rounded-xl text-sm font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-baruc-gold ${activeTab === id ? 'bg-baruc-green text-baruc-gold' : 'text-neutral-600 hover:bg-baruc-cream'}`}>
                <Icon className="h-4 w-4" aria-hidden="true" /> {label}
              </button>
            ))}
          </nav>

          {activeTab === 'products' && (
            <>
              <section className="grid gap-3 sm:grid-cols-3">
                <SummaryCard label="Produtos" value={String(products.length)} />
                <SummaryCard label="Peças em estoque" value={String(totalStock)} />
                <SummaryCard label="Esgotados" value={String(products.filter((p) => getStock(p) <= 0).length)} />
              </section>
              <section className="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="relative w-full sm:max-w-md">
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
                    <input type="search" placeholder="Buscar por nome, SKU, categoria..." value={search} onChange={(e) => setSearch(e.target.value)}
                      className="h-11 w-full rounded-xl border border-neutral-200 bg-baruc-cream pl-10 pr-3.5 text-base text-neutral-900 placeholder:text-neutral-400 focus:border-baruc-gold focus:outline-none focus:ring-2 focus:ring-baruc-gold/25" />
                  </div>
                  <button type="button" onClick={() => void handleImport()} disabled={isImporting}
                    className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl border border-neutral-300 bg-white px-4 text-sm font-semibold text-baruc-green transition-colors hover:border-baruc-gold disabled:cursor-not-allowed disabled:opacity-60">
                    {isImporting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <DownloadCloud className="h-4 w-4" aria-hidden="true" />}
                    Importar JSON local
                  </button>
                </div>
              </section>
              {(loadError || actionError) && <AlertError message={loadError || actionError} />}
              {importMessage && <AlertSuccess message={importMessage} />}
            </>
          )}

          {activeTab === 'customers' && (
            <>
              <section className="grid gap-3 sm:grid-cols-2">
                <SummaryCard label="Clientes cadastrados" value={String(customers.length)} />
                <SummaryCard label="Com telefone" value={String(customers.filter((c) => onlyDigits(c.phone).length > 0).length)} />
              </section>
              <section className="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-4">
                <div className="relative w-full sm:max-w-md">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
                  <input type="search" placeholder="Buscar por nome, CPF, e-mail ou telefone..." value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)}
                    className="h-11 w-full rounded-xl border border-neutral-200 bg-baruc-cream pl-10 pr-3.5 text-base text-neutral-900 placeholder:text-neutral-400 focus:border-baruc-gold focus:outline-none focus:ring-2 focus:ring-baruc-gold/25" />
                </div>
                {customersError && <AlertError message={customersError} />}
              </section>
              {isLoadingCustomers ? <CenteredLoader /> : filteredCustomers.length === 0 ? (
                <EmptyState icon={Users} title="Nenhum cliente encontrado" text="Ajuste a busca ou aguarde novos cadastros." />
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
                  <table className="w-full min-w-[720px] text-left text-sm">
                    <thead className="border-b border-neutral-200 bg-baruc-cream/70 text-xs uppercase tracking-wide text-neutral-500">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Nome</th><th className="px-4 py-3 font-semibold">E-mail</th>
                        <th className="px-4 py-3 font-semibold">CPF</th><th className="px-4 py-3 font-semibold">Nascimento</th>
                        <th className="px-4 py-3 font-semibold">Telefone</th><th className="px-4 py-3 font-semibold">Cadastro</th>
                        <th className="px-4 py-3 text-right font-semibold">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCustomers.map((c) => (
                        <tr key={c.uid} className="border-b border-neutral-100 last:border-0">
                          <td className="px-4 py-3 font-semibold text-baruc-green">{c.fullName}</td>
                          <td className="px-4 py-3 text-neutral-600">{c.email}</td>
                          <td className="px-4 py-3 font-mono text-xs text-neutral-600">{c.cpf}</td>
                          <td className="px-4 py-3 text-neutral-600">{formatDateBR(c.birthDate)}</td>
                          <td className="px-4 py-3 text-neutral-600">{c.phone}</td>
                          <td className="px-4 py-3 text-neutral-600">{formatDateTimeBR(c.createdAt)}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <CustomerWhatsAppButton customer={c} />
                              <button
                                type="button"
                                onClick={() => void handleDeleteCustomer(c)}
                                disabled={deletingCustomerId === c.uid}
                                aria-label={`Excluir cliente ${c.fullName}`}
                                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 text-xs font-semibold text-red-700 transition-colors hover:border-red-400 hover:bg-red-100 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {deletingCustomerId === c.uid ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Trash2 className="h-4 w-4" aria-hidden="true" />}
                                Excluir
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {activeTab === 'orders' && (
            <>
              <section className="grid gap-3 sm:grid-cols-3">
                <SummaryCard label="Vendas Pagas" value={String(paidOrders.length)} sub={formatCurrency(paidTotal)} />
                <SummaryCard label="Faturamento Total" value={formatCurrency(paidTotal)} />
                <SummaryCard label="Aguardando Pagamento" value={String(pendingOrders.length)} sub={formatCurrency(pendingTotal)} />
              </section>

              <section className="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="relative w-full sm:max-w-md">
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
                    <input type="search" placeholder="Buscar por cliente, código ou produto..." value={orderSearch} onChange={(e) => setOrderSearch(e.target.value)}
                      className="h-11 w-full rounded-xl border border-neutral-200 bg-baruc-cream pl-10 pr-3.5 text-base text-neutral-900 placeholder:text-neutral-400 focus:border-baruc-gold focus:outline-none focus:ring-2 focus:ring-baruc-gold/25" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {([
                      { id: 'all', label: 'Todos' },
                      { id: 'pending', label: 'Aguardando Pagamento' },
                      { id: 'paid', label: 'Pagos' },
                    ] as const).map((f) => (
                      <button key={f.id} type="button" onClick={() => setOrderFilter(f.id)}
                        className={`min-h-[38px] rounded-lg border px-3 text-xs font-semibold transition-colors ${orderFilter === f.id ? 'border-baruc-gold bg-baruc-green text-baruc-gold' : 'border-neutral-200 text-neutral-600 hover:border-baruc-gold'}`}>
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
                {ordersError && <AlertError message={ordersError} />}
              </section>

              {isLoadingOrders ? <CenteredLoader /> : filteredOrders.length === 0 ? (
                <EmptyState icon={ShoppingBag} title="Nenhuma venda encontrada" text="Ajuste os filtros ou aguarde novos pedidos." />
              ) : (
                <ul className="flex flex-col gap-3">
                  {filteredOrders.map((order) => (
                    <li key={order.id} className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-sm font-bold text-baruc-green">{order.orderCode}</span>
                            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${order.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                              {order.status === 'paid' ? 'Pago' : 'Aguardando Pagamento'}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-neutral-500">{order.createdAt ? formatDateTimeBR(order.createdAt) : '—'}</p>
                        </div>
                        <p className="text-lg font-bold text-baruc-green">{formatCurrency(order.totalAmount)}</p>
                      </div>

                      <div className="mt-3 grid gap-2 text-sm text-neutral-700 sm:grid-cols-2">
                        <p><span className="font-semibold text-neutral-500">Cliente:</span> {order.customerName || '—'}</p>
                        <p><span className="font-semibold text-neutral-500">E-mail:</span> {order.customerEmail || '—'}</p>
                        <p><span className="font-semibold text-neutral-500">CPF:</span> {order.customerCpf || '—'}</p>
                        <p className="flex items-center gap-2">
                          <span><span className="font-semibold text-neutral-500">Tel:</span> {order.customerPhone || '—'}</span>
                          {toWhatsAppLink(order.customerPhone) && (
                            <a href={toWhatsAppLink(order.customerPhone)!} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100">
                              <MessageCircle className="h-3 w-3" aria-hidden="true" /> WhatsApp
                            </a>
                          )}
                        </p>
                        <p><span className="font-semibold text-neutral-500">Pagamento:</span> {order.paymentMethod}</p>
                        <p><span className="font-semibold text-neutral-500">Entrega:</span> {order.deliveryMethod}</p>
                      </div>

                      <div className="mt-3 overflow-x-auto rounded-xl border border-neutral-200">
                        <table className="w-full text-xs">
                          <thead className="bg-baruc-cream text-neutral-600">
                            <tr>
                              <th className="px-3 py-2 text-left font-semibold">Produto</th>
                              <th className="px-3 py-2 text-left font-semibold">Cor</th>
                              <th className="px-3 py-2 text-left font-semibold">Tam.</th>
                              <th className="px-3 py-2 text-right font-semibold">Qtd</th>
                              <th className="px-3 py-2 text-right font-semibold">Valor</th>
                            </tr>
                          </thead>
                          <tbody>
                            {order.items.map((item, idx) => (
                              <tr key={`${order.id}-${idx}`} className="border-t border-neutral-100">
                                <td className="px-3 py-2 text-neutral-800">{item.name} <span className="font-mono text-[10px] text-neutral-400">{item.sku}</span></td>
                                <td className="px-3 py-2 text-neutral-600">{item.colorName || '—'}</td>
                                <td className="px-3 py-2 text-neutral-600">{item.size || '—'}</td>
                                <td className="px-3 py-2 text-right text-neutral-600">{item.quantity}</td>
                                <td className="px-3 py-2 text-right font-medium text-neutral-800">{formatCurrency(item.subtotal)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {order.status === 'pending' && (
                          <button type="button" onClick={() => void handleConfirmPayment(order.id)} disabled={confirmingId === order.id}
                            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60">
                            {confirmingId === order.id ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
                            Confirmar Pagamento
                          </button>
                        )}
                        <button type="button" onClick={() => void handleDeleteOrder(order.id)} disabled={deletingId === order.id}
                          className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60">
                          {deletingId === order.id ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Trash2 className="h-4 w-4" aria-hidden="true" />}
                          Excluir
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </main>
      )}
    </div>
  )
}

const SummaryCard = ({ label, value, sub }: { label: string; value: string; sub?: string }) => (
  <div className="rounded-2xl border border-neutral-200 bg-white p-4">
    <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{label}</p>
    <p className="mt-1 text-2xl font-bold text-baruc-green sm:text-3xl">{value}</p>
    {sub && <p className="mt-0.5 text-xs font-medium text-neutral-500">{sub}</p>}
  </div>
)

const AlertError = ({ message }: { message: string }) => (
  <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">{message}</p>
)
const AlertSuccess = ({ message }: { message: string }) => (
  <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm font-medium text-emerald-700">{message}</p>
)
const CenteredLoader = () => (
  <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-baruc-goldDark" aria-hidden="true" /></div>
)
const EmptyState = ({ icon: Icon, title, text }: { icon: typeof Users; title: string; text: string }) => (
  <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-baruc-gold/40 bg-white px-6 py-16 text-center">
    <Icon className="h-8 w-8 text-baruc-goldDark" aria-hidden="true" />
    <h2 className="font-serif text-xl font-semibold text-baruc-green">{title}</h2>
    <p className="max-w-sm text-sm text-neutral-500">{text}</p>
  </div>
)

const CustomerWhatsAppButton = ({ customer }: { customer: Customer }) => {
  const link = toWhatsAppLink(customer.phone)
  if (!link) return <span className="text-xs text-neutral-400">Sem telefone</span>
  return (
    <a href={link} target="_blank" rel="noopener noreferrer" aria-label={`Abrir WhatsApp de ${customer.fullName}`}
      className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 text-xs font-semibold text-emerald-700 transition-colors hover:border-emerald-400 hover:bg-emerald-100 active:scale-95">
      <MessageCircle className="h-4 w-4" aria-hidden="true" /> WhatsApp
    </a>
  )
}
