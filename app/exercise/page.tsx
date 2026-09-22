// app/exercise/page.tsx
"use client";
import { useState } from 'react';
import { useAppStore } from '@/store';

export default function ExercisePage() {
  const { exercisePlan, userStats, setPlans, nutritionPlan } = useAppStore();
  const [loading, setLoading] = useState(false);

  const handleTooTired = async () => {
    setLoading(true);
    const res = await fetch('/api/generate-plan', {
      method: 'POST',
      body: JSON.stringify({ 
        stats: userStats, 
        isTired: true, 
        currentPlan: exercisePlan 
      })
    });
    const data = await res.json();
    setPlans(data.exercisePlan, data.nutritionPlan);
    setLoading(false);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Weekly Exercise Program</h1>
        <button 
          onClick={handleTooTired} 
          disabled={loading}
          className="bg-orange-500 text-white px-4 py-2 rounded shadow hover:bg-orange-600"
        >
          {loading ? 'Adjusting...' : 'I feel too tired today 😩'}
        </button>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md whitespace-pre-wrap text-gray-700">
        {exercisePlan || "No plan generated yet. Go to onboarding!"}
      </div>
    </div>
  );
}