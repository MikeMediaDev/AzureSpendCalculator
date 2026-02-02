import type { WorkloadType, ReservationTerm } from '@/types';

export type GoGlobalPricingTier = {
  minUsers: number;
  maxUsers: number;
  pricePerUser: number;
};

export const US_REGIONS = [
  { value: 'eastus', label: 'East US' },
  { value: 'eastus2', label: 'East US 2' },
  { value: 'westus', label: 'West US' },
  { value: 'westus2', label: 'West US 2' },
  { value: 'westus3', label: 'West US 3' },
  { value: 'centralus', label: 'Central US' },
  { value: 'northcentralus', label: 'North Central US' },
  { value: 'southcentralus', label: 'South Central US' },
  { value: 'westcentralus', label: 'West Central US' },
] as const;

export const WORKLOAD_TYPES = [
  { value: 'light', label: 'Light', description: '~53 users per VM' },
  { value: 'medium', label: 'Medium', description: '~32 users per VM' },
  { value: 'heavy', label: 'Heavy', description: '~16 users per VM' },
] as const;

export const ANF_SERVICE_LEVELS = [
  { value: 'Standard', label: 'Standard', description: '16 MiB/s per TiB' },
  { value: 'Premium', label: 'Premium', description: '64 MiB/s per TiB' },
] as const;

// VM specifications (Session Hosts)
export const VM_SKU = 'Standard_D8as_v7';
export const VM_VCPUS = 8;
export const VM_NAME = 'D8as v7';

// Domain Controller specifications
export const DC_VM_SKU = 'Standard_D2as_v7';
export const DC_VM_VCPUS = 2;
export const DC_VM_NAME = 'D2as v7';
export const DC_COUNT = 2; // Fixed number of DCs per deployment

// Farm Manager specifications (same specs as Domain Controllers)
export const FM_VM_SKU = 'Standard_D2as_v7';
export const FM_VM_VCPUS = 2;
export const FM_VM_NAME = 'D2as v7';
export const FM_COUNT = 2; // Fixed number of Farm Managers per deployment

// Disk specifications (128GB Standard SSD)
export const DISK_SKU = 'E10 LRS';
export const DISK_METER_NAME = 'E10 LRS Disk'; // Azure API meterName includes "Disk" suffix
export const DISK_SIZE_GIB = 128;
export const DISK_NAME = 'E10 Standard SSD';

// Windows Server 2022 License
export const WINDOWS_LICENSE_PRICE_PER_8_CORES = 16.15; // Monthly cost per 8 cores
export const WINDOWS_LICENSE_CORE_PACK = 8; // Minimum licensing unit

// vCPU per user based on workload type
export const VCPU_PER_USER: Record<WorkloadType, number> = {
  light: 0.15,   // ~53 users per D8as_v7
  medium: 0.25,  // 32 users per D8as_v7
  heavy: 0.5,    // 16 users per D8as_v7
};

// ANF specifications
export const ANF_PROFILE_SIZE_GB_PER_USER = 5;
export const ANF_MIN_POOL_SIZE_TIB = 1; // Minimum ANF capacity pool size (negotiated with Microsoft)

// Reservation term options
export const RESERVATION_TERMS = [
  { value: 'payg', label: 'Pay-as-you-go', description: 'Hourly billing, no commitment' },
  { value: '1year', label: '1 Year Reserved', description: 'Up to 40% savings' },
  { value: '3year', label: '3 Year Reserved', description: 'Up to 60% savings' },
] as const;

// Map reservation term values to Azure API values
export const RESERVATION_TERM_API_VALUES: Record<ReservationTerm, { priceType: string; term: string | null; months: number }> = {
  payg: { priceType: 'Consumption', term: null, months: 1 },
  '1year': { priceType: 'Reservation', term: '1 Year', months: 12 },
  '3year': { priceType: 'Reservation', term: '3 Years', months: 36 },
};

// Hours per month (average)
export const HOURS_PER_MONTH = 730;

// GO-Global License pricing tiers (per user per month)
export const GO_GLOBAL_PRICING_TIERS = [
  { minUsers: 25, maxUsers: 99, pricePerUser: 4.20 },
  { minUsers: 100, maxUsers: 499, pricePerUser: 3.85 },
  { minUsers: 500, maxUsers: 999, pricePerUser: 3.55 },
  { minUsers: 1000, maxUsers: 4999, pricePerUser: 3.25 },
  { minUsers: 5000, maxUsers: 9999, pricePerUser: 3.00 },
  { minUsers: 10000, maxUsers: Infinity, pricePerUser: 2.75 },
] as const;

// Minimum concurrent users
export const MIN_CONCURRENT_USERS = 25;

// Azure Retail Prices API
export const AZURE_PRICES_API_URL = 'https://prices.azure.com/api/retail/prices';
