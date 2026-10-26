/* ============================================================
   PRIMAL · TAREAS — lo que tiene que estar listo y para cuándo
   Cada proyecto tiene la fecha de su evento. Cada tarea vence N días antes (−)
   o después (+) del evento: si el evento se mueve, se mueven todas (ingeniería
   inversa del calendario). Las que no dependen de un evento llevan fecha fija.
   Avisos al celular con ntfy: a 7, 3 y 1 día, el mismo día y las vencidas.
   ============================================================ */
const T_ESTADOS = {pendiente:"Pendiente", progreso:"En progreso", trabada:"Trabada", hecho:"Hecho"};
const T_PRIO = {P0:"Si no está, el lanzamiento se rompe", P1:"Si falta, sale pero vende menos", P2:"Mejora, puede esperar"};
const T_RESP = ["Santi","Claude","Cliente","Sebas","Amelia","Estiven","Editores","Equipo de ventas"];
const T_TIPOS = {pago:"Webinar pago", organico:"Webinar orgánico", vsl:"VSL funnel", interno:"Interno"};
const NTFY = "https://ntfy.sh";
const NTFY_TOPIC = "primal-santi-a7f08dd811"; // canal por defecto (el que se suscribe en la app ntfy del celular)
let T_F = {proy:"", resp:"", estado:"abiertas", modo:"fecha"};

function proyectos(){ return STATE.proyectos||[]; }
function tareas(){ return STATE.tareas||[]; }
function proyDe(t){ return proyectos().find(p=>p.id===t.proyecto); }
function tieneOff(t){ return t.off!==null && t.off!==undefined && t.off!==""; }
function tVence(t){ const p=proyDe(t); if(tieneOff(t) && p && p.evento) return addDays(p.evento, Number(t.off)); return t.fecha||""; }
function diasEntre(a,b){ const [y1,m1,d1]=a.split("-").map(Number), [y2,m2,d2]=b.split("-").map(Number); return Math.round((Date.UTC(y2,m2-1,d2)-Date.UTC(y1,m1-1,d1))/864e5); }
function tFalta(t){ const v=tVence(t); return v ? diasEntre(todayStr(), v) : null; }
function tAbierta(t){ return t.estado!=="hecho"; }
function offLabel(n){ n=Number(n); return n===0 ? "día del evento" : n<0 ? `${-n} d antes` : `${n} d después`; }
function faltaLabel(n){ if(n==null) return "sin fecha"; if(n===0) return "hoy"; if(n===1) return "mañana"; if(n<0) return `venció hace ${-n} d`; return `faltan ${n} d`; }
function faltaCls(t){ const n=tFalta(t); if(!tAbierta(t)) return "done"; if(n==null) return ""; if(n<0) return "venc"; if(n<=1) return "hoy"; if(n<=3) return "pronto"; if(n<=7) return "semana"; return ""; }
function tareasVencidasHoy(){ return tareas().filter(t=>tAbierta(t) && tVence(t) && tFalta(t)<=0).length; }

/* ---------- carga inicial (una vez por versión del seed) ---------- */
async function seedTareas(){
  if(!STATE.proyectos) STATE.proyectos=[]; if(!STATE.tareas) STATE.tareas=[];
  if(!STATE.config.ntfy){ STATE.config.ntfy = NTFY_TOPIC; STATE.config.avisosDias=[7,3,1]; await saveState("config"); }
  if(!STATE.config.appUrl && location.protocol==="https:"){ STATE.config.appUrl = location.origin+"/"; await saveState("config"); } // el aviso del cron abre esta dirección
  if(typeof T_SEED==="undefined" || (Number(STATE.config.seedTareas)||0) >= T_SEED.version) return;
  (T_SEED.quitar||[]).forEach(pid=>{ STATE.proyectos=STATE.proyectos.filter(p=>p.id!==pid); STATE.tareas=STATE.tareas.filter(t=>t.proyecto!==pid); });
  T_SEED.proyectos.forEach(p=>{ if(!STATE.proyectos.some(x=>x.id===p.id)) STATE.proyectos.push(Object.assign({archivado:false}, p)); });
  Object.entries(T_SEED.tareas).forEach(([pid, rows])=>rows.forEach((r,i)=>{
    const id=`${pid}-${i+1}`; if(STATE.tareas.some(x=>x.id===id)) return;
    const [etapa,area,titulo,detalle,resp,prio,off,fecha]=r;
    STATE.tareas.push({id, proyecto:pid, etapa, area, titulo, detalle, resp, prio, off, fecha:fecha||"", estado:"pendiente", link:"", notas:"", hechaEl:""});
  }));
  STATE.config.seedTareas = T_SEED.version;
  await saveState("proyectos"); await saveState("tareas"); await saveState("config"); saveLocal();
}

