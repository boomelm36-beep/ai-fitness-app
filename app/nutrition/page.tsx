// app/nutrition/page.tsx
"use client";
import { useState, useEffect, useRef } from "react";
import { useAppStore } from "@/store";
import { supabase } from "@/lib/supabase";

export default function NutritionPage() {
  const { nutritionPlan } = useAppStore();
  const [foodInput, setFoodInput] = useState("");
  const [logs, setLogs] = useState<any[]>([]);
  const [waterGlasses, setWaterGlasses] = useState(0);
  const [loading, setLoading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchDailyData();
  }, []);

  const fetchDailyData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const today = new Date().toISOString().split('T')[0];
    
    // Fetch Food
    const { data: foodData } = await supabase.from('nutrition_logs')
      .select('*').eq('user_id', user.id).eq('logged_date', today);
    if (foodData) setLogs(foodData);

    // Fetch Water
    const { data: waterData } = await supabase.from('water_logs')
      .select('glasses').eq('user_id', user.id).eq('logged_date', today).maybeSingle();
    if (waterData) setWaterGlasses(waterData.glasses);
  };

  const updateWater = async (increment: number) => {
    const newTotal = Math.max(0, waterGlasses + increment);
    setWaterGlasses(newTotal); // Optimistic UI update

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const today = new Date().toISOString().split('T')[0];
      await supabase.from('water_logs').upsert({
        user_id: user.id,
        logged_date: today,
        glasses: newTotal
      }, { onConflict: 'user_id,logged_date' });
    }
  };

  const logFoodText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodInput) return;
    await processFoodLog({ food: foodInput });
    setFoodInput("");
  };

  const handleImageCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      await processFoodLog({ image: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const processFoodLog = async (payload: { food?: string, image?: string }) => {
    setLoading(true);
    try {
      const res = await fetch('/api/estimate-food', {
        method: 'POST', 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const aiData = await res.json();
      if (aiData.error) throw new Error(aiData.error);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('nutrition_logs').insert({
          user_id: user.id,
          food_name: aiData.foodName,
          calories: aiData.calories,
          protein: aiData.protein || 0,
          carbs: aiData.carbs || 0,
          fat: aiData.fat || 0
        }).select().single();
        if (data) setLogs(prev => [...prev, data]);
      }
    } catch (error) {
      alert("Failed to analyze food. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!nutritionPlan) return <div className="p-10 text-center text-white">No plan generated.</div>;

  const { macros, dailyCalories, meals } = nutritionPlan;
  
  // Calculate Totals
  const consumedCalories = logs.reduce((sum, log) => sum + log.calories, 0);
  const consumedProtein = logs.reduce((sum, log) => sum + (log.protein || 0), 0);
  const consumedCarbs = logs.reduce((sum, log) => sum + (log.carbs || 0), 0);
  const consumedFat = logs.reduce((sum, log) => sum + (log.fat || 0), 0);

  const calPercent = Math.min((consumedCalories / dailyCalories) * 100, 100);
  const proPercent = Math.min((consumedProtein / macros.protein) * 100, 100);
  const carbPercent = Math.min((consumedCarbs / macros.carbs) * 100, 100);
  const fatPercent = Math.min((consumedFat / macros.fat) * 100, 100);

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in duration-700 space-y-8">
      
      {/* Tracker Headers */}
      <div className="grid md:grid-cols-3 gap-6">
        
        {/* Main Calories & Macros */}
        <div className="md:col-span-2 bg-slate-900/80 p-6 rounded-3xl border border-slate-800 shadow-xl">
          <h2 className="text-xl font-bold text-white mb-4">Daily Targets</h2>
          
          <div className="mb-6">
            <div className="flex justify-between text-sm font-bold mb-2">
              <span className="text-slate-400">Calories</span>
              <span className="text-white">{consumedCalories} / {dailyCalories} kcal</span>
            </div>
            <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden">
              <div style={{ width: `${calPercent}%` }} className="h-full bg-blue-500 transition-all duration-1000"></div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-slate-400">Protein</span>
                <span className="text-emerald-400">{consumedProtein}/{macros.protein}g</span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden"><div style={{ width: `${proPercent}%` }} className="h-full bg-emerald-500 transition-all"></div></div>
            </div>
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-slate-400">Carbs</span>
                <span className="text-amber-400">{consumedCarbs}/{macros.carbs}g</span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden"><div style={{ width: `${carbPercent}%` }} className="h-full bg-amber-500 transition-all"></div></div>
            </div>
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-slate-400">Fat</span>
                <span className="text-purple-400">{consumedFat}/{macros.fat}g</span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden"><div style={{ width: `${fatPercent}%` }} className="h-full bg-purple-500 transition-all"></div></div>
            </div>
          </div>
        </div>

        {/* Water Tracker */}
        <div className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col justify-center items-center text-center">
          <h2 className="text-lg font-bold text-white mb-1">Hydration</h2>
          <p className="text-slate-400 text-xs mb-4">Goal: 8+ glasses</p>
          
          <div className="text-4xl mb-4 font-bold text-cyan-400">
            {waterGlasses} <span className="text-xl text-slate-500">/ 8</span>
          </div>
          
          <div className="flex gap-3">
            <button onClick={() => updateWater(-1)} disabled={waterGlasses === 0} className="w-10 h-10 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-bold hover:bg-slate-700 disabled:opacity-50">-</button>
            <button onClick={() => updateWater(1)} className="px-6 h-10 rounded-full bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 font-bold hover:bg-cyan-600 hover:text-white transition flex items-center gap-2">
              <span>💧</span> Add
            </button>
          </div>
        </div>
      </div>

      {/* AI Food Logger */}
      <div className="bg-slate-900/80 p-6 sm:p-8 rounded-3xl border border-slate-700 relative overflow-hidden">
        {loading && (
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="text-blue-400 font-bold animate-pulse flex items-center gap-2">
              <span className="text-2xl">👀</span> Analyzing nutrition...
            </div>
          </div>
        )}

        <h2 className="text-xl font-bold text-white mb-4">Log a Meal</h2>
        
        <form onSubmit={logFoodText} className="flex gap-3">
          <input 
            type="text" value={foodInput} onChange={(e) => setFoodInput(e.target.value)}
            placeholder="e.g., Pad Thai with shrimp"
            className="flex-1 bg-slate-950/50 border border-slate-700 text-white rounded-xl p-4 outline-none focus:border-blue-500 transition"
          />
          <input type="file" accept="image/*" capture="environment" ref={fileInputRef} onChange={handleImageCapture} className="hidden"/>
          <button type="button" onClick={() => fileInputRef.current?.click()} className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-5 rounded-xl border border-slate-700 transition" title="Snap a photo">📸</button>
          <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-8 rounded-xl font-bold transition">Log It</button>
        </form>
        
        {/* Logged Items with Macros */}
        {logs.length > 0 && (
          <div className="mt-6 space-y-3">
            {logs.map(log => (
              <div key={log.id} className="flex flex-col sm:flex-row justify-between sm:items-center bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 gap-3">
                <span className="text-slate-200 font-medium">{log.food_name}</span>
                <div className="flex gap-2 text-xs font-bold items-center">
                  <span className="bg-slate-900 text-emerald-400 px-2 py-1 rounded-md border border-slate-700">P: {log.protein || 0}g</span>
                  <span className="bg-slate-900 text-amber-400 px-2 py-1 rounded-md border border-slate-700">C: {log.carbs || 0}g</span>
                  <span className="bg-slate-900 text-purple-400 px-2 py-1 rounded-md border border-slate-700">F: {log.fat || 0}g</span>
                  <span className="text-white ml-2">{log.calories} kcal</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI Suggested Menu */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-6">AI Suggested Menu</h2>
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