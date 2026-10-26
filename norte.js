/* ============================================================
   PRIMAL · NORTE — cuánto tiene que generar cada cliente y cada webinar
   Arriba: la meta de profit de Primal repartida por fuente (lo que te tiene
   que dejar cada cliente ÷ tu % real = cash que tiene que cobrar él).
   Abajo: el panel de negocio de Limitless por webinar (Modelo financiero,
   Closer math y resultado real), con las mismas fórmulas que la planilla.
   ============================================================ */
const N_ESC = {peor:"Peor caso", base:"Base (el plan)", mejor:"Mejor caso"};

// [clave, etiqueta, tipo, cómo se lee]  — tipo: usd · pct · num · sec (título de bloque)
const N_VARS = [
  ["ADQUISICIÓN","","sec"],
  ["ads","Inversión en ads","usd","Se decide, no es un escenario. Solo la pauta del lanzamiento."],
  ["cpl","Lo que cuesta cada registro","usd","Inversión ÷ registros. Bueno: entre 25 % y 40 % del CPM del nicho (CPM 20 → registro de 5 a 8)."],
  ["regOrg","Registros (webinar orgánico)","num","Solo si no hay pauta: los registros que se esperan del alcance propio."],
  ["EL WEBINAR","","sec"],
  ["show","De los registrados, cuántos entran en vivo","pct","El PICO de conectados. Frío en español: 10-15 % normal, 15-22 % bueno, +22 % muy bueno."],
  ["ret","De los que entran, cuántos siguen al pitch","pct","Retención. Debajo de 80 % el problema es el contenido, no la oferta."],
  ["compra","Compran ahí mismo (botón en el webinar)","pct","Solo con compra directa en el vivo. Si no hay, 0. El mercado hace 2-3 %."],
  ["precioDirecto","Lo que se cobra en esa compra directa","usd","Es el precio, no un escenario."],
  ["pide","Del pitch, cuántos piden la llamada","pct","Sobre los que llegan al pitch. 5-10 % normal, 10-15 % bueno, +15 % muy bueno."],
  ["noAsist","De los que NO entraron, cuántos piden después","pct","Trabajo del replay y de los setters sobre la lista."],
  ["LAS VENTAS","","sec"],
  ["showLl","De los que piden, cuántos toman la llamada","pct","Nunca debería bajar de 65 %. Si baja: recordatorios y tiempo hasta la llamada."],
  ["cierre","De los que toman la llamada, cuántos compran","pct","15-25 % normal, 25-35 % bueno, +35 % muy bueno. Del CRM, no de memoria."],
  ["cashVenta","Cash que entra por venta el primer mes","usd","Lo que entra de verdad el primer mes, no el precio ni lo firmado en cuotas."],
  ["up","Compradores que suben de plan a las 24-48 h","pct","Upsell post compra. Sin flujo armado, 0."],
  ["upCash","Cash extra de cada subida","usd","La diferencia de precio que se cobra."],
  ["LOS COSTOS","","sec"],
  ["herr","Herramientas del lanzamiento","usd","Zoom, CRM, WhatsApp API, formularios, dominio. Solo lo del lanzamiento."],
  ["equipo","Equipo y producción","usd","Edición, copy, setters fijos, sistemas. Lo atribuible a este lanzamiento."],
  ["comCloser","Comisión de closers","pct","Sobre el cash que entra por llamadas."],
  ["comSetter","Comisión de setters","pct","Sobre el mismo cash."],
  ["pasarela","Comisión de la pasarela","pct","Stripe, Mercado Pago o la que se use, sobre todo el cash."]
];
// referencias de la plantilla de Limitless (tráfico frío en español)
const N_REF = {
  peor: {ads:5000,cpl:10,regOrg:"",show:.12,ret:.7,compra:0,precioDirecto:500,pide:.08,noAsist:.01,showLl:.6,cierre:.2,cashVenta:2500,up:0,upCash:1000,herr:500,equipo:1500,comCloser:.1,comSetter:.03,pasarela:.03},
  base: {ads:9000,cpl:4,regOrg:"",show:.18,ret:.8,compra:0,precioDirecto:500,pide:.12,noAsist:.02,showLl:.7,cierre:.3,cashVenta:2500,up:.05,upCash:1000,herr:500,equipo:1500,comCloser:.1,comSetter:.03,pasarela:.03},
  mejor:{ads:5000,cpl:6,regOrg:"",show:.25,ret:.9,compra:0,precioDirecto:500,pide:.18,noAsist:.04,showLl:.8,cierre:.4,cashVenta:2500,up:.1,upCash:1000,herr:500,equipo:1500,comCloser:.1,comSetter:.03,pasarela:.03}
};
const N_CM = {diasPauta:10, diasVentana:7, agendadasCloser:8, closers:1, leadsSDR:120, sdrs:1, preventa:false};
const N_REAL_KEYS = [["ads","Inversión en ads","usd"],["registros","Registros","num"],["asistentes","Asistentes en vivo (pico)","num"],["pidieron","Pidieron la llamada","num"],["tomaron","Tomaron la llamada","num"],["compraron","Compraron","num"],["cash","Cash cobrado","usd"],["herr","Herramientas","usd"],["equipo","Equipo y producción","usd"]];
let N_SEL = "";

