'use client';

import { useState } from 'react';
import { US_REGIONS, WORKLOAD_TYPES, ANF_SERVICE_LEVELS, RESERVATION_TERMS } from '@/lib/constants';
import type { CalculatorInput, CalculationResult, WorkloadType, AnfServiceLevel, ReservationTerm } from '@/types';

interface CalculatorProps {
  onCalculate: (result: CalculationResult, input: CalculatorInput) => void;
  initialInput?: Partial<CalculatorInput>;
  isLoading?: boolean;
}

export default function Calculator({ onCalculate, initialInput, isLoading }: CalculatorProps) {
  const [region, setRegion] = useState(initialInput?.region || 'eastus');
  const [concurrentUsers, setConcurrentUsers] = useState(initialInput?.concurrentUsers || 100);
  const [workloadType, setWorkloadType] = useState<WorkloadType>(initialInput?.workloadType || 'medium');
  const [anfServiceLevel, setAnfServiceLevel] = useState<AnfServiceLevel>(initialInput?.anfServiceLevel || 'Standard');
  const [reservationTerm, setReservationTerm] = useState<ReservationTerm>(initialInput?.reservationTerm || '3year');
  const [error, setError] = useState<string | null>(null);
  const [calculating, setCalculating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCalculating(true);

    try {
      const input: CalculatorInput = {
        region,
        concurrentUsers,
        workloadType,
        anfServiceLevel,
        reservationTerm,
      };

      const response = await fetch('/api/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Calculation failed');
      }

      const result: CalculationResult = await response.json();
      onCalculate(result, input);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setCalculating(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Calculate Azure Costs</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-1">
            Region
          </label>
          <select
            id="region"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading || calculating}
          >
            {US_REGIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="users" className="block text-sm font-medium text-gray-700 mb-1">
            Concurrent Users
          </label>
          <input
            id="users"
            type="number"
            min="1"
            value={concurrentUsers}
            onChange={(e) => setConcurrentUsers(parseInt(e.target.value, 10) || 1)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading || calculating}
          />
        </div>

        <div>
          <label htmlFor="workload" className="block text-sm font-medium text-gray-700 mb-1">
            Workload Type
          </label>
          <select
            id="workload"
            value={workloadType}
            onChange={(e) => setWorkloadType(e.target.value as WorkloadType)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading || calculating}
          >
            {WORKLOAD_TYPES.map((w) => (
              <option key={w.value} value={w.value}>
                {w.label} - {w.description}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="anf" className="block text-sm font-medium text-gray-700 mb-1">
            ANF Service Level
          </label>
          <select
            id="anf"
            value={anfServiceLevel}
            onChange={(e) => setAnfServiceLevel(e.target.value as AnfServiceLevel)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading || calculating}
          >
            {ANF_SERVICE_LEVELS.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label} - {l.description}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="reservation" className="block text-sm font-medium text-gray-700 mb-1">
            VM Reservation Term
          </label>
          <select
            id="reservation"
            value={reservationTerm}
            onChange={(e) => setReservationTerm(e.target.value as ReservationTerm)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading || calculating}
          >
            {RESERVATION_TERMS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label} - {t.description}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading || calculating}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {calculating ? 'Calculating...' : 'Calculate'}
      </button>
    </form>
  );
}
