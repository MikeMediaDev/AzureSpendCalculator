import { Pool } from 'pg';
import type { AzurePrice, Scenario, ScenarioCreateInput, ScenarioUpdateInput, CalculationResult } from '@/types';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Azure Prices

export async function upsertPrice(price: Omit<AzurePrice, 'id' | 'fetchedAt'>): Promise<void> {
  await pool.query(
    `INSERT INTO azure_prices (sku_name, service_name, product_name, meter_name, region, unit_price, unit_of_measure, reservation_term, price_type, fetched_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
     ON CONFLICT (sku_name, region, reservation_term, price_type)
     DO UPDATE SET unit_price = $6, product_name = $3, meter_name = $4, unit_of_measure = $7, fetched_at = NOW()`,
    [
      price.skuName,
      price.serviceName,
      price.productName,
      price.meterName,
      price.region,
      price.unitPrice,
      price.unitOfMeasure,
      price.reservationTerm,
      price.priceType,
    ]
  );
}

export async function getPrice(
  skuName: string,
  region: string,
  reservationTerm: string | null,
  priceType: string
): Promise<AzurePrice | null> {
  const result = await pool.query(
    `SELECT id, sku_name as "skuName", service_name as "serviceName", product_name as "productName",
            meter_name as "meterName", region, unit_price as "unitPrice", unit_of_measure as "unitOfMeasure",
            reservation_term as "reservationTerm", price_type as "priceType", fetched_at as "fetchedAt"
     FROM azure_prices
     WHERE sku_name = $1 AND region = $2 AND reservation_term IS NOT DISTINCT FROM $3 AND price_type = $4`,
    [skuName, region, reservationTerm, priceType]
  );
  return result.rows[0] || null;
}

export async function getPricesForRegion(region: string): Promise<AzurePrice[]> {
  const result = await pool.query(
    `SELECT id, sku_name as "skuName", service_name as "serviceName", product_name as "productName",
            meter_name as "meterName", region, unit_price as "unitPrice", unit_of_measure as "unitOfMeasure",
            reservation_term as "reservationTerm", price_type as "priceType", fetched_at as "fetchedAt"
     FROM azure_prices
     WHERE region = $1`,
    [region]
  );
  return result.rows;
}

export async function getLastPriceRefresh(): Promise<Date | null> {
  const result = await pool.query(
    `SELECT MAX(fetched_at) as "lastFetch" FROM azure_prices`
  );
  return result.rows[0]?.lastFetch || null;
}

// Scenarios

export async function createScenario(input: ScenarioCreateInput): Promise<Scenario> {
  const result = await pool.query(
    `INSERT INTO scenarios (name, region, concurrent_users, workload_type, anf_service_level, calculation_result)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, name, region, concurrent_users as "concurrentUsers", workload_type as "workloadType",
               anf_service_level as "anfServiceLevel", calculation_result as "calculationResult",
               created_at as "createdAt", updated_at as "updatedAt"`,
    [
      input.name,
      input.region,
      input.concurrentUsers,
      input.workloadType,
      input.anfServiceLevel,
      input.calculationResult ? JSON.stringify(input.calculationResult) : null,
    ]
  );
  return result.rows[0];
}

export async function getScenario(id: number): Promise<Scenario | null> {
  const result = await pool.query(
    `SELECT id, name, region, concurrent_users as "concurrentUsers", workload_type as "workloadType",
            anf_service_level as "anfServiceLevel", calculation_result as "calculationResult",
            created_at as "createdAt", updated_at as "updatedAt"
     FROM scenarios
     WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

export async function getAllScenarios(): Promise<Scenario[]> {
  const result = await pool.query(
    `SELECT id, name, region, concurrent_users as "concurrentUsers", workload_type as "workloadType",
            anf_service_level as "anfServiceLevel", calculation_result as "calculationResult",
            created_at as "createdAt", updated_at as "updatedAt"
     FROM scenarios
     ORDER BY updated_at DESC`
  );
  return result.rows;
}

export async function updateScenario(id: number, input: ScenarioUpdateInput): Promise<Scenario | null> {
  const updates: string[] = [];
  const values: (string | number | CalculationResult | null)[] = [];
  let paramIndex = 1;

  if (input.name !== undefined) {
    updates.push(`name = $${paramIndex++}`);
    values.push(input.name);
  }
  if (input.region !== undefined) {
    updates.push(`region = $${paramIndex++}`);
    values.push(input.region);
  }
  if (input.concurrentUsers !== undefined) {
    updates.push(`concurrent_users = $${paramIndex++}`);
    values.push(input.concurrentUsers);
  }
  if (input.workloadType !== undefined) {
    updates.push(`workload_type = $${paramIndex++}`);
    values.push(input.workloadType);
  }
  if (input.anfServiceLevel !== undefined) {
    updates.push(`anf_service_level = $${paramIndex++}`);
    values.push(input.anfServiceLevel);
  }
  if (input.calculationResult !== undefined) {
    updates.push(`calculation_result = $${paramIndex++}`);
    values.push(JSON.stringify(input.calculationResult));
  }

  if (updates.length === 0) {
    return getScenario(id);
  }

  updates.push(`updated_at = NOW()`);
  values.push(id);

  const result = await pool.query(
    `UPDATE scenarios SET ${updates.join(', ')}
     WHERE id = $${paramIndex}
     RETURNING id, name, region, concurrent_users as "concurrentUsers", workload_type as "workloadType",
               anf_service_level as "anfServiceLevel", calculation_result as "calculationResult",
               created_at as "createdAt", updated_at as "updatedAt"`,
    values
  );
  return result.rows[0] || null;
}

export async function deleteScenario(id: number): Promise<boolean> {
  const result = await pool.query(
    `DELETE FROM scenarios WHERE id = $1`,
    [id]
  );
  return result.rowCount !== null && result.rowCount > 0;
}
