# PRIMAL · Centro de mando financiero

CRM de finanzas personales + del negocio en un solo lugar. Misma arquitectura que el Content OS / YouTube OS:
**HTML estático + Supabase (opcional) + GitHub + Vercel**. Sin build, sin Node.

## Qué tiene
- **Barra de mando**: ámbito (Todo / Personal / Negocio), mes, estado de la nube.
- **Captura rápida** (línea de comando): `-45 uber #transporte @bac p` → Enter. `+2500 Cliente cuota 1/3 #ventas @wise n`. Atajos: `/` enfoca, `ayer`, `12/10`, `2.5k`. Si el concepto empieza con el nombre de un cliente, se le asigna solo.
- **Mando**: cash disponible + runway, ingresos/gastos del mes vs anterior, objetivo del mes, **Skyline** (12 meses: ingresos oro, gastos carmesí rayado, neto en marfil; clic en un mes lo abre), cascada del mes (ingresos → fijos → variables → ahorro → neto), cuentas, por cobrar, próximos cargos, top categorías.
- **Movimientos**: feed por día o tabla, filtros, buscador, export CSV. Clic en cualquiera para editar o borrar.
- **Clientes & cobros**: contrato, plan de cuotas, cobrado vs pendiente. "Cobrar" crea el ingreso del negocio y marca la cuota pagada.
- **Recurrentes**: cargos fijos (alquiler, herramientas, salarios…). "Registrar" crea el gasto del mes con un clic.
- **Config**: wordmark, objetivos mensuales, tipo de cambio CRC, cuentas, categorías, export/import JSON, datos de ejemplo, reset.

## Sistema visual
- Negro cálido, oro champán como señal (ingresos, acentos, botón principal), marfil para texto y neto, rojo profundo solo para gastos y saldos negativos. Display: Bodoni Moda itálica; números: Bodoni Moda regular; cuerpo: Manrope; etiquetas y datos auxiliares: IBM Plex Mono. Sin logo por ahora (solo wordmark).
- Logo: `assets/gorila-oro.png` (gorila original en oro, fondo transparente) dentro de un escudo SVG. También `gorila-blanco.png`, `favicon.png` y el original `logo.jpg`.
- Paleta del gráfico validada (daltonismo y contraste sobre #050505): oro vs carmesí ΔE 18.8 deutan, 27.4 visión normal.

## Reglas de cálculo
- Todo se muestra en USD. Un movimiento en CRC se convierte con el tipo de cambio de Config.
- Saldo de cuenta = saldo inicial + ingresos − gastos ± transferencias.
- Runway = cash del ámbito ÷ promedio de gastos de los últimos 3 meses.
- Fijos = categorías Vivienda, Suscripciones, Servicios, Herramientas, Equipo, Salarios, Seguro, Deuda. Ahorro e Inversión salen de caja pero se muestran aparte.

## Deploy (10 minutos)
1. **Supabase** → New project → SQL Editor → pegar `supabase_schema.sql` → Run.
2. Project Settings → API → copiar **Project URL** y **anon/publishable key** (nunca la service_role).
3. Pegarlas en `app.js`, bloque `<<< PERSONALIZAR ACÁ` (`SUPABASE_URL`, `SUPABASE_ANON_KEY`).
4. GitHub → repo privado con esta carpeta → Vercel → Add New → Project → preset **Other** → Deploy.

Sin credenciales todo funciona en modo local (localStorage del navegador). Para ver el diseño con datos: Config → "Cargar datos de ejemplo" (se borran con un botón).

## Archivos
- `index.html` · `styles.css` · `app.js` — la app.
- `supabase_schema.sql` — 2 tablas: `pg_movimientos` y `pg_state`.
- `vercel.json` — config de deploy.
- `assets/` — referencias de marca (logo gorila anterior, captura del perfil de IG).
