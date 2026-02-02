import { NextResponse } from 'next/server';
import { getAllScenarios, createScenario } from '@/lib/db';
import type { WorkloadType, AnfServiceLevel, ReservationTerm } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const scenarios = await getAllScenarios();
    return NextResponse.json({ scenarios });
  } catch (error) {
    console.error('Error fetching scenarios:', error);
    return NextResponse.json({ error: 'Failed to fetch scenarios' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate input
    const { name, region, concurrentUsers, workloadType, anfServiceLevel, reservationTerm, calculationResult } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Invalid name' }, { status: 400 });
    }

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

    const scenario = await createScenario({
      name,
      region,
      concurrentUsers,
      workloadType: workloadType as WorkloadType,
      anfServiceLevel: anfServiceLevel as AnfServiceLevel,
      reservationTerm: selectedReservationTerm,
      calculationResult: calculationResult || undefined,
    });

    return NextResponse.json({ scenario }, { status: 201 });
  } catch (error) {
    console.error('Error creating scenario:', error);
    return NextResponse.json({ error: 'Failed to create scenario' }, { status: 500 });
  }
}
