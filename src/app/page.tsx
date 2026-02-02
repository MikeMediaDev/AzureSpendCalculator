'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Calculator from '@/components/Calculator';
import ResultsTable from '@/components/ResultsTable';
import ExportButton from '@/components/ExportButton';
import type { CalculationResult, CalculatorInput } from '@/types';

export default function Home() {
  const router = useRouter();
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [input, setInput] = useState<CalculatorInput | null>(null);
  const [saving, setSaving] = useState(false);
  const [scenarioName, setScenarioName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshStatus, setRefreshStatus] = useState<{ success: boolean; message: string } | null>(null);

  const handleRefreshPrices = async () => {
    setRefreshing(true);
    setRefreshStatus(null);
    try {
      const response = await fetch('/api/prices/refresh', { method: 'POST' });
      const data = await response.json();
      if (response.ok) {
        setRefreshStatus({ success: true, message: data.message });
      } else {
        setRefreshStatus({ success: false, message: data.error || 'Failed to refresh prices' });
      }
    } catch {
      setRefreshStatus({ success: false, message: 'Network error refreshing prices' });
    } finally {
      setRefreshing(false);
    }
  };

  const handleCalculate = (calcResult: CalculationResult, calcInput: CalculatorInput) => {
    setResult(calcResult);
    setInput(calcInput);
  };

  const handleSave = async () => {
    if (!result || !input || !scenarioName.trim()) return;

    setSaving(true);
    try {
      const response = await fetch('/api/scenarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: scenarioName.trim(),
          ...input,
          calculationResult: result,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setShowSaveDialog(false);
        setScenarioName('');
        router.push(`/scenarios/${data.scenario.id}`);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Azure Cost Calculator</h1>
          <p className="mt-2 text-gray-600">
            Calculate costs for Windows Server VMs with user profile storage on Azure NetApp Files.
          </p>
        </div>
        <button
          onClick={handleRefreshPrices}
          disabled={refreshing}
          className="inline-flex items-center px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
        >
          {refreshing ? 'Refreshing...' : 'Refresh Prices'}
        </button>
      </div>
      {refreshStatus && (
        <div className={`p-3 rounded-md text-sm ${refreshStatus.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {refreshStatus.message}
        </div>
      )}

      <Calculator onCalculate={handleCalculate} />

      {result && input && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Results</h2>
            <div className="space-x-2">
              <ExportButton result={result} input={input} />
              <button
                onClick={() => setShowSaveDialog(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Save Scenario
              </button>
            </div>
          </div>

          <ResultsTable result={result} />
        </div>
      )}

      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Save Scenario</h3>
            <input
              type="text"
              value={scenarioName}
              onChange={(e) => setScenarioName(e.target.value)}
              placeholder="Enter scenario name..."
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              autoFocus
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowSaveDialog(false);
                  setScenarioName('');
                }}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!scenarioName.trim() || saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
