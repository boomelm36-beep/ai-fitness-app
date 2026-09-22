// app/dashboard/page.tsx
"use client";
import Link from "next/link";
import { useAppStore } from "@/store";

export default function DashboardPage() {
  const { userStats, exercisePlan } = useAppStore();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Your Dashboard</h1>
        <p className="text-slate-400 mt-2">Welcome back! Here is your AI fitness overview.</p>
      </header>

      {/* User Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Goal", value: userStats?.goal || "Not set", color: "text-blue-400" },
          { label: "Current Weight", value: userStats?.weight ? `${userStats.weight} kg` : "--", color: "text-white" },
          { label: "Height", value: userStats?.height ? `${userStats.height} cm` : "--", color: "text-white" },
          { label: "Age", value: userStats?.age || "--", color: "text-white" }
        ].map((stat, i) => (
          <div key={i} className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 shadow-sm">
            <p className="text-sm text-slate-400 font-medium mb-1">{stat.label}</p>
            <p className={`text-xl sm:text-2xl font-bold capitalize ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="/exercise" className="group block bg-gradient-to-br from-blue-600 to-blue-800 text-white p-8 rounded-2xl shadow-lg shadow-blue-900/20 hover:scale-[1.02] transition-transform">
          <h2 className="text-2xl font-bold mb-2">Exercise Plan</h2>
          <p className="text-blue-100/80 text-sm">View or recalculate your weekly AI workout program.</p>
        </Link>
        
        <Link href="/nutrition" className="group block bg-gradient-to-br from-emerald-600 to-emerald-800 text-white p-8 rounded-2xl shadow-lg shadow-emerald-900/20 hover:scale-[1.02] transition-transform">
          <h2 className="text-2xl font-bold mb-2">Nutrition Plan</h2>
          <p className="text-emerald-100/80 text-sm">Check your customized daily meals and macros.</p>
        </Link>

        <Link href="/weight" className="group block bg-gradient-to-br from-purple-600 to-purple-800 text-white p-8 rounded-2xl shadow-lg shadow-purple-900/20 hover:scale-[1.02] transition-transform sm:col-span-2 lg:col-span-1">
          <h2 className="text-2xl font-bold mb-2">Weight Tracker</h2>
          <p className="text-purple-100/80 text-sm">Log your weight today and track your progress.</p>
        </Link>
      </div>

      {/* Plan Preview */}
      <div className="bg-slate-900/50 p-6 sm:p-8 rounded-2xl border border-slate-800">
        <h2 className="text-xl font-bold mb-4 text-white">Plan Status</h2>
        {exercisePlan ? (
          <p className="text-emerald-400 font-medium flex items-center gap-3 bg-emerald-400/10 inline-flex px-4 py-2 rounded-lg">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            Active AI Plan generated and ready.
          </p>
        ) : (
          <div className="text-amber-400 font-medium flex items-center gap-3 bg-amber-400/10 inline-flex px-4 py-2 rounded-lg">
            <span className="w-3 h-3 bg-amber-500 rounded-full animate-pulse"></span> 
            No plan generated yet. 
            <Link href="/onboarding" className="underline ml-2 text-white hover:text-blue-400 transition">Go to Onboarding</Link>
          </div>
        )}
      </div>
    </div>
  );
}