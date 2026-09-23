// app/auth/page.tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAppStore } from "@/store";

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState(""); 
  const [gender, setGender] = useState(""); // <-- New state for Gender
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();

  // If already logged in, redirect to dashboard
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push("/dashboard");
      }
    };
    checkUser();
  }, [router]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSignUp && !gender) {
      alert("Please select your gender.");
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        // --- SIGN UP LOGIC ---
        const { data: authData, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        
        // Save the username AND gender to the profiles table
        if (authData.user) {
          await supabase.from('profiles').insert({
            id: authData.user.id,
            username: username,
            gender: gender
          });
        }
        
        alert("Account created successfully!");
        router.push("/onboarding"); 
        
      } else {
        // --- LOG IN LOGIC ---
        const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        
        // Hydrate global state across devices
        if (authData.user) {
          const { data: profile } = await supabase.from('profiles').select('*').eq('id', authData.user.id).single();
          
          if (profile) {
            useAppStore.getState().setUsername(profile.username || "");
            useAppStore.getState().setUserStats({
              age: profile.age?.toString() || "",
              weight: profile.weight?.toString() || "",
              height: profile.height?.toString() || "",
              goal: profile.goal || "",
              equipment: profile.equipment || [],
              swimmingPool: profile.swimming_pool || false,
              foodAccess: profile.food_access || [],
              eatingMethods: profile.eating_methods || ["Anything"],
              allergies: profile.allergies || [],
              gender: profile.gender || "",
              ifSchedule: profile.if_schedule || ""
            });
            // Load saved plans
            useAppStore.getState().setPlans(profile.exercise_plan || null, profile.nutrition_plan || null);
          }
        }
        
        router.push("/dashboard");
      }
    } catch (error: any) {
      alert(error.message || "An error occurred during authentication.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center animate-in fade-in duration-500">
      <div className="bg-slate-900/80 p-8 sm:p-10 rounded-3xl border border-slate-800 shadow-2xl w-full max-w-md">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-white mb-2">
            {isSignUp ? "Create an Account" : "Welcome Back"}
          </h1>
          <p className="text-slate-400 text-sm">
            {isSignUp ? "Start your AI fitness journey today." : "Log in to view your tailored plans."}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          
          {isSignUp && (
            <>
              <input 
                type="text" 
                placeholder="Username" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                className="w-full bg-slate-950/50 border border-slate-700 rounded-xl p-4 text-white outline-none focus:border-blue-500 transition"
                required
              />
              
              {/* Gender Selection Toggle */}
              <div className="flex gap-4">
                {['Male', 'Female'].map(g => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGender(g)}
                    className={`flex-1 py-3 rounded-xl font-bold transition border ${
                      gender === g 
                        ? 'bg-blue-600 border-blue-500 text-white' 
                        : 'bg-slate-950/50 border-slate-700 text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </>
          )}

          <input 
            type="email" 
            placeholder="Email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            className="w-full bg-slate-950/50 border border-slate-700 rounded-xl p-4 text-white outline-none focus:border-blue-500 transition"
            required
          />
          
          <input 
            type="password" 
            placeholder="Password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            className="w-full bg-slate-950/50 border border-slate-700 rounded-xl p-4 text-white outline-none focus:border-blue-500 transition"
            required
          />

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 text-white font-bold p-4 rounded-xl hover:bg-blue-500 transition shadow-lg shadow-blue-900/50 disabled:opacity-50 mt-2"
          >
            {loading ? "Please wait..." : (isSignUp ? "Sign Up" : "Log In")}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setGender(""); // Reset gender when toggling views
            }} 
            className="text-slate-400 hover:text-white text-sm font-bold transition"
          >
            {isSignUp ? "Already have an account? Log In" : "Need an account? Sign Up"}
          </button>
        </div>

      </div>
    </div>
  );
}