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
      body: JSON.stringify({ stats: userStats, isTired: true })
    });
    const data = await res.json();
    setPlans(data.exercisePlan, data.nutritionPlan);
    setLoading(false);
  };

  if (!exercisePlan) return <div className="p-10 text-center text-white">No plan generated.</div>;

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-700">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-4xl font-extrabold text-white mb-2">Training Protocol</h1>
          <p className="text-slate-400">{exercisePlan.overview}</p>
        </div>
        <button 
          onClick={handleTooTired} disabled={loading}
          className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-6 py-3 rounded-xl font-bold hover:bg-amber-500 hover:text-slate-900 transition"
        >
          {loading ? 'Recalculating...' : 'Too tired today 😩'}
        </button>
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {exercisePlan.weeklyRoutine.map((day: any, i: number) => (
          <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col">
            
            <div className="p-5 border-b border-slate-800 bg-slate-900">
              <h3 className="text-xl font-bold text-white">{day.day}</h3>
              <p className="text-blue-400 font-medium text-sm mb-3">{day.focus}</p>
              <div className="flex gap-2 text-xs font-bold">
                <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded-full">⏱ {day.duration}</span>
                <span className={`px-3 py-1 rounded-full ${day.intensity === 'High' ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                  🔥 {day.intensity}
                </span>
              </div>
            </div>
            
            <div className="p-5 flex-1">
              <ul className="space-y-4">
                {day.exercises.map((ex: any, idx: number) => (
                  <li key={idx} className="flex gap-4 items-center bg-slate-950/50 p-3 rounded-xl border border-slate-800/50 hover:border-slate-600 transition">
                    <img 
                      src={`https://image.pollinations.ai/prompt/${encodeURIComponent(ex.imagePrompt + " fitness instruction realistic")}?width=150&height=150&nologo=true`} 
                      alt={ex.name} 
                      className="w-16 h-16 rounded-lg object-cover bg-slate-800"
                      loading="lazy"
                    />
                    <div>
                      <h4 className="text-slate-200 font-bold text-sm">{ex.name}</h4>
                      <p className="text-slate-400 text-xs mt-1">{ex.details}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}