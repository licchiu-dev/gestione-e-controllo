import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Nav from '../components/Nav'
import { downloadCSV } from '../lib/csvUtils'
import { supabase } from '../lib/supabaseClient'

export default function BankTransactions() {
  const router = useRouter()
  const [session, setSession] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [transactionDate, setTransactionDate] = useState('')
  const [valueDate, setValueDate] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [direction, setDirection] = useState('expense')

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getSession()
      if (!data.session) {
        router.push('/login')
        return
      }
      setSession(data.session)
      const { data: rows } = await supabase.from('bank_transactions').select('*').order('created_at', { ascending: false })
      setTransactions(rows || [])
    }
    load()
  }, [router])

  const handleCreate = async (event) => {
    event.preventDefault()
    if (!session) return
    await supabase.from('bank_transactions').insert([{
      user_id: session.user.id,
      transaction_date: transactionDate,
      value_date: valueDate,
      description,
      amount: parseFloat(amount),
      direction,
      status: 'unmapped',
      confidence_score: 0,
    }])
    setTransactionDate('')
    setValueDate('')
    setDescription('')
    setAmount('')
    const { data: rows } = await supabase.from('bank_transactions').select('*').order('created_at', { ascending: false })
    setTransactions(rows || [])
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Nav />
      <main className="max-w-6xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Movimenti bancari</h1>
        <div className="mb-6 grid gap-4 lg:grid-cols-[1fr_2fr]">
          <form onSubmit={handleCreate} className="space-y-3 bg-white p-4 rounded shadow">
            <h2 className="text-lg font-semibold">Nuovo movimento</h2>
            <label className="block">
              <span className="text-sm font-medium">Data movimento</span>
              <input type="date" value={transactionDate} onChange={(e) => setTransactionDate(e.target.value)} className="mt-1 block w-full rounded border p-2" required />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Data valuta</span>
              <input type="date" value={valueDate} onChange={(e) => setValueDate(e.target.value)} className="mt-1 block w-full rounded border p-2" />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Descrizione</span>
              <input value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 block w-full rounded border p-2" required />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Importo</span>
              <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1 block w-full rounded border p-2" required />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Direzione</span>
              <select value={direction} onChange={(e) => setDirection(e.target.value)} className="mt-1 block w-full rounded border p-2">
                <option value="expense">Spesa</option>
                <option value="income">Entrata</option>
              </select>
            </label>
            <button className="px-4 py-2 bg-blue-600 text-white rounded">Aggiungi movimento</button>
          </form>
          <div className="bg-white p-4 rounded shadow overflow-x-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Elenco movimenti</h2>
              <button onClick={() => downloadCSV('bank_transactions.csv', transactions)} className="px-3 py-1 bg-slate-700 text-white rounded text-sm">Esporta CSV</button>
            </div>
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b">
                  <th className="p-2">Data</th>
                  <th className="p-2">Descrizione</th>
                  <th className="p-2">Importo</th>
                  <th className="p-2">Direzione</th>
                  <th className="p-2">Stato</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((item) => (
                  <tr key={item.id} className="border-b odd:bg-slate-50">
                    <td className="p-2">{item.transaction_date}</td>
                    <td className="p-2">{item.description}</td>
                    <td className="p-2">{item.amount}</td>
                    <td className="p-2">{item.direction}</td>
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
