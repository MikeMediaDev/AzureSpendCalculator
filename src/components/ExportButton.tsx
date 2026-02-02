'use client';

import type { CalculationResult, CalculatorInput } from '@/types';

interface ExportButtonProps {
  result: CalculationResult;
  input: CalculatorInput;
  scenarioName?: string;
}

export default function ExportButton({ result, input, scenarioName }: ExportButtonProps) {
  const handleExport = () => {
    const lines: string[] = [];

    // Header info
    if (scenarioName) {
      lines.push(`Scenario: ${scenarioName}`);
    }
    lines.push(`Region: ${input.region}`);
    lines.push(`Concurrent Users: ${input.concurrentUsers}`);
    lines.push(`Workload Type: ${input.workloadType}`);
    lines.push(`ANF Service Level: ${input.anfServiceLevel}`);
    lines.push('');

    // Metadata
    lines.push('Calculated Resources');
    lines.push(`VMs Required: ${result.metadata.vmCount}`);
    lines.push(`Users Per VM: ${result.metadata.usersPerVm}`);
    lines.push(`ANF Capacity (TiB): ${result.metadata.anfCapacityTiB}`);
    lines.push('');

    // Line items header
    lines.push('Item,SKU,Quantity,Unit Price ($/month),Monthly Total ($)');

    // Line items
    for (const item of result.lineItems) {
      const row = [
        `"${item.name}"`,
        item.sku,
        item.quantity,
        Number(item.unitPrice).toFixed(2),
        Number(item.monthlyPrice).toFixed(2),
      ];
      lines.push(row.join(','));
    }

    // Totals
    lines.push('');
    lines.push(`Total Monthly,$${Number(result.totalMonthly).toFixed(2)}`);
    lines.push(`Total Annual,$${Number(result.totalAnnual).toFixed(2)}`);

    const csv = lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = scenarioName
      ? `${scenarioName.toLowerCase().replace(/\s+/g, '-')}.csv`
      : 'azure-cost-estimate.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleExport}
      className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
    >
      <svg
        className="w-4 h-4 mr-2"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
        />
      </svg>
      Export CSV
    </button>
  );
}
