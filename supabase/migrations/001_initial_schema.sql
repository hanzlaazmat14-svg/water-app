-- 001_initial_schema.sql
-- Master Supabase Schema for Local Water Delivery Business App

-- 1. Create custom types and extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Profiles Table (Customer, Driver, Admin)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'driver', 'admin')),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  delivery_instructions TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Products Table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  bottle_size TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  image_url TEXT,
  description TEXT,
  is_available BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Delivery Slots Table
CREATE TABLE IF NOT EXISTS public.delivery_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  max_capacity INT DEFAULT 50,
  is_active BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number BIGINT GENERATED ALWAYS AS IDENTITY,
  customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assigned_driver_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'assigned', 'out_for_delivery', 'delivered', 'failed', 'cancelled')),
  delivery_date DATE NOT NULL,
  delivery_slot_id UUID REFERENCES public.delivery_slots(id) ON DELETE SET NULL,
  delivery_address TEXT NOT NULL,
  delivery_latitude DOUBLE PRECISION,
  delivery_longitude DOUBLE PRECISION,
  delivery_instructions TEXT,
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  delivery_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'cash_on_delivery',
  payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'refunded')),
  bottles_delivered INT DEFAULT 0,
  empty_bottles_returned INT DEFAULT 0,
  failure_reason TEXT,
  driver_notes TEXT,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Order Items Table
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  product_name TEXT NOT NULL,
  bottle_size TEXT NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
  total_price NUMERIC(10,2) NOT NULL CHECK (total_price >= 0),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Subscriptions (Recurring Delivery)
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'every_2_days', 'every_3_days', 'weekly')),
  delivery_slot_id UUID REFERENCES public.delivery_slots(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled')),
  next_delivery_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Subscription Skips (Vacation / Skip Dates)
CREATE TABLE IF NOT EXISTS public.subscription_skips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Delivery Status History (Audit Trail)
CREATE TABLE IF NOT EXISTS public.delivery_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  notes TEXT,
  changed_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. Business Settings Table
CREATE TABLE IF NOT EXISTS public.business_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  delivery_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  free_delivery_threshold NUMERIC(10,2) DEFAULT 0,
  min_order_amount NUMERIC(10,2) DEFAULT 0,
  announcement_text TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default settings if missing
INSERT INTO public.business_settings (id, delivery_fee, free_delivery_threshold, min_order_amount)
VALUES ('default', 0.00, 0.00, 0.00)
ON CONFLICT (id) DO NOTHING;

-- Seed Default Products
INSERT INTO public.products (name, bottle_size, price, description, is_available, display_order)
VALUES
  ('19L Refill', '19 Litres', 150.00, 'Standard 19-litre multi-stage purified water refill for home & office dispensers.', true, 1),
  ('12L Refill', '12 Litres', 110.00, 'Convenient 12-litre medium bottle refill, easy to handle and carry.', true, 2),
  ('6L Bottle (Pack of 2)', '6 Litres', 70.00, 'Compact 6-litre bottles, ideal for dining tables and refrigerator storage.', true, 3),
  ('19L New Bottle + Water', '19 Litres', 1200.00, 'Brand new high-grade food-safe polycarbonate 19L bottle with fresh mineral water (First-time deposit).', true, 4)
ON CONFLICT DO NOTHING;

-- Seed Default Delivery Slots
INSERT INTO public.delivery_slots (name, start_time, end_time, max_capacity, is_active, display_order)
VALUES
  ('Morning (09:00 AM – 12:00 PM)', '09:00', '12:00', 50, true, 1),
  ('Afternoon (12:00 PM – 03:00 PM)', '12:00', '15:00', 50, true, 2),
  ('Evening (03:00 PM – 06:00 PM)', '15:00', '18:00', 50, true, 3),
  ('Night (06:00 PM – 09:00 PM)', '18:00', '21:00', 50, true, 4)
ON CONFLICT DO NOTHING;

-- Indexes for high performance
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_driver_id ON public.orders(assigned_driver_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_date ON public.orders(delivery_date);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_customer_id ON public.subscriptions(customer_id);

-- 11. Security Helper Function
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.profiles WHERE id = user_id;
$$;

-- 12. Trigger for New User Profile Creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    role,
    full_name,
    phone,
    address,
    latitude,
    longitude,
    delivery_instructions
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Valued Customer'),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    NEW.raw_user_meta_data->>'address',
    (NEW.raw_user_meta_data->>'latitude')::DOUBLE PRECISION,
    (NEW.raw_user_meta_data->>'longitude')::DOUBLE PRECISION,
    NEW.raw_user_meta_data->>'delivery_instructions'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone = CASE WHEN EXCLUDED.phone <> '' THEN EXCLUDED.phone ELSE profiles.phone END,
    address = COALESCE(EXCLUDED.address, profiles.address),
    latitude = COALESCE(EXCLUDED.latitude, profiles.latitude),
    longitude = COALESCE(EXCLUDED.longitude, profiles.longitude);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 13. Server-Side Secure Order Creation Function
CREATE OR REPLACE FUNCTION public.create_customer_order(
  p_items JSONB,
  p_delivery_date DATE,
  p_slot_id UUID,
  p_instructions TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_profile RECORD;
  v_order_id UUID;
  v_order_number BIGINT;
  v_subtotal NUMERIC(10,2) := 0;
  v_delivery_fee NUMERIC(10,2) := 0;
  v_total NUMERIC(10,2) := 0;
  v_item JSONB;
  v_product RECORD;
  v_qty INT;
  v_line_total NUMERIC(10,2);
  v_settings RECORD;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to place an order.';
  END IF;

  SELECT * INTO v_profile FROM profiles WHERE id = v_user_id;
  IF v_profile IS NULL OR v_profile.address IS NULL OR trim(v_profile.address) = '' THEN
    RAISE EXCEPTION 'Please save a delivery address in your profile before placing an order.';
  END IF;

  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Order must contain at least one item.';
  END IF;

  SELECT * INTO v_settings FROM business_settings WHERE id = 'default';
  IF FOUND AND v_settings.delivery_fee > 0 THEN
    v_delivery_fee := v_settings.delivery_fee;
  END IF;

  IF p_delivery_date < CURRENT_DATE THEN
    RAISE EXCEPTION 'Delivery date cannot be in the past.';
  END IF;

  INSERT INTO orders (
    customer_id,
    status,
    delivery_date,
    delivery_slot_id,
    delivery_address,
    delivery_latitude,
    delivery_longitude,
    delivery_instructions,
    subtotal,
    delivery_fee,
    total_amount,
    payment_method,
    payment_status
  ) VALUES (
    v_user_id,
    'pending',
    p_delivery_date,
    p_slot_id,
    v_profile.address,
    v_profile.latitude,
    v_profile.longitude,
    COALESCE(p_instructions, v_profile.delivery_instructions),
    0,
    v_delivery_fee,
    0,
    'cash_on_delivery',
    'unpaid'
  ) RETURNING id, order_number INTO v_order_id, v_order_number;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_qty := (v_item->>'quantity')::INT;
    IF v_qty IS NULL OR v_qty <= 0 THEN
      RAISE EXCEPTION 'Invalid quantity specified for item.';
    END IF;

    SELECT * INTO v_product FROM products WHERE id = (v_item->>'product_id')::UUID AND is_available = true;
    IF v_product IS NULL THEN
      RAISE EXCEPTION 'Selected product is currently unavailable.';
    END IF;

    v_line_total := v_product.price * v_qty;
    v_subtotal := v_subtotal + v_line_total;

    INSERT INTO order_items (
      order_id,
      product_id,
      product_name,
      bottle_size,
      quantity,
      unit_price,
      total_price
    ) VALUES (
      v_order_id,
      v_product.id,
      v_product.name,
      v_product.bottle_size,
      v_qty,
      v_product.price,
      v_line_total
    );
  END LOOP;

  v_total := v_subtotal + v_delivery_fee;

  UPDATE orders
  SET subtotal = v_subtotal,
      total_amount = v_total
  WHERE id = v_order_id;

  INSERT INTO delivery_status_history (order_id, status, notes, changed_by)
  VALUES (v_order_id, 'pending', 'Order placed by customer via Cash on Delivery', v_user_id);

  RETURN jsonb_build_object(
    'order_id', v_order_id,
    'order_number', v_order_number,
    'subtotal', v_subtotal,
    'delivery_fee', v_delivery_fee,
    'total_amount', v_total,
    'status', 'pending'
  );
END;
$$;

-- 14. Enable Row Level Security (RLS) on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_skips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;

-- 15. RLS Policies

-- PROFILES:
DROP POLICY IF EXISTS "Profiles read policy" ON public.profiles;
CREATE POLICY "Profiles read policy" ON public.profiles
  FOR SELECT USING (
    auth.uid() = id OR public.get_user_role(auth.uid()) IN ('admin', 'driver')
  );

DROP POLICY IF EXISTS "Profiles update policy" ON public.profiles;
CREATE POLICY "Profiles update policy" ON public.profiles
  FOR UPDATE USING (
    auth.uid() = id OR public.get_user_role(auth.uid()) = 'admin'
  );

DROP POLICY IF EXISTS "Profiles insert policy" ON public.profiles;
CREATE POLICY "Profiles insert policy" ON public.profiles
  FOR INSERT WITH CHECK (
    auth.uid() = id OR public.get_user_role(auth.uid()) = 'admin'
  );

-- PRODUCTS:
DROP POLICY IF EXISTS "Products read policy" ON public.products;
CREATE POLICY "Products read policy" ON public.products
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Products admin modify" ON public.products;
CREATE POLICY "Products admin modify" ON public.products
  FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- DELIVERY SLOTS:
DROP POLICY IF EXISTS "Slots read policy" ON public.delivery_slots;
CREATE POLICY "Slots read policy" ON public.delivery_slots
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Slots admin modify" ON public.delivery_slots;
CREATE POLICY "Slots admin modify" ON public.delivery_slots
  FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- ORDERS:
DROP POLICY IF EXISTS "Orders read policy" ON public.orders;
CREATE POLICY "Orders read policy" ON public.orders
  FOR SELECT USING (
    customer_id = auth.uid() OR
    assigned_driver_id = auth.uid() OR
    public.get_user_role(auth.uid()) = 'admin'
  );

DROP POLICY IF EXISTS "Orders insert policy" ON public.orders;
CREATE POLICY "Orders insert policy" ON public.orders
  FOR INSERT WITH CHECK (
    customer_id = auth.uid() OR
    public.get_user_role(auth.uid()) = 'admin'
  );

DROP POLICY IF EXISTS "Orders update policy" ON public.orders;
CREATE POLICY "Orders update policy" ON public.orders
  FOR UPDATE USING (
    (customer_id = auth.uid() AND status = 'pending') OR
    (assigned_driver_id = auth.uid()) OR
    (public.get_user_role(auth.uid()) = 'admin')
  );

-- ORDER ITEMS:
DROP POLICY IF EXISTS "Order items read policy" ON public.order_items;
CREATE POLICY "Order items read policy" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id AND (
        o.customer_id = auth.uid() OR
        o.assigned_driver_id = auth.uid() OR
        public.get_user_role(auth.uid()) = 'admin'
      )
    )
  );

DROP POLICY IF EXISTS "Order items insert policy" ON public.order_items;
CREATE POLICY "Order items insert policy" ON public.order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id AND (
        o.customer_id = auth.uid() OR
        public.get_user_role(auth.uid()) = 'admin'
      )
    )
  );

