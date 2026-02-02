'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ScenarioList from '@/components/ScenarioList';
import type { Scenario } from '@/types';

export default function ScenariosPage() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchScenarios = async () => {
    try {
      const response = await fetch('/api/scenarios');
      if (response.ok) {
        const data = await response.json();
        setScenarios(data.scenarios);
      } else {
        setError('Failed to load scenarios');
      }
    } catch {
      setError('Failed to load scenarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScenarios();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this scenario?')) return;

    try {
      const response = await fetch(`/api/scenarios/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setScenarios(scenarios.filter((s) => s.id !== id));
      }
    } catch {
      alert('Failed to delete scenario');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-gray-500">Loading scenarios...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Saved Scenarios</h1>
          <p className="mt-2 text-gray-600">
            View and manage your saved cost calculation scenarios.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          New Calculation
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <ScenarioList scenarios={scenarios} onDelete={handleDelete} />
    </div>
  );
}
