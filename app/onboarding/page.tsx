// app/onboarding/page.tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAppStore } from "@/store";

const EQUIPMENT_OPTIONS = ["Treadmill", "Dumbbell", "Kettlebell", "Barbell", "Resistance Bands", "Pull-up Bar"];
const FOOD_OPTIONS = ["7-11 (Convenience Store)", "Street Food / Made-to-order", "Food Delivery (Grab/Line Man)", "Home Cooking"];

export default function Onboarding() {
  const [stats, setStats] = useState({ 
    age: "", weight: "", height: "", goal: "", equipment: [] as string[], swimmingPool: false, foodAccess: [] as string[] 
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const router = useRouter();
  const { setUserStats, setPlans } = useAppStore();

  // Fetch saved data on load
  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (data) {
          setStats({
            age: data.age?.toString() || "",
            weight: data.weight?.toString() || "",
            height: data.height?.toString() || "",
            goal: data.goal || "",
            equipment: data.equipment || [],
            swimmingPool: data.swimming_pool || false,
            foodAccess: data.food_access || [],
          });
        }
      }
      setFetching(false);
    };
    fetchProfile();
  }, []);

  const toggleEquipment = (item: string) => {
    setStats(prev => ({
      ...prev,
      equipment: prev.equipment.includes(item) 
        ? prev.equipment.filter(e => e !== item)
        : [...prev.equipment, item]
    }));
  };

  const toggleFood = (item: string) => {
  setStats(prev => ({
    ...prev,
    foodAccess: prev.foodAccess.includes(item) 
      ? prev.foodAccess.filter(e => e !== item)
      : [...prev.foodAccess, item]
  }));
};

  const handleSaveAndGenerate = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        alert("Please log in first!");
        router.push("/auth");
        return;
      }

      const { error: dbError } = await supabase.from("profiles").upsert({
        id: user.id,
        age: parseFloat(stats.age),
        weight: parseFloat(stats.weight),
        height: parseFloat(stats.height),
        goal: stats.goal,
        equipment: stats.equipment,
        swimming_pool: stats.swimmingPool,
        food_access: stats.foodAccess,
        updated_at: new Date().toISOString(),
      });

      if (dbError) throw dbError;

      setUserStats(stats);

      const res = await fetch("/api/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stats, isTired: false }),
      });

      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Failed to generate plan');

      setPlans(data.exercisePlan, data.nutritionPlan);
      router.push("/dashboard");

    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full bg-slate-950/50 border border-slate-700 text-white placeholder:text-slate-500 rounded-xl p-4 focus:ring-2 focus:ring-blue-500 outline-none transition mb-4";

  if (fetching) return <div className="min-h-screen flex items-center justify-center text-white">Loading profile...</div>;

  return (
    <div className="min-h-[90vh] flex items-center justify-center py-10">
      <div className="bg-slate-900/80 backdrop-blur-xl p-8 sm:p-10 rounded-3xl border border-slate-800 shadow-2xl w-full max-w-xl">
        <h1 className="text-3xl font-bold mb-2 text-white">Your Fitness Profile</h1>
        <p className="text-slate-400 text-sm mb-8">Update your details to recalculate your personalized protocol.</p>

        <div className="grid grid-cols-2 gap-4">
          <input placeholder="Age" type="number" value={stats.age} className={inputClass} onChange={(e) => setStats({ ...stats, age: e.target.value })} />
          <input placeholder="Weight (kg)" type="number" value={stats.weight} className={inputClass} onChange={(e) => setStats({ ...stats, weight: e.target.value })} />
        </div>
        <input placeholder="Height (cm)" type="number" value={stats.height} className={inputClass} onChange={(e) => setStats({ ...stats, height: e.target.value })} />
        <input placeholder="Goal (e.g. Lose 5kg, Build leg strength)" value={stats.goal} className={inputClass} onChange={(e) => setStats({ ...stats, goal: e.target.value })} />

        {/* Equipment Selection */}
        <div className="mb-6">
          <label className="block text-white font-medium mb-3">Available Equipment</label>
          <div className="flex flex-wrap gap-2">
            {EQUIPMENT_OPTIONS.map(item => (
              <button
                key={item}
                onClick={() => toggleEquipment(item)}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition ${
                  stats.equipment.includes(item) 
                    ? 'bg-blue-600 border-blue-500 text-white' 
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {/* Swimming Pool Toggle */}
        <div className="mb-8 flex items-center justify-between bg-slate-950/50 p-4 rounded-xl border border-slate-700">
          <span className="text-white font-medium">Swimming Pool Access</span>
          <button 
            onClick={() => setStats(prev => ({ ...prev, swimmingPool: !prev.swimmingPool }))}
            className={`w-14 h-8 rounded-full flex items-center p-1 transition-colors ${stats.swimmingPool ? 'bg-blue-600' : 'bg-slate-700'}`}
          >
            <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${stats.swimmingPool ? 'translate-x-6' : 'translate-x-0'}`}></div>
          </button>
        </div>
        <div className="mb-6">
          <label className="block text-white font-medium mb-3">Food Access (Thailand)</label>
          <div className="flex flex-wrap gap-2">
            {FOOD_OPTIONS.map(item => (
              <button
                key={item} onClick={() => toggleFood(item)}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition ${
                  stats.foodAccess.includes(item) 
                    ? 'bg-emerald-600 border-emerald-500 text-white' 
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleSaveAndGenerate}
          disabled={loading}
          className="w-full bg-blue-600 text-white p-4 rounded-xl font-bold shadow-lg shadow-blue-900/50 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {loading ? "AI is generating your customized plan..." : "Save & Generate AI Plan"}
        </button>
      </div>
    </div>
  );
}