/* ============================================================
   PRIMAL · CENTRO DE MANDO FINANCIERO
   Finanzas personales + del negocio. Un solo lugar, dos ámbitos.
   HTML estático + Supabase (opcional) + Vercel. Sin build.
   ============================================================ */

/* <<< PERSONALIZAR ACÁ ------------------------------------------------ */
const BRAND = {
  marca: "PRIMAL",            // wordmark de la barra (cambiá acá cuando tengas el nombre definitivo)
  sub:   "Centro de mando",
  objetivoPersonal: 3000,     // USD/mes que querés ganar vos (editable en Config)
  objetivoNegocio: 10000      // USD/mes del negocio (editable en Config)
};
const SUPABASE_URL = "";      // ← URL del proyecto Supabase (vacío = modo local en este navegador)
const SUPABASE_ANON_KEY = ""; // ← anon / publishable key (NUNCA la service_role)
/* ------------------------------------------------------------------ >>> */

const sb = (SUPABASE_URL && window.supabase) ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
const STORE_KEY = "primal_crm_v1";
const TZ = "America/Costa_Rica";

/* ============================================================
   ESTADO
   ============================================================ */
let MOVS = [];                 // [{id,fecha,ambito,tipo,monto,moneda,cuenta,cuenta_destino,categoria,concepto,cliente,notas,demo}]
let STATE = defaultState();    // {config,cuentas,clientes,recurrentes}
let SCOPE = "todo";            // todo | personal | negocio
let MONTH = ymOf(todayStr());  // "YYYY-MM"
let VIEW = "mando";
let MOV_FILTERS = { tipo:"", categoria:"", cuenta:"", q:"", vista:"feed", rango:"mes" };

const FIJAS = ["Vivienda","Suscripciones","Servicios","Herramientas","Equipo","Salarios","Seguro","Deuda"];
const AHORRO = ["Ahorro","Inversión"];

function defaultState(){
  return {
    config: {
      marca: BRAND.marca, sub: BRAND.sub,
      objetivoPersonal: BRAND.objetivoPersonal, objetivoNegocio: BRAND.objetivoNegocio,
      moneda: "USD", tcCRC: 510,
      categorias: {
        ingreso: ["Ventas","Comisión","Salario","Reembolso","Otro ingreso"],
        gasto: ["Vivienda","Comida","Transporte","Suscripciones","Herramientas","Equipo","Ads","Salarios","Servicios","Salud","Viajes","Ropa","Ocio","Educación","Impuestos","Seguro","Deuda","Ahorro","Inversión","Otro gasto"]
      }
    },
    cuentas: [],      // [{id,nombre,tipo,moneda,inicial,ambito,demo}]
    clientes: [],     // [{id,nombre,servicio,total,estado,cuenta,notas,cuotas:[{id,label,monto,fecha,pagada}],demo}]
    recurrentes: []   // [{id,nombre,monto,dia,cuenta,ambito,categoria,activo,demo}]
  };
}

/* ============================================================
   UTILIDADES
   ============================================================ */