/* ============================================================
   VISTA · TAREAS
   ============================================================ */
function renderTareas(){
  const el=$("#view-tareas"); const hoy=todayStr();
  const all=tareas().filter(t=>{ const p=proyDe(t); return !p || !p.archivado; });
  const ab=all.filter(tAbierta);
  const venc=ab.filter(t=>tVence(t) && tFalta(t)<0), deHoy=ab.filter(t=>tFalta(t)===0), sem=ab.filter(t=>{ const n=tFalta(t); return n!=null && n>0 && n<=7; });
  const hechas=all.filter(t=>!tAbierta(t)).length;

  let list=all.filter(t=>(!T_F.proy||t.proyecto===T_F.proy) && (!T_F.resp||t.resp===T_F.resp) && (T_F.estado==="todas" ? true : T_F.estado==="hechas" ? !tAbierta(t) : tAbierta(t)));
  list.sort((a,b)=>(tVence(a)||"9999").localeCompare(tVence(b)||"9999") || (a.prio||"").localeCompare(b.prio||""));
  const resps=[...new Set(all.map(t=>t.resp).filter(Boolean))];

  el.innerHTML=`
  <div class="burn" style="margin-top:18px">
    <div class="subkpi"><div class="l">Vencidas</div><div class="v ${venc.length?"bad":"dim"}">${venc.length}</div><div class="s">${venc.length?"vas tarde: esto primero":"al día"}</div></div>
    <div class="subkpi"><div class="l">Vencen hoy</div><div class="v ${deHoy.length?"ember":"dim"}">${deHoy.length}</div><div class="s">${dayLabel(hoy)}</div></div>
    <div class="subkpi"><div class="l">Próximos 7 días</div><div class="v">${sem.length}</div><div class="s">${sem.filter(t=>t.prio==="P0").length} son P0</div></div>
    <div class="subkpi"><div class="l">Hechas</div><div class="v">${hechas}<small class="dim" style="font-size:.55em"> / ${all.length}</small></div><div class="s">${all.length?Math.round(hechas/all.length*100):0}% del total</div></div>
  </div>

  <section class="t-proys">${proyectos().filter(p=>!p.archivado).map(proyCard).join("")}
    <button class="t-proy add" onclick="openProyecto()"><span>+ Proyecto</span><small>webinar pago, orgánico o vacío</small></button>
  </section>

  <div class="filters">
    <div class="seg">${["abiertas","hechas","todas"].map(f=>`<button data-tf="${f}" class="${T_F.estado===f?"active":""}">${f}</button>`).join("")}</div>
    <select id="t-resp"><option value="">Todos</option>${resps.map(r=>`<option ${T_F.resp===r?"selected":""}>${esc(r)}</option>`).join("")}</select>
    <div class="seg">${[["fecha","por fecha"],["etapa","por etapa"]].map(([k,l])=>`<button data-tm="${k}" class="${T_F.modo===k?"active":""}">${l}</button>`).join("")}</div>
    ${T_F.proy?`<button class="btn xs ghost" onclick="T_F.proy='';render()">× ${esc((proyectos().find(p=>p.id===T_F.proy)||{}).nombre||"")}</button>`:""}
    <span class="spacer"></span>
    <button class="btn sm ghost" onclick="openAvisos()">Avisos al celular</button>
    <button class="btn sm gold" onclick="openTarea()">+ Tarea</button>
  </div>
  <div class="panel">${!list.length?`<div class="empty" style="padding:22px">Nada por acá.</div>`:T_F.modo==="etapa"?renderPorEtapa(list):renderPorFecha(list)}</div>`;

  $$("[data-tf]",el).forEach(b=>b.onclick=()=>{T_F.estado=b.dataset.tf;render();});
  $$("[data-tm]",el).forEach(b=>b.onclick=()=>{T_F.modo=b.dataset.tm;render();});
  $("#t-resp").onchange=e=>{T_F.resp=e.target.value;render();};
}
function proyCard(p){
  const ts=tareas().filter(t=>t.proyecto===p.id), h=ts.filter(t=>!tAbierta(t)).length, pct=ts.length?h/ts.length*100:0;
  const n=p.evento?diasEntre(todayStr(),p.evento):null, venc=ts.filter(t=>tAbierta(t)&&tVence(t)&&tFalta(t)<0).length;
  const p0=ts.filter(t=>tAbierta(t)&&t.prio==="P0").length;
  return `<div class="t-proy ${T_F.proy===p.id?"on":""}" onclick="T_F.proy=T_F.proy==='${p.id}'?'':'${p.id}';render()">
    <div class="top"><span class="tag n">${esc(T_TIPOS[p.tipo]||p.tipo||"")}</span><button class="btn xs ghost" onclick="event.stopPropagation();openProyecto('${p.id}')">editar</button></div>
    <b>${esc(p.nombre)}</b>
    <div class="cd">${n==null?`<span class="dim">sin evento</span>`:n<0?`<span class="dim">pasó hace ${-n} d</span>`:`<em>${n}</em><span>${n===1?"día":"días"} · ${dayLabel(p.evento)}${p.hora?" · "+esc(p.hora):""}</span>`}</div>
    <div class="bar"><i style="width:${pct}%"></i></div>
    <small>${h} de ${ts.length} hechas${venc?` · <span class="bad">${venc} vencidas</span>`:""}${p0?` · ${p0} P0 abiertas`:""}</small>
  </div>`;
}
function tRow(t){
  const p=proyDe(t), v=tVence(t), n=tFalta(t);
  return `<div class="t-row ${faltaCls(t)}" onclick="openTarea('${t.id}')">
    <button class="t-check ${t.estado==="hecho"?"on":""}" title="${t.estado==="hecho"?"Marcar pendiente":"Marcar hecha"}" onclick="event.stopPropagation();toggleTarea('${t.id}')"></button>
    <div class="t-main"><b>${esc(t.titulo)}</b><small>${p&&!T_F.proy?`<span class="ember">${esc(p.cliente||p.nombre)}</span> · `:""}${esc(t.etapa||"")} · ${esc(t.resp||"—")}${t.estado==="progreso"?` · <span class="ok">en progreso</span>`:t.estado==="trabada"?` · <span class="bad">trabada</span>`:""}${t.link?` · <a href="${esc(t.link)}" target="_blank" onclick="event.stopPropagation()">entregable</a>`:""}</small></div>
    <span class="tag ${t.prio==="P0"?"warn":""}" title="${esc(T_PRIO[t.prio]||"")}">${esc(t.prio||"")}</span>
    <div class="t-due"><span>${v?dayLabel(v):"—"}</span><small>${t.estado==="hecho"?"hecha"+(t.hechaEl?" "+dayLabel(t.hechaEl):""):faltaLabel(n)}</small></div>
  </div>`;
}
function renderPorFecha(list){
  const g=[["Vencidas",t=>tAbierta(t)&&tFalta(t)<0],["Hoy",t=>tFalta(t)===0],["Mañana",t=>tFalta(t)===1],["Esta semana",t=>{const n=tFalta(t);return n>1&&n<=7;}],["Próximas 2 semanas",t=>{const n=tFalta(t);return n>7&&n<=21;}],["Más adelante",t=>tFalta(t)>21],["Sin fecha",t=>tFalta(t)==null]];
  const used=new Set(); let html="";
  g.forEach(([lbl,fn])=>{ const rows=list.filter(t=>!used.has(t.id) && (lbl==="Vencidas"?fn(t):tAbierta(t)?fn(t):false)); rows.forEach(t=>used.add(t.id)); if(rows.length) html+=`<h3 class="t-g">${lbl} <span class="sub">${rows.length}</span></h3>${rows.map(tRow).join("")}`; });
  const rest=list.filter(t=>!used.has(t.id)); if(rest.length) html+=`<h3 class="t-g">Hechas <span class="sub">${rest.length}</span></h3>${rest.map(tRow).join("")}`;
  return html;
}
function renderPorEtapa(list){
  const et=[...new Set(list.map(t=>(proyDe(t)?proyDe(t).nombre+" · ":"")+(t.etapa||"Sin etapa")))].sort();
  return et.map(e=>{ const rows=list.filter(t=>((proyDe(t)?proyDe(t).nombre+" · ":"")+(t.etapa||"Sin etapa"))===e); return `<h3 class="t-g">${esc(e)} <span class="sub">${rows.length}</span></h3>${rows.map(tRow).join("")}`; }).join("");
}
function renderTareasStrip(){
  const ab=tareas().filter(t=>tAbierta(t)&&tVence(t)); const v=ab.filter(t=>tFalta(t)<0).length, h=ab.filter(t=>tFalta(t)===0).length, m=ab.filter(t=>tFalta(t)===1).length;
  if(!v&&!h&&!m) return "";
  return `<div class="t-strip" onclick="VIEW='tareas';render();window.scrollTo({top:0})"><span class="eyebrow" style="margin:0">Tareas</span>${v?`<b class="bad">${v} vencidas</b>`:""}${h?`<b class="ember">${h} vencen hoy</b>`:""}${m?`<b>${m} mañana</b>`:""}<span class="spacer"></span><span class="mini">ver →</span></div>`;
}

