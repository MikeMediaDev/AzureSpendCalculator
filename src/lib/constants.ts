import type { WorkloadType } from '@/types';

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
  { value: 'light', label: 'Light', description: '~26 users per VM' },
  { value: 'medium', label: 'Medium', description: '~16 users per VM' },
  { value: 'heavy', label: 'Heavy', description: '~8 users per VM' },
] as const;

export const ANF_SERVICE_LEVELS = [
  { value: 'Standard', label: 'Standard', description: '16 MiB/s per TiB' },
  { value: 'Premium', label: 'Premium', description: '64 MiB/s per TiB' },
] as const;

// VM specifications
export const VM_SKU = 'Standard_D4as_v5';
export const VM_VCPUS = 4;
export const VM_NAME = 'D4as v5';

// Disk specifications
export const DISK_SKU = 'E10 LRS';
export const DISK_SIZE_GIB = 128;
export const DISK_NAME = 'E10 Standard SSD';

// vCPU per user based on workload type
export const VCPU_PER_USER: Record<WorkloadType, number> = {
  light: 0.15,   // ~26 users per D4as_v5
  medium: 0.25,  // 16 users per D4as_v5
  heavy: 0.5,    // 8 users per D4as_v5
};

// ANF specifications
export const ANF_PROFILE_SIZE_GB_PER_USER = 5;
export const ANF_MIN_POOL_SIZE_TIB = 4; // Minimum ANF capacity pool size

// Reservation term
export const RESERVATION_TERM = '3 Years';

// Hours per month (average)
export const HOURS_PER_MONTH = 730;

// Azure Retail Prices API
export const AZURE_PRICES_API_URL = 'https://prices.azure.com/api/retail/prices';
