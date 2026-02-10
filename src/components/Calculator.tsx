'use client';

import { useState } from 'react';
import { US_REGIONS, WORKLOAD_TYPES, ANF_SERVICE_LEVELS, RESERVATION_TERMS, SUPPORT_LEVELS, MIN_CONCURRENT_USERS, SQL_DB_SIZES, SQL_DB_DEFAULT_STORAGE_GB } from '@/lib/constants';
import type { CalculatorInput, CalculationResult, WorkloadType, AnfServiceLevel, ReservationTerm, SupportLevel, SqlDbSize } from '@/types';

interface CalculatorProps {
  onCalculate: (result: CalculationResult, input: CalculatorInput) => void;
  initialInput?: Partial<CalculatorInput>;
  isLoading?: boolean;
  isvCharge: number;
  onIsvChargeChange: (value: number) => void;
  supportLevel: SupportLevel;
  onSupportLevelChange: (value: SupportLevel) => void;
  supportHourlyRate: number;
  onSupportHourlyRateChange: (value: number) => void;
}

export default function Calculator({ onCalculate, initialInput, isLoading, isvCharge, onIsvChargeChange, supportLevel, onSupportLevelChange, supportHourlyRate, onSupportHourlyRateChange }: CalculatorProps) {
  const [isvChargeInput, setIsvChargeInput] = useState(String(isvCharge || 0));
  const [supportHourlyRateInput, setSupportHourlyRateInput] = useState(String(supportHourlyRate || 0));
  const [region, setRegion] = useState(initialInput?.region || 'eastus');
  const [concurrentUsersInput, setConcurrentUsersInput] = useState(String(initialInput?.concurrentUsers || MIN_CONCURRENT_USERS));
  const [workloadType, setWorkloadType] = useState<WorkloadType>(initialInput?.workloadType || 'medium');
  const [anfServiceLevel, setAnfServiceLevel] = useState<AnfServiceLevel>(initialInput?.anfServiceLevel || 'Standard');
  const [reservationTerm, setReservationTerm] = useState<ReservationTerm>(initialInput?.reservationTerm || '3year');
  const [sqlDbEnabled, setSqlDbEnabled] = useState(initialInput?.sqlDbEnabled || false);
  const [sqlDbSize, setSqlDbSize] = useState<SqlDbSize>(initialInput?.sqlDbSize || 'small');
  const [sqlDbStorageGb, setSqlDbStorageGb] = useState(initialInput?.sqlDbStorageGb || SQL_DB_DEFAULT_STORAGE_GB);
  const [sqlDbStorageGbInput, setSqlDbStorageGbInput] = useState(String(initialInput?.sqlDbStorageGb || SQL_DB_DEFAULT_STORAGE_GB));
  const [error, setError] = useState<string | null>(null);
  const [calculating, setCalculating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCalculating(true);

    // Validate concurrent users from input in case blur hasn't fired yet
    const parsed = parseInt(concurrentUsersInput, 10);
    const validatedUsers = Math.max(MIN_CONCURRENT_USERS, parsed || MIN_CONCURRENT_USERS);
    setConcurrentUsersInput(String(validatedUsers));

    try {
      const input: CalculatorInput = {
        region,
        concurrentUsers: validatedUsers,
        workloadType,
        anfServiceLevel,
        reservationTerm,
        sqlDbEnabled,
        sqlDbSize: sqlDbEnabled ? sqlDbSize : null,
        sqlDbStorageGb: sqlDbEnabled ? sqlDbStorageGb : null,
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
            Concurrent Users (min {MIN_CONCURRENT_USERS})
          </label>
          <input
            id="users"
            type="number"
            min={MIN_CONCURRENT_USERS}
            value={concurrentUsersInput}
            onChange={(e) => setConcurrentUsersInput(e.target.value)}
            onBlur={(e) => {
              const parsed = parseInt(e.target.value, 10);
              const validated = Math.max(MIN_CONCURRENT_USERS, parsed || MIN_CONCURRENT_USERS);
              setConcurrentUsersInput(String(validated));
            }}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading || calculating}
          />
        </div>

        <div>
          <label htmlFor="isvCharge" className="block text-sm font-medium text-gray-700 mb-1">
            ISV Charge (per user)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-500">$</span>
            <input
              id="isvCharge"
              type="number"
              min={0}
              step="0.01"
              value={isvChargeInput}
              onChange={(e) => setIsvChargeInput(e.target.value)}
              onBlur={(e) => {
                const parsed = parseFloat(e.target.value);
                const validated = Math.max(0, parsed || 0);
                onIsvChargeChange(validated);
                setIsvChargeInput(validated.toFixed(2));
              }}
              className="w-full rounded-md border border-gray-300 pl-7 pr-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading || calculating}
            />
          </div>
        </div>

        <div>
          <label htmlFor="supportLevel" className="block text-sm font-medium text-gray-700 mb-1">
            Support Level
          </label>
          <select
            id="supportLevel"
            value={supportLevel}
            onChange={(e) => onSupportLevelChange(e.target.value as SupportLevel)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading || calculating}
          >
            {SUPPORT_LEVELS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label} - {s.description}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="supportHourlyRate" className="block text-sm font-medium text-gray-700 mb-1">
            Support Hourly Rate
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-500">$</span>
            <input
              id="supportHourlyRate"
              type="number"
              min={0}
              step="0.01"
              value={supportHourlyRateInput}
              onChange={(e) => setSupportHourlyRateInput(e.target.value)}
              onBlur={(e) => {
                const parsed = parseFloat(e.target.value);
                const validated = Math.max(0, parsed || 0);
                onSupportHourlyRateChange(validated);
                setSupportHourlyRateInput(validated.toFixed(2));
              }}
              className="w-full rounded-md border border-gray-300 pl-7 pr-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading || calculating}
            />
          </div>
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

        <div>
          <label htmlFor="sqlDbEnabled" className="block text-sm font-medium text-gray-700 mb-1">
            Include Azure SQL Database
          </label>
          <div className="flex items-center space-x-3">
            <button
              type="button"
              role="switch"
              aria-checked={sqlDbEnabled}
              onClick={() => setSqlDbEnabled(!sqlDbEnabled)}
              disabled={isLoading || calculating}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                sqlDbEnabled ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  sqlDbEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
            <span className="text-sm text-gray-600">
              {sqlDbEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        </div>

        {sqlDbEnabled && (
          <div>
            <label htmlFor="sqlDbSize" className="block text-sm font-medium text-gray-700 mb-1">
              SQL Database Size
            </label>
            <select
              id="sqlDbSize"
              value={sqlDbSize || 'small'}
              onChange={(e) => setSqlDbSize(e.target.value as SqlDbSize)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading || calculating}
            >
              {SQL_DB_SIZES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label} - {s.description}
                </option>
              ))}
            </select>
          </div>
        )}

        {sqlDbEnabled && (
          <div>
            <label htmlFor="sqlDbStorageGb" className="block text-sm font-medium text-gray-700 mb-1">
              SQL Database Storage (GB)
            </label>
            <input
              id="sqlDbStorageGb"
              type="number"
              min={1}
              value={sqlDbStorageGbInput}
              onChange={(e) => setSqlDbStorageGbInput(e.target.value)}
              onBlur={(e) => {
                const parsed = parseInt(e.target.value, 10);
                const validated = Math.max(1, parsed || SQL_DB_DEFAULT_STORAGE_GB);
                setSqlDbStorageGb(validated);
                setSqlDbStorageGbInput(String(validated));
              }}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading || calculating}
            />
          </div>
        )}
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
