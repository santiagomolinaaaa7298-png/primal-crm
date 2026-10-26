/* ============================================================
   PRIMAL · TAREAS — carga inicial (26 oct 2026)
   Cada tarea: [etapa, área, tarea, detalle, responsable, prioridad, día vs evento, fecha fija]
   "día vs evento" = cuántos días antes (−) o después (+) del evento. Si se mueve la fecha
   del evento, la tarea se mueve sola. Si es null, manda la fecha fija.
   Se carga una vez por versión (config.seedTareas); lo que edites en la app no se pisa.
   v2 (26 oct): Estiven ya no hace VSL funnel sino otro webinar; "quitar" borra el proyecto viejo.
   ============================================================ */
const T_SEED = {
  version: 2,
  quitar: ["estiven-vsl"],
  proyectos: [
    { id:"sebas-nov", nombre:"Webinar Sebas Ramos", cliente:"Sebas", tipo:"pago", evento:"2026-11-19", hora:"20:00",
      notas:"Webinar desde cero. Jueves 19 nov (el CONTEXTO decía 12: confirmar con Sebas y anotarlo). 10 días de adquisición: ads corriendo desde el lun 9, campaña y edición listas el dom 8, guiones el jue 5, equipo de ventas armado el sáb 7. Acuerdo: 50 % del profit, sin upfront." },
    { id:"amelia-dic", nombre:"Mega webinar orgánico Amelia", cliente:"Amelia", tipo:"organico", evento:"2026-12-10", hora:"19:00",
      notas:"Fecha PROPUESTA (jueves 10 dic): confirmarla con Amelia y moverla acá; todas las fechas se recalculan solas. Orgánico: no cuenta para ads. Primero rearmar el equipo de ventas y el plan de envíos." },
    { id:"estiven-dic", nombre:"Webinar Estiven", cliente:"Estiven", tipo:"pago", evento:"2026-12-03", hora:"20:00",
      notas:"Otro webinar (no VSL funnel). Fecha PROPUESTA: jueves 3 dic, 8 p. m. Colombia: confirmarla con Estiven y moverla acá; todo se recalcula. Guiones antes del 15 nov para no chocar con la semana del vivo de Sebas. Lo único de VSL que falta es el VSL de chat (va primero). Antes, ordenar ventas: el 22 oct el triaje llamó 16-19 h tarde a los calificados y el CRM quedó con 0 llamadas y 0 pagos." },
    { id:"primal", nombre:"Primal Growth · mi negocio", cliente:"Primal", tipo:"interno", evento:"", hora:"",
      notas:"Lo tuyo: la meta de 30K de profit al mes, el análisis financiero y los sistemas que te mantienen al día." }
  ],
  tareas: {
    "sebas-nov": [
      ["0 · Decisiones","Estrategia","Confirmar con Sebas el jueves 19 nov, la hora y la zona horaria","El CONTEXTO dice 12 nov: anotar el cambio con fecha. Sin fecha confirmada no se graba nada.","Santi","P0",-23,null],
      ["0 · Decisiones","Estrategia","Pedirle a Sebas las métricas de su webinar anterior y del negocio","Registros, al grupo, en vivo, al final, agendas, cierres, cash, ticket medio, % en cuotas, alcance de historias. Sin esto la ingeniería inversa es a ciegas.","Santi","P0",-22,null],
      ["0 · Decisiones","Estrategia","Ingeniería inversa del webinar: meta de cash → cierres → agendas → asistentes → registros → presupuesto","Clase 70 de Limitless (presupuesto de ads) y la proyección pesimista del CONTEXTO (3.000 registros → 50 cierres). Se hace en el chat de análisis financiero.","Santi","P0",-21,null],
      ["0 · Decisiones","Estrategia","Cerrar la oferta principal y el precio (una sola)","Proceso Millonario anual 2.500 o versión por fases. Los otros dos programas quedan de downsell. Recargo por cuotas 10-20 % (2) y 20-30 % (3).","Santi","P0",-20,null],
      ["0 · Decisiones","Ads","Presupuesto de ads aprobado por Sebas","Sale de la ingeniería inversa: adquisición + nutrición (5-10 %) + reminders (hasta 7 %) + post webinar.","Sebas","P0",-20,null],
      ["0 · Decisiones","Estrategia","Gran idea, título y promesa del webinar","Base: hacer tus primeros 5.000 dólares creando contenido viral para negocios. Resultado del modelo, no mentalidad.","Santi","P0",-19,null],
      ["0 · Decisiones","Estrategia","Validar casos de éxito con Sebas (números y permiso para usarlos)","CASOS-DE-EXITO.md: el colombiano de NY, el cubano de 19, Sara VIP.","Sebas","P1",-17,null],
      ["0 · Decisiones","Ventas","Decidir si hay preventa en el grupo","Sí → guion de preventa y link de pago exclusivo antes del jue 12. No → todo al vivo.","Santi","P2",-12,null],

      ["1 · Equipo de ventas","Ventas","Publicar la búsqueda: closers, setter/SDR, triager/confirmer y cold callers","Base: estiven-lopez/equipo/MENSAJE-BUSQUEDA-EQUIPO-VENTAS.md y el formulario de selección.","Santi","P0",-22,null],
      ["1 · Equipo de ventas","Ventas","Comisiones y contratos por rol","Base: contratos de Estiven y Amelia. Closer 7-10 %, setter 3-5 %.","Santi","P1",-17,null],
      ["1 · Equipo de ventas","Ventas","Entrevistas y selección del equipo","Role play corto con la oferta en cada entrevista.","Santi","P0",-16,null],
      ["1 · Equipo de ventas","Ventas","Equipo de ventas contratado: cada rol con alguien","Closer(s), setter/SDR, triager/confirmer, cold callers y director de ventas.","Santi","P0",-14,null],
      ["1 · Equipo de ventas","Ventas","Guion para los cold callers","Para llamar a todo lo que se mueva: registrados, gente que escribió, seguidores calientes. Corto, con calificación por presupuesto.","Claude","P0",-14,null],
      ["1 · Equipo de ventas","Ventas","Guiones de setter, confirmer, triaje y closing adaptados a Sebas","Partir de los de Estiven (ventas/) con la voz y los casos de Sebas.","Claude","P0",-13,null],
      ["1 · Equipo de ventas","Ventas","Equipo de ventas armado y entrenado (onboarding + role play)","La meta: el sábado 7 el equipo sabe la oferta, el proceso y tiene accesos.","Equipo de ventas","P0",-12,null],
      ["1 · Equipo de ventas","Ventas","Estándares, dailies y reporte diario por rol","Base: amelia-campos/ventas/ESTANDARES-Y-DAILIES.md.","Santi","P1",-11,null],
      ["1 · Equipo de ventas","Ventas","Presentación de venta para los closers","Mismo formato que Amelia y Estiven: casos, lámina puente, precio.","Claude","P1",-5,null],
      ["1 · Equipo de ventas","Ventas","Accesos de los closers (CRM, agenda, pago, recursos) y daily del vivo","Que nadie llegue al jueves sin poder cobrar.","Santi","P0",-1,null],

      ["2 · Sistemas de venta","Ventas","Otro número de WhatsApp comprado y calentándose","Si banean el principal en medio del lanzamiento, se pasa a este. Necesita unas 2 semanas de uso real.","Santi","P0",-21,null],
      ["2 · Sistemas de venta","Ventas","CRM de ventas de Sebas (leads, llamadas, pagos) vinculado a Primal","Mismo patrón que el CRM de Estiven, tabla pagos con columna usd. Así Primal calcula tu 50 % solo.","Claude","P0",-12,null],
      ["2 · Sistemas de venta","Ventas","Links exclusivos de agenda (uno por closer) y de pago para el webinar","Solo cuenta lo que entra por estos links. Los closers no conocen otros.","Santi","P0",-12,null],
      ["2 · Sistemas de venta","Ventas","SOP de pre-call (agenda directa, v3 de Estiven adaptado)","sistemas/estiven-lopez/SOP-PRE-CALL-AGENDA-DIRECTA.md.","Claude","P1",-11,null],
      ["2 · Sistemas de venta","Ventas","Número de respaldo calentado y probado","Con foto, nombre y respuestas guardadas, listo para cambiar en 5 minutos.","Santi","P1",-10,null],
      ["2 · Sistemas de venta","Ventas","Formulario de aplicación con calificación por presupuesto + pipeline de solicitudes","Para el QR del webinar. Todos agendan directo; los de 500+ salen con estrella.","Claude","P0",-7,null],
      ["2 · Sistemas de venta","Funnel","Revisar el tier del WhatsApp para el día del webinar","Que alcance para registrados × 1,5. Si está cerca del tope, avisar antes.","Santi","P1",-3,null],

      ["3 · Ads","Ads","Contratar editores (mínimo 2)","Edición mínima: b-roll, cortes, música. Lo único fuerte es la fecha grande en pantalla.","Santi","P0",-15,null],
      ["3 · Ads","Ads","Business Manager, cuenta principal y 2 cuentas de respaldo calentadas","webinars/SOP-CUENTAS-META-ANTIBAN.md.","Santi","P0",-14,null],
      ["3 · Ads","Ads","Guiones de 12 anuncios de adquisición (12 copys distintos) y 5 de nutrición","Por tópico y Script N, en crudo. Sin cifras de plata ni promesas. Variar hooks visuales.","Claude","P0",-14,null],
      ["3 · Ads","Funnel","Guion del VSL de la landing","Titular → VSL → subtítulo → botón. Solo cortes y música.","Claude","P0",-14,null],
      ["3 · Ads","Funnel","Guiones del VSL de chat y del video de la thank you","El VSL de chat va en el pre-call.","Claude","P1",-14,null],
      ["3 · Ads","Ads","Sebas graba: 12 de adquisición, 5 de nutrición, VSL, VSL de chat y thank you","Viernes 6 y sábado 7, en 3 lugares, con fondos y ropa distintos. Nada se graba sin guion aprobado.","Sebas","P0",-12,null],
      ["3 · Ads","Ads","Copys de 3 a 6 anuncios de imagen","Distintos de los de video.","Claude","P1",-12,null],
      ["3 · Ads","Ads","Todo editado: anuncios, VSL, VSL de chat y thank you","","Editores","P0",-11,null],
      ["3 · Ads","Ads","Campaña de adquisición configurada y píxel conectado en la landing","Preset de la campaña de Amelia (webinars/PRESET-CAMPANA-ADQUISICION.md). Queda en borrador hasta que la apruebes.","Santi","P0",-11,null],
      ["3 · Ads","Ads","Panel de lanzamiento de Sebas con CPL objetivo y techo","webinars/PANEL-LANZAMIENTOS.md: nuevo lanzamiento sebas-nov-2026.","Claude","P1",-11,null],
      ["3 · Ads","Ads","Prender los ads de adquisición (10 días)","Lunes 9. Desde acá se cargan las métricas cada día en el panel.","Santi","P0",-10,null],
      ["3 · Ads","Ads","Optimizar los ads a mano (todos los días hasta el vivo)","Apagar lo que pase 2 CPL objetivo sin registros. Nada de reglas automáticas.","Santi","P1",-9,null],
      ["3 · Ads","Ads","Campaña de nutrición a los opt-ins","5 a 10 % del presupuesto, con exclusiones.","Santi","P1",-6,null],
      ["3 · Ads","Ads","Ads de reminder con la fecha (prender los 3 días previos)","Apagarlos cuando arranca el vivo. Hasta 7 % del presupuesto.","Santi","P1",-3,null],

      ["4 · Funnel","Funnel","Copy de la landing y de la thank you","Thank you mínima, un solo botón al grupo.","Claude","P0",-13,null],
      ["4 · Funnel","Funnel","Landing y thank you en línea, probadas con un registro real","El registro tiene que llegar al CRM y disparar el evento.","Santi","P0",-11,null],
      ["4 · Funnel","Funnel","GHL: formulario y workflows de WhatsApp y emails con fecha, hora y link","Probar de punta a punta con un número real.","Santi","P0",-11,null],
      ["4 · Funnel","Funnel","Grupo de WhatsApp y bienvenida con recompensa por entrar","","Santi","P0",-11,null],
      ["4 · Funnel","Funnel","Secuencia de nutrición del grupo (10 días, un tema por día)","Sirve también de calendario de historias de Sebas: copiar y pegar.","Claude","P0",-11,null],
      ["4 · Funnel","Funnel","Emails de nutrición, mismo hilo que el grupo","","Claude","P1",-11,null],
      ["4 · Funnel","Funnel","Zoom Webinar de pago creado, blindado y con el link en todos lados","Chat solo con anfitrión y panelistas.","Santi","P0",-7,null],
      ["4 · Funnel","Funnel","Mensajes y emails del día del vivo programados (6 a 10)","Hasta el 'estamos en vivo' y el 'quedan 5 minutos'.","Santi","P0",-1,null],
      ["4 · Funnel","Contenido orgánico","Historias de reminder el día del evento","","Sebas","P1",0,null],

      ["5 · Webinar","Funnel","Estructura y guion del webinar","Presentación dopamínica: memes, ritmo, casos. Es lo que sostiene la retención (140 → 40 la vez pasada).","Claude","P0",-9,null],
      ["5 · Webinar","Funnel","Deck terminado con casos, oferta y QR de la aplicación","","Claude","P0",-5,null],
      ["5 · Webinar","Funnel","Ensayo completo con Sebas","","Sebas","P0",-2,null],
      ["5 · Webinar","Funnel","Check técnico, 2 panelistas y notas con todos los links","Luz, internet, audio. Probar cada link.","Santi","P0",-1,null],
      ["5 · Webinar","Funnel","Webinar en vivo","","Sebas","P0",0,null],

      ["6 · Post webinar","Ads","Ads post webinar y VSL post webinar (7 días)","","Santi","P1",1,null],
      ["6 · Post webinar","Funnel","Replay cortado y enviado a los que no entraron","","Santi","P1",1,null],
      ["6 · Post webinar","Ventas","3 días de llamadas 1 a 1 tomadas, y seguimiento a los que no agendaron","","Equipo de ventas","P0",3,null],
      ["6 · Post webinar","Ventas","Cerrar la ventana y cargar resultados en Primal (cash, cuotas, gastos, profit)","Tu 50 % es sobre el profit: ads, GHL, editores y closers se restan.","Santi","P1",7,null],
      ["6 · Post webinar","Estrategia","Retro: una cosa por área que cambia para el próximo webinar","","Santi","P2",8,null]
    ],
    "amelia-dic": [
      ["0 · Decisiones","Ventas","Decidir si se agenda a hombres","2 de los 5 pagos fueron hombres y son la mitad de los leads (Análisis externo, 25 oct).","Santi","P1",null,"2026-10-28"],
      ["0 · Decisiones","Estrategia","Retro de la masterclass del 22 oct con números","Registradas (217), asistentes, solicitudes, agendas, shows, cierres y cash. Qué rol falló y por qué.","Santi","P0",null,"2026-10-29"],
      ["0 · Decisiones","Estrategia","Fijar con Amelia la fecha del mega webinar (propuesta: jueves 10 dic)","Cuando la confirme, cambiar la fecha del proyecto: todo se recalcula.","Amelia","P0",null,"2026-10-30"],
      ["0 · Decisiones","Estrategia","Meta del webinar en cash con la ingeniería inversa","Orgánico: la meta sale de alcance de historias, registros y show, no de presupuesto.","Santi","P0",-30,null],
      ["0 · Decisiones","Estrategia","Oferta y bonus del webinar revisados con lo aprendido","Precio en directo 1.997 → 1.497 y cuotas: qué se mantiene.","Santi","P0",-28,null],
      ["0 · Decisiones","Ventas","Cold call de las 217 registradas: cerrar la ronda","campos-solicitudes.vercel.app, pestaña Registradas masterclass.","Equipo de ventas","P1",null,"2026-10-31"],

      ["1 · Equipo de ventas","Ventas","Diagnóstico del equipo actual y organigrama por rol","Closer(s), triager, confirmer, setter y director de ventas. Qué se queda, qué falta.","Santi","P0",null,"2026-11-02"],
      ["1 · Equipo de ventas","Ventas","Búsqueda y selección de los roles que faltan","equipo/CONTRATACION-WEBINAR.md.","Santi","P0",-24,null],
      ["1 · Equipo de ventas","Ventas","Onboarding y entrenamiento del equipo nuevo","Playbook, SOP de triaje V4, pre-call y role play.","Santi","P0",-14,null],
      ["1 · Equipo de ventas","Ventas","Guion de cold call para las registradas del webinar","Partir de ventas/GUION-COLD-CALL.md.","Claude","P1",-14,null],
      ["1 · Equipo de ventas","Ventas","Estándares, dailies y reporte diario funcionando","","Equipo de ventas","P1",-10,null],
      ["1 · Equipo de ventas","Ventas","Presentación de venta actualizada","","Claude","P1",-7,null],

      ["2 · Plan orgánico y envíos","Contenido orgánico","Calendario de promoción de 3 semanas","Historias, reels, directos, canal de difusión y emails. Un tema por día.","Claude","P0",-24,null],
      ["2 · Plan orgánico y envíos","Funnel","Plan de envíos: qué sale, cuándo y por dónde","WhatsApp, canal, email y DM, fase por fase (captación, nutrición, día del vivo, post).","Claude","P0",-21,null],
      ["2 · Plan orgánico y envíos","Contenido orgánico","Guiones de reels e historias de captación, con CTA y palabra clave","","Claude","P0",-21,null],
      ["2 · Plan orgánico y envíos","Funnel","Regalo por registrarse (lead magnet)","","Claude","P1",-21,null],
      ["2 · Plan orgánico y envíos","Contenido orgánico","Amelia graba el bloque de contenido de captación","","Amelia","P0",-18,null],
      ["2 · Plan orgánico y envíos","Funnel","Envíos de captación escritos","","Claude","P0",-18,null],
      ["2 · Plan orgánico y envíos","Funnel","Envíos de nutrición escritos (grupo y emails)","","Claude","P1",-12,null],
      ["2 · Plan orgánico y envíos","Funnel","Envíos del día del vivo programados, por horas","","Santi","P0",-1,null],

      ["3 · Funnel","Funnel","Landing y thank you con la fecha nueva","","Santi","P0",-21,null],
      ["3 · Funnel","Funnel","ManyChat con la palabra clave de cada reel","","Santi","P1",-21,null],
      ["3 · Funnel","Funnel","GHL: workflows con fecha, hora y link, y pipeline del webinar","","Santi","P0",-20,null],
      ["3 · Funnel","Funnel","Grupo de WhatsApp nuevo y bienvenida","","Santi","P0",-20,null],
      ["3 · Funnel","Funnel","Zoom de pago (Business o Large Meetings)","El 22 oct ya había 74 en Pro (tope 100).","Santi","P0",-14,null],

      ["4 · Webinar","Funnel","Masterclass ajustada con lo que falló el 22","","Claude","P1",-10,null],
      ["4 · Webinar","Funnel","Plan post webinar actualizado (ads, VSL, emails)","","Claude","P1",-5,null],
      ["4 · Webinar","Funnel","Ensayo completo con Amelia","","Amelia","P0",-2,null],
      ["4 · Webinar","Funnel","Webinar en vivo","","Amelia","P0",0,null],
      ["4 · Webinar","Ventas","Cerrar la ventana y cargar resultados en Primal","","Santi","P1",7,null]
    ],
    "estiven-dic": [
      ["0 · Decisiones","Ventas","Cargar en el CRM de Estiven las llamadas y pagos reales del 22 oct","Hoy figuran 0 llamadas y 0 pagos: sin eso no se mide show ni cierre, ni tu 25 %.","Santi","P0",null,"2026-10-27"],
      ["0 · Decisiones","Ventas","Respuesta de Fede sobre la repesca y fecha de la repesca","sistemas/estiven-lopez/AGENDA-REPESCA-PARA-FEDE.md.","Santi","P0",null,"2026-10-28"],
      ["0 · Decisiones","Estrategia","Retro del webinar del 22 oct con números","Qué falló: triaje tarde, 2 emails con el link de Zoom de marcador, solo 3 emails ese día. Una cosa por área que cambia.","Santi","P0",null,"2026-10-30"],
      ["0 · Decisiones","Estrategia","Fijar con Estiven la fecha del webinar (propuesta: jueves 3 dic) y el presupuesto","Cuando la confirme, cambiar la fecha del proyecto: todo se recalcula.","Estiven","P0",null,"2026-10-30"],
      ["0 · Decisiones","Estrategia","Ingeniería inversa del webinar: meta de cash → cierres → agendas → registros → presupuesto","En el chat de análisis financiero.","Santi","P0",-28,null],
      ["0 · Decisiones","Estrategia","Oferta revisada con lo que se vendió el 22","Grupo Fénix, Fénix 10K y Fénix 50K: qué se mantiene.","Santi","P1",-25,null],

      ["1 · Equipo de ventas","Ventas","Rearmar el equipo de ventas: qué rol se queda y qué falta","Closer(s), confirmer, triager de rescates, setter, cold callers y director.","Santi","P0",-24,null],
      ["1 · Equipo de ventas","Ventas","Búsqueda y selección de los roles que faltan","equipo/MENSAJE-BUSQUEDA-EQUIPO-VENTAS.md.","Santi","P0",-20,null],
      ["1 · Equipo de ventas","Ventas","Guion para los cold callers","Para llamar a todo lo que se mueva: registrados, gente que escribió, seguidores calientes.","Claude","P0",-16,null],
      ["1 · Equipo de ventas","Ventas","Equipo de ventas armado y entrenado (onboarding + role play)","","Equipo de ventas","P0",-12,null],
      ["1 · Equipo de ventas","Ventas","Presentación de venta lista (revisar la del Intensivo Fénix)","","Claude","P1",-7,null],
      ["1 · Equipo de ventas","Ventas","Accesos de los closers (CRM, agenda, pago, recursos) y daily del vivo","","Santi","P0",-1,null],

      ["2 · Sistemas de venta","Funnel","Guion del VSL de chat","Lo único de VSL que falta: Estiven nunca lo grabó. Va en el pre-call.","Claude","P0",null,"2026-10-29"],
      ["2 · Sistemas de venta","Funnel","Estiven graba el VSL de chat","","Estiven","P0",null,"2026-11-03"],
      ["2 · Sistemas de venta","Funnel","VSL de chat editado y metido en el pre-call","","Editores","P0",null,"2026-11-06"],
      ["2 · Sistemas de venta","Ventas","Otro número de WhatsApp comprado y calentándose","Si bajan el principal en medio del lanzamiento, se pasa a este. Unas 2 semanas de uso real.","Santi","P0",null,"2026-10-29"],
      ["2 · Sistemas de venta","Ventas","Sistema de ventas implementado: Calendly → Gmail → confirmer → closer","SOP-PRE-CALL-AGENDA-DIRECTA v3. Un dueño por paso para que no sea un caos.","Santi","P0",-12,null],
      ["2 · Sistemas de venta","Ventas","Links exclusivos de agenda y de pago, y CRM listo para el webinar","","Santi","P0",-12,null],
      ["2 · Sistemas de venta","Ventas","Número de respaldo calentado y probado","","Santi","P1",-10,null],
      ["2 · Sistemas de venta","Ventas","Formulario de aplicación y pipeline de solicitudes actualizados","","Claude","P1",-7,null],

      ["3 · Ads","Ads","Guiones de 12 anuncios de adquisición y 5 de nutrición","Antes de la semana del vivo de Sebas.","Claude","P0",-18,null],
      ["3 · Ads","Funnel","VSL de la landing: reusar el v4.3 o guion nuevo","","Claude","P1",-18,null],
      ["3 · Ads","Ads","Cuenta publicitaria principal y 2 de respaldo calentadas","webinars/SOP-CUENTAS-META-ANTIBAN.md.","Santi","P0",-16,null],
      ["3 · Ads","Ads","Estiven graba los anuncios (y el VSL si es nuevo)","En 3 lugares, con fondos y ropa distintos.","Estiven","P0",-15,null],
      ["3 · Ads","Ads","Todo editado","","Editores","P0",-12,null],
      ["3 · Ads","Ads","Campaña de adquisición configurada y píxel conectado","Queda en borrador hasta tu OK.","Santi","P0",-11,null],
      ["3 · Ads","Ads","Panel de lanzamiento con CPL objetivo y techo","","Claude","P1",-11,null],
      ["3 · Ads","Ads","Prender los ads de adquisición (10 días)","","Santi","P0",-10,null],
      ["3 · Ads","Ads","Optimizar los ads a mano (todos los días hasta el vivo)","","Santi","P1",-9,null],
      ["3 · Ads","Ads","Campaña de nutrición a los opt-ins","","Santi","P1",-6,null],
      ["3 · Ads","Ads","Ads de reminder con la fecha (prender los 3 días previos)","","Santi","P1",-3,null],

      ["4 · Funnel","Funnel","Landing y thank you con la fecha nueva, probadas con un registro real","","Santi","P0",-11,null],
      ["4 · Funnel","Funnel","GHL: workflows y emails con fecha, hora y link de Zoom revisados","El 22 salieron 2 emails con el link de marcador: revisar cada uno.","Santi","P0",-11,null],
      ["4 · Funnel","Funnel","Grupo de WhatsApp nuevo y bienvenida","","Santi","P0",-11,null],
      ["4 · Funnel","Funnel","Secuencia de nutrición del grupo y emails","","Claude","P0",-11,null],
      ["4 · Funnel","Funnel","Zoom de pago con el link en todos lados","","Santi","P0",-7,null],
      ["4 · Funnel","Funnel","Envíos del día del vivo programados y probados","","Santi","P0",-1,null],

      ["5 · Webinar","Funnel","Deck actualizado con lo que falló el 22","","Claude","P0",-5,null],
      ["5 · Webinar","Funnel","Ensayo completo con Estiven","","Estiven","P0",-2,null],
      ["5 · Webinar","Funnel","Check técnico y notas con todos los links","","Santi","P0",-1,null],
      ["5 · Webinar","Funnel","Webinar en vivo","","Estiven","P0",0,null],

      ["6 · Post webinar","Ads","Ads post webinar y replay","","Santi","P1",1,null],
      ["6 · Post webinar","Ventas","3 días de llamadas tomadas y seguimiento","","Equipo de ventas","P0",3,null],
      ["6 · Post webinar","Ventas","Cerrar la ventana y cargar resultados en Primal","","Santi","P1",7,null]
    ],
    "primal": [
      ["Sistemas","Sistemas","Instalar ntfy en el celular y suscribirte a tu canal de avisos","Tareas → Avisos: ahí está el canal y el botón de prueba.","Santi","P0",null,"2026-10-27"],
      ["Sistemas","Sistemas","Activar la nube del CRM (Supabase + Vercel) para que los avisos salgan solos","Sin nube, la app vive en un solo navegador y no hay avisos automáticos.","Santi","P0",null,"2026-10-27"],
      ["Sistemas","Sistemas","Push en GitHub Desktop: primal-crm y mi-negocio","","Santi","P2",null,"2026-10-27"],
      ["Finanzas","Finanzas","Sesión de análisis financiero e ingeniería inversa de métricas","Chat aparte: cuánto tiene que dejar cada cliente para llegar a los 30K de profit.","Santi","P0",null,"2026-10-28"],
      ["Finanzas","Finanzas","Meta de 30K de profit al mes repartida por cliente","Sebas (50 % del profit), Estiven (25 %), Amelia, NYLO (27,5 %) y consultoría.","Santi","P0",null,"2026-10-30"],
      ["Finanzas","Finanzas","Revisar el % de Amelia: el CRM dice 12,5 % y su CONTEXTO 25 %","","Santi","P1",null,"2026-10-30"],
      ["Finanzas","Finanzas","Cargar en Growth el cash collected de los lanzamientos del 22 oct","Estiven y Amelia. Si no se carga, el Mando miente.","Santi","P1",null,"2026-10-31"]
    ]
  }
};
