import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabaseClient'

export default function Logout() {
  const router = useRouter()

  useEffect(() => {
    const signOut = async () => {
      await supabase.auth.signOut()
      router.push('/login')
    }
    signOut()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="p-6 bg-white rounded shadow">Uscita in corso...</div>
    </div>
  )
}
