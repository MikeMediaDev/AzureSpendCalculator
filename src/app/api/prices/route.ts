import { NextResponse } from 'next/server';
import { getPricesForRegion, getLastPriceRefresh } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const region = searchParams.get('region');

    if (!region) {
      // Return metadata about prices
      const lastRefresh = await getLastPriceRefresh();
      return NextResponse.json({
        lastRefresh,
        message: 'Use ?region=<region> to get prices for a specific region',
      });
    }

    const prices = await getPricesForRegion(region);
    return NextResponse.json({ prices, region });
  } catch (error) {
    console.error('Error fetching prices:', error);
    return NextResponse.json({ error: 'Failed to fetch prices' }, { status: 500 });
  }
}
