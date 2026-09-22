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

    // Get current logged-in user
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      alert("Please log in first!");
      router.push("/auth");
      return;
    }

    // Save/Update stats in Supabase
    await supabase.from("profiles").upsert({
      id: user.id,
      age: parseFloat(stats.age),
      weight: parseFloat(stats.weight),
      height: parseFloat(stats.height),
      goal: stats.goal,
      updated_at: new Date().toISOString(),
    });

    setUserStats(stats);

    // Call Gemini API to generate plan
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

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold mb-2 text-gray-800">Your Fitness Details</h1>
        <p className="text-gray-500 text-sm mb-6">This data helps the AI personalize your plan.</p>

        <input
          placeholder="Age"
          type="number"
          className="w-full mb-4 p-2 border rounded text-black"
          onChange={(e) => setStats({ ...stats, age: e.target.value })}
        />
        <input
          placeholder="Weight (kg)"
          type="number"
          className="w-full mb-4 p-2 border rounded text-black"
          onChange={(e) => setStats({ ...stats, weight: e.target.value })}
        />
        <input
          placeholder="Height (cm)"
          type="number"
          className="w-full mb-4 p-2 border rounded text-black"
          onChange={(e) => setStats({ ...stats, height: e.target.value })}
        />
        <input
          placeholder="Goal (e.g. Lose 5kg, Build leg strength)"
          className="w-full mb-6 p-2 border rounded text-black"
          onChange={(e) => setStats({ ...stats, goal: e.target.value })}
        />

        <button
          onClick={handleSaveAndGenerate}
          disabled={loading}
          className="w-full bg-blue-600 text-white p-3 rounded-lg font-semibold hover:bg-blue-700"
        >
          {loading ? "AI is generating your customized plan..." : "Save & Generate AI Plan"}
        </button>
      </div>
    </div>
  );
}