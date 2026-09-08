# 💧 Local Water Delivery Business PWA (Master White-Label Copy)

A production-ready, mobile-first Progressive Web App (PWA) built specifically for local bottled-water delivery suppliers in Pakistan (Islamabad, Rawalpindi, Lahore, Karachi, Peshawar, etc.).

This application is architected as a **clean, single-tenant master application**. Each client receives their own standalone codebase copy, their own independent Supabase database, and their own isolated deployment.

---

## 🌟 Core Architecture & Capabilities

- **Mobile-First Consumer Experience**:
  - 1-tap **ORDER REFILL** primary action.
  - One-time address & GPS delivery pin capture (customers never retype their address).
  - Live 5-stage visual delivery tracker (`Order Placed` → `Confirmed` → `Driver Assigned` → `Out on Road` → `Delivered`).
  - Cash on Delivery (COD) payment flow.
  - Recurring delivery subscriptions (Daily, Every 2 Days, Every 3 Days, Weekly).
  - **Skip Dates feature**: Customers traveling can skip delivery dates (e.g., 10–16 Sept) without sending WhatsApp messages (*"bhai kal pani na bhejna"*).
  - 1-tap "Order Again" from past delivery history.

- **Dedicated Driver Portal (`/driver`)**:
  - Route metrics: Today's Total, Completed, Remaining, Failed stops.
  - **"NAVIGATE"** button launches turn-by-turn Google Maps directions straight to the customer's coordinates.
  - Client-side **"Optimize Route"** nearest-neighbor TSP sorter.
  - Direct Phone call (`tel:`) and WhatsApp chat (`wa.me`) shortcuts.
  - **"Complete Delivery"** modal: records delivered bottles, returned empties, and payment collection.
  - **"Report Delivery Failure"** modal: customer unavailable, wrong address, cancelled, or custom note.
  - Strict privacy: drivers can only view stops assigned to them.

- **Owner / Dispatcher Command Center (`/admin`)**:
  - Actionable operations dashboard: today's volume, pending orders, completed deliveries, and COD collected vs. expected.
  - Order Management table: live search, date filters, status dropdown, driver assign/reassign modal.
  - Customer directory with address & GPS pin inspection.
  - Driver management with workload tracking and activation toggle.
  - Product & Pricing Catalog: real-time database updates for bottle sizes and prices in Rs.
  - Delivery Time Slots & Capacity Management.

- **PWA Capabilities**:
  - Non-intrusive "Add to Home Screen" prompt with dismissal caching.
  - App shell caching via Service Worker (`public/sw.js`).
  - Offline/low-connectivity banner with double-submit protection.

---

## 🔐 Security Architecture

1. **Zero Secret Leaks**:
   - Only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are exposed to the frontend.
   - The Supabase `service_role` key and database passwords are **NEVER** stored in frontend code or git repository.
2. **Server-Side Pricing Enforcement**:
   - Orders are created via the PostgreSQL security definer RPC function: `public.create_customer_order()`.
   - The frontend never determines prices or totals. Product prices are resolved directly from the `products` table in a single atomic transaction.
3. **Row Level Security (RLS)**:
   - Enabled across all tables (`profiles`, `products`, `delivery_slots`, `orders`, `order_items`, `subscriptions`, `subscription_skips`, `delivery_status_history`, `business_settings`).
   - Customers can only read and manage their own orders, subscriptions, and profile.
   - Drivers can only read and update deliveries explicitly assigned to their driver ID.
   - Admins have full operational permissions verified via `public.get_user_role(auth.uid())`.

---

## 🚀 NEW CLIENT SETUP

Follow these steps to duplicate the master application for a new water delivery client:

### 1. Copy the Master Project
```bash
# Clone or copy the master project folder
cp -r "Water App" "ClientName Water App"
cd "ClientName Water App"
```

### 2. Create a New GitHub Repository
```bash
git init
git add .
git commit -m "feat: initial client white-label setup"
git remote add origin https://github.com/your-username/clientname-water-app.git
git push -u origin main
```

