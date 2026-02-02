import { NextResponse } from 'next/server';
import { getScenario, updateScenario, deleteScenario } from '@/lib/db';
import type { WorkloadType, AnfServiceLevel, ReservationTerm } from '@/types';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const scenarioId = parseInt(id, 10);

    if (isNaN(scenarioId)) {
      return NextResponse.json({ error: 'Invalid scenario ID' }, { status: 400 });
    }

    const scenario = await getScenario(scenarioId);

    if (!scenario) {
      return NextResponse.json({ error: 'Scenario not found' }, { status: 404 });
    }

    return NextResponse.json({ scenario });
  } catch (error) {
    console.error('Error fetching scenario:', error);
    return NextResponse.json({ error: 'Failed to fetch scenario' }, { status: 500 });
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const scenarioId = parseInt(id, 10);

    if (isNaN(scenarioId)) {
      return NextResponse.json({ error: 'Invalid scenario ID' }, { status: 400 });
    }

    const body = await request.json();
    const { name, region, concurrentUsers, workloadType, anfServiceLevel, reservationTerm, calculationResult } = body;

    // Validate fields if provided
    if (name !== undefined && typeof name !== 'string') {
      return NextResponse.json({ error: 'Invalid name' }, { status: 400 });
    }

    if (region !== undefined && typeof region !== 'string') {
      return NextResponse.json({ error: 'Invalid region' }, { status: 400 });
    }

    if (concurrentUsers !== undefined && (typeof concurrentUsers !== 'number' || concurrentUsers < 1)) {
      return NextResponse.json({ error: 'Invalid concurrent users' }, { status: 400 });
    }

    if (workloadType !== undefined && !['light', 'medium', 'heavy'].includes(workloadType)) {
      return NextResponse.json({ error: 'Invalid workload type' }, { status: 400 });
    }

    if (anfServiceLevel !== undefined && !['Standard', 'Premium'].includes(anfServiceLevel)) {
      return NextResponse.json({ error: 'Invalid ANF service level' }, { status: 400 });
    }

    if (reservationTerm !== undefined && !['payg', '1year', '3year'].includes(reservationTerm)) {
      return NextResponse.json({ error: 'Invalid reservation term' }, { status: 400 });
    }

    const scenario = await updateScenario(scenarioId, {
      name,
      region,
      concurrentUsers,
      workloadType: workloadType as WorkloadType | undefined,
      anfServiceLevel: anfServiceLevel as AnfServiceLevel | undefined,
      reservationTerm: reservationTerm as ReservationTerm | undefined,
      calculationResult,
    });

    if (!scenario) {
      return NextResponse.json({ error: 'Scenario not found' }, { status: 404 });
    }

    return NextResponse.json({ scenario });
  } catch (error) {
    console.error('Error updating scenario:', error);
    return NextResponse.json({ error: 'Failed to update scenario' }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const scenarioId = parseInt(id, 10);

    if (isNaN(scenarioId)) {
      return NextResponse.json({ error: 'Invalid scenario ID' }, { status: 400 });
    }

    const deleted = await deleteScenario(scenarioId);

    if (!deleted) {
      return NextResponse.json({ error: 'Scenario not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting scenario:', error);
    return NextResponse.json({ error: 'Failed to delete scenario' }, { status: 500 });
  }
}
