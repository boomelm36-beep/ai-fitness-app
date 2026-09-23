// app/exercise/page.tsx
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store";
import { supabase } from "@/lib/supabase";

interface WorkoutLog {
  id: string;
  exercise_name: string;
  weight: number;
  reps: number;
  sets: number;
  logged_at: string;
}

export default function ExercisePage() {
  const router = useRouter();
  const { exercisePlan } = useAppStore();

  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [exerciseName, setExerciseName] = useState("");
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [sets, setSets] = useState("1");
  const [isSaving, setIsSaving] = useState(false);

  // Voice States
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isParsingVoice, setIsParsingVoice] = useState(false);

  // Auth & Fetch Logged Sets for Today
  useEffect(() => {
    const fetchTodayLogs = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/auth");
        return;
      }

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const { data } = await supabase
        .from("workout_logs")
        .select("*")
        .eq("user_id", session.user.id)
        .gte("logged_at", todayStart.toISOString())
        .order("logged_at", { ascending: false });

      if (data) setLogs(data);
      setLoading(false);
    };

    fetchTodayLogs();
  }, [router]);

  // Voice Recognition Handler
  const startVoiceLogging = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Try Chrome or Safari.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setIsListening(true);
    setTranscript("Listening...");

    recognition.start();

    recognition.onresult = async (event: any) => {
      const text = event.results[0][0].transcript;
      setTranscript(`"${text}"`);
      setIsListening(false);
      setIsParsingVoice(true);

      try {
        const res = await fetch("/api/parse-voice-log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transcript: text })
        });

        const parsed = await res.json();

        if (parsed.exerciseName) setExerciseName(parsed.exerciseName);
        if (parsed.weight !== undefined) setWeight(parsed.weight.toString());
        if (parsed.reps !== undefined) setReps(parsed.reps.toString());
        if (parsed.sets !== undefined) setSets(parsed.sets.toString());
      } catch (err) {
        alert("Failed to parse voice command. Please enter manually.");
      } finally {
        setIsParsingVoice(false);
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech Recognition Error:", event.error);
      setIsListening(false);
      setTranscript("Error capturing speech. Try again.");
    };

    recognition.onend = () => {
      setIsListening(false);
    };
  };

  // Save Manual or Voice Log
  const handleSaveLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exerciseName) return;

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      const newLog = {
        user_id: user.id,
        exercise_name: exerciseName,
        weight: parseFloat(weight) || 0,
        reps: parseInt(reps) || 0,
        sets: parseInt(sets) || 1,
      };

      const { data, error } = await supabase
        .from("workout_logs")
        .insert(newLog)
        .select()
        .single();

      if (error) throw error;
      if (data) setLogs((prev) => [data, ...prev]);

      // Reset form
      setExerciseName("");
      setWeight("");
      setReps("");
      setSets("1");
      setTranscript("");
    } catch (err: any) {
      alert(err.message || "Failed to log exercise set.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteLog = async (id: string) => {
    const { error } = await supabase.from("workout_logs").delete().eq("id", id);
    if (!error) {
      setLogs((prev) => prev.filter((item) => item.id !== id));
    }
  };

  if (loading) {
    return <div className="min-h-[70vh] flex items-center justify-center text-slate-400 font-bold">Loading Exercise Protocol...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white">🏋️ Exercise Protocol</h1>
          <p className="text-slate-400 text-sm mt-1">Execute your weekly AI workout routine and log sets via hands-free voice control.</p>
        </div>
        <Link href="/dashboard" className="text-slate-400 hover:text-white text-sm font-medium transition self-start sm:self-auto">
          ← Back to Dashboard
        </Link>
      </div>

      {/* Voice Control Workout Logger Banner */}
      <div className="bg-gradient-to-r from-blue-900/50 via-slate-900 to-slate-900 p-6 rounded-3xl border border-blue-500/30 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="bg-blue-500/20 text-blue-300 text-[10px] uppercase font-black px-2.5 py-1 rounded-full border border-blue-500/40">
              🎙️ Hands-Free Logging
            </span>
            <h2 className="text-xl font-bold text-white mt-2">Voice Workout Logger</h2>
            <p className="text-slate-400 text-xs">Tap the mic and say e.g. <span className="text-blue-300 italic">"Bench press 60 kg for 10 reps, 3 sets"</span></p>
          </div>

          <button
            onClick={startVoiceLogging}
            disabled={isListening || isParsingVoice}
            className={`flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-bold text-sm transition shadow-lg ${
              isListening
                ? "bg-red-600 text-white animate-pulse"
                : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/40"
            }`}
          >
            <span className="text-xl">{isListening ? "🎙️" : "🎤"}</span>
            <span>{isListening ? "Listening..." : isParsingVoice ? "Parsing Voice..." : "Tap to Speak"}</span>
          </button>
        </div>

        {transcript && (
          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
            <span>Captured: <strong className="text-blue-400">{transcript}</strong></span>
            {isParsingVoice && <span className="text-slate-500 animate-pulse">Extracting metrics...</span>}
          </div>
        )}

        {/* Manual Input Form */}
        <form onSubmit={handleSaveLog} className="grid sm:grid-cols-5 gap-3 pt-2">
          <input
            type="text"
            placeholder="Exercise Name"
            value={exerciseName}
            onChange={(e) => setExerciseName(e.target.value)}
            className="sm:col-span-2 bg-slate-950 border border-slate-700 rounded-xl p-3 text-white text-sm outline-none focus:border-blue-500 transition"
            required
          />
          <input
            type="number"
            placeholder="Weight (kg)"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-xl p-3 text-white text-sm outline-none focus:border-blue-500 transition"
          />
          <input
            type="number"
            placeholder="Reps"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-xl p-3 text-white text-sm outline-none focus:border-blue-500 transition"
          />
          <button
            type="submit"
            disabled={isSaving}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold p-3 rounded-xl transition text-sm disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Log Set"}
          </button>
        </form>
      </div>

      {/* Logged Workout History for Today */}
      <div className="bg-slate-900/80 p-6 rounded-3xl border border-slate-800 space-y-4">
        <h2 className="text-lg font-bold text-white">Today's Logged Sets</h2>

        {logs.length === 0 ? (
          <p className="text-slate-500 text-xs py-6 text-center border border-dashed border-slate-800 rounded-2xl">
            No sets logged today yet. Speak or type above to record your progress.
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            {logs.map((log) => (
              <div key={log.id} className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white text-sm">{log.exercise_name}</h4>
                  <p className="text-slate-400 text-xs mt-0.5">
                    {log.weight > 0 ? `${log.weight} kg × ` : ""}{log.reps} reps ({log.sets} {log.sets > 1 ? "sets" : "set"})
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteLog(log.id)}
                  className="text-slate-500 hover:text-red-400 text-xs font-bold p-2 hover:bg-slate-900 rounded-lg transition"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI Program Display */}
      {exercisePlan?.weeklyRoutine ? (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white">Weekly AI Routine</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {exercisePlan.weeklyRoutine.map((dayPlan: any, idx: number) => (
              <div key={idx} className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <h3 className="font-bold text-white text-lg">{dayPlan.day}</h3>
                  <span className="text-xs font-bold text-blue-400 bg-blue-900/40 px-3 py-1 rounded-full border border-blue-500/30">
                    {dayPlan.focus}
                  </span>
                </div>

                <div className="space-y-3">
                  {dayPlan.exercises?.map((ex: any, exIdx: number) => (
                    <div key={exIdx} className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 space-y-2">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-white text-sm">{ex.name}</h4>
                        <button
                          onClick={() => setExerciseName(ex.name)}
                          className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-2.5 py-1 rounded-lg border border-slate-700 transition"
                        >
                          Fill Form
                        </button>
                      </div>
                      <p className="text-xs text-slate-400">Sets: {ex.sets} | Reps: {ex.reps} | Rest: {ex.rest}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 text-center">
          <p className="text-slate-400 text-sm">No active exercise plan found. Complete onboarding or check-in to generate a routine.</p>
        </div>
      )}

    </div>
  );
}