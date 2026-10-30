/* ============================================================
   PRIMAL · Formularios de onboarding
   v3 (29/10/2026, pedido de Santiago): dos formularios por cliente, con el mismo link base.
     · entrevista  → /f/{token}  La entrevista de onboarding al creador (SOP Limitless, bloques A–H).
                     De acá salen avatar, oferta, método único y estrategia de marketing.
     · asociacion  → /a/{token}  Documentos y accesos que necesita Primal para arrancar a trabajar
                     (oferta, grupos, CRMs, llamadas grabadas, Drive, Instagram, ManyChat, Ads Manager).
   Los números de pregunta y de bloque no se repiten entre formularios: comparten la tabla onb_respuestas.
   El mismo archivo lo usa la vista Onboarding del CRM (copiado en primal-crm/onboarding-preguntas.js).
   adjuntos:true → la pregunta deja subir archivos además de texto y audio.  h → ayuda chica bajo la pregunta.
   ============================================================ */

/* <<< PERSONALIZAR ACÁ: a dónde invita el cliente a Santiago cuando da accesos */
window.ONB_ACCESOS = { email:"primaltraining.co@gmail.com", whatsapp:"+57 302 4572808" };
/* >>> */
const E = window.ONB_ACCESOS.email, W = window.ONB_ACCESOS.whatsapp;

