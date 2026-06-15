import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import Nav from '../components/Nav'
import { supabase } from '../lib/supabaseClient'

const monthNames = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic']

export default function Dashboard() {
  const router = useRouter()
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState([])
  const [invoices, setInvoices] = useState([])

  useEffect(() => {
    const loadData = async () => {
      const { data } = await supabase.auth.getSession()
      if (!data.session) {
        router.push('/login')
        return
      }
      setSession(data.session)

      const [bankRes, invoiceRes] = await Promise.all([
        supabase.from('bank_transactions').select('amount,direction,transaction_date,status').order('transaction_date', { ascending: true }),
        supabase.from('invoices').select('total_amount,status,invoice_type').order('due_date', { ascending: true }),
      ])

      setTransactions(bankRes.data || [])
      setInvoices(invoiceRes.data || [])
      setLoading(false)
    }

    loadData()
  }, [router])

  const metrics = useMemo(() => {
    const income = transactions.reduce((sum, row) => sum + (row.direction === 'income' ? Number(row.amount || 0) : 0), 0)
    const expenses = transactions.reduce((sum, row) => sum + (row.direction === 'expense' ? Number(row.amount || 0) : 0), 0)
    const openReceivables = invoices.filter((row) => row.status === 'open' && row.invoice_type === 'active').reduce((sum, row) => sum + Number(row.total_amount || 0), 0)
    const openPayables = invoices.filter((row) => row.status === 'open' && row.invoice_type === 'passive').reduce((sum, row) => sum + Number(row.total_amount || 0), 0)
    return { income, expenses, openReceivables, openPayables }
  }, [transactions, invoices])

  const monthlySeries = useMemo(() => {
    const now = new Date()
    const months = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1)
      const key = `${date.getFullYear()}-${date.getMonth() + 1}`
      return { label: `${monthNames[date.getMonth()]} ${date.getFullYear()}`, key, income: 0, expenses: 0 }
    })

    transactions.forEach((tx) => {
      const date = new Date(tx.transaction_date)
      const key = `${date.getFullYear()}-${date.getMonth() + 1}`
      const row = months.find((month) => month.key === key)
      if (row) {
        if (tx.direction === 'income') row.income += Number(tx.amount || 0)
        if (tx.direction === 'expense') row.expenses += Number(tx.amount || 0)
      }
    })
    return months
  }, [transactions])

  const statusBuckets = useMemo(() => {
    const open = invoices.filter((row) => row.status === 'open').length
    const partiallyPaid = invoices.filter((row) => row.status === 'partially_paid').length
    const paid = invoices.filter((row) => row.status === 'paid').length
    return { open, partiallyPaid, paid }
  }, [invoices])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="p-6 bg-white rounded shadow">Caricamento dashboard...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Nav />
      <main className="max-w-7xl mx-auto p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-gray-600">Benvenuto, {session.user.email}</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 mb-6">
          <div className="p-5 bg-white rounded shadow">
            <p className="text-sm text-slate-500">Entrate totali</p>
            <p className="text-3xl font-semibold mt-2">€{metrics.income.toFixed(2)}</p>
          </div>
          <div className="p-5 bg-white rounded shadow">
            <p className="text-sm text-slate-500">Uscite totali</p>
            <p className="text-3xl font-semibold mt-2">€{metrics.expenses.toFixed(2)}</p>
          </div>
          <div className="p-5 bg-white rounded shadow">
            <p className="text-sm text-slate-500">Fatture da incassare</p>
            <p className="text-3xl font-semibold mt-2">€{metrics.openReceivables.toFixed(2)}</p>
          </div>
          <div className="p-5 bg-white rounded shadow">
            <p className="text-sm text-slate-500">Fatture da pagare</p>
            <p className="text-3xl font-semibold mt-2">€{metrics.openPayables.toFixed(2)}</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2 mb-6">
          <section className="bg-white p-5 rounded shadow">
            <h2 className="text-lg font-semibold mb-4">Andamento cassa</h2>
            <div className="space-y-3">
              {monthlySeries.map((month) => {
                const total = Math.abs(month.income - month.expenses)
                const max = Math.max(...monthlySeries.map((item) => item.income + item.expenses, 0), 1)
                return (
                  <div key={month.key} className="space-y-1">
                    <div className="flex justify-between text-sm text-slate-600">
                      <span>{month.label}</span>
                      <span>€{(month.income - month.expenses).toFixed(2)}</span>
                    </div>
                    <div className="h-3 bg-slate-100 rounded overflow-hidden">
                      <div className="h-full bg-blue-500 rounded" style={{ width: `${Math.min(100, (total / max) * 100)}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          <section className="bg-white p-5 rounded shadow">
            <h2 className="text-lg font-semibold mb-4">Stato fatture</h2>
            <div className="space-y-4">
              {['open', 'partially_paid', 'paid'].map((status) => (
                <div key={status} className="space-y-1">
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>{status === 'open' ? 'Aperte' : status === 'partially_paid' ? 'Parzialmente pagate' : 'Pagate'}</span>
                    <span>{statusBuckets[status]}</span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded" style={{ width: `${Math.min(100, (statusBuckets[status] / Math.max(1, invoices.length)) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="bg-white p-5 rounded shadow">
            <h2 className="text-lg font-semibold mb-4">Analisi rapida</h2>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>Controlla i movimenti non classificati nella sezione Riconciliazione.</li>
              <li>Verifica le fatture scadute nella pagina Fatture.</li>
              <li>Usa Import CSV per caricare dati in modo rapido.</li>
            </ul>
          </div>
          <div className="bg-white p-5 rounded shadow">
            <h2 className="text-lg font-semibold mb-4">Consigli gestionali</h2>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>Monitora le uscite ricorrenti e confrontale con le previsioni.</li>
              <li>Riconcilia i movimenti con fatture aperte per mantenere i saldi aggiornati.</li>
            </ul>
          </div>
          <div className="bg-white p-5 rounded shadow">
            <h2 className="text-lg font-semibold mb-4">Azioni rapide</h2>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>Vai a <a href="/import" className="text-blue-600">Import CSV</a> per nuovi dati.</li>
              <li>Controlla le previsioni in <a href="/simulation" className="text-blue-600">Simulazione</a>.</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}
