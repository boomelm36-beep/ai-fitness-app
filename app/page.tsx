// app/page.tsx
import Link from "next/link";

export default function Home() {
  return (
    <div className="bg-slate-900 min-h-screen text-white">
      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-6 py-20 text-center">
        <span className="bg-blue-500/10 text-blue-400 text-sm font-semibold px-4 py-1.5 rounded-full border border-blue-500/20 inline-block">
          AI-Powered Health & Fitness
        </span>
        <h1 className="text-5xl md:text-6xl font-extrabold mt-6 mb-6 leading-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
          Your Adaptive Personal Trainer & Nutritionist
        </h1>
        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10">
          Generate dynamic exercise programs and diet plans tuned to your goals.
          Too tired today? Our AI recalculates your routine in real-time.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/auth"
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-4 rounded-xl shadow-lg shadow-blue-600/30 transition text-lg"
          >
            Get Started Free
          </Link>
          <Link
            href="/auth"
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-8 py-4 rounded-xl border border-slate-700 transition text-lg"
          >
            Sign In
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-slate-800/50 p-8 rounded-2xl border border-slate-700/50">
            <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center text-2xl mb-4">
              💪
            </div>
            <h3 className="text-xl font-bold mb-2">Smart Workouts</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Customized weekly exercise programs designed around your physical stats and fitness goals.
            </p>
          </div>

          <div className="bg-slate-800/50 p-8 rounded-2xl border border-slate-700/50">
            <div className="w-12 h-12 bg-orange-500/20 text-orange-400 rounded-xl flex items-center justify-center text-2xl mb-4">
              ⚡
            </div>
            <h3 className="text-xl font-bold mb-2">Fatigue Adaptation</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Feeling exhausted? Click one button and the AI instantly adjusts your training load for active recovery.
            </p>
          </div>

          <div className="bg-slate-800/50 p-8 rounded-2xl border border-slate-700/50">
            <div className="w-12 h-12 bg-green-500/20 text-green-400 rounded-xl flex items-center justify-center text-2xl mb-4">
              🥗
            </div>
            <h3 className="text-xl font-bold mb-2">Tailored Nutrition</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Get daily meal recommendations structured to complement your current workouts and calorie needs.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}