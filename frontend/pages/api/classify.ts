import type { NextApiRequest, NextApiResponse } from 'next'
import { getSupabaseServer } from '../../lib/supabaseServer'

const classificationPrompt = ({ description, amount, transaction_date, value_date, iban, candidateCounterparties, openInvoices }) => `Sei un assistente contabile.
Analizza i seguenti dettagli del movimento bancario e suggerisci:
1) una controparte (se possibile)
2) una categoria (entrata/uscita)
3) se il movimento è associabile a una fattura aperta
4) direzione income/expense
5) confidence_score tra 0 e 1
6) breve spiegazione.

Movimento:
- description: ${description}
- amount: ${amount}
- transaction_date: ${transaction_date}
- value_date: ${value_date}
- iban: ${iban}

Controparti possibili:
${candidateCounterparties.join(', ') || 'nessuna'}

Fatture aperte (numero - importo):
${openInvoices.map((invoice) => `${invoice.invoice_number} (${invoice.total_amount})`).join('; ') || 'nessuna'}

Rispondi solo con JSON valido, ad esempio:
{
  "counterparty": "Nome Fornitore",
  "category": "Forniture",
  "linked_invoice_number": "A-123",
  "direction": "expense",
  "confidence_score": 0.85,
  "explanation": "Pagamento fattura forniture di aprile"
}
`

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

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'Missing OpenAI API key' })

  const {
    description = '',
    amount = 0,
    transaction_date = '',
    value_date = '',
    iban = '',
    candidateCounterparties = [],
    openInvoices = [],
  } = req.body

  try {
    const prompt = classificationPrompt({ description, amount, transaction_date, value_date, iban, candidateCounterparties, openInvoices })
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'Sei un assistente contabile.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.1,
        max_tokens: 400,
      }),
    })

    const payload = await response.json()
    const content = payload.choices?.[0]?.message?.content || ''
    let parsed
    try {
      parsed = JSON.parse(content)
    } catch (error) {
      return res.status(200).json({ raw: content, error: 'OpenAI response could not be parsed as JSON' })
    }

    return res.status(200).json({ result: parsed })
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Classification failed' })
  }
}
