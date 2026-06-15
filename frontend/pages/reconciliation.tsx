import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Nav from '../components/Nav'
import { supabase } from '../lib/supabaseClient'

export default function Reconciliation() {
  const router = useRouter()
  const [session, setSession] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [openInvoices, setOpenInvoices] = useState([])
  const [suggestion, setSuggestion] = useState(null)
  const [selectedTransaction, setSelectedTransaction] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getSession()
      if (!data.session) {
        router.push('/login')
        return
      }
      setSession(data.session)
      const [{ data: transactionsData }, { data: invoicesData }] = await Promise.all([
        supabase.from('bank_transactions').select('*').eq('status', 'unmapped').order('transaction_date', { ascending: false }),
        supabase.from('invoices').select('*').in('status', ['open', 'partially_paid']).order('due_date', { ascending: true }),
      ])
      setTransactions(transactionsData || [])
      setOpenInvoices(invoicesData || [])
    }
    load()
  }, [router])

  const reloadData = async () => {
    const [{ data: transactionsData }, { data: invoicesData }] = await Promise.all([
      supabase.from('bank_transactions').select('*').eq('status', 'unmapped').order('transaction_date', { ascending: false }),
      supabase.from('invoices').select('*').in('status', ['open', 'partially_paid']).order('due_date', { ascending: true }),
    ])
    setTransactions(transactionsData || [])
    setOpenInvoices(invoicesData || [])
  }

  const handleSuggest = async (transaction) => {
    setLoading(true)
    setMessage('')
    setSelectedTransaction(transaction)
    const session = await supabase.auth.getSession()
    const token = session.data.session?.access_token
    const response = await fetch('/api/classify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        description: transaction.description,
        amount: transaction.amount,
        transaction_date: transaction.transaction_date,
        value_date: transaction.value_date,
        iban: transaction.iban || '',
        candidateCounterparties: openInvoices.map((invoice) => invoice.invoice_number),
        openInvoices,
      }),
    })
    const result = await response.json()
    setSuggestion(result.result || { raw: result.raw })
    setLoading(false)
  }

  const handleReconcile = async (transaction, invoice) => {
    setLoading(true)
    setMessage('')
    const updates = []
    const paidAmount = Number(invoice.total_amount || 0)
    const transactionAmount = Number(transaction.amount || 0)
    const newStatus = transactionAmount >= paidAmount ? 'paid' : 'partially_paid'
    const residual = paidAmount - transactionAmount

    updates.push(
      supabase.from('invoices').update({
        paid_amount: transactionAmount,
        residual_amount: residual >= 0 ? residual : 0,
        status: newStatus,
      }).eq('id', invoice.id),
    )

    updates.push(
      supabase.from('bank_transactions').update({
        linked_invoice_id: invoice.id,
        status: 'mapped',
        confidence_score: 0.8,
      }).eq('id', transaction.id),
    )

    const results = await Promise.all(updates)
    const failed = results.find((item) => item.error)
    if (failed) {
      setMessage('Errore durante la riconciliazione. Controlla i dati e riprova.')
    } else {
      setMessage('Riconciliazione completata con successo.')
      reloadData()
      setSuggestion(null)
      setSelectedTransaction(null)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Nav />
      <main className="max-w-7xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Riconciliazione</h1>
        {message && <div className="mb-4 rounded border border-green-200 bg-green-50 p-4 text-sm text-slate-700">{message}</div>}
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="bg-white p-4 rounded shadow">
            <h2 className="text-lg font-semibold mb-4">Movimenti non classificati</h2>
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div key={tx.id} className="border rounded p-3">
                  <div className="flex flex-wrap justify-between gap-3">
                    <div>
                      <p className="font-semibold">{tx.description}</p>
                      <p className="text-sm text-slate-600">{tx.transaction_date} • {tx.amount} €</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="px-3 py-1 bg-blue-600 text-white rounded"
                        onClick={() => handleSuggest(tx)}
                      >
                        Suggerisci AI
                      </button>
                      <button
                        className="px-3 py-1 bg-emerald-600 text-white rounded"
                        onClick={() => setSelectedTransaction(tx)}
                      >
                        Associa manuale
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {!transactions.length && <p className="text-sm text-slate-600">Nessun movimento non classificato al momento.</p>}
            </div>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <h2 className="text-lg font-semibold mb-4">Suggerimento AI</h2>
            {loading && <p className="text-sm text-slate-600">Caricamento suggerimento...</p>}
            {!loading && suggestion && (
              <pre className="whitespace-pre-wrap text-sm text-slate-800">{JSON.stringify(suggestion, null, 2)}</pre>
            )}
            {!loading && !suggestion && <p className="text-sm text-slate-600">Seleziona un movimento per ottenere un suggerimento.</p>}
          </div>
        </div>

        {selectedTransaction && (
          <section className="mt-6 bg-white p-4 rounded shadow">
            <h2 className="text-lg font-semibold mb-4">Associa movimento</h2>
            <p className="text-sm text-slate-600 mb-4">Movimento selezionato: {selectedTransaction.description} • €{selectedTransaction.amount}</p>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="p-2">Fattura</th>
                    <th className="p-2">Tipo</th>
                    <th className="p-2">Totale</th>
                    <th className="p-2">Stato</th>
                    <th className="p-2">Azione</th>
                  </tr>
                </thead>
                <tbody>
                  {openInvoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b odd:bg-slate-50">
                      <td className="p-2">{invoice.invoice_number}</td>
                      <td className="p-2">{invoice.invoice_type}</td>
                      <td className="p-2">€{invoice.total_amount}</td>
                      <td className="p-2">{invoice.status}</td>
                      <td className="p-2">
                        <button
                          className="px-3 py-1 bg-blue-600 text-white rounded"
                          onClick={() => handleReconcile(selectedTransaction, invoice)}
                        >
                          Riconcilia
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
