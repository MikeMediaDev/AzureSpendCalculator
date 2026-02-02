'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Calculator from '@/components/Calculator';
import ResultsTable from '@/components/ResultsTable';
import ProfitAnalysis from '@/components/ProfitAnalysis';
import ExportButton from '@/components/ExportButton';
import { US_REGIONS, SUPPORT_LEVELS } from '@/lib/constants';
import type { Scenario, CalculationResult, CalculatorInput, SupportLevel } from '@/types';

interface PageProps {
  params: Promise<{ id: string }>;
}

function getRegionLabel(value: string): string {
  const region = US_REGIONS.find((r) => r.value === value);
  return region?.label || value;
}

export default function ScenarioPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isvCharge, setIsvCharge] = useState(0);
  const [supportLevel, setSupportLevel] = useState<SupportLevel>('low');
  const [supportHourlyRate, setSupportHourlyRate] = useState(0);

  useEffect(() => {
    const fetchScenario = async () => {
      try {
        const response = await fetch(`/api/scenarios/${id}`);
        if (response.ok) {
          const data = await response.json();
          setScenario(data.scenario);
          setIsvCharge(Number(data.scenario.isvCharge) || 0);
          setSupportLevel(data.scenario.supportLevel || 'low');
          setSupportHourlyRate(Number(data.scenario.supportHourlyRate) || 0);
        } else if (response.status === 404) {
          setError('Scenario not found');
        } else {
          setError('Failed to load scenario');
        }
      } catch {
        setError('Failed to load scenario');
      } finally {
        setLoading(false);
      }
    };

    fetchScenario();
  }, [id]);

  const handleRecalculate = async (result: CalculationResult, input: CalculatorInput) => {
    try {
      const response = await fetch(`/api/scenarios/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...input,
          isvCharge,
          supportLevel,
          supportHourlyRate,
          calculationResult: result,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setScenario(data.scenario);
        setIsEditing(false);
      }
    } catch {
      alert('Failed to update scenario');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this scenario?')) return;

    try {
      const response = await fetch(`/api/scenarios/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/scenarios');
      }
    } catch {
      alert('Failed to delete scenario');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-gray-500">Loading scenario...</div>
      </div>
    );
  }

  if (error || !scenario) {
    return (
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error || 'Scenario not found'}
        </div>
        <Link href="/scenarios" className="text-blue-600 hover:text-blue-800">
          Back to scenarios
        </Link>
      </div>
    );
  }

  const input: CalculatorInput = {
    region: scenario.region,
    concurrentUsers: scenario.concurrentUsers,
    workloadType: scenario.workloadType,
    anfServiceLevel: scenario.anfServiceLevel,
    reservationTerm: scenario.reservationTerm,
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <Link
            href="/scenarios"
            className="text-sm text-blue-600 hover:text-blue-800 mb-2 inline-block"
          >
            &larr; Back to scenarios
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{scenario.name}</h1>
          <div className="mt-2 text-gray-600 space-x-4">
            <span>{getRegionLabel(scenario.region)}</span>
            <span>&bull;</span>
            <span>{scenario.concurrentUsers} users</span>
            <span>&bull;</span>
            <span>{scenario.workloadType} workload</span>
            <span>&bull;</span>
            <span>ANF {scenario.anfServiceLevel}</span>
          </div>
        </div>
        <div className="space-x-2">
          {scenario.calculationResult && (
            <ExportButton
              result={scenario.calculationResult}
              input={input}
              scenarioName={scenario.name}
            />
          )}
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-4 py-2 text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50"
          >
            {isEditing ? 'Cancel' : 'Edit'}
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2 text-red-600 border border-red-600 rounded-md hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      </div>

      {isEditing && (
        <Calculator
          onCalculate={handleRecalculate}
          initialInput={input}
          isvCharge={isvCharge}
          onIsvChargeChange={setIsvCharge}
          supportLevel={supportLevel}
          onSupportLevelChange={setSupportLevel}
          supportHourlyRate={supportHourlyRate}
          onSupportHourlyRateChange={setSupportHourlyRate}
        />
      )}

      {scenario.calculationResult && (
        <>
          <ResultsTable result={scenario.calculationResult} concurrentUsers={scenario.concurrentUsers} />
          {(isvCharge > 0 || supportHourlyRate > 0) && (
            <ProfitAnalysis
              isvCharge={isvCharge}
              concurrentUsers={scenario.concurrentUsers}
              totalMonthlyCost={scenario.calculationResult.totalMonthly}
              supportHoursPerUser={SUPPORT_LEVELS.find(s => s.value === supportLevel)?.hoursPerUser || 0}
              supportHourlyRate={supportHourlyRate}
            />
          )}
        </>
      )}

      {!scenario.calculationResult && !isEditing && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
          This scenario has no calculation results. Click Edit to recalculate.
        </div>
      )}
    </div>
  );
}