function nSeed(){
  const esc = over => { const o={}; Object.keys(N_ESC).forEach(k=>o[k]=Object.assign({}, N_REF[k], over||{})); return o; };
  return {
    version: 2,
    gastos: "",            // gastos fijos de Primal por mes (USD)
    eurUsd: 1.10,          // tipo de cambio para las fuentes en euros (revisar)
    fuentes: [
      {id:"f-sebas",   nombre:"Sebas Ramos",  base:"profit", pct:50,   costos:.40, deja:"", moneda:"USD"},
      {id:"f-estiven", nombre:"Estiven López", base:"cash",  pct:25, deja:"", moneda:"USD"},
      {id:"f-amelia",  nombre:"Amelia Campos", base:"cash",  pct:10, deja:"", moneda:"EUR"},
      {id:"f-consul",  nombre:"Consultoría",   base:"cash",  pct:100,  deja:"", moneda:"USD"}
    ],
    webinars: [
      {id:"w-sebas-nov",   nombre:"Webinar Sebas Ramos",        fuente:"f-sebas",   fecha:"2026-11-19", tipo:"pago",     moneda:"USD", meta:"", esc:esc({ads:2000,cashVenta:800,herr:200}), cm:Object.assign({},N_CM), real:{}},
      {id:"w-estiven-dic", nombre:"Webinar Estiven",            fuente:"f-estiven", fecha:"2026-12-03", tipo:"pago",     moneda:"USD", meta:"", esc:esc({ads:7500,cashVenta:2000}), cm:Object.assign({},N_CM,{closers:3}), real:{}},
      {id:"w-amelia-dic",  nombre:"Mega webinar orgánico Amelia", fuente:"f-amelia", fecha:"2026-12-10", tipo:"organico", moneda:"EUR", meta:"", esc:esc({ads:0,cpl:"",cashVenta:1497}), cm:Object.assign({},N_CM), real:{}}
    ]
  };
}
function N(){
  if(!STATE.norte || !STATE.norte.version){ STATE.norte = nSeed(); saveState("norte"); }
  if(STATE.norte.version<2){ // 26/10/2026: NYLO sale del plan; Amelia al 10 %
    STATE.norte.fuentes = STATE.norte.fuentes.filter(f=>f.id!=="f-nylo");
    const a=STATE.norte.fuentes.find(f=>f.id==="f-amelia"); if(a) a.pct=10;
    STATE.norte.version=2; saveState("norte");
  }
  return STATE.norte;
}
function nNum(v){ return v===""||v==null||isNaN(Number(v)) ? null : Number(v); }
function nOk(...xs){ return xs.every(x=>x!=null && isFinite(x)); }
function nMoney(n, cur){ if(n==null||!isFinite(n)) return "—"; return cur==="EUR" ? fmt(n).replace("$","")+" €" : fmt(n); }
function nCount(n){ if(n==null||!isFinite(n)) return "—"; return Math.round(n).toLocaleString("en-US"); }
function nPct(n, d=0){ if(n==null||!isFinite(n)) return "—"; return (n*100).toFixed(d)+" %"; }
function nFuente(id){ return N().fuentes.find(f=>f.id===id); }
function nPctReal(f){ const p=(nNum(f.pct)||0)/100; return f.base==="profit" ? p*(1-(nNum(f.costos)||0)) : p; }
function nToUsd(n, cur){ return cur==="EUR" ? n*(nNum(N().eurUsd)||1) : n; }
function nFromUsd(n, cur){ return cur==="EUR" ? n/(nNum(N().eurUsd)||1) : n; }
// lo que la fuente te tiene que dejar (USD) → cash que tiene que cobrar ella (en su moneda)
function nCashNecesario(f){ const d=nNum(f.deja), p=nPctReal(f); return (d!=null && p>0) ? nFromUsd(d/p, f.moneda) : null; }

