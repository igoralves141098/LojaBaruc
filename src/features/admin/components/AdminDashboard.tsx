import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  DownloadCloud,
  Loader2,
  LogOut,
  MessageCircle,
  Package,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import { AdminLoginModal } from '@/features/admin/components/AdminLoginModal'
import { AdminProductEditor } from '@/features/admin/components/AdminProductEditor'
import { useAdminAuth } from '@/features/admin/hooks/useAdminAuth'
import {
  importProducts,
  isAdminCloudReady,
  removeProduct,
  saveProduct,
  subscribeProducts,
} from '@/features/admin/services/admin.service'
import { fetchLocalCatalog } from '@/features/catalog/services/product.service'
import { getStock, getStockLevel } from '@/features/catalog/stock'
import type { Product } from '@/features/catalog/types/product.types'
import { subscribeCustomers } from '@/features/customers/services/customer.service'
import type { Customer } from '@/features/customers/types/customer.types'
import {
  formatDateBR,
  formatDateTimeBR,
  onlyDigits,
  toWhatsAppLink,
} from '@/features/customers/utils/customer.utils'
import { formatCurrency } from '@/utils/formatters'

interface AdminDashboardProps {
  onClose: () => void
}

type AdminTab = 'products' | 'customers'

const normalizeSearch = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()

