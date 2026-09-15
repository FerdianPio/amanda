-- SFA Amanda Group PostgreSQL Schema
-- Compatible with PostgreSQL 14+ and PGlite

CREATE TABLE IF NOT EXISTS business_units (
  id VARCHAR(64) PRIMARY KEY,
  code VARCHAR(32) UNIQUE NOT NULL,
  name VARCHAR(128) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS business_unit_themes (
  id VARCHAR(64) PRIMARY KEY,
  business_unit_id VARCHAR(64) UNIQUE NOT NULL REFERENCES business_units(id) ON DELETE CASCADE,
  primary_color VARCHAR(32) NOT NULL DEFAULT '#0D6E63',
  primary_dark_color VARCHAR(32) NOT NULL DEFAULT '#094C44',
  accent_color VARCHAR(32) NOT NULL DEFAULT '#C97A3A',
  accent_soft_color VARCHAR(32) NOT NULL DEFAULT '#F5E7DA',
  background_color VARCHAR(32) NOT NULL DEFAULT '#F1F4F3',
  surface_color VARCHAR(32) NOT NULL DEFAULT '#FFFFFF',
  surface_sunken_color VARCHAR(32) NOT NULL DEFAULT '#E9EEEC',
  text_primary_color VARCHAR(32) NOT NULL DEFAULT '#15221D',
  text_muted_color VARCHAR(32) NOT NULL DEFAULT '#5C6B65',
  text_faint_color VARCHAR(32) NOT NULL DEFAULT '#8B978F',
  border_color VARCHAR(32) NOT NULL DEFAULT '#DCE4E1',
  initials VARCHAR(8) NOT NULL DEFAULT 'AG',
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  email VARCHAR(128) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(128) NOT NULL,
  role VARCHAR(32) NOT NULL DEFAULT 'SALES',
  business_unit_id VARCHAR(64) NOT NULL REFERENCES business_units(id),
  area VARCHAR(128) NOT NULL,
  initials VARCHAR(8) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customers (
  id VARCHAR(64) PRIMARY KEY,
  business_unit_id VARCHAR(64) NOT NULL REFERENCES business_units(id),
  name VARCHAR(128) NOT NULL,
  segment VARCHAR(64) NOT NULL,
  address TEXT NOT NULL,
  pic VARCHAR(128) NOT NULL,
  phone VARCHAR(64) NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  area VARCHAR(128) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
  last_visit_days_ago INT NOT NULL DEFAULT 0,
  total_orders INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(64) PRIMARY KEY,
  business_unit_id VARCHAR(64) NOT NULL REFERENCES business_units(id),
  name VARCHAR(128) NOT NULL,
  unit VARCHAR(32) NOT NULL,
  price NUMERIC(12, 2) NOT NULL,
  sku VARCHAR(64) UNIQUE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS monthly_sales_targets (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  period_label VARCHAR(64) NOT NULL,
  target_amount NUMERIC(14, 2) NOT NULL,
  achieved_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_user_period UNIQUE(user_id, period_label)
);

CREATE TABLE IF NOT EXISTS attendances (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  business_unit_id VARCHAR(64) NOT NULL REFERENCES business_units(id),
  date_key VARCHAR(32) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'ON_TIME',
  check_in_time TIMESTAMPTZ,
  check_out_time TIMESTAMPTZ,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  gps_accuracy INT,
  is_late BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_user_date UNIQUE(user_id, date_key)
);

CREATE TABLE IF NOT EXISTS visits (
  id VARCHAR(64) PRIMARY KEY,
  customer_id VARCHAR(64) NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  business_unit_id VARCHAR(64) NOT NULL REFERENCES business_units(id),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  purpose VARCHAR(128),
  outcome VARCHAR(128),
  notes TEXT,
  has_photo BOOLEAN NOT NULL DEFAULT FALSE,
  status VARCHAR(32) NOT NULL DEFAULT 'IN_PROGRESS',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(64) PRIMARY KEY,
  order_number VARCHAR(64) UNIQUE NOT NULL,
  customer_id VARCHAR(64) NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  business_unit_id VARCHAR(64) NOT NULL REFERENCES business_units(id),
  visit_id VARCHAR(64) REFERENCES visits(id),
  subtotal NUMERIC(14, 2) NOT NULL DEFAULT 0,
  discount_pct NUMERIC(5, 2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  total NUMERIC(14, 2) NOT NULL DEFAULT 0,
  total_qty INT NOT NULL DEFAULT 0,
  requires_approval BOOLEAN NOT NULL DEFAULT FALSE,
  status VARCHAR(32) NOT NULL DEFAULT 'SUBMITTED',
  approval_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  id VARCHAR(64) PRIMARY KEY,
  order_id VARCHAR(64) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id VARCHAR(64) NOT NULL REFERENCES products(id),
  quantity INT NOT NULL,
  unit_price NUMERIC(12, 2) NOT NULL,
  subtotal NUMERIC(14, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_approvals (
  id VARCHAR(64) PRIMARY KEY,
  order_id VARCHAR(64) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  approver_user_id VARCHAR(64) REFERENCES users(id),
  role VARCHAR(32) NOT NULL,
  action VARCHAR(32) NOT NULL,
  notes TEXT,
  stage VARCHAR(32) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agent_insights (
  id VARCHAR(64) PRIMARY KEY,
  business_unit_id VARCHAR(64) NOT NULL REFERENCES business_units(id),
  user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(32) NOT NULL,
  text TEXT NOT NULL,
  source_data JSONB,
  severity VARCHAR(32) NOT NULL DEFAULT 'info',
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(128) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  link VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS follow_ups (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  customer_id VARCHAR(64) NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  title VARCHAR(128) NOT NULL,
  due_date TIMESTAMPTZ NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(64) PRIMARY KEY,
  business_unit_id VARCHAR(64) NOT NULL REFERENCES business_units(id),
  actor_user_id VARCHAR(64) REFERENCES users(id),
  action VARCHAR(64) NOT NULL,
  entity_type VARCHAR(64) NOT NULL,
  entity_id VARCHAR(64) NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for high performance
CREATE INDEX IF NOT EXISTS idx_users_bu ON users(business_unit_id);
CREATE INDEX IF NOT EXISTS idx_customers_bu ON customers(business_unit_id);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_products_bu ON products(business_unit_id);
CREATE INDEX IF NOT EXISTS idx_targets_user ON monthly_sales_targets(user_id);
CREATE INDEX IF NOT EXISTS idx_attendances_user ON attendances(user_id);
CREATE INDEX IF NOT EXISTS idx_visits_customer ON visits(customer_id);
CREATE INDEX IF NOT EXISTS idx_visits_user ON visits(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_insights_user ON agent_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_bu ON audit_logs(business_unit_id);
