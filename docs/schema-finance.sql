-- Step 4 backend-ready schema for wholesale/retail finance + ledger

create table if not exists customers (
  id text primary key,
  name text not null,
  channel text not null check (channel in ('wholesale', 'retail')),
  credit_limit numeric(12,2) not null default 0,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists products (
  id text primary key,
  sku text not null unique,
  name text not null,
  barcode text,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists price_lists (
  id text primary key,
  product_id text not null references products(id),
  channel text not null check (channel in ('wholesale', 'retail')),
  price numeric(12,2) not null check (price >= 0),
  active_from date not null,
  active_to date,
  created_at timestamptz not null default now(),
  unique (product_id, channel, active_from)
);

create table if not exists invoices (
  id text primary key,
  customer_id text not null references customers(id),
  invoice_date date not null,
  due_date date not null,
  status text not null check (status in ('draft', 'issued', 'partial', 'paid', 'void')),
  total_amount numeric(12,2) not null check (total_amount >= 0),
  paid_amount numeric(12,2) not null default 0 check (paid_amount >= 0),
  created_by text not null,
  is_deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists invoice_lines (
  id text primary key,
  invoice_id text not null references invoices(id),
  product_id text not null references products(id),
  qty numeric(12,2) not null check (qty > 0),
  unit_price_snapshot numeric(12,2) not null check (unit_price_snapshot >= 0),
  discount_amount numeric(12,2) not null default 0 check (discount_amount >= 0),
  line_total numeric(12,2) not null check (line_total >= 0),
  created_at timestamptz not null default now()
);

create table if not exists payments (
  id text primary key,
  invoice_id text not null references invoices(id),
  customer_id text not null references customers(id),
  payment_date date not null,
  amount numeric(12,2) not null check (amount > 0),
  method text not null check (method in ('cash', 'bank_transfer', 'cheque')),
  note text,
  created_by text not null,
  created_at timestamptz not null default now()
);

create table if not exists expenses (
  id text primary key,
  expense_date date not null,
  category text not null,
  paid_by text not null,
  amount numeric(12,2) not null check (amount > 0),
  note text,
  created_by text not null,
  created_at timestamptz not null default now()
);

create table if not exists other_income (
  id text primary key,
  income_date date not null,
  type text not null,
  source text not null,
  amount numeric(12,2) not null check (amount > 0),
  note text,
  created_by text not null,
  created_at timestamptz not null default now()
);

create table if not exists audit_logs (
  id bigserial primary key,
  table_name text not null,
  record_id text not null,
  action text not null check (action in ('insert', 'update', 'soft_delete')),
  actor text not null,
  before_json jsonb,
  after_json jsonb,
  created_at timestamptz not null default now()
);

create or replace view ledger_entries as
select
  p.id as entry_id,
  p.payment_date as entry_date,
  'collection'::text as entry_type,
  p.invoice_id as reference,
  p.customer_id as party_id,
  p.method as method,
  p.amount as amount,
  'in'::text as direction,
  p.note as note
from payments p
union all
select
  e.id as entry_id,
  e.expense_date as entry_date,
  'expense'::text as entry_type,
  e.category as reference,
  null::text as party_id,
  'outflow'::text as method,
  e.amount as amount,
  'out'::text as direction,
  e.note as note
from expenses e
union all
select
  oi.id as entry_id,
  oi.income_date as entry_date,
  'other_income'::text as entry_type,
  oi.type as reference,
  null::text as party_id,
  'inflow'::text as method,
  oi.amount as amount,
  'in'::text as direction,
  oi.note as note
from other_income oi;
