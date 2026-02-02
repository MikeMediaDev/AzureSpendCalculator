'use client';

interface ProfitAnalysisProps {
  isvCharge: number;
  concurrentUsers: number;
  totalMonthlyCost: number;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export default function ProfitAnalysis({ isvCharge, concurrentUsers, totalMonthlyCost }: ProfitAnalysisProps) {
  const totalRevenue = isvCharge * concurrentUsers;
  const grossProfit = totalRevenue - totalMonthlyCost;
  const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">Profit Analysis</h2>
      </div>

      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Description
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Calculation
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Monthly
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          <tr>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              Total Revenue
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
              {formatCurrency(isvCharge)} x {concurrentUsers} users
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
              {formatCurrency(totalRevenue)}
            </td>
          </tr>
          <tr>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              Total Monthly Cost
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
              From cost breakdown
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 text-right font-medium">
              ({formatCurrency(totalMonthlyCost)})
            </td>
          </tr>
        </tbody>
        <tfoot className="bg-gray-50">
          <tr>
            <td className="px-6 py-4 text-sm font-medium text-gray-900">
              Gross Profit
            </td>
            <td className="px-6 py-4 text-sm text-gray-500 text-right">
              {profitMargin.toFixed(1)}% margin
            </td>
            <td className={`px-6 py-4 text-sm font-bold text-right ${grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(grossProfit)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
