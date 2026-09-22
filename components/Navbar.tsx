// components/Navbar.tsx
"use client";
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

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
  const [username, setUsername] = useState<string>("Athlete");
  const [quote, setQuote] = useState<string>("");

  useEffect(() => {
    // Pick a quote based on the current day of the week
    setQuote(MOTIVATION_QUOTES[new Date().getDay()]);
    
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('username').eq('id', user.id).single();
        if (data?.username) setUsername(data.username);
      }
    };
    fetchUser();
  }, []);

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between py-3 min-h-[64px] gap-2">
          
          <div className="flex flex-col items-center sm:items-start">
            <Link href="/" className="font-extrabold text-xl tracking-tight text-white flex items-center gap-2">
              <span className="text-blue-500">⚡</span> AI Fit
            </Link>
            <p className="text-xs text-slate-400 font-medium mt-1">
              Welcome, <span className="text-blue-400">{username}</span>! {quote}
            </p>
          </div>

          <div className="flex gap-4 sm:gap-6 text-sm font-medium overflow-x-auto no-scrollbar">
            <Link href="/dashboard" className="text-slate-300 hover:text-white transition">Dashboard</Link>
            <Link href="/exercise" className="text-slate-300 hover:text-white transition">Exercise</Link>
            <Link href="/nutrition" className="text-slate-300 hover:text-white transition">Nutrition</Link>
            <Link href="/weight" className="text-slate-300 hover:text-white transition">Weight</Link>
          </div>
        </div>
      </div>
    </nav>
  );
}