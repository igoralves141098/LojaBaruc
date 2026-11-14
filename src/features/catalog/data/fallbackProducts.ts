import type { Product } from '@/features/catalog/types/product.types'

const unsplash = (photoId: string): string =>
  `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=800&q=80`

export const fallbackProducts: readonly Product[] = [
  {
    id: 'brc-001',
    sku: 'BRC-CAM-001',
    name: 'Camiseta Essential Algodão Pima',
    description:
      'Camiseta em algodão pima peruano de toque sedoso, gola reforçada e caimento regular. A base perfeita do guarda-roupa masculino.',
    price: 119.9,
    originalPrice: 149.9,
    imageUrl: unsplash('photo-1521572163474-6864f9cf17ab'),
    category: 'Camisetas',
    sizes: ['P', 'M', 'G', 'GG'],
    inStock: true,
    badge: 'MAIS VENDIDO',
  },
  {
    id: 'brc-002',
    sku: 'BRC-CMS-002',
    name: 'Camisa Linho Puro Havana',
    description:
      'Camisa 100% linho com respirabilidade superior, botões em madrepérola e modelagem slim. Elegância leve para dias quentes.',
    price: 229.9,
    originalPrice: 269.9,
    imageUrl: unsplash('photo-1596755094514-f87e34085b2c'),
    category: 'Camisas',
    sizes: ['P', 'M', 'G', 'GG'],
    inStock: true,
    badge: 'NOVO',
  },
  {
    id: 'brc-003',
    sku: 'BRC-CAS-003',
    name: 'Jaqueta de Couro Classic Black',
    description:
      'Jaqueta em couro legítimo com forro acetinado, zíperes metálicos e acabamento artesanal. Atitude atemporal.',
    price: 649.9,
    imageUrl: unsplash('photo-1551028719-00167b16eac5'),
    category: 'Casacos',
    sizes: ['M', 'G', 'GG'],
    inStock: true,
    badge: 'EXCLUSIVO',
  },
  {
    id: 'brc-004',
    sku: 'BRC-CAL-004',
    name: 'Calça Chino Alfaiataria Slim',
    description:
      'Calça chino em sarja com elastano, cós de alfaiataria e corte slim. Versátil do escritório ao happy hour.',
    price: 259.9,
    originalPrice: 299.9,
    imageUrl: unsplash('photo-1473966968600-fa801b869a1a'),
    category: 'Calças',
    sizes: ['38', '40', '42', '44'],
    inStock: true,
  },
  {
    id: 'brc-005',
    sku: 'BRC-CAM-005',
    name: 'Polo Tricot Imperial Verde Baruc',
    description:
      'Polo em tricot de fio egípcio na cor assinatura da casa, com gola estruturada e punhos canelados.',
    price: 179.9,
    imageUrl: unsplash('photo-1586363104862-3a5e2ab60d99'),
    category: 'Camisetas',
    sizes: ['P', 'M', 'G'],
    inStock: true,
    badge: 'DESTAQUE',
  },
  {
    id: 'brc-006',
    sku: 'BRC-CLC-006',
    name: 'Sapato Loafer Camurça Café',
    description:
      'Loafer em camurça legítima com palmilha acolchoada e solado de couro. Sofisticação descomplicada.',
    price: 389.9,
    originalPrice: 449.9,
    imageUrl: unsplash('photo-1614252235316-8c857d38b5f4'),
    category: 'Calçados',
    sizes: ['39', '40', '41', '42'],
    inStock: true,
    badge: 'OFERTA',
  },
  {
    id: 'brc-007',
    sku: 'BRC-CLC-007',
    name: 'Tênis Urban Leather White',
    description: 'Tênis minimalista em couro branco com solado emborrachado costurado. Combina com tudo.',
    price: 379.9,
    imageUrl: unsplash('photo-1549298916-b41d501d3772'),
    category: 'Calçados',
    sizes: ['39', '40', '41', '42'],
    inStock: false,
  },
  {
    id: 'brc-008',
    sku: 'BRC-ACS-008',
    name: 'Perfume Baruc Woody Intense 100ml',
    description:
      'Eau de Parfum amadeirado com notas de vetiver, couro e âmbar. Alta fixação e assinatura marcante.',
    price: 289.9,
    originalPrice: 339.9,
    imageUrl: unsplash('photo-1594035910387-fea47794261f'),
    category: 'Acessórios',
    sizes: ['Único'],
    inStock: true,
    badge: 'MAIS VENDIDO',
  },
]
