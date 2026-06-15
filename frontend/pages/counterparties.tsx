import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Nav from '../components/Nav'
import { downloadCSV } from '../lib/csvUtils'
import { supabase } from '../lib/supabaseClient'

export default function Counterparties() {
  const router = useRouter()
  const [session, setSession] = useState(null)
  const [items, setItems] = useState([])
  const [name, setName] = useState('')
  const [type, setType] = useState('other')
  const [vatNumber, setVatNumber] = useState('')
  const [iban, setIban] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getSession()
      if (!data.session) {
        router.push('/login')
        return
      }
      setSession(data.session)
      const { data: rows } = await supabase.from('counterparties').select('*').order('created_at', { ascending: false })
      setItems(rows || [])
    }
    load()
  }, [router])

  const handleCreate = async (event) => {
    event.preventDefault()
    if (!session) return
    await supabase.from('counterparties').insert([{
      user_id: session.user.id,
      name,
      type,
      vat_number: vatNumber,
      iban,
      notes,
    }])
    setName('')
    setVatNumber('')
    setIban('')
    setNotes('')
    const { data: rows } = await supabase.from('counterparties').select('*').order('created_at', { ascending: false })
    setItems(rows || [])
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Nav />
      <main className="max-w-6xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Anagrafiche</h1>
        <div className="mb-6 grid gap-4 lg:grid-cols-[1fr_2fr]">
          <form onSubmit={handleCreate} className="space-y-3 bg-white p-4 rounded shadow">
            <h2 className="text-lg font-semibold">Nuova anagrafica</h2>
            <label className="block">
              <span className="text-sm font-medium">Nome</span>
              <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full rounded border p-2" required />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Tipo</span>
              <select value={type} onChange={(e) => setType(e.target.value)} className="mt-1 block w-full rounded border p-2">
                <option value="customer">Cliente</option>
                <option value="supplier">Fornitore</option>
                <option value="employee">Dipendente</option>
                <option value="partner">Socio</option>
                <option value="tax">Tributo</option>
                <option value="loan">Finanziamento</option>
                <option value="other">Altro</option>
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium">Partita IVA / Codice fiscale</span>
              <input value={vatNumber} onChange={(e) => setVatNumber(e.target.value)} className="mt-1 block w-full rounded border p-2" />
            </label>
            <label className="block">
              <span className="text-sm font-medium">IBAN</span>
              <input value={iban} onChange={(e) => setIban(e.target.value)} className="mt-1 block w-full rounded border p-2" />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Note</span>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1 block w-full rounded border p-2" rows={3} />
            </label>
            <button className="px-4 py-2 bg-blue-600 text-white rounded">Salva</button>
          </form>
          <div className="bg-white p-4 rounded shadow overflow-x-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Elenco anagrafiche</h2>
              <button
                onClick={() => downloadCSV('counterparties.csv', items)}
                className="px-3 py-1 bg-slate-700 text-white rounded text-sm"
              >
                Esporta CSV
              </button>
            </div>
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b">
                  <th className="p-2">Nome</th>
                  <th className="p-2">Tipo</th>
                  <th className="p-2">IBAN</th>
                  <th className="p-2">Note</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b odd:bg-slate-50">
                    <td className="p-2">{item.name}</td>
                    <td className="p-2">{item.type}</td>
                    <td className="p-2">{item.iban}</td>
                    <td className="p-2">{item.notes}</td>
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