const $ = (s, el=document) => el.querySelector(s);
const $$ = (s, el=document) => Array.from(el.querySelectorAll(s));
function esc(s){ return String(s==null?"":s).replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
function uid(){ return crypto.randomUUID ? crypto.randomUUID() : "id-"+Date.now()+"-"+Math.floor(Math.random()*1e6); }
function todayStr(){
  const p = new Intl.DateTimeFormat("en-CA",{timeZone:TZ,year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date());
  const g = t=>p.find(x=>x.type===t).value; return `${g("year")}-${g("month")}-${g("day")}`;
}
function ymOf(d){ return (d||"").slice(0,7); }
function addMonths(ym, n){ const [y,m]=ym.split("-").map(Number); const d=new Date(y, m-1+n, 1); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; }
function daysInMonth(ym){ const [y,m]=ym.split("-").map(Number); return new Date(y,m,0).getDate(); }
const MESES = ["ENE","FEB","MAR","ABR","MAY","JUN","JUL","AGO","SEP","OCT","NOV","DIC"];
const MESES_L = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
function monthLabel(ym, long){ const [y,m]=ym.split("-").map(Number); return long ? `${MESES_L[m-1]} ${y}` : `${MESES[m-1]} ${y}`; }
function monthShort(ym){ const [y,m]=ym.split("-").map(Number); return MESES[m-1] + (m===1 ? " "+String(y).slice(2) : ""); }
function dayLabel(d){
  const t = todayStr(); if(d===t) return "Hoy";
  const [y,m,dd]=d.split("-").map(Number); const dt=new Date(y,m-1,dd);
  const yest = new Date(); yest.setDate(yest.getDate()-1);
  const DIAS=["dom","lun","mar","mié","jue","vie","sáb"];
  return `${DIAS[dt.getDay()]} ${dd} ${MESES[m-1].toLowerCase()}`;
}
function fmt(n, opts={}){
  n = Number(n)||0; const abs=Math.abs(n);
  const dec = (opts.dec!=null) ? opts.dec : (abs>=1000 ? 0 : (Number.isInteger(abs)?0:2));
  const s = abs.toLocaleString("en-US",{minimumFractionDigits:dec, maximumFractionDigits:dec});
  const sign = n<0 ? "−" : (opts.plus && n>0 ? "+" : "");
  return `${sign}$${s}`;
}
function fmtK(n){ const a=Math.abs(n); if(a>=1e6) return (n/1e6).toFixed(1).replace(/\.0$/,"")+"M"; if(a>=1000) return (n/1000).toFixed(a>=10000?0:1).replace(/\.0$/,"")+"K"; return String(Math.round(n)); }
function toUSD(m){ const v=Number(m.monto)||0; if((m.moneda||"USD")==="CRC") return v/(Number(STATE.config.tcCRC)||510); return v; }
function amb(a){ return a==="negocio" ? "n" : "p"; }
function ambLabel(a){ return a==="negocio" ? "Negocio" : "Personal"; }
function inScope(m){ return SCOPE==="todo" || m.ambito===SCOPE; }
function isFija(cat){ return FIJAS.includes(cat); }
function isAhorro(cat){ return AHORRO.includes(cat); }
function cuentasScope(){ return STATE.cuentas.filter(c => SCOPE==="todo" || c.ambito==="ambas" || c.ambito===SCOPE); }
function toast(msg){ const t=$("#toast"); t.textContent=msg; t.classList.add("show"); clearTimeout(toast._t); toast._t=setTimeout(()=>t.classList.remove("show"),2600); }

/* ============================================================
   PERSISTENCIA — local (localStorage) o nube (Supabase)
   ============================================================ */
function saveLocal(){ if(sb) return; try{ localStorage.setItem(STORE_KEY, JSON.stringify({movs:MOVS, state:STATE})); }catch(e){} }
function loadLocal(){
  try{ const raw=localStorage.getItem(STORE_KEY); if(!raw) return; const d=JSON.parse(raw);
    MOVS = d.movs||[]; STATE = Object.assign(defaultState(), d.state||{});
    STATE.config = Object.assign(defaultState().config, STATE.config||{});
  }catch(e){}
}
async function loadCloud(){
  const [mv, st] = await Promise.all([ sb.from("pg_movimientos").select("*").order("fecha",{ascending:false}), sb.from("pg_state").select("*") ]);
  if(mv.error||st.error){ console.error(mv.error||st.error); toast("⚠ Error conectando a Supabase — revisá keys y schema"); setDb(false); return; }
  MOVS = mv.data||[];
  const base = defaultState();
  (st.data||[]).forEach(r=>{ if(r.key==="config") base.config=Object.assign(base.config, r.data||{}); else if(base[r.key]!==undefined) base[r.key]=r.data||[]; });
  STATE = base; setDb(true);
}
function subscribeCloud(){
  sb.channel("primal-crm")
    .on("postgres_changes",{event:"*",schema:"public",table:"pg_movimientos"}, async()=>{ await loadCloud(); render(); })
    .on("postgres_changes",{event:"*",schema:"public",table:"pg_state"}, async()=>{ await loadCloud(); render(); })
    .subscribe();
}
async function saveState(key){
  if(sb){ const {error}=await sb.from("pg_state").upsert({key, data:STATE[key], updated_at:new Date().toISOString()}); if(error){console.error(error);toast("⚠ No se pudo guardar en la nube");} }
  else saveLocal();
}
async function addMov(m){
  m = Object.assign({id:uid(), fecha:todayStr(), ambito:"personal", tipo:"gasto", monto:0, moneda:STATE.config.moneda||"USD", cuenta:"", cuenta_destino:"", categoria:"", concepto:"", cliente:"", notas:"", demo:false, created_at:new Date().toISOString()}, m);
  MOVS.unshift(m);
  if(sb){ const {error}=await sb.from("pg_movimientos").insert(m); if(error){console.error(error);toast("⚠ No se pudo guardar en la nube");} } else saveLocal();
  return m;
}
async function updMov(id, patch){
  const m=MOVS.find(x=>x.id===id); if(!m) return; Object.assign(m, patch);
  if(sb){ const {error}=await sb.from("pg_movimientos").update(patch).eq("id",id); if(error){console.error(error);toast("⚠ No se pudo actualizar");} } else saveLocal();
}
async function delMov(id){
  MOVS = MOVS.filter(x=>x.id!==id);
  if(sb){ await sb.from("pg_movimientos").delete().eq("id",id); } else saveLocal();
}
function setDb(on){
  const d=$("#db-dot"), t=$("#db-txt");
  if(!sb){ d.className="dot local"; t.textContent="Local · este navegador"; return; }
  d.className = on ? "dot on" : "dot"; t.textContent = on ? "Nube · Supabase" : "Nube · error";
}

/* ============================================================
   CÁLCULOS
   ============================================================ */
function movsMes(ym, scope=SCOPE){ return MOVS.filter(m => ymOf(m.fecha)===ym && (scope==="todo"||m.ambito===scope)); }
function totales(ym, scope=SCOPE){
  const t={ingreso:0,gasto:0,fijos:0,variables:0,ahorro:0,neto:0,n:0};
  movsMes(ym,scope).forEach(m=>{
    const v=toUSD(m); if(m.tipo==="ingreso"){t.ingreso+=v;t.n++;}
    else if(m.tipo==="gasto"){ t.gasto+=v; t.n++; if(isAhorro(m.categoria)) t.ahorro+=v; else if(isFija(m.categoria)) t.fijos+=v; else t.variables+=v; }
  });
  t.neto=t.ingreso-t.gasto; return t;
}
function saldoCuenta(c){
  let s=Number(c.inicial)||0;
  MOVS.forEach(m=>{
    const v=toUSD(m);
    if(m.tipo==="ingreso" && m.cuenta===c.nombre) s+=v;
    else if(m.tipo==="gasto" && m.cuenta===c.nombre) s-=v;
    else if(m.tipo==="transfer"){ if(m.cuenta===c.nombre) s-=v; if(m.cuenta_destino===c.nombre) s+=v; }
  });
  return s;
}
function cashScope(){ return cuentasScope().reduce((a,c)=>a+saldoCuenta(c),0); }
function burnPromedio(){ // promedio de gastos de los últimos 3 meses cerrados (o los que haya)
  let sum=0, n=0; for(let i=1;i<=3;i++){ const t=totales(addMonths(MONTH,-i)); if(t.gasto>0){sum+=t.gasto;n++;} }
  if(!n){ const t=totales(MONTH); return t.gasto; } return sum/n;
}
function clienteCobrado(cl){ return MOVS.filter(m=>m.tipo==="ingreso" && m.cliente===cl.nombre).reduce((a,m)=>a+toUSD(m),0); }
function cuotasPendientes(){
  const out=[]; STATE.clientes.forEach(cl=>(cl.cuotas||[]).forEach(q=>{ if(!q.pagada) out.push({cl,q}); }));
  return out.sort((a,b)=>(a.q.fecha||"9999").localeCompare(b.q.fecha||"9999"));
}
function recurrenteRegistrado(r, ym=MONTH){ return MOVS.some(m=>m.tipo==="gasto" && m.ambito===r.ambito && ymOf(m.fecha)===ym && (m.concepto||"").toLowerCase()===(r.nombre||"").toLowerCase()); }
function categoriasTop(ym){
  const map={}; movsMes(ym).forEach(m=>{ if(m.tipo!=="gasto") return; const k=m.categoria||"Sin categoría"; map[k]=(map[k]||0)+toUSD(m); });
  return Object.entries(map).sort((a,b)=>b[1]-a[1]);
}

/* ============================================================
   RENDER — raíz
   ============================================================ */
function render(){
  $("#brand-name").textContent = STATE.config.marca||"PRIMAL";
  $("#brand-sub").textContent = STATE.config.sub||"Centro de mando";
  document.title = (STATE.config.marca||"PRIMAL")+" · Centro de mando";
  $("#m-lbl").textContent = monthLabel(MONTH);
  $$("#scope-seg button").forEach(b=>b.classList.toggle("active", b.dataset.scope===SCOPE));
  $$("#views button").forEach(b=>b.classList.toggle("active", b.dataset.view===VIEW));
  $$(".view").forEach(v=>v.classList.toggle("hidden", v.id!=="view-"+VIEW));
  $("#n-movs").textContent = movsMes(MONTH).length || "";
  $("#n-cobros").textContent = cuotasPendientes().filter(x=>x.q.fecha && x.q.fecha<=todayStr()).length || "";
  $("#capture").classList.toggle("hidden", VIEW==="config");
  ({mando:renderMando, movs:renderMovs, clientes:renderClientes, recurrentes:renderRecurrentes, config:renderConfig})[VIEW]();
}

/* ============================================================
   VISTA · MANDO
   ============================================================ */
function renderMando(){
  const el=$("#view-mando"); const t=totales(MONTH); const prev=totales(addMonths(MONTH,-1));
  const cash=cashScope(); const burn=burnPromedio(); const runway = burn>0 ? cash/burn : null;
  const objetivo = SCOPE==="personal" ? Number(STATE.config.objetivoPersonal)||0 : SCOPE==="negocio" ? Number(STATE.config.objetivoNegocio)||0 : (Number(STATE.config.objetivoPersonal)||0)+(Number(STATE.config.objetivoNegocio)||0);
  const pct = objetivo>0 ? Math.min(100, t.ingreso/objetivo*100) : 0;
  const deltaIng = prev.ingreso>0 ? ((t.ingreso-prev.ingreso)/prev.ingreso*100) : null;
  const hasData = MOVS.length>0 || STATE.cuentas.length>0;
  const scopeTxt = SCOPE==="todo" ? "personal + negocio" : SCOPE;

  el.innerHTML = `
  <section class="hero">
    <div class="hero-num">
      <div class="eyebrow">Cash disponible · ${esc(scopeTxt)}</div>
      <div class="big ${cash<0?'bad':''}">${fmt(cash)}</div>
      <div class="delta">${runway==null ? "sin gastos registrados todavía" : runway>=24 ? "runway <b class='ok'>+24 meses</b>" : `runway <b class="${runway<2?'bad':runway<4?'warn':'ok'}">${runway.toFixed(1)} meses</b> al ritmo actual`}</div>
      <div class="subkpis">
        <div class="subkpi"><div class="l">Ingresos · ${monthLabel(MONTH).split(" ")[0]}</div><div class="v">${fmt(t.ingreso)}</div><div class="s">${deltaIng==null?"sin mes anterior":`<span class="${deltaIng>=0?'ok':'bad'}">${deltaIng>=0?'▲':'▼'} ${Math.abs(deltaIng).toFixed(0)}%</span> vs mes anterior`}</div></div>
        <div class="subkpi"><div class="l">Gastos · ${monthLabel(MONTH).split(" ")[0]}</div><div class="v" style="color:var(--red-2)">${fmt(t.gasto)}</div><div class="s">${t.ingreso>0?`${(t.gasto/t.ingreso*100).toFixed(0)}% de lo que entró`:"—"}</div></div>
      </div>
      <div class="meta">
        <div class="row"><span>Objetivo del mes</span><b>${fmt(t.ingreso)} / ${fmt(objetivo)}</b></div>
        <div class="bar"><i class="${pct>=100?'done':''}" style="width:${pct}%"></i></div>
        <div class="row" style="margin-top:7px"><span>${pct>=100?"objetivo cumplido":"faltan "+fmt(Math.max(0,objetivo-t.ingreso))}</span><span>${pct.toFixed(0)}%</span></div>
      </div>
    </div>
    <div class="skyline">
      <div class="head">
        <h2>Skyline <i>doce meses</i></h2>
        <div class="legend">
          <span><i style="background:var(--s-ingreso)"></i>Ingresos</span>
          <span><i class="hatch"></i>Gastos</span>
          <span><i class="line" style="background:var(--s-neto)"></i>Neto</span>
        </div>
      </div>
      <div class="chart-wrap" id="skyline-wrap"></div>
    </div>
  </section>
  <div class="horizon"></div>
  ${!hasData ? `<div class="empty"><div class="g">BASE VACÍA</div>Cargá tu primer movimiento arriba, creá tus cuentas en Config, o mirá cómo se ve con datos de ejemplo.<br><button class="btn" onclick="loadDemo()">Ver con datos de ejemplo</button></div>` : ""}
  <section class="grid g-32">
    <div class="panel">
      <h3>Cascada del mes <span class="sub">de dónde entró y a dónde se fue</span></h3>
      ${renderCascade(t)}
    </div>
    <div class="panel">
      <h3>Cuentas <span class="act"><button class="btn xs ghost" onclick="openTransfer()">Transferir</button><button class="btn xs ghost" onclick="openCuenta()">+ Cuenta</button></span></h3>
      ${renderWallets()}
    </div>
  </section>
  <section class="grid g-3">
    <div class="panel">
      <h3>Por cobrar <span class="sub">cuotas de clientes</span></h3>
      ${renderPendientesCobro()}
    </div>
    <div class="panel">
      <h3>Próximos cargos <span class="sub">recurrentes · 14 días</span></h3>
      ${renderProximosCargos()}
    </div>
    <div class="panel">
      <h3>Dónde se fue <span class="sub">top categorías</span></h3>
      ${renderTopCats()}
    </div>
  </section>`;
  drawSkyline();
}

function renderCascade(t){
  const max=Math.max(t.ingreso, t.fijos+t.variables+t.ahorro, 1);
  const w=v=>Math.max(0, v/max*100);
  // cascada real: cada bloque de gasto arranca donde terminó el anterior, bajando desde ingresos
  let cursor=t.ingreso;
  const seg=(v)=>{ const left=Math.max(0,cursor-v); const html=`<i class="out" style="left:${w(left)}%;width:${w(v)}%"></i>`; cursor=left; return html; };
  const step=(n,html,v,cls="")=>`<div class="step ${cls}"><div class="n">${n}</div><div class="track">${html}</div><div class="v">${v}</div></div>`;
  return `<div class="cascade">
    ${step("Ingresos", `<i class="in" style="left:0;width:${w(t.ingreso)}%"></i>`, fmt(t.ingreso))}
    ${step("Fijos", seg(t.fijos), "−"+fmt(t.fijos).slice(0))}
    ${step("Variables", seg(t.variables), "−"+fmt(t.variables))}
    ${step("Ahorro / inv.", seg(t.ahorro), "−"+fmt(t.ahorro))}
    ${step("Neto", `<i class="net" style="left:0;width:${w(Math.max(0,t.neto))}%"></i>`, `<span class="${t.neto<0?'bad':'ember'}">${fmt(t.neto)}</span>`, "total")}
  </div>
  <div class="mini" style="margin-top:10px">Fijos = ${FIJAS.join(", ").toLowerCase()}. Ahorro e inversión cuentan como salida de caja, no como gasto.</div>`;
}
function renderWallets(){
  const cs=cuentasScope();
  if(!cs.length) return `<div class="empty" style="padding:18px">Sin cuentas en este ámbito.<br><span class="dim">Banco, efectivo, Wise, USDT… cada una con su saldo inicial.</span></div>`;
  return `<div class="wallets">${cs.map(c=>{ const s=saldoCuenta(c); return `<div class="wallet" onclick="openCuenta('${c.id}')">
    <div class="n"><span>${esc(c.nombre)}</span><em>${esc(amb(c.ambito==="ambas"?"":c.ambito)==="n"?"N":c.ambito==="ambas"?"P+N":"P")}</em></div>
    <div class="v ${s<0?'neg':''}">${fmt(s)}</div>
    <div class="t">${esc(c.tipo||"")}${c.moneda&&c.moneda!=="USD"?" · "+esc(c.moneda):""}</div></div>`; }).join("")}</div>`;
}
function renderPendientesCobro(){
  const p=cuotasPendientes().filter(x=>SCOPE!=="personal").slice(0,6);
  if(SCOPE==="personal") return `<div class="empty" style="padding:18px">Los cobros viven en el ámbito negocio.</div>`;
  if(!p.length) return `<div class="empty" style="padding:18px">Nada pendiente de cobro.<br><span class="dim">Cargá clientes con su plan de cuotas.</span></div>`;
  const hoy=todayStr();
  return `<div class="list">${p.map(({cl,q})=>`<div class="row click" onclick="cobrarCuota('${cl.id}','${q.id}')">
    <div class="a"><b>${esc(cl.nombre)} · ${esc(q.label||"cuota")}</b><small>${q.fecha ? (q.fecha<hoy?`<span class="bad">vencida ${esc(q.fecha)}</span>`:`vence ${esc(q.fecha)}`) : "sin fecha"}</small></div>
    <div class="b">${fmt(q.monto)}<small>cobrar →</small></div></div>`).join("")}</div>`;
}
function renderProximosCargos(){
  const hoy=todayStr(); const lim=new Date(); lim.setDate(lim.getDate()+14);
  const rs=STATE.recurrentes.filter(r=>r.activo!==false && (SCOPE==="todo"||r.ambito===SCOPE));
  if(!rs.length) return `<div class="empty" style="padding:18px">Sin recurrentes.<br><span class="dim">Suscripciones, alquiler, herramientas…</span></div>`;
  const items=rs.map(r=>{
    const dia=Math.min(Number(r.dia)||1, daysInMonth(MONTH));
    let f=`${MONTH}-${String(dia).padStart(2,"0")}`; let ym=MONTH;
    if(f<hoy && ymOf(hoy)===MONTH){ ym=addMonths(MONTH,1); f=`${ym}-${String(Math.min(dia,daysInMonth(ym))).padStart(2,"0")}`; }
    return {r,f,ym,reg:recurrenteRegistrado(r,ym)};
  }).sort((a,b)=>a.f.localeCompare(b.f)).slice(0,6);
  return `<div class="list">${items.map(({r,f,reg,ym})=>`<div class="row click" onclick="registrarRecurrente('${r.id}','${ym}')">
    <div class="a"><b>${esc(r.nombre)}</b><small>${esc(f)} · ${esc(r.cuenta||"sin cuenta")}</small></div>
    <div class="b" style="color:var(--red-2)">−${fmt(r.monto).slice(0)}<small>${reg?'<span class="ok">registrado</span>':'registrar →'}</small></div></div>`).join("")}</div>`;
}
function renderTopCats(){
  const cats=categoriasTop(MONTH).slice(0,6); if(!cats.length) return `<div class="empty" style="padding:18px">Sin gastos este mes.</div>`;
  const max=cats[0][1];
  return `<div class="cascade">${cats.map(([k,v])=>`<div class="step" style="grid-template-columns:110px 1fr 80px"><div class="n" title="${esc(k)}">${esc(k)}</div><div class="track"><i class="out" style="left:0;width:${v/max*100}%"></i></div><div class="v">${fmt(v)}</div></div>`).join("")}</div>`;
}

/* ---------- SKYLINE (SVG a mano) ---------- */
function drawSkyline(){
  const wrap=$("#skyline-wrap"); if(!wrap) return;
  const W=Math.max(320, wrap.clientWidth-4), H=Math.max(230, wrap.clientHeight-8);
  const months=[]; for(let i=11;i>=0;i--){ const ym=addMonths(MONTH,-i); const t=totales(ym); months.push({ym,...t}); }
  const maxV=Math.max(1, ...months.map(m=>Math.max(m.ingreso,m.gasto)));
  const nice=niceMax(maxV);
  const padL=46, padR=14, padT=18, padB=46, refl=16;
  const plotH=H-padT-padB-refl, plotW=W-padL-padR;
  const slot=plotW/12, gap=2, barW=Math.max(4,(slot-10)/2-gap/2);
  const y=v=>padT+plotH-(v/nice)*plotH;
  const base=padT+plotH;
  let g="";
  // grid (3 líneas, sólidas, tenues)
  const hasData=maxV>1;
  for(let i=1;i<=3;i++){ const v=nice*i/3, yy=y(v); g+=`<line x1="${padL}" x2="${W-padR}" y1="${yy}" y2="${yy}" stroke="rgba(255,228,180,.07)"/>${hasData?`<text x="${padL-8}" y="${yy+3.5}" text-anchor="end" font-size="9.5" fill="#625B4F" font-family="IBM Plex Mono,monospace">${fmtK(v)}</text>`:""}`; }
  g+=`<line x1="${padL}" x2="${W-padR}" y1="${base}" y2="${base}" stroke="rgba(212,175,90,.35)"/>`;
  // barras
  const bar=(x,v,fill,extra="")=>{ if(v<=0) return ""; const top=y(v), h=base-top; const r=Math.min(4,h/2); return `<path d="M${x} ${base} V${top+r} a${r} ${r} 0 0 1 ${r} -${r} h${barW-2*r} a${r} ${r} 0 0 1 ${r} ${r} V${base} Z" fill="${fill}" ${extra}/>`; };
  let bars="", reflect="", hits="", line="", dots="", xl="";
  months.forEach((m,i)=>{
    const x0=padL+i*slot+5, xi=x0, xg=x0+barW+gap;
    const cur=m.ym===MONTH;
    bars+=bar(xi,m.ingreso,"#D4AF5A",cur?"":'opacity=".8"');
    bars+=bar(xg,m.gasto,"url(#hatch)",cur?"":'opacity=".85"');
    reflect+=bar(xi,m.ingreso,"#D4AF5A")+bar(xg,m.gasto,"#D9263F");
    if(cur) bars+=`<rect x="${x0-5}" y="${padT-6}" width="${slot}" height="${plotH+6}" fill="rgba(212,175,90,.05)" rx="6"/>`;
    const cx=x0+barW+gap/2;
    line+=(i?"L":"M")+cx+" "+y(Math.max(0,m.neto)+0);
    if(cur && (m.ingreso||m.gasto)) dots+=`<circle cx="${cx}" cy="${y(Math.max(0,m.neto))}" r="4" fill="#F3EEE4" stroke="#050505" stroke-width="2"/>`;
    if(slot>=44 || cur || i%2===(11%2)) xl+=`<text x="${cx}" y="${base+16}" text-anchor="middle" font-size="9.5" fill="${cur?'#F3EEE4':'#625B4F'}" font-family="IBM Plex Mono,monospace" letter-spacing=".08em">${slot>=44?monthShort(m.ym):monthShort(m.ym).split(" ")[0]}</text>`;
    if(cur && m.ingreso>0) xl+=`<text x="${xi+barW/2}" y="${y(m.ingreso)-6}" text-anchor="middle" font-size="10" fill="#F0D28A" font-family="IBM Plex Mono,monospace">${fmtK(m.ingreso)}</text>`;
    if(cur && m.gasto>0) xl+=`<text x="${xg+barW/2}" y="${y(m.gasto)-6}" text-anchor="middle" font-size="10" fill="#E8334B" font-family="IBM Plex Mono,monospace">${fmtK(m.gasto)}</text>`;
    hits+=`<rect class="hit" data-i="${i}" x="${x0-5}" y="${padT-6}" width="${slot}" height="${plotH+6+padB}" fill="transparent" style="cursor:crosshair"/>`;
  });
  wrap.innerHTML=`<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Ingresos, gastos y neto de los últimos 12 meses">
    <defs>
      <pattern id="hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(135)"><rect width="5" height="5" fill="#D9263F"/><rect width="2" height="5" fill="rgba(0,0,0,.34)"/></pattern>
      <linearGradient id="reflmask" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <mask id="rm"><rect x="0" y="${base}" width="${W}" height="${refl+padB}" fill="url(#reflmask)"/></mask>
    </defs>
    ${g}
    <g mask="url(#rm)" transform="translate(0,${base*2}) scale(1,-1)">${reflect}</g>
    ${bars}
    <path d="${line}" fill="none" stroke="#F3EEE4" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round" opacity=".85"/>
    ${dots}${xl}${hits}
  </svg>`;
  const tip=$("#tip");
  $$(".hit",wrap).forEach(r=>{
    r.addEventListener("mousemove",e=>{ const m=months[+r.dataset.i]; tip.innerHTML=`<div class="t">${monthLabel(m.ym)}</div><div class="r"><span><i style="background:#D4AF5A"></i>Ingresos</span><b>${fmt(m.ingreso)}</b></div><div class="r"><span><i style="background:#D9263F"></i>Gastos</span><b>${fmt(m.gasto)}</b></div><div class="r"><span><i style="background:#F3EEE4"></i>Neto</span><b class="${m.neto<0?'bad':''}">${fmt(m.neto)}</b></div>`; tip.style.left=e.pageX+"px"; tip.style.top=(e.pageY-12)+"px"; tip.classList.add("show"); });
    r.addEventListener("mouseleave",()=>tip.classList.remove("show"));
    r.addEventListener("click",()=>{ MONTH=months[+r.dataset.i].ym; render(); });
  });
}
function niceMax(v){ const p=Math.pow(10,Math.floor(Math.log10(v))); const n=v/p; const m=n<=1?1:n<=1.5?1.5:n<=2?2:n<=3?3:n<=5?5:n<=7.5?7.5:10; return m*p; }

/* ============================================================
   VISTA · MOVIMIENTOS
   ============================================================ */
function renderMovs(){
  const el=$("#view-movs"); const f=MOV_FILTERS;
  let list = (f.rango==="todo" ? MOVS.filter(inScope) : movsMes(MONTH)).slice();
  if(f.tipo) list=list.filter(m=>m.tipo===f.tipo);
  if(f.categoria) list=list.filter(m=>m.categoria===f.categoria);
  if(f.cuenta) list=list.filter(m=>m.cuenta===f.cuenta||m.cuenta_destino===f.cuenta);
  if(f.q){ const q=f.q.toLowerCase(); list=list.filter(m=>[m.concepto,m.cliente,m.notas,m.categoria].join(" ").toLowerCase().includes(q)); }
  list.sort((a,b)=>b.fecha.localeCompare(a.fecha)||(b.created_at||"").localeCompare(a.created_at||""));
  const cats=[...new Set([...STATE.config.categorias.ingreso,...STATE.config.categorias.gasto,...MOVS.map(m=>m.categoria)].filter(Boolean))];
  const ctas=[...new Set([...STATE.cuentas.map(c=>c.nombre),...MOVS.map(m=>m.cuenta)].filter(Boolean))];
  const sumI=list.filter(m=>m.tipo==="ingreso").reduce((a,m)=>a+toUSD(m),0), sumG=list.filter(m=>m.tipo==="gasto").reduce((a,m)=>a+toUSD(m),0);
  el.innerHTML=`
  <div class="filters">
    <select id="f-rango"><option value="mes" ${f.rango==="mes"?"selected":""}>${monthLabel(MONTH)}</option><option value="todo" ${f.rango==="todo"?"selected":""}>Todo el historial</option></select>
    <select id="f-tipo"><option value="">Tipo: todos</option>${["ingreso","gasto","transfer"].map(t=>`<option value="${t}" ${f.tipo===t?"selected":""}>${t}</option>`).join("")}</select>
    <select id="f-cat"><option value="">Categoría: todas</option>${cats.map(c=>`<option ${f.categoria===c?"selected":""}>${esc(c)}</option>`).join("")}</select>
    <select id="f-cta"><option value="">Cuenta: todas</option>${ctas.map(c=>`<option ${f.cuenta===c?"selected":""}>${esc(c)}</option>`).join("")}</select>
    <input id="f-q" type="search" placeholder="buscar…" value="${esc(f.q)}" />
    <span class="spacer"></span>
    <div class="seg"><button data-vista="feed" class="${f.vista==="feed"?"active":""}">Feed</button><button data-vista="tabla" class="${f.vista==="tabla"?"active":""}">Tabla</button></div>
    <button class="btn sm" onclick="exportCSV()">CSV</button>
  </div>
  <div class="mini" style="display:flex;gap:18px;flex-wrap:wrap"><span>${list.length} movimientos</span><span>entró <b class="ember">${fmt(sumI)}</b></span><span>salió <b class="bad">${fmt(sumG)}</b></span><span>neto <b>${fmt(sumI-sumG)}</b></span></div>
  ${!list.length ? `<div class="empty"><div class="g">NADA POR ACÁ</div>Escribí arriba algo como <span class="mono">-12 café #comida @efectivo p</span> y Enter.</div>` : f.vista==="tabla" ? renderTabla(list) : renderFeed(list)}`;
  $("#f-rango").onchange=e=>{f.rango=e.target.value;render();};
  $("#f-tipo").onchange=e=>{f.tipo=e.target.value;render();};
  $("#f-cat").onchange=e=>{f.categoria=e.target.value;render();};
  $("#f-cta").onchange=e=>{f.cuenta=e.target.value;render();};
  $("#f-q").oninput=e=>{f.q=e.target.value;render(); const i=$("#f-q"); i.focus(); i.setSelectionRange(i.value.length,i.value.length);};
  $$("[data-vista]",el).forEach(b=>b.onclick=()=>{f.vista=b.dataset.vista;render();});
}
function movTags(m){
  const t=[`<span class="tag ${amb(m.ambito)}">${ambLabel(m.ambito)}</span>`];
  if(m.categoria) t.push(`<span class="tag">${esc(m.categoria)}</span>`);
  if(m.cuenta) t.push(`<span class="tag">@${esc(m.cuenta)}${m.tipo==="transfer"&&m.cuenta_destino?" → @"+esc(m.cuenta_destino):""}</span>`);
  if(m.cliente) t.push(`<span class="tag ember">${esc(m.cliente)}</span>`);
  if(m.moneda&&m.moneda!=="USD") t.push(`<span class="tag">${esc(m.moneda)} ${Number(m.monto).toLocaleString("en-US")}</span>`);
  if(m.demo) t.push(`<span class="tag warn">demo</span>`);
  return t.join("");
}
function renderFeed(list){
  const days={}; list.forEach(m=>{ (days[m.fecha]=days[m.fecha]||[]).push(m); });
  return `<div class="ledger">${Object.keys(days).sort((a,b)=>b.localeCompare(a)).map(d=>{
    const ms=days[d]; const net=ms.reduce((a,m)=>a+(m.tipo==="ingreso"?toUSD(m):m.tipo==="gasto"?-toUSD(m):0),0);
    return `<div class="day"><div class="dh"><b>${dayLabel(d)}</b><span>${d} · neto <span class="${net<0?'bad':'ember'}">${fmt(net,{plus:true})}</span></span></div>
    ${ms.map(m=>`<div class="mov ${m.tipo}" onclick="openMov('${m.id}')"><div class="bar"></div><div class="c"><b>${esc(m.concepto||m.categoria||(m.tipo==="transfer"?"Transferencia":"Sin concepto"))}</b><div class="tags">${movTags(m)}</div></div><div class="amt">${m.tipo==="gasto"?"−":m.tipo==="ingreso"?"+":"⇄"}${fmt(toUSD(m))}<small>${m.tipo}</small></div></div>`).join("")}</div>`;
  }).join("")}</div>`;
}
function renderTabla(list){
  return `<table class="tbl"><thead><tr><th>Fecha</th><th>Tipo</th><th>Concepto</th><th>Categoría</th><th>Cuenta</th><th>Ámbito</th><th>Cliente</th><th class="num">USD</th></tr></thead><tbody>
  ${list.map(m=>`<tr onclick="openMov('${m.id}')"><td class="mono">${esc(m.fecha)}</td><td>${esc(m.tipo)}</td><td>${esc(m.concepto)}</td><td>${esc(m.categoria)}</td><td>${esc(m.cuenta)}${m.cuenta_destino?" → "+esc(m.cuenta_destino):""}</td><td>${ambLabel(m.ambito)}</td><td>${esc(m.cliente)}</td><td class="num ${m.tipo==="gasto"?"bad":""}">${m.tipo==="gasto"?"−":""}${fmt(toUSD(m))}</td></tr>`).join("")}
  </tbody></table>`;
}
function exportCSV(){
  const rows=[["fecha","ambito","tipo","monto","moneda","usd","cuenta","cuenta_destino","categoria","concepto","cliente","notas"]];
  MOVS.slice().sort((a,b)=>a.fecha.localeCompare(b.fecha)).forEach(m=>rows.push([m.fecha,m.ambito,m.tipo,m.monto,m.moneda,toUSD(m).toFixed(2),m.cuenta,m.cuenta_destino,m.categoria,m.concepto,m.cliente,m.notas]));
  const csv=rows.map(r=>r.map(v=>`"${String(v==null?"":v).replace(/"/g,'""')}"`).join(",")).join("\n");
  download("primal-movimientos.csv", csv, "text/csv");
}
function download(name, content, type){ const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([content],{type})); a.download=name; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),2000); }

