import { NextResponse } from 'next/server';
import { refreshAllPrices } from '@/lib/azure-prices';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow up to 60 seconds for price refresh

export async function POST() {
  console.log('Starting price refresh...');
  console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
  console.log('DATABASE_SUPABASE_URL exists:', !!process.env.DATABASE_SUPABASE_URL);

  try {
    const result = await refreshAllPrices();
    console.log('Price refresh completed:', result);
    return NextResponse.json({
      success: true,
      message: `Refreshed ${result.total} prices across ${result.regions.length} regions`,
      ...result,
    });
  } catch (error) {
    console.error('Price refresh error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorCode = (error as { code?: string })?.code || 'NO_CODE';
    return NextResponse.json({
      error: 'Failed to refresh prices',
      details: errorMessage,
      code: errorCode
    }, { status: 500 });
  }
}
