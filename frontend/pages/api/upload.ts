import type { NextApiRequest, NextApiResponse } from 'next'

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  // Qui andrà la logica di parsing multipart, salvataggio su Supabase Storage e import
  return res.status(200).json({ ok: true, message: 'Upload endpoint (stub)' })
}