/* ============================================================
   VISTA · CLIENTES & COBROS
   ============================================================ */
function renderClientes(){
  const el=$("#view-clientes"); const cls=STATE.clientes.slice().sort((a,b)=>(a.estado==="cerrado")-(b.estado==="cerrado"));
  const totC=cls.reduce((a,c)=>a+(Number(c.total)||0),0), cob=cls.reduce((a,c)=>a+clienteCobrado(c),0);
  const pend=cuotasPendientes(); const hoy=todayStr();
  el.innerHTML=`
  <div class="burn" style="margin-top:18px">
    <div class="subkpi"><div class="l">Contratado</div><div class="v">${fmt(totC)}</div><div class="s">${cls.length} clientes</div></div>
    <div class="subkpi"><div class="l">Cobrado</div><div class="v ember">${fmt(cob)}</div><div class="s">${totC?((cob/totC)*100).toFixed(0):0}% del contratado</div></div>
    <div class="subkpi"><div class="l">Por cobrar</div><div class="v">${fmt(pend.reduce((a,x)=>a+(Number(x.q.monto)||0),0))}</div><div class="s">${pend.filter(x=>x.q.fecha&&x.q.fecha<hoy).length} vencidas</div></div>
    <div class="subkpi" style="display:flex;align-items:center;justify-content:center"><button class="btn gold" onclick="openCliente()">+ Cliente</button></div>
  </div>
  ${!cls.length?`<div class="empty"><div class="g">SIN CLIENTES</div>Cada cliente lleva su contrato, plan de cuotas y lo cobrado. Los cobros se registran como ingresos del negocio con un clic.</div>`:""}
  <div class="clients">${cls.map(c=>{ const cob=clienteCobrado(c); const tot=Number(c.total)||0; const pct=tot?Math.min(100,cob/tot*100):0; const next=(c.cuotas||[]).filter(q=>!q.pagada).sort((a,b)=>(a.fecha||"9999").localeCompare(b.fecha||"9999"))[0];
    return `<div class="client" onclick="openCliente('${c.id}')">
      <div class="top"><div><div class="nm">${esc(c.nombre)}</div><div class="sv">${esc(c.servicio||"")}</div></div><span class="tag ${c.estado==="activo"?"ok":c.estado==="cerrado"?"":"warn"}">${esc(c.estado||"activo")}</span></div>
      <div class="nums"><div><div class="l">Contrato</div><div class="v">${fmt(tot)}</div></div><div><div class="l">Cobrado</div><div class="v ember">${fmt(cob)}</div></div><div><div class="l">Pendiente</div><div class="v ${tot-cob>0?"":"dim"}">${fmt(Math.max(0,tot-cob))}</div></div></div>
      <div class="prog"><i class="${pct>=100?"full":""}" style="width:${pct}%"></i></div>
      <div class="next"><span>${next?`próx. ${esc(next.label||"cuota")}`:"sin cuotas pendientes"}</span><b>${next?`${fmt(next.monto)} · ${esc(next.fecha||"s/f")}`:"✓"}</b></div>
    </div>`; }).join("")}</div>
  <section class="panel" style="margin-top:18px"><h3>Plan de cobros <span class="sub">todas las cuotas pendientes, por fecha</span></h3>
    ${!pend.length?`<div class="empty" style="padding:14px">Nada pendiente.</div>`:`<div class="list">${pend.map(({cl,q})=>`<div class="row click" onclick="cobrarCuota('${cl.id}','${q.id}')"><div class="a"><b>${esc(cl.nombre)} · ${esc(q.label||"cuota")}</b><small>${q.fecha?(q.fecha<hoy?`<span class="bad">vencida · ${esc(q.fecha)}</span>`:esc(q.fecha)):"sin fecha"}</small></div><div class="b">${fmt(q.monto)}<small>cobrar →</small></div></div>`).join("")}</div>`}
  </section>`;
}
function openCliente(id){
  const c = id ? STATE.clientes.find(x=>x.id===id) : {id:uid(), nombre:"", servicio:"", total:0, estado:"activo", cuenta:"", notas:"", cuotas:[]};
  const cuotas = JSON.parse(JSON.stringify(c.cuotas||[]));
  const body=()=>`
    <div class="f2"><div class="f"><label>Cliente</label><input id="c-nombre" value="${esc(c.nombre)}" placeholder="Nombre" /></div><div class="f"><label>Servicio</label><input id="c-serv" value="${esc(c.servicio)}" placeholder="Ej: Growth partner 3 meses" /></div></div>
    <div class="f3"><div class="f"><label>Contrato total (USD)</label><input id="c-total" class="mono" type="number" step="0.01" value="${c.total||""}" /></div>
      <div class="f"><label>Estado</label><select id="c-estado">${["activo","pausa","cerrado"].map(s=>`<option ${c.estado===s?"selected":""}>${s}</option>`).join("")}</select></div>
      <div class="f"><label>Cobra en</label><select id="c-cuenta"><option value="">— cuenta —</option>${STATE.cuentas.map(k=>`<option ${c.cuenta===k.nombre?"selected":""}>${esc(k.nombre)}</option>`).join("")}</select></div></div>
    <div class="f"><label>Plan de cuotas <button class="btn xs ghost" type="button" id="c-add" style="margin-left:8px">+ cuota</button> <button class="btn xs ghost" type="button" id="c-split" style="margin-left:4px">dividir total en N</button></label>
      <div class="cuota-list" id="c-cuotas"></div></div>
    <div class="f"><label>Notas</label><textarea id="c-notas">${esc(c.notas)}</textarea></div>`;
  openModal({ title: id ? `<i>›</i> ${esc(c.nombre)}` : "Nuevo <i>cliente</i>", body: body(), del: !!id,
    onOpen(){
      const list=$("#c-cuotas");
      const draw=()=>{ list.innerHTML = cuotas.length ? cuotas.map((q,i)=>`<div class="cuota"><input data-i="${i}" data-k="label" value="${esc(q.label)}" placeholder="Cuota ${i+1}" /><input data-i="${i}" data-k="monto" type="number" step="0.01" value="${q.monto||""}" placeholder="USD" /><input data-i="${i}" data-k="fecha" type="date" value="${esc(q.fecha||"")}" /><button type="button" class="chk ${q.pagada?"on":""}" data-i="${i}" title="pagada">✓</button><button type="button" class="del" data-i="${i}">×</button></div>`).join("") : `<div class="mini">Sin cuotas. Agregá una o dividí el total.</div>`;
        $$("input",list).forEach(inp=>inp.oninput=e=>{ cuotas[+inp.dataset.i][inp.dataset.k]= inp.dataset.k==="monto"?Number(inp.value):inp.value; });
        $$(".chk",list).forEach(b=>b.onclick=()=>{ cuotas[+b.dataset.i].pagada=!cuotas[+b.dataset.i].pagada; draw(); });
        $$(".del",list).forEach(b=>b.onclick=()=>{ cuotas.splice(+b.dataset.i,1); draw(); });
      };
      draw();
      $("#c-add").onclick=()=>{ cuotas.push({id:uid(),label:`Cuota ${cuotas.length+1}`,monto:0,fecha:"",pagada:false}); draw(); };
      $("#c-split").onclick=()=>{ const n=parseInt(prompt("¿En cuántas cuotas?","3")||"0"); const tot=Number($("#c-total").value)||0; if(!n||!tot) return; cuotas.length=0; const base=Math.floor(tot/n*100)/100; let f=todayStr(); for(let i=0;i<n;i++){ cuotas.push({id:uid(),label:`Cuota ${i+1}/${n}`,monto:i===n-1?Math.round((tot-base*(n-1))*100)/100:base,fecha:f,pagada:false}); const [y,m,d]=f.split("-").map(Number); const nd=new Date(y,m,Math.min(d,28)); f=`${nd.getFullYear()}-${String(nd.getMonth()+1).padStart(2,"0")}-${String(nd.getDate()).padStart(2,"0")}`; } draw(); };
    },
    async onSave(){
      c.nombre=$("#c-nombre").value.trim(); if(!c.nombre){toast("Falta el nombre");return false;}
      c.servicio=$("#c-serv").value.trim(); c.total=Number($("#c-total").value)||0; c.estado=$("#c-estado").value; c.cuenta=$("#c-cuenta").value; c.notas=$("#c-notas").value; c.cuotas=cuotas;
      if(!id) STATE.clientes.push(c); await saveState("clientes"); toast("Cliente guardado"); render();
    },
    async onDelete(){ if(!confirm(`¿Borrar a ${c.nombre}? Los ingresos ya registrados quedan.`)) return false; STATE.clientes=STATE.clientes.filter(x=>x.id!==id); await saveState("clientes"); render(); }
  });
}
async function cobrarCuota(cid, qid){
  const c=STATE.clientes.find(x=>x.id===cid); if(!c) return; const q=(c.cuotas||[]).find(x=>x.id===qid); if(!q) return;
  openMov(null, {tipo:"ingreso", ambito:"negocio", monto:q.monto, cliente:c.nombre, categoria:"Ventas", cuenta:c.cuenta||"", concepto:`${c.nombre} · ${q.label||"cuota"}`, _cuota:{cid,qid}});
}

