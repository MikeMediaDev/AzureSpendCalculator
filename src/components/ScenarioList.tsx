'use client';

import Link from 'next/link';
import type { Scenario } from '@/types';
import { US_REGIONS } from '@/lib/constants';

interface ScenarioListProps {
  scenarios: Scenario[];
  onDelete?: (id: number) => void;
}

function getRegionLabel(value: string): string {
  const region = US_REGIONS.find((r) => r.value === value);
  return region?.label || value;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function ScenarioList({ scenarios, onDelete }: ScenarioListProps) {
  if (scenarios.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
        No saved scenarios yet. Create one from the calculator.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Region
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Users
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Monthly Cost
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Updated
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {scenarios.map((scenario) => (
            <tr key={scenario.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <Link
                  href={`/scenarios/${scenario.id}`}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  {scenario.name}
                </Link>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {getRegionLabel(scenario.region)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                {scenario.concurrentUsers}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                {scenario.calculationResult
                  ? formatCurrency(scenario.calculationResult.totalMonthly)
                  : '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(scenario.updatedAt)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                <Link
                  href={`/scenarios/${scenario.id}`}
                  className="text-blue-600 hover:text-blue-800"
                >
                  View
                </Link>
                {scenario.calculationResult && (
                  <a
                    href={`/api/scenarios/${scenario.id}/export`}
                    className="text-green-600 hover:text-green-800"
                  >
                    Export
                  </a>
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(scenario.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
