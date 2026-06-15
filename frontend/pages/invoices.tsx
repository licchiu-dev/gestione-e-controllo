import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Nav from '../components/Nav'
import { downloadCSV } from '../lib/csvUtils'
import { supabase } from '../lib/supabaseClient'

export default function Invoices() {
  const router = useRouter()
  const [session, setSession] = useState(null)
  const [invoices, setInvoices] = useState([])
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [invoiceType, setInvoiceType] = useState('active')
  const [invoiceDate, setInvoiceDate] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [totalAmount, setTotalAmount] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getSession()
      if (!data.session) {
        router.push('/login')
        return
      }
      setSession(data.session)
      const { data: rows } = await supabase.from('invoices').select('*').order('created_at', { ascending: false })
      setInvoices(rows || [])
    }
    load()
  }, [router])

  const handleCreate = async (event) => {
    event.preventDefault()
    if (!session) return
    const total = parseFloat(totalAmount)
    await supabase.from('invoices').insert([{
      user_id: session.user.id,
      invoice_type: invoiceType,
      invoice_number: invoiceNumber,
      invoice_date: invoiceDate,
      due_date: dueDate,
      total_amount: total,
      paid_amount: 0,
      residual_amount: total,
      status: 'open',
    }])
    setInvoiceNumber('')
    setInvoiceDate('')
    setDueDate('')
    setTotalAmount('')
    const { data: rows } = await supabase.from('invoices').select('*').order('created_at', { ascending: false })
    setInvoices(rows || [])
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Nav />
      <main className="max-w-6xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Fatture</h1>
        <div className="mb-6 grid gap-4 lg:grid-cols-[1fr_2fr]">
          <form onSubmit={handleCreate} className="space-y-3 bg-white p-4 rounded shadow">
            <h2 className="text-lg font-semibold">Nuova fattura</h2>
            <label className="block">
              <span className="text-sm font-medium">Tipo</span>
              <select value={invoiceType} onChange={(e) => setInvoiceType(e.target.value)} className="mt-1 block w-full rounded border p-2">
                <option value="active">Attiva</option>
                <option value="passive">Passiva</option>
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium">Numero</span>
              <input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} className="mt-1 block w-full rounded border p-2" required />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Data fattura</span>
              <input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} className="mt-1 block w-full rounded border p-2" required />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Data scadenza</span>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="mt-1 block w-full rounded border p-2" />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Totale</span>
              <input type="number" step="0.01" value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} className="mt-1 block w-full rounded border p-2" required />
            </label>
            <button className="px-4 py-2 bg-blue-600 text-white rounded">Crea fattura</button>
          </form>
          <div className="bg-white p-4 rounded shadow overflow-x-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Elenco fatture</h2>
              <button onClick={() => downloadCSV('invoices.csv', invoices)} className="px-3 py-1 bg-slate-700 text-white rounded text-sm">Esporta CSV</button>
            </div>
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b">
                  <th className="p-2">Tipo</th>
                  <th className="p-2">Numero</th>
                  <th className="p-2">Data</th>
                  <th className="p-2">Totale</th>
                  <th className="p-2">Stato</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((item) => (
                  <tr key={item.id} className="border-b odd:bg-slate-50">
                    <td className="p-2">{item.invoice_type}</td>
                    <td className="p-2">{item.invoice_number}</td>
                    <td className="p-2">{item.invoice_date}</td>
                    <td className="p-2">{item.total_amount}</td>
                    <td className="p-2">{item.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
