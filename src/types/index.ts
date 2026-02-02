export type WorkloadType = 'light' | 'medium' | 'heavy';
export type AnfServiceLevel = 'Standard' | 'Premium';
export type ReservationTerm = 'payg' | '1year' | '3year';

export interface CalculatorInput {
  region: string;
  concurrentUsers: number;
  workloadType: WorkloadType;
  anfServiceLevel: AnfServiceLevel;
  reservationTerm: ReservationTerm;
}

export interface LineItem {
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  monthlyPrice: number;
}

export interface CalculationMetadata {
  vmCount: number;
  usersPerVm: number;
  anfCapacityTiB: number;
}

export interface CalculationResult {
  lineItems: LineItem[];
  totalMonthly: number;
  totalAnnual: number;
  metadata: CalculationMetadata;
}

export interface Scenario {
  id: number;
  name: string;
  region: string;
  concurrentUsers: number;
  workloadType: WorkloadType;
  anfServiceLevel: AnfServiceLevel;
  reservationTerm: ReservationTerm;
  calculationResult: CalculationResult | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AzurePrice {
  id: number;
  skuName: string;
  serviceName: string;
  productName: string | null;
  meterName: string | null;
  region: string;
  unitPrice: number;
  unitOfMeasure: string | null;
  reservationTerm: string | null;
  priceType: string | null;
  fetchedAt: Date;
}

export interface ScenarioCreateInput {
  name: string;
  region: string;
  concurrentUsers: number;
  workloadType: WorkloadType;
  anfServiceLevel: AnfServiceLevel;
  reservationTerm: ReservationTerm;
  calculationResult?: CalculationResult;
}

export interface ScenarioUpdateInput {
  name?: string;
  region?: string;
  concurrentUsers?: number;
  workloadType?: WorkloadType;
  anfServiceLevel?: AnfServiceLevel;
  reservationTerm?: ReservationTerm;
  calculationResult?: CalculationResult;
}
