# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Proyecto

Sistema de Mapeo de Almacén WMS para la Corporación Hacia un Valle Solidario (CHVS). Visualiza zonas del almacén (cuartos fríos y pisos) con códigos de barras generados dinámicamente y permite impresión por zona.

## Cómo ejecutar

No hay build ni servidor de desarrollo — son páginas HTML estáticas. Abrirlas directamente en el navegador:

```
start index.html
```

**Importante:** `app.js` usa `fetch('data/manifest.json')`, por lo que `index.html` requiere un servidor HTTP local para funcionar correctamente (CORS bloquea `fetch` desde `file://`). Usar:

```
npx serve .
# o
python -m http.server 8080
```

`barcoder.html` y `tarjetas-codigos.html` no hacen fetch y funcionan directamente desde `file://`.

## Arquitectura: tres páginas independientes

### `index.html` — Mapa visual del almacén
Página principal. Carga datos vía `fetch` y renderiza el mapa.

- **`styles.css`** — CSS puro. Define las dimensiones fijas de cada grid (140×95px por celda), el panel colapsable, y un bloque `@media print` extenso con impresión general e individual.
- **`app.js`** — Vanilla JS. Funciones clave:
  - `inicializarAplicacion()` — lee `data/manifest.json`, carga todos los archivos JSON listados en paralelo (`Promise.all`), aplana los arrays y popula el textarea.
  - `generarMapa()` — parsea el textarea, crea un `<div>` con SVG (JsBarcode CODE128) por cada ítem y lo coloca en el grid con `gridColumn`/`gridRow`.
  - `abrirModal(codigo, zona, nivel, columna)` / `cerrarModal()` — zoom del código de barras en modal para escanear con celular.
  - `imprimirCuarto(idCuarto)` — para zonas pequeñas (G, H, I, J): añade `body.impresion-individual` y `.imprimir-activo` al cuarto, llama `window.print()`. Para zonas grandes (K, L, M, N, Panadería, Aseo): llama `crearSegmentosImpresionSiAplica()` primero.
  - `crearSegmentosImpresionSiAplica(idCuarto)` — para grids grandes, recorta en páginas de 4×4 celdas clonando el cuarto original en un `#contenedor-impresion-temporal`.
  - `togglePanel()` — colapsa/expande el panel izquierdo.

### `barcoder.html` — Catálogo de inventario
Muestra todos los códigos agrupados por categoría (INVASEO, INVBIOSEGU, INVCARNES, etc.) con colores únicos por categoría. No tiene lógica de carga; los datos están hardcodeados en el HTML. Usa Google Fonts (Bebas Neue, IBM Plex).

### `tarjetas-codigos.html` — Tarjetas imprimibles
Genera hojas A4/Carta con tarjetas de 4×4 (16 por hoja), optimizadas para impresión física. Usa Tailwind CDN + JsBarcode.

## Datos: `data/`

`data/manifest.json` lista todos los archivos JSON a cargar. Para añadir una nueva zona, crear el archivo JSON y agregarlo al manifest.

Cada ítem:
```json
{ "zona": "CONGELACION_G", "codigo": "G0601", "x": 2, "y": 6, "bloque": 1 }
```

Zonas existentes: `CONGELACION_G/H`, `REFRIGERACION_I/J`, `UBICACION_PISO_K/L/M/N`, `PANADERIA_FP`, `ASEO_EP`.

## Lógica de coordenadas (crítica)

La conversión de `(x, y, bloque)` → posición CSS Grid en `generarMapa()`:

```
gridColumn = x + (bloque - 1)
```

`gridRow` varía según zona (en `app.js`):
- G, H, I, L: `7 - y` (6 niveles, y=6 queda arriba)
- J: `6 - y` (5 niveles)
- K: `3 - y` (2 niveles)
- M: `8 - y` (7 niveles)
- N: `6 - y` (5 niveles)
- Panadería, Aseo: `y` directo (y=1 arriba)

Las dimensiones de cada grid están en `styles.css` (clases `.grid-frio-*`). Si se añade una nueva zona, hay que definir su clase CSS y su caso en el `if/else` de `generarMapa()`.

## Clases CSS clave para impresión

- `.cuarto-impresion` — cada zona; `break-after: page` en impresión general.
- `body.impresion-individual` — activa el modo un-solo-cuarto; oculta el resto.
- `.imprimir-activo` — el cuarto seleccionado ocupa `100vw × 100vh` con grids `1fr`.
- `.imprimir-segmentado` — segmentos paginados de zonas grandes (K, L, M, N, etc.).
- `.logo-cuarto-print` — logo CHVS posicionado en absoluto (esquina variable según la zona).
- `@page cuarto-i-page` — el cuarto I usa orientación portrait en impresión individual.

## Librerías externas (CDN)

- **Tailwind CSS** — `index.html`, `tarjetas-codigos.html`.
- **JsBarcode 3.11.5** — generación de códigos CODE128 en `<svg>`. En `barcoder.html` viene de cdnjs; en las otras dos de jsDelivr.
- **Google Fonts** — solo en `barcoder.html`.
