-- Cached Azure retail prices
CREATE TABLE azure_prices (
  id SERIAL PRIMARY KEY,
  sku_name VARCHAR(100) NOT NULL,
  service_name VARCHAR(100) NOT NULL,
  product_name VARCHAR(200),
  meter_name VARCHAR(200),
  region VARCHAR(50) NOT NULL,
  unit_price DECIMAL(20, 10) NOT NULL,
  unit_of_measure VARCHAR(50),
  reservation_term VARCHAR(20),
  price_type VARCHAR(50),
  fetched_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(sku_name, region, reservation_term, price_type)
);

-- User scenarios
CREATE TABLE scenarios (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  region VARCHAR(50) NOT NULL,
  concurrent_users INT NOT NULL,
  workload_type VARCHAR(20) NOT NULL,
  anf_service_level VARCHAR(20) NOT NULL,
  reservation_term VARCHAR(50) NOT NULL DEFAULT '3year',
  isv_charge DECIMAL(10, 2) DEFAULT 0,
  support_level VARCHAR(20) DEFAULT 'low',
  support_hourly_rate DECIMAL(10, 2) DEFAULT 0,
  sql_db_enabled BOOLEAN DEFAULT false,
  sql_db_size VARCHAR(20),
  sql_db_storage_gb INTEGER,
  calculation_result JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_prices_lookup ON azure_prices(sku_name, region, reservation_term);
CREATE INDEX idx_prices_fetched ON azure_prices(fetched_at);
