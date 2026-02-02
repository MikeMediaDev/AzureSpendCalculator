import type { CalculatorInput, CalculationResult, LineItem, AnfServiceLevel, ReservationTerm } from '@/types';
import {
  VM_SKU,
  VM_VCPUS,
  VM_NAME,
  DC_VM_SKU,
  DC_VM_VCPUS,
  DC_VM_NAME,
  DC_COUNT,
  FM_VM_SKU,
  FM_VM_VCPUS,
  FM_VM_NAME,
  FM_COUNT,
  DISK_SKU,
  DISK_NAME,
  VCPU_PER_USER,
  ANF_PROFILE_SIZE_GB_PER_USER,
  ANF_MIN_POOL_SIZE_TIB,
  RESERVATION_TERM_API_VALUES,
  WINDOWS_LICENSE_PRICE_PER_8_CORES,
  WINDOWS_LICENSE_CORE_PACK,
  HOURS_PER_MONTH,
  GO_GLOBAL_PRICING_TIERS,
} from './constants';
import { getPrice } from './db';

interface PriceData {
  vmMonthlyPrice: number;
  dcVmMonthlyPrice: number;
  diskMonthlyPrice: number;
  anfPricePerTiBMonth: number;
}

// Get GO-Global price per user based on tiered pricing
function getGoGlobalPricePerUser(userCount: number): number {
  const tier = GO_GLOBAL_PRICING_TIERS.find(
    t => userCount >= t.minUsers && userCount <= t.maxUsers
  );
  return tier?.pricePerUser ?? GO_GLOBAL_PRICING_TIERS[0].pricePerUser;
}

async function fetchPrices(region: string, anfServiceLevel: AnfServiceLevel, reservationTerm: ReservationTerm): Promise<PriceData> {
  const termConfig = RESERVATION_TERM_API_VALUES[reservationTerm];

  // Get VM price based on selected reservation term
  const vmPrice = await getPrice(VM_SKU, region, termConfig.term, termConfig.priceType);
  if (!vmPrice) {
    throw new Error(`VM price not found for ${VM_SKU} in ${region} (${reservationTerm})`);
  }

  // Convert to monthly price based on pricing type
  // - Consumption: price is per hour, multiply by hours per month
  // - Reservation: price is total for term, divide by months
  const vmMonthlyPrice = termConfig.priceType === 'Consumption'
    ? vmPrice.unitPrice * HOURS_PER_MONTH
    : vmPrice.unitPrice / termConfig.months;

  // Get DC VM price with same reservation term
  const dcVmPrice = await getPrice(DC_VM_SKU, region, termConfig.term, termConfig.priceType);
  if (!dcVmPrice) {
    throw new Error(`DC VM price not found for ${DC_VM_SKU} in ${region} (${reservationTerm})`);
  }
  const dcVmMonthlyPrice = termConfig.priceType === 'Consumption'
    ? dcVmPrice.unitPrice * HOURS_PER_MONTH
    : dcVmPrice.unitPrice / termConfig.months;

  // Get disk price (always consumption/monthly)
  const diskPrice = await getPrice(DISK_SKU, region, null, 'Consumption');
  if (!diskPrice) {
    throw new Error(`Disk price not found for ${DISK_SKU} in ${region}`);
  }
  const diskMonthlyPrice = diskPrice.unitPrice;

  // Get ANF price
  const anfMeterName = anfServiceLevel === 'Standard' ? 'Standard Capacity' : 'Premium Capacity';
  const anfPrice = await getPrice(anfMeterName, region, null, 'Consumption');
  if (!anfPrice) {
    throw new Error(`ANF price not found for ${anfMeterName} in ${region}`);
  }
  // ANF price is per GiB per hour, convert to per TiB per month
  const anfPricePerTiBMonth = anfPrice.unitPrice * 1024 * HOURS_PER_MONTH;

  return { vmMonthlyPrice, dcVmMonthlyPrice, diskMonthlyPrice, anfPricePerTiBMonth };
}

// Get display label for reservation term
function getReservationLabel(term: ReservationTerm): string {
  switch (term) {
    case 'payg': return 'Pay-as-you-go';
    case '1year': return '1-year reserved';
    case '3year': return '3-year reserved';
  }
}