/* ---------- Modelo financiero: de la inversión hacia adelante (fila por fila como la planilla) ---------- */
function nModelo(w, k){
  const s = w.esc[k]; const g = key => nNum(s[key]);
  const ads = w.tipo==="organico" ? (g("ads")||0) : g("ads");
  const reg = w.tipo==="organico" ? g("regOrg") : (nOk(g("ads"),g("cpl")) && g("cpl")!==0 ? g("ads")/g("cpl") : null);
  const r = {reg};
  r.asist = nOk(reg,g("show")) ? reg*g("show") : null;
  r.pitch = nOk(r.asist,g("ret")) ? r.asist*g("ret") : null;
  r.compraPitch = nOk(r.pitch,g("compra")) ? r.pitch*g("compra") : null;
  r.cashDirecta = nOk(r.compraPitch,g("precioDirecto")) ? r.compraPitch*g("precioDirecto") : null;
  r.pidenVivo = nOk(r.pitch,g("pide")) ? r.pitch*g("pide") : null;
  r.pidenDespues = nOk(reg,r.asist,g("noAsist")) ? (reg-r.asist)*g("noAsist") : null;
  r.piden = nOk(r.pidenVivo,r.pidenDespues) ? r.pidenVivo+r.pidenDespues : null;
  r.toman = nOk(r.piden,g("showLl")) ? r.piden*g("showLl") : null;
  r.ventasLl = nOk(r.toman,g("cierre")) ? r.toman*g("cierre") : null;
  r.cashLl = nOk(r.ventasLl,g("cashVenta")) ? r.ventasLl*g("cashVenta") : null;
  r.cashUp = nOk(r.compraPitch,r.ventasLl,g("up"),g("upCash")) ? (r.compraPitch+r.ventasLl)*g("up")*g("upCash") : null;
  r.ventas = nOk(r.compraPitch,r.ventasLl) ? r.compraPitch+r.ventasLl : null;
  r.cash = nOk(r.cashDirecta,r.cashLl,r.cashUp) ? r.cashDirecta+r.cashLl+r.cashUp : null;
  r.roas = nOk(r.cash,ads) && ads ? r.cash/ads : null;
  r.comis = nOk(r.cashLl,r.cash) ? r.cashLl*((g("comCloser")||0)+(g("comSetter")||0)) + r.cash*(g("pasarela")||0) : null;
  r.costos = nOk(ads,r.comis) ? ads+(g("herr")||0)+(g("equipo")||0)+r.comis : null;
  r.neta = nOk(r.cash,r.costos) ? r.cash-r.costos : null;
  r.roasNeto = nOk(r.neta,ads) && ads ? r.neta/ads : null;
  r.techoReg = nOk(r.cash,r.comis,reg) && reg ? (r.cash-r.comis-(g("herr")||0)-(g("equipo")||0))/reg : null;
  r.costoLl = nOk(ads,r.toman) && r.toman ? ads/r.toman : null;
  r.cashPedido = nOk(r.cashLl,r.cashUp,r.piden) && r.piden ? (r.cashLl+r.cashUp)/r.piden : null;
  r.costoCliente = nOk(r.costos,r.ventas) && r.ventas ? r.costos/r.ventas : null;
  r.adsCliente = nOk(ads,r.ventas) && r.ventas ? ads/r.ventas : null;
  const f = nFuente(w.fuente);
  r.tuParte = f ? (f.base==="profit" ? (r.neta!=null ? Math.max(0,r.neta)*(nNum(f.pct)||0)/100 : null) : (r.cash!=null ? r.cash*(nNum(f.pct)||0)/100 : null)) : null;
  return r; // con profit, si el webinar pierde tu parte es 0 (no hay upfront)
}

