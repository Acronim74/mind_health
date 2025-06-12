// src/components/admin/GroupSettings.tsx

"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Switch } from '@/components/ui/switch';

interface GroupSettingsProps {
  groupId: number;
}

export default function GroupSettings({ groupId }: GroupSettingsProps) {
  const router = useRouter();
  const [useAI, setUseAI] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/admin/groups/${groupId}/settings`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })
      .then((res) => res.json())
      .then((data) => {
        setUseAI(data?.use_ai_analysis ?? false);
      })
      .catch(console.error);
  }, [groupId]);

  const toggleAI = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/groups/${groupId}/settings`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ use_ai_analysis: !useAI }),
        }
      );
      if (!res.ok) throw new Error('Ошибка при сохранении параметра AI');
      setUseAI(!useAI);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded shadow">
      <h3 className="text-lg font-semibold mb-2">Параметры группы</h3>
      <div className="flex items-center space-x-3">
        <Switch checked={useAI} onCheckedChange={toggleAI} disabled={loading} />
        <label>Анализ через ИИ</label>
      </div>
      {useAI && (
        <button
          onClick={() => router.push(`/admin/groups/${groupId}/prompt`)}
          className="mt-4 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded"
        >
          Настроить промт ИИ для группы
        </button>
      )}
      {error && <p className="mt-2 text-red-500">{error}</p>}
    </div>
  );
}