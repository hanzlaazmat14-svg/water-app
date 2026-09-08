# Implementation Plan — Local Water Delivery Business PWA (Master White-Label Copy)

Build a complete, production-ready, mobile-first Progressive Web App (PWA) for a local bottled-water delivery business in Pakistan. The application is architected as a clean, single-tenant master copy that can be duplicated, re-branded via a single centralized configuration file (`src/config/business.ts`), connected to an independent Supabase project, and deployed for each client.

---

## User Review Required

> [!IMPORTANT]
> **Supabase Project Selection:**
> We detected an existing active Supabase project in your environment (`knywumwbvwawvykxregm` — "hanzlaazmat14@gmail.com's Project").
> Would you like us to deploy the database migrations directly into this project for development, or will you provide/create a fresh dedicated Supabase project?
> *(Note: The migration script is completely non-destructive and creates dedicated tables like `profiles`, `products`, `orders`, etc., but having a dedicated project is ideal for a clean master template).*

> [!IMPORTANT]
> **Node.js Environment on Development Machine:**
> Node.js/npm is not currently in the system `PATH` on your machine. During execution, we will need Node.js to install dependencies (`npm install`) and run the Vite development server (`npm run dev`). We can install Node.js LTS via `winget` (`winget install OpenJS.NodeJS.LTS --silent --accept-source-agreements --accept-package-agreements`), or you can install Node.js from https://nodejs.org. Please confirm if you would like us to install it via `winget`.

---

## Open Questions

1. **Authentication Mode for Pakistan Market:**
   For local customers in Pakistan, would you prefer:
   - **Option A (Recommended):** Email + Password with quick signup (asking Full Name, Phone Number, Home Address & GPS Coordinates upon registration).
   - **Option B:** Phone Number + Password (standard Supabase Auth setup).
2. **Initial Product Catalog:**
   Our default starter catalog includes:
   - 19L Refill (Rs. 150)
   - 12L Refill (Rs. 110)
   - 6L Bottle (Rs. 70)
   - 19L New Bottle + Water (Initial Deposit) (Rs. 1,200)
   Are there any custom bottle types or starting prices you would like included initially?

---

## Proposed Architecture & Design

### 1. Centralized White-Label Configuration (`src/config/business.ts`)
Everything company-specific lives in ONE obvious file:
- Company name, slogan, logo URL, favicon
- Currency symbol (`Rs.`), ISO code (`PKR`)
- Support contact: Phone number, WhatsApp number, Email
- Physical address & coverage area (e.g. Islamabad/Rawalpindi)
- Delivery fee default (e.g. Rs. 0 / Free)
- Brand color palette tokens (CSS custom properties bound dynamically)
- Operating hours & delivery time slots default

### 2. Database Schema & Security (`supabase/migrations/001_initial_schema.sql`)
- **Tables**:
  - `profiles`: Linked to `auth.users`, stores `role` (`'customer' | 'driver' | 'admin'`), `full_name`, `phone`, `address`, `latitude`, `longitude`, `delivery_instructions`.
  - `products`: Name, bottle size, price, image URL, availability status, display order.
  - `delivery_slots`: Slot name, start time, end time, max daily capacity, active status.
  - `orders`: Reference to customer and driver, status lifecycle (`pending` → `confirmed` → `assigned` → `out_for_delivery` → `delivered` / `failed` / `cancelled`), delivery date, slot, address, GPS coords, subtotal, delivery fee, total, COD payment status, bottles delivered, empties returned, failure reason.
  - `order_items`: Line items with product name, quantity, unit price, total.
  - `subscriptions`: Recurring deliveries (`daily`, `every_2_days`, `every_3_days`, `weekly`), quantity, slot, status (`active`, `paused`, `cancelled`), next delivery date.
  - `subscription_skips`: Skip date intervals (`start_date`, `end_date`, `reason`) so customers can pause when away.
  - `delivery_status_history`: Audit trail for state transitions.
- **Server-Side Pricing Security (Database RPC)**:
  - Stored procedure `create_customer_order(p_items jsonb, p_delivery_date date, p_slot_id uuid, p_instructions text)`:
    - Never trusts prices sent by client browser.
    - Resolves each `product_id` against the `products` table to fetch true server-side price.
    - Computes `subtotal`, checks delivery fee, and calculates `total_amount`.
    - Inserts `orders` and `order_items` in a single atomic transaction.
