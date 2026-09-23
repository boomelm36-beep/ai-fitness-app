// app/layout.tsx
import './globals.css'
import Navbar from '@/components/Navbar'
import type { Metadata } from "next";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-200 min-h-screen selection:bg-blue-500/30">
        <Navbar />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {children}
        </main>
      </body>
    </html>
  )
}

export const metadata: Metadata = {
  title: "AI Fitness Protocol",
  description: "Your personalized AI fitness and nutrition tracker.",
  manifest: "/manifest.json",
  themeColor: "#0f172a",
};