/* ============================================================
   VISTA · RECURRENTES
   ============================================================ */
function renderRecurrentes(){
  const el=$("#view-recurrentes"); const rs=STATE.recurrentes.filter(r=>SCOPE==="todo"||r.ambito===SCOPE).sort((a,b)=>(Number(a.dia)||0)-(Number(b.dia)||0));
  const act=rs.filter(r=>r.activo!==false); const fp=act.filter(r=>r.ambito==="personal").reduce((a,r)=>a+Number(r.monto||0),0), fn=act.filter(r=>r.ambito==="negocio").reduce((a,r)=>a+Number(r.monto||0),0);
  const regs=act.filter(r=>recurrenteRegistrado(r)).length;
  el.innerHTML=`
  <div class="burn" style="margin-top:18px">
    <div class="subkpi"><div class="l">Fijos personal / mes</div><div class="v">${fmt(fp)}</div></div>
    <div class="subkpi"><div class="l">Fijos negocio / mes</div><div class="v">${fmt(fn)}</div></div>
    <div class="subkpi"><div class="l">Quema fija total</div><div class="v bad">${fmt(fp+fn)}</div><div class="s">${fmt((fp+fn)*12)} al año</div></div>
    <div class="subkpi"><div class="l">${monthLabel(MONTH)}</div><div class="v">${regs}/${act.length}</div><div class="s">registrados este mes</div></div>
    <div class="subkpi" style="display:flex;align-items:center;justify-content:center"><button class="btn gold" onclick="openRecurrente()">+ Recurrente</button></div>
  </div>
  <section class="panel"><h3>Cargos fijos <span class="sub">clic en "registrar" crea el gasto del mes · clic en el nombre edita</span></h3>
  ${!rs.length?`<div class="empty"><div class="g">SIN RECURRENTES</div>Alquiler, suscripciones, herramientas, salarios… lo que se cobra solo cada mes.</div>`:`<div class="list">${rs.map(r=>{ const reg=recurrenteRegistrado(r); return `<div class="row" style="grid-template-columns:1fr auto auto;gap:14px">
    <div class="a" style="cursor:pointer" onclick="openRecurrente('${r.id}')"><b>${esc(r.nombre)} ${r.activo===false?'<span class="tag">pausado</span>':""}</b><small>día ${esc(r.dia||"—")} · ${esc(r.categoria||"")} · @${esc(r.cuenta||"—")} · <span class="tag ${amb(r.ambito)}">${ambLabel(r.ambito)}</span></small></div>
    <div class="b" style="color:var(--red-2)">−${fmt(r.monto)}</div>
    <div>${reg?`<span class="tag ok">✓ registrado</span>`:`<button class="btn xs" onclick="registrarRecurrente('${r.id}')">registrar</button>`}</div></div>`; }).join("")}</div>`}
  </section>`;
}
function openRecurrente(id){
  const r = id ? STATE.recurrentes.find(x=>x.id===id) : {id:uid(), nombre:"", monto:0, dia:1, cuenta:"", ambito:SCOPE==="negocio"?"negocio":"personal", categoria:"Suscripciones", activo:true};
  openModal({ title: id?`<i>›</i> ${esc(r.nombre)}`:"Nuevo <i>recurrente</i>", del:!!id, body:`
    <div class="f2"><div class="f"><label>Nombre</label><input id="r-nombre" value="${esc(r.nombre)}" placeholder="Ej: Alquiler, ChatGPT, GHL" /></div><div class="f"><label>Monto (USD)</label><input id="r-monto" class="mono" type="number" step="0.01" value="${r.monto||""}" /></div></div>
    <div class="f3"><div class="f"><label>Día del mes</label><input id="r-dia" type="number" min="1" max="31" value="${r.dia||1}" /></div>
      <div class="f"><label>Cuenta</label><select id="r-cuenta"><option value="">—</option>${STATE.cuentas.map(k=>`<option ${r.cuenta===k.nombre?"selected":""}>${esc(k.nombre)}</option>`).join("")}</select></div>
      <div class="f"><label>Categoría</label><select id="r-cat">${STATE.config.categorias.gasto.map(c=>`<option ${r.categoria===c?"selected":""}>${esc(c)}</option>`).join("")}</select></div></div>
    <div class="f"><label>Ámbito</label><div class="pick" id="r-amb"><button type="button" data-v="personal" class="${r.ambito==="personal"?"on":""}">Personal</button><button type="button" data-v="negocio" class="${r.ambito==="negocio"?"on red":""}">Negocio</button></div></div>
    <div class="f"><label>Activo</label><div class="pick" id="r-act"><button type="button" data-v="1" class="${r.activo!==false?"on":""}">Sí</button><button type="button" data-v="0" class="${r.activo===false?"on":""}">Pausado</button></div></div>`,
    onOpen(){ pickInit("#r-amb"); pickInit("#r-act"); },
    async onSave(){ r.nombre=$("#r-nombre").value.trim(); if(!r.nombre){toast("Falta el nombre");return false;} r.monto=Number($("#r-monto").value)||0; r.dia=Number($("#r-dia").value)||1; r.cuenta=$("#r-cuenta").value; r.categoria=$("#r-cat").value; r.ambito=pickVal("#r-amb"); r.activo=pickVal("#r-act")==="1"; if(!id) STATE.recurrentes.push(r); await saveState("recurrentes"); toast("Guardado"); render(); },
    async onDelete(){ STATE.recurrentes=STATE.recurrentes.filter(x=>x.id!==id); await saveState("recurrentes"); render(); }
  });
}
async function registrarRecurrente(id, ym=MONTH){
  const r=STATE.recurrentes.find(x=>x.id===id); if(!r) return;
  if(recurrenteRegistrado(r,ym)){ toast("Ya está registrado este mes"); return; }
  const dia=Math.min(Number(r.dia)||1, daysInMonth(ym));
  await addMov({fecha:`${ym}-${String(dia).padStart(2,"0")}`, ambito:r.ambito, tipo:"gasto", monto:r.monto, cuenta:r.cuenta, categoria:r.categoria, concepto:r.nombre});
  toast(`−${fmt(r.monto)} ${r.nombre} registrado`); render();
}

