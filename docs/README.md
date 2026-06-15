Istruzioni iniziali:

1. Creare un progetto Supabase e ottenere `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
2. Importare il file SQL `schema.sql` nel database per creare le tabelle e le policy RLS.
3. Copiare `.env.example` in `.env.local` nel frontend e inserire le variabili ambiente.
4. Avviare il frontend con `npm install` e `npm run dev` dalla cartella `frontend`.
5. Registrare un nuovo utente su `/register`, quindi accedere su `/login`.

Le pagine principali sono:
- `/dashboard`
- `/invoices`
- `/bank-transactions`
- `/counterparties`
- `/categories`
- `/import`
- `/reconciliation`
- `/simulation`

Per la classificazione AI: fornire `OPENAI_API_KEY` in produzione.
