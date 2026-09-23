// app/onboarding/page.tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAppStore } from "@/store";

const EQUIPMENT_OPTIONS = ["Treadmill", "Dumbbell", "Kettlebell", "Barbell", "Resistance Bands", "Pull-up Bar"];
const FOOD_OPTIONS = ["7-11 (Convenience Store)", "Street Food / Made-to-order", "Food Delivery (Grab/Line Man)", "Home Cooking"];
const EATING_METHODS = ["Anything", "Ketogenic", "Low carb", "Carnivore Diet", "High Protein", "Intermittent Fasting"];
const ALLERGY_OPTIONS = ["Peanuts", "Seafood", "Shellfish", "Dairy", "Gluten", "Pork", "Eggs", "Soy", "Beef", "Vegetables"];

export default function Onboarding() {
  const [stats, setStats] = useState({ 
    age: "", 
    weight: "", 
    height: "", 
    goal: "", 
    equipment: [] as string[], 
    swimmingPool: false,
    foodAccess: [] as string[],
    eatingMethods: ["Anything"] as string[],
    allergies: [] as string[],
    gender: "" // Fetched from DB so we don't accidentally overwrite it
  });
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const router = useRouter();
  const { setUserStats, setPlans } = useAppStore();

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
            eatingMethods: data.eating_methods?.length ? data.eating_methods : ["Anything"],
            allergies: data.allergies || [],
            gender: data.gender || ""
          });
        }
      }
      setFetching(false);
    };
    fetchProfile();
  }, []);

  const toggleItem = (listKey: 'equipment' | 'foodAccess' | 'allergies', item: string) => {
    setStats(prev => ({
      ...prev,
      [listKey]: prev[listKey].includes(item) 
        ? prev[listKey].filter(e => e !== item)
        : [...prev[listKey], item]
    }));
  };

  const toggleEatingMethod = (item: string) => {
    setStats(prev => {
      if (item === "Anything") {
        return { ...prev, eatingMethods: ["Anything"] };
      }
      const currentWithoutAnything = prev.eatingMethods.filter(m => m !== "Anything");
      const exists = currentWithoutAnything.includes(item);
      const updated = exists 
        ? currentWithoutAnything.filter(m => m !== item) 
        : [...currentWithoutAnything, item];
      
      return { 
        ...prev, 
        eatingMethods: updated.length === 0 ? ["Anything"] : updated 
      };
    });
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

      // 1. Update Profile in Supabase
      const { error: dbError } = await supabase.from("profiles").upsert({
        id: user.id,
        age: parseFloat(stats.age),
        weight: parseFloat(stats.weight),
        height: parseFloat(stats.height),
        goal: stats.goal,
        equipment: stats.equipment,
        swimming_pool: stats.swimmingPool,
        food_access: stats.foodAccess,
        eating_methods: stats.eatingMethods,
        allergies: stats.allergies,
        updated_at: new Date().toISOString(),
      });

      if (dbError) throw dbError;
      setUserStats(stats);

      // 2. Generate Plan with AI
      const res = await fetch("/api/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stats, isTired: false }),
      });

      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Failed to generate plan');

      // 3. Save plans to state and upload to Supabase for cloud sync
      setPlans(data.exercisePlan, data.nutritionPlan);
      
      await supabase.from('profiles').update({
        exercise_plan: data.exercisePlan,
        nutrition_plan: data.nutritionPlan
      }).eq('id', user.id);

      router.push("/dashboard");

    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full bg-slate-950/50 border border-slate-700 text-white placeholder:text-slate-500 rounded-xl p-4 focus:ring-2 focus:ring-blue-500 outline-none transition mb-4";

  if (fetching) return <div className="min-h-[80vh] flex items-center justify-center text-white">Loading profile...</div>;

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
                key={item} type="button" onClick={() => toggleItem('equipment', item)}
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

        {/* Food Access */}
        <div className="mb-6">
          <label className="block text-white font-medium mb-3">Food Access (Thailand)</label>
          <div className="flex flex-wrap gap-2">
            {FOOD_OPTIONS.map(item => (
              <button
                key={item} type="button" onClick={() => toggleItem('foodAccess', item)}
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

        {/* Eating Method / Dietary Style */}
        <div className="mb-6">
          <label className="block text-white font-medium mb-3">Eating Method / Dietary Preference</label>
          <div className="flex flex-wrap gap-2">
            {EATING_METHODS.map(item => (
              <button
                key={item} type="button" onClick={() => toggleEatingMethod(item)}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition ${
                  stats.eatingMethods.includes(item) 
                    ? 'bg-purple-600 border-purple-500 text-white' 
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {/* Allergies / Excluded Foods */}
        <div className="mb-6">
          <label className="block text-white font-medium mb-3">Allergies & Foods You Don't Eat</label>
          <div className="flex flex-wrap gap-2">
            {ALLERGY_OPTIONS.map(item => (
              <button
                key={item} type="button" onClick={() => toggleItem('allergies', item)}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition ${
                  stats.allergies.includes(item) 
                    ? 'bg-red-600 border-red-500 text-white' 
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
            type="button"
            onClick={() => setStats(prev => ({ ...prev, swimmingPool: !prev.swimmingPool }))}
            className={`w-14 h-8 rounded-full flex items-center p-1 transition-colors ${stats.swimmingPool ? 'bg-blue-600' : 'bg-slate-700'}`}
          >
            <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${stats.swimmingPool ? 'translate-x-6' : 'translate-x-0'}`}></div>
          </button>
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