/* ---------- acciones ---------- */
async function toggleTarea(id){
  const t=tareas().find(x=>x.id===id); if(!t) return;
  if(t.estado==="hecho"){ t.estado="pendiente"; t.hechaEl=""; } else { t.estado="hecho"; t.hechaEl=todayStr(); }
  await saveState("tareas"); render(); toast(t.estado==="hecho"?"Hecha. Una menos.":"Vuelve a pendiente");
}
function openTarea(id){
  const t=id?tareas().find(x=>x.id===id):{id:"",proyecto:T_F.proy||(proyectos()[0]||{}).id||"",etapa:"",area:"",titulo:"",detalle:"",resp:"Santi",prio:"P1",off:null,fecha:todayStr(),estado:"pendiente",link:"",notas:""};
  if(!t) return; const p=proyDe(t)||proyectos().find(x=>x.id===t.proyecto);
  const modo=tieneOff(t)?"off":"fecha";
  openModal({ title: id?`Tarea · <i>${esc(clipTxt(t.titulo,40))}</i>`:"Tarea nueva", del:!!id, body:`
    <div class="f"><label>Tarea</label><input id="t-tit" value="${esc(t.titulo)}" placeholder="Qué tiene que estar listo" /></div>
    <div class="f2"><div class="f"><label>Proyecto</label><select id="t-proy">${proyectos().map(x=>`<option value="${x.id}" ${x.id===t.proyecto?"selected":""}>${esc(x.nombre)}</option>`).join("")}</select></div>
      <div class="f"><label>Responsable</label><select id="t-res">${[...new Set([...T_RESP,t.resp].filter(Boolean))].map(r=>`<option ${r===t.resp?"selected":""}>${esc(r)}</option>`).join("")}</select></div></div>
    <div class="f2"><div class="f"><label>Etapa</label><input id="t-eta" value="${esc(t.etapa||"")}" placeholder="1 · Equipo de ventas" /></div>
      <div class="f"><label>Área</label><input id="t-area" value="${esc(t.area||"")}" placeholder="Ads · Funnel · Ventas…" /></div></div>
    <div class="f"><label>Prioridad</label><div class="pick" id="t-prio">${["P0","P1","P2"].map(x=>`<button type="button" data-v="${x}" class="${t.prio===x?"on":""}">${x} · ${T_PRIO[x]}</button>`).join("")}</div></div>
    <div class="f"><label>Fecha límite</label><div class="pick" id="t-modo"><button type="button" data-v="off" class="${modo==="off"?"on":""}">Días vs evento</button><button type="button" data-v="fecha" class="${modo==="fecha"?"on":""}">Fecha fija</button></div></div>
    <div class="f2"><div class="f" id="w-off"><label>Días vs evento (− antes, + después)</label><input id="t-off" type="number" value="${tieneOff(t)?t.off:""}" placeholder="-10" /><small class="dim" id="t-off-lbl"></small></div>
      <div class="f" id="w-fecha"><label>Fecha fija</label><input id="t-fecha" type="date" value="${esc(t.fecha||"")}" /></div></div>
    <div class="f2"><div class="f"><label>Estado</label><select id="t-est">${Object.entries(T_ESTADOS).map(([k,l])=>`<option value="${k}" ${t.estado===k?"selected":""}>${l}</option>`).join("")}</select></div>
      <div class="f"><label>Entregable (link)</label><input id="t-link" class="mono" value="${esc(t.link||"")}" placeholder="https://…" /></div></div>
    <div class="f"><label>Detalle</label><textarea id="t-det">${esc(t.detalle||"")}</textarea></div>
    <div class="f"><label>Notas (si está trabada, por qué)</label><textarea id="t-not">${esc(t.notas||"")}</textarea></div>`,
    onOpen(){
      const sync=()=>{ const m=pickVal("#t-modo"); $("#w-off").style.opacity=m==="off"?1:.35; $("#w-fecha").style.opacity=m==="fecha"?1:.35;
        const pr=proyectos().find(x=>x.id===$("#t-proy").value), o=$("#t-off").value; $("#t-off-lbl").textContent = m==="off" ? (pr&&pr.evento ? (o!==""?`→ ${dayLabel(addDays(pr.evento,Number(o)))} (${offLabel(o)})`:"") : "este proyecto no tiene fecha de evento: usá fecha fija") : ""; };
      pickInit("#t-prio"); pickInit("#t-modo", sync); $("#t-off").oninput=sync; $("#t-proy").onchange=sync; sync();
    },
    async onSave(){
      const titulo=$("#t-tit").value.trim(); if(!titulo){ toast("Falta la tarea"); return false; }
      const m=pickVal("#t-modo"), pr=proyectos().find(x=>x.id===$("#t-proy").value);
      if(m==="off" && (!pr||!pr.evento)){ toast("Ese proyecto no tiene fecha de evento"); return false; }
      if(m==="off" && $("#t-off").value===""){ toast("Faltan los días vs evento"); return false; }
      const est=$("#t-est").value;
      const patch={titulo, proyecto:$("#t-proy").value, resp:$("#t-res").value, etapa:$("#t-eta").value.trim(), area:$("#t-area").value.trim(), prio:pickVal("#t-prio")||"P1",
        off:m==="off"?Number($("#t-off").value):null, fecha:m==="fecha"?$("#t-fecha").value:"", estado:est, link:$("#t-link").value.trim(), detalle:$("#t-det").value.trim(), notas:$("#t-not").value.trim(),
        hechaEl: est==="hecho" ? (t.hechaEl||todayStr()) : ""};
      if(id) Object.assign(t,patch); else STATE.tareas.push(Object.assign({id:uid()},patch));
      await saveState("tareas"); render();
    },
    async onDelete(){ if(!confirm("¿Borrar esta tarea?")) return false; STATE.tareas=tareas().filter(x=>x.id!==id); await saveState("tareas"); render(); }
  });
}
function plantillaDe(tipo){
  const src={pago:"sebas-nov", organico:"amelia-dic"}[tipo]; if(!src||typeof T_SEED==="undefined") return [];
  return (T_SEED.tareas[src]||[]).filter(r=>r[6]!==null).map(r=>{ const [etapa,area,titulo,detalle,resp,prio,off]=r; return {etapa,area,titulo,detalle,resp:["Sebas","Amelia","Estiven"].includes(resp)?"Cliente":resp,prio,off}; });
}
function openProyecto(id){
  const p=id?proyectos().find(x=>x.id===id):{id:"",nombre:"",cliente:"",tipo:"pago",evento:"",hora:"",notas:""};
  if(!p) return; const n=id?tareas().filter(t=>t.proyecto===id).length:0;
  openModal({ title:id?`Proyecto · <i>${esc(p.nombre)}</i>`:"Proyecto nuevo", del:!!id, body:`
    <div class="f2"><div class="f"><label>Nombre</label><input id="p-nom" value="${esc(p.nombre)}" placeholder="Webinar de…" /></div>
      <div class="f"><label>Cliente</label><input id="p-cli" value="${esc(p.cliente||"")}" /></div></div>
    <div class="f"><label>Tipo</label><div class="pick" id="p-tipo">${Object.entries(T_TIPOS).map(([k,l])=>`<button type="button" data-v="${k}" class="${p.tipo===k?"on":""}">${l}</button>`).join("")}</div></div>
    <div class="f2"><div class="f"><label>Fecha del evento</label><input id="p-ev" type="date" value="${esc(p.evento||"")}" /></div>
      <div class="f"><label>Hora</label><input id="p-hora" value="${esc(p.hora||"")}" placeholder="20:00" /></div></div>
    ${id?`<div class="mini" style="text-transform:none;letter-spacing:.04em;font-size:12px;color:var(--muted)">Si cambiás la fecha del evento, las ${tareas().filter(t=>t.proyecto===id&&tieneOff(t)).length} tareas atadas al evento se mueven solas. Las de fecha fija no.</div>`
      :`<div class="f"><label>Arrancar con plantilla</label><div class="pick" id="p-plan"><button type="button" data-v="si" class="on">Sí, cargar la checklist del tipo</button><button type="button" data-v="no">Vacío</button></div></div>`}
    <div class="f"><label>Notas</label><textarea id="p-not">${esc(p.notas||"")}</textarea></div>
    ${id?`<label class="mini" style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="p-arch" ${p.archivado?"checked":""}/> archivar (deja de verse y de avisar)</label>`:""}`,
    onOpen(){ pickInit("#p-tipo"); if(!id) pickInit("#p-plan"); },
    async onSave(){
      const nombre=$("#p-nom").value.trim(); if(!nombre){ toast("Falta el nombre"); return false; }
      const patch={nombre, cliente:$("#p-cli").value.trim(), tipo:pickVal("#p-tipo")||"pago", evento:$("#p-ev").value, hora:$("#p-hora").value.trim(), notas:$("#p-not").value.trim()};
      if(id){ const antes=p.evento; Object.assign(p,patch,{archivado:$("#p-arch").checked}); await saveState("proyectos"); if(antes&&p.evento&&antes!==p.evento) toast(`Evento movido ${diasEntre(antes,p.evento)>0?"+":""}${diasEntre(antes,p.evento)} d: las tareas se movieron con él`); }
      else { const np=Object.assign({id:uid(),archivado:false},patch); STATE.proyectos.push(np);
        if(pickVal("#p-plan")==="si"){ const pl=plantillaDe(np.tipo); if(pl.length && !np.evento){ toast("Para usar la plantilla hace falta la fecha del evento"); STATE.proyectos.pop(); return false; }
          pl.forEach(r=>STATE.tareas.push(Object.assign({id:uid(),proyecto:np.id,fecha:"",estado:"pendiente",link:"",notas:"",hechaEl:""},r,{resp:r.resp==="Cliente"?(np.cliente||"Cliente"):r.resp}))); await saveState("tareas"); }
        await saveState("proyectos"); T_F.proy=np.id; }
      render();
    },
    async onDelete(){ if(!confirm(`¿Borrar el proyecto y sus ${n} tareas? No se puede deshacer.`)) return false; STATE.proyectos=proyectos().filter(x=>x.id!==id); STATE.tareas=tareas().filter(t=>t.proyecto!==id); if(T_F.proy===id) T_F.proy=""; await saveState("proyectos"); await saveState("tareas"); render(); }
  });
}

