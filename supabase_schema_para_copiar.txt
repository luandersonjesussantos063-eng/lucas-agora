-- HISTORICO DO MVP: NAO REEXECUTAR EM PRODUCAO. Consulte README.md e migracoes atuais.
-- =========================================================
-- LUCAS AGORA - BANCO SUPABASE (MVP)
-- Execute TODO este arquivo no SQL Editor do Supabase.
-- =========================================================

create extension if not exists pgcrypto;

-- 1) PERFIS
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role text not null default 'client' check (role in ('client','business')),
  phone text,
  neighborhood text,
  created_at timestamptz not null default now()
);

-- 2) EMPRESAS
create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references auth.users(id) on delete cascade,
  name text not null,
  category text not null default 'Outros',
  phone text,
  neighborhood text,
  description text,
  is_available boolean not null default true,
  plan text not null default 'free' check (plan in ('free','pro','premium')),
  rating numeric(2,1) not null default 5.0 check (rating >= 0 and rating <= 5),
  created_at timestamptz not null default now()
);

-- 3) PEDIDOS
create table if not exists public.requests (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references auth.users(id) on delete cascade,
  category text not null,
  description text not null,
  urgency text not null default 'Agora',
  neighborhood text not null,
  status text not null default 'open' check (status in ('open','chosen','completed','cancelled')),
  chosen_offer_id uuid,
  created_at timestamptz not null default now()
);

-- 4) PROPOSTAS DAS EMPRESAS
create table if not exists public.offers (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  price numeric(10,2) not null check (price >= 0),
  eta_minutes integer check (eta_minutes is null or eta_minutes >= 0),
  message text not null default '',
  status text not null default 'pending' check (status in ('pending','accepted','rejected')),
  created_at timestamptz not null default now(),
  unique(request_id,business_id)
);

-- FK de proposta escolhida (criada depois para evitar dependência circular)
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'requests_chosen_offer_fk'
  ) then
    alter table public.requests
      add constraint requests_chosen_offer_fk
      foreign key (chosen_offer_id) references public.offers(id) on delete set null;
  end if;
end $$;

-- Índices
create index if not exists idx_requests_status_created on public.requests(status, created_at desc);
create index if not exists idx_requests_client on public.requests(client_id);
create index if not exists idx_offers_request on public.offers(request_id);
create index if not exists idx_business_owner on public.businesses(owner_id);

-- =========================================================
-- CRIA PERFIL AUTOMATICAMENTE APÓS CADASTRO
-- role/full_name vêm de user_metadata enviado pelo site.
-- =========================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles(id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name',''),
    case
      when new.raw_user_meta_data ->> 'role' = 'business' then 'business'
      else 'client'
    end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- =========================================================
-- RLS
-- =========================================================
alter table public.profiles enable row level security;
alter table public.businesses enable row level security;
alter table public.requests enable row level security;
alter table public.offers enable row level security;

-- Profiles: autenticados podem enxergar dados públicos básicos.
drop policy if exists "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_authenticated"
on public.profiles for select
to authenticated
using (true);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- Empresas: leitura pública para autenticados.
drop policy if exists "businesses_select_authenticated" on public.businesses;
create policy "businesses_select_authenticated"
on public.businesses for select
to authenticated
using (true);

drop policy if exists "businesses_insert_own" on public.businesses;
create policy "businesses_insert_own"
on public.businesses for insert
to authenticated
with check (
  auth.uid() = owner_id
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'business'
  )
);

drop policy if exists "businesses_update_own" on public.businesses;
create policy "businesses_update_own"
on public.businesses for update
to authenticated
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

-- Pedidos: usuários autenticados podem ver pedidos abertos;
-- o cliente também vê os próprios pedidos mesmo após fechar.
drop policy if exists "requests_select_authenticated" on public.requests;
create policy "requests_select_authenticated"
on public.requests for select
to authenticated
using (status = 'open' or client_id = auth.uid());

drop policy if exists "requests_insert_client" on public.requests;
create policy "requests_insert_client"
on public.requests for insert
to authenticated
with check (
  auth.uid() = client_id
  and exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'client'
  )
);

drop policy if exists "requests_update_own" on public.requests;
create policy "requests_update_own"
on public.requests for update
to authenticated
using (auth.uid() = client_id)
with check (auth.uid() = client_id);

drop policy if exists "requests_delete_own" on public.requests;
create policy "requests_delete_own"
on public.requests for delete
to authenticated
using (auth.uid() = client_id);

-- Propostas: empresa vê as próprias;
-- cliente vê propostas feitas aos próprios pedidos.
drop policy if exists "offers_select_participants" on public.offers;
create policy "offers_select_participants"
on public.offers for select
to authenticated
using (
  exists (
    select 1 from public.businesses b
    where b.id = business_id and b.owner_id = auth.uid()
  )
  or exists (
    select 1 from public.requests r
    where r.id = request_id and r.client_id = auth.uid()
  )
);

drop policy if exists "offers_insert_business" on public.offers;
create policy "offers_insert_business"
on public.offers for insert
to authenticated
with check (
  exists (
    select 1 from public.businesses b
    where b.id = business_id
      and b.owner_id = auth.uid()
      and b.is_available = true
  )
  and exists (
    select 1 from public.requests r
    where r.id = request_id and r.status = 'open'
  )
);

drop policy if exists "offers_update_own_business" on public.offers;
create policy "offers_update_own_business"
on public.offers for update
to authenticated
using (
  exists (
    select 1 from public.businesses b
    where b.id = business_id and b.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.businesses b
    where b.id = business_id and b.owner_id = auth.uid()
  )
);

-- Função segura para aceitar proposta.
create or replace function public.accept_offer(p_request_id uuid, p_offer_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_client uuid;
begin
  select client_id into v_client
  from public.requests
  where id = p_request_id;

  if v_client is null or v_client <> auth.uid() then
    raise exception 'Not allowed';
  end if;

  if not exists (
    select 1 from public.offers
    where id = p_offer_id and request_id = p_request_id
  ) then
    raise exception 'Offer does not belong to request';
  end if;

  update public.requests
  set status='chosen', chosen_offer_id=p_offer_id
  where id=p_request_id;

  update public.offers
  set status=case when id=p_offer_id then 'accepted' else 'rejected' end
  where request_id=p_request_id;
end;
$$;

revoke all on function public.accept_offer(uuid,uuid) from public;
grant execute on function public.accept_offer(uuid,uuid) to authenticated;

-- Privilégios Data API (RLS continua sendo aplicado)
grant usage on schema public to anon, authenticated;
grant select on public.profiles, public.businesses, public.requests, public.offers to authenticated;
grant insert, update, delete on public.profiles, public.businesses, public.requests, public.offers to authenticated;

-- Realtime
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname='supabase_realtime' and schemaname='public' and tablename='requests'
  ) then
    alter publication supabase_realtime add table public.requests;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname='supabase_realtime' and schemaname='public' and tablename='offers'
  ) then
    alter publication supabase_realtime add table public.offers;
  end if;
end $$;
