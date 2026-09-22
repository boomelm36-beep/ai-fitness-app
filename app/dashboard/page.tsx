// app/dashboard/page.tsx
"use client";
import Link from "next/link";
import { useAppStore } from "@/store";

export default function DashboardPage() {
  const { userStats, exercisePlan } = useAppStore();

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <header className="mb-8">
        <h1 className="text-4xl font-extrabold text-gray-900">Your Dashboard</h1>
        <p className="text-gray-500 mt-2">Welcome back! Here is your AI fitness overview.</p>
      </header>

      {/* User Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium">Goal</p>
          <p className="text-xl font-bold text-blue-600 capitalize">{userStats?.goal || "Not set"}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium">Current Weight</p>
          <p className="text-xl font-bold text-gray-800">{userStats?.weight ? `${userStats.weight} kg` : "--"}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium">Height</p>
          <p className="text-xl font-bold text-gray-800">{userStats?.height ? `${userStats.height} cm` : "--"}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium">Age</p>
          <p className="text-xl font-bold text-gray-800">{userStats?.age || "--"}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-6">
        <Link href="/exercise" className="group block bg-blue-600 text-white p-6 rounded-xl shadow-md hover:bg-blue-700 transition">
          <h2 className="text-2xl font-bold mb-2">Exercise Plan</h2>
          <p className="text-blue-100 text-sm">View or recalculate your weekly AI workout program.</p>
        </Link>
        
        <Link href="/nutrition" className="group block bg-green-600 text-white p-6 rounded-xl shadow-md hover:bg-green-700 transition">
          <h2 className="text-2xl font-bold mb-2">Nutrition Plan</h2>
          <p className="text-green-100 text-sm">Check your customized daily meals and macros.</p>
        </Link>

        <Link href="/weight" className="group block bg-purple-600 text-white p-6 rounded-xl shadow-md hover:bg-purple-700 transition">
          <h2 className="text-2xl font-bold mb-2">Weight Tracker</h2>
          <p className="text-purple-100 text-sm">Log your weight today and track your progress.</p>
        </Link>
      </div>

      {/* Plan Preview */}
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Plan Status</h2>
        {exercisePlan ? (
          <p className="text-green-600 font-medium flex items-center gap-2">
            <span className="w-3 h-3 bg-green-500 rounded-full"></span> 
            Active AI Plan generated and ready.
          </p>
        ) : (
          <div className="text-orange-600 font-medium flex items-center gap-2">
            <span className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></span> 
            No plan generated yet. 
            <Link href="/onboarding" className="underline ml-2 text-gray-800 hover:text-blue-600">Go to Onboarding</Link>
          </div>
        )}
      </div>
    </div>
  );
}