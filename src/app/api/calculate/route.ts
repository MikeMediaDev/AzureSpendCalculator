import { NextResponse } from 'next/server';
import { calculate } from '@/lib/calculator';
import type { CalculatorInput, WorkloadType, AnfServiceLevel, ReservationTerm } from '@/types';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate input
    const { region, concurrentUsers, workloadType, anfServiceLevel, reservationTerm } = body;

    if (!region || typeof region !== 'string') {
      return NextResponse.json({ error: 'Invalid region' }, { status: 400 });
    }

    if (!concurrentUsers || typeof concurrentUsers !== 'number' || concurrentUsers < 1) {
      return NextResponse.json({ error: 'Invalid concurrent users' }, { status: 400 });
    }

    if (!['light', 'medium', 'heavy'].includes(workloadType)) {
      return NextResponse.json({ error: 'Invalid workload type' }, { status: 400 });
    }

    if (!['Standard', 'Premium'].includes(anfServiceLevel)) {
      return NextResponse.json({ error: 'Invalid ANF service level' }, { status: 400 });
    }

    // Default to 3-year if not specified
    const validReservationTerms = ['payg', '1year', '3year'];
    const selectedReservationTerm = validReservationTerms.includes(reservationTerm)
      ? reservationTerm as ReservationTerm
      : '3year';

    const input: CalculatorInput = {
      region,
      concurrentUsers,
      workloadType: workloadType as WorkloadType,
      anfServiceLevel: anfServiceLevel as AnfServiceLevel,
      reservationTerm: selectedReservationTerm,
    };

    const result = await calculate(input);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Calculation error:', error);
    const message = error instanceof Error ? error.message : 'Calculation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