/* ============================================================
   VISTA · CONFIG
   ============================================================ */
function renderConfig(){
  const el=$("#view-config"); const c=STATE.config;
  el.innerHTML=`
  <section class="grid g-2" style="margin-top:18px">
    <div class="panel"><h3>Marca y objetivos</h3>
      <div class="kv">
        <div class="f"><label>Wordmark</label><input id="cfg-marca" value="${esc(c.marca)}" /></div>
        <div class="f"><label>Subtítulo</label><input id="cfg-sub" value="${esc(c.sub)}" /></div>
        <div class="f"><label>Objetivo personal / mes (USD)</label><input id="cfg-op" class="mono" type="number" value="${c.objetivoPersonal||0}" /></div>
        <div class="f"><label>Objetivo negocio / mes (USD)</label><input id="cfg-on" class="mono" type="number" value="${c.objetivoNegocio||0}" /></div>
        <div class="f"><label>Tipo de cambio CRC → USD</label><input id="cfg-tc" class="mono" type="number" value="${c.tcCRC||510}" /></div>
      </div>
      <div style="margin-top:12px"><button class="btn gold" onclick="saveConfigForm()">Guardar</button></div>
    </div>
    <div class="panel"><h3>Cuentas <span class="act"><button class="btn xs ghost" onclick="openCuenta()">+ Cuenta</button></span></h3>
      ${!STATE.cuentas.length?`<div class="mini">Sin cuentas. Creá al menos una (ej: BAC, Wise, Efectivo, USDT).</div>`:`<div class="list">${STATE.cuentas.map(k=>`<div class="row click" onclick="openCuenta('${k.id}')"><div class="a"><b>${esc(k.nombre)}</b><small>${esc(k.tipo||"")} · ${esc(k.moneda||"USD")} · ${k.ambito==="ambas"?"personal + negocio":esc(k.ambito)}</small></div><div class="b">${fmt(saldoCuenta(k))}<small>inicial ${fmt(k.inicial)}</small></div></div>`).join("")}</div>`}
    </div>
  </section>
  <section class="grid g-2">
    <div class="panel"><h3>Categorías de ingreso</h3><div class="chips" id="cat-ing">${c.categorias.ingreso.map(x=>`<span class="tag" title="quitar" onclick="delCat('ingreso','${esc(x)}')">${esc(x)} ×</span>`).join("")}</div><div style="display:flex;gap:8px;margin-top:10px"><input id="new-ing" placeholder="nueva categoría" style="flex:1;background:rgba(0,0,0,.4);border:1px solid var(--line);border-radius:9px;padding:8px 10px;color:var(--text);outline:0" /><button class="btn sm" onclick="addCat('ingreso')">Agregar</button></div></div>
    <div class="panel"><h3>Categorías de gasto <span class="sub">fijas: ${FIJAS.join(", ").toLowerCase()}</span></h3><div class="chips" id="cat-gas">${c.categorias.gasto.map(x=>`<span class="tag ${isFija(x)?"n":isAhorro(x)?"ember":""}" title="quitar" onclick="delCat('gasto','${esc(x)}')">${esc(x)} ×</span>`).join("")}</div><div style="display:flex;gap:8px;margin-top:10px"><input id="new-gas" placeholder="nueva categoría" style="flex:1;background:rgba(0,0,0,.4);border:1px solid var(--line);border-radius:9px;padding:8px 10px;color:var(--text);outline:0" /><button class="btn sm" onclick="addCat('gasto')">Agregar</button></div></div>
  </section>
  <section class="grid g-2">
    <div class="panel"><h3>Nube</h3>
      <div class="code">${sb?`Conectado a ${esc(SUPABASE_URL)}`:"Modo local: los datos viven solo en este navegador. Para sincronizar entre dispositivos: creá un proyecto en Supabase, corré supabase_schema.sql y pegá URL + anon key en app.js (bloque PERSONALIZAR ACÁ)."}</div>
      <div class="mini" style="margin-top:8px">Hoy: ${todayStr()} (${TZ}) · ${MOVS.length} movimientos · ${STATE.clientes.length} clientes · ${STATE.recurrentes.length} recurrentes</div>
    </div>
    <div class="panel"><h3>Datos</h3>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn" onclick="exportJSON()">Exportar JSON</button>
        <button class="btn" onclick="$('#imp').click()">Importar JSON</button><input id="imp" type="file" accept="application/json" class="hidden" onchange="importJSON(this)" />
        <button class="btn" onclick="exportCSV()">Exportar CSV</button>
        ${MOVS.some(m=>m.demo)||STATE.cuentas.some(x=>x.demo)?`<button class="btn danger" onclick="clearDemo()">Borrar datos de ejemplo</button>`:`<button class="btn ghost" onclick="loadDemo()">Cargar datos de ejemplo</button>`}
        <button class="btn danger" onclick="resetAll()">Borrar todo</button>
      </div>
    </div>
  </section>`;
}
async function saveConfigForm(){ const c=STATE.config; c.marca=$("#cfg-marca").value.trim()||"PRIMAL"; c.sub=$("#cfg-sub").value.trim(); c.objetivoPersonal=Number($("#cfg-op").value)||0; c.objetivoNegocio=Number($("#cfg-on").value)||0; c.tcCRC=Number($("#cfg-tc").value)||510; await saveState("config"); toast("Config guardada"); render(); }
async function addCat(t){ const i=$(t==="ingreso"?"#new-ing":"#new-gas"); const v=i.value.trim(); if(!v) return; if(!STATE.config.categorias[t].includes(v)) STATE.config.categorias[t].push(v); await saveState("config"); render(); }
async function delCat(t,v){ STATE.config.categorias[t]=STATE.config.categorias[t].filter(x=>x!==v); await saveState("config"); render(); }
function openCuenta(id){
  const k = id ? STATE.cuentas.find(x=>x.id===id) : {id:uid(), nombre:"", tipo:"Banco", moneda:"USD", inicial:0, ambito:SCOPE==="negocio"?"negocio":SCOPE==="personal"?"personal":"ambas"};
  openModal({ title:id?`<i>›</i> ${esc(k.nombre)}`:"Nueva <i>cuenta</i>", del:!!id, body:`
    <div class="f2"><div class="f"><label>Nombre</label><input id="k-nombre" value="${esc(k.nombre)}" placeholder="Ej: BAC, Wise, Efectivo, USDT" /></div><div class="f"><label>Tipo</label><select id="k-tipo">${["Banco","Efectivo","Wise / Payoneer","Cripto","Tarjeta de crédito","Otro"].map(t=>`<option ${k.tipo===t?"selected":""}>${t}</option>`).join("")}</select></div></div>
    <div class="f2"><div class="f"><label>Saldo inicial (USD)</label><input id="k-ini" class="mono" type="number" step="0.01" value="${k.inicial||0}" /><div class="mini">el saldo actual = inicial + movimientos</div></div><div class="f"><label>Moneda</label><select id="k-mon">${["USD","CRC","EUR","USDT"].map(m=>`<option ${k.moneda===m?"selected":""}>${m}</option>`).join("")}</select></div></div>
    <div class="f"><label>Ámbito</label><div class="pick" id="k-amb"><button type="button" data-v="personal" class="${k.ambito==="personal"?"on":""}">Personal</button><button type="button" data-v="negocio" class="${k.ambito==="negocio"?"on red":""}">Negocio</button><button type="button" data-v="ambas" class="${k.ambito==="ambas"?"on ember":""}">Ambas</button></div></div>`,
    onOpen(){ pickInit("#k-amb"); },
    async onSave(){ const old=k.nombre; k.nombre=$("#k-nombre").value.trim(); if(!k.nombre){toast("Falta el nombre");return false;} k.tipo=$("#k-tipo").value; k.inicial=Number($("#k-ini").value)||0; k.moneda=$("#k-mon").value; k.ambito=pickVal("#k-amb");
      if(id && old && old!==k.nombre){ for(const m of MOVS){ const p={}; if(m.cuenta===old) p.cuenta=k.nombre; if(m.cuenta_destino===old) p.cuenta_destino=k.nombre; if(Object.keys(p).length) await updMov(m.id,p); } }
      if(!id) STATE.cuentas.push(k); await saveState("cuentas"); toast("Cuenta guardada"); render(); },
    async onDelete(){ if(!confirm(`¿Borrar la cuenta ${k.nombre}? Los movimientos quedan.`)) return false; STATE.cuentas=STATE.cuentas.filter(x=>x.id!==id); await saveState("cuentas"); render(); }
  });
}
function openTransfer(){ openMov(null,{tipo:"transfer"}); }
function exportJSON(){ download(`primal-backup-${todayStr()}.json`, JSON.stringify({movs:MOVS,state:STATE,exported:new Date().toISOString()},null,2), "application/json"); }
function importJSON(inp){ const f=inp.files[0]; if(!f) return; const r=new FileReader(); r.onload=async()=>{ try{ const d=JSON.parse(r.result); if(!confirm(`Importar ${(d.movs||[]).length} movimientos y reemplazar config/cuentas/clientes/recurrentes?`)) return;
  MOVS=d.movs||[]; STATE=Object.assign(defaultState(), d.state||{});
  if(sb){ await sb.from("pg_movimientos").delete().neq("id","00000000-0000-0000-0000-000000000000"); if(MOVS.length) await sb.from("pg_movimientos").insert(MOVS); for(const k of ["config","cuentas","clientes","recurrentes"]) await saveState(k); } else saveLocal();
  toast("Importado"); render(); }catch(e){ toast("JSON inválido"); } }; r.readAsText(f); }