/* ---------- Closer math: de la meta para atrás, con las tasas de BASE ---------- */
function nMeta(w){ const m=nNum(w.meta); if(m!=null) return m; const f=nFuente(w.fuente); return f ? nCashNecesario(f) : null; }
function nCloser(w){
  const s=w.esc.base, g=k=>nNum(s[k]), c=w.cm, meta=nMeta(w);
  const rate = nOk(g("show"),g("ret"),g("pide"),g("noAsist")) && g("show")>0 ? g("ret")*g("pide") + (1-g("show"))/g("show")*g("noAsist") : null; // pedidos ÷ asistentes
  const o = {meta, rate};
  o.ventas = nOk(meta,g("cashVenta")) && g("cashVenta") ? meta/g("cashVenta") : null;
  o.llamadas = nOk(o.ventas,g("cierre")) && g("cierre") ? o.ventas/g("cierre") : null;
  o.agendas = nOk(o.llamadas,g("showLl")) && g("showLl") ? o.llamadas/g("showLl") : null;
  o.asist = nOk(o.agendas,rate) && rate ? o.agendas/rate : null;
  o.reg = nOk(o.asist,g("show")) && g("show") ? o.asist/g("show") : null;
  o.ads = w.tipo==="organico" ? 0 : (nOk(o.reg,g("cpl")) ? o.reg*g("cpl") : null);
  o.regDia = nOk(o.reg) && c.diasPauta ? o.reg/c.diasPauta : null;
  o.leadsPost = nOk(o.reg) && c.diasVentana ? o.reg/c.diasVentana : null;
  o.pico = o.leadsPost==null ? null : Math.max(c.preventa ? (o.regDia||0) : 0, o.leadsPost);
  o.sdrs = nOk(o.pico) && c.leadsSDR ? Math.ceil(o.pico/c.leadsSDR) : null;
  o.agDia = nOk(o.agendas) && c.diasVentana ? o.agendas/c.diasVentana : null;
  o.closers = nOk(o.agDia) && c.agendadasCloser ? Math.ceil(o.agDia/c.agendadasCloser) : null;
  o.roas = nOk(meta,o.ads) && o.ads ? meta/o.ads : null;
  const comis = nOk(meta) ? meta*((g("comCloser")||0)+(g("comSetter")||0)+(g("pasarela")||0)) : null;
  o.neta = nOk(meta,o.ads,comis) ? meta-o.ads-(g("herr")||0)-(g("equipo")||0)-comis : null;
  const f = nFuente(w.fuente);
  o.tuParte = f && meta!=null ? (f.base==="profit" ? (o.neta!=null ? Math.max(0,o.neta)*(nNum(f.pct)||0)/100 : null) : meta*(nNum(f.pct)||0)/100) : null;
  return o;
}

/* ============================================================
   VISTA · NORTE
   ============================================================ */
