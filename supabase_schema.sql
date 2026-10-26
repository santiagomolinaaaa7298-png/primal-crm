-- ============================================================
-- PRIMAL · CENTRO DE MANDO FINANCIERO — schema (Supabase / Postgres)
-- Correr UNA vez: Supabase -> SQL Editor -> New query -> pegar todo -> Run
-- 2 tablas:
--   pg_movimientos : cada ingreso / gasto / transferencia (personal y negocio)
--   pg_state       : estado de la app por clave (config, cuentas, clientes, recurrentes, proyectos, tareas)
-- + avisos al celular: función primal_avisos() que corre todos los días con pg_cron y manda a ntfy.
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

-- pg_state también guarda las claves 'cobros' (cash collected por cliente), 'proyectos' y 'tareas' (vista Tareas)
-- y 'avisos_log' (último envío de avisos).
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

-- ============================================================
-- AVISOS AL CELULAR (vista Tareas → ntfy)
-- Dos veces al día, al canal de ntfy de config.ntfy, un mensaje por grupo (mismo armado que avisosHoy() en tareas.js):
--   7:00 Costa Rica (13:00 UTC): vencidas, las que vencen hoy y las que vencen en 7, 3 y 1 días (config.avisosDias).
--   19:00 Costa Rica (01:00 UTC): solo lo que sigue abierto y vence hoy o ya venció.
-- ============================================================
create extension if not exists pg_net;
create extension if not exists pg_cron;

create or replace function primal_dia(d date) returns text language sql immutable as $$
  select (array['dom','lun','mar','mié','jue','vie','sáb'])[extract(dow from d)::int+1] || ' ' || extract(day from d)::int || ' ' ||
         (array['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'])[extract(month from d)::int]
$$;

-- Arma los avisos de un día sin mandar nada (sirve para probar: select * from primal_avisos_armar(...)).
create or replace function primal_avisos_armar(cfg jsonb, proys jsonb, tars jsonb, hoy date)
returns table(orden int, title text, message text, priority int, tags jsonb) language sql stable as $$
  with dias as (
    select coalesce(array_agg(x::int), array[7,3,1]) d from jsonb_array_elements_text(coalesce(cfg->'avisosDias','[7,3,1]'::jsonb)) x where x::int > 0
  ), p as (
    select x->>'id' id, coalesce(nullif(x->>'cliente',''), x->>'nombre') cli, nullif(x->>'evento','')::date ev, coalesce((x->>'archivado')::boolean,false) arch
    from jsonb_array_elements(coalesce(proys,'[]'::jsonb)) x
  ), t as (
    select x->>'titulo' tit, x->>'resp' resp, coalesce(x->>'prio','P2') prio, p.cli,
           case when nullif(x->>'off','') is not null and p.ev is not null then p.ev + (x->>'off')::int else nullif(x->>'fecha','')::date end vence
    from jsonb_array_elements(coalesce(tars,'[]'::jsonb)) x left join p on p.id = x->>'proyecto'
    where coalesce(x->>'estado','') <> 'hecho' and not coalesce(p.arch,false)
  ), g as (
    select case when vence < hoy then -1 else vence - hoy end k, count(*)::int c, bool_or(prio='P0') p0,
           array_agg('• '||tit||' ('||coalesce(cli,'')||case when resp is not null and resp<>'Santi' and resp<>coalesce(cli,'') then ' · '||resp else '' end||')' order by prio, vence, tit) l
    from t, dias where vence is not null and (vence <= hoy or (vence - hoy) = any(dias.d))
    group by 1
  )
  select k,
    case when k=-1 then 'Santi, vas tarde en '||c||case when c=1 then ' tarea' else ' tareas' end
         when k=0 then 'Hoy vence: '||c when k=1 then 'Mañana vence: '||c else 'Faltan '||k||' días: '||c end,
    array_to_string(l[1:6], E'\n') || case when c>6 then E'\n…y '||(c-6)||' más' else '' end || E'\n\n' ||
    case when k=-1 then 'Si no se recuperan hoy, se corre todo lo que viene detrás.' when k=0 then 'Hoy es el día. Sin excusas.'
         when k=1 then 'Si mañana no está, te sacas full atrás.' else 'Para el '||primal_dia(hoy+k)||'. Si no arrancas ya, llegas tarde.' end,
    case when k=-1 then case when p0 then 5 else 4 end when k<=1 then 4 else 3 end,
    jsonb_build_array(case when k=-1 then 'rotating_light' when k=0 then 'red_circle' when k=1 then 'orange_circle' when k<=3 then 'yellow_circle' else 'hourglass' end)
  from g order by k;
$$;

-- Manda los avisos de hoy ('manana' = todo, 'noche' = solo hoy y vencidas). Devuelve cuántos mandó.
create or replace function primal_avisos(modo text default 'manana') returns int language plpgsql security definer as $$
declare
  cfg jsonb := coalesce((select data from pg_state where key='config'), '{}'::jsonb);
  topic text := nullif(cfg->>'ntfy','');
  url text := nullif(regexp_replace(coalesce(cfg->>'appUrl',''), '#.*$', ''), '');
  hoy date := (now() at time zone 'America/Costa_Rica')::date;
  a record; n int := 0;
begin
  if topic is null then return 0; end if;
  for a in select * from primal_avisos_armar(cfg, (select data from pg_state where key='proyectos'), (select data from pg_state where key='tareas'), hoy) loop
    continue when modo = 'noche' and a.orden > 0;
    perform net.http_post(url := 'https://ntfy.sh',
      body := jsonb_strip_nulls(jsonb_build_object('topic',topic,'title',case when modo='noche' then 'Sigue abierto · '||a.title else a.title end,'message',a.message,'priority',a.priority,'tags',a.tags,'click',case when url is not null then url||'#tareas' end)),
      headers := '{"Content-Type":"application/json"}'::jsonb);
    n := n + 1;
  end loop;
  insert into pg_state(key, data, updated_at) values ('avisos_log', jsonb_build_object('fecha', hoy, 'modo', modo, 'enviados', n), now())
    on conflict (key) do update set data = excluded.data, updated_at = now();
  return n;
end $$;
revoke execute on function primal_avisos(text) from public, anon, authenticated;

-- 13:00 UTC = 7:00 Costa Rica / 8:00 Colombia · 01:00 UTC = 19:00 Costa Rica / 20:00 Colombia.
do $$ begin
  if exists (select 1 from cron.job where jobname = 'primal-avisos') then perform cron.unschedule('primal-avisos'); end if;
  if exists (select 1 from cron.job where jobname = 'primal-avisos-noche') then perform cron.unschedule('primal-avisos-noche'); end if;
  perform cron.schedule('primal-avisos', '0 13 * * *', $c$select primal_avisos('manana')$c$);
  perform cron.schedule('primal-avisos-noche', '0 1 * * *', $c$select primal_avisos('noche')$c$);
end $$;
-- Probar a mano:  select primal_avisos();   Ver lo que mandaría sin mandar:
-- select * from primal_avisos_armar((select data from pg_state where key='config'), (select data from pg_state where key='proyectos'), (select data from pg_state where key='tareas'), current_date);
