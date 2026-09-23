"use client";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAppStore } from "@/store";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { username, setUsername, setUserStats, setPlans } = useAppStore();
  
  // Track actual authentication state
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    
    // Listen for logins/logouts
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUsername(null);
    setUserStats(null as any);
    setPlans(null, null);
    router.push("/auth");
  };

  const isActive = (path: string) => pathname === path ? "text-white font-bold" : "text-slate-300 hover:text-white";

  return (
    <nav className="bg-slate-950 border-b border-slate-800/50 py-4 px-6 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* LEFT SECTION: Logo & Slogan */}
        <div className="flex flex-col">
          <Link href="/dashboard" className="flex items-center gap-2 text-xl font-black text-white tracking-tight hover:opacity-80 transition">
            <span className="text-amber-500">⚡</span> AI Fit
          </Link>
          <span className="text-slate-400 text-[10px] mt-0.5 tracking-wide">
            Sore today, strong tomorrow.
          </span>
        </div>

        {/* CENTER SECTION: Main Navigation (Only show if logged in) */}
        {session && (
          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            <Link href="/dashboard" className={`transition ${isActive("/dashboard")}`}>Dashboard</Link>
            <Link href="/exercise" className={`transition ${isActive("/exercise")}`}>Exercise</Link>
            <Link href="/nutrition" className={`transition ${isActive("/nutrition")}`}>Nutrition</Link>
            <Link href="/weight" className={`transition ${isActive("/weight")}`}>Weight</Link>
          </div>
        )}

        {/* RIGHT SECTION: User Profile & Actions */}
        <div className="flex items-center gap-4 sm:gap-6">
          
          {session ? (
            <>
              <div className="flex items-center gap-2 border-r border-slate-800 pr-4 sm:pr-6">
                <span className="text-white font-bold text-sm hidden sm:block">
                  Welcome! {username || "User"}
                </span>
                <Link href="/account" className="text-slate-400 hover:text-white transition p-1.5 rounded-md hover:bg-slate-800" title="Account Settings">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </Link>
              </div>

              <div className="flex items-center gap-4">
                <Link href="/onboarding" className="text-slate-400 hover:text-white text-sm font-medium transition hidden sm:block">My Profile</Link>
                <button onClick={handleSignOut} className="bg-slate-900 text-slate-300 px-4 py-2 rounded-lg text-sm font-bold border border-slate-700 hover:bg-slate-800 hover:text-white transition">
                  Sign Out
                </button>
              </div>
            </>
          ) : (
            <Link href="/auth" className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-blue-500 transition shadow-lg shadow-blue-900/50">
              Sign In
            </Link>
          )}

        </div>
      </div>
    </nav>
  );
}