async function resetAll(){ if(!confirm("¿Borrar TODO (movimientos, cuentas, clientes, recurrentes)? No se puede deshacer.")) return; if(!confirm("Última: ¿seguro?")) return;
  MOVS=[]; STATE=defaultState(); if(sb){ await sb.from("pg_movimientos").delete().neq("id","00000000-0000-0000-0000-000000000000"); for(const k of ["config","cuentas","clientes","recurrentes"]) await saveState(k); } else { localStorage.removeItem(STORE_KEY); } toast("Base en cero"); render(); }

/* ============================================================
   MOVIMIENTO · modal + captura rápida
   ============================================================ */
function openMov(id, preset={}){
  const m = id ? Object.assign({}, MOVS.find(x=>x.id===id)) : Object.assign({fecha:todayStr(), ambito:SCOPE==="negocio"?"negocio":"personal", tipo:"gasto", monto:"", moneda:STATE.config.moneda||"USD", cuenta:"", cuenta_destino:"", categoria:"", concepto:"", cliente:"", notas:""}, preset);
  const cats=()=> (m.tipo==="ingreso"?STATE.config.categorias.ingreso:STATE.config.categorias.gasto);
  const body=`
    <div class="f"><label>Tipo</label><div class="pick" id="m-tipo"><button type="button" data-v="gasto" class="${m.tipo==="gasto"?"on red":""}">− Gasto</button><button type="button" data-v="ingreso" class="${m.tipo==="ingreso"?"on":""}">+ Ingreso</button><button type="button" data-v="transfer" class="${m.tipo==="transfer"?"on ember":""}">⇄ Transferencia</button></div></div>
    <div class="f3"><div class="f"><label>Monto</label><input id="m-monto" class="mono" type="number" step="0.01" value="${m.monto}" autofocus /></div><div class="f"><label>Moneda</label><select id="m-mon">${["USD","CRC","EUR","USDT"].map(x=>`<option ${m.moneda===x?"selected":""}>${x}</option>`).join("")}</select></div><div class="f"><label>Fecha</label><input id="m-fecha" type="date" value="${esc(m.fecha)}" /></div></div>
    <div class="f"><label>Concepto</label><input id="m-conc" value="${esc(m.concepto)}" placeholder="¿Qué fue?" /></div>
    <div class="f2"><div class="f"><label>Ámbito</label><div class="pick" id="m-amb"><button type="button" data-v="personal" class="${m.ambito==="personal"?"on":""}">Personal</button><button type="button" data-v="negocio" class="${m.ambito==="negocio"?"on red":""}">Negocio</button></div></div>
      <div class="f" id="m-cat-wrap"><label>Categoría</label><select id="m-cat"><option value="">—</option>${cats().map(c=>`<option ${m.categoria===c?"selected":""}>${esc(c)}</option>`).join("")}</select></div></div>
    <div class="f2"><div class="f"><label id="m-cta-lbl">${m.tipo==="transfer"?"Desde":"Cuenta"}</label><select id="m-cta"><option value="">—</option>${STATE.cuentas.map(k=>`<option ${m.cuenta===k.nombre?"selected":""}>${esc(k.nombre)}</option>`).join("")}</select></div>
      <div class="f ${m.tipo==="transfer"?"":"hidden"}" id="m-dest-wrap"><label>Hacia</label><select id="m-dest"><option value="">—</option>${STATE.cuentas.map(k=>`<option ${m.cuenta_destino===k.nombre?"selected":""}>${esc(k.nombre)}</option>`).join("")}</select></div>
      <div class="f ${m.tipo==="ingreso"?"":"hidden"}" id="m-cli-wrap"><label>Cliente</label><input id="m-cli" list="cli-list" value="${esc(m.cliente)}" placeholder="opcional" /><datalist id="cli-list">${STATE.clientes.map(c=>`<option value="${esc(c.nombre)}">`).join("")}</datalist></div></div>
    <div class="f"><label>Notas</label><textarea id="m-notas" style="min-height:48px">${esc(m.notas)}</textarea></div>`;
  openModal({ title: id?"Editar <i>movimiento</i>":(m.tipo==="transfer"?"<i>⇄</i> Transferencia":"Nuevo <i>movimiento</i>"), body, del:!!id,
    onOpen(){
      pickInit("#m-amb");
      pickInit("#m-tipo", v=>{ m.tipo=v; $("#m-dest-wrap").classList.toggle("hidden", v!=="transfer"); $("#m-cli-wrap").classList.toggle("hidden", v!=="ingreso"); $("#m-cat-wrap").classList.toggle("hidden", v==="transfer"); $("#m-cta-lbl").textContent=v==="transfer"?"Desde":"Cuenta";
        $("#m-cat").innerHTML=`<option value="">—</option>`+cats().map(c=>`<option>${esc(c)}</option>`).join(""); });
      $("#m-cat-wrap").classList.toggle("hidden", m.tipo==="transfer");
      setTimeout(()=>$("#m-monto").focus(),50);
    },
    async onSave(){
      const monto=Number($("#m-monto").value); if(!(monto>0)){toast("Monto inválido");return false;}
      const patch={fecha:$("#m-fecha").value||todayStr(), tipo:pickVal("#m-tipo"), ambito:pickVal("#m-amb"), monto, moneda:$("#m-mon").value, concepto:$("#m-conc").value.trim(), categoria:pickVal("#m-tipo")==="transfer"?"":$("#m-cat").value, cuenta:$("#m-cta").value, cuenta_destino:pickVal("#m-tipo")==="transfer"?$("#m-dest").value:"", cliente:pickVal("#m-tipo")==="ingreso"?$("#m-cli").value.trim():"", notas:$("#m-notas").value};
      if(id) await updMov(id,patch); else await addMov(patch);
      if(preset._cuota){ const c=STATE.clientes.find(x=>x.id===preset._cuota.cid); const q=c&&(c.cuotas||[]).find(x=>x.id===preset._cuota.qid); if(q){ q.pagada=true; q.pagadaEl=patch.fecha; await saveState("clientes"); } }
      toast(id?"Actualizado":"Guardado"); render();
    },
    async onDelete(){ await delMov(id); toast("Borrado"); render(); }
  });
}

