import { AZURE_PRICES_API_URL, US_REGIONS, VM_SKU, DC_VM_SKU, DISK_SKU, DISK_METER_NAME } from './constants';
import { upsertPricesBatch } from './db';
import type { AzurePrice } from '@/types';

interface AzurePriceApiItem {
  skuName: string;
  armSkuName: string;
  serviceName: string;
  productName: string;
  meterName: string;
  armRegionName: string;
  retailPrice: number;
  unitOfMeasure: string;
  reservationTerm: string | null;
  type: string;
}

interface AzurePriceApiResponse {
  Items: AzurePriceApiItem[];
  NextPageLink: string | null;
}

async function fetchAzurePrices(filter: string): Promise<AzurePriceApiItem[]> {
  const items: AzurePriceApiItem[] = [];
  let url = `${AZURE_PRICES_API_URL}?$filter=${encodeURIComponent(filter)}`;

  while (url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Azure Prices API error: ${response.status}`);
    }
    const data: AzurePriceApiResponse = await response.json();
    items.push(...data.Items);
    url = data.NextPageLink || '';
  }

  return items;
}

type PriceData = Omit<AzurePrice, 'id' | 'fetchedAt'>;

function collectVmPrices(items: AzurePriceApiItem[], skuDefault: string): PriceData[] {
  const prices: PriceData[] = [];

  for (const item of items) {
    // Skip Windows prices - we use Hybrid Benefit
    if (item.productName.includes('Windows')) continue;
    // Skip Spot pricing
    if (item.skuName.includes('Spot') || item.meterName.includes('Spot')) continue;
    // Only include Consumption (pay-as-you-go) and Reservation pricing
    if (item.type !== 'Consumption' && item.type !== 'Reservation') continue;

    prices.push({
      skuName: item.armSkuName || skuDefault,
      serviceName: item.serviceName,
      productName: item.productName,
      meterName: item.meterName,
      region: item.armRegionName,
      unitPrice: item.retailPrice,
      unitOfMeasure: item.unitOfMeasure,
      reservationTerm: item.reservationTerm,
      priceType: item.type,
    });
  }

  return prices;
}

export async function refreshVmPrices(region: string): Promise<PriceData[]> {
  const filter = `serviceName eq 'Virtual Machines' and armSkuName eq '${VM_SKU}' and armRegionName eq '${region}'`;
  const items = await fetchAzurePrices(filter);
  return collectVmPrices(items, VM_SKU);
}

export async function refreshDcVmPrices(region: string): Promise<PriceData[]> {
  const filter = `serviceName eq 'Virtual Machines' and armSkuName eq '${DC_VM_SKU}' and armRegionName eq '${region}'`;
  const items = await fetchAzurePrices(filter);
  return collectVmPrices(items, DC_VM_SKU);
}

export async function refreshDiskPrices(region: string): Promise<PriceData[]> {
  const filter = `serviceName eq 'Storage' and armRegionName eq '${region}' and meterName eq '${DISK_METER_NAME}'`;
  const items = await fetchAzurePrices(filter);

  return items.map(item => ({
    skuName: DISK_SKU,
    serviceName: item.serviceName,
    productName: item.productName,
    meterName: item.meterName,
    region: item.armRegionName,
    unitPrice: item.retailPrice,
    unitOfMeasure: item.unitOfMeasure,
    reservationTerm: null,
    priceType: 'Consumption',
  }));
}

export async function refreshAnfPrices(region: string): Promise<PriceData[]> {
  const filter = `serviceName eq 'Azure NetApp Files' and armRegionName eq '${region}'`;
  const items = await fetchAzurePrices(filter);

  return items
    .filter(item => item.meterName.includes('Capacity'))
    .map(item => ({
      skuName: item.meterName,
      serviceName: item.serviceName,
      productName: item.productName,
      meterName: item.meterName,
      region: item.armRegionName,
      unitPrice: item.retailPrice,
      unitOfMeasure: item.unitOfMeasure,
      reservationTerm: null,
      priceType: 'Consumption',
    }));
}

async function fetchRegionPrices(region: string): Promise<PriceData[]> {
  const [vmPrices, dcVmPrices, diskPrices, anfPrices] = await Promise.all([
    refreshVmPrices(region),
    refreshDcVmPrices(region),
    refreshDiskPrices(region),
    refreshAnfPrices(region),
  ]);

  return [...vmPrices, ...dcVmPrices, ...diskPrices, ...anfPrices];
}

export async function refreshAllPrices(): Promise<{ total: number; regions: string[] }> {
  const allPrices: PriceData[] = [];
  const successfulRegions: string[] = [];

  console.log(`Fetching prices for ${US_REGIONS.length} regions...`);

  // Fetch all regions in parallel (limit concurrency to 3 to avoid rate limits)
  const batchSize = 3;
  for (let i = 0; i < US_REGIONS.length; i += batchSize) {
    const batch = US_REGIONS.slice(i, i + batchSize);
    console.log(`Fetching batch: ${batch.map(r => r.value).join(', ')}`);

    const results = await Promise.allSettled(
      batch.map(async (region) => {
        const prices = await fetchRegionPrices(region.value);
        console.log(`Fetched ${prices.length} prices for ${region.value}`);
        return { region: region.value, prices };
      })
    );

    for (const result of results) {
      if (result.status === 'fulfilled') {
        allPrices.push(...result.value.prices);
        successfulRegions.push(result.value.region);
      } else {
        console.error('Failed to fetch region prices:', result.reason);
      }
    }
  }

  console.log(`Total prices fetched: ${allPrices.length}. Starting database insert...`);

  // Batch insert all prices at once
  if (allPrices.length > 0) {
    // Insert in smaller chunks to avoid timeout
    const chunkSize = 25;
    for (let i = 0; i < allPrices.length; i += chunkSize) {
      const chunk = allPrices.slice(i, i + chunkSize);
      console.log(`Inserting chunk ${Math.floor(i / chunkSize) + 1}/${Math.ceil(allPrices.length / chunkSize)}`);
      await upsertPricesBatch(chunk);
    }
  }

  console.log('Database insert complete');
  return { total: allPrices.length, regions: successfulRegions };
}
