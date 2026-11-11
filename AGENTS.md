# AGENTS.md

Diretrizes arquiteturais, convenções de código e regras de negócio para agentes de IA que atuam no repositório **foodrush-web**.

---

## 1. Visão Geral do Projeto

- **Nome**: `foodrush-web`
- **Propósito**: Frontend web da plataforma FoodRush de delivery de comida.
- **Stack Principal**:
  - **Angular 22** (`@angular/core ^22.2.0`) com **Standalone Components**, **Signals** (`signal`, `computed`) e **Control Flow nativo** (`@if`, `@for`, `@switch`).
  - **SSR**: `@angular/ssr` com Express.
  - **Estilização**: **Tailwind CSS v4** (`@tailwindcss/postcss`) + **Spartan UI / Helm** (`src/app/ui/*`).
  - **Ícones**: `@ng-icons/core` e `@ng-icons/lucide` (registrados globalmente em `src/app/app.config.ts`).
  - **Testes**: **Vitest** (`ng test --watch=false`).
- **API Backend**: Configurada em `src/environments/environment.ts` (`http://localhost:8080/api/v1`).

---

## 2. Comandos Essenciais

Sempre valide alterações executando build e testes antes de concluir uma tarefa:

```bash
# Compilar o projeto (verifica templates Angular, tipos TypeScript e prerendering SSR)
npm run build

# Executar suíte de testes unitários em modo não-interativo
npm test -- --watch=false

# Servidor de desenvolvimento local
npm start
```

---

## 3. Arquitetura e Organização de Pastas

- `src/app/core/models/`: Contratos e interfaces TypeScript espelhando os DTOs do backend (`UserResponse`, `RestaurantResponse`, `MenuItemResponse`, `OrderResponse`, `AddressResponse`, `ProblemDetail`). Exporte novos modelos em `src/app/core/models/index.ts`.
- `src/app/core/services/`: Serviços singleton (`providedIn: 'root'`) responsáveis por chamadas HTTP e gerenciamento de estado reativo (`AuthService`, `CartService`, `RestaurantService`, `MenuService`, `OrderService`, `AddressService`, `UserService`).
- `src/app/core/interceptors/`: `authInterceptor` que anexa `Authorization: Bearer <token>` nas requisições para a API.
- `src/app/features/`: Componentes de página divididos por domínio (`auth`, `restaurants`, `orders`, `profile`) e carregados via lazy loading (`loadComponent`) em `src/app/app.routes.ts`.
- `src/app/layout/navbar/`: Barra de navegação responsiva (`NavbarComponent`).
- `src/app/ui/`: Diretivas e componentes visuais Spartan UI / Helm (`HlmButtonImports`, `HlmCardImports`, `HlmInputImports`, `HlmLabelImports`, `HlmBadgeImports`, `HlmTabsImports`).

---

## 4. Convenções de Código e Padrões Angular

1. **Standalone e Injeção de Dependências**:
   - Todos os componentes são standalone.
   - Utilize `inject()` ao invés de `constructor()` para injeção de serviços (`FormBuilder`, `Router`, `ActivatedRoute`, `AuthService`, etc.).
2. **Reatividade com Signals**:
   - Prefira `signal()` para estado local de componentes e `computed()` para estado derivado e permissões de UI (ex.: `canManageMenu`, `isAdmin`, `canAccessKds`).
   - Utilize o novo bloco de controle de template do Angular (`@if`, `@else`, `@for (...; track ...)`). Não utilize `*ngIf` ou `*ngFor`.
3. **Compatibilidade com SSR**:
   - Nunca acesse `window`, `document` ou `localStorage` diretamente sem antes verificar `isPlatformBrowser(inject(PLATFORM_ID))`.
4. **Ícones (`@ng-icons/lucide`)**:
   - Quando adicionar um novo ícone `<ng-icon name="lucide..." />` em qualquer template, verifique se ele está importado e registrado em `provideIcons({...})` dentro de `src/app/app.config.ts`.
5. **Formulários e IDs Automáticos**:
   - Não exponha campos de `UUID` (como `ownerId` ou `customerId`) para usuários finais (`CLIENT`, `RESTAURANT`, `COURIER`). Obtenha o identificador automaticamente de `authService.currentUser()?.id`. Campos de filtro/impersonação por UUID devem ser restritos a `isAdmin()`.

---

## 5. Regras de Controle de Acesso por Perfil (RBAC)

O tipo `UserRole` possui 4 valores: `'CLIENT' | 'RESTAURANT' | 'COURIER' | 'ADMIN'`. Respeite rigorosamente a visibilidade de funcionalidades para cada perfil:

| Funcionalidade / Elemento de UI | `CLIENT` | `COURIER` | `RESTAURANT` | `ADMIN` |
| :--- | :---: | :---: | :---: | :---: |
| Explorar restaurantes, ver cardápio e comprar | Sim | Sim | Sim | Sim |
| Adicionar, pausar/ativar ou excluir prato do cardápio | **Não** | **Não** | **Sim** | **Sim** |
| Abrir / Fechar loja na listagem de restaurantes | **Não** | **Não** | **Sim** | **Sim** |
| Ver link/banner "Seja Parceiro" (`/register/restaurant`) | Sim | Sim | **Não** | Sim |
| Acessar "Meus Pedidos" (`/orders`) | Sim | Sim | Sim | Sim |
| Acessar "Painel KDS" (`/kds`) e avançar status de pedido | **Não** | **Sim** | **Sim** | **Sim** |
| Editar próprio perfil e endereço principal (`/profile`) | Sim | Sim | Sim | Sim |
| Ver lista de "Usuários Cadastrados" e console de endereços em `/profile` | **Não** | **Não** | **Não** | **Sim** |

---

## 6. Tratamento de Erros da API

- O backend retorna erros no padrão **RFC 7807 (`ProblemDetail`)** definido em `src/app/core/models/api-error.models.ts` (`title`, `detail`, `status`, `invalidParameters`).
- Sempre extraia `err.error?.detail` (ou `invalidParameters`) ao exibir mensagens de erro amigáveis na interface.