- **Row Level Security (RLS)**:
  - Helper function `get_user_role(auth.uid())` avoiding recursive queries.
  - Customers can read/edit only their own profile, read only their own orders/subscriptions, and create orders via the secure RPC.
  - Drivers can only read assigned orders for delivery and update delivery status/notes/returned bottles. Drivers CANNOT view business financials or other customers.
  - Admins have full access to manage orders, drivers, customers, products, and slots.

### 3. Customer Mobile-First PWA Experience
- **Home Screen**:
  - Dominant, high-contrast **"ORDER REFILL"** primary button.
  - Saved delivery address card with 1-tap edit.
  - Active delivery live status tracker (if order in progress).
  - Active subscription card with frequency and next delivery date.
  - Recent orders with 1-tap "Order Again".
- **One-Time Address & Location Setup**:
  - Customer sets address and GPS pinpoint once upon registration or profile update.
  - On every order, the saved location is used automatically without retyping.
- **Fast Order Flow**:
  - Step 1: Select Bottle (19L, 12L, etc., fetched from DB).
  - Step 2: Quantity (+ / - buttons).
  - Step 3: Date (Today, Tomorrow, Choose Date).
  - Step 4: Time Slot selection.
  - Step 5: Review summary (Product, qty, price, address, COD payment).
  - Step 6: One-tap Confirm.
- **Recurring Subscriptions & Skip Delivery**:
  - Setup recurring schedule: Daily, Every 2 Days, Every 3 Days, Weekly.
  - Pause / Resume subscription anytime.
  - **Skip Delivery**: Select dates (e.g. 10 Sept – 16 Sept) to automatically suppress deliveries without needing to message on WhatsApp.
- **PWA Capabilities**:
  - Web App Manifest + Service Worker.
  - Non-intrusive "Add to Home Screen" prompt with "Maybe Later" preference stored in `localStorage`.
  - Offline / low-connectivity awareness with friendly status banner and double-submit protection.

### 4. Driver Mobile-First Experience (`/driver`)
- Filtered specifically for the logged-in driver.
- Today's Deliveries stats: Total, Completed, Remaining, Failed.
- List of assigned stops sorted by time slot / route order with:
  - Customer name & address.
  - Direct Phone Call (`tel:`) and WhatsApp (`wa.me`) action buttons.
  - **"NAVIGATE"** button launching Google Maps directions directly with the customer's coordinates.
  - **"Optimize Route"** client-side TSP/nearest-neighbor route sorter.
  - **"Complete Delivery"** modal: input bottles delivered, empty bottles returned, optional note.
  - **"Failed Delivery"** modal: select reason (Customer unavailable, Wrong address, Customer cancelled, No response, Other) with note.

### 5. Owner / Admin Operations Dashboard (`/admin`)
- Real operational metrics:
  - Today's Orders, Pending, Assigned, Out for Delivery, Completed, Failed.
  - COD Expected vs. Collected.
  - Active Customers & Subscriptions.
- **Live Order Management**:
  - Filter by date, status, driver; search by customer name or order number.
  - Assign / reassign driver modal.
  - Update status or cancel order.
- **Customer Directory**: View profiles, saved GPS locations, full order history.
- **Driver Management**: Create driver accounts, view daily workload, toggle active/inactive status.
- **Product & Price Management**: Add/edit bottle sizes, update prices in real-time, toggle availability.
- **Delivery Slot Management**: Configure time slots and maximum daily delivery capacity.

### 6. Client Reusability Documentation (`README.md`)
- Detailed "NEW CLIENT SETUP" developer guide:
  1. Clone/copy repository.
  2. Create Supabase project & obtain API keys.
  3. Run SQL migration script.
  4. Create owner account & assign admin role.
  5. Configure `.env` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
  6. Customize `src/config/business.ts` (Name, logo, colors, phone, WhatsApp).
  7. Deploy to Vercel/Netlify.
  8. Connect client's custom domain & hand over.

---

## Proposed Changes

