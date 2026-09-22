// app/exercise/page.tsx
"use client";
import { useState } from 'react';
import { useAppStore } from '@/store';

export default function ExercisePage() {
  const { exercisePlan, userStats, setPlans } = useAppStore();
  const [loading, setLoading] = useState(false);

  const handleTooTired = async () => {
    setLoading(true);
    const res = await fetch('/api/generate-plan', {
      method: 'POST',
      body: JSON.stringify({ stats: userStats, isTired: true, currentPlan: exercisePlan })
    });
    const data = await res.json();
    setPlans(data.exercisePlan, data.nutritionPlan);
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Weekly Program</h1>
          <p className="text-slate-400">Your AI-generated exercise routine.</p>
        </div>
        
        <button 
          onClick={handleTooTired} 
          disabled={loading || !exercisePlan}
          className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-6 py-3 rounded-xl font-medium hover:bg-amber-500 hover:text-white transition disabled:opacity-50"
        >
          {loading ? 'Adjusting routine...' : 'I feel too tired today 😩'}
        </button>
      </div>
      
      {exercisePlan ? (
        <div className="bg-slate-900/50 p-6 sm:p-10 rounded-3xl border border-slate-800 shadow-xl">
          <div className="prose prose-invert prose-blue max-w-none whitespace-pre-wrap text-slate-300 leading-relaxed font-medium">
            {exercisePlan}
          </div>
        </div>
      ) : (
        <div className="bg-slate-900/50 p-12 text-center rounded-3xl border border-slate-800">
           <h3 className="text-xl font-bold text-white mb-2">No Program Found</h3>
           <p className="text-slate-400">Please complete onboarding to generate your plan.</p>
        </div>
      )}
    </div>
  );
}