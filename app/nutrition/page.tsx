// app/nutrition/page.tsx
"use client";
import { useAppStore } from "@/store";
import Link from "next/link";

export default function NutritionPage() {
  const { nutritionPlan } = useAppStore();

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Nutrition Plan</h1>
          <p className="text-gray-500">Your customized AI daily diet protocol.</p>
        </div>
      </div>
      
      {nutritionPlan ? (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <div className="prose prose-green max-w-none whitespace-pre-wrap text-gray-700 leading-relaxed">
            {nutritionPlan}
          </div>
        </div>
      ) : (
        <div className="bg-white p-12 text-center rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-2">No Nutrition Plan Found</h3>
          <p className="text-gray-500 mb-6">You need to complete your profile setup so the AI can generate your diet.</p>
          <Link 
            href="/onboarding" 
            className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition"
          >
            Generate Plan Now
          </Link>
        </div>
      )}
    </div>
  );
}