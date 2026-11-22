import { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react'
import { fetchProducts } from '@/features/catalog/services/product.service'
import type { Product } from '@/features/catalog/types/product.types'

export const ALL_CATEGORIES = 'Todos' as const
export const ALL_PRODUCTS_TAB = 'Produtos' as const
export const MACRO_CATEGORIES = ['Camisas', 'Shorts', 'Suéter', 'Jaqueta'] as const
export const MAIN_TABS = [ALL_CATEGORIES, ALL_PRODUCTS_TAB, ...MACRO_CATEGORIES] as const

export type MacroCategory = (typeof MACRO_CATEGORIES)[number]
export type MainTab = (typeof MAIN_TABS)[number]
export type CategoryFilterValue = MainTab | string

export interface NicheGroup {
  niche: MacroCategory
  totalCount: number
  categories: Array<{ name: string; count: number }>
}

const isAllSelection = (category: CategoryFilterValue): boolean =>
  category === ALL_CATEGORIES || category === ALL_PRODUCTS_TAB

const normalize = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()

export const getMacroCategory = (folderOrCategoryName: string): MacroCategory => {
  const normalized = normalize(folderOrCategoryName)
  if (
    normalized.includes('camisa') ||
    normalized.includes('polo') ||
    normalized.includes('regata') ||
    normalized.includes('gola')
  ) {
    return 'Camisas'
  }
  if (normalized.includes('short') || normalized.includes('bermuda')) {
    return 'Shorts'
  }
  if (normalized.includes('sueter')) {
    return 'Suéter'
  }
  if (normalized.includes('jaqueta') || normalized.includes('casaco')) {
    return 'Jaqueta'
  }
  return 'Camisas'
}

export const isMacroCategory = (value: string): value is MacroCategory =>
  (MACRO_CATEGORIES as readonly string[]).includes(value)

export const isMainTab = (value: string): value is MainTab =>
  (MAIN_TABS as readonly string[]).includes(value)

export interface UseCatalogResult {
  products: Product[]
  filteredProducts: Product[]
  categories: string[]
  nicheGroups: NicheGroup[]
  isLoading: boolean
  searchQuery: string
  setSearchQuery: (query: string) => void
  selectedCategory: CategoryFilterValue
  setSelectedCategory: (category: CategoryFilterValue) => void
  hasActiveFilters: boolean
  isShowcaseMode: boolean
  clearFilters: () => void
}

export const useCatalog = (): UseCatalogResult => {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilterValue>(ALL_CATEGORIES)
  const deferredQuery = useDeferredValue(searchQuery)

  useEffect(() => {
    let isActive = true

    fetchProducts()
      .then((data) => {
        if (isActive) setProducts(data)
      })
      .finally(() => {
        if (isActive) setIsLoading(false)
      })

    return () => {
      isActive = false
    }
  }, [])

  const categories = useMemo<string[]>(
    () =>
      Array.from(new Set(products.map((product) => product.category))).sort((a, b) =>
        a.localeCompare(b, 'pt-BR'),
      ),
    [products],
  )

  const nicheGroups = useMemo<NicheGroup[]>(() => {
    const countsByCategory = new Map<string, { niche: MacroCategory; count: number }>()
    for (const product of products) {
      const current = countsByCategory.get(product.category)
      countsByCategory.set(product.category, {
        niche: current?.niche ?? getMacroCategory(product.category),
        count: (current?.count ?? 0) + 1,
      })
    }

    const byNiche = new Map<MacroCategory, Array<{ name: string; count: number }>>()
    for (const [name, { niche, count }] of countsByCategory.entries()) {
      const list = byNiche.get(niche) ?? []
      list.push({ name, count })
      byNiche.set(niche, list)
    }

    return MACRO_CATEGORIES.map((niche) => {
      const items = (byNiche.get(niche) ?? []).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
      const totalCount = items.reduce((sum, item) => sum + item.count, 0)
      return {
        niche,
        totalCount,
        categories: items,
      }
    }).filter((group) => group.categories.length > 0)
  }, [products])

  const filteredProducts = useMemo<Product[]>(() => {
    const query = normalize(deferredQuery)

    return products.filter((product) => {
      if (!isAllSelection(selectedCategory)) {
        if (isMacroCategory(selectedCategory)) {
          if (getMacroCategory(product.category) !== selectedCategory && product.category !== selectedCategory) {
            return false
          }
        } else if (product.category !== selectedCategory) {
          return false
        }
      }

      if (query.length === 0) return true

      const haystack = normalize(
        [
          product.name,
          product.description,
          product.fullDescription ?? '',
          product.sku,
          product.category,
          product.niche,
          getMacroCategory(product.category),
          product.colors.join(' '),
          product.sizes.join(' '),
          product.badge ?? '',
          product.technicalSheet?.fabric ?? '',
          product.technicalSheet?.fit ?? '',
          product.technicalSheet?.composition ?? '',
          product.technicalSheet?.origin ?? '',
          product.technicalSheet?.care ?? '',
          (product.specifications ?? []).join(' '),
        ].join(' '),
      )
      return haystack.includes(query)
    })
  }, [products, deferredQuery, selectedCategory])

  const isShowcaseMode = selectedCategory === ALL_CATEGORIES && searchQuery.trim().length === 0

  const clearFilters = useCallback(() => {
    setSearchQuery('')
    setSelectedCategory(ALL_CATEGORIES)
  }, [])

  return {
    products,
    filteredProducts,
    categories,
    nicheGroups,
    isLoading,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    hasActiveFilters: searchQuery.trim().length > 0 || !isAllSelection(selectedCategory),
    isShowcaseMode,
    clearFilters,
  }
}
