// app/onboarding/page.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAppStore } from "@/store";

export default function Onboarding() {
  const [stats, setStats] = useState({ age: "", weight: "", height: "", goal: "" });
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setUserStats, setPlans } = useAppStore();

  const handleSaveAndGenerate = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      alert("Please log in first!");
      router.push("/auth");
      return;
    }

    await supabase.from("profiles").upsert({
      id: user.id,
      age: parseFloat(stats.age),
      weight: parseFloat(stats.weight),
      height: parseFloat(stats.height),
      goal: stats.goal,
      updated_at: new Date().toISOString(),
    });

    setUserStats(stats);

    const res = await fetch("/api/generate-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stats, isTired: false }),
    });

    const data = await res.json();
    setPlans(data.exercisePlan, data.nutritionPlan);

    setLoading(false);
    router.push("/dashboard");
  };

  const inputClass = "w-full bg-slate-950/50 border border-slate-700 text-white placeholder:text-slate-500 rounded-xl p-4 focus:ring-2 focus:ring-blue-500 outline-none transition mb-4";

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="bg-slate-900/80 backdrop-blur-xl p-8 sm:p-10 rounded-3xl border border-slate-800 shadow-2xl w-full max-w-lg">
        <h1 className="text-3xl font-bold mb-2 text-white">Your Fitness Details</h1>
        <p className="text-slate-400 text-sm mb-8">This data helps the AI personalize your exact protocol.</p>

        <input placeholder="Age" type="number" className={inputClass} onChange={(e) => setStats({ ...stats, age: e.target.value })} />
        <input placeholder="Weight (kg)" type="number" className={inputClass} onChange={(e) => setStats({ ...stats, weight: e.target.value })} />
        <input placeholder="Height (cm)" type="number" className={inputClass} onChange={(e) => setStats({ ...stats, height: e.target.value })} />
        <input placeholder="Goal (e.g. Lose 5kg, Build leg strength)" className={inputClass} onChange={(e) => setStats({ ...stats, goal: e.target.value })} />

        <button
          onClick={handleSaveAndGenerate}
          disabled={loading}
          className="w-full mt-4 bg-blue-600 text-white p-4 rounded-xl font-bold shadow-lg shadow-blue-900/50 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {loading ? "AI is generating your customized plan..." : "Save & Generate AI Plan"}
        </button>
      </div>
    </div>
  );
}