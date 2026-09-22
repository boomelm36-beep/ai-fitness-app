// app/nutrition/page.tsx
"use client";
import { useAppStore } from "@/store";

export default function NutritionPage() {
  const { nutritionPlan } = useAppStore();

  if (!nutritionPlan) return <div className="p-10 text-center text-white">No plan generated.</div>;

  const { macros, dailyCalories, meals } = nutritionPlan;
  const totalMacros = macros.protein + macros.carbs + macros.fat;

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in duration-700">
      <h1 className="text-4xl font-extrabold text-white mb-2">Nutrition Protocol</h1>
      <p className="text-slate-400 mb-8">Daily target: <strong className="text-white">{dailyCalories} kcal</strong></p>
      
      {/* Macro Infographic */}
      <div className="bg-slate-900/50 p-8 rounded-3xl border border-slate-800 shadow-xl mb-10">
        <h2 className="text-xl font-bold text-white mb-6">Macro Breakdown</h2>
        
        {/* CSS Progress Bar */}
        <div className="h-4 w-full bg-slate-800 rounded-full flex overflow-hidden mb-6">
          <div style={{ width: `${(macros.protein / totalMacros) * 100}%` }} className="bg-blue-500"></div>
          <div style={{ width: `${(macros.carbs / totalMacros) * 100}%` }} className="bg-emerald-500"></div>
          <div style={{ width: `${(macros.fat / totalMacros) * 100}%` }} className="bg-amber-500"></div>
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="w-3 h-3 rounded-full bg-blue-500 mx-auto mb-2"></div>
            <p className="text-slate-400 text-sm">Protein</p>
            <p className="text-2xl font-bold text-white">{macros.protein}g</p>
          </div>
          <div>
            <div className="w-3 h-3 rounded-full bg-emerald-500 mx-auto mb-2"></div>
            <p className="text-slate-400 text-sm">Carbs</p>
            <p className="text-2xl font-bold text-white">{macros.carbs}g</p>
          </div>
          <div>
            <div className="w-3 h-3 rounded-full bg-amber-500 mx-auto mb-2"></div>
            <p className="text-slate-400 text-sm">Fat</p>
            <p className="text-2xl font-bold text-white">{macros.fat}g</p>
          </div>
        </div>
      </div>

      {/* Meal Timeline */}
      <h2 className="text-2xl font-bold text-white mb-6">Daily Menu</h2>
      <div className="space-y-4">
        {meals.map((meal: any, i: number) => (
          <div key={i} className="flex flex-col sm:flex-row bg-slate-900/30 border border-slate-800 rounded-2xl overflow-hidden hover:bg-slate-900/60 transition">
            <div className="sm:w-48 bg-slate-800 p-6 flex flex-col justify-center items-center border-b sm:border-b-0 sm:border-r border-slate-700">
              <span className="text-emerald-400 text-sm font-bold tracking-wider uppercase mb-1">{meal.time}</span>
              <span className="text-2xl font-black text-white">{meal.calories}</span>
              <span className="text-slate-500 text-xs">kcal</span>
            </div>
            <div className="p-6 flex-1 flex flex-col justify-center">
              <h3 className="text-xl font-bold text-white mb-1">{meal.name}</h3>
              <p className="text-slate-400 text-sm">{meal.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}