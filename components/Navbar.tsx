// components/Navbar.tsx
"use client";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/store';

const MOTIVATION_QUOTES = [
  "Strive for progress, not perfection.",
  "Push harder than yesterday.",
  "Your only limit is you.",
  "Sore today, strong tomorrow.",
  "Don't stop when you're tired, stop when you're done.",
  "Discipline is choosing between what you want now and what you want most.",
  "The body achieves what the mind believes."
];

export default function Navbar() {
  const [username, setUsername] = useState<string>("");
  const [quote, setQuote] = useState<string>("");
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    setQuote(MOTIVATION_QUOTES[new Date().getDay()]);
    
    const fetchUser = async (userId: string) => {
      const { data } = await supabase.from('profiles').select('username').eq('id', userId).single();
      if (data?.username) setUsername(data.username);
      setLoading(false);
    };

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setIsLoggedIn(true);
        fetchUser(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setIsLoggedIn(true);
        fetchUser(session.user.id);
      } else {
        setIsLoggedIn(false);
        setUsername("");
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    useAppStore.persist.clearStorage(); // Clears cached AI plans
    router.push('/');
  };

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between py-3 min-h-[64px] gap-4">
          
          {/* Logo & Motivation */}
          <div className="flex flex-col items-center sm:items-start">
            <Link href="/" className="font-extrabold text-xl tracking-tight text-white flex items-center gap-2">
              <span className="text-blue-500">⚡</span> AI Fit
            </Link>
            {isLoggedIn && !loading && (
              <p className="text-xs text-slate-400 font-medium mt-1 text-center sm:text-left hidden md:block">
                {quote}
              </p>
            )}
          </div>

          {/* Core Navigation (Only show if logged in) */}
          {isLoggedIn && !loading && (
            <div className="flex gap-4 sm:gap-6 text-sm font-medium overflow-x-auto no-scrollbar">
              <Link href="/dashboard" className="text-slate-300 hover:text-white transition">Dashboard</Link>
              <Link href="/exercise" className="text-slate-300 hover:text-white transition">Exercise</Link>
              <Link href="/nutrition" className="text-slate-300 hover:text-white transition">Nutrition</Link>
              <Link href="/weight" className="text-slate-300 hover:text-white transition">Weight</Link>
              <Link href="/account" className="text-white font-bold bg-slate-800 px-4 py-2 rounded-full hover:bg-slate-700 transition">
                {username ? username : "My Account"}
              </Link>
            </div>
          )}

          {/* User Controls */}
          <div className="flex items-center gap-4 text-sm font-medium">
            {!loading && isLoggedIn ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold uppercase">
                    {username ? username.charAt(0) : "U"}
                  </div>
                  <span className="text-white hidden sm:block">{username}</span>
                </div>
                <Link href="/onboarding" className="text-slate-300 hover:text-blue-400 transition">
                  My Profile
                </Link>
                <button onClick={handleSignOut} className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition">
                  Sign Out
                </button>
              </div>
            ) : !loading && !isLoggedIn ? (
              <Link href="/auth" className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg transition">
                Sign In
              </Link>
            ) : null}
          </div>

        </div>
      </div>
    </nav>
  );
}