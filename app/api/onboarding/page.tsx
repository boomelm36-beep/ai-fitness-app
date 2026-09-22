// app/onboarding/page.tsx
"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store';

export default function Onboarding() {
  const [stats, setStats] = useState({ age: '', weight: '', height: '', goal: '' });
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setUserStats, setPlans } = useAppStore();

  const generatePlan = async () => {
    setLoading(true);
    setUserStats(stats);
    
    const res = await fetch('/api/generate-plan', {
      method: 'POST',
      body: JSON.stringify({ stats, isTired: false })
    });
    const data = await res.json();
    
    setPlans(data.exercisePlan, data.nutritionPlan);
    setLoading(false);
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Your Profile</h1>
        <input placeholder="Age" className="w-full mb-4 p-2 border rounded text-black" onChange={e => setStats({...stats, age: e.target.value})} />
        <input placeholder="Weight (kg)" className="w-full mb-4 p-2 border rounded text-black" onChange={e => setStats({...stats, weight: e.target.value})} />
        <input placeholder="Height (cm)" className="w-full mb-4 p-2 border rounded text-black" onChange={e => setStats({...stats, height: e.target.value})} />
        <input placeholder="Goal (e.g. Lose fat, Build muscle)" className="w-full mb-6 p-2 border rounded text-black" onChange={e => setStats({...stats, goal: e.target.value})} />
        
        <button onClick={generatePlan} disabled={loading} className="w-full bg-blue-600 text-white p-3 rounded-lg font-semibold hover:bg-blue-700">
          {loading ? 'AI is building your plan...' : 'Generate Plan'}
        </button>
      </div>
    </div>
  );
}