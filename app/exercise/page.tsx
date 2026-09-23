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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-white mb-2">Training Protocol</h1>
          <p className="text-slate-400">{exercisePlan.overview}</p>
        </div>
        <button 
          onClick={handleTooTired} disabled={loading}
          className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-6 py-3 rounded-xl font-bold hover:bg-amber-500 hover:text-slate-900 transition whitespace-nowrap"
        >
          {loading ? 'Recalculating...' : 'Too tired today 😩'}
        </button>
      </div>
      
      <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
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
                {day.exercises.map((ex: any, idx: number) => {
                  const query = ex.youtubeSearch || `${ex.name} exercise tutorial`;
                  const youtubeUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;

                  return (
                    <li key={idx} className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/50 hover:border-slate-600 transition flex flex-col gap-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-slate-200 font-bold text-base">{ex.name}</h4>
                          <p className="text-blue-500 font-semibold text-xs mt-1">{ex.details}</p>
                        </div>
                        <a 
                          href={youtubeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 flex-shrink-0"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
                          Watch
                        </a>
                      </div>
                      
                      {ex.steps && ex.steps.length > 0 && (
                        <ol className="list-decimal list-outside ml-4 space-y-1.5 mt-1">
                          {ex.steps.map((step: string, stepIdx: number) => (
                            <li key={stepIdx} className="text-slate-400 text-sm leading-relaxed pr-2">{step}</li>
                          ))}
                        </ol>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}