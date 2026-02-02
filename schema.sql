-- Azure Spend Calculator Database Schema

-- Azure Prices table
CREATE TABLE IF NOT EXISTS azure_prices (
    id SERIAL PRIMARY KEY,
    sku_name VARCHAR(255) NOT NULL,
    service_name VARCHAR(255) NOT NULL,
    product_name VARCHAR(255),
    meter_name VARCHAR(255),
    region VARCHAR(100) NOT NULL,
    unit_price DECIMAL(18, 6) NOT NULL,
    unit_of_measure VARCHAR(100),
    reservation_term VARCHAR(50),
    price_type VARCHAR(50) NOT NULL,
    fetched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (sku_name, region, reservation_term, price_type)
);

-- Scenarios table
CREATE TABLE IF NOT EXISTS scenarios (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    region VARCHAR(100) NOT NULL,
    concurrent_users INTEGER NOT NULL,
    workload_type VARCHAR(50) NOT NULL,
    anf_service_level VARCHAR(50) NOT NULL,
    reservation_term VARCHAR(50) NOT NULL,
    calculation_result JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster price lookups
CREATE INDEX IF NOT EXISTS idx_azure_prices_lookup
    ON azure_prices (sku_name, region, reservation_term, price_type);

-- Index for scenarios by update time
CREATE INDEX IF NOT EXISTS idx_scenarios_updated
    ON scenarios (updated_at DESC);
