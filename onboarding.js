/* ============================================================
   PRIMAL · VISTA ONBOARDING (consultoría done with you)
   Lee lo que los clientes responden en la página de onboarding (repo primal-onboarding).
   Mismo Supabase que el CRM. Las tablas onb_* están cerradas: todo pasa por las funciones
   onb_admin_* con la clave de admin (se crea la primera vez desde acá y queda en este navegador).
   ============================================================ */
const ONB_URL = "https://onboarding.primalgrowth.co";   // ← dirección pública de la página de onboarding (también responde primal-onboarding.vercel.app)
const ONB_BUCKET = "onboarding";
const ONB_KEY = "primal-onb-clave";
let ONB = { clave:(()=>{ try{ return localStorage.getItem(ONB_KEY)||""; }catch(e){ return ""; } })(), lista:null, ver:null, error:"", hayClave:null };

/* v4 (30/10/2026): un solo formulario por cliente (entrevista A–H + documentos y accesos), link /f/{token}. */
const ONB_FORMAS = Object.values(ONB_FORMS);
const ONB_TOTAL = (f=ONB_FORMS.onboarding) => f.bloques.reduce((a,b)=>a+b.preguntas.length,0);
/* Link limpio + código: el token santino-ed467 se manda como onboarding.primalgrowth.co/santino y código ed467.
   El link con el token completo sigue entrando directo. */
