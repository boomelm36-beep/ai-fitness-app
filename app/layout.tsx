// app/layout.tsx
import './globals.css'
import Link from 'next/link'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-100 text-gray-900">
        <nav className="bg-blue-600 text-white p-4 flex gap-6 justify-center shadow-md">
          <Link href="/dashboard" className="hover:underline">Dashboard</Link>
          <Link href="/weight" className="hover:underline">Weight</Link>
          <Link href="/exercise" className="hover:underline">Exercise Plan</Link>
          <Link href="/nutrition" className="hover:underline">Nutrition</Link>
        </nav>
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  )
}