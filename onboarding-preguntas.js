/* ============================================================
   PRIMAL · Formulario de onboarding done with you
   Fuente: mi-negocio/primal-growth/consultoria/FORMULARIO-ONBOARDING-DWY.md (39 preguntas, 9 bloques).
   Copia de primal-onboarding/preguntas.js: si cambian las preguntas, copiar el archivo de nuevo.
   adjuntos:true → la pregunta deja subir archivos además de texto y audio.
   ============================================================ */
window.ONB_BLOQUES = [
  { n:1, titulo:"Tu historia", bajada:"Quién eres, de dónde vienes y qué te mueve. De acá sale tu voz.", preguntas:[
    { n:1, t:"¿Quién eres? Cuéntame de ti como se lo contarías a alguien que no te conoce: edad, de dónde eres, dónde vives, a qué te dedicas." },
    { n:2, t:"¿Cómo arrancaste en esto? ¿Qué estabas haciendo antes y qué te hizo dar el salto?" },
    { n:3, t:"¿Hace cuánto lo haces exactamente?" },
    { n:4, t:"¿Cuál fue el momento más difícil del camino? ¿Y cuál fue el punto de quiebre, el momento en que todo cambió?" },
    { n:5, t:"¿Cómo te formaste? ¿Le compraste a alguien, hiciste cursos, o aprendiste en la cancha?" },
    { n:6, t:"¿Por qué haces lo que haces? Más allá del dinero, ¿qué te mueve?" },
    { n:7, t:"¿Cómo cambió tu vida desde que haces esto? No solo en lo económico: tu tiempo, tu familia, tu salud, tu forma de pensar, tu estilo de vida." },
  ]},
  { n:2, titulo:"Qué haces hoy", bajada:"Lo que vendes, a quién y los resultados que ya diste.", preguntas:[
    { n:8, t:"¿Qué vendes hoy? Cuéntame cada producto o servicio: qué incluye, cuánto dura y cuánto cuesta." },
    { n:9, t:"¿A quién le vendes? Describe a tu cliente típico: edad, país, a qué se dedica, cuánto gana, qué le pasa cuando te encuentra." },
    { n:10, t:"¿Cuál es el mejor resultado que le has dado a un cliente? Cuéntame el antes y el después con el mayor detalle posible." },
    { n:11, t:"¿Tienes otros casos de clientes con resultados? ¿Los tienes documentados (capturas, videos, testimonios)?", adjuntos:true },
    { n:12, t:"¿Quién fue tu peor cliente y qué señales tenía antes de comprarte?" },
  ]},
  { n:3, titulo:"Tu método y tu vehículo único", bajada:"Lo que haces distinto. Acá vive lo que nadie más puede vender.", preguntas:[
    { n:13, t:"Si alguien trabaja contigo, ¿qué pasa paso a paso? Resúmelo en 3 a 5 pasos." },
    { n:14, t:"¿Por qué a ti te funciona y a la mayoría que hace lo mismo no? ¿Qué haces distinto?" },
    { n:15, t:"¿Cuál es el error que casi todos cometen en tu rubro y tú evitas?" },
    { n:16, t:"¿Tienes algo que nadie más tiene? Una herramienta, una app, un sistema, una forma de explicar, una palabra propia. Cuéntame todo." },
    { n:17, t:"¿Hay alguien en tu mercado que admires o que sea tu referente? ¿Y alguien contra quien te posiciones?" },
  ]},
  { n:4, titulo:"Números", bajada:"Sin juicio: con números reales armamos una estrategia real.", preguntas:[
    { n:18, t:"¿Cuánto facturaste en los últimos 3 meses, mes por mes? ¿Y cuánto te quedó de ganancia?" },
    { n:19, t:"¿Cuál fue tu mejor mes de la historia? ¿Qué estabas vendiendo y comunicando en ese momento?" },
    { n:20, t:"¿Cómo te llegan los clientes hoy? (Instagram, YouTube, TikTok, DMs, referidos, anuncios) ¿Cuál es el que más te trae?" },
    { n:21, t:"Si vendes por llamada: ¿cuántas llamadas haces por semana y cuántas cierras?" },
    { n:22, t:"¿Has corrido anuncios? ¿Cuánto invertiste y qué pasó?" },
    { n:23, t:"¿Cuánto puedes invertir en anuncios al mes a partir de ahora?" },
  ]},
  { n:5, titulo:"Tu equipo y tus herramientas", bajada:"Quién hace qué y con qué.", preguntas:[
    { n:24, t:"¿Quién trabaja contigo hoy y qué hace cada uno? (socio, setter, closer, editor, community manager)" },
    { n:25, t:"¿Qué herramientas usas? (CRM, agenda, pagos, Manychat, plataforma de cursos, comunidad)" },
    { n:26, t:"¿Cómo funciona hoy tu contenido? ¿Quién idea, quién graba, quién edita y quién publica?" },
  ]},
  { n:6, titulo:"Tu objetivo", bajada:"A dónde vamos, en números y en vida.", preguntas:[
    { n:27, t:"¿Qué quieres lograr en estos meses que vamos a trabajar? Dame un número y dame lo que no es número." },
    { n:28, t:"¿Qué tiene que pasar para que al final digas \"esto valió completamente la pena\"?" },
    { n:29, t:"¿Dónde te ves en 1 año y en 3 años? ¿Qué tipo de negocio y qué tipo de vida quieres tener?" },
  ]},
  { n:7, titulo:"Lo que te frena", bajada:"Lo que hoy se interpone entre tú y ese objetivo.", preguntas:[
    { n:30, t:"¿Qué es lo que más te frena hoy para llegar a ese objetivo?" },
    { n:31, t:"¿Qué has intentado hasta ahora para resolverlo? ¿Qué funcionó y qué no?" },
    { n:32, t:"¿Has trabajado antes con otro mentor, agencia o consultor? ¿Cómo te fue y por qué?" },
    { n:33, t:"¿Qué NO estás dispuesto a hacer? (mostrar ciertas cosas, vender de cierta forma, dedicar cierto tiempo)" },
  ]},
  { n:8, titulo:"Disponibilidad", bajada:"Para armar un calendario que de verdad puedas cumplir.", preguntas:[
    { n:34, t:"¿Cuántas horas reales a la semana tienes para trabajar en esto?" },
    { n:35, t:"¿Cuántas horas a la semana puedes grabar contenido?" },
    { n:36, t:"¿Qué días y horarios te sirven para nuestras sesiones? ¿En qué zona horaria estás?" },
    { n:37, t:"¿Qué fechas tienes ocupadas en los próximos 3 meses? (viajes, eventos, vacaciones)" },
  ]},
  { n:9, titulo:"Lo que quieras contarme", bajada:"Todo lo que no te pregunté y suma.", preguntas:[
    { n:38, t:"¿Hay algo que no te pregunté y que creas que tengo que saber? Contexto de tu vida, de tu negocio, de un socio, de un proyecto en paralelo, lo que sea." },
    { n:39, t:"Mándame todo lo que tengas: links de tus redes, tu página, tu oferta en PDF, grabaciones de llamadas de venta, testimonios. Todo suma.", adjuntos:true },
  ]},
];

window.ONB_DATOS = [
  { k:"nombre",   l:"Tu nombre",                ph:"Nombre y apellido" },
  { k:"marca",    l:"Tu marca o negocio",       ph:"Cómo se llama lo que vendes" },
  { k:"pais",     l:"País y ciudad",            ph:"Dónde vives hoy" },
  { k:"zona",     l:"Zona horaria",             ph:"" },
  { k:"whatsapp", l:"WhatsApp",                 ph:"+00 000 000 000", type:"tel" },
  { k:"email",    l:"Email",                    ph:"tu@email.com", type:"email" },
  { k:"instagram",l:"Instagram u otra red principal", ph:"@tuusuario" },
];