-- SUBSCRIPTIONS:
DROP POLICY IF EXISTS "Subscriptions access policy" ON public.subscriptions;
CREATE POLICY "Subscriptions access policy" ON public.subscriptions
  FOR ALL USING (
    customer_id = auth.uid() OR public.get_user_role(auth.uid()) = 'admin'
  );

-- SUBSCRIPTION SKIPS:
DROP POLICY IF EXISTS "Subscription skips access policy" ON public.subscription_skips;
CREATE POLICY "Subscription skips access policy" ON public.subscription_skips
  FOR ALL USING (
    customer_id = auth.uid() OR public.get_user_role(auth.uid()) = 'admin'
  );

-- DELIVERY STATUS HISTORY:
DROP POLICY IF EXISTS "Status history read policy" ON public.delivery_status_history;
CREATE POLICY "Status history read policy" ON public.delivery_status_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = delivery_status_history.order_id AND (
        o.customer_id = auth.uid() OR
        o.assigned_driver_id = auth.uid() OR
        public.get_user_role(auth.uid()) = 'admin'
      )
    )
  );

DROP POLICY IF EXISTS "Status history insert policy" ON public.delivery_status_history;
CREATE POLICY "Status history insert policy" ON public.delivery_status_history
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = delivery_status_history.order_id AND (
        o.assigned_driver_id = auth.uid() OR
        o.customer_id = auth.uid() OR
        public.get_user_role(auth.uid()) = 'admin'
      )
    )
  );

-- BUSINESS SETTINGS:
DROP POLICY IF EXISTS "Settings read policy" ON public.business_settings;
CREATE POLICY "Settings read policy" ON public.business_settings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Settings admin modify" ON public.business_settings;
CREATE POLICY "Settings admin modify" ON public.business_settings
  FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');
