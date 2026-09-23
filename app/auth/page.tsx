// app/auth/page.tsx
"use client";
import { useState, useEffect } from "react"; // <-- Add useEffect here
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push("/dashboard");
    });
  }, [router]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (isSignUp) {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        await supabase.from("profiles").insert([
          { id: data.user.id, username: username }
        ]);
        router.push("/onboarding");
      }
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      router.push("/dashboard");
    }
  };

  const inputClass = "w-full bg-slate-950/50 border border-slate-700 text-white placeholder:text-slate-500 rounded-xl p-4 focus:ring-2 focus:ring-blue-500 outline-none transition mb-4";

  return (
    <div className="min-h-[80vh] flex items-center justify-center animate-in fade-in zoom-in-95 duration-500">
      <div className="bg-slate-900/80 backdrop-blur-xl p-8 sm:p-10 rounded-3xl border border-slate-800 shadow-2xl w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-white mb-2">
            {isSignUp ? "Create an Account" : "Welcome Back"}
          </h1>
          <p className="text-slate-400 text-sm">
            {isSignUp ? "Start your AI-powered fitness journey." : "Log in to view your tailored plans."}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleAuth}>
          {isSignUp && (
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className={inputClass}
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={inputClass}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className={inputClass}
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-blue-600 text-white p-4 rounded-xl font-bold shadow-lg shadow-blue-900/50 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? "Processing..." : isSignUp ? "Sign Up" : "Log In"}
          </button>
        </form>

        <p className="mt-8 text-sm text-center text-slate-400">
          {isSignUp ? "Already have an account?" : "Need an account?"}{" "}
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError("");
            }}
            className="text-blue-400 hover:text-blue-300 font-semibold transition"
          >
            {isSignUp ? "Log In" : "Sign Up"}
          </button>
        </p>
      </div>
    </div>
  );
}