import { NextResponse } from 'next/server';
import { getScenario } from '@/lib/db';

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

    if (!scenario.calculationResult) {
      return NextResponse.json({ error: 'Scenario has no calculation result' }, { status: 400 });
    }

    // Build CSV content
    const lines: string[] = [];

    // Header info
    lines.push(`Scenario: ${scenario.name}`);
    lines.push(`Region: ${scenario.region}`);
    lines.push(`Concurrent Users: ${scenario.concurrentUsers}`);
    lines.push(`Workload Type: ${scenario.workloadType}`);
    lines.push(`ANF Service Level: ${scenario.anfServiceLevel}`);
    lines.push('');

    // Metadata
    lines.push('Calculated Resources');
    lines.push(`VMs Required: ${scenario.calculationResult.metadata.vmCount}`);
    lines.push(`Users Per VM: ${scenario.calculationResult.metadata.usersPerVm}`);
    lines.push(`ANF Capacity (TiB): ${scenario.calculationResult.metadata.anfCapacityTiB}`);
    lines.push('');

    // Line items header
    lines.push('Item,SKU,Quantity,Unit Price ($/month),Monthly Total ($)');

    // Line items
    for (const item of scenario.calculationResult.lineItems) {
      const row = [
        `"${item.name}"`,
        item.sku,
        item.quantity,
        item.unitPrice.toFixed(2),
        item.monthlyPrice.toFixed(2),
      ];
      lines.push(row.join(','));
    }

    // Totals
    lines.push('');
    lines.push(`Total Monthly,$${scenario.calculationResult.totalMonthly.toFixed(2)}`);
    lines.push(`Total Annual,$${scenario.calculationResult.totalAnnual.toFixed(2)}`);

    const csv = lines.join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="scenario-${scenarioId}.csv"`,
      },
    });
  } catch (error) {
    console.error('Error exporting scenario:', error);
    return NextResponse.json({ error: 'Failed to export scenario' }, { status: 500 });
  }
}
