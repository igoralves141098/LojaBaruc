<div align="center">

# 👔 BARUC — Loja Masculina

### E-Commerce Catálogo Interativo, Gestão de Vendas & Checkout Automatizado via WhatsApp

![React](https://img.shields.io/badge/React-18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-Auth_%26_Firestore-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-Scripts-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-Deploy-000000?style=for-the-badge&logo=vercel&logoColor=white)

![Verde Baruc](https://img.shields.io/badge/Verde_Baruc-%23233827-233827?style=flat-square)
![Dourado Baruc](https://img.shields.io/badge/Dourado_Baruc-%23C5A059-C5A059?style=flat-square)
![iOS Safari](https://img.shields.io/badge/iOS_Safari-100%25_Compatível-233827?style=flat-square&logo=apple&logoColor=white)

**Estilo que define.** Plataforma web responsiva desenvolvida sob medida para a **BARUC Loja Masculina**, unindo a experiência de compra de um e-commerce moderno (escolha de cor, tamanho, conta do cliente, controle de estoque em tempo real e painel administrativo) à conversão direta no WhatsApp.

[📸 Instagram Oficial (`@baruc_lojamf`)](https://www.instagram.com/baruc_lojamf/) • [💬 Atendimento WhatsApp (`(83) 99609-5881`)](https://wa.me/5583996095881)

</div>

---

## 📌 Sobre o Projeto

O **Baruc E-Commerce** foi projetado sob o modelo **Click-to-Chat Cart Checkout** integrado ao **Cloud Firestore** e **Firebase Authentication**. Diferente de catálogos estáticos onde o cliente precisa enviar um produto por vez, a plataforma permite navegar por múltiplas linhas de moda masculina, selecionar **Cor** e **Tamanho** (`P`, `M`, `G`, `GG`), acumular itens em um **Carrinho Lateral Inteligente** (`CartDrawer`) e registrar o pedido automaticamente no banco antes de abrir o atendimento no WhatsApp.

Na retaguarda, o lojista conta com o **Painel Administrativo BARUC (`/#admin`)** para gerenciar o catálogo, acompanhar clientes cadastrados, confirmar pagamentos na aba **Vendas** e executar a **baixa automática de estoque** por cor e tamanho.

---

## ✨ Principais Funcionalidades

* 🎨 **Identidade Visual Oficial (Design System Baruc)**
  * Paleta exclusiva extraída do manual da marca: Verde Profundo (`#233827`), Dourado Mostarda (`#C5A059`), Dourado Escuro (`#B28A3F`) e Creme Editorial (`#F8F7F4`).
  * Logomarca e monograma `BC` entrelaçados renderizados em SVG Vetorial 2D de alta precisão.

* 🧭 **Navegação Híbrida (Macro Abas + Menu Lateral de Subcategorias)**
  * Barra Principal limpa filtrável por `Todos`, `Camisas`, `Shorts`, `Suéter` e `Jaqueta`.
  * **Sidebar Menu (`☰`):** Drawer lateral esquerdo que filtra especificamente cada uma das 14 subcategorias/linhas da loja, além de oferecer acesso rápido ao WhatsApp e Instagram.

* 🔐 **Autenticação & Portal do Cliente (Firebase Auth + Firestore)**
  * Cadastro e login de clientes com validação de dados (Nome completo, CPF, Data de nascimento, Telefone e E-mail) e verificação de e-mail.
  * Modal automático de **Entrar / Cadastrar** na primeira visita e após logout, com opção **"Continuar navegando sem login"** para explorar livremente a vitrine.
  * Adição ao carrinho protegida por autenticação: visitantes deslogados são direcionados ao login antes de montar o carrinho.
  * Menu dropdown **"Olá, {Nome}"** no cabeçalho com acesso direto à área **Dados da Conta** (edição de perfil no Firestore e visualização de **Meus Pedidos Confirmados**) e opção **Sair**.

* 🛍️ **Carrinho Inteligente & Controle de Disponibilidade (`CartDrawer`)**
  * Diferenciação inteligente de itens por `ID + Tamanho + Cor` e cálculo em tempo real de subtotais e valor total do pedido.
  * Bloqueio automático de variantes esgotadas: quando uma cor ou tamanho atinge `0` unidades, a vitrine exibe **"Produto indisponível"** e impede a compra até a reposição no painel admin.
  * Limpeza automática do carrinho ao sair da conta (`Sair`) ou ao finalizar o pedido pelo WhatsApp, evitando mistura de itens entre sessões.

* 🛡️ **Painel Administrativo BARUC (`/#admin`)**
  * Acesso restrito ao e-mail administrativo autorizado (`loja.baruccg@gmail.com`).
  * **Aba Produtos:** Cadastro, edição, exclusão, controle de estoque por cor/tamanho e importação em lote via JSON local.
  * **Aba Clientes:** Listagem de clientes cadastrados, busca por nome/CPF/e-mail/telefone, botão de contato direto no WhatsApp e exclusão de registros.
  * **Aba Vendas & Baixa Atômica de Estoque:** Registro automático de pedidos gerados no carrinho, indicadores de **Quantidade de Vendas**, **Faturamento Total (R$)** e **Aguardando Pagamento**, com botão **Confirmar Pagamento** que desconta o estoque da cor e tamanho vendidos via `runTransaction` do Firestore.

* ⚙️ **Motor de Sincronização de Catálogo (`scripts/sync-products.mjs`)**
  * Script Node.js que lê automaticamente as pastas locais de fotos em `./Produtos`, cruza com as regras de cores, tamanhos e preços de cada grupo e gera a API JSON estática em `public/api/products.json`.

* 📱 **Engenharia Mobile-First & Compatibilidade iOS (Safari)**
  * Uso de Universal Links (`https://wa.me/`) acionados de forma síncrona para evitar bloqueio nativo do Safari no iPhone.
  * Suporte a `viewport-fit=cover` e `safe-area-inset` para iPhones com Notch / Dynamic Island.
  * Inputs com tipografia mínima de `16px` (`text-base`) para impedir o auto-zoom intrusivo do iOS e áreas de toque mínimas de `44x44px`.

---

## 🗂️ Catálogo Oficial, Cores e Precificação

Abaixo está o mapeamento oficial das **14 linhas de produtos** sincronizadas pelo sistema (todas disponíveis nos tamanhos **P, M, G e GG**):

| Categoria / Peça | Macro-Linha | Cores Disponíveis | Tamanhos | Preço Oficial |
| :--- | :---: | :--- | :---: | :---: |
| **Camisa Básica Texturizada** | Camisas | Preto, Off, Verde Musgo, Chocolate, Marfim | P ao GG | **R$ 89,99** |
| **Camisa Básica Algodão** | Camisas | Azul Marinho, Off, Preto, Azul Bebê, Verde | P ao GG | **R$ 79,99** |
| **Camisa Gola V** | Camisas | Preto, Creme, Off | P ao GG | **R$ 79,99** |
| **Camisa Linho Social** | Camisas | Branco, Preto, Azul Marinho, Areia | P ao GG | **R$ 149,99** |
| **Camisa Polo** | Camisas | Preto, Branco, Azul Marinho, Verde | P ao GG | **R$ 99,99** |
| **Camisa Polo Zíper** | Camisas | Preto, Branco, Off, Azul Marinho | P ao GG | **R$ 119,99** |
| **Camisa Polo Zíper Metálico** | Camisas | Azul, Marrom, Branco | P ao GG | **R$ 129,99** |
| **Camisa Regata** | Camisas | Chocolate, Preto, Branco | P ao GG | **R$ 69,99** |
| **Camisa Texturizada Brisa** | Camisas | Azul, Preto | P ao GG | **R$ 99,99** |
| **Short Flex** | Shorts | Branco, Azul, Preto | P ao GG | **R$ 89,99** |
| **Short Linho** | Shorts | Verde, Bege, Azul Bebê, Preto, Areia, Branco, Verde Lima | P ao GG | **R$ 99,99** |
| **Short Sarja** | Shorts | Verde Militar, Preto | P ao GG | **R$ 99,99** |
| **Suéter** | Suéter | Verde, Branco, Preto | P ao GG | **R$ 139,99** |
| **Jaqueta** | Jaqueta | Preto | P ao GG | **R$ 179,99** |

---

## 🏗️ Arquitetura do Projeto (Feature-Based)

O projeto utiliza **Feature-Based Architecture**, isolando regras de negócio (Catálogo, Carrinho, Clientes, Pedidos e Painel Admin) de componentes visuais globais e serviços externos:

```text
LojaBaruc/
├── Produtos/                      # Diretório fonte com as 14 pastas de fotos e cada cor
├── public/
│   ├── api/
│   │   ├── products.json          # Catálogo JSON gerado automaticamente pelo script
│   │   └── categories.json        # Lista de categorias sincronizadas
│   └── products/                  # Imagens otimizadas e organizadas para produção
├── scripts/
│   └── sync-products.mjs          # Motor Node.js que sincroniza ./Produtos -> public/api/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx         # Top Bar (Macro-abas, menu do cliente e botão carrinho)
│   │   │   ├── SidebarMenu.tsx    # Menu lateral esquerdo com filtro por subcategoria
│   │   │   └── Footer.tsx         # Rodapé institucional Baruc
│   │   └── ui/
│   │       └── BarucLogo.tsx      # Vetores SVG oficiais (Monograma BC e logotipo)
│   ├── config/
│   │   └── env.ts                 # Tipagem e validação de variáveis de ambiente (VITE_*)
│   ├── features/
│   │   ├── admin/                 # Painel restrito (Produtos, Clientes, Vendas e Estoque)
│   │   │   └── components/
│   │   │       └── AdminDashboard.tsx
│   │   ├── cart/                  # Módulo de Carrinho de Compras
│   │   │   ├── components/        # CartDrawer, FloatingCartBar
│   │   │   ├── context/           # CartContext.tsx (estado global + limpeza automática)
│   │   │   └── types/             # cart.types.ts
│   │   ├── catalog/               # Módulo de Catálogo de Produtos
│   │   │   ├── components/        # HeroSection, CuratedShowcase, ProductDetailModal
│   │   │   ├── hooks/             # useCatalog.ts (busca e filtro macro e subcategorias)
│   │   │   ├── services/          # product.service.ts (Firestore + fallback JSON)
│   │   │   └── types/             # product.types.ts
│   │   ├── customers/             # Módulo de Autenticação e Conta do Cliente
│   │   │   ├── components/        # CustomerAuthModal, CustomerAccountModal
│   │   │   ├── context/           # CustomerAuthContext.tsx
│   │   │   └── types/             # customer.types.ts
│   │   └── orders/                # Módulo de Pedidos e Baixa Atômica de Estoque
│   │       ├── services/          # order.service.ts (runTransaction no Firestore)
│   │       └── types/             # order.types.ts
│   ├── services/
│   │   ├── firebase.ts            # Inicialização Firebase App, Auth e Cloud Firestore
│   │   └── whatsapp.service.ts    # Construtor de mensagens e Universal Links (wa.me)
│   ├── styles/
│   │   └── global.css             # Variáveis CSS e regras de safe-area para iOS
│   ├── utils/
│   │   └── formatters.ts          # Formatação monetária BRL (Intl.NumberFormat) e máscaras
│   ├── App.tsx
│   └── main.tsx
├── .env.example
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

---

## 🔒 Segurança e Regras do Cloud Firestore

As coleções `products`, `customers` e `orders` são protegidas por regras de acesso que garantem leitura pública do catálogo, isolamento dos dados de cada cliente e controle exclusivo do administrador para baixa de estoque e gestão de vendas:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAdmin() {
      return request.auth != null
        && request.auth.token.email == 'loja.baruccg@gmail.com';
    }

    match /products/{productId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    match /customers/{uid} {
      allow get: if isAdmin() || (request.auth != null && request.auth.uid == uid);
      allow list: if isAdmin();
      allow create: if request.auth != null && request.auth.uid == uid;
      allow update: if isAdmin() || (request.auth != null && request.auth.uid == uid);
      allow delete: if isAdmin();
    }

    match /orders/{orderId} {
      allow create: if request.resource.data.status == 'pending';
      allow read: if isAdmin() || (request.auth != null && resource.data.customerId == request.auth.uid);
      allow update, delete: if isAdmin();
    }
  }
}
```

---

## 🚀 Como Executar Localmente

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

Crie um arquivo `.env.local` na raiz do projeto com base no `.env.example`:

```env
VITE_WHATSAPP_NUMBER=5583996095881
VITE_INSTAGRAM_HANDLE=baruc_lojamf
VITE_INSTAGRAM_URL=[https://www.instagram.com/baruc_lojamf/](https://www.instagram.com/baruc_lojamf/)
VITE_STORE_NAME=BARUC
VITE_ADMIN_EMAIL=loja.baruccg@gmail.com

VITE_FIREBASE_API_KEY=sua_api_key
VITE_FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu_project_id
VITE_FIREBASE_STORAGE_BUCKET=seu_projeto.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
VITE_FIREBASE_APP_ID=seu_app_id
```

### 3. Sincronizar catálogo (opcional ao adicionar novas fotos) e iniciar servidor

```bash
node scripts/sync-products.mjs
npm run dev
```

A aplicação ficará disponível em `http://localhost:5173` (e o painel administrativo em `http://localhost:5173/#admin`).

---

<div align="center">

Desenvolvido para **BARUC — Loja Masculina** • Campina Grande, PB

</div>