function renderNorte(){
  const el=$("#view-norte"); const n=N();
  if(!N_SEL || !n.webinars.some(w=>w.id===N_SEL)) N_SEL=(n.webinars[0]||{}).id||"";
  const objetivo=Number(STATE.config.objetivoNegocio)||0, gastos=nNum(n.gastos)||0, tiene=objetivo+gastos;
  const repartido=n.fuentes.reduce((a,f)=>a+(nNum(f.deja)||0),0), falta=tiene-repartido;
  const w=n.webinars.find(x=>x.id===N_SEL);

  el.innerHTML=`
  <section class="panel" style="margin-top:18px"><h3>1 · De tu meta a cada cliente <span class="sub">lo que te tiene que dejar ÷ tu % real = cash que tiene que cobrar él</span></h3>
    <div class="burn">
      <div class="subkpi"><div class="l">Meta de profit (Config)</div><div class="v">${fmt(objetivo)}</div><div class="s">lo que te queda limpio al mes</div></div>
      <div class="subkpi"><div class="l">Gastos fijos de Primal</div><div class="f" style="margin-top:4px"><input class="mono" type="number" data-nset="gastos" value="${esc(n.gastos)}" placeholder="por cargar" /></div><div class="s">herramientas, equipo, lo que pagás vos</div></div>
      <div class="subkpi"><div class="l">Te tienen que dejar</div><div class="v ember">${fmt(tiene)}</div><div class="s">meta + gastos</div></div>
      <div class="subkpi"><div class="l">${falta>0.5?"Falta repartir":falta<-0.5?"Repartido de más":"Repartido"}</div><div class="v ${falta>0.5?"bad":"ok"}">${fmt(Math.abs(falta)>0.5?Math.abs(falta):repartido)}</div><div class="s">${fmt(repartido)} asignados entre las fuentes</div></div>
    </div>
    <table class="tbl"><thead><tr><th>Fuente</th><th>Cobrás sobre</th><th class="num">Tu %</th><th class="num">% real del cash</th><th class="num">Multiplicador</th><th class="num">Te tiene que dejar (USD)</th><th class="num">Cash que tiene que cobrar</th></tr></thead><tbody>
    ${n.fuentes.map(f=>{ const pr=nPctReal(f), cn=nCashNecesario(f); return `<tr style="cursor:default">
      <td><b>${esc(f.nombre)}</b>${f.moneda==="EUR"?` <span class="tag">EUR</span>`:""}</td>
      <td>${f.base==="profit"?`profit <span class="mini" style="display:inline">· costos</span> <input class="mono" style="width:60px" type="number" step="1" data-nset="fuente|${f.id}|costos|pct" value="${nNum(f.costos)!=null?Math.round(f.costos*100):""}" /> %`:"cash collected"}</td>
      <td class="num"><input class="mono" style="width:70px;text-align:right" type="number" step="0.5" data-nset="fuente|${f.id}|pct" value="${esc(f.pct)}" /></td>
      <td class="num">${nPct(pr,1)}</td>
      <td class="num">${pr>0?"×"+(1/pr).toFixed(1):"—"}</td>
      <td class="num"><input class="mono" style="width:100px;text-align:right" type="number" step="100" data-nset="fuente|${f.id}|deja" value="${esc(f.deja)}" placeholder="0" /></td>
      <td class="num ember">${nMoney(cn,f.moneda)}</td></tr>`; }).join("")}
    </tbody></table>
    <div class="mini" style="margin-top:10px">Con profit, tu % real = tu % × (1 − costos). Euros a ${nNum(n.eurUsd)||1} USD <input class="mono" style="width:60px" type="number" step="0.01" data-nset="eurUsd" value="${esc(n.eurUsd)}" /> · Si cambia un % con un cliente, se cambia acá y en su ficha de Growth.</div>
  </section>

  <section class="panel"><h3>2 · Ingeniería inversa por webinar <span class="act">${n.webinars.map(x=>`<button class="btn xs ${x.id===N_SEL?"gold":"ghost"}" data-nwsel="${x.id}">${esc(x.nombre.replace(/^(Mega webinar orgánico|Webinar) /,""))}</button>`).join("")}</span></h3>
    ${w?renderNorteWebinar(w):`<div class="mini">Sin webinars.</div>`}
  </section>`;

  $$("[data-nset]",el).forEach(inp=>inp.onchange=()=>nSet(inp));
  $$("[data-nwsel]",el).forEach(b=>b.onclick=()=>{ N_SEL=b.dataset.nwsel; renderNorte(); });
}

