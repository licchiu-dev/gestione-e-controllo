import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-2xl p-8 bg-white rounded shadow">
        <h1 className="text-2xl font-bold mb-4">Gestionale Cassa</h1>
        <p className="mb-4">Benvenuto. Accedi o registrati per cominciare.</p>
        <div className="flex gap-2">
          <Link href="/login" className="px-4 py-2 bg-blue-600 text-white rounded">Login</Link>
          <Link href="/register" className="px-4 py-2 bg-green-600 text-white rounded">Registrati</Link>
          <Link href="/dashboard" className="px-4 py-2 bg-gray-200 rounded">Dashboard</Link>
        </div>
      </div>
    </div>
  )
}
