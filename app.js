async function inicializarAplicacion() {
    try {
        const manifestResponse = await fetch('data/manifest.json', { cache: 'no-store' });
        if (!manifestResponse.ok) {
            throw new Error(`No se pudo cargar data/manifest.json (${manifestResponse.status})`);
        }

        const manifest = await manifestResponse.json();
        const archivos = Array.isArray(manifest.files) ? manifest.files : [];
        if (!archivos.length) {
            throw new Error('data/manifest.json no contiene archivos para cargar.');
        }

        const datasets = await Promise.all(
            archivos.map(async (ruta) => {
                const response = await fetch(ruta, { cache: 'no-store' });
                if (!response.ok) {
                    throw new Error(`No se pudo cargar ${ruta} (${response.status})`);
                }
                const contenido = await response.json();
                return Array.isArray(contenido) ? contenido : [];
            })
        );

        const datosMuestra = datasets.flat();
        document.getElementById('datos-entrada').value = JSON.stringify(datosMuestra, null, 2);
        generarMapa();
    } catch (error) {
        console.error('Error cargando datos iniciales:', error);
        document.getElementById('datos-entrada').value = '[]';
        generarMapa();
    }
}
function generarMapa() {
            try {
                // Leer datos del textarea
                const textoDatos = document.getElementById('datos-entrada').value;
                const datos = JSON.parse(textoDatos);

                const gridCongelacionG = document.getElementById('grid-congelacion-g');
                const gridCongelacionH = document.getElementById('grid-congelacion-h');
                const gridRefrigeracionI = document.getElementById('grid-refrigeracion-i');
                const gridRefrigeracionJ = document.getElementById('grid-refrigeracion-j');
                const gridRefrigeracionK = document.getElementById('grid-refrigeracion-k');
                const gridPisoL = document.getElementById('grid-piso-l');
                const gridPisoM = document.getElementById('grid-piso-m');
                const gridPisoN = document.getElementById('grid-piso-n');

                // Limpiar grillas actuales
                gridCongelacionG.innerHTML = '';
                gridCongelacionH.innerHTML = '';
                gridRefrigeracionI.innerHTML = '';
                gridRefrigeracionJ.innerHTML = '';
                gridRefrigeracionK.innerHTML = '';
                gridPisoL.innerHTML = '';
                gridPisoM.innerHTML = '';
                gridPisoN.innerHTML = '';

                datos.forEach(item => {
                    // Crear el elemento visual (la caja tipo etiqueta)
                    const caja = document.createElement('div');
                    caja.className = 'bg-white relative flex items-center justify-center border-2 border-emerald-600 shadow-sm hover:bg-slate-100 cursor-pointer transition-colors rounded p-1 overflow-hidden';
                    caja.title = `Ubicación: ${item.codigo} | Nivel: ${item.y} | Columna: ${item.x}`;

                    // Crear el contenedor SVG donde se dibujará el código de barras
                    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                    svg.style.maxWidth = '100%';
                    svg.style.maxHeight = '100%';
                    caja.appendChild(svg);

                    // LA MAGIA DE LAS COORDENADAS MATEMÁTICAS:
                    // 1. Calculamos la columna en la pantalla considerando los espacios vacíos por los bloques.
                    const columnaPantalla = item.x + (item.bloque - 1); 
                    
                    // 2. Calculamos la fila (Nivel o Profundidad). 
                    let filaPantalla;
                    if (['CONGELACION_G', 'CONGELACION_H', 'REFRIGERACION_I'].includes(item.zona)) {
                        // Tienen 6 posiciones de fondo
                        filaPantalla = 7 - item.y;
                    } else if (item.zona === 'REFRIGERACION_J') {
                        // Tiene 5 posiciones de fondo, esto alinea a "J0104" un cajón más abajo automáticamente
                        filaPantalla = 6 - item.y;
                    } else if (item.zona === 'UBICACION_PISO_K') {
                        // Tiene 2 niveles: y=2 → fila 1 (arriba), y=1 → fila 2 (abajo)
                        filaPantalla = 3 - item.y;
                    } else if (item.zona === 'UBICACION_PISO_L') {
                        // 6 niveles
                        filaPantalla = 7 - item.y;
                    } else if (item.zona === 'UBICACION_PISO_M') {
                        // 7 niveles
                        filaPantalla = 8 - item.y;
                    } else if (item.zona === 'UBICACION_PISO_N') {
                        // 5 niveles
                        filaPantalla = 6 - item.y;
                    } else {
                        // Racks de frente, tienen 3 niveles de alto
                        filaPantalla = 4 - item.y;
                    }

                    caja.style.gridColumn = columnaPantalla;
                    caja.style.gridRow = filaPantalla;

                    // Logo en esquina inferior derecha
                    const logo = document.createElement('img');
                    logo.src = 'corporacion-hacia-una-valle-solidaria-logo-x2.png';
                    logo.alt = 'CHVS';
                    logo.style.cssText = 'position:absolute;bottom:2px;right:2px;width:28px;height:auto;opacity:0.75;pointer-events:none;';
                    caja.appendChild(logo);

                    // Agregar evento click para abrir el código en grande
                    caja.onclick = () => abrirModal(item.codigo, item.zona, item.y, item.x);

                    // Insertar en la zona correcta
                    if (item.zona === 'CONGELACION_G') {
                        gridCongelacionG.appendChild(caja);
                    } else if (item.zona === 'CONGELACION_H') {
                        gridCongelacionH.appendChild(caja);
                    } else if (item.zona === 'REFRIGERACION_I') {
                        gridRefrigeracionI.appendChild(caja);
                    } else if (item.zona === 'REFRIGERACION_J') {
                        gridRefrigeracionJ.appendChild(caja);
                    } else if (item.zona === 'UBICACION_PISO_K') {
                        gridRefrigeracionK.appendChild(caja);
                    } else if (item.zona === 'UBICACION_PISO_L') {
                        gridPisoL.appendChild(caja);
                    } else if (item.zona === 'UBICACION_PISO_M') {
                        gridPisoM.appendChild(caja);
                    } else if (item.zona === 'UBICACION_PISO_N') {
                        gridPisoN.appendChild(caja);
                    }

                    // Generar el código de barras dentro del SVG
                    JsBarcode(svg, item.codigo, {
                        format: "CODE128", 
                        width: 2,          // Grosor aumentado (antes 1.8)
                        height: 40,        // Altura aumentada
                        fontSize: 16,      
                        fontOptions: "bold",
                        textMargin: 2,
                        margin: 2,
                        displayValue: true 
                    });
                });

            } catch (error) {
                // Si el usuario escribe mal el JSON, mostramos una alerta visual en la interfaz en lugar de un alert bloqueante
                console.error("Error leyendo los datos:", error);
                const gridCongelacionG = document.getElementById('grid-congelacion-g');
                gridCongelacionG.innerHTML = '<div class="col-span-5 text-red-500 font-bold p-4">Error de formato en los datos JSON. Revisa la sintaxis.</div>';
            }
        }

        // Funciones para manejar el Modal (Zoom del código)
        function abrirModal(codigo, zona, nivel, columna) {
            const modal = document.getElementById('modal-barcode');
            const titulo = document.getElementById('modal-title');
            const subtitulo = document.getElementById('modal-subtitle');
            const svg = document.getElementById('modal-svg');

            titulo.innerText = codigo;
            subtitulo.innerText = `${zona} | Nivel: ${nivel} | Col: ${columna}`;
            
            // Generar un código de barras de altísima resolución
            JsBarcode(svg, codigo, {
                format: "CODE128",
                width: 4,          // Muy grueso para lectura fácil
                height: 120,       // Muy alto
                fontSize: 24,
                fontOptions: "bold",
                margin: 0,
                displayValue: true
            });

            // Animación de entrada
            modal.classList.remove('hidden');
            setTimeout(() => {
                modal.classList.remove('opacity-0');
                modal.firstElementChild.classList.remove('scale-95');
                modal.firstElementChild.classList.add('scale-100');
            }, 10);
        }

        function cerrarModal() {
            const modal = document.getElementById('modal-barcode');
            // Animación de salida
            modal.classList.add('opacity-0');
            modal.firstElementChild.classList.remove('scale-100');
            modal.firstElementChild.classList.add('scale-95');
            setTimeout(() => {
                modal.classList.add('hidden');
            }, 300);
        }

        // Función para imprimir un cuarto específico
        function imprimirCuarto(idCuarto) {
            const cuarto = document.getElementById(idCuarto);
            const preparoSegmentos = crearSegmentosImpresionSiAplica(idCuarto);

            document.body.classList.add('impresion-individual');
            if (!preparoSegmentos) {
                cuarto.classList.add('imprimir-activo');
            }

            let yaLimpio = false;
            const limpiar = () => {
                if (yaLimpio) return;
                yaLimpio = true;

                document.body.classList.remove('impresion-individual');
                cuarto.classList.remove('imprimir-activo');

                const temporal = document.getElementById('contenedor-impresion-temporal');
                if (temporal) temporal.remove();
            };

            window.addEventListener('afterprint', limpiar, { once: true });
            window.print();

            // Fallback si el navegador no dispara afterprint correctamente
            setTimeout(limpiar, 1500);
        }

        function crearSegmentosImpresionSiAplica(idCuarto) {
            const configuracion = {
                'cuarto-k': { gridId: 'grid-refrigeracion-k' },
                'cuarto-l': { gridId: 'grid-piso-l' },
                'cuarto-m': { gridId: 'grid-piso-m' },
                'cuarto-n': { gridId: 'grid-piso-n' }
            };

            const config = configuracion[idCuarto];
            if (!config) return false;

            const cuartoOriginal = document.getElementById(idCuarto);
            const gridOriginal = document.getElementById(config.gridId);
            if (!cuartoOriginal || !gridOriginal) return false;

            const celdas = Array.from(gridOriginal.children);
            if (!celdas.length) return false;

            const maxColsPorPagina = 4;
            const maxFilasPorPagina = 4;
            const maxColumna = celdas.reduce((maximo, celda) => {
                const columna = parseInt(celda.style.gridColumn, 10) || 1;
                return Math.max(maximo, columna);
            }, 1);
            const maxFila = celdas.reduce((maximo, celda) => {
                const fila = parseInt(celda.style.gridRow, 10) || 1;
                return Math.max(maximo, fila);
            }, 1);

            const contenedorTemporal = document.createElement('div');
            contenedorTemporal.id = 'contenedor-impresion-temporal';

            const logoFuente = cuartoOriginal.querySelector('.logo-cuarto-print img');
            const logoSrc = logoFuente ? logoFuente.getAttribute('src') : '';
            const logoAlt = logoFuente ? logoFuente.getAttribute('alt') || 'Logo' : 'Logo';

            // CompactaciÃ³n por lotes de 20 (5x4) para tarjetas mÃ¡s grandes.
            if (['cuarto-k', 'cuarto-l', 'cuarto-m', 'cuarto-n'].includes(idCuarto)) {
                const celdasOrdenadas = [...celdas].sort((a, b) => {
                    const filaA = parseInt(a.style.gridRow, 10) || 1;
                    const filaB = parseInt(b.style.gridRow, 10) || 1;
                    if (filaA !== filaB) return filaA - filaB;
                    const colA = parseInt(a.style.gridColumn, 10) || 1;
                    const colB = parseInt(b.style.gridColumn, 10) || 1;
                    return colA - colB;
                });

                const tamPagina = maxColsPorPagina * maxFilasPorPagina;
                for (let inicio = 0; inicio < celdasOrdenadas.length; inicio += tamPagina) {
                    const bloque = celdasOrdenadas.slice(inicio, inicio + tamPagina);
                    if (!bloque.length) continue;

                    const cuartoSegmento = cuartoOriginal.cloneNode(true);
                    cuartoSegmento.classList.add('imprimir-activo', 'imprimir-segmentado');

                    const gridSegmento = cuartoSegmento.querySelector(`#${config.gridId}`);
                    gridSegmento.innerHTML = '';

                    bloque.forEach((celda, idx) => {
                        const copiaCelda = celda.cloneNode(true);
                        copiaCelda.style.gridColumn = String((idx % maxColsPorPagina) + 1);
                        copiaCelda.style.gridRow = String(Math.floor(idx / maxColsPorPagina) + 1);
                        gridSegmento.appendChild(copiaCelda);
                    });

                    if (logoSrc) {
                        const logoFila6 = document.createElement('div');
                        logoFila6.className = 'logo-fila-6-print';

                        const img = document.createElement('img');
                        img.src = logoSrc;
                        img.alt = logoAlt;
                        logoFila6.appendChild(img);
                        gridSegmento.appendChild(logoFila6);
                    }

                    contenedorTemporal.appendChild(cuartoSegmento);
                }

                document.body.appendChild(contenedorTemporal);
                return true;
            }

            const totalSegmentosFilas = Math.ceil(maxFila / maxFilasPorPagina);
            const totalSegmentosColumnas = Math.ceil(maxColumna / maxColsPorPagina);

            for (let segmentoFila = 0; segmentoFila < totalSegmentosFilas; segmentoFila++) {
                const filaInicio = (segmentoFila * maxFilasPorPagina) + 1;
                const filaFin = Math.min(maxFila, filaInicio + maxFilasPorPagina - 1);

                for (let segmentoCol = 0; segmentoCol < totalSegmentosColumnas; segmentoCol++) {
                    const colInicio = (segmentoCol * maxColsPorPagina) + 1;
                    const colFin = Math.min(maxColumna, colInicio + maxColsPorPagina - 1);

                    const cuartoSegmento = cuartoOriginal.cloneNode(true);
                    cuartoSegmento.classList.add('imprimir-activo', 'imprimir-segmentado');

                    const gridSegmento = cuartoSegmento.querySelector(`#${config.gridId}`);
                    gridSegmento.innerHTML = '';

                    celdas.forEach(celda => {
                        const columnaOriginal = parseInt(celda.style.gridColumn, 10) || 1;
                        const filaOriginal = parseInt(celda.style.gridRow, 10) || 1;
                        const enRangoCol = columnaOriginal >= colInicio && columnaOriginal <= colFin;
                        const enRangoFila = filaOriginal >= filaInicio && filaOriginal <= filaFin;

                        if (enRangoCol && enRangoFila) {
                            const copiaCelda = celda.cloneNode(true);
                            copiaCelda.style.gridColumn = String(columnaOriginal - colInicio + 1);
                            copiaCelda.style.gridRow = String(filaOriginal - filaInicio + 1);
                            gridSegmento.appendChild(copiaCelda);
                        }
                    });

                    if (logoSrc) {
                        const logoFila6 = document.createElement('div');
                        logoFila6.className = 'logo-fila-6-print';

                        const img = document.createElement('img');
                        img.src = logoSrc;
                        img.alt = logoAlt;
                        logoFila6.appendChild(img);
                        gridSegmento.appendChild(logoFila6);
                    }

                    contenedorTemporal.appendChild(cuartoSegmento);
                }
            }

            document.body.appendChild(contenedorTemporal);
            return true;
        }

        // Colapsar / expandir panel izquierdo
        function togglePanel() {
            const panel = document.querySelector('.panel-izquierdo');
            panel.classList.toggle('colapsado');
        }

        // Generar el mapa automáticamente al cargar la página
        window.onload = inicializarAplicacion;
    

