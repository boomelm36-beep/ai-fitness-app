// app/nutrition/page.tsx
"use client";
import { useState, useEffect } from "react";
import { useAppStore } from "@/store";
import { supabase } from "@/lib/supabase";

export default function NutritionPage() {
  const { nutritionPlan } = useAppStore();
  const [foodInput, setFoodInput] = useState("");
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase.from('nutrition_logs')
      .select('*')
      .eq('user_id', user.id)
      .eq('logged_date', today);
    if (data) setLogs(data);
  };

  const logFood = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodInput) return;
    setLoading(true);

    try {
      // 1. Get AI estimation
      const aiRes = await fetch('/api/estimate-food', {
        method: 'POST', body: JSON.stringify({ food: foodInput })
      });
      const aiData = await aiRes.json();

      // 2. Save to Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('nutrition_logs').insert({
          user_id: user.id,
          food_name: aiData.foodName,
          calories: aiData.calories
        }).select().single();
        
        if (data) setLogs(prev => [...prev, data]);
      }
      setFoodInput("");
    } catch (error) {
      alert("Failed to log food");
    } finally {
      setLoading(false);
    }
  };

  if (!nutritionPlan) return <div className="p-10 text-center text-white">No plan generated.</div>;

  const { macros, dailyCalories, meals } = nutritionPlan;
  const consumedCalories = logs.reduce((sum, log) => sum + log.calories, 0);
  const progressPercent = Math.min((consumedCalories / dailyCalories) * 100, 100);

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in duration-700 space-y-10">
      
      {/* Header & Daily Progress */}
      <div>
        <h1 className="text-4xl font-extrabold text-white mb-6">Nutrition Protocol</h1>
        <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 shadow-xl">
          <div className="flex justify-between text-sm font-bold mb-3">
            <span className="text-slate-400">Consumed: <span className="text-white">{consumedCalories}</span></span>
            <span className="text-slate-400">Target: <span className="text-white">{dailyCalories} kcal</span></span>
          </div>
          <div className="h-4 w-full bg-slate-800 rounded-full overflow-hidden">
            <div style={{ width: `${progressPercent}%` }} className={`h-full transition-all duration-1000 ${progressPercent > 100 ? 'bg-red-500' : 'bg-blue-500'}`}></div>
          </div>
        </div>
      </div>

      {/* AI Food Logger */}
      <div className="bg-slate-900/80 p-6 rounded-3xl border border-slate-700">
        <h2 className="text-xl font-bold text-white mb-4">What did you eat today?</h2>
        <form onSubmit={logFood} className="flex gap-4">
          <input 
            type="text" 
            value={foodInput}
            onChange={(e) => setFoodInput(e.target.value)}
            placeholder="e.g., 7-11 chicken breast and rice"
            className="flex-1 bg-slate-950/50 border border-slate-700 text-white rounded-xl p-4 outline-none focus:border-blue-500"
          />
          <button disabled={loading} type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-8 rounded-xl font-bold transition disabled:opacity-50">
            {loading ? 'Estimating...' : 'Log It'}
          </button>
        </form>
        
        {/* Today's Logged Items */}
        {logs.length > 0 && (
          <div className="mt-6 space-y-2">
            {logs.map(log => (
              <div key={log.id} className="flex justify-between items-center bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                <span className="text-slate-300 font-medium">{log.food_name}</span>
                <span className="text-emerald-400 font-bold">{log.calories} kcal</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI Suggested Menu */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-6">AI Suggested Menu (Thai Options)</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {meals.map((meal: any, i: number) => (
            <div key={i} className="bg-slate-900/30 border border-slate-800 rounded-2xl p-6 hover:bg-slate-900/60 transition">
              <span className="text-emerald-400 text-xs font-bold tracking-wider uppercase mb-2 block">{meal.time} - {meal.calories} kcal</span>
              <h3 className="text-lg font-bold text-white mb-2">{meal.name}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{meal.desc}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}