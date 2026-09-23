// app/fridge/page.tsx
"use client";
import { useState, useRef } from "react";
import { useAppStore } from "@/store";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function FridgeScannerPage() {
  const { userStats } = useAppStore();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ detectedIngredients: string[]; recipes: any[] } | null>(null);
  const [loggedRecipeIndex, setLoggedRecipeIndex] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Image = reader.result as string;
      setImagePreview(base64Image);
      analyzeFridge(base64Image);
    };
    reader.readAsDataURL(file);
  };

  const analyzeFridge = async (base64Image: string) => {
    setLoading(true);
    setResult(null);
    setLoggedRecipeIndex(null);

    try {
      const res = await fetch("/api/scan-fridge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: base64Image,
          stats: userStats
        })
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setResult(data);
    } catch (error: any) {
      alert(`Fridge Scan Failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const logRecipeToToday = async (recipe: any, index: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      const today = new Date().toISOString().split("T")[0];

      const { error } = await supabase.from("nutrition_logs").insert({
        user_id: user.id,
        food_name: recipe.name,
        calories: recipe.calories,
        protein: recipe.protein || 0,
        carbs: recipe.carbs || 0,
        fat: recipe.fat || 0,
        logged_date: today
      });

      if (error) throw error;

      setLoggedRecipeIndex(index);
    } catch (error: any) {
      alert(`Could not log recipe: ${error.message}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-white">🥗 Scan My Fridge</h1>
          <p className="text-slate-400 text-sm mt-1">Snap your fridge or pantry to generate custom recipes instantly.</p>
        </div>
        <Link href="/nutrition" className="text-slate-400 hover:text-white text-sm font-medium transition">
          ← Back to Nutrition
        </Link>
      </div>

      {/* Upload / Capture Card */}
      <div className="bg-slate-900/80 p-8 rounded-3xl border border-slate-800 shadow-xl text-center space-y-6">
        {imagePreview ? (
          <div className="relative max-w-md mx-auto rounded-2xl overflow-hidden border border-slate-700">
            <img src={imagePreview} alt="Fridge scan" className="w-full h-64 object-cover" />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-3 right-3 bg-slate-900/90 text-white text-xs font-bold px-3 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 transition"
            >
              📷 Retake
            </button>
          </div>
        ) : (
          <div className="py-10 border-2 border-dashed border-slate-700 rounded-2xl hover:border-slate-500 transition cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <span className="text-5xl block mb-3">📸</span>
            <p className="text-white font-bold text-lg">Snap or Upload Fridge Photo</p>
            <p className="text-slate-400 text-xs mt-1">PNG, JPG or WEBP supported</p>
          </div>
        )}

        <input
          type="file"
          accept="image/*"
          capture="environment"
          ref={fileInputRef}
          onChange={handleImageCapture}
          className="hidden"
        />

        {loading && (
          <div className="flex items-center justify-center gap-3 text-blue-400 font-bold animate-pulse py-4">
            <span className="text-2xl">🧠</span> AI is identifying ingredients and building tailored recipes...
          </div>
        )}
      </div>

      {/* Results Section */}
      {result && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Detected Ingredients */}
          {result.detectedIngredients?.length > 0 && (
            <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Detected Ingredients</h2>
              <div className="flex flex-wrap gap-2">
                {result.detectedIngredients.map((item, i) => (
                  <span key={i} className="bg-slate-800 text-emerald-400 border border-slate-700 px-3 py-1 rounded-full text-xs font-semibold">
                    ✓ {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Generated Recipes */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-4">Suggested Recipes</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {result.recipes?.map((recipe, idx) => (
                <div key={idx} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-4 hover:border-slate-700 transition">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-bold text-white">{recipe.name}</h3>
                      <span className="bg-blue-900/50 text-blue-400 border border-blue-500/30 text-xs font-bold px-2.5 py-1 rounded-lg whitespace-nowrap">
                        ⏱️ {recipe.prepTime}
                      </span>
                    </div>

                    {/* Macros */}
                    <div className="flex gap-2 text-xs font-bold my-3">
                      <span className="bg-slate-950 text-slate-300 px-2.5 py-1 rounded-md border border-slate-800">{recipe.calories} kcal</span>
                      <span className="bg-slate-950 text-emerald-400 px-2.5 py-1 rounded-md border border-slate-800">P: {recipe.protein}g</span>
                      <span className="bg-slate-950 text-amber-400 px-2.5 py-1 rounded-md border border-slate-800">C: {recipe.carbs}g</span>
                      <span className="bg-slate-950 text-purple-400 px-2.5 py-1 rounded-md border border-slate-800">F: {recipe.fat}g</span>
                    </div>

                    {/* Instructions */}
                    <div className="space-y-2 mt-4">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Instructions:</p>
                      <ol className="list-decimal list-inside text-xs text-slate-300 space-y-1 leading-relaxed">
                        {recipe.instructions?.map((step: string, stepIdx: number) => (
                          <li key={stepIdx}>{step}</li>
                        ))}
                      </ol>
                    </div>
                  </div>

                  <button
                    onClick={() => logRecipeToToday(recipe, idx)}
                    disabled={loggedRecipeIndex === idx}
                    className={`w-full py-3 rounded-xl font-bold text-sm transition ${
                      loggedRecipeIndex === idx
                        ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 cursor-default"
                        : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/30"
                    }`}
                  >
                    {loggedRecipeIndex === idx ? "✓ Logged to Today's Meals" : "Log Recipe to Today"}
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}