export const AdminDashboard = ({ onClose }: AdminDashboardProps) => {
  const { user, isLoading: isAuthLoading, isConfigured, signIn, signOut } = useAdminAuth()
  const [activeTab, setActiveTab] = useState<AdminTab>('products')
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState<string>('')
  const [loadError, setLoadError] = useState<string>('')
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(true)
  const [editorProduct, setEditorProduct] = useState<Product | null>(null)
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false)
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const [saveError, setSaveError] = useState<string>('')
  const [actionError, setActionError] = useState<string>('')
  const [isImporting, setIsImporting] = useState<boolean>(false)
  const [importMessage, setImportMessage] = useState<string>('')
  const [customers, setCustomers] = useState<Customer[]>([])
  const [customerSearch, setCustomerSearch] = useState<string>('')
  const [customersError, setCustomersError] = useState<string>('')
  const [isLoadingCustomers, setIsLoadingCustomers] = useState<boolean>(true)

  const cloudReady = isAdminCloudReady()

  useEffect(() => {
    if (!user || !cloudReady) return

    const unsubscribe = subscribeProducts(
      (nextProducts) => {
        setProducts(nextProducts)
        setLoadError('')
        setIsLoadingProducts(false)
      },
      (message) => {
        setLoadError(message)
        setIsLoadingProducts(false)
      },
    )

    return unsubscribe
  }, [user, cloudReady])

  useEffect(() => {
    if (!user || !cloudReady) return

    const unsubscribe = subscribeCustomers(
      (nextCustomers) => {
        setCustomers(nextCustomers)
        setCustomersError('')
        setIsLoadingCustomers(false)
      },
      (message) => {
        setCustomersError(message)
        setIsLoadingCustomers(false)
      },
    )

    return unsubscribe
  }, [user, cloudReady])

  const filteredProducts = useMemo(() => {
    const query = normalizeSearch(search)
    if (query.length === 0) return products
    return products.filter((product) =>
      normalizeSearch(
        `${product.name} ${product.sku} ${product.category} ${product.niche} ${product.colors.join(' ')}`,
      ).includes(query),
    )
  }, [products, search])

  const filteredCustomers = useMemo(() => {
    const query = normalizeSearch(customerSearch)
    const digits = onlyDigits(customerSearch)
    if (query.length === 0 && digits.length === 0) return customers
    return customers.filter((customer) => {
      const haystack = normalizeSearch(
        `${customer.fullName} ${customer.email} ${customer.cpf} ${customer.phone}`,
      )
      if (query.length > 0 && haystack.includes(query)) return true
      if (digits.length > 0) {
        return onlyDigits(`${customer.cpf}${customer.phone}`).includes(digits)
      }
      return false
    })
  }, [customers, customerSearch])

  const totalStock = useMemo(
    () => products.reduce((total, product) => total + getStock(product), 0),
    [products],
  )

  const handleSave = useCallback(async (product: Product) => {
    setIsSaving(true)
    setSaveError('')
    try {
      await saveProduct(product)
      setIsEditorOpen(false)
      setEditorProduct(null)
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Não foi possível salvar o produto.')
    } finally {
      setIsSaving(false)
    }
  }, [])

  const handleDelete = useCallback(async (product: Product) => {
    setActionError('')
    const confirmed = window.confirm(`Excluir "${product.name}"? Esta ação não pode ser desfeita.`)
    if (!confirmed) return
    try {
      await removeProduct(product.id)
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Não foi possível excluir o produto.')
    }
  }, [])

  const handleImport = useCallback(async () => {
    setIsImporting(true)
    setActionError('')
    setImportMessage('')
    try {
      const localProducts = await fetchLocalCatalog()
      const imported = await importProducts(localProducts)
      setImportMessage(`${imported} produtos importados do JSON local para o Firestore.`)
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Falha ao importar o JSON local.')
    } finally {
      setIsImporting(false)
    }
  }, [])

  const openNewProduct = () => {
    setEditorProduct(null)
    setSaveError('')
    setIsEditorOpen(true)
  }

  const openEditProduct = (product: Product) => {
    setEditorProduct(product)
    setSaveError('')
    setIsEditorOpen(true)
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
              <button
                type="button"
                onClick={() => void signOut()}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-baruc-gold/40 px-3 text-xs font-semibold transition-colors hover:bg-baruc-greenLight focus:outline-none focus-visible:ring-2 focus-visible:ring-baruc-gold"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Sair
              </button>
            )}
            <button
              type="button"
              onClick={handleGoToStore}
              aria-label="Fechar painel e voltar à loja"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-baruc-gold/40 transition-colors hover:bg-baruc-greenLight focus:outline-none focus-visible:ring-2 focus-visible:ring-baruc-gold"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      {isAuthLoading ? (
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-baruc-goldDark" aria-hidden="true" />
        </div>
      ) : !isConfigured ? (
        <div className="mx-auto max-w-lg px-4 py-16 text-center">
          <h2 className="font-serif text-2xl font-semibold text-baruc-green">Firebase não configurado</h2>
          <p className="mt-2 text-sm text-neutral-600">
            Cadastre as variáveis VITE_FIREBASE_* no arquivo .env (e na Vercel) para habilitar o painel.
          </p>
        </div>
      ) : !user ? (
        <AdminLoginModal onClose={handleGoToStore} signIn={signIn} isConfigured={isConfigured} />
      ) : (
        <main className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-6 sm:px-6">
          <nav
            className="flex gap-1 rounded-2xl border border-neutral-200 bg-white p-1.5"
            aria-label="Seções do painel"
          >
            <button
              type="button"
              onClick={() => setActiveTab('products')}
              aria-pressed={activeTab === 'products'}
              className={`inline-flex min-h-[42px] flex-1 items-center justify-center gap-2 rounded-xl text-sm font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-baruc-gold ${
                activeTab === 'products'
                  ? 'bg-baruc-green text-baruc-gold'
                  : 'text-neutral-600 hover:bg-baruc-cream'
              }`}
            >
              <Package className="h-4 w-4" aria-hidden="true" />
              Produtos
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('customers')}
              aria-pressed={activeTab === 'customers'}
              className={`inline-flex min-h-[42px] flex-1 items-center justify-center gap-2 rounded-xl text-sm font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-baruc-gold ${
                activeTab === 'customers'
                  ? 'bg-baruc-green text-baruc-gold'
                  : 'text-neutral-600 hover:bg-baruc-cream'
              }`}
            >
              <Users className="h-4 w-4" aria-hidden="true" />
              Clientes
            </button>
          </nav>

          {activeTab === 'products' ? (
            <>
              <section className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-neutral-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Produtos</p>
                  <p className="mt-1 text-3xl font-bold text-baruc-green">{products.length}</p>
                </div>
                <div className="rounded-2xl border border-neutral-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Peças em estoque</p>
                  <p className="mt-1 text-3xl font-bold text-baruc-green">{totalStock}</p>
                </div>
                <div className="rounded-2xl border border-neutral-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Esgotados</p>
                  <p className="mt-1 text-3xl font-bold text-baruc-green">
                    {products.filter((product) => getStock(product) <= 0).length}
                  </p>
                </div>
              </section>

              <section className="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="relative w-full sm:max-w-md">
                    <Search
                      className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
                      aria-hidden="true"
                    />
                    <input
                      type="search"
                      inputMode="search"
                      placeholder="Buscar por nome, SKU, categoria..."
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      className="h-11 w-full rounded-xl border border-neutral-200 bg-baruc-cream pl-10 pr-3.5 text-base text-neutral-900 placeholder:text-neutral-400 focus:border-baruc-gold focus:outline-none focus:ring-2 focus:ring-baruc-gold/25"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={openNewProduct}
                      className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl border border-baruc-gold bg-baruc-green px-4 text-sm font-bold text-baruc-gold transition-colors hover:bg-baruc-greenDark active:scale-[0.98]"
                    >
                      <Plus className="h-4 w-4" aria-hidden="true" />
                      Novo produto
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleImport()}
                      disabled={isImporting}
                      className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl border border-neutral-300 bg-white px-4 text-sm font-semibold text-baruc-green transition-colors hover:border-baruc-gold disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98]"
                    >
                      {isImporting ? (
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      ) : (
                        <DownloadCloud className="h-4 w-4" aria-hidden="true" />
                      )}
                      Importar JSON local
                    </button>
                  </div>
                </div>

                {(loadError || actionError) && (
                  <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
                    {loadError || actionError}
                  </p>
                )}
                {importMessage && (
                  <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm font-medium text-emerald-700">
                    {importMessage}
                  </p>
                )}
              </section>

              {isLoadingProducts ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-baruc-goldDark" aria-hidden="true" />
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-baruc-gold/40 bg-white px-6 py-16 text-center">
                  <Package className="h-8 w-8 text-baruc-goldDark" aria-hidden="true" />
                  <h2 className="font-serif text-xl font-semibold text-baruc-green">
                    {products.length === 0 ? 'Nenhum produto no Firestore' : 'Nenhum produto encontrado'}
                  </h2>
                  <p className="max-w-sm text-sm text-neutral-500">
                    {products.length === 0
                      ? 'Use "Importar JSON local" para popular o banco com as peças atuais ou crie um novo produto.'
                      : 'Ajuste a busca para localizar o produto.'}
                  </p>
                </div>
              ) : (
                <ul className="flex flex-col gap-2.5">
                  {filteredProducts.map((product) => {
                    const stock = getStock(product)
                    const level = getStockLevel(stock)
                    const stockClass =
                      level === 'out'
                        ? 'border-red-200 bg-red-50 text-red-700'
                        : level === 'low'
                          ? 'border-amber-300 bg-amber-50 text-amber-700'
                          : 'border-emerald-200 bg-emerald-50 text-emerald-700'

                    return (
                      <li
                        key={product.id}
                        className="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-3 sm:flex-row sm:items-center"
                      >
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          loading="lazy"
                          width={64}
                          height={64}
                          className="h-16 w-16 shrink-0 rounded-xl object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate font-serif text-lg font-semibold text-baruc-green">{product.name}</h3>
                          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-neutral-500">
                            <span className="font-mono">{product.sku}</span>
                            <span aria-hidden="true">•</span>
                            <span>{product.category}</span>
                            <span aria-hidden="true">•</span>
                            <span className="font-semibold text-neutral-700">{formatCurrency(product.price ?? 0)}</span>
                            {product.variants && product.variants.length > 0 && (
                              <>
                                <span aria-hidden="true">•</span>
                                <span>{product.variants.length} cor(es)</span>
                              </>
                            )}
                          </p>
                        </div>
                        <div className="flex items-center justify-between gap-2 sm:justify-end">
                          <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${stockClass}`}>
                            {level === 'out' ? 'Esgotado' : `${stock} em estoque`}
                          </span>
                          <button
                            type="button"
                            onClick={() => openEditProduct(product)}
                            aria-label={`Editar ${product.name}`}
                            className="flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-200 text-baruc-green transition-colors hover:border-baruc-gold hover:bg-baruc-goldLight active:scale-95"
                          >
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(product)}
                            aria-label={`Excluir ${product.name}`}
                            className="flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-200 text-red-600 transition-colors hover:border-red-300 hover:bg-red-50 active:scale-95"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </>
          ) : (
            <>
              <section className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-neutral-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Clientes cadastrados</p>
                  <p className="mt-1 text-3xl font-bold text-baruc-green">{customers.length}</p>
                </div>
                <div className="rounded-2xl border border-neutral-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Com telefone</p>
                  <p className="mt-1 text-3xl font-bold text-baruc-green">
                    {customers.filter((customer) => onlyDigits(customer.phone).length > 0).length}
                  </p>
                </div>
              </section>

              <section className="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-4">
                <div className="relative w-full sm:max-w-md">
                  <Search
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
                    aria-hidden="true"
                  />
                  <input
                    type="search"
                    inputMode="search"
                    placeholder="Buscar por nome, CPF, e-mail ou telefone..."
                    value={customerSearch}
                    onChange={(event) => setCustomerSearch(event.target.value)}
                    className="h-11 w-full rounded-xl border border-neutral-200 bg-baruc-cream pl-10 pr-3.5 text-base text-neutral-900 placeholder:text-neutral-400 focus:border-baruc-gold focus:outline-none focus:ring-2 focus:ring-baruc-gold/25"
                  />
                </div>
                {customersError && (
                  <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
                    {customersError}
                  </p>
                )}
              </section>

              {isLoadingCustomers ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-baruc-goldDark" aria-hidden="true" />
                </div>
              ) : filteredCustomers.length === 0 ? (
                <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-baruc-gold/40 bg-white px-6 py-16 text-center">
                  <Users className="h-8 w-8 text-baruc-goldDark" aria-hidden="true" />
                  <h2 className="font-serif text-xl font-semibold text-baruc-green">
                    {customers.length === 0 ? 'Nenhum cliente cadastrado' : 'Nenhum cliente encontrado'}
                  </h2>
                  <p className="max-w-sm text-sm text-neutral-500">
                    {customers.length === 0
                      ? 'Os clientes que se cadastrarem na loja aparecerão aqui.'
                      : 'Ajuste a busca para localizar o cliente.'}
                  </p>
                </div>
              ) : (
                <>
                  <ul className="flex flex-col gap-2.5 md:hidden">
                    {filteredCustomers.map((customer) => (
                      <li key={customer.uid} className="flex flex-col gap-2 rounded-2xl border border-neutral-200 bg-white p-3.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="truncate font-serif text-lg font-semibold text-baruc-green">{customer.fullName}</h3>
                            <p className="truncate text-xs text-neutral-500">{customer.email}</p>
                          </div>
                          <CustomerWhatsAppButton customer={customer} />
                        </div>
                        <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                          <CustomerField label="CPF" value={customer.cpf} />
                          <CustomerField label="Nascimento" value={formatDateBR(customer.birthDate)} />
                          <CustomerField label="Telefone" value={customer.phone} />
                          <CustomerField label="Cadastro" value={formatDateTimeBR(customer.createdAt)} />
                        </dl>
                      </li>
                    ))}
                  </ul>

                  <div className="hidden overflow-x-auto rounded-2xl border border-neutral-200 bg-white md:block">
                    <table className="w-full min-w-[720px] text-left text-sm">
                      <thead className="border-b border-neutral-200 bg-baruc-cream/70 text-xs uppercase tracking-wide text-neutral-500">
                        <tr>
                          <th scope="col" className="px-4 py-3 font-semibold">Nome Completo</th>
                          <th scope="col" className="px-4 py-3 font-semibold">E-mail</th>
                          <th scope="col" className="px-4 py-3 font-semibold">CPF</th>
                          <th scope="col" className="px-4 py-3 font-semibold">Nascimento</th>
                          <th scope="col" className="px-4 py-3 font-semibold">Telefone</th>
                          <th scope="col" className="px-4 py-3 font-semibold">Cadastro</th>
                          <th scope="col" className="px-4 py-3 text-right font-semibold">WhatsApp</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredCustomers.map((customer) => (
                          <tr key={customer.uid} className="border-b border-neutral-100 last:border-0">
                            <td className="px-4 py-3 font-semibold text-baruc-green">{customer.fullName}</td>
                            <td className="px-4 py-3 text-neutral-600">{customer.email}</td>
                            <td className="px-4 py-3 font-mono text-xs text-neutral-600">{customer.cpf}</td>
                            <td className="px-4 py-3 text-neutral-600">{formatDateBR(customer.birthDate)}</td>
                            <td className="px-4 py-3 text-neutral-600">{customer.phone}</td>
                            <td className="px-4 py-3 text-neutral-600">{formatDateTimeBR(customer.createdAt)}</td>
                            <td className="px-4 py-3 text-right">
                              <CustomerWhatsAppButton customer={customer} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </>
          )}
        </main>
      )}

      {isEditorOpen && (
        <AdminProductEditor
          product={editorProduct}
          isSaving={isSaving}
          error={saveError}
          onSave={(product) => void handleSave(product)}
          onCancel={() => setIsEditorOpen(false)}
        />
      )}
    </div>
  )
}

const CustomerField = ({ label, value }: { label: string; value: string }) => (
  <div className="min-w-0">
    <dt className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">{label}</dt>
    <dd className="truncate font-medium text-neutral-700">{value || '—'}</dd>
  </div>
)

const CustomerWhatsAppButton = ({ customer }: { customer: Customer }) => {
  const link = toWhatsAppLink(customer.phone)
  if (!link) {
    return <span className="text-xs text-neutral-400">Sem telefone</span>
  }
  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Abrir WhatsApp de ${customer.fullName}`}
      className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 text-xs font-semibold text-emerald-700 transition-colors hover:border-emerald-400 hover:bg-emerald-100 active:scale-95"
    >
      <MessageCircle className="h-4 w-4" aria-hidden="true" />
      WhatsApp
    </a>
  )
}
