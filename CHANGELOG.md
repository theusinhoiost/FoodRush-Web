# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- **Mandatory Dish Complements & Options Validation (`features/restaurants/restaurant-detail`):**
  - Added strict client-side validation for required complement groups (e.g. sauce selection in burgers), preventing items with missing mandatory choices from being added to the cart.
  - Added dynamic indicators showing fulfilled vs unfulfilled mandatory complement status.
  - Disabled "Confirmar e Adicionar à Sacola" button until all required groups satisfy minimum option thresholds.
  - Enforced `maxQuantity` ceilings, preventing excessive add-ons.
- **Cart Clearing on Logout (`core/services/auth.service`):**
  - Automatically resets cart state and clears persisted cart data in `localStorage` upon user logout.
- **Admin Navigation & KDS Workflow Hardening (`layout/navbar`, `features/orders/order-list`):**
  - Hidden irrelevant client links ("Meus Pedidos", "Seja Parceiro", cart button) for users with role `ADMIN`.
  - Replaced manual tab toggle in order list for admins with direct access to the KDS Kitchen Display System.
  - Added quick restaurant selector dropdown in the KDS panel allowing Admins to easily switch between all restaurants and monitor or advance order lifecycles.

### Added
- **Seamless Pix QR Code Auto-Generation & Dynamic Installments Selector (`features/orders/order-detail`, `features/restaurants/restaurant-detail`):**
  - Added automatic Pix QR Code generation upon navigating to order details with `method=PIX` or when switching payment tabs, eliminating manual button clicks.
  - Added loading indicator spinner during Mercado Pago Pix generation with immediate fallback error display.
  - Implemented dynamic 1x to 12x installment calculation and selector dropdown in the cart drawer on `/restaurants/:id` when "Cartão de Crédito" is selected.
  - Replaced static card installment options on `/orders/:id` with dynamic 1x-12x zero-interest calculations based on actual order total, preserving the pre-selected option from the cart.

### Added
- **Mercado Pago Connect Relocated to Merchant Profile (`features/profile`, `features/restaurants/restaurant-detail`):**
  - Moved the Mercado Pago Split Payment management card from `/restaurants/:id` to `/profile`.
  - Added restaurant detection for logged-in `RESTAURANT` and `ADMIN` users to manage split connections, view commission rates, and execute 1-click test connect or OAuth flows directly from their profile.
- **Role-Based Order & Cart Restrictions (`layout/navbar`, `features/restaurants/restaurant-detail`):**
  - Restricted users with role `RESTAURANT` from placing delivery orders: hidden "Meus Pedidos" navigation links, quick cart button, "+ Adicionar à Sacola" buttons, and cart drawer on `/restaurants/:id`.
  - Expanded menu catalog to full width for restaurant owners viewing their dishes.
- **KDS Kitchen Display System Exclusivity & Scoping (`core/guards/kds.guard`, `features/orders/order-list`, `layout/navbar`):**
  - Restricted KDS access exclusively to `RESTAURANT` and `ADMIN` roles, adding `kdsGuard` route protection.
  - Automatically filters KDS view to orders for the logged-in restaurant owner's restaurant ID.
  - Hidden client order tabs from the KDS screen for restaurant owners.
- **Human-Friendly Client Registration Submit Button (`features/auth/register-client`):**
  - Replaced internal enum text `"Finalizar Cadastro como CLIENT"` with user-friendly `"Cadastrar como Cliente / Restaurante / Entregador"`.

### Added
- **Restaurant Mercado Pago Split Management Card (`features/restaurants/restaurant-detail`):**
  - Added dedicated Split Payment management card visible to restaurant owners and admins on `/restaurants/:id`.
  - Added real-time connection status display (Active vs Pending) and FoodRush commission percentage rate.
  - Added **"Ativar Modo Teste (1 Clique)"** button allowing instant attachment of test collector accounts in sandbox without leaving the platform.
  - Added official OAuth Connect and Disconnect buttons with responsive feedback toasts.
  - Updated `RestaurantResponse` model with `commissionRate`, `mpConnected`, and `mpCollectorId`.

### Added
- **Superadmin Management Dashboard (`features/admin/admin-dashboard`, `core/guards/admin.guard`, `core/services/admin.service`):**
  - Added dedicated `/admin` route protected by `adminGuard` for users with role `ADMIN`.
  - Added real-time financial metrics dashboard: Gross Merchandise Value (GMV), FoodRush Split Platform Fees retained, restaurant count, and customer metrics.
  - Added Restaurant & Split Management tab with live commission percentage editing (default 10.00%) and Mercado Pago Connect status indicators.
  - Added Customer & User Management tab with role filtering, search, and instant activation/blocking toggles.
  - Added prominent Superadmin navigation pills in `NavbarComponent` (desktop and mobile) and quick shortcut in `ProfileComponent`.
- **Mercado Pago Connect OAuth Integration (`core/services/payment.service`):**
  - Added OAuth helper methods for restaurant partner account authorization, connection callback, and disconnection.

### Added
- **Interactive Payment Method Selector in Shopping Cart Drawer (`features/restaurants/restaurant-detail`, `features/orders/order-detail`):**
  - Added interactive payment method toggle in the cart drawer allowing customers to choose between Pix and Credit Card before order confirmation.
  - Automatically forwards the customer's selection via query parameter (`?method=CREDIT_CARD` or `?method=PIX`) to `/orders/:id`, pre-opening the chosen checkout tab.

### Added
- **Mercado Pago Checkout Transparente (Credit Card & Pix Dual Tabs):**
  - Integrated Mercado Pago JS SDK v2 for client-side card tokenization (`createCardToken`).
  - Added Credit Card payment form with cardholder, expiration, CVV, CPF, and installments selection (1x to 6x).
  - Added tab selector in `OrderDetailComponent` to switch seamlessly between Pix and Credit Card payments.
  - Added `createCardPayment` and `getPaymentConfig` in `PaymentService`.
- **Mercado Pago Checkout Transparente (Pix) Integration:**
  - Added `PaymentService` (`core/services/payment.service.ts`) with `createPixPayment` and `getPaymentByOrderId` methods.
  - Added `PaymentResponse`, `PaymentMethod`, and `PaymentStatus` contracts in `core/models/payment.models.ts`.
  - Added Pix payment card in `OrderDetailComponent` (`/orders/:id`) with:
    - Base64 QR Code visualization.
    - One-click "Pix Copia e Cola" clipboard copy with feedback toast.
    - Real-time polling check while status is `CREATED` to automatically detect webhook confirmation.
    - Visual indicators for Pix payment approval (`PAID` status badge).
  - Added Pix payment method indicator in the shopping cart checkout drawer (`RestaurantDetailComponent`).
  - Registered `lucideQrCode` and `lucideCopy` icons in `app.config.ts`.
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