const onbParte = t => { const m=/^(.+)-([0-9a-f]{5})$/.exec(t||""); return m ? { slug:m[1], code:m[2] } : { slug:t, code:"" }; };
const onbLink = t => `${ONB_URL}/${onbParte(t).slug}`;
const onbMensaje = t => { const p=onbParte(t); return `Tu onboarding: ${onbLink(t)}\nCódigo: ${p.code}`; };
const onbEnviadosDe = (c, f) => f.bloques.filter(b=>(c.enviados||{})[b.n]).length;
const onbRespondidasDe = (c, f) => { const R=c.respuestas||{}; return f.bloques.flatMap(b=>b.preguntas).filter(p=>onbRespondida(R[p.n])).length; };
const onbAudioUrl = p => sb.storage.from(ONB_BUCKET).getPublicUrl(p).data.publicUrl;
const onbRespondida = r => r && ((r.texto||"").trim() || (r.audios||[]).length || (r.archivos||[]).length);
const onbFecha = s => s ? new Date(s).toLocaleString("es", { day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" }) : "";
const onbDur = s => { s=Math.round(s||0); return `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`; };

async function onbCargar(){
  if(!sb){ ONB.error="El CRM está en modo local: el onboarding necesita Supabase."; return; }
  if(ONB.hayClave===null){ const { data } = await sb.rpc("onb_admin_hay_clave"); ONB.hayClave=!!data; }
  if(!ONB.clave) return;
  const { data, error } = await sb.rpc("onb_admin_lista", { p_clave:ONB.clave });
  if(error){ ONB.error = /clave/.test(error.message) ? "Clave incorrecta." : error.message; if(/clave/.test(error.message)){ ONB.clave=""; try{ localStorage.removeItem(ONB_KEY); }catch(e){} } return; }
  ONB.error=""; ONB.lista=data||[];
}

async function renderOnboarding(){
  const el=$("#view-onboarding");
  if(ONB.lista===null && !ONB.error) { el.innerHTML=`<div class="empty" style="padding:40px">Cargando…</div>`; await onbCargar(); if(VIEW!=="onboarding") return; }
  if(!ONB.clave) return onbLogin(el);
  if(ONB.ver) return onbDetalle(el);
  const L=ONB.lista||[];
  el.innerHTML=`
  <div class="filters" style="margin-top:18px">
    <span class="eyebrow" style="margin:0">Onboarding · consultoría done with you</span>
    <span class="spacer"></span>
    <button class="btn sm ghost" onclick="ONB.lista=null;render()">Actualizar</button>
    <button class="btn sm gold" onclick="onbNuevo()">+ Cliente</button>
  </div>
  ${ONB.error?`<div class="panel" style="padding:14px 18px"><span class="bad">${esc(ONB.error)}</span></div>`:""}
  ${!L.length?`<div class="panel"><div class="empty" style="padding:28px">Todavía no hay clientes. Crea uno con <b>+ Cliente</b> y mándale su link.</div></div>`:
  `<section class="onb-grid">${L.map(c=>{ const env=onbEnviadosDe(c,ONB_FORMS.onboarding), nb=ONB_BLOQUES.length;
    return `<article class="panel onb-card" onclick="onbAbrir('${esc(c.token)}')">
      <div class="onb-top"><div><b class="onb-nm">${esc(c.nombre)}</b><div class="mini">${esc((c.datos&&c.datos.programa)||c.oferta||"")}</div></div>
        <span class="tag ${env>=nb?"ok":c.respondidas?"ember":""}">${env>=nb?"Completo":c.abierto_at?(c.respondidas?"Respondiendo":"Abrió el link"):"Sin abrir"}</span></div>
      <div class="onb-bar"><i style="width:${Math.round(c.respondidas/ONB_TOTAL()*100)}%"></i></div>
      <div class="onb-nums"><span><b>${c.respondidas}</b>/${ONB_TOTAL()} respondidas</span><span><b>${c.audios}</b> audios</span><span><b>${env}</b>/${nb} bloques</span></div>
      <div class="onb-link" onclick="event.stopPropagation()"><code>${esc(onbLink(c.token).replace(/^https?:\/\//,""))}</code> <code title="Código">${esc(onbParte(c.token).code)}</code>
        <button class="btn xs" onclick="onbCopiar('${esc(c.token)}')">Copiar link + código</button></div>
      <div class="mini" style="text-transform:none;letter-spacing:.04em">${c.actualizado_at&&c.respondidas?"Última respuesta "+onbFecha(c.actualizado_at):"Creado "+onbFecha(c.creado_at)}</div>
    </article>`; }).join("")}</section>`}`;
}

function onbLogin(el){
  const nueva=ONB.hayClave===false;
  el.innerHTML=`<div class="panel" style="max-width:460px;margin:40px auto;padding:28px">
    <span class="eyebrow">Onboarding</span>
    <h3 style="font-family:var(--display);font-style:italic;font-size:30px;margin:12px 0 6px">${nueva?"Crea tu clave":"Entra con tu clave"}</h3>
    <div class="mini" style="text-transform:none;letter-spacing:.03em;font-size:12.5px;color:var(--muted);margin-bottom:16px">${nueva?"Es la primera vez: elige una clave de al menos 8 caracteres. Protege las respuestas de tus clientes (el resto del CRM no la pide). Queda guardada en este navegador.":"Las respuestas de los clientes están protegidas con tu clave de onboarding."}</div>
    ${ONB.error?`<div class="bad" style="margin-bottom:10px">${esc(ONB.error)}</div>`:""}
    <div class="f"><label>Clave</label><input id="onb-clave" type="password" autocomplete="${nueva?"new-password":"current-password"}" /></div>
    <button class="btn gold" id="onb-entrar" style="margin-top:14px">${nueva?"Crear y entrar":"Entrar"}</button></div>`;
  const go=async()=>{ const v=$("#onb-clave").value; if(!v) return;
    if(nueva){ const { error } = await sb.rpc("onb_admin_init", { p_clave:v }); if(error){ ONB.error=error.message; return render(); } ONB.hayClave=true; }
    ONB.clave=v; try{ localStorage.setItem(ONB_KEY, v); }catch(e){} ONB.lista=null; ONB.error=""; render(); };
  $("#onb-entrar").onclick=go; $("#onb-clave").onkeydown=e=>{ if(e.key==="Enter") go(); };
}

function onbNuevo(){
  openModal({ title:"Nuevo cliente · <i>onboarding</i>", saveLabel:"Crear link", body:`
    <div class="f"><label>Nombre (como lo saludamos)</label><input id="on-nombre" placeholder="Viteri" /></div>
    <div class="f"><label>Oferta</label><select id="on-oferta">${ONB_PROGRAMAS.map(o=>`<option>${esc(o)}</option>`).join("")}<option value="">Que lo elija el cliente</option></select></div>
    <div class="f"><label>Inicio del link (opcional)</label><input id="on-slug" class="mono" placeholder="viteri" /></div>
    <div class="mini" style="text-transform:none;letter-spacing:.03em">El cliente recibe <code>onboarding.primalgrowth.co/viteri</code> y un código de 5 caracteres (al azar, para que nadie entre adivinando el nombre).</div>`,
    async onSave(){ const nombre=$("#on-nombre").value.trim(); if(!nombre){ toast("Falta el nombre"); return false; }
      const { data, error } = await sb.rpc("onb_admin_crear", { p_clave:ONB.clave, p_nombre:nombre, p_oferta:$("#on-oferta").value, p_slug:$("#on-slug").value.trim() });
      if(error){ toast(error.message); return false; }
      ONB.lista=null; setTimeout(()=>onbCopiar(data),300); render(); } });
}

async function onbCopiar(t){
  const l=onbMensaje(t);
  try{ await navigator.clipboard.writeText(l); toast("Link y código copiados"); }
  catch(e){ prompt("Copia el link y el código:", l); }
}

async function onbAbrir(t){
  const { data, error } = await sb.rpc("onb_admin_ver", { p_clave:ONB.clave, p_token:t });
  if(error||!data){ toast(error?error.message:"No encontré ese cliente"); return; }
  ONB.ver=data; render(); window.scrollTo({top:0});
}

function onbTextoPlano(c){
  const d=c.datos||{}, R=c.respuestas||{};
  let s=`ONBOARDING · ${c.nombre}${c.oferta?" · "+c.oferta:""}\n`;
  for(const x of ONB_DATOS) if(d[x.k]) s+=`${x.l}: ${d[x.k]}\n`;
  for(const f of ONB_FORMAS){
    f.bloques.forEach((b,i)=>{ s+=`\n## ${i+1}. ${b.titulo}\n`;
      for(const p of b.preguntas){ const r=R[p.n]||{}; s+=`\n${p.n}. ${p.t}\n${(r.texto||"").trim()||"(sin texto)"}\n`;
        (r.audios||[]).forEach((a,i)=>s+=`[Audio ${i+1} · ${onbDur(a.dur)}] ${onbAudioUrl(a.path)}\n`);
        (r.archivos||[]).forEach(a=>s+=`[Archivo] ${a.nombre}: ${onbAudioUrl(a.path)}\n`); } }); }
  return s;
}

function onbDetalle(el){
  const c=ONB.ver, d=c.datos||{}, R=c.respuestas||{};
  const resp=Object.values(R).filter(onbRespondida).length;
  el.innerHTML=`
  <div class="filters" style="margin-top:18px">
    <button class="btn sm ghost" onclick="ONB.ver=null;ONB.lista=null;render()">← Todos</button>
    <span class="spacer"></span>
    <button class="btn sm ghost" onclick="onbCopiar('${esc(c.token)}')">Copiar link + código</button>
    <button class="btn sm ghost" onclick="navigator.clipboard.writeText(onbTextoPlano(ONB.ver)).then(()=>toast('Copiado en texto'))">Copiar todo en texto</button>
    <button class="btn sm ghost" onclick="onbAbrir('${esc(c.token)}')">Actualizar</button>
  </div>
  <section class="panel onb-head">
    <div><span class="eyebrow">${esc(d.programa||c.oferta||"Onboarding")}</span>
      <h2 class="onb-h">${esc(d.nombre||c.nombre)}</h2>
      <div class="mini" style="text-transform:none;letter-spacing:.04em">${resp}/${ONB_TOTAL()} respondidas · ${onbEnviadosDe(c,ONB_FORMS.onboarding)}/${ONB_BLOQUES.length} bloques enviados${c.actualizado_at?" · última actividad "+onbFecha(c.actualizado_at):""} · <code style="text-transform:none">${esc(onbLink(c.token).replace(/^https?:\/\//,""))}</code> · código <code>${esc(onbParte(c.token).code)}</code></div></div>
    <dl class="onb-datos">${ONB_DATOS.filter(x=>d[x.k]).map(x=>`<div><dt>${esc(x.l)}</dt><dd>${x.k==="whatsapp"?`<a href="https://wa.me/${esc(String(d[x.k]).replace(/\D/g,""))}" target="_blank" rel="noopener">${esc(d[x.k])}</a>`:x.k==="email"?`<a href="mailto:${esc(d[x.k])}">${esc(d[x.k])}</a>`:esc(d[x.k])}</dd></div>`).join("")||`<div class="mini">Todavía no completó sus datos.</div>`}</dl>
  </section>
  ${ONB_FORMAS.map(f=>f.bloques.map((b,i)=>{ const env=(c.enviados||{})[b.n];
    return `<section class="panel onb-bloque">
      <div class="onb-bh"><span class="onb-bn">${String(i+1).padStart(2,"0")}</span><b>${esc(b.titulo)}</b><span class="spacer"></span>
        <span class="tag ${env?"ok":""}">${env?"Enviado "+onbFecha(env):"Sin enviar"}</span></div>
      ${b.preguntas.map(p=>{ const r=R[p.n]||{};
        return `<div class="onb-q ${onbRespondida(r)?"":"vacia"}"><div class="onb-qt"><span>${p.n}</span>${esc(p.t)}</div>
          ${(r.texto||"").trim()?`<div class="onb-txt">${esc(r.texto)}</div>`:""}
          ${(r.audios||[]).map((a,i)=>`<div class="onb-audio"><span class="mini">Audio ${i+1} · ${onbDur(a.dur)}</span><audio controls preload="none" src="${esc(onbAudioUrl(a.path))}"></audio><a class="mini" href="${esc(onbAudioUrl(a.path))}" download target="_blank" rel="noopener">descargar</a></div>`).join("")}
          ${(r.archivos||[]).map(a=>`<div class="onb-audio"><span class="mini">Archivo</span><a href="${esc(onbAudioUrl(a.path))}" target="_blank" rel="noopener">${esc(a.nombre)}</a></div>`).join("")}
          ${onbRespondida(r)?"":`<div class="mini">Sin responder</div>`}</div>`; }).join("")}
    </section>`; }).join("")).join("")}`;
}
