# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Proyecto

Sistema de Mapeo de Almacén WMS para la Corporación Hacia un Valle Solidario (CHVS). Visualiza cuartos fríos con códigos de barras generados dinámicamente y permite impresión por cuarto.

## Cómo ejecutar

No hay build ni servidor — es una sola página HTML estática. Abrirla directamente en el navegador:

```
start index.html
```

O arrastrar `index.html` al navegador. No requiere Node, npm, ni servidor local.

## Arquitectura

Todo el código vive en un único archivo: `index.html`. Está dividido en tres bloques:

1. **`<style>`** — CSS puro + Tailwind CDN. Contiene los estilos de pantalla y un bloque `@media print` extenso que controla la impresión general e individual.

2. **HTML** — Dos paneles:
   - Panel izquierdo: `<textarea id="datos-entrada">` donde el usuario pega/edita el JSON con las ubicaciones.
   - Panel derecho: cuatro grids (`#grid-congelacion-g/h`, `#grid-refrigeracion-i/j`) donde se inyectan las tarjetas dinámicamente.

3. **`<script>`** — Vanilla JS. Funciones clave:
   - `generarMapa()` — lee el textarea, parsea el JSON y crea un `<div>` con SVG (código de barras JsBarcode) por cada ítem, colocándolo en el grid con `gridColumn`/`gridRow`.
   - `abrirModal(codigo, zona, nivel, columna)` / `cerrarModal()` — zoom del código de barras en modal para escanear con celular.
   - `imprimirCuarto(idCuarto)` — añade `body.impresion-individual` y `.imprimir-activo` al cuarto, llama `window.print()` y los elimina tras 1 segundo.
   - `togglePanel()` — colapsa/expande el panel izquierdo.

## Librerías externas (CDN, sin instalación)

- **Tailwind CSS** — utilidades de estilo en línea.
- **JsBarcode 3.11.5** — generación de códigos de barras CODE128 dentro de elementos `<svg>`.

## Formato de datos

El JSON del textarea es un array de objetos:

```json
{ "zona": "CONGELACION_G", "codigo": "G0601", "x": 2, "y": 6, "bloque": 1 }
```

- `zona`: `CONGELACION_G`, `CONGELACION_H`, `REFRIGERACION_I`, `REFRIGERACION_J`
- `x`: columna física en el cuarto (1-based)
- `y`: nivel/profundidad (1 = fondo del pasillo, valores mayores = más al frente)
- `bloque`: número de bloque; se usa para calcular la columna en pantalla con `x + (bloque - 1)`

La conversión de `(x, y)` a posición en el CSS Grid:
- `gridColumn = x + (bloque - 1)`
- `gridRow = 7 - y` (cuartos G, H, I) o `6 - y` (cuarto J)

## Clases CSS clave para impresión

- `.cuarto-impresion` — cada cuarto frío; `break-after: page` en impresión general.
- `body.impresion-individual` — activa el modo un-solo-cuarto; oculta el resto.
- `.imprimir-activo` — el cuarto seleccionado ocupa `100vw × 100vh` con grids `1fr`.
- `.logo-cuarto-print` — logo CHVS posicionado en absoluto dentro de cada cuarto (esquina variable según el cuarto).
- `@page cuarto-i-page` — el cuarto I usa orientación portrait en impresión individual.
