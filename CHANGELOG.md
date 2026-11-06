# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Dedicated `/kds` route for the Kitchen Display System (KDS) and delivery queue management.
- Automatic `ownerId` resolution from the authenticated user session when registering a partner restaurant.
- Automatic customer order loading in `/orders` using the authenticated user's ID without requiring manual UUID input.
- Direct KDS shortcut banner on the restaurant listing page when logged in with a `RESTAURANT` account.

### Changed
- Separated **Meus Pedidos** (`/orders`) and **Painel KDS** (`/kds`) in the navigation bar (desktop and mobile) and page views.
- Restricted dish management actions (**Adicionar Prato ao Cardápio**, **Pausar/Ativar**, and **Excluir**) in `RestaurantDetailComponent` to `RESTAURANT` and `ADMIN` roles only, hiding them from `CLIENT` and `COURIER`.
- Restricted store open/close toggle (**Abrir Loja / Fechar Loja**) in `RestaurantListComponent` to `RESTAURANT` and `ADMIN` roles.
- Restricted the registered users list (**Usuários Cadastrados**) and standalone geocoding/address management tabs in `/profile` strictly to `ADMIN` users, centering the personal profile card for regular users.
- Hidden the **Seja Parceiro** navigation link and registration call-to-action banner for users already authenticated with the `RESTAURANT` role.
- Restricted order status advancement buttons to KDS mode so customers viewing their order history cannot trigger kitchen/delivery transitions.

### Removed
- Visible `ID do Proprietário (UUID)` input field for regular users on `/register/restaurant` (kept available only for `ADMIN`).
- Visible `ID do Cliente` search input bar for regular customers on `/orders` (kept available only as an admin filter).

## [0.2.0] - 2026-11-05

### Added
- `AddressService` integration with standardized `/api/v1/addresses` and `/api/v1/addresses/geocode` endpoints.
- Address formatting utilities (`getFormattedAddress`) and external map links for **Google Maps** (`getGoogleMapsUrl`) and **OpenStreetMap** (`getOpenStreetMapUrl`).
- Live CEP + number geocoding preview across restaurant registration, proximity search, and user profile forms.

### Changed
- Updated proximity search (**Perto de Mim**) on the restaurant catalog to resolve CEP coordinates before querying nearby stores.

## [0.1.0] - 2026-11-03

### Added
- Initial Angular 22 application setup with Server-Side Rendering (SSR), Tailwind CSS v4, Spartan UI (Helm/Brain), and Lucide icons.
- JWT authentication flow (`/login`, `/register/client`) with `authInterceptor`, token refresh support, and seed fallback profiles.
- Restaurant catalog (`/restaurants`), restaurant menu detail & shopping cart (`/restaurants/:id`), order tracking (`/orders`, `/orders/:id`), partner restaurant registration (`/register/restaurant`), and user profile (`/profile`).

