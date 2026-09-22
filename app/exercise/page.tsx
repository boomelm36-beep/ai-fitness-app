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
            {/* Image Placeholder - Uses Unsplash nature/fitness queries */}
            <div className="h-32 bg-slate-800 relative">
              <img 
                src={`https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&q=80&auto=format&fit=crop&sig=${i}`} 
                alt="Workout" 
                className="object-cover w-full h-full opacity-60 mix-blend-overlay"
              />
              <div className="absolute inset-0 p-4 flex flex-col justify-end bg-gradient-to-t from-slate-900 to-transparent">
                <h3 className="text-xl font-bold text-white">{day.day}</h3>
                <p className="text-blue-400 font-medium text-sm">{day.focus}</p>
              </div>
            </div>
            
            <div className="p-5 flex-1">
              <div className="flex gap-2 mb-4 text-xs font-bold">
                <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded-full">⏱ {day.duration}</span>
                <span className={`px-3 py-1 rounded-full ${day.intensity === 'High' ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                  🔥 {day.intensity}
                </span>
              </div>
              <ul className="space-y-2">
                {day.exercises.map((ex: string, idx: number) => (
                  <li key={idx} className="text-slate-300 text-sm flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span> {ex}
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