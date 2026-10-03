-- ============================================================
-- PRIMAL · CENTRO DE MANDO FINANCIERO — schema (Supabase / Postgres)
-- Correr UNA vez: Supabase -> SQL Editor -> New query -> pegar todo -> Run
-- 2 tablas:
--   pg_movimientos : cada ingreso / gasto / transferencia (personal y negocio)
--   pg_state       : estado de la app por clave (config, cuentas, clientes, recurrentes)
-- RLS abierto para anon (herramienta personal sin login, link privado) + Realtime.
-- ============================================================
create extension if not exists pgcrypto;

create table if not exists pg_movimientos (
  id uuid primary key default gen_random_uuid(),
  fecha date not null,
  ambito text not null default 'personal',     -- 'personal' | 'negocio'
  tipo text not null default 'gasto',          -- 'ingreso' | 'gasto' | 'transfer'
  monto numeric not null default 0,            -- siempre positivo; el signo lo da `tipo`
  moneda text not null default 'USD',
  cuenta text default '',                      -- nombre de la cuenta (origen si es transfer)
  cuenta_destino text default '',              -- solo transfer
  categoria text default '',
  concepto text default '',
  cliente text default '',                     -- nombre del cliente (ingresos de negocio)
  notas text default '',
  demo boolean default false,                  -- datos de ejemplo (se borran desde Config)
  created_at timestamptz default now()
);
create index if not exists pg_mov_fecha_idx on pg_movimientos (fecha);
create index if not exists pg_mov_ambito_idx on pg_movimientos (ambito);

create table if not exists pg_state (
  key text primary key,                        -- 'config' | 'cuentas' | 'clientes' | 'recurrentes'
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);

-- pg_state también guarda la clave 'cobros' (cash collected por cliente).
-- ---------- RLS ----------
do $$
declare t text;
begin
  foreach t in array array['pg_movimientos','pg_state'] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "anon full" on %I', t);
    execute format('create policy "anon full" on %I for all to anon using (true) with check (true)', t);
    execute format('drop policy if exists "auth full" on %I', t);
    execute format('create policy "auth full" on %I for all to authenticated using (true) with check (true)', t);
  end loop;
end $$;

-- ---------- REALTIME ----------
do $$
begin
  begin alter publication supabase_realtime add table pg_movimientos; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table pg_state;       exception when duplicate_object then null; end;
end $$;
