-- Schema SQL per Supabase
-- Tabelle principali e Row Level Security (RLS)

-- Users: dati aggiuntivi (Supabase Auth gestisce auth.users)
create table if not exists app_users (
  id uuid primary key,
  name text,
  email text,
  created_at timestamptz default now()
);

-- Row Level Security for app_users
alter table app_users enable row level security;
create policy "select_own_app_users" on app_users
  for select using (id = auth.uid());
create policy "insert_own_app_users" on app_users
  for insert with check (id = auth.uid());
create policy "update_own_app_users" on app_users
  for update using (id = auth.uid()) with check (id = auth.uid());
create policy "delete_own_app_users" on app_users
  for delete using (id = auth.uid());

-- Counterparties
create table if not exists counterparties (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  name text not null,
  type text,
  vat_number text,
  fiscal_code text,
  iban text,
  notes text,
  created_at timestamptz default now()
);

-- Invoices
create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  invoice_type text,
  invoice_number text,
  invoice_date date,
  due_date date,
  expected_payment_date date,
  counterparty_id uuid references counterparties(id),
  description text,
  taxable_amount numeric,
  vat_amount numeric,
  total_amount numeric,
  paid_amount numeric default 0,
  residual_amount numeric,
  status text,
  source_file_id uuid,
  import_hash text,
  created_at timestamptz default now()
);

-- BankTransactions
create table if not exists bank_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  transaction_date date,
  value_date date,
  description text,
  amount numeric,
  direction text,
  counterparty_id uuid references counterparties(id),
  category_id uuid,
  linked_invoice_id uuid references invoices(id),
  confidence_score numeric,
  status text,
  source_file_id uuid,
  import_hash text,
  created_at timestamptz default now()
);

-- Categories
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  name text,
  macro_category text,
  type text,
  description text
);

-- CashSimulationItems
create table if not exists cash_simulation_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  name text,
  type text,
  amount_mode text,
  fixed_amount numeric,
  linked_category_ids uuid[],
  linked_counterparty_ids uuid[],
  periodicity text,
  start_date date,
  end_date date,
  due_day int,
  notes text
);

-- UploadedFiles
create table if not exists uploaded_files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  file_name text,
  file_type text,
  uploaded_at timestamptz default now(),
  rows_imported int default 0,
  rows_skipped int default 0,
  notes text
);

-- Index su import_hash per deduplicazione
create index if not exists idx_invoices_import_hash on invoices(import_hash);
create index if not exists idx_bank_transactions_import_hash on bank_transactions(import_hash);

-- Abilita RLS per le tabelle sensibili
alter table counterparties enable row level security;
alter table invoices enable row level security;
alter table bank_transactions enable row level security;
alter table categories enable row level security;
alter table cash_simulation_items enable row level security;
alter table uploaded_files enable row level security;

-- Policy: SELECT solo per owner
create policy "select_own" on counterparties
  for select using (user_id = auth.uid());
create policy "insert_own" on counterparties
  for insert with check (user_id = auth.uid());
create policy "update_own" on counterparties
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "delete_own" on counterparties
  for delete using (user_id = auth.uid());

create policy "select_own_invoices" on invoices
  for select using (user_id = auth.uid());
create policy "insert_own_invoices" on invoices
  for insert with check (user_id = auth.uid());
create policy "update_own_invoices" on invoices
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "delete_own_invoices" on invoices
  for delete using (user_id = auth.uid());

create policy "select_own_bank" on bank_transactions
  for select using (user_id = auth.uid());
create policy "insert_own_bank" on bank_transactions
  for insert with check (user_id = auth.uid());
create policy "update_own_bank" on bank_transactions
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "delete_own_bank" on bank_transactions
  for delete using (user_id = auth.uid());

create policy "select_own_categories" on categories
  for select using (user_id = auth.uid());
create policy "insert_own_categories" on categories
  for insert with check (user_id = auth.uid());
create policy "update_own_categories" on categories
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "delete_own_categories" on categories
  for delete using (user_id = auth.uid());

create policy "select_own_simulation" on cash_simulation_items
  for select using (user_id = auth.uid());
create policy "insert_own_simulation" on cash_simulation_items
  for insert with check (user_id = auth.uid());
create policy "update_own_simulation" on cash_simulation_items
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "delete_own_simulation" on cash_simulation_items
  for delete using (user_id = auth.uid());

create policy "select_own_uploaded" on uploaded_files
  for select using (user_id = auth.uid());
create policy "insert_own_uploaded" on uploaded_files
  for insert with check (user_id = auth.uid());
create policy "update_own_uploaded" on uploaded_files
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "delete_own_uploaded" on uploaded_files
  for delete using (user_id = auth.uid());

-- Fine schema