function renderNorteWebinar(w){
  const f=nFuente(w.fuente), cur=w.moneda, org=w.tipo==="organico";
  const M={}; Object.keys(N_ESC).forEach(k=>M[k]=nModelo(w,k));
  const C=nCloser(w), cn=f?nCashNecesario(f):null, c=w.cm;
  const tipoInput=(t,v)=> t==="pct" ? (nNum(v)!=null ? +(v*100).toFixed(2) : "") : (v==null?"":v);
  const vars=N_VARS.filter(v=>!(org && (v[0]==="cpl")) && !(!org && v[0]==="regOrg"));
  const res=[
    ["Registros","reg","n"],["Asistentes en vivo","asist","n"],["Llegan al pitch","pitch","n"],["Piden la llamada en total","piden","n"],["Toman la llamada","toman","n"],["Ventas totales","ventas","n"],
    ["CASH TOTAL (cobrado)","cash","m",true],["ROAS bruto","roas","x"],["Costos totales","costos","m"],["GANANCIA NETA","neta","m",true],["ROAS neto (con este se decide)","roasNeto","x"],
    ["Techo por registro (todo descontado)","techoReg","m"],["Cash que deja cada pedido de llamada","cashPedido","m"],["Costo total por cliente","costoCliente","m"],
    ["TU PARTE"+(f?` (${f.base==="profit"?"ganancia neta":"cash"} × ${f.pct} %)`:""),"tuParte","m",true]
  ];
  const cell=(r,t)=> t==="n"?nCount(r):t==="x"?(r==null?"—":r.toFixed(2)+"×"):nMoney(r,cur);
  const color=(key,v)=> key==="neta"||key==="tuParte" ? (v==null?"":v<0?"bad":"ok") : key==="roasNeto" ? (v==null?"":v<0?"bad":v<1?"warn":"ok") : key==="roas" ? (v==null?"":v<1.7?"warn":"") : "";
  const real=w.real||{}, rv=k=>nNum(real[k]);
  const camino=[["Registros",C.reg,rv("registros")],["Asistentes en vivo",C.asist,rv("asistentes")],["Pedidos de llamada",C.agendas,rv("pidieron")],["Llamadas tomadas",C.llamadas,rv("tomaron")],["Ventas",C.ventas,rv("compraron")],["Cash",C.meta,rv("cash")]];
  const pcts=camino.map(([,need,got])=>nOk(need,got)&&need?got/need:null);
  let caida=null, minR=Infinity; pcts.forEach((p,i)=>{ if(i<1||p==null||pcts[i-1]==null||!pcts[i-1]) return; const r=p/pcts[i-1]; if(r<minR){minR=r;caida=camino[i][0];} });

  return `
  <div class="kv" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr));margin-bottom:14px">
    <div class="f"><label>Webinar</label><input data-nset="w|${w.id}|nombre" value="${esc(w.nombre)}" /></div>
    <div class="f"><label>Fecha</label><input type="date" data-nset="w|${w.id}|fecha" value="${esc(w.fecha)}" /></div>
    <div class="f"><label>Tipo</label><select data-nset="w|${w.id}|tipo"><option value="pago" ${!org?"selected":""}>Pago (con ads)</option><option value="organico" ${org?"selected":""}>Orgánico (sin ads)</option></select></div>
    <div class="f"><label>Cliente</label><select data-nset="w|${w.id}|fuente">${N().fuentes.map(x=>`<option value="${x.id}" ${x.id===w.fuente?"selected":""}>${esc(x.nombre)}</option>`).join("")}</select></div>
  </div>

  <div class="panel flat" style="margin-bottom:14px"><h3>Closer math · de la meta para atrás <span class="sub">tasas de la columna BASE de abajo</span></h3>
    <div class="kv" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr))">
      <div class="f"><label>Meta de cash cobrado (${cur})</label><input class="mono" type="number" data-nset="w|${w.id}|meta" value="${esc(w.meta)}" placeholder="${cn!=null?Math.round(cn):"cargá la meta"}" /><div class="mini">${nNum(w.meta)==null?(cn!=null?`vacío = lo que pide el reparto (${nMoney(cn,cur)})`:"o cargá cuánto te tiene que dejar arriba"):(cn!=null?`el reparto pide ${nMoney(cn,cur)}`:"")}</div></div>
      ${org?"":`<div class="f"><label>Días de pauta</label><input class="mono" type="number" data-nset="cm|${w.id}|diasPauta" value="${c.diasPauta}" /></div>`}
      <div class="f"><label>Días de ventana de ventas</label><input class="mono" type="number" data-nset="cm|${w.id}|diasVentana" value="${c.diasVentana}" /></div>
      <div class="f"><label>Agendadas por closer por día</label><input class="mono" type="number" data-nset="cm|${w.id}|agendadasCloser" value="${c.agendadasCloser}" /></div>
      <div class="f"><label>Closers que hay hoy</label><input class="mono" type="number" data-nset="cm|${w.id}|closers" value="${c.closers}" /></div>
      <div class="f"><label>Leads que toca un SDR por día</label><input class="mono" type="number" data-nset="cm|${w.id}|leadsSDR" value="${c.leadsSDR}" /></div>
      <div class="f"><label>SDRs que hay hoy</label><input class="mono" type="number" data-nset="cm|${w.id}|sdrs" value="${c.sdrs}" /></div>
      <div class="f"><label>¿Preventa?</label><select data-nset="cm|${w.id}|preventa"><option value="0" ${!c.preventa?"selected":""}>No</option><option value="1" ${c.preventa?"selected":""}>Sí, se llama desde que se registran</option></select></div>
    </div>
    <table class="tbl"><thead><tr><th>Lo que sale</th><th class="num">Cantidad</th><th>La cuenta</th></tr></thead><tbody style="cursor:default">
      <tr><td>Ventas necesarias</td><td class="num">${nCount(C.ventas)}</td><td class="muted">meta ÷ cash por venta (${nMoney(nNum(w.esc.base.cashVenta),cur)})</td></tr>
      <tr><td>Llamadas que hay que tomar</td><td class="num">${nCount(C.llamadas)}</td><td class="muted">ventas ÷ cierre (${nPct(nNum(w.esc.base.cierre))})</td></tr>
      <tr><td>Pedidos de llamada (agendas)</td><td class="num">${nCount(C.agendas)}</td><td class="muted">llamadas ÷ show a la llamada (${nPct(nNum(w.esc.base.showLl))})</td></tr>
      <tr><td>Asistentes en vivo</td><td class="num">${nCount(C.asist)}</td><td class="muted">pedidos ÷ ${nPct(C.rate,1)} (los que piden por cada asistente, vivo + replay + setters)</td></tr>
      <tr><td><b>Registros</b></td><td class="num ember">${nCount(C.reg)}</td><td class="muted">asistentes ÷ show al webinar (${nPct(nNum(w.esc.base.show))})${org?" · sin pauta: todos salen del alcance propio":""}</td></tr>
      ${org?"":`<tr><td><b>Inversión en ads</b></td><td class="num ember">${nMoney(C.ads,cur)}</td><td class="muted">registros × costo por registro (${nMoney(nNum(w.esc.base.cpl),cur)}) · ${nCount(C.regDia)} registros por día</td></tr>`}
      <tr><td>Closers necesarios</td><td class="num">${C.closers==null?"—":C.closers}</td><td class="muted">${C.agDia==null?"":C.agDia.toFixed(1)+" agendas por día ÷ "+c.agendadasCloser} ${C.closers!=null&&C.closers>c.closers?`· <span class="bad">faltan ${C.closers-c.closers}</span>`:C.closers!=null?`· <span class="ok">alcanzan</span>`:""}</td></tr>
      <tr><td>SDRs necesarios</td><td class="num">${C.sdrs==null?"—":C.sdrs}</td><td class="muted">${nCount(C.pico)} leads el día más cargado ÷ ${c.leadsSDR} ${C.sdrs!=null&&C.sdrs>c.sdrs?`· <span class="bad">faltan ${C.sdrs-c.sdrs}</span>`:C.sdrs!=null?`· <span class="ok">alcanzan</span>`:""}</td></tr>
      ${org?"":`<tr><td>ROAS bruto que permiten estas tasas</td><td class="num ${C.roas!=null&&C.roas<1.7?"bad":""}">${C.roas==null?"—":C.roas.toFixed(1)+"×"}</td><td class="muted">meta ÷ inversión. Debajo de 1,7 no cierra: mejorar una tasa antes de poner plata</td></tr>`}
      <tr><td><b>Tu parte si se cumple</b></td><td class="num ember">${C.tuParte==null?"—":fmt(nToUsd(C.tuParte,cur))}</td><td class="muted">${f&&f.base==="profit"?`(meta − ads − herramientas − equipo − comisiones) × ${f.pct} % = profit ${nMoney(C.neta,cur)} × ${f.pct} %`:f?`meta × ${f.pct} %`:""}</td></tr>
    </tbody></table>
  </div>

  <div class="panel flat" style="margin-bottom:14px"><h3>Modelo financiero · de la inversión para adelante <span class="sub">los % se escriben enteros: 18 = 18 %</span></h3>
    <div style="overflow-x:auto"><table class="tbl"><thead><tr><th>Variable</th>${Object.entries(N_ESC).map(([,l])=>`<th class="num">${l}</th>`).join("")}<th>Cómo se lee</th></tr></thead><tbody style="cursor:default">
      ${vars.map(([k,l,t,h])=> t==="sec" ? `<tr><td colspan="5" class="mini" style="padding-top:14px">${l||k}</td></tr>` : `<tr><td>${l}</td>${Object.keys(N_ESC).map(e=>`<td class="num"><input class="mono" style="width:86px;text-align:right" type="number" step="any" data-nset="esc|${w.id}|${e}|${k}|${t}" value="${tipoInput(t,w.esc[e][k])}" /></td>`).join("")}<td class="muted" style="font-size:11.5px">${h||""}</td></tr>`).join("")}
      <tr><td colspan="5" class="mini" style="padding-top:14px">RESULTADOS · se calculan solos</td></tr>
      ${res.map(([l,k,t,b])=>`<tr><td>${b?`<b>${l}</b>`:l}</td>${Object.keys(N_ESC).map(e=>`<td class="num ${color(k,M[e][k])}">${k==="tuParte"&&M[e][k]!=null?fmt(nToUsd(M[e][k],cur)):cell(M[e][k],t)}</td>`).join("")}<td></td></tr>`).join("")}
    </tbody></table></div>
    <div class="mini" style="margin-top:8px">Primero se mira la ganancia neta del peor caso: si da rojo, ese es el riesgo real del lanzamiento. Una palanca por vez.</div>
  </div>

  <div class="panel flat"><h3>Resultado real · el día después y al cerrar la ventana <span class="sub">% del camino contra lo que pide la meta</span></h3>
    <div class="kv" style="grid-template-columns:repeat(auto-fit,minmax(140px,1fr))">${N_REAL_KEYS.map(([k,l])=>`<div class="f"><label>${l}</label><input class="mono" type="number" data-nset="real|${w.id}|${k}" value="${esc(real[k]??"")}" /></div>`).join("")}</div>
    <table class="tbl"><thead><tr><th>Paso</th><th class="num">Necesario</th><th class="num">Real</th><th class="num">% del camino</th></tr></thead><tbody style="cursor:default">
      ${camino.map(([l,need,got],i)=>`<tr><td>${l}</td><td class="num">${l==="Cash"?nMoney(need,cur):nCount(need)}</td><td class="num">${got==null?"—":l==="Cash"?nMoney(got,cur):nCount(got)}</td><td class="num ${pcts[i]==null?"":pcts[i]>=1?"ok":"warn"}">${nPct(pcts[i])}</td></tr>`).join("")}
    </tbody></table>
    <div class="mini" style="margin-top:8px">${caida?`Dónde se cae el embudo: <span class="bad">${esc(caida)}</span>. Arreglar ese paso antes de poner más plata en ads.`:"Cargá lo que pasó y acá aparece el paso donde se cae el embudo."}</div>
  </div>`;
}

