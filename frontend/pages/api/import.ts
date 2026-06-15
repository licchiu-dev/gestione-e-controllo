import type { NextApiRequest, NextApiResponse } from 'next'
import { getSupabaseServer } from '../../lib/supabaseServer'

const fieldSynonyms = {
  invoice_number: ['invoice number', 'numero fattura', 'n. fattura', 'fattura', 'nr fattura'],
  invoice_date: ['invoice date', 'data fattura', 'data'],
  due_date: ['due date', 'data scadenza', 'scadenza'],
  expected_payment_date: ['expected payment date', 'data pagamento', 'pagamento previsto'],
  counterparty_name: ['counterparty', 'cliente', 'fornitore', 'anagrafica'],
  description: ['description', 'descrizione', 'causale'],
  taxable_amount: ['taxable amount', 'imponibile', 'base imponibile'],
  vat_amount: ['vat amount', 'iva', 'importo iva'],
  total_amount: ['total amount', 'totale', 'importo totale'],
  paid_amount: ['paid amount', 'pagato', 'importo pagato'],
  transaction_date: ['transaction date', 'data movimento', 'data operazione'],
  value_date: ['value date', 'data valuta', 'data contabile'],
  amount: ['amount', 'importo', 'valore'],
  direction: ['direction', 'tipo', 'direzione', 'income/expense'],
  iban: ['iban'],
}

function normalizeText(value) {
  if (value === null || value === undefined) return ''
  return String(value).trim()
}

function normalizeDate(value) {
  if (!value) return null
  const maybeDate = new Date(String(value))
  if (isNaN(maybeDate.getTime())) return null
  return maybeDate.toISOString().slice(0, 10)
}

function normalizeNumber(value) {
  if (value === null || value === undefined || value === '') return null
  const normalized = String(value).replace(/[^0-9.,-]/g, '').replace(',', '.')
  const parsed = parseFloat(normalized)
  return Number.isNaN(parsed) ? null : parsed
}

function findBestMatch(header) {
  const lower = header.toLowerCase()
  for (const [key, synonyms] of Object.entries(fieldSynonyms)) {
    if (key === lower) return key
    for (const synonym of synonyms) {
      if (lower.includes(synonym)) return key
    }
  }
  return null
}

function mapObject(record) {
  const mapped = {}
  for (const [key, value] of Object.entries(record)) {
    const mappedKey = findBestMatch(key)
    if (mappedKey) mapped[mappedKey] = value
  }
  return mapped
}

function computeImportHash(fields) {
  const normalized = JSON.stringify(fields)
  return Buffer.from(normalized).toString('base64')
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const authHeader = req.headers.authorization || ''
  const token = authHeader.replace('Bearer ', '').trim()
  if (!token) return res.status(401).json({ error: 'Missing authorization token' })

  const supabase = getSupabaseServer()
  const { data: userData, error: userError } = await supabase.auth.getUser(token)
  if (userError || !userData?.user) {
    return res.status(401).json({ error: 'Invalid user token' })
  }

  const { importType, fileName, rows } = req.body
  if (!importType || !Array.isArray(rows)) {
    return res.status(400).json({ error: 'Missing importType or rows' })
  }

  const tableName = importType === 'bank_transactions' ? 'bank_transactions' : 'invoices'
  const invoiceType = importType === 'passive_invoices' ? 'passive' : 'active'

  let inserted = 0
  let skipped = 0
  const errors = []

  for (const row of rows) {
    const mapped = mapObject(row) as Record<string, any>
    const common = {
      user_id: userData.user.id,
      source_file_id: null,
    }

    if (tableName === 'invoices') {
      const invoiceNumber = normalizeText(mapped['invoice_number'])
      const invoiceDate = normalizeDate(mapped['invoice_date'])
      const dueDate = normalizeDate(mapped.due_date)
      const expectedPaymentDate = normalizeDate(mapped.expected_payment_date)
      const totalAmount = normalizeNumber(mapped.total_amount)
      const taxableAmount = normalizeNumber(mapped.taxable_amount)
      const vatAmount = normalizeNumber(mapped.vat_amount)
      const paidAmount = normalizeNumber(mapped.paid_amount) ?? 0
      const description = normalizeText(mapped.description)
      const counterpartyName = normalizeText(mapped.counterparty_name)
      const status = totalAmount === null ? 'open' : paidAmount >= totalAmount ? 'paid' : 'open'
      const residualAmount = totalAmount !== null ? totalAmount - paidAmount : null

      const importHash = computeImportHash({
        invoice_type: invoiceType,
        invoice_number: invoiceNumber,
        invoice_date: invoiceDate,
        total_amount: totalAmount,
        counterparty_name: counterpartyName,
      })

      const { data: existing, error: existingError } = await supabase
        .from(tableName)
        .select('id')
        .eq('user_id', userData.user.id)
        .eq('import_hash', importHash)
        .limit(1)

      if (existingError) {
        errors.push({ row, message: existingError.message })
        continue
      }

      if (existing?.length > 0) {
        skipped += 1
        continue
      }

      const insertData = {
        ...common,
        invoice_type: invoiceType,
        invoice_number: invoiceNumber,
        invoice_date: invoiceDate,
        due_date: dueDate,
        expected_payment_date: expectedPaymentDate,
        description,
        taxable_amount: taxableAmount,
        vat_amount: vatAmount,
        total_amount: totalAmount,
        paid_amount: paidAmount,
        residual_amount: residualAmount,
        status,
        import_hash: importHash,
      }

      const { error: insertError } = await supabase.from(tableName).insert([insertData])
      if (insertError) {
        errors.push({ row, message: insertError.message })
      } else {
        inserted += 1
      }
      continue
    }

    // bank_transactions
    const transactionDate = normalizeDate(mapped.transaction_date)
    const valueDate = normalizeDate(mapped.value_date)
    const amount = normalizeNumber(mapped.amount)
    const description = normalizeText(mapped.description)
    const direction = normalizeText(mapped.direction) || (amount >= 0 ? 'income' : 'expense')
    const iban = normalizeText(mapped.iban)
    const confidenceScore = 0.0

    const importHash = computeImportHash({
      transaction_date: transactionDate,
      value_date: valueDate,
      amount,
      description,
      iban,
    })

    const { data: existing, error: existingError } = await supabase
      .from(tableName)
      .select('id')
      .eq('user_id', userData.user.id)
      .eq('import_hash', importHash)
      .limit(1)

    if (existingError) {
      errors.push({ row, message: existingError.message })
      continue
    }

    if (existing?.length > 0) {
      skipped += 1
      continue
    }

    const insertData = {
      ...common,
      transaction_date: transactionDate,
      value_date: valueDate,
      description,
      amount,
      direction,
      confidence_score: confidenceScore,
      status: 'unmapped',
      import_hash: importHash,
    }

    const { error: insertError } = await supabase.from(tableName).insert([insertData])
    if (insertError) {
      errors.push({ row, message: insertError.message })
    } else {
      inserted += 1
    }
  }

  await supabase.from('uploaded_files').insert([
    {
      user_id: userData.user.id,
      file_name: fileName || 'import.csv',
      file_type: importType,
      rows_imported: inserted,
      rows_skipped: skipped,
      notes: 'Import automatico CSV via API',
    },
  ])

  return res.status(200).json({ inserted, skipped, errors })
}
