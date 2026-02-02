'use client';

import type { CalculationResult } from '@/types';

interface ResultsTableProps {
  result: CalculationResult;
  concurrentUsers: number;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export default function ResultsTable({ result, concurrentUsers }: ResultsTableProps) {
  const perUserMonthly = result.totalMonthly / concurrentUsers;
  const perUserAnnual = result.totalAnnual / concurrentUsers;
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">Cost Breakdown</h2>
      </div>

      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-500">VMs Required:</span>
            <span className="ml-2 font-medium text-gray-900">{result.metadata.vmCount}</span>
          </div>
          <div>
            <span className="text-gray-500">Users per VM:</span>
            <span className="ml-2 font-medium text-gray-900">{result.metadata.usersPerVm}</span>
          </div>
          <div>
            <span className="text-gray-500">ANF Capacity:</span>
            <span className="ml-2 font-medium text-gray-900">{result.metadata.anfCapacityTiB} TiB</span>
          </div>
        </div>
      </div>

      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Item
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              SKU
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Quantity
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Unit Price
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Monthly
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {result.lineItems.map((item, index) => (
            <tr key={index}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {item.name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {item.sku}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                {item.quantity}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                {formatCurrency(item.unitPrice)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                {formatCurrency(item.monthlyPrice)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-gray-50">
          <tr>
            <td colSpan={4} className="px-6 py-4 text-sm font-medium text-gray-900 text-right">
              Total Monthly
            </td>
            <td className="px-6 py-4 text-sm font-bold text-gray-900 text-right">
              {formatCurrency(result.totalMonthly)}
            </td>
          </tr>
          <tr>
            <td colSpan={4} className="px-6 py-4 text-sm font-medium text-gray-900 text-right">
              Total Annual
            </td>
            <td className="px-6 py-4 text-sm font-bold text-blue-600 text-right">
              {formatCurrency(result.totalAnnual)}
            </td>
          </tr>
          <tr className="border-t-2 border-gray-300">
            <td colSpan={4} className="px-6 py-4 text-sm font-medium text-gray-900 text-right">
              Per User Monthly
            </td>
            <td className="px-6 py-4 text-sm font-bold text-gray-900 text-right">
              {formatCurrency(perUserMonthly)}
            </td>
          </tr>
          <tr>
            <td colSpan={4} className="px-6 py-4 text-sm font-medium text-gray-900 text-right">
              Per User Annual
            </td>
            <td className="px-6 py-4 text-sm font-bold text-blue-600 text-right">
              {formatCurrency(perUserAnnual)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
