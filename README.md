<div align="center">

# 🧥 BARUC — Loja Masculina
### E-Commerce Catálogo Interativo & Checkout Automatizado via WhatsApp

![React](https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![NodeJS](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

![Identidade Visual](https://img.shields.io/badge/Verde_Baruc-%23324538-324538?style=flat-square)
![Dourado Oficial](https://img.shields.io/badge/Dourado_Baruc-%23CBA553-CBA553?style=flat-square)
![iOS Ready](https://img.shields.io/badge/iOS_Safari-100%25_Compat%C3%ADvel-000000?style=flat-square&logo=apple)

<p align="center">
  <b>Estilo que define.</b> Plataforma web responsiva desenvolvida sob medida para a <b>BARUC Loja Masculina</b>, unindo a experiência de compra de um e-commerce moderno (escolha de cor, tamanho e carrinho persistente) à conversão direta no WhatsApp.
</p>

[**📱 Instagram Oficial (@baruc_lojamf)**](https://www.instagram.com/baruc_lojamf/) • [**💬 Atendimento WhatsApp (83 99909-1885)**](https://wa.me/5583999091885)

</div>

---

## 📌 Sobre o Projeto

O **Baruc E-Commerce** foi projetado sob o modelo **Click-to-Chat Cart Checkout**. Diferente de catálogos estáticos onde o cliente precisa enviar um produto por vez, esta plataforma permite navegar por múltiplos nichos de moda masculina, selecionar **Cor** e **Tamanho (`P`, `M`, `G`, `GG`)**, acumular itens em um **Carrinho Lateral Inteligente (`CartDrawer`)** e finalizar a compra com um único clique.

Ao finalizar o pedido, o motor de redirecionamento gera automaticamente uma mensagem estruturada contendo todos os itens, códigos SKU, variações escolhidas, quantidades e o **valor total calculado**, encaminhando o cliente diretamente para o WhatsApp oficial da loja sem bloqueios de pop-up no **iOS (Safari/WebKit)** ou Android.

---

## ✨ Principais Funcionalidades

- 🎨 **Identidade Visual Oficial (Design System Baruc):**
  - Paleta exclusiva extraída do manual da marca: Verde Profundo (`#324538`), Dourado Mostarda (`#CBA553`), Dourado Escuro (`#B48E3D`) e Creme Editorial (`#F8F7F4`).
  - Logomarca e monograma **`BC`** entrelaçados renderizados em **SVG Vetorial 1:1** de alta precisão.
- 🧭 **Navegação Híbrida (Macro-Abas + Menu Lateral de Subcategorias):**
  - **Barra Principal Limpa:** Filtro rápido por `Todos`, `Produtos`, `Camisas`, `Shorts`, `Suéter` e `Jaqueta`.
  - **Sidebar Menu (`≡`):** Drawer lateral esquerdo que permite filtrar especificamente cada uma das **14 subcategorias/nichos** da loja, além de acesso rápido ao WhatsApp e Instagram.
- 🛒 **Carrinho de Compras Completo (`CartDrawer` + `LocalStorage`):**
  - Persistência automática no navegador (`@BarucMasculina:cart-v1`) com tratamento seguro para navegação privada no Safari iOS.
  - Diferenciação inteligente de itens por `ID + Tamanho + Cor`.
  - Cálculo em tempo real de subtotais, descontos e valor total do pedido.
  - Barra flutuante inferior (`FloatingCartBar`) otimizada para uso com apenas uma mão no mobile.
- ⚙️ **Motor de Sincronização Automática de Catálogo (`scripts/sync-products.mjs`):**
  - Script Node.js que lê automaticamente as pastas locais de fotos em `./Produtos`, cruza com as regras de cores, tamanhos e preços de cada grupo e gera a API JSON estática-dinâmica em `public/api/products.json`.
- 📱 **Engenharia Mobile-First & Compatibilidade iOS (Safari):**
  - Uso de Universal Links (`https://wa.me/`) acionados de forma síncrona para evitar bloqueio nativo do Safari no iPhone.
  - Suporte a `viewport-fit=cover` e `safe-area-inset` para iPhones com *Notch* / *Dynamic Island*.
  - Inputs com tipografia mínima de `16px` (`text-base`) para impedir o auto-zoom intrusivo do iOS.
  - Áreas de toque mínimas de `44x44px` seguindo as diretrizes da Apple (*Human Interface Guidelines*).

---

## 🗂️ Catálogo Oficial, Cores e Precificação

Abaixo está o mapeamento oficial das **14 linhas de produtos** sincronizadas pelo sistema (todas disponíveis nos tamanhos **P, M, G e GG**):

| Categoria / Pasta | Macro-Nicho | Cores Disponíveis | Tamanhos | Preço Oficial |
| :--- | :---: | :--- | :---: | :---: |
| **Camisa Básica Texturizada** | Camisas | Preto, Off, Verde Musgo, Chocolate, Marfim | P ao GG | `R$ 89,99` |
| **Camisas Básica Algodão** | Camisas | Azul Marinho, Off, Preto, Azul Bebê, Vinho | P ao GG | `R$ 79,99` |
| **Camisas Gola V** | Camisas | Preto, Creme, Off | P ao GG | `R$ 89,99` |
| **Camisas Linho Social** | Camisas | Branco, Preto, Azul Marinho, Areia | P ao GG | `R$ 134,99` |
| **Camisas Polo** | Camisas | Preto, Branco, Azul Marinho, Verde | P ao GG | `R$ 94,99` |
| **Camisas Polo Zíper** | Camisas | Preto, Branco, Off, Azul Marinho | P ao GG | `R$ 109,99` |
| **Camisas Polo Zíper Metálico** | Camisas | Azul, Marrom, Branco | P ao GG | `R$ 134,99` |
| **Camisas Regata** | Camisas | Chocolate, Preto, Branco | P ao GG | `R$ 69,99` |
| **Camisas Texturizada Brisa** | Camisas | Avelã, Preto | P ao GG | `R$ 118,99` |
| **Short Flex** | Shorts | Branco, Azul, Preto | P ao GG | `R$ 69,99` |
| **Short Linho** | Shorts | Verde, Bege, Azul Bebê, Preto, Areia, Branco, Verde Lima | P ao GG | `R$ 79,99` |
| **Short Sarja** | Shorts | Verde Militar, Preto | P ao GG | `R$ 79,99` |
| **Suéter** | Suéter | Verde, Branco, Preto | P ao GG | `R$ 109,99` |
| **Jaqueta** | Jaqueta | Preto | P ao GG | `R$ 299,99` |

---

## 🏗️ Arquitetura do Projeto (Feature-Based)

O projeto utiliza **Feature-Based Architecture**, isolando regras de negócio (Catálogo e Carrinho) de componentes visuais globais e serviços externos:

```text
LojaBaruc/
├── Produtos/                        # Diretório fonte com as 14 pastas de fotos e info.txt
├── public/
│   ├── api/
│   │   ├── products.json            # Catálogo JSON gerado automaticamente pelo script
│   │   └── categories.json          # Lista de categorias sincronizadas
│   └── produtos/                    # Imagens otimizadas e espelhadas para produção
├── scripts/
│   └── sync-products.mjs            # Motor Node.js que sincroniza ./Produtos -> public/api/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx           # Top Bar (@baruc_lojamf + Frete Brasil) + Busca + Carrinho
│   │   │   ├── SidebarMenu.tsx      # Menu lateral esquerdo com filtro por subcategoria
│   │   │   └── Footer.tsx           # Rodapé institucional Baruc
│   │   └── ui/
│   │       └── BarucLogo.tsx        # Vetores SVG oficiais (Monograma BC + Wordmark BARUC)
│   ├── config/
│   │   └── env.ts                   # Tipagem e fallback de variáveis de ambiente (VITE_*)
│   ├── features/
│   │   ├── catalog/                 # Domínio do Catálogo de Produtos
│   │   │   ├── components/          # ProductCard, ProductGrid, CategoryFilter
│   │   │   ├── hooks/               # useCatalog (busca + filtro macro e subcategorias)
│   │   │   ├── services/            # product.service.ts (consumo assíncrono do JSON)
│   │   │   └── types/               # product.types.ts
│   │   └── cart/                    # Domínio do Carrinho de Compras
│   │       ├── components/          # CartDrawer, FloatingCartBar
│   │       ├── context/             # CartContext.tsx (Estado global + LocalStorage)
│   │       └── types/               # cart.types.ts
│   ├── services/
│   │   └── whatsapp.service.ts      # Construtor de mensagens e Universal Links (wa.me)
│   ├── styles/
│   │   └── globals.css              # Tailwind CSS + Regras de Safe Area para iOS
│   ├── utils/
│   │   └── formatters.ts            # Formatação monetária BRL (Intl.NumberFormat)
│   ├── App.tsx
│   └── main.tsx
├── .env.example
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
