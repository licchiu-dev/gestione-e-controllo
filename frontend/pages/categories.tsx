import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Nav from '../components/Nav'
import { downloadCSV } from '../lib/csvUtils'
import { supabase } from '../lib/supabaseClient'

export default function Categories() {
  const router = useRouter()
  const [session, setSession] = useState(null)
  const [categories, setCategories] = useState([])
  const [name, setName] = useState('')
  const [macroCategory, setMacroCategory] = useState('')
  const [type, setType] = useState('expense')
  const [description, setDescription] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getSession()
      if (!data.session) {
        router.push('/login')
        return
      }
      setSession(data.session)
      const { data: rows } = await supabase.from('categories').select('*').order('name', { ascending: true })
      setCategories(rows || [])
    }
    load()
  }, [router])

  const handleCreate = async (event) => {
    event.preventDefault()
    if (!session) return
    await supabase.from('categories').insert([{
      user_id: session.user.id,
      name,
      macro_category: macroCategory,
      type,
      description,
    }])
    setName('')
    setMacroCategory('')
    setDescription('')
    const { data: rows } = await supabase.from('categories').select('*').order('name', { ascending: true })
    setCategories(rows || [])
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Nav />
      <main className="max-w-6xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Categorie</h1>
        <div className="mb-6 grid gap-4 lg:grid-cols-[1fr_2fr]">
          <form onSubmit={handleCreate} className="space-y-3 bg-white p-4 rounded shadow">
            <h2 className="text-lg font-semibold">Nuova categoria</h2>
            <label className="block">
              <span className="text-sm font-medium">Nome</span>
              <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full rounded border p-2" required />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Macro categoria</span>
              <input value={macroCategory} onChange={(e) => setMacroCategory(e.target.value)} className="mt-1 block w-full rounded border p-2" />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Tipo</span>
              <select value={type} onChange={(e) => setType(e.target.value)} className="mt-1 block w-full rounded border p-2">
                <option value="expense">Uscita</option>
                <option value="income">Entrata</option>
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium">Descrizione</span>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 block w-full rounded border p-2" rows={3} />
            </label>
            <button className="px-4 py-2 bg-blue-600 text-white rounded">Aggiungi</button>
          </form>
          <div className="bg-white p-4 rounded shadow overflow-x-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Elenco categorie</h2>
              <button onClick={() => downloadCSV('categories.csv', categories)} className="px-3 py-1 bg-slate-700 text-white rounded text-sm">Esporta CSV</button>
            </div>
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b">
                  <th className="p-2">Nome</th>
                  <th className="p-2">Macro</th>
                  <th className="p-2">Tipo</th>
                  <th className="p-2">Descrizione</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((item) => (
                  <tr key={item.id} className="border-b odd:bg-slate-50">
                    <td className="p-2">{item.name}</td>
                    <td className="p-2">{item.macro_category}</td>
                    <td className="p-2">{item.type}</td>
                    <td className="p-2">{item.description}</td>
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