### 3. Create a New Supabase Project
1. Log into your [Supabase Dashboard](https://supabase.com).
2. Click **New Project**.
3. Name the project (e.g. `ClientName Water`).
4. Select the region closest to your client (e.g., `ap-south-1` Mumbai or `ap-southeast-1` Singapore).
5. Generate a secure database password and save it securely in your password manager.

### 4. Run the Database Migrations
1. In the Supabase Dashboard, go to **SQL Editor**.
2. Open the file `supabase/migrations/001_initial_schema.sql` from your project.
3. Paste the entire SQL script into the SQL Editor and click **Run**.
4. All tables, triggers, RLS policies, default products, and time slots will be created instantly.

### 5. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Update `.env` with the client's Supabase credentials (found in Supabase Dashboard -> **Project Settings** -> **API**):
```env
VITE_SUPABASE_URL=https://<client-project-id>.supabase.co
VITE_SUPABASE_ANON_KEY=<client-anon-key>
```

### 6. Change Company Branding
Open the centralized configuration file:
```
src/config/business.ts
```
Update all brand details in this single file:
- `companyName`: e.g. `"AquaPure Islamabad"`
- `shortName`: e.g. `"AquaPure"`
- `slogan`: e.g. `"100% Pure Natural Mineral Water"`
- `phone`: Client's customer support phone (e.g. `"+92 300 1234567"`)
- `whatsappNumber`: Client's WhatsApp digits (e.g. `"923001234567"`)
- `businessAddress`: Client's warehouse or plant address
- `city`: e.g. `"Islamabad & Rawalpindi"`
- `colors`: primary, secondary, and accent hex values
- Replace `public/logo.svg` with the client's vector logo if provided.

### 7. Configure Products and Prices
You can customize products either:
- Directly in the Supabase SQL Editor / Table Editor (`products` table), or
- Through the Owner Dashboard (`/admin` -> **Products & Prices** tab).

Default items:
- 19L Refill — Rs. 150
- 12L Refill — Rs. 110
- 6L Bottle (Pack of 2) — Rs. 70
- 19L New Bottle + Water (Deposit) — Rs. 1,200

### 8. Configure Delivery Slots
Customize delivery slots in the Owner Dashboard (`/admin` -> **Delivery Slots** tab) or `delivery_slots` table:
- Morning (09:00 AM – 12:00 PM)
- Afternoon (12:00 PM – 03:00 PM)
- Evening (03:00 PM – 06:00 PM)
- Night (06:00 PM – 09:00 PM)

### 9. Create the Owner Account
Run the helper seed script to create the client's owner account:
```bash
node scripts/seed_admin.js "owner@clientname.com" "SecurePassword123!" "Owner Name" "03001234567"
```
Or register an account at `/register` and set `role = 'admin'` in the `profiles` table in Supabase.

### 10. Deploy the Application
Deploy to Vercel, Netlify, or Cloudflare Pages:
```bash
# Example with Vercel CLI
npx vercel
```
In the hosting dashboard, add the environment variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### 11. Connect a Custom Domain
1. In your hosting platform (e.g. Vercel), navigate to **Domains**.
2. Add the client's domain (e.g. `order.aquapure.pk` or `aquapurewater.pk`).
3. Add the DNS CNAME/A records at the domain registrar.
4. SSL/TLS is provisioned automatically.

### 12. Hand the Project Over
Provide the client with:
1. The deployed URL (and custom domain).
2. Owner Login credentials (`owner@clientname.com`).
3. 2-minute walkthrough showing:
   - How incoming refill orders appear on the dashboard.
   - How to assign a driver.
   - How drivers use the `/driver` portal on their phones to navigate and complete orders.

---

## 📱 Local Development

```bash
# Install dependencies
npm install

# Start Vite dev server
npm run dev

# Run production build
npm run build
```

---

## 🛡️ Security Audit Checklist

- [x] No server-role keys or database passwords in frontend code.
- [x] `.env.example` provided; real `.env` excluded from version control.
- [x] Supabase Row Level Security (RLS) enabled on all 9 tables.
- [x] Server-side price calculation enforced via database RPC `create_customer_order`.
- [x] Role-based isolation tested: Customer (`customer`), Driver (`driver`), Owner (`admin`).
- [x] Geolocation API handles single-pin permission without aggressive reprompts.
- [x] Double-submit prevention on order confirmation buttons.
- [x] Production build tested and verified with zero TypeScript or bundling errors.