/* --- parser de captura rápida ---
   "-45 uber #transporte @bofa p"  ·  "+2500 NYLO cuota 1/3 #ventas @wise n"  ·  "12/10 -80 cena #ocio"  ·  "ayer +300 reembolso" */
function parseCapture(s){
  s=(s||"").trim(); if(!s) return null;
  const out={tipo:null, monto:null, categoria:"", cuenta:"", ambito:null, fecha:todayStr(), words:[]};
  const toks=s.split(/\s+/);
  toks.forEach((t0,idx)=>{
    const t=t0.trim(); const low=t.toLowerCase();
    if(out.monto==null && /^[+\-−]?\$?\d[\d,.]*(k)?$/i.test(t)){ let n=t.replace(/[$,]/g,""); const k=/k$/i.test(n); n=n.replace(/k$/i,""); const sign=n.startsWith("+")?"ingreso":(n.startsWith("-")||n.startsWith("−"))?"gasto":null; n=Number(n.replace(/^[+\-−]/,"")); if(k) n*=1000; if(!isNaN(n)){ out.monto=n; out.tipo=sign; return; } }
    if(t.startsWith("#")&&t.length>1){ out.categoria=t.slice(1); return; }
    if(t.startsWith("@")&&t.length>1){ out.cuenta=t.slice(1); return; }
    if(low==="p"||low==="personal"){ out.ambito="personal"; return; }
    if(low==="n"||low==="negocio"){ out.ambito="negocio"; return; }
    if(low==="hoy"){ return; }
    if(low==="ayer"){ const d=new Date(); d.setDate(d.getDate()-1); out.fecha=d.toISOString().slice(0,10); return; }
    const dm=idx===0 ? t.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/) : null; if(dm){ let y=dm[3]?Number(dm[3]):Number(todayStr().slice(0,4)); if(y<100) y+=2000; out.fecha=`${y}-${String(dm[2]).padStart(2,"0")}-${String(dm[1]).padStart(2,"0")}`; return; }
    out.words.push(t);
  });
  if(out.monto==null) return null;
  if(!out.tipo) out.tipo="gasto";
  if(!out.ambito) out.ambito = SCOPE==="negocio"?"negocio":"personal";
  // normalizar categoría y cuenta contra catálogos (case-insensitive, prefijo)
  const cats=out.tipo==="ingreso"?STATE.config.categorias.ingreso:STATE.config.categorias.gasto;
  if(out.categoria){ const c=cats.find(x=>x.toLowerCase()===out.categoria.toLowerCase())||cats.find(x=>x.toLowerCase().startsWith(out.categoria.toLowerCase())); out.categoria=c||out.categoria; }
  if(out.cuenta){ const k=STATE.cuentas.find(x=>x.nombre.toLowerCase()===out.cuenta.toLowerCase())||STATE.cuentas.find(x=>x.nombre.toLowerCase().startsWith(out.cuenta.toLowerCase())); out.cuenta=k?k.nombre:out.cuenta; }
  out.concepto=out.words.join(" ");
  // cliente: si el concepto empieza con el nombre de un cliente y es ingreso
  out.cliente=""; if(out.tipo==="ingreso"){ const cl=STATE.clientes.find(c=>out.concepto.toLowerCase().startsWith(c.nombre.toLowerCase())); if(cl){ out.cliente=cl.nombre; out.ambito="negocio"; if(!out.categoria) out.categoria="Ventas"; } }
  return out;
}
function capturePreview(){
  const p=parseCapture($("#cap").value); const el=$("#cap-preview");
  if(!p){ el.classList.add("hidden"); return; }
  el.classList.remove("hidden");
  el.innerHTML=`<span class="amt ${p.tipo==="gasto"?"bad":"ember"}">${p.tipo==="gasto"?"−":"+"}${fmt(p.monto)}</span><b>${esc(p.concepto||"(sin concepto)")}</b><span class="tag ${amb(p.ambito)}">${ambLabel(p.ambito)}</span>${p.categoria?`<span class="tag">#${esc(p.categoria)}</span>`:`<span class="tag warn">sin categoría</span>`}${p.cuenta?`<span class="tag">@${esc(p.cuenta)}</span>`:`<span class="tag warn">sin cuenta</span>`}${p.cliente?`<span class="tag ember">${esc(p.cliente)}</span>`:""}<span class="tag">${esc(p.fecha)}</span><kbd>Enter</kbd>`;
}
async function captureSubmit(){
  const p=parseCapture($("#cap").value); if(!p){ toast("Empezá con el monto: -45 uber #comida @bac"); return; }
  await addMov({fecha:p.fecha, ambito:p.ambito, tipo:p.tipo, monto:p.monto, categoria:p.categoria, cuenta:p.cuenta, concepto:p.concepto, cliente:p.cliente});
  $("#cap").value=""; capturePreview(); toast(`${p.tipo==="gasto"?"−":"+"}${fmt(p.monto)} · ${p.concepto||p.categoria||"guardado"}`); if(ymOf(p.fecha)!==MONTH) MONTH=ymOf(p.fecha); render();
}

/* ============================================================
   MODAL + helpers UI
   ============================================================ */
let MODAL={};
function openModal({title, body, onSave, onDelete, onOpen, del, saveLabel}){
  MODAL={onSave,onDelete}; $("#m-title").innerHTML=title; $("#m-body").innerHTML=body;
  $("#m-left").innerHTML = del ? `<button class="btn danger" id="m-del">Borrar</button>` : "";
  $("#m-right").innerHTML = `<button class="btn ghost" id="m-cancel">Cancelar</button> <button class="btn gold" id="m-save">${saveLabel||"Guardar"}</button>`;
  $("#modal-bg").classList.add("open");
  $("#m-cancel").onclick=closeModal; $("#m-save").onclick=async()=>{ const r=await onSave(); if(r!==false) closeModal(); };
  if(del) $("#m-del").onclick=async()=>{ const r=await onDelete(); if(r!==false) closeModal(); };
  if(onOpen) onOpen();
}
function closeModal(){ $("#modal-bg").classList.remove("open"); MODAL={}; }
function pickInit(sel, cb){ const p=$(sel); $$("button",p).forEach(b=>b.onclick=()=>{ $$("button",p).forEach(x=>x.className=""); b.className="on"+(b.dataset.v==="negocio"||b.dataset.v==="gasto"?" red":b.dataset.v==="ambas"||b.dataset.v==="transfer"?" ember":""); if(cb) cb(b.dataset.v); }); }
function pickVal(sel){ const b=$(sel+" button.on"); return b?b.dataset.v:""; }

