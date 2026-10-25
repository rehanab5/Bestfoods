-- Best Foods schema (replaces the Base44 entities).
-- Auth: every app install signs in anonymously, so orders are owned by auth.uid().
-- Admins sign in with email/password and have profiles.role = 'admin'.

create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'user' check (role in ('admin', 'user')),
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null,
  area text,
  phone text,
  lat double precision,
  lng double precision,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_en text,
  description text,
  description_en text,
  price numeric(8, 2) not null check (price >= 0),
  category text check (category in
    ('kebab', 'durum', 'lahmacun', 'pedrata', 'plato', 'boliviana', 'pollo', 'raciones')),
  image text,
  is_deal boolean not null default false,
  badge text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  description text not null,
  author text not null,
  rating integer not null check (rating between 1 and 5),
  location_name text,
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  order_number text not null unique,
  items jsonb not null default '[]'::jsonb,
  subtotal numeric(8, 2) not null,
  delivery_fee numeric(8, 2) not null default 0,
  total numeric(8, 2) not null,
  order_type text not null default 'delivery' check (order_type in ('delivery', 'pickup')),
  location_name text,
  customer_name text,
  customer_phone text,
  customer_email text,
  address text,
  notes text,
  payment_method text not null check (payment_method in ('card', 'cash')),
  payment_status text not null default 'pending'
    check (payment_status in ('pending', 'paid', 'unpaid', 'failed')),
  stripe_payment_intent_id text unique,
  status text not null default 'received'
    check (status in ('received', 'preparing', 'ready', 'delivered', 'cancelled')),
  notified_statuses text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index orders_user_idx on public.orders (user_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.locations enable row level security;
alter table public.menu_items enable row level security;
alter table public.reviews enable row level security;
alter table public.orders enable row level security;

create policy "profiles: read own" on public.profiles
  for select using (id = auth.uid() or public.is_admin());

create policy "locations: public read" on public.locations for select using (true);
create policy "locations: admin write" on public.locations
  for all using (public.is_admin()) with check (public.is_admin());

create policy "menu_items: public read" on public.menu_items for select using (true);
create policy "menu_items: admin write" on public.menu_items
  for all using (public.is_admin()) with check (public.is_admin());

create policy "reviews: read approved" on public.reviews
  for select using (approved or public.is_admin());
create policy "reviews: anyone can submit unapproved" on public.reviews
  for insert with check (approved = false or public.is_admin());
create policy "reviews: admin update" on public.reviews
  for update using (public.is_admin()) with check (public.is_admin());
create policy "reviews: admin delete" on public.reviews
  for delete using (public.is_admin());

-- Orders are created only by the create-order edge function (service role),
-- which recomputes prices server-side. Clients can only read their own orders.
create policy "orders: read own or admin" on public.orders
  for select using (user_id = auth.uid() or public.is_admin());
create policy "orders: admin update" on public.orders
  for update using (public.is_admin()) with check (public.is_admin());
