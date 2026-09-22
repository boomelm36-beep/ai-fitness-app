// app/dashboard/page.tsx
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAppStore } from "@/store";
import { supabase } from "@/lib/supabase";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function DashboardPage() {
  const { userStats, exercisePlan } = useAppStore();
  const [chartData, setChartData] = useState<any[]>([]);

  // Calculate current BMI
  const heightInMeters = parseFloat(userStats?.height || "0") / 100;
  const currentWeight = parseFloat(userStats?.weight || "0");
  const currentBMI = heightInMeters > 0 && currentWeight > 0 
    ? (currentWeight / (heightInMeters * heightInMeters)).toFixed(1) 
    : "--";

  // Fetch weight history and calculate historical BMI for the charts
  useEffect(() => {
    const fetchWeightHistory = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('weight_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('logged_at', { ascending: true });

      if (data && data.length > 0 && heightInMeters > 0) {
        const formattedData = data.map(log => ({
          date: new Date(log.logged_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          weight: log.weight,
          bmi: parseFloat((log.weight / (heightInMeters * heightInMeters)).toFixed(1))
        }));
        setChartData(formattedData);
      } else if (currentWeight > 0) {
        // Fallback if no logs exist yet, just show current weight
        setChartData([{
          date: 'Today',
          weight: currentWeight,
          bmi: parseFloat(currentBMI as string)
        }]);
      }
    };

    fetchWeightHistory();
  }, [currentWeight, heightInMeters, currentBMI]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Your Dashboard</h1>
          <p className="text-slate-400 mt-2">Track your progress and AI protocol.</p>
        </div>
        <Link 
          href="/onboarding" 
          className="bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white px-5 py-2.5 rounded-xl text-sm font-bold border border-slate-700 transition flex items-center justify-center"
        >
          ⚙️ Edit Profile & Goals
        </Link>
      </header>

      {/* User Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Goal", value: userStats?.goal || "Not set", color: "text-blue-400" },
          { label: "Weight", value: currentWeight ? `${currentWeight} kg` : "--", color: "text-white" },
          { label: "Height", value: userStats?.height ? `${userStats.height} cm` : "--", color: "text-white" },
          { label: "Age", value: userStats?.age || "--", color: "text-white" },
          { label: "Current BMI", value: currentBMI, color: "text-emerald-400" }
        ].map((stat, i) => (
          <div key={i} className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 shadow-sm">
            <p className="text-sm text-slate-400 font-medium mb-1">{stat.label}</p>
            <p className={`text-xl sm:text-2xl font-bold capitalize ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Progress Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 shadow-sm h-80 flex flex-col">
          <h2 className="text-lg font-bold text-white mb-4">Weight Tracking (kg)</h2>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickMargin={10} />
                <YAxis stroke="#64748b" fontSize={12} domain={['dataMin - 2', 'dataMax + 2']} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }} />
                <Line type="monotone" dataKey="weight" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 shadow-sm h-80 flex flex-col">
          <h2 className="text-lg font-bold text-white mb-4">BMI Tracking</h2>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickMargin={10} />
                <YAxis stroke="#64748b" fontSize={12} domain={['dataMin - 1', 'dataMax + 1']} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }} />
                <Line type="monotone" dataKey="bmi" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-2 gap-6">
        <Link href="/exercise" className="group block bg-gradient-to-br from-blue-600 to-blue-800 text-white p-8 rounded-2xl shadow-lg shadow-blue-900/20 hover:scale-[1.02] transition-transform">
          <h2 className="text-2xl font-bold mb-2">Exercise Protocol</h2>
          <p className="text-blue-100/80 text-sm">View your weekly AI workout program and image instructions.</p>
        </Link>
        
        <Link href="/nutrition" className="group block bg-gradient-to-br from-emerald-600 to-emerald-800 text-white p-8 rounded-2xl shadow-lg shadow-emerald-900/20 hover:scale-[1.02] transition-transform">
          <h2 className="text-2xl font-bold mb-2">Nutrition Protocol</h2>
          <p className="text-emerald-100/80 text-sm">Check your customized daily meals and macro timeline.</p>
        </Link>
      </div>
    </div>
  );
}