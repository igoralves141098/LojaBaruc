import { useEffect, useState } from 'react'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { SidebarMenu } from '@/components/layout/SidebarMenu'
import { AdminDashboard } from '@/features/admin/components/AdminDashboard'
import { CartDrawer } from '@/features/cart/components/CartDrawer'
import { FloatingCartBar } from '@/features/cart/components/FloatingCartBar'
import { CartProvider } from '@/features/cart/context/CartContext'
import { CustomerAuthProvider } from '@/features/customers/context/CustomerAuthContext'
import { CatalogSearch } from '@/features/catalog/components/CatalogSearch'
import { CategoryFilter } from '@/features/catalog/components/CategoryFilter'
import { CuratedShowcase } from '@/features/catalog/components/CuratedShowcase'
import { ProductDetailModal } from '@/features/catalog/components/ProductDetailModal'
import { ProductGrid } from '@/features/catalog/components/ProductGrid'
import { useCatalog } from '@/features/catalog/hooks/useCatalog'
import type { Product } from '@/features/catalog/types/product.types'

const Storefront = () => {
  const {
    products,
    filteredProducts,
    nicheGroups,
    isLoading,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    isShowcaseMode,
    clearFilters,
  } = useCatalog()

  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false)

  useEffect(() => {
    const syncFromHash = () => {
      if (window.location.hash === '#admin') setIsAdminOpen(true)
    }
    syncFromHash()
    window.addEventListener('hashchange', syncFromHash)
    return () => window.removeEventListener('hashchange', syncFromHash)
  }, [])

  const openAdmin = () => {
    setIsAdminOpen(true)
    if (window.location.hash !== '#admin') {
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#admin`)
    }
  }

  const closeAdmin = () => {
    setIsAdminOpen(false)
    if (window.location.hash === '#admin') {
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`)
    }
  }

  const resultLabel = isLoading
    ? 'Carregando coleção...'
    : `${filteredProducts.length} ${filteredProducts.length === 1 ? 'peça encontrada' : 'peças encontradas'}`

  const handleGoHome = () => {
    clearFilters()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenMenu={() => setIsMenuOpen(true)}
        onGoHome={handleGoHome}
      />

      <SidebarMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onGoHome={handleGoHome}
        nicheGroups={nicheGroups}
        totalProducts={products.length}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 pb-28 pt-6 sm:px-6 sm:pb-12 sm:pt-10 lg:px-8">
        <section className="flex flex-col gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-baruc-goldDark">
            Coleção Atual
          </span>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <h1 className="font-serif text-4xl font-semibold leading-none text-baruc-green sm:text-5xl">
              Estilo que <em className="font-semibold italic text-baruc-goldDark">define</em>
            </h1>
            <p className="text-sm text-neutral-500" aria-live="polite">
              {isShowcaseMode ? 'Seleção curada · escolha uma categoria' : resultLabel}
            </p>
          </div>
          <div className="mt-1 h-px w-16 bg-baruc-gold" aria-hidden="true" />
        </section>

        <CatalogSearch value={searchQuery} onChange={setSearchQuery} />

        <CategoryFilter selectedCategory={selectedCategory} onSelect={setSelectedCategory} />

        {isShowcaseMode && !isLoading && products.length > 0 ? (
          <CuratedShowcase
            products={products}
            onSelectCategory={(category) => setSelectedCategory(category)}
            onOpenProduct={setSelectedProduct}
          />
        ) : (
          <ProductGrid
            products={filteredProducts}
            isLoading={isLoading}
            onClearFilters={clearFilters}
            onProductClick={setSelectedProduct}
          />
        )}
      </main>

      <Footer onOpenAdmin={openAdmin} />
      <FloatingCartBar />
      <CartDrawer />
      <ProductDetailModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      {isAdminOpen && <AdminDashboard onClose={closeAdmin} />}
    </div>
  )
}

const App = () => (
  <CustomerAuthProvider>
    <CartProvider>
      <Storefront />
    </CartProvider>
  </CustomerAuthProvider>
)

export default App
