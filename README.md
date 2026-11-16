# BARUC - Loja Masculina

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?logo=vercel&logoColor=white)](https://vercel.com/)

Catálogo interativo de moda masculina no modelo **Click-to-Chat**: o cliente navega pelas peças, seleciona cor e tamanho, monta o carrinho e finaliza o pedido diretamente no WhatsApp oficial da loja.

- WhatsApp: **(83) 99909-1885** (`5583999091885`)
- Instagram: **[@baruc_lojamf](https://www.instagram.com/baruc_lojamf/)**
- Loja: **BARUC - Loja Masculina**

---

## Visão Geral do Projeto

A BARUC é uma vitrine digital focada em conversão por atendimento humano. Não existe checkout transacional com cartão: o carrinho gera um resumo formatado, com itens, variações, quantidades, subtotais, dados do cliente e forma de pagamento, e abre uma conversa pronta no WhatsApp.

Principais características:

- Catálogo estático servido por `public/api/products.json`, gerado a partir das pastas locais de produtos.
- Carrinho persistido no `localStorage`, com cálculo automático de subtotais, descontos e total.
- Navegação híbrida por macro-abas e menu lateral com filtro por subcategoria.
- Layout responsivo, com foco em dispositivos móveis e compatibilidade com iOS/Safari.
- Deploy de SPA na Vercel com fallback de rotas, cache de imagens e JSON.

## Identidade Visual e UI/UX

O design system é definido em `tailwind.config.js` com as cores oficiais da marca:

| Token | Cor | Uso |
| --- | --- | --- |
| `baruc-green` | `#324538` | Verde Baruc, cor institucional principal |
| `baruc-greenDark` | `#243329` | Fundos e estados de hover |
| `baruc-greenLight` | `#3F5646` | Superfícies de contraste |
| `baruc-gold` | `#CBA553` | Dourado principal, CTAs e detalhes |
| `baruc-goldDark` | `#B48E3D` | Dourado de apoio e textos |
| `baruc-goldLight` | `#F6F0E2` | Fundos suaves |
| `baruc-cream` | `#F8F7F4` | Fundo neutro da loja |

A logomarca é vetorial (`src/components/ui/BarucLogo.tsx`) e o ícone do Instagram é um SVG local, sem dependência de bibliotecas de marca.

Cuidados de compatibilidade mobile:

- Universal Links do WhatsApp via `https://wa.me/<telefone>?text=...`.
- Safe Areas respeitadas no menu lateral e no rodapé com `env(safe-area-inset-*)`.
- Inputs com fonte de 16px para evitar auto-zoom no iOS.
- Touch targets com no mínimo 44px nas ações principais.
- `min-h-dvh`, `overscroll-contain` e bloqueio de scroll do body ao abrir drawers.

## Arquitetura Escalável (Feature-Based)

```text
LojaBaruc/
├─ Produtos/                      # Fonte bruta local (fotos + info.txt) - ignorada no Git
├─ public/
│  ├─ api/products.json           # API estática consumida pelo catálogo
│  └─ produtos/                   # Imagens otimizadas/renomeadas para produção
├─ scripts/
│  ├─ sync-products.mjs           # Motor de sincronização do catálogo
│  └─ catalog.config.json         # Metadados, nichos, tamanhos e preços oficiais
├─ src/
│  ├─ components/
│  │  ├─ layout/                  # Header, Footer, SidebarMenu
│  │  └─ ui/                      # BarucLogo, InstagramIcon
│  ├─ config/env.ts               # Variáveis de ambiente sanitizadas
│  ├─ features/
│  │  ├─ catalog/                 # Tipos, service, hook e componentes do catálogo
│  │  └─ cart/                    # Contexto, tipos e UI do carrinho
│  ├─ hooks/                      # Hooks compartilhados
│  ├─ services/
│  │  ├─ whatsapp.service.ts      # Geração de links e mensagens do WhatsApp
│  │  └─ email.service.ts         # Fallback de contato por e-mail
│  ├─ styles/globals.css
│  ├─ utils/formatters.ts
│  ├─ App.tsx
│  └─ main.tsx
├─ vercel.json
├─ tailwind.config.js
├─ vite.config.ts
└─ package.json
```

Camadas principais:

- `src/features/catalog`: busca de produtos, normalização, agrupamento por nicho, filtros, busca textual e renderização dos cards.
- `src/features/cart`: estado global do carrinho, persistência, quantidades, subtotais e resumo do pedido.
- `src/services/whatsapp.service.ts`: única fonte de verdade para links e mensagens do WhatsApp (pedido, disponibilidade, categoria e atendimento geral).
- `src/components/layout`: cabeçalho com top bar institucional, menu lateral de categorias e rodapé.
- `scripts/sync-products.mjs`: lê `./Produtos`, aplica os preços oficiais, copia imagens para `public/produtos` e regenera `public/api/products.json`.

## Funcionalidades Principais

### Navegação híbrida

- Macro-abas: `Todos`, `Produtos`, `Camisas`, `Shorts`, `Suéter`, `Jaqueta`.
- Menu lateral (`SidebarMenu`) com agrupamento por nicho e filtro por uma das 14 subcategorias específicas.
- Busca textual tolerante a acentos, aplicada em nome, descrição, SKU, categoria, cores e badge.

### Produto e variações

- Seleção de cor quando disponível.
- Seleção de tamanho `P`, `M`, `G` e `GG`.
- Preço formatado em BRL com `Intl.NumberFormat`.
- Estados de esgotado, badge promocional e percentual de desconto.

### Carrinho

- Drawer lateral (`CartDrawer`) com imagem, SKU, tamanho, cor e quantidade.
- Persistência no `localStorage`.
- Cálculo automático de subtotal, desconto e total.
- Campos de nome, forma de pagamento (`PIX`, `Cartão`, `Combinar`) e entrega (`Entrega`, `Retirada na Loja`).
- Geração de mensagem formatada e abertura direta do WhatsApp oficial.

### Motor de sincronização do catálogo

O comando `npm run sync:products` (alias: `npm run sync-catalog`):

1. Lê as pastas de `./Produtos`.
2. Cria/atualiza `info.txt` com `NOME` e `PRECO`.
3. Aplica a tabela oficial de preços, com match por nome de pasta sem diferenciar maiúsculas ou acentos.
4. Copia e renomeia as imagens para `public/produtos/<slug>/`.
5. Gera `public/api/products.json` com IDs, SKUs, variações e preços.

Se `./Produtos` não existir no ambiente de build (caso da Vercel), o script não falha: ele preserva o `public/api/products.json` já versionado.

### Preços oficiais

| Categoria | Preço |
| --- | ---: |
| Camisa Basica Texturizada | R$ 89,99 |
| Camisas Basica Algodão | R$ 79,99 |
| Camisas Gola V | R$ 89,99 |
| Camisas Linho Social | R$ 134,99 |
| Camisas Polo | R$ 94,99 |
| Camisas Polo ziper | R$ 109,99 |
| Camisas Polo ziper Metalico | R$ 134,99 |
| Camisas Regata | R$ 69,99 |
| Camisas Texturizada Brisa | R$ 118,99 |
| Jaqueta | R$ 299,99 |
| Short Flex | R$ 69,99 |
| Short Linho | R$ 79,99 |
| Short Sarja | R$ 79,99 |
| Suéter | R$ 109,99 |

## Como Executar Localmente

Requisitos: Node.js 20+ e npm.

```bash
# Instalar dependências
npm install

# Sincronizar catálogo e preços (gera public/api/products.json)
npm run sync-catalog

# Ambiente de desenvolvimento
npm run dev

# Build de produção
npm run build

# Pré-visualizar o build
npm run preview

# Lint
npm run lint
```

O Vite inicia por padrão em `http://localhost:5173`.

## Variáveis de Ambiente

Copie `.env.example` para `.env` e ajuste conforme necessário. O arquivo `.env` é ignorado pelo Git.

| Variável | Descrição | Padrão |
| --- | --- | --- |
| `VITE_WHATSAPP_PHONE` | Número do WhatsApp em formato internacional, apenas dígitos | `5583999091885` |
| `VITE_WHATSAPP_DISPLAY` | Número exibido na interface | `83-99909-1885` |
| `VITE_STORE_NAME` | Nome da loja nas mensagens e no rodapé | `BARUC - Loja Masculina` |
| `VITE_CONTACT_EMAIL` | E-mail de contato de fallback | `contato@baruc.com.br` |
| `VITE_INSTAGRAM_HANDLE` | Handle do Instagram exibido | `@baruc_lojamf` |
| `VITE_INSTAGRAM_URL` | URL completa do perfil | `https://www.instagram.com/baruc_lojamf/` |

As variáveis são sanitizadas em `src/config/env.ts`; valores inválidos caem automaticamente nos padrões oficiais.

## Deploy na Vercel

O projeto já inclui `vercel.json` com:

- Build via `npm run build` e saída em `dist`.
- Rewrite de SPA para `index.html`, evitando 404 em rotas do cliente.
- Cache longo e imutável para `/produtos/*`.
- Cache curto com revalidação para `/api/products.json`.

Fluxo recomendado:

1. Suba o repositório para o GitHub.
2. Importe o projeto na Vercel.
3. A Vercel detecta o framework Vite automaticamente.
4. Cadastre as variáveis `VITE_*` em Project Settings > Environment Variables.
5. Faça o deploy.

Importante: `public/produtos/` e `public/api/products.json` precisam estar no repositório. A pasta bruta `/Produtos` é ignorada para manter o repositório leve; o JSON já gerado é usado no build da Vercel.

## Scripts Disponíveis

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Sincroniza o catálogo e inicia o Vite |
| `npm run build` | Sincroniza o catálogo, roda `tsc -b` e gera o build |
| `npm run preview` | Serve o build de produção localmente |
| `npm run lint` | Executa o ESLint |
| `npm run sync:products` | Sincroniza produtos, preços e imagens |
| `npm run sync-catalog` | Alias para `sync:products` |

## Licença

Projeto proprietário da BARUC - Loja Masculina. Todos os direitos reservados.
