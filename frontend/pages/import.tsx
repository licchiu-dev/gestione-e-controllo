import { useState } from 'react'
import Papa from 'papaparse'
import Nav from '../components/Nav'
import { supabase } from '../lib/supabaseClient'

const importTypes = [
  { value: 'active_invoices', label: 'Fatture attive' },
  { value: 'passive_invoices', label: 'Fatture passive' },
  { value: 'bank_transactions', label: 'Movimenti bancari' },
]

const extractHeaders = (records) => (records.length ? Object.keys(records[0]) : [])

export default function ImportPage() {
  const [file, setFile] = useState(null)
  const [previewRows, setPreviewRows] = useState([])
  const [rows, setRows] = useState([])
  const [importType, setImportType] = useState('active_invoices')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [headers, setHeaders] = useState([])

  const handleFile = (event) => {
    const selected = event.target.files?.[0]
    if (!selected) return
    setFile(selected)
    Papa.parse(selected, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        setRows(result.data)
        setPreviewRows(result.data.slice(0, 5))
        setHeaders(extractHeaders(result.data))
      },
    })
  }

  const handleImport = async () => {
    setLoading(true)
    setMessage('')

    const session = await supabase.auth.getSession()
    const accessToken = session.data.session?.access_token

    if (!accessToken) {
      setMessage('Devi essere loggato per importare i dati.')
      setLoading(false)
      return
    }

    const response = await fetch('/api/import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ importType, fileName: file?.name, rows }),
    })

    const result = await response.json()
    if (!response.ok) {
      setMessage(result.error || 'Errore durante l import')
    } else {
      setMessage(`Import completato: ${result.inserted} importati, ${result.skipped} duplicati.`)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Nav />
      <main className="max-w-6xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Import CSV</h1>
        <div className="grid gap-4 md:grid-cols-2 mb-6">
          <div className="p-4 bg-white rounded shadow">
            <label className="block mb-2 font-medium">Tipo di importazione</label>
            <select
              value={importType}
              onChange={(event) => setImportType(event.target.value)}
              className="w-full p-2 border rounded"
            >
              {importTypes.map((type) => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
          <div className="p-4 bg-white rounded shadow">
            <label className="block mb-2 font-medium">File CSV</label>
            <input type="file" accept=".csv,text/csv" onChange={handleFile} className="w-full" />
          </div>
        </div>

        {headers.length > 0 && (
          <div className="mb-6 p-4 bg-white rounded shadow">
            <h2 className="font-semibold mb-2">Intestazioni riconosciute</h2>
            <div className="flex flex-wrap gap-2">
              {headers.map((header) => (
                <span key={header} className="px-3 py-1 bg-slate-100 rounded">{header}</span>
              ))}
            </div>
          </div>
        )}

        {previewRows.length > 0 && (
          <div className="mb-6 p-4 bg-white rounded shadow">
            <h2 className="font-semibold mb-2">Anteprima</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border-collapse">
                <thead>
                  <tr>
                    {headers.map((header) => (
                      <th key={header} className="border px-2 py-1 text-left bg-slate-100">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, index) => (
                    <tr key={index} className="odd:bg-slate-50">
                      {headers.map((header) => (
                        <td key={header} className="border px-2 py-1">{row[header]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            disabled={!rows.length || loading}
            onClick={handleImport}
            className="px-5 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          >
            {loading ? 'Import in corso...' : 'Importa CSV'}
          </button>
          <span className="text-sm text-slate-600">Righe pronte: {rows.length}</span>
        </div>
        {message && <p className="mt-4 text-sm text-slate-800">{message}</p>}
      </main>
    </div>
  )
}
