Progetto: Gestionale Cassa — Next.js + Supabase

Struttura:
- frontend/: Next.js + Tailwind + Supabase client
- backend/: FastAPI (skeleton per motore classificazione opzionale)
- docs/: SQL schema e istruzioni

Per iniziare (frontend):

1. Copiare `.env.example` in `.env.local` e inserire le variabili Supabase:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (solo lato server se usato)
   - `OPENAI_API_KEY` (opzionale, per funzioni AI)
2. Entrare in `frontend`, installare le dipendenze e avviare l'app:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
3. Aprire il browser su `http://localhost:3000`.
4. Registrare un utente su `/register`, quindi accedere su `/login`.

Per deploy su Vercel:
- collegare il repo a Vercel;
- configurare le variabili ambiente identiche a `.env.example`;
- deployare con `npm run build`.

Pagine principali disponibili:
- `/dashboard`
- `/invoices`
- `/bank-transactions`
- `/counterparties`
- `/categories`
- `/import`
- `/reconciliation`
- `/simulation`

Per creare lo schema Supabase:
1. Creare un progetto Supabase.
2. Importare il file SQL `docs/schema.sql` nel database.
3. Verificare che le policy RLS siano attive.
