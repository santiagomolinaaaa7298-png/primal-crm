/* ============================================================
   PRIMAL · Tareas de clientes — función serverless (Vercel, proyecto primal-tareas)
   Lee `proyectos` y `tareas` del pg_state del CRM (Supabase) con la publishable key que vive en las
   variables de entorno del proyecto (SUPABASE_URL, SUPABASE_ANON_KEY): la clave nunca llega al navegador.
   Devuelve SOLO lo que se puede mostrar en público: título, etapa, área, responsable, prioridad, estado,
   fecha de vencimiento y fecha en que se hizo. Nunca notas, detalle ni links; nunca proyectos archivados,
   proyectos con `publico:false` (los internos van apagados por defecto) ni tareas con `oculta:true`.
   Misma regla de fechas que tareas.js: la tarea vence `off` días respecto del evento del proyecto, o en su fecha fija.
   ============================================================ */
const TZ = "America/Costa_Rica";
const RESP_PUBLICO = { Claude: "Equipo Primal" }; // cómo se muestra cada responsable afuera; el resto sale tal cual

function hoyCR(){
  const p = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const g = t => p.find(x => x.type === t).value; return `${g("year")}-${g("month")}-${g("day")}`;
}
function addDays(d, n){ const [y, m, dd] = d.split("-").map(Number); return new Date(Date.UTC(y, m - 1, dd + n)).toISOString().slice(0, 10); }
function esPublico(p){ return (p.publico === undefined || p.publico === null) ? p.tipo !== "interno" : !!p.publico; }
function tieneOff(t){ return t.off !== null && t.off !== undefined && t.off !== ""; }

module.exports = async (req, res) => {
  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key){ res.status(500).json({ error: "Faltan SUPABASE_URL / SUPABASE_ANON_KEY en el proyecto de Vercel" }); return; }
  let rows;
  try {
    const r = await fetch(`${url}/rest/v1/pg_state?select=key,data,updated_at&key=in.(proyectos,tareas)`, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
    if (!r.ok) throw new Error("Supabase respondió " + r.status);
    rows = await r.json();
  } catch (e){ res.status(502).json({ error: "No se pudo leer el centro de mando: " + e.message }); return; }

  const get = k => ((rows.find(x => x.key === k) || {}).data) || [];
  const actualizado = rows.map(x => x.updated_at).filter(Boolean).sort().pop() || null;
  const proyectos = get("proyectos").filter(p => !p.archivado && esPublico(p));
  const porId = Object.fromEntries(proyectos.map(p => [p.id, p]));
  const tareas = get("tareas").filter(t => porId[t.proyecto] && !t.oculta).map(t => {
    const p = porId[t.proyecto];
    const vence = (tieneOff(t) && p.evento) ? addDays(p.evento, Number(t.off)) : (t.fecha || "");
    return { id: t.id, proyecto: t.proyecto, etapa: t.etapa || "", area: t.area || "", titulo: t.titulo || "",
      resp: RESP_PUBLICO[t.resp] || t.resp || "", prio: t.prio || "", estado: t.estado || "pendiente", vence, hechaEl: t.hechaEl || "" };
  });

  res.setHeader("Cache-Control", "public, s-maxage=30, stale-while-revalidate=600");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.status(200).json({
    hoy: hoyCR(), actualizado,
    proyectos: proyectos.map(p => ({ id: p.id, nombre: p.nombre || "", cliente: p.cliente || p.nombre || "", tipo: p.tipo || "", evento: p.evento || "", hora: p.hora || "" })),
    tareas
  });
};
