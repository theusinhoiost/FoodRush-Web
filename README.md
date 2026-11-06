# FoodRush Web

Interface web moderna da plataforma **FoodRush** de delivery de refeições, construída com **Angular 22**, **Tailwind CSS v4**, **Spartan UI (Helm)** e **Server-Side Rendering (SSR)**.

A aplicação integra-se com a API RESTful do ecossistema FoodRush (`http://localhost:8080/api/v1`) oferecendo experiências dedicadas por perfil de acesso (**Cliente**, **Restaurante**, **Entregador** e **Administrador**), geolocalização via CEP (OpenCage Geocoder), cálculo dinâmico de frete (Haversine) e painel operacional de cozinha (**KDS**).

---

## Sumário

- [Tecnologias Utilizadas](#tecnologias-utilizadas)
- [Funcionalidades Principais](#funcionalidades-principais)
- [Perfis de Acesso (RBAC)](#perfis-de-acesso-rbac)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Rotas da Aplicação](#rotas-da-aplicação)
- [Pré-requisitos e Instalação](#pré-requisitos-e-instalação)
- [Scripts Disponíveis](#scripts-disponíveis)
- [Contas de Demonstração (Quick Fill)](#contas-de-demonstração-quick-fill)

---

## Tecnologias Utilizadas

| Categoria | Tecnologia | Versão |
| :--- | :--- | :--- |
| **Framework** | [Angular](https://angular.dev) (Standalone Components, Signals, SSR) | `^22.2.0` |
| **Estilização** | [Tailwind CSS](https://tailwindcss.com) + `tw-animate-css` | `^4.1.12` |
| **Componentes UI** | [Spartan NG (Brain & Helm)](https://spartan.ng) + CVA | `^1.9.0` |
| **Ícones** | [`@ng-icons/lucide`](https://ng-icons.github.io/ng-icons/) | `^33.4.0` |
| **Reatividade** | Angular Signals + RxJS | `~7.8.0` |
| **Servidor SSR** | Angular SSR + Express | `^5.1.0` |
| **Testes Unitários** | [Vitest](https://vitest.dev) + JSDOM | `^5.0.0` |
| **Linguagem** | TypeScript | `~6.0.2` |

---

## Funcionalidades Principais

- **Catálogo e Busca de Restaurantes**:
  - Filtro por nome, CNPJ, categoria (Hambúrgueres, Pizzarias) e status (Abertos Agora).
  - Busca geográfica por proximidade (**Perto de Mim**) resolvendo CEP + número em coordenadas (`latitude`/`longitude`) e raio em quilômetros.
  - Links diretos de localização no **Google Maps** e **OpenStreetMap**.
- **Cardápio Interativo e Carrinho de Compras**:
  - Seleção de tamanhos com controle de estoque e grupos de complementos (mínimo, máximo e obrigatoriedade).
  - Simulação de taxa de entrega e tempo estimado em tempo real por CEP.
  - Checkout com chave de idempotência (`idempotencyKey`) e persistência do carrinho no navegador.
- **Rastreamento de Pedidos e Painel KDS**:
  - Linha do tempo visual de progresso do pedido (`CREATED` -> `PAID` -> `PREPARING` -> `READY` -> `IN_ROUTE` -> `DELIVERED` / `CANCELED`).
  - Fila operacional KDS separada para restaurantes e entregadores avançarem o status dos pedidos.
- **Gestão de Endereços e Geocodificação**:
  - Resolução automática de endereço completo e coordenadas via CEP (`/api/v1/addresses/geocode`).
- **Tema Claro / Escuro (Dark Mode)**:
  - Alternância instantânea de tema com persistência em `localStorage`.

---

## Perfis de Acesso (RBAC)

A interface adapta menus, ações e formulários automaticamente conforme o papel (`UserRole`) do usuário autenticado:

- **`CLIENT` (Cliente)**:
  - Explora restaurantes, simula frete, monta carrinho, finaliza pedidos e acompanha **Meus Pedidos** (`/orders`).
  - Visualiza e atualiza apenas seus próprios dados e endereço em **Meu Perfil** (`/profile`).
  - Não visualiza botões administrativos de cardápio (adicionar/pausar/excluir prato) nem o Painel KDS.
- **`RESTAURANT` (Restaurante Parceiro)**:
  - Gerencia o cardápio da loja (adicionar novos pratos, pausar/ativar disponibilidade e excluir itens) e alterna status da loja (Abrir/Fechar Loja).
  - Opera o **Painel KDS** (`/kds`) para preparo e despacho de pedidos.
  - O link e banner de "Seja Parceiro" são ocultados para contas que já possuem perfil de restaurante.
- **`COURIER` (Entregador)**:
  - Acessa o **Painel KDS** (`/kds`) para acompanhamento de pedidos prontos e em rota de entrega.
  - Não visualiza ações de edição/exclusão de pratos no cardápio.
- **`ADMIN` (Administrador)**:
  - Acesso completo a todas as funcionalidades, incluindo gerenciamento de usuários cadastrados (ativar/desativar contas) e console de geocodificação/endereços em `/profile`.

---

## Estrutura do Projeto

```text
src/
├── app/
│   ├── core/
│   │   ├── interceptors/       # Interceptor HTTP JWT (Bearer Token)
│   │   ├── models/             # Interfaces TypeScript (User, Restaurant, Menu, Order, Address)
│   │   └── services/           # Serviços de comunicação com a API e estado (Auth, Cart, Order, etc.)
│   ├── features/
│   │   ├── auth/               # Login e cadastro de contas (Cliente, Restaurante, Entregador)
│   │   ├── orders/             # Meus Pedidos (/orders), Painel KDS (/kds) e Detalhes (/orders/:id)
│   │   ├── profile/            # Meu Perfil e painel administrativo de usuários/endereços
│   │   └── restaurants/        # Listagem, detalhes/cardápio e cadastro de restaurante parceiro
│   ├── layout/
│   │   └── navbar/             # Barra de navegação responsiva (Desktop + Mobile Bottom Bar)
│   └── ui/                     # Componentes Spartan UI / Helm (Button, Card, Input, Badge, Label, Tabs)
├── environments/               # Configurações de ambiente (apiUrl)
└── styles.css                  # Configuração global Tailwind CSS v4 e variáveis de tema
```

---

## Rotas da Aplicação

| Rota | Componente | Descrição | Acesso |
| :--- | :--- | :--- | :--- |
| `/restaurants` | `RestaurantListComponent` | Catálogo de restaurantes e busca por proximidade | Público |
| `/restaurants/:id` | `RestaurantDetailComponent` | Cardápio, carrinho, checkout e gestão de pratos | Público (Gestão: `RESTAURANT` / `ADMIN`) |
| `/orders` | `OrderListComponent` | Histórico de pedidos do cliente autenticado | Autenticado |
| `/kds` | `OrderListComponent` | Painel KDS para fila de cozinha e entregas | `RESTAURANT`, `COURIER`, `ADMIN` |
| `/orders/:id` | `OrderDetailComponent` | Rastreamento detalhado e linha do tempo do pedido | Autenticado |
| `/register/restaurant` | `RegisterRestaurantComponent` | Cadastro de novo restaurante parceiro | Autenticado (Oculto no menu para `RESTAURANT`) |
| `/profile` | `ProfileComponent` | Dados cadastrais do usuário (e gestão para Admin) | Autenticado |
| `/login` | `LoginComponent` | Autenticação JWT e preenchimento rápido de demonstração | Público |
| `/register/client` | `RegisterClientComponent` | Criação de nova conta na plataforma | Público |

---

## Pré-requisitos e Instalação

1. **Node.js** `>= 22.x` e **npm** `>= 11.x` instalados.
2. Backend **FoodRush API** em execução em `http://localhost:8080` (ou ajuste `src/environments/environment.ts`).

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento em http://localhost:4200
npm start
```

---

## Scripts Disponíveis

| Comando | Descrição |
| :--- | :--- |
| `npm start` | Inicia o servidor de desenvolvimento (`ng serve`) em `http://localhost:4200/` |
| `npm run build` | Gera o bundle de produção (Browser + Server SSR) em `dist/foodrush-web` |
| `npm run watch` | Compila em modo de observação com configuração de desenvolvimento |
| `npm test` | Executa os testes unitários com **Vitest** |
| `npm run serve:ssr:foodrush-web` | Inicia o servidor Node/Express SSR a partir do build de produção |

---

## Contas de Demonstração (Quick Fill)

Na tela de `/login`, você pode utilizar os atalhos de preenchimento rápido compatíveis com a seed do backend:

- **Cliente**: `cliente@foodrush.com`
- **Restaurante**: `restaurante@foodrush.com`
- **Entregador**: `entregador@foodrush.com`
- **Admin**: `admin@foodrush.com`
