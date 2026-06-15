import Link from 'next/link'

export default function Nav() {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3 py-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-lg font-semibold text-slate-900">Gestionale Cassa</Link>
            <nav className="flex flex-wrap gap-2 text-sm text-slate-600">
              <Link href="/dashboard" className="hover:text-slate-900">Dashboard</Link>
              <Link href="/invoices" className="hover:text-slate-900">Fatture</Link>
              <Link href="/bank-transactions" className="hover:text-slate-900">Movimenti</Link>
              <Link href="/counterparties" className="hover:text-slate-900">Anagrafiche</Link>
              <Link href="/categories" className="hover:text-slate-900">Categorie</Link>
              <Link href="/import" className="hover:text-slate-900">Import CSV</Link>
              <Link href="/reconciliation" className="hover:text-slate-900">Riconciliazione</Link>
              <Link href="/simulation" className="hover:text-slate-900">Simulazione</Link>
            </nav>
          </div>
          <div>
            <Link href="/logout" className="text-sm px-3 py-2 rounded bg-red-600 text-white">Logout</Link>
          </div>
        </div>
      </div>
    </header>
  )
}
