import { NextResponse } from 'next/server';
import { refreshAllPrices } from '@/lib/azure-prices';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow up to 60 seconds for price refresh

export async function POST() {
  try {
    const result = await refreshAllPrices();
    return NextResponse.json({
      success: true,
      message: `Refreshed ${result.total} prices across ${result.regions.length} regions`,
      ...result,
    });
  } catch (error) {
    console.error('Price refresh error:', error);
    return NextResponse.json({ error: 'Failed to refresh prices' }, { status: 500 });
  }
}
