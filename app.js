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
  objetivoNegocio: 30000      // USD/mes del negocio (editable en Config)
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
let SCOPE = "negocio";         // todo el CRM es del negocio
let MONTH = ymOf(todayStr());  // "YYYY-MM"
let VIEW = "mando";
let MOV_FILTERS = { tipo:"", categoria:"", cuenta:"", q:"", vista:"feed", rango:"mes" };

const TIPOS_CLIENTE = {growth:"Growth partner", closing:"Closing", consultoria:"Consultoría"};
const CAT_TIPO = {growth:"Growth partner", closing:"Closing", consultoria:"Consultoría"};
const MEDIOS = ["","Transferencia","Stripe","PayPal","Wise","USDT","Efectivo","Tarjeta","Otro"];
const EXT = {}; // CRMs vinculados: clienteId → {rows:[{fecha,monto,concepto}], at, error, sb, ch}
const FIJAS = ["Vivienda","Suscripciones","Servicios","Herramientas","Equipo","Salarios","Seguro","Deuda"];
const AHORRO = ["Ahorro","Inversión"];

function defaultState(){
  return {
    config: {
      marca: BRAND.marca, sub: BRAND.sub,
      objetivoPersonal: BRAND.objetivoPersonal, objetivoNegocio: BRAND.objetivoNegocio,
      moneda: "USD", tcCRC: 510,
      categorias: {
        ingreso: ["Growth partner","Closing","Consultoría","Ventas","Comisión","Reembolso","Otro ingreso"],
        gasto: ["Vivienda","Comida","Transporte","Suscripciones","Herramientas","Equipo","Ads","Salarios","Servicios","Salud","Viajes","Ropa","Ocio","Educación","Impuestos","Seguro","Deuda","Ahorro","Inversión","Otro gasto"]
      }
    },
    cuentas: [],      // [{id,nombre,tipo,moneda,inicial,ambito,demo}]
    clientes: [],     // [{id,nombre,servicio,tipo:'growth'|'closing'|'consultoria',pct,total,estado,cuenta,notas,cuotas:[...],demo}]
    cobros: [],       // cash collected: [{id,fecha,clienteId,bruto,pct,mio,concepto,pagado,movId,demo}]
    recurrentes: []   // [{id,nombre,monto,dia,cuenta,ambito,categoria,activo,demo}]
  };
}

/* ============================================================
   UTILIDADES
   ============================================================ */
const $ = (s, el=document) => el.querySelector(s);
const $$ = (s, el=document) => Array.from(el.querySelectorAll(s));
function clipTxt(s,n=60){ s=String(s||""); return s.length>n?s.slice(0,n)+"…":s; }
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
function inScope(m){ return true; }
function isFija(cat){ return FIJAS.includes(cat); }
function isAhorro(cat){ return AHORRO.includes(cat); }
function cuentasScope(){ return STATE.cuentas; }
function toast(msg){ const t=$("#toast"); t.textContent=msg; t.classList.add("show"); clearTimeout(toast._t); toast._t=setTimeout(()=>t.classList.remove("show"),2600); }

/* ============================================================
   PERSISTENCIA — local (localStorage) o nube (Supabase)
   ============================================================ */
