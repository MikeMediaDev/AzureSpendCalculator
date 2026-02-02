import { AZURE_PRICES_API_URL, US_REGIONS, VM_SKU, DISK_SKU, RESERVATION_TERM } from './constants';
import { upsertPrice } from './db';

interface AzurePriceApiItem {
  skuName: string;
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

export async function refreshVmPrices(region: string): Promise<number> {
  // Fetch 3-year reserved VM prices for D4as_v5 with Linux (for Hybrid Benefit)
  const filter = `serviceName eq 'Virtual Machines' and armSkuName eq '${VM_SKU}' and armRegionName eq '${region}' and priceType eq 'Reservation' and reservationTerm eq '${RESERVATION_TERM}'`;

  const items = await fetchAzurePrices(filter);
  let count = 0;

  for (const item of items) {
    // Skip Windows prices - we use Hybrid Benefit
    if (item.productName.includes('Windows')) {
      continue;
    }

    await upsertPrice({
      skuName: item.skuName,
      serviceName: item.serviceName,
      productName: item.productName,
      meterName: item.meterName,
      region: item.armRegionName,
      unitPrice: item.retailPrice,
      unitOfMeasure: item.unitOfMeasure,
      reservationTerm: item.reservationTerm,
      priceType: item.type,
    });
    count++;
  }

  return count;
}

export async function refreshDiskPrices(region: string): Promise<number> {
  // Fetch managed disk prices for E10 LRS
  const filter = `serviceName eq 'Storage' and armRegionName eq '${region}' and meterName eq '${DISK_SKU}'`;

  const items = await fetchAzurePrices(filter);
  let count = 0;

  for (const item of items) {
    await upsertPrice({
      skuName: item.skuName || DISK_SKU,
      serviceName: item.serviceName,
      productName: item.productName,
      meterName: item.meterName,
      region: item.armRegionName,
      unitPrice: item.retailPrice,
      unitOfMeasure: item.unitOfMeasure,
      reservationTerm: null,
      priceType: 'Consumption',
    });
    count++;
  }

  return count;
}

export async function refreshAnfPrices(region: string): Promise<number> {
  // Fetch Azure NetApp Files prices
  const filter = `serviceName eq 'Azure NetApp Files' and armRegionName eq '${region}'`;

  const items = await fetchAzurePrices(filter);
  let count = 0;

  for (const item of items) {
    // Only capture Standard and Premium capacity prices
    if (!item.meterName.includes('Capacity')) {
      continue;
    }

    await upsertPrice({
      skuName: item.meterName,
      serviceName: item.serviceName,
      productName: item.productName,
      meterName: item.meterName,
      region: item.armRegionName,
      unitPrice: item.retailPrice,
      unitOfMeasure: item.unitOfMeasure,
      reservationTerm: null,
      priceType: 'Consumption',
    });
    count++;
  }

  return count;
}

export async function refreshAllPrices(): Promise<{ total: number; regions: string[] }> {
  let total = 0;
  const regions: string[] = [];

  for (const region of US_REGIONS) {
    try {
      const vmCount = await refreshVmPrices(region.value);
      const diskCount = await refreshDiskPrices(region.value);
      const anfCount = await refreshAnfPrices(region.value);

      total += vmCount + diskCount + anfCount;
      regions.push(region.value);
    } catch (error) {
      console.error(`Failed to refresh prices for ${region.value}:`, error);
    }
  }

  return { total, regions };
}