async function nSet(inp){
  const n=N(), parts=inp.dataset.nset.split("|"), raw=inp.value;
  const num = t => raw==="" ? "" : (t==="pct" ? Number(raw)/100 : Number(raw));
  if(parts[0]==="gastos"||parts[0]==="eurUsd") n[parts[0]] = raw==="" ? "" : Number(raw);
  else if(parts[0]==="fuente"){ const f=nFuente(parts[1]); if(f) f[parts[2]] = num(parts[3]); }
  else if(parts[0]==="w"){ const w=n.webinars.find(x=>x.id===parts[1]); if(w) w[parts[2]] = parts[2]==="meta" ? num() : raw; }
  else if(parts[0]==="cm"){ const w=n.webinars.find(x=>x.id===parts[1]); if(w) w.cm[parts[2]] = parts[2]==="preventa" ? raw==="1" : Number(raw)||0; }
  else if(parts[0]==="esc"){ const w=n.webinars.find(x=>x.id===parts[1]); if(w) w.esc[parts[2]][parts[3]] = num(parts[4]); }
  else if(parts[0]==="real"){ const w=n.webinars.find(x=>x.id===parts[1]); if(w){ w.real=w.real||{}; w.real[parts[2]] = num(); } }
  await saveState("norte"); renderNorte();
}
