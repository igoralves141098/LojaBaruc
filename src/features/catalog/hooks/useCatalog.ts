import { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react'
import { fetchProducts } from '@/features/catalog/services/product.service'
import type { Product } from '@/features/catalog/types/product.types'

export const ALL_CATEGORIES = 'Todos' as const

export type CategoryFilterValue = typeof ALL_CATEGORIES | string

const normalize = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()

export interface UseCatalogResult {
  products: Product[]
  filteredProducts: Product[]
  categories: string[]
  isLoading: boolean
  searchQuery: string
  setSearchQuery: (query: string) => void
  selectedCategory: CategoryFilterValue
  setSelectedCategory: (category: CategoryFilterValue) => void
  hasActiveFilters: boolean
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

  const filteredProducts = useMemo<Product[]>(() => {
    const query = normalize(deferredQuery)

    return products.filter((product) => {
      if (selectedCategory !== ALL_CATEGORIES && product.category !== selectedCategory) return false
      if (query.length === 0) return true

      const haystack = normalize(
        `${product.name} ${product.description} ${product.sku} ${product.category} ${product.badge ?? ''}`,
      )
      return haystack.includes(query)
    })
  }, [products, deferredQuery, selectedCategory])

  const clearFilters = useCallback(() => {
    setSearchQuery('')
    setSelectedCategory(ALL_CATEGORIES)
  }, [])

  return {
    products,
    filteredProducts,
    categories,
    isLoading,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    hasActiveFilters: searchQuery.trim().length > 0 || selectedCategory !== ALL_CATEGORIES,
    clearFilters,
  }
}
