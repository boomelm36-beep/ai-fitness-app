// app/nutrition/page.tsx
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store";
import { supabase } from "@/lib/supabase";

interface NutritionLog {
  id: string;
  food_name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  logged_date: string;
}

export default function NutritionPage() {
  const router = useRouter();
  const { nutritionPlan, userStats } = useAppStore();

  const [logs, setLogs] = useState<NutritionLog[]>([]);
  const [waterGlasses, setWaterGlasses] = useState(0);
  const [loading, setLoading] = useState(true);

  // Manual meal logging state
  const [foodName, setFoodName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [isLogging, setIsLogging] = useState(false);

  // 1. Auth check and fetch today's logged meals
  useEffect(() => {
    const fetchTodayData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/auth");
        return;
      }

      const userId = session.user.id;
      const today = new Date().toISOString().split("T")[0];

      const { data: mealLogs } = await supabase
        .from("nutrition_logs")
        .select("*")
        .eq("user_id", userId)
        .eq("logged_date", today)
        .order("created_at", { ascending: true });

      if (mealLogs) setLogs(mealLogs);
      setLoading(false);
    };

    fetchTodayData();
  }, [router]);

  // 2. Handlers for Meal Logging
  const handleLogMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodName || !calories) return;

    setIsLogging(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      const today = new Date().toISOString().split("T")[0];
      const newLog = {
        user_id: user.id,
        food_name: foodName,
        calories: parseInt(calories) || 0,
        protein: parseInt(protein) || 0,
        carbs: parseInt(carbs) || 0,
        fat: parseInt(fat) || 0,
        logged_date: today,
      };

      const { data, error } = await supabase
        .from("nutrition_logs")
        .insert(newLog)
        .select()
        .single();

      if (error) throw error;
      if (data) setLogs((prev) => [...prev, data]);

      // Reset Form
      setFoodName("");
      setCalories("");
      setProtein("");
      setCarbs("");
      setFat("");
    } catch (err: any) {
      alert(err.message || "Failed to log meal");
    } finally {
      setIsLogging(false);
    }
  };

  const handleDeleteLog = async (id: string) => {
    const { error } = await supabase.from("nutrition_logs").delete().eq("id", id);
    if (!error) {
      setLogs((prev) => prev.filter((log) => log.id !== id));
    }
  };

  // 3. Calculated Macro Totals
  const totalCalories = logs.reduce((sum, item) => sum + (item.calories || 0), 0);
  const totalProtein = logs.reduce((sum, item) => sum + (item.protein || 0), 0);
  const totalCarbs = logs.reduce((sum, item) => sum + (item.carbs || 0), 0);
  const totalFat = logs.reduce((sum, item) => sum + (item.fat || 0), 0);

  const targetCalories = nutritionPlan?.targetCalories || 2000;
  const targetProtein = nutritionPlan?.targetProtein || 150;
  const targetCarbs = nutritionPlan?.targetCarbs || 200;
  const targetFat = nutritionPlan?.targetFat || 65;

  const isIF = userStats?.eatingMethods?.includes("Intermittent Fasting");

  if (loading) {
    return <div className="min-h-[70vh] flex items-center justify-center text-slate-400 font-bold">Loading Nutrition Protocol...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white">🥗 Nutrition Protocol</h1>
          <p className="text-slate-400 text-sm mt-1">Track macros, log meals, and view your personalized dietary plan.</p>
        </div>
        <Link href="/dashboard" className="text-slate-400 hover:text-white text-sm font-medium transition self-start sm:self-auto">
          ← Back to Dashboard
        </Link>
      </div>

      {/* Feature 2: "Scan My Fridge" Banner Shortcut */}
      <Link 
        href="/fridge" 
        className="group flex items-center justify-between bg-gradient-to-r from-purple-900/40 via-blue-900/40 to-slate-900/80 border border-purple-500/30 hover:border-purple-400/70 p-5 rounded-2xl shadow-lg transition duration-300"
      >
        <div className="flex items-center gap-4">
          <div className="bg-purple-600/20 p-3 rounded-xl border border-purple-500/30 text-3xl group-hover:scale-110 transition">
            📸
          </div>
          <div>
            <h3 className="text-white font-bold text-base flex items-center gap-2">
              Scan My Fridge AI <span className="bg-purple-500/20 text-purple-300 text-[10px] uppercase font-black px-2 py-0.5 rounded-full border border-purple-500/40">New</span>
            </h3>
            <p className="text-slate-400 text-xs mt-0.5">Take a photo of raw ingredients to instantly build macros-compliant recipes.</p>
          </div>
        </div>
        <span className="text-purple-400 group-hover:text-purple-300 font-bold text-sm hidden sm:inline-flex items-center gap-1 transition">
          Scan Now →
        </span>
      </Link>

      {/* Intermittent Fasting Schedule Card (Conditional) */}
      {isIF && (
        <div className="bg-gradient-to-r from-amber-900/20 to-orange-900/20 border border-amber-500/30 p-5 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⏳</span>
            <div>
              <h3 className="text-amber-400 font-bold text-sm">Intermittent Fasting Active</h3>
              <p className="text-slate-300 text-xs mt-0.5">
                {userStats?.ifSchedule ? `Eating Window: ${userStats.ifSchedule}` : "Scheduled fasting protocol enabled."}
              </p>
            </div>
          </div>
          <Link href="/onboarding" className="text-xs text-amber-400 hover:underline font-semibold">
            Edit Window
          </Link>
        </div>
      )}

      {/* Daily Macro Progress Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Calories", current: totalCalories, target: targetCalories, unit: "kcal", color: "bg-blue-500", textColor: "text-blue-400" },
          { label: "Protein", current: totalProtein, target: targetProtein, unit: "g", color: "bg-emerald-500", textColor: "text-emerald-400" },
          { label: "Carbs", current: totalCarbs, target: targetCarbs, unit: "g", color: "bg-amber-500", textColor: "text-amber-400" },
          { label: "Fat", current: totalFat, target: targetFat, unit: "g", color: "bg-purple-500", textColor: "text-purple-400" },
        ].map((macro, idx) => {
          const percent = Math.min(Math.round((macro.current / macro.target) * 100), 100);
          return (
            <div key={idx} className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-3">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{macro.label}</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className={`text-2xl font-extrabold ${macro.textColor}`}>{macro.current}</span>
                  <span className="text-xs text-slate-500">/ {macro.target} {macro.unit}</span>
                </div>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                <div className={`${macro.color} h-full transition-all duration-500`} style={{ width: `${percent}%` }}></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* AI Daily Plan Overview */}
      {nutritionPlan ? (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">📋 AI Meal Plan Overview</h2>
            <p className="text-slate-400 text-xs">Tailored to your goal: <span className="text-white font-semibold">{userStats?.goal || "Fitness"}</span></p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {nutritionPlan.meals?.map((meal: any, idx: number) => (
              <div key={idx} className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800/80 space-y-3">
                <div className="flex justify-between items-center border-b border-slate-800/60 pb-3">
                  <h3 className="font-bold text-white text-base">{meal.title || `Meal ${idx + 1}`}</h3>
                  <span className="text-xs text-slate-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">{meal.time || "Scheduled"}</span>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed">{meal.description}</p>
                <div className="flex gap-2 text-[11px] font-bold text-slate-400 pt-1">
                  <span>🔥 {meal.calories || 0} kcal</span>
                  <span>• P: {meal.protein || 0}g</span>
                  <span>• C: {meal.carbs || 0}g</span>
                  <span>• F: {meal.fat || 0}g</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 text-center">
          <p className="text-slate-400 text-sm">No AI plan found. Complete onboarding or check-in to generate a tailored protocol.</p>
        </div>
      )}

      {/* Meal Logger & Logged Items Section */}
      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Left Column: Manual Meal Entry Form */}
        <div className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>➕</span> Log Food / Meal
          </h2>

          <form onSubmit={handleLogMeal} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Food Name</label>
              <input
                type="text"
                placeholder="e.g. Grilled Chicken Salad"
                value={foodName}
                onChange={(e) => setFoodName(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl p-3 text-white text-sm outline-none focus:border-blue-500 transition"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Calories (kcal)</label>
                <input
                  type="number"
                  placeholder="350"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-700 rounded-xl p-3 text-white text-sm outline-none focus:border-blue-500 transition"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Protein (g)</label>
                <input
                  type="number"
                  placeholder="30"
                  value={protein}
                  onChange={(e) => setProtein(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-700 rounded-xl p-3 text-white text-sm outline-none focus:border-blue-500 transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Carbs (g)</label>
                <input
                  type="number"
                  placeholder="15"
                  value={carbs}
                  onChange={(e) => setCarbs(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-700 rounded-xl p-3 text-white text-sm outline-none focus:border-blue-500 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Fat (g)</label>
                <input
                  type="number"
                  placeholder="10"
                  value={fat}
                  onChange={(e) => setFat(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-700 rounded-xl p-3 text-white text-sm outline-none focus:border-blue-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLogging}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold p-3.5 rounded-xl transition shadow-lg shadow-blue-900/30 disabled:opacity-50 mt-2 text-sm"
            >
              {isLogging ? "Logging..." : "Log Meal"}
            </button>
          </form>
        </div>

        {/* Right Column: Logged Meals History + Hydration */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Hydration Tracker */}
          <div className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">💧</span>
              <div>
                <h3 className="text-white font-bold text-base">Hydration Tracker</h3>
                <p className="text-slate-400 text-xs">Target: 8-10 glasses per day</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setWaterGlasses((prev) => Math.max(0, prev - 1))}
                className="w-10 h-10 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl border border-slate-700 transition"
              >
                -
              </button>
              <span className="text-xl font-extrabold text-blue-400 min-w-[2.5rem] text-center">
                {waterGlasses} <span className="text-xs text-slate-400">g</span>
              </span>
              <button
                onClick={() => setWaterGlasses((prev) => prev + 1)}
                className="w-10 h-10 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition shadow-lg shadow-blue-900/30"
              >
                +
              </button>
            </div>
          </div>

          {/* Today's Logged Items List */}
          <div className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800 space-y-4">
            <h2 className="text-lg font-bold text-white">Today's Logged Meals</h2>

            {logs.length === 0 ? (
              <p className="text-slate-500 text-xs py-6 text-center border border-dashed border-slate-800 rounded-2xl">
                No meals logged today yet. Use the form or scan your fridge!
              </p>
            ) : (
              <div className="space-y-3">
                {logs.map((log) => (
                  <div key={log.id} className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 flex items-center justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-white text-sm">{log.food_name}</h4>
                      <p className="text-slate-400 text-xs mt-0.5">
                        {log.calories} kcal | P: {log.protein}g | C: {log.carbs}g | F: {log.fat}g
                      </p>
                    </div>

                    <button
                      onClick={() => handleDeleteLog(log.id)}
                      className="text-slate-500 hover:text-red-400 text-xs font-bold transition p-2 hover:bg-slate-900 rounded-lg"
                      title="Delete log"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}