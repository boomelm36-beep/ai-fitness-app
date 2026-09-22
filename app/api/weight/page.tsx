// app/weight/page.tsx
"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function WeightTracker() {
  const [weight, setWeight] = useState('');
  const [logs, setLogs] = useState<any[]>([]);

  // Fetch weight logs from Supabase
  const fetchLogs = async () => {
    const { data } = await supabase
      .from('weight_logs')
      .select('*')
      .order('logged_at', { ascending: false });
    if (data) setLogs(data);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Save new weight entry to Supabase
  const handleSave = async () => {
    if (!weight) return;
    await supabase.from('weight_logs').insert([{ weight: parseFloat(weight) }]);
    setWeight('');
    fetchLogs();
  };

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Track Weight Today</h1>
      
      <div className="flex gap-2 mb-6">
        <input 
          type="number" 
          placeholder="Weight (kg)" 
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          className="p-2 border rounded w-full text-black"
        />
        <button onClick={handleSave} className="bg-blue-600 text-white px-4 py-2 rounded">
          Save
        </button>
      </div>

      <h2 className="font-semibold mb-2">History</h2>
      <ul className="bg-white rounded shadow divide-y">
        {logs.map((log) => (
          <li key={log.id} className="p-3 flex justify-between">
            <span>{log.weight} kg</span>
            <span className="text-gray-400 text-sm">
              {new Date(log.logged_at).toLocaleDateString()}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}