window.ONB_FORMS = {

  entrevista: {
    id:"entrevista", ruta:"f", nombre:"Entrevista de onboarding", kicker:"Onboarding",
    lead:"Antes de arrancar necesito conocerte de verdad: <b>cómo llegaste acá, qué haces distinto, a quién le das los mejores resultados y hacia dónde vas.</b> De estas respuestas salen las cuatro cosas que vamos a construir: tu avatar, tu oferta, tu método único y tu estrategia de marketing.",
    pasos:[
      ["Por texto o por audio","Cada pregunta tiene su botón para grabar desde el celular. Háblame como le hablarías a un amigo; si no te gusta cómo quedó, lo vuelves a grabar."],
      ["Nunca te quedes con la primera respuesta","Cada respuesta tiene una capa abajo. Si dices \"escucho al cliente\", cuéntame qué haces concretamente para escuchar distinto que el resto."],
      ["Se guarda solo","Puedes cerrar y volver con este mismo link: lo que respondiste sigue acá. Al final de cada bloque me lo envías."],
      ["Si todavía no tienes casos","No pasa nada: el peso cae en tu historia y tu recorrido. Sáltate lo que no aplique o cuéntame por qué no aplica."],
    ],
    fin:"Con esto tengo con qué armar tu avatar, tu oferta, tu método único y tu estrategia de marketing. Lo siguiente lo hablamos en la llamada.",
    datos:true,
    bloques:[
      { n:1, titulo:"Tu historia y tu recorrido", bajada:"Cómo llegaste acá. De acá salen la historia que vende, tu voz y tu estrategia.", preguntas:[
        { n:1, t:"Cuéntame cómo arrancaste: cómo te metiste en esto, cómo empezaste a vender o a entrenar o a hacer lo que haces, y hace cuánto tiempo exactamente." },
        { n:2, t:"¿Cómo te formaste? ¿Le compraste a alguien para arrancar, hiciste formaciones o entraste directo a la cancha? ¿Cómo fue tu experiencia antes de llegar acá?" },
        { n:3, t:"Si vienes de otro modelo o de otro servicio: ¿por qué lo dejaste? ¿Qué te agotaba? (el tiempo del 1 a 1, la cantidad de clientes en simultáneo, lo que sea)" },
        { n:4, t:"¿Cómo era tu servicio en el pasado? ¿Qué incluía y cuánto lo cobrabas, para tener un parámetro?" },
        { n:5, t:"¿Cuál fue la transición más fuerte de tu camino (trabajo tradicional → online, 1 a 1 → escala, empleado → dueño)? Cuéntala con todo el detalle que puedas: ahí suele estar el gancho de tu historia." },
      ]},
      { n:2, titulo:"Métricas y resultados", bajada:"Números concretos y en qué moneda. Son la prueba de tu método y el ticket de tu oferta.", preguntas:[
        { n:6, t:"Cuéntame tus métricas y tus mejores números. Si vendes: tasa de cierre, llamadas por día o por semana, tu mejor mes en comisiones y cuánto fue. Si entregas un servicio: cuántos clientes en simultáneo tenías y qué resultados tuvieron." },
        { n:7, t:"¿Cuánto vienes facturando por mes hoy? ¿Y el promedio de los últimos seis meses?" },
        { n:8, t:"¿Cuál fue tu mejor mes de la historia y qué estabas comunicando en ese momento? ¿Qué promesa, qué oferta?" },
        { n:9, t:"¿Tienes los resultados de tus clientes documentados (capturas, videos, testimonios)? Súbelos acá. Si un número llama la atención, cuéntame por qué pasó.", adjuntos:true },
        { n:10, t:"¿En qué país está la gente que te compra?" },
      ]},
      { n:3, titulo:"Tu método paso a paso", bajada:"Desmenuzamos tu proceso. Cada paso es una fase de tu método único y un entregable del producto.", preguntas:[
        { n:11, t:"Cuéntame tu proceso completo con el mayor detalle posible: ¿qué haces antes, durante y después de la llamada, de la entrega o del proceso con un cliente?" },
        { n:12, t:"Si tuvieras que resumirlo en los tres pasos que una persona da contigo para lograr el resultado, ¿cuáles serían? Por cada paso, el cómo concreto." },
        { n:13, t:"Si trabajaras con alguien 1 a 1: ¿qué sesiones le darías, cuántas, en qué momento y por qué? Si agarras a alguien en el nivel más bajo, ¿cómo lo llevas al nivel objetivo? Tu roadmap mental." },
        { n:14, t:"Las palabras propias que usas (un nombre para una técnica, una fase, un concepto): por cada una, ¿a qué te refieres exactamente? ¿Qué haces y qué esperas que pase?" },
      ]},
      { n:4, titulo:"Tu diferenciador", bajada:"La semilla del método único: lo que haces que el resto no hace.", preguntas:[
        { n:15, t:"¿Por qué a ti te va bien mientras que a la mayoría que hace lo mismo le va mal? ¿Qué haces distinto? Baja hasta el mecanismo concreto: \"doy buen servicio\" no me sirve." },
        { n:16, t:"¿Cuál es el error que comete casi todo el mundo en tu rubro y que tú evitas?" },
        { n:17, t:"¿Qué aplicas o aprendiste que sabes que el resto no hace? ¿Y qué fue lo que más te funcionó de todo lo que probaste?" },
      ]},
      { n:5, titulo:"Cuando estabas donde está tu cliente", bajada:"Tú, en el nivel de tu cliente de hoy, eres el mejor mapa de sus dolores.", preguntas:[
        { n:18, t:"Cuando estabas en el nivel en el que está hoy tu cliente (con esas comisiones, con ese peso, empezando), ¿cuáles eran tus problemas concretos? ¿Qué sabías que si no lo mejorabas no ibas a avanzar?" },
        { n:19, t:"En ese momento, ¿a qué le echabas la culpa? (a los leads, al marketing, al precio, a que te faltaba una herramienta, al tiempo) ¿Sabías cuál era el problema real o pensabas que era otra cosa?" },
        { n:20, t:"¿Qué decías \"ah, si tuviera esto, estaría haciendo mucho más\"? (un script, más volumen, una herramienta, un mentor) ¿Qué es lo que más te hubiera gustado tener en ese momento?" },
      ]},
      { n:6, titulo:"Tu cliente ideal", bajada:"El avatar se elige por a quién le diste los mejores resultados, no por lo que uno quiere vender.", preguntas:[
        { n:21, t:"De toda la gente que ayudaste, ¿con quién te sentiste más cómodo y a quién le diste los mejores resultados?" },
        { n:22, t:"¿Con qué tipo de cliente trabajarías mejor: principiante, intermedio o avanzado? ¿A cuál te gustaría hablarle o coachear más? ¿En qué momento de su vida o de su negocio está cuando te compra, de qué país es y cuánto gana o factura?" },
        { n:23, t:"¿Cuál fue tu peor cliente, el que te compró y te arrepentiste? ¿Qué señales tenía antes de comprar?" },
      ]},
      { n:7, titulo:"Oferta y promesa", bajada:"La transformación que vendes y cómo la quieres vender.", preguntas:[
        { n:24, t:"¿Cuál es la transformación? ¿De qué punto A sacas a tu cliente y a qué punto B lo llevas?" },
        { n:25, t:"¿Qué es lo que más te piden las personas que vienen a trabajar contigo?" },
        { n:26, t:"¿Cómo lo quieres vender: un low ticket más masivo (curso + clases grupales), un high ticket 1 a 1, o los dos en escalera de valor? ¿Qué otras ofertas tienes o tuviste?" },
        { n:27, t:"¿Hasta dónde te quieres meter en estos temas en tu contenido y tu oferta? ¿Qué NO estás dispuesto a hacer? ¿Estás dispuesto a sumar un closer o un equipo, o quieres cerrar tú?" },
      ]},
      { n:8, titulo:"Marketing y canal", bajada:"De dónde traemos el tráfico y con qué máquina.", preguntas:[
        { n:28, t:"¿De dónde vamos a traer el tráfico? ¿Qué canal tienes más fuerte hoy?" },
        { n:29, t:"¿Tienes experiencia con anuncios? ¿Corriste campañas? ¿Dónde te trabas: en el copy, en la estrategia o en las dos? ¿Tienes financiación para anuncios?" },
        { n:30, t:"¿Cómo funciona hoy tu máquina de contenido? Quién idea, quién guiona, quién graba, quién edita, quién publica, quién contesta. ¿Y cuántas horas reales por semana tienes para grabar?" },
        { n:31, t:"¿Qué quieres mostrar y qué no públicamente? ¿Contra qué o contra quién te posicionas (tu enemigo en el mercado)?" },
        { n:32, t:"¿Qué tan rápido quieres lanzar? ¿Cuáles son tus mayores cuellos de botella hoy: costo de venta, costo de marketing, funnels, oferta?" },
      ]},
      { n:9, titulo:"Cierre", bajada:"Lo que no te pregunté y el material que falta.", preguntas:[
        { n:33, t:"¿Quieres sumar, contar o preguntar algo más?" },
        { n:34, t:"Mándame lo que falte: tu competencia directa, referentes de Estados Unidos, testimonios en crudo y grabaciones de tus últimas llamadas.", adjuntos:true },
      ]},
    ],
  },

  asociacion: {
    id:"asociacion", ruta:"a", nombre:"Documentos y accesos", kicker:"Asociación · documentos y accesos",
    lead:"Para arrancar a trabajar necesito <b>ver lo que ya tienes y poder entrar donde pasa todo</b>: tu oferta, tus grupos, tus sistemas, tus llamadas, tu material y tus cuentas. Nada de esto tiene que estar perfecto: mándamelo como esté.",
    pasos:[
      ["Sube, pega o cuéntame","Cada punto deja subir archivos, pegar links o responderme por audio si es más rápido explicarlo hablando."],
      ["Nunca me mandes contraseñas","Para cada cuenta te digo cómo invitarme. Si una plataforma no deja invitar, dímelo acá y lo resolvemos por el chat."],
      ["Se guarda solo","Puedes cerrar y volver con este mismo link: lo que subiste sigue acá. Al final de cada bloque me lo envías."],
      ["Si algo no lo tienes","Dímelo igual: \"no tengo CRM\" también es información."],
    ],
    fin:"Con esto puedo entrar a trabajar de verdad. Lo que falte lo vamos cerrando por el chat.",
    datos:false,
    bloques:[
      { n:11, titulo:"Tu oferta", bajada:"Todo lo que ya existe sobre lo que vendes.", preguntas:[
        { n:51, t:"Todos los documentos de tu oferta que tengas: PDF o presentación de venta, página de venta, lista de precios, contrato, garantía, guion de venta. Súbelos acá o pega los links.", adjuntos:true },
        { n:52, t:"Tu programa por dentro: ¿dónde vive (Skool, Notion, Drive, Kajabi, Hotmart…), qué módulos tiene, cómo es el onboarding del alumno y el calendario de sesiones?", h:`Si puedes, agrégame como alumno o admin con ${E} y pega acá el link.` },
      ]},
      { n:12, titulo:"Tus grupos", bajada:"Donde están tus clientes hablando.", preguntas:[
        { n:53, t:"Métеme a todos los grupos de clientes y de comunidad que tengas (WhatsApp, Telegram, Skool, Discord). Pega acá los links de invitación o confírmame que ya me agregaste.", h:`Mi WhatsApp: ${W}. Mi email: ${E}.` },
      ]},
      { n:13, titulo:"CRMs y sistemas de medición", bajada:"Con qué organizas y mides hoy.", preguntas:[
        { n:54, t:"¿Qué usas para organizar y medir? CRM, agenda (Calendly, Cal.com), pagos (Stripe, Hotmart, PayPal), formulario de aplicación (Typeform, Google Forms), planillas, ManyChat, email marketing. Dame acceso a cada uno y anótame acá cuáles son y con qué email entré.", h:`Invítame con ${E}. Si una herramienta no deja invitar, dímelo acá.` },
        { n:55, t:"Exporta y sube: las respuestas de tu formulario de aplicación (CSV) y tus ventas de los últimos 6 a 12 meses (export de la pasarela o tu planilla: fecha, cliente, monto, moneda, producto, país, reembolsos).", adjuntos:true },
        { n:56, t:"Tus costos mensuales actuales: herramientas, anuncios, comisiones de pasarela, freelancers, equipo. Un número aproximado por rubro alcanza.", h:"Es la base para calcular el profit del acuerdo desde el día uno." },
      ]},
      { n:14, titulo:"Llamadas grabadas", bajada:"Lo que más me sirve de todo: cómo vendes y cómo hablan tus clientes.", preguntas:[
        { n:57, t:"Todas las llamadas de venta que tengas grabadas (Fathom, Zoom, Meet, Loom, celular). Pega los links o sube los archivos. Mientras más, mejor.", adjuntos:true, h:"Si están en Fathom, compárteme el equipo o cada grabación con mi email." },
        { n:58, t:"Las llamadas con clientes: sesiones, onboarding, seguimiento, cierre de programa. Pega los links o sube los archivos.", adjuntos:true },
      ]},
      { n:15, titulo:"Tu material visual", bajada:"Para armar historias, anuncios y contenido sin tener que pedirte una foto cada vez.", preguntas:[
        { n:59, t:"Un Drive con todas tus fotos y videos: crudos, b-roll, detrás de cámara, viajes, entrenando, trabajando, con clientes, lo que sea. Pega el link con permiso de edición.", h:"No lo filtres: mándame todo y yo elijo." },
        { n:60, t:"Logo, colores, tipografías y cualquier material de marca que tengas (plantillas, portadas, miniaturas).", adjuntos:true },
      ]},
      { n:16, titulo:"Accesos a tus cuentas", bajada:"Invítame; nunca me mandes contraseñas.", preguntas:[
        { n:61, t:"Instagram: agrégame desde Meta Business Suite (Configuración → Personas → Agregar) o desde la app (Configuración → Centro de cuentas → Compartir acceso). Confírmame acá cuando esté hecho y con qué cuenta.", h:`Invítame con ${E}.` },
        { n:62, t:"ManyChat: Settings → Team Members → Invite, como Admin. Confírmame acá. Si no usas ManyChat, dímelo.", h:`Invítame con ${E}.` },
        { n:63, t:"Ads Manager / Business Manager: si tienes cuenta publicitaria, agrégame como admin de la cuenta y del Business Manager (Configuración del negocio → Personas). Si nunca corriste anuncios, dímelo acá.", h:`Invítame con ${E}.` },
        { n:64, t:"Otros accesos que me sirvan: YouTube, TikTok, página web y dominio, email marketing, Calendly. Anota cuáles diste y a qué email." },
      ]},
      { n:17, titulo:"Lo que falta", bajada:"Por si me olvidé de algo.", preguntas:[
        { n:65, t:"¿Hay algo más que tengas y creas que me sirve? Lo que sea: una base de datos de leads, un curso viejo, un webinar grabado, una lista de email, una encuesta que hiciste.", adjuntos:true },
      ]},
    ],
  },
};

/* Compatibilidad: ONB_BLOQUES sigue siendo la entrevista (lo usan el CRM y app.js). */
window.ONB_BLOQUES = window.ONB_FORMS.entrevista.bloques;

/* ¿A qué programa entra? Opciones de circulito en "Antes de empezar". */
window.ONB_PROGRAMAS = ["Webinar 10K", "Consultoría 90 días", "Asociación con Primal Growth"];

window.ONB_DATOS = [
  { k:"programa", l:"¿A qué programa vas a ingresar?", tipo:"opciones" },
  { k:"nombre",   l:"Tu nombre",                ph:"Nombre y apellido" },
  { k:"marca",    l:"Tu marca o negocio",       ph:"Cómo se llama lo que vendes" },
  { k:"pais",     l:"País y ciudad",            ph:"Dónde vives hoy" },
  { k:"zona",     l:"Zona horaria",             ph:"" },
  { k:"whatsapp", l:"WhatsApp",                 ph:"+00 000 000 000", type:"tel" },
  { k:"email",    l:"Email",                    ph:"tu@email.com", type:"email" },
  { k:"instagram",l:"Instagram u otra red principal", ph:"@tuusuario" },
];
