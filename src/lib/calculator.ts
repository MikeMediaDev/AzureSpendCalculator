import type { CalculatorInput, CalculationResult, LineItem, AnfServiceLevel } from '@/types';
import {
  VM_SKU,
  VM_VCPUS,
  VM_NAME,
  DISK_SKU,
  DISK_NAME,
  VCPU_PER_USER,
  ANF_PROFILE_SIZE_GB_PER_USER,
  ANF_MIN_POOL_SIZE_TIB,
  RESERVATION_TERM,
} from './constants';
import { getPrice } from './db';

interface PriceData {
  vmMonthlyPrice: number;
  diskMonthlyPrice: number;
  anfPricePerTiBMonth: number;
}

async function fetchPrices(region: string, anfServiceLevel: AnfServiceLevel): Promise<PriceData> {
  // Get VM price (3-year reserved)
  const vmPrice = await getPrice(VM_SKU, region, RESERVATION_TERM, 'Reservation');
  if (!vmPrice) {
    throw new Error(`VM price not found for ${VM_SKU} in ${region}`);
  }

  // Reserved prices are total for term, convert to monthly
  // The API returns the total 3-year price, so divide by 36 months
  const vmMonthlyPrice = vmPrice.unitPrice / 36;

  // Get disk price (consumption/monthly)
  const diskPrice = await getPrice(DISK_SKU, region, null, 'Consumption');
  if (!diskPrice) {
    throw new Error(`Disk price not found for ${DISK_SKU} in ${region}`);
  }
  // Disk price is per month
  const diskMonthlyPrice = diskPrice.unitPrice;

  // Get ANF price
  const anfMeterName = anfServiceLevel === 'Standard' ? 'Standard Capacity' : 'Premium Capacity';
  const anfPrice = await getPrice(anfMeterName, region, null, 'Consumption');
  if (!anfPrice) {
    throw new Error(`ANF price not found for ${anfMeterName} in ${region}`);
  }
  // ANF price is per GiB per hour, convert to per TiB per month
  // 1 TiB = 1024 GiB, ~730 hours per month
  const anfPricePerTiBMonth = anfPrice.unitPrice * 1024 * 730;

  return { vmMonthlyPrice, diskMonthlyPrice, anfPricePerTiBMonth };
}

export async function calculate(input: CalculatorInput): Promise<CalculationResult> {
  const { region, concurrentUsers, workloadType, anfServiceLevel } = input;

  // Calculate number of VMs needed
  const vcpuPerUser = VCPU_PER_USER[workloadType];
  const totalVcpusNeeded = concurrentUsers * vcpuPerUser;
  const vmCount = Math.ceil(totalVcpusNeeded / VM_VCPUS);
  const usersPerVm = vmCount > 0 ? Math.round(concurrentUsers / vmCount) : 0;

  // Calculate ANF capacity needed
  const totalProfileStorageGB = concurrentUsers * ANF_PROFILE_SIZE_GB_PER_USER;
  const totalProfileStorageTiB = totalProfileStorageGB / 1024;
  // Round up to minimum pool size or next TiB
  const anfCapacityTiB = Math.max(ANF_MIN_POOL_SIZE_TIB, Math.ceil(totalProfileStorageTiB));

  // Fetch prices
  const prices = await fetchPrices(region, anfServiceLevel);

  // Build line items
  const lineItems: LineItem[] = [];

  // VMs
  const vmTotalMonthly = vmCount * prices.vmMonthlyPrice;
  lineItems.push({
    name: `${VM_NAME} VM (3-year reserved, Hybrid Benefit)`,
    sku: VM_SKU,
    quantity: vmCount,
    unitPrice: prices.vmMonthlyPrice,
    monthlyPrice: vmTotalMonthly,
  });

  // Disks (one per VM)
  const diskTotalMonthly = vmCount * prices.diskMonthlyPrice;
  lineItems.push({
    name: `${DISK_NAME} Managed Disk`,
    sku: DISK_SKU,
    quantity: vmCount,
    unitPrice: prices.diskMonthlyPrice,
    monthlyPrice: diskTotalMonthly,
  });

  // ANF
  const anfTotalMonthly = anfCapacityTiB * prices.anfPricePerTiBMonth;
  lineItems.push({
    name: `Azure NetApp Files ${anfServiceLevel}`,
    sku: `ANF-${anfServiceLevel}`,
    quantity: anfCapacityTiB,
    unitPrice: prices.anfPricePerTiBMonth,
    monthlyPrice: anfTotalMonthly,
  });

  const totalMonthly = lineItems.reduce((sum, item) => sum + item.monthlyPrice, 0);

  return {
    lineItems,
    totalMonthly,
    totalAnnual: totalMonthly * 12,
    metadata: {
      vmCount,
      usersPerVm,
      anfCapacityTiB,
    },
  };
}

// Calculate with mock/fallback prices for when DB is empty
export function calculateWithPrices(
  input: CalculatorInput,
  prices: PriceData
): CalculationResult {
  const { concurrentUsers, workloadType, anfServiceLevel } = input;

  // Calculate number of VMs needed
  const vcpuPerUser = VCPU_PER_USER[workloadType];
  const totalVcpusNeeded = concurrentUsers * vcpuPerUser;
  const vmCount = Math.ceil(totalVcpusNeeded / VM_VCPUS);
  const usersPerVm = vmCount > 0 ? Math.round(concurrentUsers / vmCount) : 0;

  // Calculate ANF capacity needed
  const totalProfileStorageGB = concurrentUsers * ANF_PROFILE_SIZE_GB_PER_USER;
  const totalProfileStorageTiB = totalProfileStorageGB / 1024;
  const anfCapacityTiB = Math.max(ANF_MIN_POOL_SIZE_TIB, Math.ceil(totalProfileStorageTiB));

  // Build line items
  const lineItems: LineItem[] = [];

  // VMs
  const vmTotalMonthly = vmCount * prices.vmMonthlyPrice;
  lineItems.push({
    name: `${VM_NAME} VM (3-year reserved, Hybrid Benefit)`,
    sku: VM_SKU,
    quantity: vmCount,
    unitPrice: prices.vmMonthlyPrice,
    monthlyPrice: vmTotalMonthly,
  });

  // Disks
  const diskTotalMonthly = vmCount * prices.diskMonthlyPrice;
  lineItems.push({
    name: `${DISK_NAME} Managed Disk`,
    sku: DISK_SKU,
    quantity: vmCount,
    unitPrice: prices.diskMonthlyPrice,
    monthlyPrice: diskTotalMonthly,
  });

  // ANF
  const anfTotalMonthly = anfCapacityTiB * prices.anfPricePerTiBMonth;
  lineItems.push({
    name: `Azure NetApp Files ${anfServiceLevel}`,
    sku: `ANF-${anfServiceLevel}`,
    quantity: anfCapacityTiB,
    unitPrice: prices.anfPricePerTiBMonth,
    monthlyPrice: anfTotalMonthly,
  });

  const totalMonthly = lineItems.reduce((sum, item) => sum + item.monthlyPrice, 0);

  return {
    lineItems,
    totalMonthly,
    totalAnnual: totalMonthly * 12,
    metadata: {
      vmCount,
      usersPerVm,
      anfCapacityTiB,
    },
  };
}