### Setup & Infrastructure
#### [NEW] `package.json`
Vite, React 18, TypeScript, Tailwind CSS, Lucide React, Supabase JS client.
#### [NEW] `vite.config.ts`
Vite configuration with PWA plugin support.
#### [NEW] `tailwind.config.js` & `postcss.config.js`
Tailwind setup with CSS custom property extensions for brand color theming.
#### [NEW] `.env.example`
Clear placeholders for `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
#### [NEW] `public/manifest.json` & PWA icons
Progressive Web App manifest and branding icons.

### Database
#### [NEW] `supabase/migrations/001_initial_schema.sql`
Comprehensive PostgreSQL schema with tables, RLS policies, indexing, and `create_customer_order` RPC.

### Business White-Label Configuration
#### [NEW] `src/config/business.ts`
Central branding and business settings.

### Core Utilities & Context
#### [NEW] `src/lib/supabase.ts`
Supabase client initialization.
#### [NEW] `src/lib/database.types.ts`
TypeScript definitions for all database tables, views, and functions.
#### [NEW] `src/lib/utils.ts`
Formatting for PKR currency (`Rs. 150`), dates, telephone/WhatsApp links, and GPS distance.
#### [NEW] `src/context/AuthContext.tsx`
Session management, profile fetching, role detection (`customer`, `driver`, `admin`).
#### [NEW] `src/context/ToastContext.tsx`
Friendly notification system for errors, warnings, and success feedback.

### Components
#### [NEW] `src/components/common/Navbar.tsx` & `BottomNav.tsx`
Responsive navigation with role-specific views.
#### [NEW] `src/components/common/PWAInstallPrompt.tsx`
Polite "Add to Home Screen" prompt with dismissal caching.
#### [NEW] `src/components/common/NetworkStatusBanner.tsx`
Connectivity warning for weak connections.
#### [NEW] `src/components/customer/OrderRefillModal.tsx`
6-step streamlined refill ordering flow.
#### [NEW] `src/components/customer/AddressCard.tsx`
Saved delivery location card with GPS coordinates indicator.
#### [NEW] `src/components/customer/ActiveOrderTracker.tsx`
Real-time step-by-step order lifecycle progress bar.
#### [NEW] `src/components/customer/SubscriptionCard.tsx` & `SkipDeliveryModal.tsx`
Recurring schedule management and vacation skip tool.
#### [NEW] `src/components/driver/DeliveryCard.tsx`
Driver stop card with navigation, calling, and completion/failure triggers.
#### [NEW] `src/components/driver/CompleteDeliveryModal.tsx` & `FailDeliveryModal.tsx`
Quick delivery completion and failure reason recording.
#### [NEW] `src/components/admin/AdminOrdersTable.tsx` & `AssignDriverModal.tsx`
Operational dispatch table and driver assignment.
#### [NEW] `src/components/admin/ProductManager.tsx` & `SlotManager.tsx`
Live catalog price management and slot capacity editor.

### Pages & Routing
#### [NEW] `src/pages/auth/Login.tsx` & `Register.tsx`
Customer and staff authentication with phone and address capture.
#### [NEW] `src/pages/customer/CustomerHome.tsx` & `CustomerOrders.tsx`
Mobile-first customer home and order history.
#### [NEW] `src/pages/driver/DriverDashboard.tsx`
Dedicated mobile driver route and dispatch view.
#### [NEW] `src/pages/admin/AdminDashboard.tsx`
Owner operations dashboard.
#### [NEW] `src/App.tsx`
Role-based routing and layout wrapper.

### Documentation
#### [NEW] `README.md`
Master white-label guide, architecture overview, and the required "NEW CLIENT SETUP" workflow.

---

## Verification Plan

### Automated Build & Lint Verification
- Run `npm run build` to ensure all TypeScript types, React components, and Tailwind styles compile with zero errors.
- Validate that no hardcoded secret keys exist in the frontend build bundle.

### Manual & Flow Verification
1. **Customer Flow**:
   - Register a customer account with address and location.
   - Click "Order Refill", select 19L bottle, quantity 2, choose tomorrow's slot, review total, and confirm order.
   - Check that the order appears on the customer home with "Order Placed" status.
   - Test "Order Again" button from order history.
   - Test recurring subscription creation, pausing, and date skipping (e.g. skip 10–16 Sept).
2. **Owner / Admin Flow**:
   - Log in as admin.
   - Verify operational stats update (Today's Orders, COD Expected).
   - Assign the pending order to a driver.
   - Update product prices in Product Manager and verify the customer order modal reflects new prices instantly.
3. **Driver Flow**:
   - Log in as driver.
   - Verify only assigned deliveries are visible.
   - Test "NAVIGATE" external map link.
   - Test "Complete Delivery" with bottles delivered and empties returned.
   - Test "Failed Delivery" with reason and note.
4. **Security & Boundaries**:
   - Verify customers cannot access `/admin` or `/driver`.
   - Verify drivers cannot see financial summary or unassigned customers.
   - Verify order total is calculated in database RPC (`create_customer_order`) rather than trusting client inputs.
5. **PWA & Mobile Responsiveness**:
   - Verify mobile viewport layout (375px / 414px) and desktop layout.
   - Test PWA install banner appearance and "Maybe Later" dismissal behavior.