function saveLocal(){ if(sb) return; try{ localStorage.setItem(STORE_KEY, JSON.stringify({movs:MOVS, state:STATE})); }catch(e){} }
function loadLocal(){
  try{ const raw=localStorage.getItem(STORE_KEY); if(!raw) return; const d=JSON.parse(raw);
    MOVS = d.movs||[]; STATE = Object.assign(defaultState(), d.state||{}); if(!STATE.cobros) STATE.cobros=[];
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
function movsMes(ym, scope=SCOPE){ return MOVS.filter(m => ymOf(m.fecha)===ym); }
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
function cobrosDe(cl){ return (STATE.cobros||[]).filter(c=>c.clienteId===cl.id); }
function extSum(cl, ym){ const e=EXT[cl.id]; if(!e||!e.rows) return 0; return e.rows.filter(r=>!ym||ymOf(r.fecha)===ym).reduce((a,r)=>a+(Number(r.monto)||0),0); }
function cuotasPagadas(cl, ym){ return (cl.cuotas||[]).filter(q=>q.pagada && !q.previo && (!ym||ymOf(q.pagadaEl||q.fecha||"")===ym)).reduce((a,q)=>a+(Number(q.monto)||0),0); }
/* Revenue = valor de lo cerrado: contratos de consultoría (por fecha de cierre) + tu parte devengada de growth/closing */
function revenueMes(ym){
  const cons=STATE.clientes.filter(c=>c.tipo==="consultoria").filter(c=>{ const f=c.cierre||((c.cuotas||[]).map(q=>q.fecha).filter(Boolean).sort()[0])||""; return ym ? ymOf(f)===ym : true; }).reduce((a,c)=>a+(Number(c.total)||0),0);
  const gr=STATE.clientes.filter(c=>c.tipo!=="consultoria").reduce((a,c)=>a+clienteDevengado(c,ym),0);
  return cons+gr;
}
function cashCollectedMes(ym){ return MOVS.filter(m=>m.tipo==="ingreso"&&(!ym||ymOf(m.fecha)===ym)).reduce((a,m)=>a+toUSD(m),0); }
function clienteBruto(cl, ym){ if(cl.tipo==="consultoria") return Math.max(cuotasPagadas(cl,ym), ym?0:clienteCobrado(cl)); return extSum(cl,ym)+cobrosDe(cl).filter(c=>!ym||ymOf(c.fecha)===ym).reduce((a,c)=>a+(Number(c.bruto)||0),0); }
function clienteDevengado(cl, ym){ if(cl.tipo==="consultoria") return clienteBruto(cl,ym); return extSum(cl,ym)*pctCliente(cl)/100 + cobrosDe(cl).filter(c=>!ym||ymOf(c.fecha)===ym).reduce((a,c)=>a+(Number(c.mio)||0),0); }
function clientePendiente(cl){ return Math.max(0, clienteDevengado(cl)-clienteCobrado(cl)); }
function cobrosPendientes(){ return (STATE.cobros||[]).filter(c=>!c.pagado).map(c=>({c, cl:STATE.clientes.find(x=>x.id===c.clienteId)})).filter(x=>x.cl).sort((a,b)=>(a.c.fecha||"").localeCompare(b.c.fecha||"")); }
function pctCliente(cl){ return cl.tipo==="consultoria" ? 100 : (Number(cl.pct)||0); }
const LINK_NYLO = {url:"https://iykadhzbeqozkfwjayot.supabase.co", key:"sb_publishable_l7Cn0fKpfC93XIzu_78FBw_8z5VdSEi", tabla:"pagos", campoMonto:"usd", campoFecha:"fecha", desde:"2026-10-02"}; // Santiago entra a NYLO el 02/10/2026: pagos anteriores no cuentan
async function seedClientesReales(){
  // migración: Tony → NYLO (mismo cliente, mismo %), con su CRM vinculado
  const tony=STATE.clientes.find(c=>!c.demo && c.nombre==="Tony");
  if(tony && !STATE.clientes.some(c=>c.nombre==="NYLO")){ tony.nombre="NYLO"; if(!tony.link) tony.link=Object.assign({},LINK_NYLO); MOVS.forEach(m=>{ if(m.cliente==="Tony") m.cliente="NYLO"; }); await saveState("clientes"); saveLocal(); }
  const ny=STATE.clientes.find(c=>!c.demo && c.nombre==="NYLO" && c.link && !c.link.desde); if(ny){ ny.link.desde=LINK_NYLO.desde; await saveState("clientes"); }
  // registros reales iniciales (se cargan una sola vez por dispositivo hasta que Primal tenga Supabase)
  if(!STATE.config.seedDiego && !STATE.clientes.some(c=>c.nombre==="Diego Ospino") && !MOVS.some(m=>m.concepto==="Diego Ospino · Pago 1 (310 EUR)")){
    const cu1={id:"cuota-diego-1",label:"Pago 1",monto:1150,fecha:"",pagada:true,pagadaEl:"",previo:true,medio:"",comprobante:"",movId:""};
    const cu2={id:"cuota-diego-2",label:"Pago 2",monto:350,fecha:"2026-10-02",pagada:true,pagadaEl:"2026-10-02",medio:"Transferencia",comprobante:"https://drive.google.com/file/d/1v2EzsrepHHLc2ZL455Q6Kd61GscxEO4K/view?usp=sharing",movId:"mov-diego-1"};
    STATE.clientes.push({id:"cli-diego",nombre:"Diego Ospino",servicio:"Consultoría",tipo:"consultoria",pct:100,total:1500,cierre:"2026-10-02",estado:"activo",cuenta:"",notas:"Revenue del trato: 1.500 USD. Pago 1 (1.150) fue antes de que Primal llevara caja: cuenta como revenue, no como cash collected. Pago 2: 310 EUR ≈ 350 USD por transferencia.",telefono:"+34 647 85 56 80",email:"kryptoneerbusiness@gmail.com",tipoCuota:"Otro",medio:"Transferencia",link:null,cuotas:[cu1,cu2]});
    MOVS.unshift({id:"mov-diego-1",fecha:"2026-10-02",ambito:"negocio",tipo:"ingreso",monto:350,moneda:"USD",cuenta:"",cuenta_destino:"",categoria:"Consultoría",concepto:"Diego Ospino · Pago 2 (310 EUR)",cliente:"Diego Ospino",notas:"310 EUR convertidos a 350 USD. Transferencia. Comprobante en Drive (Comprobantes octubre).",demo:false,created_at:new Date().toISOString()});
    if(sb){ await sb.from("pg_movimientos").upsert(MOVS[0]); } 
    STATE.config.seedDiego=true; await saveState("clientes"); await saveState("config"); saveLocal();
  }
  const dg=STATE.clientes.find(c=>c.id==="cli-diego"); if(dg && (dg.cuotas||[]).length===1){ dg.total=1500; dg.cierre="2026-10-02"; dg.medio="Transferencia"; dg.tipoCuota="Otro"; dg.cuotas=[{id:"cuota-diego-1",label:"Pago 1",monto:1150,fecha:"",pagada:true,pagadaEl:"",previo:true,medio:"",comprobante:"",movId:""},Object.assign(dg.cuotas[0],{label:"Pago 2",medio:"Transferencia"})]; const mv=MOVS.find(m=>m.id==="mov-diego-1"); if(mv){ mv.concepto="Diego Ospino · Pago 2 (310 EUR)"; if(sb) await updMov(mv.id,{concepto:mv.concepto}); } await saveState("clientes"); saveLocal(); }
  if(STATE.config.seedClientes) return;
  if(!STATE.clientes.some(c=>!c.demo)){
    [["Estiven","Growth partner",25,null],["Amelia","Growth partner",12.5,null],["NYLO","Growth partner",27.5,Object.assign({},LINK_NYLO)]].forEach(([n,sv,p,l])=>STATE.clientes.push({id:uid(),nombre:n,servicio:sv,tipo:"growth",pct:p,total:0,estado:"activo",cuenta:"",notas:"",cuotas:[],telefono:"",email:"",link:l}));
    await saveState("clientes");
  }
  STATE.config.seedClientes=true; await saveState("config");
}
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
  $("#n-cobros").textContent = STATE.clientes.filter(c=>c.tipo!=="consultoria" && clientePendiente(c)>0.5).length || "";
  const capEl=$("#capture"); if(capEl) capEl.classList.toggle("hidden", VIEW==="config");
  $("#n-cuotas").textContent = cuotasPendientes().filter(x=>x.q.fecha && x.q.fecha<=todayStr()).length || "";
  ({mando:renderMando, movs:renderMovs, growth:renderGrowth, consultoria:renderConsultoria, cuotas:renderCuotas, recurrentes:renderRecurrentes, config:renderConfig})[VIEW]();
}

/* ============================================================
   VISTA · MANDO
   ============================================================ */
function renderMando(){
  const el=$("#view-mando"); const t=totales(MONTH); const prev=totales(addMonths(MONTH,-1));
  const cash=cashScope(); const burn=burnPromedio(); const runway = burn>0 ? cash/burn : null;
  const objetivo = Number(STATE.config.objetivoNegocio)||0;
  const pct = objetivo>0 ? Math.min(100, t.ingreso/objetivo*100) : 0;
  const deltaIng = prev.ingreso>0 ? ((t.ingreso-prev.ingreso)/prev.ingreso*100) : null;
  const hasData = MOVS.length>0 || STATE.cuentas.length>0;
  const scopeTxt = "negocio";

  const ccMes=cashCollectedMes(MONTH), ccPrev=cashCollectedMes(addMonths(MONTH,-1)), ccTot=cashCollectedMes(null);
  const rev=revenueMes(MONTH), profit=ccMes-t.gasto;
  const dCC = ccPrev>0 ? ((ccMes-ccPrev)/ccPrev*100) : null;
  el.innerHTML = `
  <section class="hero">
    <div class="hero-num">
      <div class="eyebrow">Cash collected · ${monthLabel(MONTH)}</div>
      <div class="big ember">${fmt(ccMes)}</div>
      <div class="delta">${dCC==null ? `acumulado <b>${fmt(ccTot)}</b>` : `<b class="${dCC>=0?'ok':'bad'}">${dCC>=0?'▲':'▼'} ${Math.abs(dCC).toFixed(0)}%</b> vs mes anterior · acumulado <b>${fmt(ccTot)}</b>`}</div>
      <div class="subkpis" style="grid-template-columns:1fr 1fr 1fr">
        <div class="subkpi"><div class="l">Revenue</div><div class="v">${fmt(rev)}</div><div class="s">cerrado este mes</div></div>
        <div class="subkpi"><div class="l">Gastos</div><div class="v" style="color:var(--red-2)">${fmt(t.gasto)}</div><div class="s">${ccMes>0?`${(t.gasto/ccMes*100).toFixed(0)}% del cash`:"—"}</div></div>
        <div class="subkpi"><div class="l">Profit</div><div class="v ${profit<0?'bad':''}">${fmt(profit)}</div><div class="s">${ccMes>0?`margen ${(profit/ccMes*100).toFixed(0)}%`:"—"}</div></div>
      </div>
      <div class="meta">
        <div class="row"><span>Objetivo del mes</span><b>${fmt(ccMes)} / ${fmt(objetivo)}</b></div>
        <div class="bar"><i class="${(objetivo>0?Math.min(100,ccMes/objetivo*100):0)>=100?'done':''}" style="width:${objetivo>0?Math.min(100,ccMes/objetivo*100):0}%"></i></div>
        <div class="row" style="margin-top:7px"><span>${objetivo>0&&ccMes>=objetivo?"objetivo cumplido":"faltan "+fmt(Math.max(0,objetivo-ccMes))}</span><span>${objetivo>0?Math.min(100,ccMes/objetivo*100).toFixed(0):0}%</span></div>
        <div class="row" style="margin-top:9px;padding-top:9px;border-top:1px solid var(--line)"><span>Cash disponible en cuentas</span><b class="${cash<0?'bad':''}">${fmt(cash)}</b></div>
        <div class="row" style="margin-top:4px"><span>Runway</span><b>${runway==null?"—":runway>=24?"+24 meses":runway.toFixed(1)+" meses"}</b></div>
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
  </section>
  ${renderTotalSections()}`;
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
    <div class="n"><span>${esc(c.nombre)}</span><em>${esc(c.moneda||"USD")}</em></div>
    <div class="v ${s<0?'neg':''}">${fmt(s)}</div>
    <div class="t">${esc(c.tipo||"")}${c.moneda&&c.moneda!=="USD"?" · "+esc(c.moneda):""}</div></div>`; }).join("")}</div>`;
}
function renderPendientesCobro(){
  if(SCOPE==="personal") return `<div class="empty" style="padding:18px">Los cobros viven en el ámbito negocio.</div>`;
  const cp=cobrosPendientes().slice(0,6); const p=cuotasPendientes().slice(0,Math.max(0,6-cp.length));
  const linked=STATE.clientes.filter(c=>c.link&&c.link.url&&clientePendiente(c)>0.5);
  if(!cp.length && !p.length && !linked.length) return `<div class="empty" style="padding:18px">Nada pendiente de cobro.<br><span class="dim">Registrá cash collected de un cliente y marcá si ya te pagaron tu parte.</span></div>`;
  const hoy=todayStr();
  return `<div class="list">${linked.map(cl=>`<div class="row click" onclick="cobrarSaldo('${cl.id}')"><div class="a"><b>${esc(cl.nombre)} · ${pctCliente(cl)}% del CRM</b><small>saldo pendiente de tu parte</small></div><div class="b">${fmt(clientePendiente(cl))}<small>cobrar →</small></div></div>`).join("")}${cp.map(({c,cl})=>`<div class="row click" onclick="cobrarPendiente('${c.id}')"><div class="a"><b>${esc(cl.nombre)} · ${pctCliente(cl)}% de ${fmt(c.bruto)}</b><small>${esc(c.concepto||"cash collected")} · ${esc(c.fecha)}</small></div><div class="b">${fmt(c.mio)}<small>cobrar →</small></div></div>`).join("")}${p.map(({cl,q})=>`<div class="row click" onclick="cobrarCuota('${cl.id}','${q.id}')">
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
  <div class="mini" style="margin-top:16px;letter-spacing:.08em;text-transform:none;font-size:12px;color:var(--muted)">Caja es el libro de cada dólar que entró o salió de tus cuentas. Growth, Consultoría y Cuotas registran los cobros; acá los ves junto con los gastos, y de acá salen el cash disponible y el runway.</div>
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
  <div style="display:flex;gap:8px;flex-wrap:wrap;margin:4px 0 10px">
    <button class="btn gold sm" onclick="openCobro()">+ Cash collected de cliente</button>
    <button class="btn sm" onclick="openMov(null,{tipo:'ingreso',ambito:'negocio'})">+ Ingreso</button>
    <button class="btn sm" onclick="openMov(null,{tipo:'gasto'})">− Gasto</button>
    <button class="btn sm ghost" onclick="openTransfer()">⇄ Transferencia</button>
  </div>
  <div class="mini" style="display:flex;gap:18px;flex-wrap:wrap"><span>${list.length} movimientos</span><span>entró <b class="ember">${fmt(sumI)}</b></span><span>salió <b class="bad">${fmt(sumG)}</b></span><span>neto <b>${fmt(sumI-sumG)}</b></span></div>
  ${!list.length ? `<div class="empty"><div class="g">NADA POR ACÁ</div>Usá los botones de arriba para registrar un cobro o un gasto.</div>` : f.vista==="tabla" ? renderTabla(list) : renderFeed(list)}`;
  $("#f-rango").onchange=e=>{f.rango=e.target.value;render();};
  $("#f-tipo").onchange=e=>{f.tipo=e.target.value;render();};
  $("#f-cat").onchange=e=>{f.categoria=e.target.value;render();};
  $("#f-cta").onchange=e=>{f.cuenta=e.target.value;render();};
  $("#f-q").oninput=e=>{f.q=e.target.value;render(); const i=$("#f-q"); i.focus(); i.setSelectionRange(i.value.length,i.value.length);};
  $$("[data-vista]",el).forEach(b=>b.onclick=()=>{f.vista=b.dataset.vista;render();});
}
function movTags(m){
  const t=[];
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
  return `<table class="tbl"><thead><tr><th>Fecha</th><th>Tipo</th><th>Concepto</th><th>Categoría</th><th>Cuenta</th><th>Cliente</th><th class="num">USD</th></tr></thead><tbody>
  ${list.map(m=>`<tr onclick="openMov('${m.id}')"><td class="mono">${esc(m.fecha)}</td><td>${esc(m.tipo)}</td><td>${esc(m.concepto)}</td><td>${esc(m.categoria)}</td><td>${esc(m.cuenta)}${m.cuenta_destino?" → "+esc(m.cuenta_destino):""}</td><td>${esc(m.cliente)}</td><td class="num ${m.tipo==="gasto"?"bad":""}">${m.tipo==="gasto"?"−":""}${fmt(toUSD(m))}</td></tr>`).join("")}
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
function openClienteDetalle(id){
  const c=STATE.clientes.find(x=>x.id===id); if(!c) return;
  const list=cobrosDe(c).sort((a,b)=>(b.fecha||"").localeCompare(a.fecha||""));
  const movs=MOVS.filter(m=>m.tipo==="ingreso"&&m.cliente===c.nombre).sort((a,b)=>b.fecha.localeCompare(a.fecha));
  openModal({ title:`<i>›</i> ${esc(c.nombre)}`, saveLabel:"Editar cliente", body:`
    <div class="burn" style="margin:0 0 4px"><div class="subkpi"><div class="l">Cash collected</div><div class="v">${fmt(clienteBruto(c))}</div></div><div class="subkpi"><div class="l">Mi ${pctCliente(c)}%</div><div class="v ember">${fmt(clienteDevengado(c))}</div></div><div class="subkpi"><div class="l">Cobrado</div><div class="v">${fmt(clienteCobrado(c))}</div></div><div class="subkpi"><div class="l">Pendiente</div><div class="v ${clientePendiente(c)>0?"bad":"dim"}">${fmt(clientePendiente(c))}</div></div></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">${c.tipo==="consultoria"?"":`<button type="button" class="btn gold sm" onclick="closeModal();openCobro('${c.id}')">+ Cash collected</button>`}${c.tipo!=="consultoria"&&clientePendiente(c)>0.5?`<button type="button" class="btn sm" onclick="closeModal();cobrarSaldo('${c.id}')">Cobrar saldo ${fmt(clientePendiente(c))}</button>`:""}<button type="button" class="btn sm" onclick="closeModal();openMov(null,{tipo:'ingreso',ambito:'negocio',cliente:'${esc(c.nombre)}',categoria:'${CAT_TIPO[c.tipo]||"Ventas"}',cuenta:'${esc(c.cuenta||"")}'})">+ Pago recibido</button></div>
    ${(c.telefono||c.email)?`<div class="mini">${c.telefono?`<a href="https://wa.me/${esc(String(c.telefono).replace(/[^0-9]/g,""))}" target="_blank">${esc(c.telefono)}</a>`:""} ${c.email?` · <a href="mailto:${esc(c.email)}">${esc(c.email)}</a>`:""}${c.tipoCuota?` · ${esc(c.tipoCuota)}`:""}${c.medio?` · ${esc(c.medio)}`:""}</div>`:""}
    ${c.link&&c.link.url?`<div class="f"><label>Pagos del CRM vinculado ${extBadge(c)}</label>${(()=>{ const e=EXT[c.id]; if(!e||!e.rows||!e.rows.length) return `<div class="mini">${e&&e.error?esc(e.error):"sin pagos todavía"}</div>`; return `<div class="list">${e.rows.slice(0,12).map(r=>`<div class="row"><div class="a"><b>${fmt(r.monto)} · ${esc(clipTxt(r.concepto||"pago",50))}</b><small>${esc(r.fecha)}${r.closer?" · "+esc(r.closer):""}${r.metodo?" · "+esc(r.metodo):""}</small></div><div class="b ember">${fmt(r.monto*pctCliente(c)/100)}<small>${pctCliente(c)}%</small></div></div>`).join("")}</div>`; })()}</div>`:""}
    ${(c.cuotas||[]).length?`<div class="f"><label>Cuotas</label><div class="list">${c.cuotas.slice().sort((a,b)=>(a.fecha||"9999").localeCompare(b.fecha||"9999")).map(q=>`<div class="row click" onclick="closeModal();openComprobante('${c.id}','${q.id}')"><div class="a"><b>${esc(q.label||"cuota")}</b><small>${esc(q.fecha||(q.previo?"antes de Primal":"s/f"))}${q.medio?" · "+esc(q.medio):""}${q.comprobante?" · comprobante ✓":""}</small></div><div class="b">${fmt(q.monto)}<small>${q.previo?'<span class="dim">previa</span>':q.pagada?'<span class="ok">pagada</span>':`<button class="btn xs gold" onclick="event.stopPropagation();closeModal();cobrarCuota('${c.id}','${q.id}')">cobrar</button>`}</small></div></div>`).join("")}</div></div>`:""}
    <div class="f"><label>Cash collected manual</label>${!list.length?`<div class="mini">Nada todavía.</div>`:`<div class="list">${list.slice(0,15).map(x=>`<div class="row click" onclick="closeModal();openCobro(null,'${x.id}')"><div class="a"><b>${fmt(x.bruto)} · ${esc(x.concepto||"cash collected")}</b><small>${esc(x.fecha)} · ${x.pct}%</small></div><div class="b">${fmt(x.mio)}<small>${x.pagado?'<span class="ok">cobrado</span>':'<span class="warn">pendiente</span>'}</small></div></div>`).join("")}</div>`}</div>
    <div class="f"><label>Pagos recibidos (movimientos)</label>${!movs.length?`<div class="mini">Ninguno.</div>`:`<div class="list">${movs.slice(0,10).map(m=>`<div class="row click" onclick="closeModal();openMov('${m.id}')"><div class="a"><b>${esc(m.concepto||m.categoria)}</b><small>${esc(m.fecha)} · @${esc(m.cuenta||"—")}</small></div><div class="b ember">+${fmt(toUSD(m))}</div></div>`).join("")}</div>`}</div>`,
    onSave(){ closeModal(); openCliente(id); return false; }
  });
}
function openCobro(clienteId, cobroId){
  const c = cobroId ? STATE.cobros.find(x=>x.id===cobroId) : {id:uid(), fecha:todayStr(), clienteId:clienteId||(STATE.clientes[0]||{}).id||"", bruto:"", pct:null, mio:0, concepto:"", pagado:false, movId:""};
  if(!STATE.clientes.length){ toast("Primero creá un cliente"); openCliente(); return; }
  const cl=()=>{ const el=$("#cb-cl"); return STATE.clientes.find(x=>x.id===(el?el.value:c.clienteId)); };
  const cl0=STATE.clientes.find(x=>x.id===c.clienteId)||STATE.clientes[0];
  openModal({ title: cobroId?"Editar <i>cash collected</i>":"Cash collected <i>de cliente</i>", del:!!cobroId, body:`
    <div class="f2"><div class="f"><label>Cliente</label><select id="cb-cl">${STATE.clientes.filter(x=>x.tipo!=="consultoria"||x.id===c.clienteId).map(x=>`<option value="${x.id}" ${x.id===c.clienteId?"selected":""}>${esc(x.nombre)} · ${pctCliente(x)}%</option>`).join("")}</select></div><div class="f"><label>Fecha</label><input id="cb-fecha" type="date" value="${esc(c.fecha)}" /></div></div>
    <div class="f3"><div class="f"><label>Cash collected del cliente (USD)</label><input id="cb-bruto" class="mono" type="number" step="0.01" value="${c.bruto}" autofocus /></div><div class="f"><label>Mi %</label><input id="cb-pct" class="mono" type="number" step="0.1" value="${c.pct!=null?c.pct:""}" /></div><div class="f"><label>Mi parte</label><div id="cb-mio" style="font-family:var(--num);font-size:26px;color:var(--gold-2);padding-top:4px">$0</div></div></div>
    <div class="f"><label>Concepto</label><input id="cb-conc" value="${esc(c.concepto)}" placeholder="Ej: cierres semana 1, lanzamiento octubre" /></div>
    <div class="f"><label>¿Ya recibí mi parte?</label><div class="pick" id="cb-pag"><button type="button" data-v="0" class="${!c.pagado?"on":""}">Todavía no · queda pendiente</button><button type="button" data-v="1" class="${c.pagado?"on ember":""}">Sí · registrar ingreso</button></div></div>
    <div class="f ${c.pagado&&!c.movId?"":"hidden"}" id="cb-cta-wrap"><label>Entró en</label><select id="cb-cta"><option value="">—</option>${STATE.cuentas.map(k=>`<option ${(cl0&&cl0.cuenta===k.nombre)?"selected":""}>${esc(k.nombre)}</option>`).join("")}</select></div>
    <div class="mini" id="cb-nota">${c.movId?"Este cobro ya tiene su ingreso registrado en Movimientos.":"Si marcás «Sí», se crea el ingreso en Movimientos con tu parte."}</div>`,
    onOpen(){
      const upd=()=>{ const b=Number($("#cb-bruto").value)||0; const p=Number($("#cb-pct").value); $("#cb-mio").textContent=fmt(b*(isNaN(p)?0:p)/100); };
      const syncPct=()=>{ const k=cl(); if(k && ($("#cb-pct").value===""||!cobroId)) $("#cb-pct").value=pctCliente(k); upd(); };
      $("#cb-cl").onchange=syncPct; $("#cb-bruto").oninput=upd; $("#cb-pct").oninput=upd;
      if(c.pct==null) syncPct(); else upd();
      pickInit("#cb-pag", v=>{ $("#cb-cta-wrap").classList.toggle("hidden", v!=="1" || !!c.movId); });
    },
    async onSave(){
      const k=cl(); const bruto=Number($("#cb-bruto").value); if(!k||!(bruto>0)){ toast("Falta el monto"); return false; }
      const pct=Number($("#cb-pct").value)||0; const mio=Math.round(bruto*pct)/100;
      Object.assign(c,{fecha:$("#cb-fecha").value||todayStr(), clienteId:k.id, bruto, pct, mio, concepto:$("#cb-conc").value.trim(), pagado:pickVal("#cb-pag")==="1"});
      if(c.pagado && !c.movId){ const m=await addMov({fecha:c.fecha, ambito:"negocio", tipo:"ingreso", monto:mio, cuenta:$("#cb-cta").value, categoria:CAT_TIPO[k.tipo]||"Ventas", concepto:`${k.nombre} · ${pct}% de ${fmt(bruto)}${c.concepto?" · "+c.concepto:""}`, cliente:k.nombre}); c.movId=m.id; }
      else if(c.movId){ await updMov(c.movId,{fecha:c.fecha, monto:mio, cliente:k.nombre, concepto:`${k.nombre} · ${pct}% de ${fmt(bruto)}${c.concepto?" · "+c.concepto:""}`}); if(!c.pagado){ await delMov(c.movId); c.movId=""; } }
      if(!cobroId) STATE.cobros.push(c); await saveState("cobros"); toast(c.pagado?`+${fmt(mio)} cobrado`:`${fmt(mio)} pendiente de cobro`); render();
    },
    async onDelete(){ if(c.movId && confirm("¿Borrar también el ingreso asociado en Movimientos?")) await delMov(c.movId); STATE.cobros=STATE.cobros.filter(x=>x.id!==cobroId); await saveState("cobros"); render(); }
  });
}
async function cobrarPendiente(cobroId){
  const c=STATE.cobros.find(x=>x.id===cobroId); const k=c&&STATE.clientes.find(x=>x.id===c.clienteId); if(!c||!k) return;
  openMov(null, {tipo:"ingreso", ambito:"negocio", monto:c.mio, cliente:k.nombre, categoria:CAT_TIPO[k.tipo]||"Ventas", cuenta:k.cuenta||"", concepto:`${k.nombre} · ${c.pct}% de ${fmt(c.bruto)}${c.concepto?" · "+c.concepto:""}`, _cobro:cobroId});
}
function openCliente(id, tipoPreset){
  const c = id ? STATE.clientes.find(x=>x.id===id) : {id:uid(), nombre:"", servicio:"", tipo:tipoPreset||"growth", pct:tipoPreset==="consultoria"?100:25, total:0, estado:"activo", cuenta:"", notas:"", cuotas:[], telefono:"", email:"", link:null};
  const cuotas = JSON.parse(JSON.stringify(c.cuotas||[]));
  const body=()=>`
    <div class="f2"><div class="f"><label>Cliente</label><input id="c-nombre" value="${esc(c.nombre)}" placeholder="Nombre" /></div><div class="f"><label>Servicio / nota corta</label><input id="c-serv" value="${esc(c.servicio)}" placeholder="Ej: Growth partner · webinar" /></div></div>
    <div class="f2"><div class="f"><label>Teléfono / WhatsApp</label><input id="c-tel" value="${esc(c.telefono||"")}" placeholder="+506…" /></div><div class="f"><label>Email</label><input id="c-email" type="email" value="${esc(c.email||"")}" placeholder="correo@gmail.com" /></div></div>
    <div class="f"><label>Fuente de ingreso</label><div class="pick" id="c-tipo"><button type="button" data-v="growth" class="${(c.tipo||"growth")==="growth"?"on ember":""}">Growth partner (%)</button><button type="button" data-v="closing" class="${c.tipo==="closing"?"on":""}">Closing (%)</button><button type="button" data-v="consultoria" class="${c.tipo==="consultoria"?"on":""}">Consultoría (100%)</button></div></div>
    <div class="f3"><div class="f" id="c-pct-wrap"><label>Mi % del cash collected</label><input id="c-pct" class="mono" type="number" step="0.1" value="${c.pct!=null?c.pct:25}" /></div>
      <div class="f"><label>Estado</label><select id="c-estado">${["activo","pausa","cerrado"].map(s=>`<option ${c.estado===s?"selected":""}>${s}</option>`).join("")}</select></div>
      <div class="f"><label>Cobra en</label><select id="c-cuenta"><option value="">— cuenta —</option>${STATE.cuentas.map(k=>`<option ${c.cuenta===k.nombre?"selected":""}>${esc(k.nombre)}</option>`).join("")}</select></div></div>
    <div class="f3"><div class="f"><label>Revenue · contrato total (USD)</label><input id="c-total" class="mono" type="number" step="0.01" value="${c.total||""}" /><div class="mini">cierre: <input id="c-cierre" type="date" value="${esc(c.cierre||"")}" style="padding:3px 6px;font-size:11px;width:auto" /></div></div><div class="f"><label>Tipo de cuota</label><select id="c-tcuota">${["Pago único","Mensual","Quincenal","Semanal","50/50","3 cuotas","Otro"].map(t=>`<option ${(c.tipoCuota||"Pago único")===t?"selected":""}>${t}</option>`).join("")}</select></div><div class="f"><label>Medio de pago habitual</label><select id="c-medio">${MEDIOS.map(t=>`<option ${(c.medio||"")===t?"selected":""}>${t}</option>`).join("")}</select></div></div>
    <div class="f" id="c-link-wrap"><label>CRM del cliente</label><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">${extBadge(c)}<button type="button" class="btn xs" onclick="closeModal();openLink('${c.id}')">${c.link&&c.link.url?"Editar vínculo":"Vincular CRM"}</button></div></div>
    <div class="f"><label>Plan de cuotas (opcional) <button class="btn xs ghost" type="button" id="c-add" style="margin-left:8px">+ cuota</button> <button class="btn xs ghost" type="button" id="c-split" style="margin-left:4px">dividir total en N</button></label>
      <div class="cuota-list" id="c-cuotas"></div></div>
    <div class="f"><label>Notas</label><textarea id="c-notas">${esc(c.notas)}</textarea></div>`;
  openModal({ title: id ? `<i>›</i> ${esc(c.nombre)}` : "Nuevo <i>cliente</i>", body: body(), del: !!id,
    onOpen(){
      const tipoUI=v=>{ $("#c-pct-wrap").classList.toggle("hidden", v==="consultoria"); $("#c-link-wrap").classList.toggle("hidden", v==="consultoria"); if(v==="consultoria") $("#c-pct").value=100; };
      pickInit("#c-tipo", tipoUI); tipoUI(c.tipo||"growth");

      const list=$("#c-cuotas");
      const draw=()=>{ list.innerHTML = cuotas.length ? cuotas.map((q,i)=>`<div class="cuota"><input data-i="${i}" data-k="label" value="${esc(q.label)}" placeholder="Cuota ${i+1}" /><input data-i="${i}" data-k="monto" type="number" step="0.01" value="${q.monto||""}" placeholder="USD" /><input data-i="${i}" data-k="fecha" type="date" value="${esc(q.fecha||"")}" /><button type="button" class="chk ${q.pagada?"on":""}" data-i="${i}" title="pagada">✓</button><button type="button" class="del" data-i="${i}">×</button></div>`).join("") : `<div class="mini">Sin cuotas. Agregá una o dividí el total.</div>`;
        if(!cuotas.length) { /* nada */ }
        $$("input",list).forEach(inp=>inp.oninput=e=>{ cuotas[+inp.dataset.i][inp.dataset.k]= inp.dataset.k==="monto"?Number(inp.value):inp.value; });
        $$(".chk",list).forEach(b=>b.onclick=()=>{ cuotas[+b.dataset.i].pagada=!cuotas[+b.dataset.i].pagada; draw(); });
        $$(".del",list).forEach(b=>b.onclick=()=>{ cuotas.splice(+b.dataset.i,1); draw(); });
      };
      draw();
      $("#c-add").onclick=()=>{ cuotas.push({id:uid(),label:`Cuota ${cuotas.length+1}`,monto:0,fecha:"",pagada:false,medio:"",comprobante:""}); draw(); };
      $("#c-split").onclick=()=>{ const n=parseInt(prompt("¿En cuántas cuotas?","3")||"0"); const tot=Number($("#c-total").value)||0; if(!n||!tot) return; cuotas.length=0; const base=Math.floor(tot/n*100)/100; let f=todayStr(); for(let i=0;i<n;i++){ cuotas.push({id:uid(),label:`Cuota ${i+1}/${n}`,monto:i===n-1?Math.round((tot-base*(n-1))*100)/100:base,fecha:f,pagada:false}); const [y,m,d]=f.split("-").map(Number); const nd=new Date(y,m,Math.min(d,28)); f=`${nd.getFullYear()}-${String(nd.getMonth()+1).padStart(2,"0")}-${String(nd.getDate()).padStart(2,"0")}`; } draw(); };
    },
    async onSave(){
      c.nombre=$("#c-nombre").value.trim(); if(!c.nombre){toast("Falta el nombre");return false;}
      c.servicio=$("#c-serv").value.trim(); c.tipo=pickVal("#c-tipo")||"growth"; c.pct=c.tipo==="consultoria"?100:(Number($("#c-pct").value)||0); c.total=Number($("#c-total").value)||0; c.estado=$("#c-estado").value; c.cuenta=$("#c-cuenta").value; c.notas=$("#c-notas").value; c.cuotas=cuotas;
      c.telefono=$("#c-tel").value.trim(); c.email=$("#c-email").value.trim(); c.tipoCuota=$("#c-tcuota").value; c.medio=$("#c-medio").value; c.cierre=$("#c-cierre").value;
      if(c.tipo==="consultoria") c.link=null;
      if(!id) STATE.clientes.push(c); await saveState("clientes"); toast("Cliente guardado"); render();
    },
    async onDelete(){ if(!confirm(`¿Borrar a ${c.nombre}? Los ingresos ya registrados quedan.`)) return false; STATE.clientes=STATE.clientes.filter(x=>x.id!==id); STATE.cobros=(STATE.cobros||[]).filter(x=>x.clienteId!==id); await saveState("clientes"); await saveState("cobros"); render(); }
  });
}
async function cobrarCuota(cid, qid){
  const c=STATE.clientes.find(x=>x.id===cid); if(!c) return; const q=(c.cuotas||[]).find(x=>x.id===qid); if(!q) return;
  openMov(null, {tipo:"ingreso", ambito:"negocio", monto:q.monto, cliente:c.nombre, categoria:CAT_TIPO[c.tipo]||"Ventas", cuenta:c.cuenta||"", concepto:`${c.nombre} · ${q.label||"cuota"}`, _cuota:{cid,qid}});
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
    <div class="subkpi"><div class="l">Quema fija / mes</div><div class="v bad">${fmt(fp+fn)}</div><div class="s">${fmt((fp+fn)*12)} al año · ${act.length} cargos</div></div>
    <div class="subkpi"><div class="l">${monthLabel(MONTH)}</div><div class="v">${regs}/${act.length}</div><div class="s">registrados este mes</div></div>
    <div class="subkpi" style="display:flex;align-items:center;justify-content:center"><button class="btn gold" onclick="openRecurrente()">+ Recurrente</button></div>
  </div>
  <section class="panel"><h3>Cargos fijos <span class="sub">clic en "registrar" crea el gasto del mes · clic en el nombre edita</span></h3>
  ${!rs.length?`<div class="empty"><div class="g">SIN RECURRENTES</div>Alquiler, suscripciones, herramientas, salarios… lo que se cobra solo cada mes.</div>`:`<div class="list">${rs.map(r=>{ const reg=recurrenteRegistrado(r); return `<div class="row" style="grid-template-columns:1fr auto auto;gap:14px">
    <div class="a" style="cursor:pointer" onclick="openRecurrente('${r.id}')"><b>${esc(r.nombre)} ${r.activo===false?'<span class="tag">pausado</span>':""}</b><small>día ${esc(r.dia||"—")} · ${esc(r.categoria||"")} · @${esc(r.cuenta||"—")}</small></div>
    <div class="b" style="color:var(--red-2)">−${fmt(r.monto)}</div>
    <div>${reg?`<span class="tag ok">✓ registrado</span>`:`<button class="btn xs" onclick="registrarRecurrente('${r.id}')">registrar</button>`}</div></div>`; }).join("")}</div>`}
  </section>`;
}
function openRecurrente(id){
  const r = id ? STATE.recurrentes.find(x=>x.id===id) : {id:uid(), nombre:"", monto:0, dia:1, cuenta:"", ambito:"negocio", categoria:"Herramientas", activo:true};
  openModal({ title: id?`<i>›</i> ${esc(r.nombre)}`:"Nuevo <i>recurrente</i>", del:!!id, body:`
    <div class="f2"><div class="f"><label>Nombre</label><input id="r-nombre" value="${esc(r.nombre)}" placeholder="Ej: Alquiler, ChatGPT, GHL" /></div><div class="f"><label>Monto (USD)</label><input id="r-monto" class="mono" type="number" step="0.01" value="${r.monto||""}" /></div></div>
    <div class="f3"><div class="f"><label>Día del mes</label><input id="r-dia" type="number" min="1" max="31" value="${r.dia||1}" /></div>
      <div class="f"><label>Cuenta</label><select id="r-cuenta"><option value="">—</option>${STATE.cuentas.map(k=>`<option ${r.cuenta===k.nombre?"selected":""}>${esc(k.nombre)}</option>`).join("")}</select></div>
      <div class="f"><label>Categoría</label><select id="r-cat">${STATE.config.categorias.gasto.map(c=>`<option ${r.categoria===c?"selected":""}>${esc(c)}</option>`).join("")}</select></div></div>
    <div class="f hidden"><label>Ámbito</label><div class="pick" id="r-amb"><button type="button" data-v="negocio" class="on red">Negocio</button></div></div>
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
        <div class="f"><label>Objetivo del mes (USD)</label><input id="cfg-on" class="mono" type="number" value="${c.objetivoNegocio||0}" /></div><input id="cfg-op" type="hidden" value="${c.objetivoPersonal||0}" />
        <div class="f"><label>Tipo de cambio CRC → USD</label><input id="cfg-tc" class="mono" type="number" value="${c.tcCRC||510}" /></div>
      </div>
      <div style="margin-top:12px"><button class="btn gold" onclick="saveConfigForm()">Guardar</button></div>
    </div>
    <div class="panel"><h3>Cuentas <span class="act"><button class="btn xs ghost" onclick="openCuenta()">+ Cuenta</button></span></h3>
      ${!STATE.cuentas.length?`<div class="mini">Sin cuentas. Creá al menos una (ej: BAC, Wise, Efectivo, USDT).</div>`:`<div class="list">${STATE.cuentas.map(k=>`<div class="row click" onclick="openCuenta('${k.id}')"><div class="a"><b>${esc(k.nombre)}</b><small>${esc(k.tipo||"")} · ${esc(k.moneda||"USD")}</small></div><div class="b">${fmt(saldoCuenta(k))}<small>inicial ${fmt(k.inicial)}</small></div></div>`).join("")}</div>`}
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
  const k = id ? STATE.cuentas.find(x=>x.id===id) : {id:uid(), nombre:"", tipo:"Banco", moneda:"USD", inicial:0, ambito:"negocio"};
  openModal({ title:id?`<i>›</i> ${esc(k.nombre)}`:"Nueva <i>cuenta</i>", del:!!id, body:`
    <div class="f2"><div class="f"><label>Nombre</label><input id="k-nombre" value="${esc(k.nombre)}" placeholder="Ej: BAC, Wise, Efectivo, USDT" /></div><div class="f"><label>Tipo</label><select id="k-tipo">${["Banco","Efectivo","Wise / Payoneer","Cripto","Tarjeta de crédito","Otro"].map(t=>`<option ${k.tipo===t?"selected":""}>${t}</option>`).join("")}</select></div></div>
    <div class="f2"><div class="f"><label>Saldo inicial (USD)</label><input id="k-ini" class="mono" type="number" step="0.01" value="${k.inicial||0}" /><div class="mini">el saldo actual = inicial + movimientos</div></div><div class="f"><label>Moneda</label><select id="k-mon">${["USD","CRC","EUR","USDT"].map(m=>`<option ${k.moneda===m?"selected":""}>${m}</option>`).join("")}</select></div></div>
    <div class="f hidden"><label>Ámbito</label><div class="pick" id="k-amb"><button type="button" data-v="negocio" class="on red">Negocio</button></div></div>`,
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
  if(sb){ await sb.from("pg_movimientos").delete().neq("id","00000000-0000-0000-0000-000000000000"); if(MOVS.length) await sb.from("pg_movimientos").insert(MOVS); for(const k of ["config","cuentas","clientes","cobros","recurrentes"]) await saveState(k); } else saveLocal();
  toast("Importado"); render(); }catch(e){ toast("JSON inválido"); } }; r.readAsText(f); }
async function resetAll(){ if(!confirm("¿Borrar TODO (movimientos, cuentas, clientes, recurrentes)? No se puede deshacer.")) return; if(!confirm("Última: ¿seguro?")) return;
  MOVS=[]; STATE=defaultState(); if(sb){ await sb.from("pg_movimientos").delete().neq("id","00000000-0000-0000-0000-000000000000"); for(const k of ["config","cuentas","clientes","cobros","recurrentes"]) await saveState(k); } else { localStorage.removeItem(STORE_KEY); } toast("Base en cero"); render(); }

/* ============================================================
   MOVIMIENTO · modal + captura rápida
   ============================================================ */
function openMov(id, preset={}){
  const m = id ? Object.assign({}, MOVS.find(x=>x.id===id)) : Object.assign({fecha:todayStr(), ambito:"negocio", tipo:"gasto", monto:"", moneda:STATE.config.moneda||"USD", cuenta:"", cuenta_destino:"", categoria:"", concepto:"", cliente:"", notas:""}, preset);
  const cats=()=> (m.tipo==="ingreso"?STATE.config.categorias.ingreso:STATE.config.categorias.gasto);
  const body=`
    <div class="f"><label>Tipo</label><div class="pick" id="m-tipo"><button type="button" data-v="gasto" class="${m.tipo==="gasto"?"on red":""}">− Gasto</button><button type="button" data-v="ingreso" class="${m.tipo==="ingreso"?"on":""}">+ Ingreso</button><button type="button" data-v="transfer" class="${m.tipo==="transfer"?"on ember":""}">⇄ Transferencia</button></div></div>
    <div class="f3"><div class="f"><label>Monto</label><input id="m-monto" class="mono" type="number" step="0.01" value="${m.monto}" autofocus /></div><div class="f"><label>Moneda</label><select id="m-mon">${["USD","CRC","EUR","USDT"].map(x=>`<option ${m.moneda===x?"selected":""}>${x}</option>`).join("")}</select></div><div class="f"><label>Fecha</label><input id="m-fecha" type="date" value="${esc(m.fecha)}" /></div></div>
    <div class="f"><label>Concepto</label><input id="m-conc" value="${esc(m.concepto)}" placeholder="¿Qué fue?" /></div>
    <div class="f2"><div class="f hidden"><label>Ámbito</label><div class="pick" id="m-amb"><button type="button" data-v="negocio" class="on red">Negocio</button></div></div>
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
      if(preset._cuota){ const c=STATE.clientes.find(x=>x.id===preset._cuota.cid); const q=c&&(c.cuotas||[]).find(x=>x.id===preset._cuota.qid); if(q){ q.pagada=true; q.pagadaEl=patch.fecha; q.movId=(MOVS[0]||{}).id||""; if(!q.medio) q.medio=patch.cuenta||""; await saveState("clientes"); setTimeout(()=>openComprobante(c.id,q.id),250); } }
      if(preset._cobro){ const cb=STATE.cobros.find(x=>x.id===preset._cobro); if(cb){ cb.pagado=true; cb.movId=(MOVS[0]||{}).id||""; await saveState("cobros"); } }
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
  out.ambito="negocio";
  // normalizar categoría y cuenta contra catálogos (case-insensitive, prefijo)
  const cats=out.tipo==="ingreso"?STATE.config.categorias.ingreso:STATE.config.categorias.gasto;
  if(out.categoria){ const c=cats.find(x=>x.toLowerCase()===out.categoria.toLowerCase())||cats.find(x=>x.toLowerCase().startsWith(out.categoria.toLowerCase())); out.categoria=c||out.categoria; }
  if(out.cuenta){ const k=STATE.cuentas.find(x=>x.nombre.toLowerCase()===out.cuenta.toLowerCase())||STATE.cuentas.find(x=>x.nombre.toLowerCase().startsWith(out.cuenta.toLowerCase())); out.cuenta=k?k.nombre:out.cuenta; }
  out.concepto=out.words.join(" ");
  // cliente: si el concepto empieza con el nombre de un cliente y es ingreso
  out.cliente=""; if(out.tipo==="ingreso"){ const cl=STATE.clientes.find(c=>out.concepto.toLowerCase().startsWith(c.nombre.toLowerCase())); if(cl){ out.cliente=cl.nombre; out.ambito="negocio"; if(!out.categoria) out.categoria=CAT_TIPO[cl.tipo]||"Ventas"; } }
  return out;
}
function capturePreview(){
  const p=parseCapture($("#cap").value); const el=$("#cap-preview");
  if(!p){ el.classList.add("hidden"); return; }
  el.classList.remove("hidden");
  el.innerHTML=`<span class="amt ${p.tipo==="gasto"?"bad":"ember"}">${p.tipo==="gasto"?"−":"+"}${fmt(p.monto)}</span><b>${esc(p.concepto||"(sin concepto)")}</b>${p.categoria?`<span class="tag">#${esc(p.categoria)}</span>`:`<span class="tag warn">sin categoría</span>`}${p.cuenta?`<span class="tag">@${esc(p.cuenta)}</span>`:`<span class="tag warn">sin cuenta</span>`}${p.cliente?`<span class="tag ember">${esc(p.cliente)}</span>`:""}<span class="tag">${esc(p.fecha)}</span><kbd>Enter</kbd>`;
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
  STATE.cuentas=[{id:uid(),nombre:"BAC",tipo:"Banco",moneda:"USD",inicial:1800,ambito:"negocio",demo:true},{id:uid(),nombre:"Wise",tipo:"Wise / Payoneer",moneda:"USD",inicial:4200,ambito:"negocio",demo:true},{id:uid(),nombre:"Efectivo",tipo:"Efectivo",moneda:"USD",inicial:900,ambito:"negocio",demo:true},{id:uid(),nombre:"USDT",tipo:"Cripto",moneda:"USDT",inicial:2500,ambito:"negocio",demo:true}];
  STATE.clientes=[
    {id:"demo-a",nombre:"Cliente A",servicio:"Growth partner · webinar",tipo:"growth",pct:25,total:0,estado:"activo",cuenta:"Wise",notas:"",demo:true,cuotas:[]},
    {id:"demo-b",nombre:"Cliente B",servicio:"Closing · oferta high ticket",tipo:"closing",pct:10,total:0,estado:"activo",cuenta:"Wise",notas:"",demo:true,cuotas:[]},
    {id:"demo-c",nombre:"Cliente C",servicio:"Consultoría 1-1",tipo:"consultoria",pct:100,total:3000,estado:"activo",cuenta:"USDT",notas:"",demo:true,telefono:"+506 8888 8888",email:"clientec@gmail.com",tipoCuota:"50/50",medio:"USDT",cuotas:[{id:uid(),label:"50% inicio",monto:1500,fecha:D(addMonths(m0,-1),10),pagada:true,pagadaEl:D(addMonths(m0,-1),10),medio:"USDT",comprobante:""},{id:uid(),label:"50% entrega",monto:1500,fecha:D(addMonths(m0,1),3),pagada:false,medio:"",comprobante:""}]},
    {id:"demo-d",nombre:"Cliente D",servicio:"Growth partner (cerrado)",tipo:"growth",pct:27.5,total:0,estado:"cerrado",cuenta:"Wise",notas:"",demo:true,cuotas:[]}
  ];
  STATE.cobros=[];
  STATE.recurrentes=[{id:uid(),nombre:"Oficina / coworking",monto:650,dia:1,cuenta:"BAC",ambito:"negocio",categoria:"Servicios",activo:true,demo:true},{id:uid(),nombre:"Notion + Canva",monto:45,dia:3,cuenta:"BAC",ambito:"negocio",categoria:"Suscripciones",activo:true,demo:true},{id:uid(),nombre:"Claude + ChatGPT",monto:40,dia:8,cuenta:"Wise",ambito:"negocio",categoria:"Herramientas",activo:true,demo:true},{id:uid(),nombre:"GoHighLevel",monto:97,dia:12,cuenta:"Wise",ambito:"negocio",categoria:"Herramientas",activo:true,demo:true},{id:uid(),nombre:"Editor (freelance)",monto:400,dia:15,cuenta:"USDT",ambito:"negocio",categoria:"Salarios",activo:true,demo:true}];
  const movs=[]; const push=(ym,d,o)=>movs.push(Object.assign({id:uid(),fecha:D(ym,d),moneda:"USD",cuenta:"",cuenta_destino:"",categoria:"",concepto:"",cliente:"",notas:"",demo:true,created_at:new Date().toISOString()},o));
  // cash collected de clientes (bruto) → mi parte = bruto × %
  const cc={5:[["demo-d",11600,"Lanzamiento 1"]],4:[["demo-d",16400,"Lanzamiento 2"]],3:[["demo-d",15600,"Lanzamiento 3"]],2:[["demo-a",10000,"Webinar sept"]],1:[["demo-a",10000,"Webinar oct"],["demo-b",20000,"Cierres del mes"]],0:[["demo-a",7200,"Cierres semana 1",false]]};
  for(let i=5;i>=0;i--){ const ym=addMonths(m0,-i);
    (cc[i]||[]).forEach(v=>{ const k=STATE.clientes.find(x=>x.id===v[0]); const pct=k.pct, mio=Math.round(v[1]*pct)/100, pagado=v[3]!==false; let movId="";
      if(pagado){ const idm=uid(); movId=idm; movs.push({id:idm,fecha:D(ym,5),moneda:"USD",ambito:"negocio",tipo:"ingreso",monto:mio,cuenta:"Wise",cuenta_destino:"",categoria:CAT_TIPO[k.tipo],concepto:`${k.nombre} · ${pct}% de ${fmt(v[1])} · ${v[2]}`,cliente:k.nombre,notas:"",demo:true,created_at:new Date().toISOString()}); }
      STATE.cobros.push({id:uid(),fecha:D(ym,5),clienteId:k.id,bruto:v[1],pct,mio,concepto:v[2],pagado,movId,demo:true}); });
    if(i%2===0) push(ym,1,{ambito:"negocio",tipo:"ingreso",monto:900+i*150,cuenta:"USDT",categoria:"Comisión",concepto:"Comisión referido"});
    if(i===1) push(ym,22,{ambito:"negocio",tipo:"ingreso",monto:1200,cuenta:"USDT",categoria:"Comisión",concepto:"Comisión afiliado"});
    if(i===1) push(ym,10,{ambito:"negocio",tipo:"ingreso",monto:1500,cuenta:"USDT",categoria:"Consultoría",concepto:"Cliente C · 50% inicio",cliente:"Cliente C"});
    push(ym,1,{ambito:"negocio",tipo:"gasto",monto:650,cuenta:"BAC",categoria:"Servicios",concepto:"Oficina / coworking"});
    push(ym,3,{ambito:"negocio",tipo:"gasto",monto:45,cuenta:"BAC",categoria:"Suscripciones",concepto:"Notion + Canva"});
    push(ym,8,{ambito:"negocio",tipo:"gasto",monto:40,cuenta:"Wise",categoria:"Herramientas",concepto:"Claude + ChatGPT"});
    push(ym,12,{ambito:"negocio",tipo:"gasto",monto:97,cuenta:"Wise",categoria:"Herramientas",concepto:"GoHighLevel"});
    push(ym,15,{ambito:"negocio",tipo:"gasto",monto:400,cuenta:"USDT",categoria:"Salarios",concepto:"Editor (freelance)"});
    push(ym,10,{ambito:"negocio",tipo:"gasto",monto:300+i*80,cuenta:"Wise",categoria:"Ads",concepto:"Meta Ads"});
    push(ym,6,{ambito:"negocio",tipo:"gasto",monto:220+i*15,cuenta:"BAC",categoria:"Educación",concepto:"Cursos / mentoría"});
    push(ym,14,{ambito:"negocio",tipo:"gasto",monto:80,cuenta:"Efectivo",categoria:"Transporte",concepto:"Uber reuniones"});
    push(ym,22,{ambito:"negocio",tipo:"gasto",monto:120+(i%3)*60,cuenta:"BAC",categoria:"Viajes",concepto:"Cenas con clientes"});
    if(i<4) push(ym,25,{ambito:"negocio",tipo:"gasto",monto:500,cuenta:"USDT",categoria:"Inversión",concepto:"Reserva / inversión"});
    if(i===3) push(ym,27,{ambito:"negocio",tipo:"gasto",monto:1100,cuenta:"BAC",categoria:"Viajes",concepto:"Vuelo Dubái · evento"});
    push(ym,28,{ambito:"negocio",tipo:"transfer",monto:1500,cuenta:"Wise",cuenta_destino:"BAC",concepto:"Retiro de socio"});
  }
  movs.forEach(m=>{ if(m.fecha>hoy) m.fecha=hoy; });
  MOVS=movs.concat(MOVS);
  if(sb){ await sb.from("pg_movimientos").insert(movs); for(const k of ["cuentas","clientes","cobros","recurrentes"]) await saveState(k); } else saveLocal();
  toast("Datos de ejemplo cargados"); render();
}
async function clearDemo(){
  MOVS=MOVS.filter(m=>!m.demo); ["cuentas","clientes","cobros","recurrentes"].forEach(k=>STATE[k]=(STATE[k]||[]).filter(x=>!x.demo));
  if(sb){ await sb.from("pg_movimientos").delete().eq("demo",true); for(const k of ["cuentas","clientes","cobros","recurrentes"]) await saveState(k); } else saveLocal();
  await seedClientesReales();
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
  const cap=$("#cap");
  if(cap){ cap.addEventListener("input",capturePreview); cap.addEventListener("keydown",e=>{ if(e.key==="Enter"){e.preventDefault();captureSubmit();} if(e.key==="Escape"){cap.value="";capturePreview();cap.blur();} });
    cap.addEventListener("blur",()=>setTimeout(()=>{ if(document.activeElement!==cap) $("#cap-preview").classList.add("hidden"); },150)); cap.addEventListener("focus",capturePreview);
    $("#cap-form").onclick=()=>{ const p=parseCapture(cap.value); openMov(null, p?{tipo:p.tipo,monto:p.monto,categoria:p.categoria,cuenta:p.cuenta,concepto:p.concepto,ambito:p.ambito,fecha:p.fecha,cliente:p.cliente}:{}); }; }
  document.addEventListener("keydown",e=>{ if(e.key==="/" && cap && !["INPUT","TEXTAREA","SELECT"].includes(document.activeElement.tagName)){ e.preventDefault(); cap.focus(); } if(e.key==="Escape" && $("#modal-bg").classList.contains("open")) closeModal(); });
  let rt, lastW=0; const redraw=()=>{ clearTimeout(rt); rt=setTimeout(()=>{ const w=$("#skyline-wrap"); if(VIEW==="mando" && w && w.clientWidth!==lastW){ lastW=w.clientWidth; drawSkyline(); } },120); };
  window.addEventListener("resize",redraw);
  if(window.ResizeObserver) new ResizeObserver(redraw).observe(document.querySelector(".shell"));
  if(sb){ setDb(false); await loadCloud(); subscribeCloud(); } else { loadLocal(); setDb(false); }
  if(!STATE.cobros) STATE.cobros=[];
  if(Number(STATE.config.objetivoNegocio)===10000 && !STATE.config.obj30){ STATE.config.objetivoNegocio=30000; STATE.config.obj30=true; await saveState("config"); }
  await seedClientesReales();
  render();
  syncAllExt();
});

/* ============================================================
   CRM VINCULADOS (Supabase de cada cliente growth)
   ============================================================ */
async function fetchExt(link){
  try{
    if(!link||!link.url||!link.key) return {error:"faltan URL o key"};
    if(!window.supabase) return {error:"supabase-js no cargó"};
    const c=window.supabase.createClient(link.url, link.key);
    const tabla=link.tabla||"pagos", cm=link.campoMonto||"usd", cf=link.campoFecha||"fecha";
    let q=c.from(tabla).select("*").order(cf,{ascending:false}).limit(2000);
    if(link.desde) q=q.gte(cf, link.desde);
    const {data,error}=await q; if(error) return {error:error.message};
    const rows=(data||[]).map(r=>({fecha:String(r[cf]||"").slice(0,10), monto:Number(r[cm])||0, concepto:[r.producto,r.cliente,r.concepto].filter(Boolean).join(" · "), metodo:r.metodo||"", closer:r.closer||""})).filter(r=>r.monto>0);
    return {rows, sb:c};
  }catch(e){ return {error:String(e.message||e)}; }
}
async function syncExt(cl){
  if(!cl.link||!cl.link.url) { delete EXT[cl.id]; return; }
  const res=await fetchExt(cl.link);
  if(res.error){ EXT[cl.id]={rows:(EXT[cl.id]||{}).rows||[], error:res.error, at:Date.now()}; }
  else{
    const prev=EXT[cl.id]||{};
    EXT[cl.id]={rows:res.rows, at:Date.now(), error:null, sb:res.sb, ch:prev.ch};
    if(!prev.ch){ try{ EXT[cl.id].ch=res.sb.channel("primal-ext-"+cl.id).on("postgres_changes",{event:"*",schema:"public",table:cl.link.tabla||"pagos"}, async()=>{ await syncExt(cl); render(); toast(`${cl.nombre}: CRM actualizado`); }).subscribe(); }catch(e){} }
  }
  if(["mando","growth","total"].includes(VIEW)) render();
}
async function syncAllExt(){ for(const cl of STATE.clientes){ if(cl.link&&cl.link.url) await syncExt(cl); } }
function extBadge(cl){
  if(!cl.link||!cl.link.url) return `<span class="tag">sin CRM vinculado</span>`;
  const e=EXT[cl.id]; if(!e) return `<span class="tag warn">conectando…</span>`;
  if(e.error) return `<span class="tag warn" title="${esc(e.error)}">CRM sin conexión</span>`;
  return `<span class="tag ok">● CRM en vivo · ${e.rows.length} pagos</span>`;
}
async function cobrarSaldo(id){
  const cl=STATE.clientes.find(x=>x.id===id); if(!cl) return;
  openMov(null,{tipo:"ingreso", ambito:"negocio", monto:Math.round(clientePendiente(cl)*100)/100, cliente:cl.nombre, categoria:CAT_TIPO[cl.tipo]||"Ventas", cuenta:cl.cuenta||"", concepto:`${cl.nombre} · ${pctCliente(cl)}% · liquidación`});
}

/* ============================================================
   VISTA · GROWTH (growth partner + closing)
   ============================================================ */
function clientCard(c){
  const b=clienteBruto(c), d=clienteDevengado(c), k=clienteCobrado(c), pz=Math.max(0,d-k); const pct=d?Math.min(100,k/d*100):0;
  const mes=clienteDevengado(c,MONTH);
  return `<div class="client" onclick="openClienteDetalle('${c.id}')">
    <div class="top"><div><div class="nm">${esc(c.nombre)}</div><div class="sv">${esc(c.servicio||TIPOS_CLIENTE[c.tipo]||"")}</div></div><span class="tag ${c.estado==="activo"?"ember":c.estado==="cerrado"?"":"warn"}">${pctCliente(c)}%${c.estado!=="activo"?" · "+esc(c.estado):""}</span></div>
    <div class="nums"><div><div class="l">Cash collected</div><div class="v">${fmt(b)}</div></div><div><div class="l">Mi parte</div><div class="v ember">${fmt(d)}</div></div><div><div class="l">${pz>0.5?"Pendiente":"Cobrado"}</div><div class="v ${pz>0.5?"bad":"dim"}">${fmt(pz>0.5?pz:k)}</div></div></div>
    <div class="prog"><i class="${pct>=99.5?"full":""}" style="width:${pct}%"></i></div>
    <div class="next"><span>${monthLabel(MONTH).split(" ")[0]}: <b>${fmt(mes)}</b></span><b>${pct.toFixed(0)}% cobrado</b></div>
    <div style="display:flex;gap:6px;align-items:center;justify-content:space-between;margin-top:12px;flex-wrap:wrap">${extBadge(c)}<button class="btn xs ${c.link&&c.link.url?"ghost":"gold"}" onclick="event.stopPropagation();openLink('${c.id}')">${c.link&&c.link.url?"Editar vínculo":"Vincular CRM"}</button></div></div>`;
}
function renderGrowth(){
  const el=$("#view-growth"); const cls=STATE.clientes.filter(c=>c.tipo!=="consultoria");
  const bruto=cls.reduce((a,c)=>a+clienteBruto(c),0), dev=cls.reduce((a,c)=>a+clienteDevengado(c),0), cob=cls.reduce((a,c)=>a+clienteCobrado(c),0);
  const pend=cls.reduce((a,c)=>a+Math.max(0,clienteDevengado(c)-clienteCobrado(c)),0);
  const grupo=(t)=>{ const g=cls.filter(c=>(c.tipo||"growth")===t); if(!g.length) return ""; return `<section class="panel flat" style="padding:0;border:0;margin-top:18px"><h3>${TIPOS_CLIENTE[t]} <span class="sub">${g.length} ${g.length===1?"cliente":"clientes"} · ${fmt(g.reduce((a,c)=>a+clienteDevengado(c),0))} devengado</span></h3><div class="clients">${g.map(clientCard).join("")}</div></section>`; };
  const linked=cls.filter(c=>c.link&&c.link.url);
  el.innerHTML=`
  <div class="burn" style="margin-top:18px">
    <div class="subkpi"><div class="l">Cash collected clientes</div><div class="v">${fmt(bruto)}</div><div class="s">${cls.length} clientes · ${linked.length} CRM en vivo</div></div>
    <div class="subkpi"><div class="l">Mi parte devengada</div><div class="v ember">${fmt(dev)}</div><div class="s">${bruto?((dev/bruto)*100).toFixed(1):0}% efectivo</div></div>
    <div class="subkpi"><div class="l">Cobrado</div><div class="v">${fmt(cob)}</div><div class="s">${dev?((cob/dev)*100).toFixed(0):0}% de lo devengado</div></div>
    <div class="subkpi"><div class="l">Por cobrar</div><div class="v ${pend>0.5?"bad":""}">${fmt(pend)}</div><div class="s">saldo a tu favor</div></div>
    <div class="subkpi" style="display:flex;align-items:center;justify-content:center;gap:8px;flex-wrap:wrap"><button class="btn gold sm" onclick="openCobro()">+ Cash collected</button><button class="btn sm" onclick="openCliente()">+ Cliente</button><button class="btn sm ghost" onclick="syncAllExt();toast('Sincronizando CRMs…')">↻ Sync</button></div>
  </div>
  <div class="mini" style="margin:-6px 0 10px;letter-spacing:.08em;text-transform:none;font-size:12px;color:var(--muted)">Cada cliente tiene un botón <b>Vincular CRM</b>: pegás la URL y la anon key del Supabase del CRM que le hicimos y su cash collected entra acá solo, con tu % calculado. Mientras no esté vinculado, cargalo con "+ Cash collected".</div>
  ${!cls.length?`<div class="empty"><div class="g">SIN CLIENTES GROWTH</div>Cada cliente lleva su % y, si vinculás su CRM, el cash collected entra solo.</div>`:""}
  ${grupo("growth")}${grupo("closing")}
  <section class="grid g-2">
    <div class="panel"><h3>Pendiente de cobro <span class="sub">tu parte que aún no entró</span></h3>
      ${(()=>{ const rows=cls.filter(c=>Math.max(0,clienteDevengado(c)-clienteCobrado(c))>0.5); return !rows.length?`<div class="empty" style="padding:14px">Nada pendiente.</div>`:`<div class="list">${rows.map(c=>`<div class="row click" onclick="cobrarSaldo('${c.id}')"><div class="a"><b>${esc(c.nombre)} · ${pctCliente(c)}%</b><small>devengado ${fmt(clienteDevengado(c))} · cobrado ${fmt(clienteCobrado(c))}</small></div><div class="b">${fmt(clienteDevengado(c)-clienteCobrado(c))}<small>cobrar →</small></div></div>`).join("")}</div>`; })()}
    </div>
    <div class="panel"><h3>Cash collected reciente <span class="sub">manual + CRMs vinculados</span></h3>
      ${(()=>{ const items=[]; cls.forEach(c=>{ cobrosDe(c).forEach(x=>items.push({fecha:x.fecha,cl:c,bruto:x.bruto,mio:x.mio,txt:x.concepto||"manual",src:"manual",id:x.id})); const e=EXT[c.id]; if(e&&e.rows) e.rows.forEach(r=>items.push({fecha:r.fecha,cl:c,bruto:r.monto,mio:r.monto*pctCliente(c)/100,txt:r.concepto||"pago",src:"crm"})); });
        items.sort((a,b)=>(b.fecha||"").localeCompare(a.fecha||"")); return !items.length?`<div class="empty" style="padding:14px">Todavía no hay cash collected.</div>`:`<div class="list">${items.slice(0,14).map(x=>`<div class="row ${x.src==="manual"?"click":""}" ${x.src==="manual"?`onclick="openCobro(null,'${x.id}')"`:""}><div class="a"><b>${esc(x.cl.nombre)} · ${fmt(x.bruto)}</b><small>${esc(x.fecha)} · ${esc(clipTxt(x.txt,48))} · <span class="${x.src==="crm"?"ok":"dim"}">${x.src==="crm"?"CRM":"manual"}</span></small></div><div class="b ember">${fmt(x.mio)}<small>${pctCliente(x.cl)}%</small></div></div>`).join("")}</div>`; })()}
    </div>
  </section>`;
}

/* ============================================================
   VISTA · CONSULTORÍA (100% mío, formato tabla)
   ============================================================ */
function proximaCuota(c){ return (c.cuotas||[]).filter(q=>!q.pagada).sort((a,b)=>(a.fecha||"9999").localeCompare(b.fecha||"9999"))[0]; }
function renderConsultoria(){
  const el=$("#view-consultoria"); const cls=STATE.clientes.filter(c=>c.tipo==="consultoria").sort((a,b)=>(a.estado==="cerrado")-(b.estado==="cerrado"));
  const cob=cls.reduce((a,c)=>a+clienteCobrado(c),0), tot=cls.reduce((a,c)=>a+(Number(c.total)||0),0);
  const pend=cls.reduce((a,c)=>a+(c.cuotas||[]).filter(q=>!q.pagada).reduce((x,q)=>x+(Number(q.monto)||0),0),0);
  const hoy=todayStr();
  el.innerHTML=`
  <div class="burn" style="margin-top:18px">
    <div class="subkpi"><div class="l">Cash collected</div><div class="v ember">${fmt(cob)}</div><div class="s">100% tuyo · ${cls.length} clientes</div></div>
    <div class="subkpi"><div class="l">Revenue</div><div class="v">${fmt(tot)}</div><div class="s">${tot?((cob/tot)*100).toFixed(0):0}% en caja de Primal</div></div>
    <div class="subkpi"><div class="l">Cuotas por cobrar</div><div class="v ${pend>0?"bad":""}">${fmt(pend)}</div><div class="s">${cls.reduce((a,c)=>a+(c.cuotas||[]).filter(q=>!q.pagada).length,0)} cuotas</div></div>
    <div class="subkpi"><div class="l">${monthLabel(MONTH)}</div><div class="v">${fmt(cls.reduce((a,c)=>a+MOVS.filter(m=>m.tipo==="ingreso"&&m.cliente===c.nombre&&ymOf(m.fecha)===MONTH).reduce((x,m)=>x+toUSD(m),0),0))}</div><div class="s">cobrado este mes</div></div>
    <div class="subkpi" style="display:flex;align-items:center;justify-content:center"><button class="btn gold sm" onclick="openCliente(null,'consultoria')">+ Cliente consultoría</button></div>
  </div>
  <div class="panel" style="overflow-x:auto">
    <h3>Clientes de consultoría <span class="sub">clic en la fila para ver, editar o cobrar</span></h3>
    ${!cls.length?`<div class="empty"><div class="g">SIN CLIENTES</div>Nombre, contacto, email, cash collected, tipo de cuota, fecha de cuota, medio de pago y comprobante.</div>`:`
    <table class="tbl"><thead><tr><th>Cliente</th><th>Contacto</th><th>Email</th><th class="num">Revenue</th><th class="num">Cash collected</th><th>Tipo de cuota</th><th>Próxima cuota</th><th>Medio</th><th>Comprobante</th><th>Estado</th></tr></thead><tbody>
    ${cls.map(c=>{ const nq=proximaCuota(c); const last=(c.cuotas||[]).filter(q=>q.pagada).sort((a,b)=>(b.pagadaEl||b.fecha||"").localeCompare(a.pagadaEl||a.fecha||""))[0];
      return `<tr onclick="openClienteDetalle('${c.id}')"><td><b>${esc(c.nombre)}</b><br><small class="dim">${esc(c.servicio||"")}</small></td><td>${c.telefono?`<a href="https://wa.me/${esc(String(c.telefono).replace(/[^0-9]/g,""))}" target="_blank" onclick="event.stopPropagation()">${esc(c.telefono)}</a>`:"—"}</td><td>${c.email?`<a href="mailto:${esc(c.email)}" onclick="event.stopPropagation()">${esc(c.email)}</a>`:"—"}</td><td class="num">${fmt(c.total||0)}</td><td class="num ember">${fmt(clienteCobrado(c))}</td><td>${esc(c.tipoCuota||"—")}</td><td>${nq?`<span class="${nq.fecha&&nq.fecha<hoy?"bad":""}">${esc(nq.fecha||"s/f")}</span> · ${fmt(nq.monto)}`:"<span class='dim'>al día</span>"}</td><td>${esc(c.medio||(last&&last.medio)||"—")}</td><td>${last&&last.comprobante?`<a href="${esc(last.comprobante)}" target="_blank" onclick="event.stopPropagation()">ver</a>`:"<span class='dim'>—</span>"}</td><td><span class="tag ${c.estado==="activo"?"ok":c.estado==="cerrado"?"":"warn"}">${esc(c.estado||"activo")}</span></td></tr>`; }).join("")}
    </tbody></table>`}
  </div>`;
}

/* ============================================================
   VISTA · CUOTAS (todas las cuotas de todos los clientes)
   ============================================================ */
let CUOTAS_F="pendientes";
function renderCuotas(){
  const el=$("#view-cuotas"); const hoy=todayStr();
  const all=[]; STATE.clientes.forEach(c=>(c.cuotas||[]).forEach(q=>all.push({c,q})));
  const list=all.filter(({q})=>CUOTAS_F==="todas"?true:CUOTAS_F==="pagadas"?q.pagada:!q.pagada).sort((a,b)=>((a.q.fecha||"9999")+"").localeCompare((b.q.fecha||"9999")+""));
  const pend=all.filter(x=>!x.q.pagada), venc=pend.filter(x=>x.q.fecha&&x.q.fecha<hoy);
  const sum=l=>l.reduce((a,x)=>a+(Number(x.q.monto)||0),0);
  el.innerHTML=`
  <div class="burn" style="margin-top:18px">
    <div class="subkpi"><div class="l">Por cobrar</div><div class="v ${pend.length?"bad":""}">${fmt(sum(pend))}</div><div class="s">${pend.length} cuotas</div></div>
    <div class="subkpi"><div class="l">Vencidas</div><div class="v ${venc.length?"bad":"dim"}">${fmt(sum(venc))}</div><div class="s">${venc.length} cuotas</div></div>
    <div class="subkpi"><div class="l">Próximos 30 días</div><div class="v">${fmt(sum(pend.filter(x=>x.q.fecha&&x.q.fecha>=hoy&&x.q.fecha<=addDays(hoy,30))))}</div></div>
    <div class="subkpi"><div class="l">Cobradas (cash collected)</div><div class="v ember">${fmt(sum(all.filter(x=>x.q.pagada&&!x.q.previo)))}</div><div class="s">${all.filter(x=>x.q.pagada&&!x.q.previo).length} cuotas${all.some(x=>x.q.previo)?` · ${fmt(sum(all.filter(x=>x.q.previo)))} previas a Primal`:""}</div></div>
  </div>
  <div class="filters"><div class="seg">${["pendientes","pagadas","todas"].map(f=>`<button data-cf="${f}" class="${CUOTAS_F===f?"active":""}">${f}</button>`).join("")}</div><span class="spacer"></span><span class="mini">las cuotas se crean dentro de cada cliente</span></div>
  <div class="panel" style="overflow-x:auto">
    ${!list.length?`<div class="empty" style="padding:20px">Nada por acá.</div>`:`<table class="tbl"><thead><tr><th>Fecha</th><th>Cliente</th><th>Cuota</th><th class="num">Monto</th><th>Medio</th><th>Comprobante</th><th>Estado</th><th></th></tr></thead><tbody>
    ${list.map(({c,q})=>`<tr onclick="openComprobante('${c.id}','${q.id}')"><td class="mono">${esc(q.fecha||"—")}${q.pagada&&q.pagadaEl?`<br><small class="dim">pagada ${esc(q.pagadaEl)}</small>`:""}</td><td><b>${esc(c.nombre)}</b><br><small class="dim">${TIPOS_CLIENTE[c.tipo]||""}</small></td><td>${esc(q.label||"")}</td><td class="num">${fmt(q.monto)}</td><td>${esc(q.medio||c.medio||"—")}</td><td>${q.comprobante?`<a href="${esc(q.comprobante)}" target="_blank" onclick="event.stopPropagation()">ver</a>`:"<span class='dim'>—</span>"}</td><td>${q.previo?`<span class="tag" title="cobrada antes de que Primal llevara caja">previa</span>`:q.pagada?`<span class="tag ok">pagada</span>`:q.fecha&&q.fecha<hoy?`<span class="tag warn">vencida</span>`:`<span class="tag">pendiente</span>`}</td><td>${q.pagada?"":`<button class="btn xs gold" onclick="event.stopPropagation();cobrarCuota('${c.id}','${q.id}')">cobrar</button>`}</td></tr>`).join("")}
    </tbody></table>`}
  </div>`;
  $$("[data-cf]",el).forEach(b=>b.onclick=()=>{CUOTAS_F=b.dataset.cf;render();});
}
function addDays(d,n){ const [y,m,dd]=d.split("-").map(Number); const t=new Date(y,m-1,dd+n); return `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,"0")}-${String(t.getDate()).padStart(2,"0")}`; }
function openComprobante(cid,qid){
  const c=STATE.clientes.find(x=>x.id===cid); const q=c&&(c.cuotas||[]).find(x=>x.id===qid); if(!q) return;
  openModal({ title:`<i>›</i> ${esc(c.nombre)} · ${esc(q.label||"cuota")}`, body:`
    <div class="f3"><div class="f"><label>Monto</label><input id="q-monto" class="mono" type="number" step="0.01" value="${q.monto||""}" /></div><div class="f"><label>Fecha de cuota</label><input id="q-fecha" type="date" value="${esc(q.fecha||"")}" /></div><div class="f"><label>Estado</label><div class="pick" id="q-pag"><button type="button" data-v="0" class="${!q.pagada?"on":""}">Pendiente</button><button type="button" data-v="1" class="${q.pagada?"on ember":""}">Pagada</button></div></div></div>
    <div class="f"><label>Cobrada antes de Primal <span class="sub" style="text-transform:none;letter-spacing:0;color:var(--dim)">· cuenta como revenue, no como cash collected</span></label><div class="pick" id="q-prev"><button type="button" data-v="0" class="${!q.previo?"on":""}">No</button><button type="button" data-v="1" class="${q.previo?"on":""}">Sí, previa</button></div></div>
    <div class="f2"><div class="f"><label>Medio de pago</label><select id="q-medio">${MEDIOS.map(t=>`<option ${(q.medio||c.medio||"")===t?"selected":""}>${t||"—"}</option>`).join("")}</select></div><div class="f"><label>Fecha de pago</label><input id="q-pagadaEl" type="date" value="${esc(q.pagadaEl||"")}" /></div></div>
    <div class="f"><label>Comprobante (link)</label><input id="q-comp" value="${esc(q.comprobante&&!q.comprobante.startsWith("data:")?q.comprobante:"")}" placeholder="https://… (Drive, captura, Stripe)" /></div>
    <div class="f"><label>o subir imagen / PDF (máx 1 MB)</label><input id="q-file" type="file" accept="image/*,application/pdf" /><div class="mini" id="q-file-info">${q.comprobante&&q.comprobante.startsWith("data:")?`archivo adjunto · <a href="${q.comprobante}" target="_blank">ver</a>`:""}</div></div>
    ${q.comprobante&&q.comprobante.startsWith("data:image")?`<img src="${q.comprobante}" style="max-width:100%;border-radius:10px;border:1px solid var(--line)" />`:""}
    <div class="mini">${q.movId?"Esta cuota ya tiene su ingreso en Movimientos.":"Marcar como pagada sin pasar por \"cobrar\" NO crea el ingreso: usá el botón cobrar para que entre a Movimientos."}</div>`,
    onOpen(){ pickInit("#q-pag"); pickInit("#q-prev"); let fileData=null; $("#q-file").onchange=e=>{ const f=e.target.files[0]; if(!f) return; if(f.size>1024*1024){ toast("Archivo muy pesado (máx 1 MB)"); e.target.value=""; return; } const r=new FileReader(); r.onload=()=>{ fileData=r.result; $("#q-file-info").textContent=`${f.name} listo para guardar`; }; r.readAsDataURL(f); }; MODAL._file=()=>fileData; },
    async onSave(){ q.monto=Number($("#q-monto").value)||0; q.fecha=$("#q-fecha").value; q.pagada=pickVal("#q-pag")==="1"; q.previo=pickVal("#q-prev")==="1"; if(q.previo) q.pagada=true; q.medio=$("#q-medio").value; q.pagadaEl=$("#q-pagadaEl").value||(q.pagada?(q.pagadaEl||todayStr()):""); const f=MODAL._file&&MODAL._file(); const link=$("#q-comp").value.trim(); if(f) q.comprobante=f; else if(link) q.comprobante=link; else if(q.comprobante&&!q.comprobante.startsWith("data:")) q.comprobante="";
      await saveState("clientes"); toast("Cuota guardada"); render(); }
  });
}

/* ============================================================
   VISTA · TOTAL (toda la empresa)
   ============================================================ */
function renderTotalSections(){
  const fuentes=["growth","closing","consultoria"];
  const porFuente=t=>STATE.clientes.filter(c=>(c.tipo||"growth")===t);
  const ingresoFuente=(t,ym)=>porFuente(t).reduce((a,c)=>a+clienteDevengado(c,ym),0);
  const cobradoFuente=(t,ym)=>MOVS.filter(m=>m.tipo==="ingreso"&&m.ambito==="negocio"&&(!ym||ymOf(m.fecha)===ym)&&porFuente(t).some(c=>c.nombre===m.cliente)).reduce((a,m)=>a+toUSD(m),0);
  const otros=ym=>MOVS.filter(m=>m.tipo==="ingreso"&&m.ambito==="negocio"&&(!ym||ymOf(m.fecha)===ym)&&!STATE.clientes.some(c=>c.nombre===m.cliente)).reduce((a,m)=>a+toUSD(m),0);
  const brutoClientes=STATE.clientes.reduce((a,c)=>a+clienteBruto(c),0);
  const devTotal=fuentes.reduce((a,t)=>a+ingresoFuente(t),0);
  const cobTotal=MOVS.filter(m=>m.tipo==="ingreso"&&m.ambito==="negocio").reduce((a,m)=>a+toUSD(m),0);
  const gastosNeg=MOVS.filter(m=>m.tipo==="gasto"&&m.ambito==="negocio").reduce((a,m)=>a+toUSD(m),0);
  const months=[]; for(let i=11;i>=0;i--) months.push(addMonths(MONTH,-i));
  const maxF=Math.max(1,...fuentes.map(t=>ingresoFuente(t)));
  if(!STATE.clientes.length && !MOVS.length) return "";
  return `
  <div class="horizon" style="margin-top:28px"></div>
  <div class="eyebrow" style="margin:18px 0 4px">Toda la empresa · growth + closing + consultoría</div>
  <div class="burn" style="margin-top:12px">
    <div class="subkpi"><div class="l">Cash collected clientes</div><div class="v">${fmt(brutoClientes)}</div><div class="s">lo que facturaron todos</div></div>
    <div class="subkpi"><div class="l">Ingresos Primal devengados</div><div class="v ember">${fmt(devTotal)}</div><div class="s">growth + closing + consultoría</div></div>
    <div class="subkpi"><div class="l">Cobrado real</div><div class="v">${fmt(cobTotal)}</div><div class="s">ingresos del negocio en caja</div></div>
    <div class="subkpi"><div class="l">Gastos negocio</div><div class="v bad">${fmt(gastosNeg)}</div><div class="s">margen ${cobTotal?((1-gastosNeg/cobTotal)*100).toFixed(0):0}%</div></div>
    <div class="subkpi"><div class="l">${monthLabel(MONTH)}</div><div class="v">${fmt(fuentes.reduce((a,t)=>a+ingresoFuente(t,MONTH),0))}</div><div class="s">devengado este mes</div></div>
  </div>
  <section class="grid g-32">
    <div class="panel"><h3>Por fuente <span class="sub">devengado acumulado</span></h3>
      <div class="cascade">${fuentes.map(t=>`<div class="step"><div class="n">${TIPOS_CLIENTE[t]}</div><div class="track"><i class="${t==="consultoria"?"net":"in"}" style="left:0;width:${ingresoFuente(t)/maxF*100}%"></i></div><div class="v">${fmt(ingresoFuente(t))}</div></div>`).join("")}
      <div class="step"><div class="n">Otros ingresos</div><div class="track"><i class="in" style="left:0;width:${Math.min(100,otros()/maxF*100)}%;opacity:.5"></i></div><div class="v">${fmt(otros())}</div></div>
      <div class="step total"><div class="n">Total empresa</div><div class="track"></div><div class="v"><span class="ember">${fmt(devTotal+otros())}</span></div></div></div>
      <div class="mini" style="margin-top:10px">${porFuente("growth").length} growth · ${porFuente("closing").length} closing · ${porFuente("consultoria").length} consultoría</div>
    </div>
    <div class="panel"><h3>Por cliente <span class="sub">devengado · cobrado</span></h3>
      <div class="list">${STATE.clientes.slice().sort((a,b)=>clienteDevengado(b)-clienteDevengado(a)).map(c=>`<div class="row click" onclick="openClienteDetalle('${c.id}')"><div class="a"><b>${esc(c.nombre)}</b><small>${TIPOS_CLIENTE[c.tipo]||""} · ${pctCliente(c)}%</small></div><div class="b">${fmt(clienteDevengado(c))}<small>cobrado ${fmt(clienteCobrado(c))}</small></div></div>`).join("")||`<div class="empty" style="padding:14px">Sin clientes.</div>`}</div>
    </div>
  </section>
  <div class="panel" style="overflow-x:auto;margin-top:18px"><h3>Mes a mes <span class="sub">ingresos devengados por fuente · últimos 12 meses</span></h3>
    <table class="tbl"><thead><tr><th>Mes</th><th class="num">Growth</th><th class="num">Closing</th><th class="num">Consultoría</th><th class="num">Otros</th><th class="num">Total</th><th class="num">Cobrado</th><th class="num">Gastos</th><th class="num">Neto</th></tr></thead><tbody>
    ${months.map(ym=>{ const g=ingresoFuente("growth",ym), cl=ingresoFuente("closing",ym), co=ingresoFuente("consultoria",ym), ot=otros(ym), tot=g+cl+co+ot; const cob=MOVS.filter(m=>m.tipo==="ingreso"&&m.ambito==="negocio"&&ymOf(m.fecha)===ym).reduce((a,m)=>a+toUSD(m),0); const gas=totales(ym,"negocio").gasto;
      return `<tr onclick="MONTH='${ym}';render()" class="${ym===MONTH?"cur":""}"><td class="mono" style="${ym===MONTH?"color:var(--gold-2)":""}">${monthLabel(ym)}</td><td class="num">${g?fmt(g):"—"}</td><td class="num">${cl?fmt(cl):"—"}</td><td class="num">${co?fmt(co):"—"}</td><td class="num">${ot?fmt(ot):"—"}</td><td class="num ember">${tot?fmt(tot):"—"}</td><td class="num">${cob?fmt(cob):"—"}</td><td class="num bad">${gas?"−"+fmt(gas):"—"}</td><td class="num ${cob-gas<0?"bad":""}">${(cob||gas)?fmt(cob-gas):"—"}</td></tr>`; }).join("")}
    </tbody></table>
  </div>`;
}

/* ---------- vincular CRM de un cliente (modal propio) ---------- */
function openLink(id){
  const c=STATE.clientes.find(x=>x.id===id); if(!c) return; const L=c.link||{};
  openModal({ title:`Vincular CRM · <i>${esc(c.nombre)}</i>`, del:!!(L.url), saveLabel:"Guardar y sincronizar", body:`
    <div class="mini" style="text-transform:none;letter-spacing:.04em;font-size:12px;color:var(--muted)">Abrí el <b>index.html</b> del CRM de ${esc(c.nombre)} (o su proyecto en Supabase → Project Settings → API) y copiá las dos constantes <b>SUPABASE_URL</b> y <b>SUPABASE_ANON_KEY</b>. Primal leerá su tabla de pagos y calculará tu ${pctCliente(c)}% solo, en tiempo real.</div>
    <div class="f"><label>SUPABASE_URL del CRM del cliente</label><input id="l-url" class="mono" value="${esc(L.url||"")}" placeholder="https://xxxxxxxx.supabase.co" /></div>
    <div class="f"><label>SUPABASE_ANON_KEY (publishable)</label><input id="l-key" class="mono" value="${esc(L.key||"")}" placeholder="eyJhbGciOi… / sb_publishable_…" /></div>
    <div class="f3"><div class="f"><label>Tabla de pagos</label><input id="l-tabla" class="mono" value="${esc(L.tabla||"pagos")}" /></div><div class="f"><label>Columna monto (USD)</label><input id="l-monto" class="mono" value="${esc(L.campoMonto||"usd")}" /></div><div class="f"><label>Contar desde</label><input id="l-desde" type="date" value="${esc(L.desde||"")}" /><div class="mini">fecha de inicio del contrato</div></div></div>
    <div style="display:flex;gap:10px;align-items:center"><button type="button" class="btn sm" id="l-test">Probar conexión</button><span class="mini" id="l-res" style="text-transform:none;letter-spacing:.04em;font-size:12px"></span></div>`,
    onOpen(){ $("#l-test").onclick=async()=>{ const r=$("#l-res"); r.textContent="probando…"; const res=await fetchExt({url:$("#l-url").value.trim(), key:$("#l-key").value.trim(), tabla:$("#l-tabla").value.trim()||"pagos", campoMonto:$("#l-monto").value.trim()||"usd", campoFecha:"fecha", desde:$("#l-desde").value}); r.innerHTML = res.error ? `<span class="bad">✕ ${esc(res.error)}</span>` : `<span class="ok">✓ ${res.rows.length} pagos · ${fmt(res.rows.reduce((a,x)=>a+x.monto,0))} cash collected · tu parte ${fmt(res.rows.reduce((a,x)=>a+x.monto,0)*pctCliente(c)/100)}</span>`; }; },
    async onSave(){ const url=$("#l-url").value.trim(), key=$("#l-key").value.trim(); if(!url||!key){ toast("Faltan URL o key"); return false; }
      c.link={url, key, tabla:$("#l-tabla").value.trim()||"pagos", campoMonto:$("#l-monto").value.trim()||"usd", campoFecha:"fecha", desde:$("#l-desde").value};
      if(EXT[c.id]&&EXT[c.id].ch){ try{ EXT[c.id].ch.unsubscribe(); }catch(e){} } delete EXT[c.id];
      await saveState("clientes"); toast(`${c.nombre}: CRM vinculado`); render(); syncExt(c); },
    async onDelete(){ if(!confirm("¿Desvincular el CRM? Los pagos dejarán de entrar solos.")) return false; if(EXT[c.id]&&EXT[c.id].ch){ try{ EXT[c.id].ch.unsubscribe(); }catch(e){} } delete EXT[c.id]; c.link=null; await saveState("clientes"); render(); }
  });
}
