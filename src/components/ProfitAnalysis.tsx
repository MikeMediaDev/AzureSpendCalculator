'use client';

interface ProfitAnalysisProps {
  isvCharge: number;
  concurrentUsers: number;
  totalMonthlyCost: number;
  supportHoursPerUser: number;
  supportHourlyRate: number;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export default function ProfitAnalysis({ isvCharge, concurrentUsers, totalMonthlyCost, supportHoursPerUser, supportHourlyRate }: ProfitAnalysisProps) {
  const totalRevenue = isvCharge * concurrentUsers;
  const totalSupportHours = concurrentUsers * supportHoursPerUser;
  const supportCost = totalSupportHours * supportHourlyRate;
  const totalCosts = totalMonthlyCost + supportCost;
  const grossProfit = totalRevenue - totalCosts;
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
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Annual
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
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
              {formatCurrency(totalRevenue * 12)}
            </td>
          </tr>
          <tr>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              Azure Infrastructure Cost
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
              From cost breakdown
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 text-right font-medium">
              ({formatCurrency(totalMonthlyCost)})
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 text-right font-medium">
              ({formatCurrency(totalMonthlyCost * 12)})
            </td>
          </tr>
          {supportCost > 0 && (
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                Support Cost
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                {totalSupportHours.toFixed(1)} hrs x {formatCurrency(supportHourlyRate)}/hr
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 text-right font-medium">
                ({formatCurrency(supportCost)})
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 text-right font-medium">
                ({formatCurrency(supportCost * 12)})
              </td>
            </tr>
          )}
          {supportCost > 0 && (
            <tr className="bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                Total Costs
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 text-right font-medium">
                ({formatCurrency(totalCosts)})
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 text-right font-medium">
                ({formatCurrency(totalCosts * 12)})
              </td>
            </tr>
          )}
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
            <td className={`px-6 py-4 text-sm font-bold text-right ${grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(grossProfit * 12)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