/* ============================================================
   DATOS DE EJEMPLO (se marcan demo:true y se borran desde Config)
   ============================================================ */
async function loadDemo(){
  const hoy=todayStr(); const m0=ymOf(hoy);
  const D=(ym,d)=>`${ym}-${String(Math.min(d,daysInMonth(ym))).padStart(2,"0")}`;
  STATE.cuentas=[{id:uid(),nombre:"BAC",tipo:"Banco",moneda:"USD",inicial:1800,ambito:"personal",demo:true},{id:uid(),nombre:"Wise",tipo:"Wise / Payoneer",moneda:"USD",inicial:4200,ambito:"negocio",demo:true},{id:uid(),nombre:"Efectivo",tipo:"Efectivo",moneda:"USD",inicial:900,ambito:"ambas",demo:true},{id:uid(),nombre:"USDT",tipo:"Cripto",moneda:"USDT",inicial:2500,ambito:"ambas",demo:true}];
  STATE.clientes=[
    {id:uid(),nombre:"Cliente A",servicio:"Growth partner · 3 meses",total:7500,estado:"activo",cuenta:"Wise",notas:"",demo:true,cuotas:[{id:uid(),label:"Cuota 1/3",monto:2500,fecha:D(addMonths(m0,-2),5),pagada:true},{id:uid(),label:"Cuota 2/3",monto:2500,fecha:D(addMonths(m0,-1),5),pagada:true},{id:uid(),label:"Cuota 3/3",monto:2500,fecha:D(m0,5),pagada:false}]},
    {id:uid(),nombre:"Cliente B",servicio:"Setup funnel + ads",total:4000,estado:"activo",cuenta:"Wise",notas:"",demo:true,cuotas:[{id:uid(),label:"50% inicio",monto:2000,fecha:D(addMonths(m0,-1),18),pagada:true},{id:uid(),label:"50% entrega",monto:2000,fecha:D(m0,20),pagada:false}]},
    {id:uid(),nombre:"Cliente C",servicio:"Mentoría 1-1",total:1500,estado:"activo",cuenta:"USDT",notas:"",demo:true,cuotas:[{id:uid(),label:"Pago único",monto:1500,fecha:D(addMonths(m0,1),3),pagada:false}]},
    {id:uid(),nombre:"Cliente D",servicio:"Growth partner · 3 meses (cerrado)",total:12000,estado:"cerrado",cuenta:"Wise",notas:"",demo:true,cuotas:[{id:uid(),label:"Cuota 1/3",monto:3200,fecha:D(addMonths(m0,-5),5),pagada:true},{id:uid(),label:"Cuota 2/3",monto:4500,fecha:D(addMonths(m0,-4),5),pagada:true},{id:uid(),label:"Cuota 3/3",monto:4300,fecha:D(addMonths(m0,-3),5),pagada:true}]}
  ];
  STATE.recurrentes=[{id:uid(),nombre:"Alquiler",monto:650,dia:1,cuenta:"BAC",ambito:"personal",categoria:"Vivienda",activo:true,demo:true},{id:uid(),nombre:"Gym",monto:45,dia:3,cuenta:"BAC",ambito:"personal",categoria:"Salud",activo:true,demo:true},{id:uid(),nombre:"Claude + ChatGPT",monto:40,dia:8,cuenta:"Wise",ambito:"negocio",categoria:"Herramientas",activo:true,demo:true},{id:uid(),nombre:"GoHighLevel",monto:97,dia:12,cuenta:"Wise",ambito:"negocio",categoria:"Herramientas",activo:true,demo:true},{id:uid(),nombre:"Editor (freelance)",monto:400,dia:15,cuenta:"USDT",ambito:"negocio",categoria:"Salarios",activo:true,demo:true}];
  const movs=[]; const push=(ym,d,o)=>movs.push(Object.assign({id:uid(),fecha:D(ym,d),moneda:"USD",cuenta:"",cuenta_destino:"",categoria:"",concepto:"",cliente:"",notas:"",demo:true,created_at:new Date().toISOString()},o));
  const ventas={5:[[3200,"Cliente D","Cuota 1/3"]],4:[[4500,"Cliente D","Cuota 2/3"]],3:[[4300,"Cliente D","Cuota 3/3"]],2:[[2500,"Cliente A","Cuota 1/3"]],1:[[2500,"Cliente A","Cuota 2/3"],[2000,"Cliente B","50% inicio"]],0:[]};
  for(let i=5;i>=0;i--){ const ym=addMonths(m0,-i);
    (ventas[i]||[]).forEach(v=>push(ym,5,{ambito:"negocio",tipo:"ingreso",monto:v[0],cuenta:"Wise",categoria:"Ventas",concepto:`${v[1]} · ${v[2]}`,cliente:v[1]}));
    if(i%2===0) push(ym,1,{ambito:"negocio",tipo:"ingreso",monto:900+i*150,cuenta:"USDT",categoria:"Comisión",concepto:"Comisión referido"});
    if(i===1) push(ym,22,{ambito:"negocio",tipo:"ingreso",monto:1200,cuenta:"USDT",categoria:"Comisión",concepto:"Comisión afiliado"});
    push(ym,1,{ambito:"personal",tipo:"gasto",monto:650,cuenta:"BAC",categoria:"Vivienda",concepto:"Alquiler"});
    push(ym,3,{ambito:"personal",tipo:"gasto",monto:45,cuenta:"BAC",categoria:"Salud",concepto:"Gym"});
    push(ym,8,{ambito:"negocio",tipo:"gasto",monto:40,cuenta:"Wise",categoria:"Herramientas",concepto:"Claude + ChatGPT"});
    push(ym,12,{ambito:"negocio",tipo:"gasto",monto:97,cuenta:"Wise",categoria:"Herramientas",concepto:"GoHighLevel"});
    push(ym,15,{ambito:"negocio",tipo:"gasto",monto:400,cuenta:"USDT",categoria:"Salarios",concepto:"Editor (freelance)"});
    push(ym,10,{ambito:"negocio",tipo:"gasto",monto:300+i*80,cuenta:"Wise",categoria:"Ads",concepto:"Meta Ads"});
    push(ym,6,{ambito:"personal",tipo:"gasto",monto:220+i*15,cuenta:"BAC",categoria:"Comida",concepto:"Súper"});
    push(ym,14,{ambito:"personal",tipo:"gasto",monto:80,cuenta:"Efectivo",categoria:"Transporte",concepto:"Uber"});
    push(ym,22,{ambito:"personal",tipo:"gasto",monto:120+(i%3)*60,cuenta:"BAC",categoria:"Ocio",concepto:"Cena / salidas"});
    if(i<4) push(ym,25,{ambito:"personal",tipo:"gasto",monto:500,cuenta:"USDT",categoria:"Inversión",concepto:"DCA BTC"});
    if(i===3) push(ym,27,{ambito:"personal",tipo:"gasto",monto:1100,cuenta:"BAC",categoria:"Viajes",concepto:"Vuelo Dubái"});
    push(ym,28,{ambito:"negocio",tipo:"transfer",monto:1500,cuenta:"Wise",cuenta_destino:"BAC",concepto:"Retiro personal"});
  }
  movs.forEach(m=>{ if(m.fecha>hoy) m.fecha=hoy; });
  MOVS=movs.concat(MOVS);
  if(sb){ await sb.from("pg_movimientos").insert(movs); for(const k of ["cuentas","clientes","recurrentes"]) await saveState(k); } else saveLocal();
  toast("Datos de ejemplo cargados"); render();
}
async function clearDemo(){
  MOVS=MOVS.filter(m=>!m.demo); ["cuentas","clientes","recurrentes"].forEach(k=>STATE[k]=STATE[k].filter(x=>!x.demo));
  if(sb){ await sb.from("pg_movimientos").delete().eq("demo",true); for(const k of ["cuentas","clientes","recurrentes"]) await saveState(k); } else saveLocal();
  toast("Datos de ejemplo borrados"); render();
}

/* ============================================================
   ARRANQUE
   ============================================================ */
window.addEventListener("DOMContentLoaded", async()=>{
  $$("#scope-seg button").forEach(b=>b.onclick=()=>{SCOPE=b.dataset.scope;render();});
  $$("#views button").forEach(b=>b.onclick=()=>{VIEW=b.dataset.view;render();window.scrollTo({top:0});});
  $("#m-prev").onclick=()=>{MONTH=addMonths(MONTH,-1);render();};
  $("#m-next").onclick=()=>{MONTH=addMonths(MONTH,1);render();};
  $("#m-close").onclick=closeModal; $("#modal-bg").addEventListener("click",e=>{ if(e.target.id==="modal-bg") closeModal(); });
  const cap=$("#cap"); cap.addEventListener("input",capturePreview); cap.addEventListener("keydown",e=>{ if(e.key==="Enter"){e.preventDefault();captureSubmit();} if(e.key==="Escape"){cap.value="";capturePreview();cap.blur();} });
  cap.addEventListener("blur",()=>setTimeout(()=>{ if(document.activeElement!==cap) $("#cap-preview").classList.add("hidden"); },150)); cap.addEventListener("focus",capturePreview);
  $("#cap-form").onclick=()=>{ const p=parseCapture(cap.value); openMov(null, p?{tipo:p.tipo,monto:p.monto,categoria:p.categoria,cuenta:p.cuenta,concepto:p.concepto,ambito:p.ambito,fecha:p.fecha,cliente:p.cliente}:{}); };
  document.addEventListener("keydown",e=>{ if(e.key==="/" && !["INPUT","TEXTAREA","SELECT"].includes(document.activeElement.tagName)){ e.preventDefault(); cap.focus(); } if(e.key==="Escape" && $("#modal-bg").classList.contains("open")) closeModal(); });
  let rt, lastW=0; const redraw=()=>{ clearTimeout(rt); rt=setTimeout(()=>{ const w=$("#skyline-wrap"); if(VIEW==="mando" && w && w.clientWidth!==lastW){ lastW=w.clientWidth; drawSkyline(); } },120); };
  window.addEventListener("resize",redraw);
  if(window.ResizeObserver) new ResizeObserver(redraw).observe(document.querySelector(".shell"));
  if(sb){ setDb(false); await loadCloud(); subscribeCloud(); } else { loadLocal(); setDb(false); }
  render();
});
