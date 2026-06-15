import { useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabaseClient'

export default function Register() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }

    if (data?.user) {
      await supabase.from('app_users').insert([{ id: data.user.id, name, email }])
      setSuccess('Registrazione completata. Controlla la tua email o accedi.')
      router.push('/login')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Registrazione</h2>
        <form onSubmit={handleSubmit}>
          <label className="block mb-2">Nome</label>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full mb-3 p-2 border rounded"
            required
          />
          <label className="block mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full mb-3 p-2 border rounded"
            required
          />
          <label className="block mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full mb-4 p-2 border rounded"
            required
          />

          {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
          {success && <p className="text-sm text-green-600 mb-3">{success}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-green-600 text-white rounded"
          >
            {loading ? 'Caricamento...' : 'Registrati'}
          </button>
        </form>
        <p className="mt-4 text-sm text-gray-600">
          Hai già un account? <a href="/login" className="text-blue-600">Accedi</a>
        </p>
      </div>
    </div>
  )
}