export async function calculate(input: CalculatorInput): Promise<CalculationResult> {
  const { region, concurrentUsers, workloadType, anfServiceLevel, reservationTerm = '3year' } = input;

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
  const prices = await fetchPrices(region, anfServiceLevel, reservationTerm);
  const reservationLabel = getReservationLabel(reservationTerm);

  // Build line items
  const lineItems: LineItem[] = [];

  // Session Host VMs
  const vmTotalMonthly = vmCount * prices.vmMonthlyPrice;
  lineItems.push({
    name: `${VM_NAME} Session Host (${reservationLabel}, Hybrid Benefit)`,
    sku: VM_SKU,
    quantity: vmCount,
    unitPrice: prices.vmMonthlyPrice,
    monthlyPrice: vmTotalMonthly,
  });

  // Session Host Disks
  const diskTotalMonthly = vmCount * prices.diskMonthlyPrice;
  lineItems.push({
    name: `${DISK_NAME} Managed Disk (Session Hosts)`,
    sku: DISK_SKU,
    quantity: vmCount,
    unitPrice: prices.diskMonthlyPrice,
    monthlyPrice: diskTotalMonthly,
  });

  // Domain Controllers
  const dcVmTotalMonthly = DC_COUNT * prices.dcVmMonthlyPrice;
  lineItems.push({
    name: `${DC_VM_NAME} Domain Controller (${reservationLabel}, Hybrid Benefit)`,
    sku: DC_VM_SKU,
    quantity: DC_COUNT,
    unitPrice: prices.dcVmMonthlyPrice,
    monthlyPrice: dcVmTotalMonthly,
  });

  // Domain Controller Disks
  const dcDiskTotalMonthly = DC_COUNT * prices.diskMonthlyPrice;
  lineItems.push({
    name: `${DISK_NAME} Managed Disk (Domain Controllers)`,
    sku: DISK_SKU,
    quantity: DC_COUNT,
    unitPrice: prices.diskMonthlyPrice,
    monthlyPrice: dcDiskTotalMonthly,
  });

  // Farm Managers
  const fmVmTotalMonthly = FM_COUNT * prices.dcVmMonthlyPrice;
  lineItems.push({
    name: `${FM_VM_NAME} Farm Manager (${reservationLabel}, Hybrid Benefit)`,
    sku: FM_VM_SKU,
    quantity: FM_COUNT,
    unitPrice: prices.dcVmMonthlyPrice,
    monthlyPrice: fmVmTotalMonthly,
  });

  // Farm Manager Disks
  const fmDiskTotalMonthly = FM_COUNT * prices.diskMonthlyPrice;
  lineItems.push({
    name: `${DISK_NAME} Managed Disk (Farm Managers)`,
    sku: DISK_SKU,
    quantity: FM_COUNT,
    unitPrice: prices.diskMonthlyPrice,
    monthlyPrice: fmDiskTotalMonthly,
  });

  // Windows Server 2022 License (consolidated for all VMs)
  // Calculate license units per VM type (minimum 8 cores per server)
  const sessionHostLicenseUnits = vmCount * Math.max(1, Math.ceil(VM_VCPUS / WINDOWS_LICENSE_CORE_PACK));
  const dcLicenseUnits = DC_COUNT * Math.max(1, Math.ceil(DC_VM_VCPUS / WINDOWS_LICENSE_CORE_PACK));
  const fmLicenseUnits = FM_COUNT * Math.max(1, Math.ceil(FM_VM_VCPUS / WINDOWS_LICENSE_CORE_PACK));
  const totalLicenseUnits = sessionHostLicenseUnits + dcLicenseUnits + fmLicenseUnits;
  const windowsLicenseTotalMonthly = totalLicenseUnits * WINDOWS_LICENSE_PRICE_PER_8_CORES;
  lineItems.push({
    name: 'Windows Server 2022 License',
    sku: 'WIN-SVR-2022',
    quantity: totalLicenseUnits,
    unitPrice: WINDOWS_LICENSE_PRICE_PER_8_CORES,
    monthlyPrice: windowsLicenseTotalMonthly,
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

  // GO-Global Licenses (tiered pricing based on concurrent users)
  const goGlobalPricePerUser = getGoGlobalPricePerUser(concurrentUsers);
  const goGlobalTotalMonthly = concurrentUsers * goGlobalPricePerUser;
  lineItems.push({
    name: 'GO-Global Licenses',
    sku: 'GO-GLOBAL',
    quantity: concurrentUsers,
    unitPrice: goGlobalPricePerUser,
    monthlyPrice: goGlobalTotalMonthly,
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
  const { concurrentUsers, workloadType, anfServiceLevel, reservationTerm = '3year' } = input;
  const reservationLabel = getReservationLabel(reservationTerm);

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

  // Session Host VMs
  const vmTotalMonthly = vmCount * prices.vmMonthlyPrice;
  lineItems.push({
    name: `${VM_NAME} Session Host (${reservationLabel}, Hybrid Benefit)`,
    sku: VM_SKU,
    quantity: vmCount,
    unitPrice: prices.vmMonthlyPrice,
    monthlyPrice: vmTotalMonthly,
  });

  // Session Host Disks
  const diskTotalMonthly = vmCount * prices.diskMonthlyPrice;
  lineItems.push({
    name: `${DISK_NAME} Managed Disk (Session Hosts)`,
    sku: DISK_SKU,
    quantity: vmCount,
    unitPrice: prices.diskMonthlyPrice,
    monthlyPrice: diskTotalMonthly,
  });

  // Domain Controllers
  const dcVmTotalMonthly = DC_COUNT * prices.dcVmMonthlyPrice;
  lineItems.push({
    name: `${DC_VM_NAME} Domain Controller (${reservationLabel}, Hybrid Benefit)`,
    sku: DC_VM_SKU,
    quantity: DC_COUNT,
    unitPrice: prices.dcVmMonthlyPrice,
    monthlyPrice: dcVmTotalMonthly,
  });

  // Domain Controller Disks
  const dcDiskTotalMonthly = DC_COUNT * prices.diskMonthlyPrice;
  lineItems.push({
    name: `${DISK_NAME} Managed Disk (Domain Controllers)`,
    sku: DISK_SKU,
    quantity: DC_COUNT,
    unitPrice: prices.diskMonthlyPrice,
    monthlyPrice: dcDiskTotalMonthly,
  });

  // Farm Managers
  const fmVmTotalMonthly = FM_COUNT * prices.dcVmMonthlyPrice;
  lineItems.push({
    name: `${FM_VM_NAME} Farm Manager (${reservationLabel}, Hybrid Benefit)`,
    sku: FM_VM_SKU,
    quantity: FM_COUNT,
    unitPrice: prices.dcVmMonthlyPrice,
    monthlyPrice: fmVmTotalMonthly,
  });

  // Farm Manager Disks
  const fmDiskTotalMonthly = FM_COUNT * prices.diskMonthlyPrice;
  lineItems.push({
    name: `${DISK_NAME} Managed Disk (Farm Managers)`,
    sku: DISK_SKU,
    quantity: FM_COUNT,
    unitPrice: prices.diskMonthlyPrice,
    monthlyPrice: fmDiskTotalMonthly,
  });

  // Windows Server 2022 License (consolidated for all VMs)
  // Calculate license units per VM type (minimum 8 cores per server)
  const sessionHostLicenseUnits = vmCount * Math.max(1, Math.ceil(VM_VCPUS / WINDOWS_LICENSE_CORE_PACK));
  const dcLicenseUnits = DC_COUNT * Math.max(1, Math.ceil(DC_VM_VCPUS / WINDOWS_LICENSE_CORE_PACK));
  const fmLicenseUnits = FM_COUNT * Math.max(1, Math.ceil(FM_VM_VCPUS / WINDOWS_LICENSE_CORE_PACK));
  const totalLicenseUnits = sessionHostLicenseUnits + dcLicenseUnits + fmLicenseUnits;
  const windowsLicenseTotalMonthly = totalLicenseUnits * WINDOWS_LICENSE_PRICE_PER_8_CORES;
  lineItems.push({
    name: 'Windows Server 2022 License',
    sku: 'WIN-SVR-2022',
    quantity: totalLicenseUnits,
    unitPrice: WINDOWS_LICENSE_PRICE_PER_8_CORES,
    monthlyPrice: windowsLicenseTotalMonthly,
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

  // GO-Global Licenses (tiered pricing based on concurrent users)
  const goGlobalPricePerUser = getGoGlobalPricePerUser(concurrentUsers);
  const goGlobalTotalMonthly = concurrentUsers * goGlobalPricePerUser;
  lineItems.push({
    name: 'GO-Global Licenses',
    sku: 'GO-GLOBAL',
    quantity: concurrentUsers,
    unitPrice: goGlobalPricePerUser,
    monthlyPrice: goGlobalTotalMonthly,
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
