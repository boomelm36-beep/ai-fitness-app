// app/layout.tsx
import './globals.css'
import Link from 'next/link'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-200 min-h-screen selection:bg-blue-500/30">
        <nav className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/70 border-b border-slate-800">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link href="/" className="font-extrabold text-xl tracking-tight text-white flex items-center gap-2">
                <span className="text-blue-500">⚡</span> AI Fit
              </Link>
              <div className="flex gap-4 sm:gap-6 text-sm sm:text-base font-medium overflow-x-auto no-scrollbar">
                <Link href="/dashboard" className="text-slate-300 hover:text-white transition">Dashboard</Link>
                <Link href="/exercise" className="text-slate-300 hover:text-white transition">Exercise</Link>
                <Link href="/nutrition" className="text-slate-300 hover:text-white transition">Nutrition</Link>
                <Link href="/weight" className="text-slate-300 hover:text-white transition">Weight</Link>
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {children}
        </main>
      </body>
    </html>
  )
}