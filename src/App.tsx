import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { CartDrawer } from '@/features/cart/components/CartDrawer'
import { FloatingCartBar } from '@/features/cart/components/FloatingCartBar'
import { CartProvider } from '@/features/cart/context/CartContext'
import { CategoryFilter } from '@/features/catalog/components/CategoryFilter'
import { ProductGrid } from '@/features/catalog/components/ProductGrid'
import { useCatalog } from '@/features/catalog/hooks/useCatalog'

const Storefront = () => {
  const {
    filteredProducts,
    categories,
    isLoading,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    clearFilters,
  } = useCatalog()

  const resultLabel = isLoading
    ? 'Carregando coleção...'
    : `${filteredProducts.length} ${filteredProducts.length === 1 ? 'peça encontrada' : 'peças encontradas'}`

  return (
    <div className="flex min-h-dvh flex-col">
      <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />

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
              {resultLabel}
            </p>
          </div>
          <div className="mt-1 h-px w-16 bg-baruc-gold" aria-hidden="true" />
        </section>

        <CategoryFilter categories={categories} selectedCategory={selectedCategory} onSelect={setSelectedCategory} />

        <ProductGrid products={filteredProducts} isLoading={isLoading} onClearFilters={clearFilters} />
      </main>

      <Footer />
      <FloatingCartBar />
      <CartDrawer />
    </div>
  )
}

const App = () => (
  <CartProvider>
    <Storefront />
  </CartProvider>
)

export default App
