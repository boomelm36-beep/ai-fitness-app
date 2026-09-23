// app/account/page.tsx
"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAppStore } from "@/store";

export default function AccountPage() {
  const { username, setUsername, userStats, setUserStats } = useAppStore();
  const [localUsername, setLocalUsername] = useState("");
  const [gender, setGender] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('username, gender').eq('id', user.id).single();
        if (data) {
          setLocalUsername(data.username || "");
          setGender(data.gender || "");
          setUsername(data.username || "");
        }
      }
    };
    fetchProfile();
  }, [setUsername]);

  const handleSave = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('profiles').update({ 
        username: localUsername,
        gender: gender 
      }).eq('id', user.id);
      
      setUsername(localUsername);
      if (userStats) {
        setUserStats({ ...userStats, gender });
      }
      alert("Account updated successfully!");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-xl mx-auto mt-10 animate-in fade-in duration-500">
      <div className="bg-slate-900/80 p-8 rounded-3xl border border-slate-800 shadow-xl">
        <h1 className="text-3xl font-extrabold text-white mb-6">My Account</h1>
        
        <div className="space-y-6">
          <div>
            <label className="block text-slate-400 text-sm font-bold mb-2">Username</label>
            <input 
              type="text" 
              value={localUsername} 
              onChange={(e) => setLocalUsername(e.target.value)} 
              className="w-full bg-slate-950/50 border border-slate-700 text-white rounded-xl p-4 outline-none focus:border-blue-500 transition"
            />
          </div>

          <div>
            <label className="block text-slate-400 text-sm font-bold mb-2">Gender</label>
            <div className="flex gap-4">
              {['Male', 'Female'].map(g => (
                <button
                  key={g}
                  onClick={() => setGender(g)}
                  className={`flex-1 py-3 rounded-xl font-bold transition border ${
                    gender === g ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <button onClick={handleSave} disabled={loading} className="w-full bg-blue-600 text-white font-bold p-4 rounded-xl hover:bg-blue-500 transition shadow-lg shadow-blue-900/50">
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}