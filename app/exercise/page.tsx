// app/exercise/page.tsx
"use client";
import { useState, useEffect } from 'react';
import { useAppStore } from '@/store';
import { supabase } from '@/lib/supabase';
import { useRouter } from "next/navigation";

export default function ExercisePage() {
  const { exercisePlan, userStats, setPlans } = useAppStore();
  const [loading, setLoading] = useState(false);
  
  // Active Workout States
  const [activeWorkout, setActiveWorkout] = useState<any | null>(null);
  const [currentExIndex, setCurrentExIndex] = useState(0);
  const [currentSets, setCurrentSets] = useState<{ weight: string, reps: string, done: boolean }[]>([
    { weight: "", reps: "", done: false }
  ]);
  const [restTimer, setRestTimer] = useState(0);
  const [completedExercises, setCompletedExercises] = useState<any[]>([]);

  const router = useRouter();

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Kick user to login if no active session
      if (!session) {
        router.push("/auth");
        return; 
      }

      // ... (Keep the rest of your existing fetchWeightHistory logic here)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      // ...
    };
    
    checkAuthAndFetchData();
  }, [router]);

  // Rest Timer countdown
  useEffect(() => {
    if (restTimer > 0) {
      const timer = setTimeout(() => setRestTimer(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [restTimer]);

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

  const startWorkout = (day: any) => {
    setActiveWorkout(day);
    setCurrentExIndex(0);
    setCompletedExercises([]);
    setCurrentSets([{ weight: "", reps: "", done: false }]);
  };

  const addSet = () => {
    setCurrentSets([...currentSets, { weight: "", reps: "", done: false }]);
  };

  const updateSet = (index: number, field: 'weight' | 'reps', value: string) => {
    const newSets = [...currentSets];
    newSets[index][field] = value;
    setCurrentSets(newSets);
  };

  const completeSet = (index: number) => {
    const newSets = [...currentSets];
    newSets[index].done = true;
    setCurrentSets(newSets);
    setRestTimer(60); // Start 60-second rest
  };

  const nextExercise = async () => {
    // Save current exercise data
    const loggedExercise = {
      name: activeWorkout.exercises[currentExIndex].name,
      sets: currentSets.filter(s => s.done) // Only save completed sets
    };
    
    const updatedCompleted = [...completedExercises, loggedExercise];
    setCompletedExercises(updatedCompleted);

    if (currentExIndex < activeWorkout.exercises.length - 1) {
      setCurrentExIndex(prev => prev + 1);
      setCurrentSets([{ weight: "", reps: "", done: false }]);
      setRestTimer(0);
    } else {
      // Workout Finished! Save to Database
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('workout_logs').insert({
          user_id: user.id,
          workout_day: activeWorkout.day,
          workout_data: updatedCompleted
        });
      }
      setLoading(false);
      setActiveWorkout(null);
      alert("Workout Complete! Great job ⚡");
    }
  };

  if (!exercisePlan) return <div className="p-10 text-center text-white">No plan generated.</div>;

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  // --- ACTIVE WORKOUT MODE ---
  if (activeWorkout) {
    const currentEx = activeWorkout.exercises[currentExIndex];
    const query = currentEx.youtubeSearch || `${currentEx.name} exercise tutorial`;
    const youtubeUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;

    return (
      <div className="max-w-2xl mx-auto animate-in fade-in duration-500">
        <div className="flex justify-between items-center mb-6">
          <button onClick={() => setActiveWorkout(null)} className="text-slate-400 hover:text-white transition text-sm font-bold">
            ← Cancel Workout
          </button>
          <span className="bg-blue-600/20 text-blue-400 px-4 py-1.5 rounded-full text-sm font-bold">
            Exercise {currentExIndex + 1} of {activeWorkout.exercises.length}
          </span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-3xl font-extrabold text-white mb-2">{currentEx.name}</h2>
              <p className="text-blue-400 font-semibold">{currentEx.details}</p>
            </div>
            {restTimer > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/30 text-amber-500 px-4 py-2 rounded-xl text-center">
                <p className="text-xs font-bold uppercase tracking-wider mb-1">Rest</p>
                <p className="text-2xl font-mono font-bold">{restTimer}s</p>
              </div>
            )}
          </div>

          <a href={youtubeUrl} target="_blank" rel="noopener noreferrer" className="inline-flex bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white px-4 py-2 rounded-xl text-sm font-bold transition items-center gap-2 mb-8">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
            Watch Form Tutorial
          </a>

          {/* Active Set Tracker */}
          <div className="space-y-3 mb-8">
            <div className="grid grid-cols-12 gap-4 text-xs font-bold text-slate-400 uppercase tracking-wider px-2">
              <div className="col-span-2">Set</div>
              <div className="col-span-4">kg/lbs</div>
              <div className="col-span-4">Reps</div>
              <div className="col-span-2 text-center">Done</div>
            </div>
            
            {currentSets.map((set, idx) => (
              <div key={idx} className={`grid grid-cols-12 gap-4 items-center p-2 rounded-xl transition ${set.done ? 'bg-emerald-900/20 opacity-50' : 'bg-slate-950/50 border border-slate-800'}`}>
                <div className="col-span-2 font-bold text-slate-300 pl-2">{idx + 1}</div>
                <div className="col-span-4">
                  <input type="number" placeholder="Weight" disabled={set.done} value={set.weight} onChange={e => updateSet(idx, 'weight', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500 disabled:opacity-50" />
                </div>
                <div className="col-span-4">
                  <input type="number" placeholder="Reps" disabled={set.done} value={set.reps} onChange={e => updateSet(idx, 'reps', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500 disabled:opacity-50" />
                </div>
                <div className="col-span-2 flex justify-center">
                  <button onClick={() => completeSet(idx)} disabled={set.done || !set.reps} className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-500 hover:bg-emerald-500 hover:text-white flex items-center justify-center disabled:opacity-30 disabled:hover:bg-emerald-600/20 disabled:hover:text-emerald-500 transition">
                    ✓
                  </button>
                </div>
              </div>
            ))}
            
            <button onClick={addSet} className="w-full py-3 mt-4 text-sm font-bold text-slate-400 hover:text-white border border-dashed border-slate-700 hover:border-slate-500 rounded-xl transition">
              + Add Set
            </button>
          </div>

          <button onClick={nextExercise} disabled={loading} className="w-full bg-blue-600 text-white p-4 rounded-xl font-bold text-lg hover:bg-blue-500 transition shadow-lg shadow-blue-900/50">
            {loading ? 'Saving...' : currentExIndex < activeWorkout.exercises.length - 1 ? 'Next Exercise →' : 'Finish Workout 🏆'}
          </button>
        </div>
      </div>
    );
  }

  // --- STANDARD OVERVIEW MODE ---
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
        {exercisePlan.weeklyRoutine.map((day: any, i: number) => {
          const isToday = day.day === today;
          return (
            <div key={i} className={`bg-slate-900/50 border rounded-2xl overflow-hidden shadow-xl flex flex-col ${isToday ? 'border-blue-500 shadow-blue-900/20' : 'border-slate-800'}`}>
              
              <div className={`p-5 border-b ${isToday ? 'border-blue-900/50 bg-blue-950/30' : 'border-slate-800 bg-slate-900'}`}>
                <div className="flex justify-between items-start mb-1">
                  <h3 className="text-xl font-bold text-white">{day.day} {isToday && <span className="ml-2 text-xs bg-blue-600 text-white px-2 py-1 rounded-full uppercase tracking-wide">Today</span>}</h3>
                </div>
                <p className="text-blue-400 font-medium text-sm mb-4">{day.focus}</p>
                
                {isToday && (
                  <button onClick={() => startWorkout(day)} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition mb-4 shadow-lg shadow-blue-900/30">
                    ▶ Start Workout
                  </button>
                )}

                <div className="flex gap-2 text-xs font-bold">
                  <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded-full">⏱ {day.duration}</span>
                  <span className={`px-3 py-1 rounded-full ${day.intensity === 'High' ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                    🔥 {day.intensity}
                  </span>
                </div>
              </div>
              
              <div className="p-5 flex-1 opacity-80 hover:opacity-100 transition-opacity">
                <ul className="space-y-4">
                  {day.exercises.map((ex: any, idx: number) => {
                    const query = ex.youtubeSearch || `${ex.name} exercise tutorial`;
                    const youtubeUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;

                    return (
                      <li key={idx} className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/50 flex flex-col gap-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-slate-200 font-bold text-base">{ex.name}</h4>
                            <p className="text-slate-400 font-semibold text-xs mt-1">{ex.details}</p>
                          </div>
                          <a href={youtubeUrl} target="_blank" rel="noopener noreferrer" className="bg-slate-800 text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex-shrink-0">
                            Video
                          </a>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}