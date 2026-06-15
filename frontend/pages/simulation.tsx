import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import Nav from '../components/Nav'
import { supabase } from '../lib/supabaseClient'

const monthNames = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic']

export default function Simulation() {
  const router = useRouter()
  const [session, setSession] = useState(null)
  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [counterparties, setCounterparties] = useState([])
  const [name, setName] = useState('')
  const [type, setType] = useState('expense')
  const [amountMode, setAmountMode] = useState('fixed')
  const [fixedAmount, setFixedAmount] = useState('')
  const [periodicity, setPeriodicity] = useState('monthly')
  const [dueDay, setDueDay] = useState(1)
  const [linkedCategoryIds, setLinkedCategoryIds] = useState([])
  const [linkedCounterpartyIds, setLinkedCounterpartyIds] = useState([])
  const [forecast, setForecast] = useState([])

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getSession()
      if (!data.session) {
        router.push('/login')
        return
      }
      setSession(data.session)
      const [itemsRes, categoriesRes, counterpartiesRes] = await Promise.all([
        supabase.from('cash_simulation_items').select('*').order('created_at', { ascending: false }),
        supabase.from('categories').select('*').order('name', { ascending: true }),
        supabase.from('counterparties').select('*').order('name', { ascending: true }),
      ])
      setItems(itemsRes.data || [])
      setCategories(categoriesRes.data || [])
      setCounterparties(counterpartiesRes.data || [])
    }
    load()
  }, [router])

  const handleCreate = async (event) => {
    event.preventDefault()
    if (!session) return
    await supabase.from('cash_simulation_items').insert([{
      user_id: session.user.id,
      name,
      type,
      amount_mode: amountMode,
      fixed_amount: parseFloat(fixedAmount) || 0,
      periodicity,
      due_day: dueDay,
      linked_category_ids: linkedCategoryIds,
      linked_counterparty_ids: linkedCounterpartyIds,
    }])
    setName('')
    setFixedAmount('')
    setLinkedCategoryIds([])
    setLinkedCounterpartyIds([])
    const { data: rows } = await supabase.from('cash_simulation_items').select('*').order('created_at', { ascending: false })
    setItems(rows || [])
  }

  const forecastData = useMemo(() => {
    const now = new Date()
    const projections = []
    let balance = 0

    for (let i = 0; i < 6; i += 1) {
      const month = new Date(now.getFullYear(), now.getMonth() + i, 1)
      const label = `${monthNames[month.getMonth()]} ${month.getFullYear()}`
      let monthTotal = 0
      items.forEach((item) => {
        let amount = 0
        if (item.amount_mode === 'fixed') amount = Number(item.fixed_amount || 0)
        if (item.amount_mode === 'manual') amount = Number(item.fixed_amount || 0)
        if (item.amount_mode === 'average_from_categories') amount = Number(item.fixed_amount || 0)
        monthTotal += item.type === 'expense' ? -amount : amount
      })
      balance += monthTotal
      projections.push({ month: label, total: monthTotal, cumulative: balance })
    }
    return projections
  }, [items])

  const totalExposure = useMemo(() => items.reduce((sum, item) => sum + (item.type === 'expense' ? -(Number(item.fixed_amount) || 0) : Number(item.fixed_amount) || 0), 0), [items])

  return (
    <div className="min-h-screen bg-slate-50">
      <Nav />
      <main className="max-w-7xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Simulazione di cassa</h1>
        <div className="mb-6 grid gap-4 lg:grid-cols-[1fr_2fr]">
          <form onSubmit={handleCreate} className="space-y-3 bg-white p-4 rounded shadow">
            <h2 className="text-lg font-semibold">Nuova voce previsionale</h2>
            <label className="block">
              <span className="text-sm font-medium">Nome</span>
              <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full rounded border p-2" required />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Tipo</span>
              <select value={type} onChange={(e) => setType(e.target.value)} className="mt-1 block w-full rounded border p-2">
                <option value="expense">Spesa</option>
                <option value="income">Entrata</option>
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium">Modalità importo</span>
              <select value={amountMode} onChange={(e) => setAmountMode(e.target.value)} className="mt-1 block w-full rounded border p-2">
                <option value="fixed">Fisso</option>
                <option value="average_from_categories">Media da categorie</option>
                <option value="manual">Manuale</option>
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium">Importo</span>
              <input type="number" step="0.01" value={fixedAmount} onChange={(e) => setFixedAmount(e.target.value)} className="mt-1 block w-full rounded border p-2" />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Categorie collegate</span>
              <select multiple value={linkedCategoryIds} onChange={(e) => setLinkedCategoryIds(Array.from(e.target.selectedOptions, (o) => o.value))} className="mt-1 block w-full rounded border p-2 h-28">
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium">Controparti collegate</span>
              <select multiple value={linkedCounterpartyIds} onChange={(e) => setLinkedCounterpartyIds(Array.from(e.target.selectedOptions, (o) => o.value))} className="mt-1 block w-full rounded border p-2 h-28">
                {counterparties.map((counterparty) => (
                  <option key={counterparty.id} value={counterparty.id}>{counterparty.name}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium">Periodicità</span>
              <select value={periodicity} onChange={(e) => setPeriodicity(e.target.value)} className="mt-1 block w-full rounded border p-2">
                <option value="monthly">Mensile</option>
                <option value="quarterly">Trimestrale</option>
                <option value="yearly">Annuale</option>
                <option value="custom">Custom</option>
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium">Giorno scadenza</span>
              <input type="number" min="1" max="28" value={dueDay} onChange={(e) => setDueDay(Number(e.target.value))} className="mt-1 block w-full rounded border p-2" />
            </label>
            <button className="px-4 py-2 bg-blue-600 text-white rounded">Salva voce</button>
          </form>
          <div className="bg-white p-4 rounded shadow overflow-x-auto">
            <h2 className="text-lg font-semibold mb-4">Voci previsionali</h2>
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b">
                  <th className="p-2">Nome</th>
                  <th className="p-2">Tipo</th>
                  <th className="p-2">Modalità</th>
                  <th className="p-2">Importo</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b odd:bg-slate-50">
                    <td className="p-2">{item.name}</td>
                    <td className="p-2">{item.type}</td>
                    <td className="p-2">{item.amount_mode}</td>
                    <td className="p-2">€{Number(item.fixed_amount || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3 mb-6">
          <div className="bg-white p-5 rounded shadow">
            <h2 className="text-lg font-semibold mb-3">Totale esposizione mensile</h2>
            <p className="text-2xl font-semibold">€{totalExposure.toFixed(2)}</p>
            <p className="text-sm text-slate-600 mt-2">Sommario voci previsionali per mese.</p>
          </div>
          <div className="bg-white p-5 rounded shadow">
            <h2 className="text-lg font-semibold mb-3">Categorie collegate</h2>
            <p className="text-sm text-slate-600">Usa categorie e controparti collegate per creare scenari più realistici.</p>
          </div>
          <div className="bg-white p-5 rounded shadow">
            <h2 className="text-lg font-semibold mb-3">Controparti collegate</h2>
            <p className="text-sm text-slate-600">Esplora i costi associati a fornitori o clienti specifici.</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-4">Previsione cassa</h2>
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b">
                <th className="p-2">Mese</th>
                <th className="p-2">Entrate/Uscite</th>
                <th className="p-2">Saldo cumulato</th>
              </tr>
            </thead>
            <tbody>
              {forecastData.map((item) => (
                <tr key={item.month} className="border-b odd:bg-slate-50">
                  <td className="p-2">{item.month}</td>
                  <td className="p-2">€{item.total.toFixed(2)}</td>
                  <td className="p-2">€{item.cumulative.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}