/* ============================================================
   AVISOS AL CELULAR (ntfy)
   Mismo armado que la función primal_avisos() de supabase_schema.sql:
   un mensaje por grupo (vencidas, hoy, mañana, 3 y 7 días), no uno por tarea.
   ============================================================ */
function appUrl(){ return (STATE.config.appUrl || (location.protocol.startsWith("http") ? location.origin+location.pathname : "")).replace(/#.*$/,""); }
function avisosHoy(){
  const dias=(STATE.config.avisosDias||[7,3,1]).map(Number).filter(n=>n>0).sort((a,b)=>b-a);
  const ab=tareas().filter(t=>{ const p=proyDe(t); return tAbierta(t) && tVence(t) && !(p&&p.archivado); }).sort((a,b)=>(a.prio||"").localeCompare(b.prio||""));
  const linea=t=>{ const p=proyDe(t), cl=p?(p.cliente||p.nombre):""; return `• ${t.titulo} (${cl}${t.resp&&t.resp!=="Santi"&&t.resp!==cl?" · "+t.resp:""})`; };
  const cuerpo=(rs,cola)=>rs.slice(0,6).map(linea).join("\n")+(rs.length>6?`\n…y ${rs.length-6} más`:"")+(cola?"\n\n"+cola:"");
  const out=[]; const venc=ab.filter(t=>tFalta(t)<0), hoy=ab.filter(t=>tFalta(t)===0);
  if(venc.length) out.push({title:`Santi, vas tarde en ${venc.length} ${venc.length===1?"tarea":"tareas"}`, message:cuerpo(venc,"Si no se recuperan hoy, se corre todo lo que viene detrás."), priority:venc.some(t=>t.prio==="P0")?5:4, tags:["rotating_light"]});
  if(hoy.length) out.push({title:`Hoy vence: ${hoy.length}`, message:cuerpo(hoy,"Hoy es el día. Sin excusas."), priority:4, tags:["red_circle"]});
  dias.forEach(d=>{ const rs=ab.filter(t=>tFalta(t)===d); if(!rs.length) return;
    out.push({title:d===1?`Mañana vence: ${rs.length}`:`Faltan ${d} días: ${rs.length}`, message:cuerpo(rs, d===1?"Si mañana no está, te sacas full atrás.":`Para el ${dayLabel(addDays(todayStr(),d))}. Si no arrancas ya, llegas tarde.`), priority:d===1?4:3, tags:[d===1?"orange_circle":d<=3?"yellow_circle":"hourglass"]}); });
  const url=appUrl(); if(url) out.forEach(m=>m.click=url+"#tareas");
  return out;
}
async function mandarNtfy(msgs){
  const topic=STATE.config.ntfy; if(!topic){ toast("Falta el canal de avisos"); return 0; } let ok=0;
  for(const m of msgs){ try{ const r=await fetch(NTFY,{method:"POST",body:JSON.stringify(Object.assign({topic},m))}); if(r.ok) ok++; }catch(e){ console.error(e); } }
  return ok;
}
function openAvisos(){
  const c=STATE.config, prev=avisosHoy();
  openModal({ title:"Avisos al <i>celular</i>", saveLabel:"Guardar", body:`
    <div class="mini" style="text-transform:none;letter-spacing:.03em;font-size:12.5px;color:var(--muted);line-height:1.6">
      <b style="color:var(--ivory)">1.</b> Instala <b>ntfy</b> en el celular (App Store o Google Play, gratis, sin cuenta).<br>
      <b style="color:var(--ivory)">2.</b> En la app: <b>+</b> → Subscribe to topic → pega tu canal de abajo (servidor ntfy.sh).<br>
      <b style="color:var(--ivory)">3.</b> Toca <b>Mandar prueba</b>. Si te llega, listo.<br>
      ${sb?`<span class="ok">Nube activa:</span> los avisos salen solos a las 7:00 (todo) y a las 19:00 (lo que sigue abierto hoy o vencido), hora de Costa Rica, aunque no abras el CRM.`:`<span class="warn">Modo local:</span> todavía no salen solos. Para eso falta la nube (Supabase + Vercel, ver README). Mientras tanto, "Mandar los de hoy" los manda a mano.`}
    </div>
    <div class="f"><label>Tu canal (es privado: quien lo sepa te puede escribir)</label><input id="a-topic" class="mono" value="${esc(c.ntfy||"")}" /></div>
    <div class="f"><label>Avisar cuando falten (días)</label><input id="a-dias" class="mono" value="${esc((c.avisosDias||[7,3,1]).join(", "))}" /><small class="dim">Además siempre avisa el mismo día y las vencidas.</small></div>
    <div class="f"><label>Dirección del CRM (para que el aviso abra Tareas)</label><input id="a-url" class="mono" value="${esc(c.appUrl||appUrl())}" placeholder="https://primal-crm.vercel.app" /></div>
    <div class="f"><label>Lo que te llegaría hoy</label>
      <div class="t-prev">${!prev.length?`<span class="dim">Hoy no hay nada que avisar.</span>`:prev.map(m=>`<div><b>${esc(m.title)}</b><pre>${esc(m.message)}</pre></div>`).join("")}</div></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="btn sm" id="a-test">Mandar prueba</button><button type="button" class="btn sm" id="a-hoy" ${prev.length?"":"disabled"}>Mandar los de hoy</button><span class="mini" id="a-res" style="text-transform:none;letter-spacing:.04em;font-size:12px;align-self:center"></span></div>`,
    onOpen(){
      const leer=()=>{ c.ntfy=$("#a-topic").value.trim(); c.appUrl=$("#a-url").value.trim(); };
      $("#a-test").onclick=async()=>{ leer(); $("#a-res").textContent="mandando…"; const ok=await mandarNtfy([{title:"PRIMAL · prueba", message:"Si ves esto, los avisos de tareas te van a llegar acá.", priority:3, tags:["white_check_mark"], click:(c.appUrl||appUrl())?(c.appUrl||appUrl())+"#tareas":undefined}]); $("#a-res").innerHTML=ok?`<span class="ok">✓ enviada a ${esc(c.ntfy)}</span>`:`<span class="bad">✕ no salió (¿sin internet?)</span>`; };
      $("#a-hoy").onclick=async()=>{ leer(); $("#a-res").textContent="mandando…"; const ok=await mandarNtfy(avisosHoy()); $("#a-res").innerHTML=`<span class="ok">✓ ${ok} avisos enviados</span>`; };
    },
    async onSave(){
      const topic=$("#a-topic").value.trim().replace(/[^A-Za-z0-9_-]/g,""); if(topic.length<12){ toast("El canal tiene que tener al menos 12 letras o números"); return false; }
      c.ntfy=topic; c.appUrl=$("#a-url").value.trim(); c.avisosDias=$("#a-dias").value.split(/[ ,;]+/).map(Number).filter(n=>n>0);
      await saveState("config"); render(); toast("Avisos guardados");
    }
  });
}
