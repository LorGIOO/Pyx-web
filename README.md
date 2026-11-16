<div align="center">

<img src="assets/img/icon.png" alt="Pyx" width="88" height="88">

# La web de Pyx

**El cálculo y el documento, en un mismo archivo.**

La página que presenta [Pyx](https://github.com/LorGIOO/Pyx), un editor de LaTeX con celdas de Python dentro:<br>
su historia, sus herramientas, las novedades de cada versión y el manual de usuario completo.

</div>

---

## Qué hay

| Página | Archivo | Qué cuenta |
|---|---|---|
| Portada | `index.html` | La historia de Pyx en once capítulos, con demostraciones que funcionan en el navegador: la hoja que se gira, el laboratorio con una memoria de cálculo de verdad, el grafo reactivo, los cuadernos vinculados, el corrector, el autocompletado, el pegado de tablas y las anotaciones del visor. |
| Manual | `manual/index.html` | El manual de usuario entero, con índice, buscador y prueba de atajos. **Se genera**; no se edita a mano (ver abajo). |
| Novedades | `novedades/index.html` | Todas las versiones, a partir de `assets/data/novedades.js`. |
| Privacidad | `privacidad/index.html` | Qué datos trata la web y qué conexiones hace la aplicación. |
| Error 404 | `404.html` | La página que sirve GitHub Pages cuando una dirección no existe. |

Es una web estática: HTML, CSS y JavaScript sin dependencias ni paso de compilación. Las fuentes (Computer Modern y JetBrains Mono, con licencia OFL) están en `assets/fonts/`, así que la web no contacta con ningún servicio externo.

```
.
├── index.html            portada
├── manual/               manual (index.html se genera; plantilla.html es la plantilla) y el PDF
├── novedades/            historial de versiones
├── privacidad/           política de privacidad
├── 404.html
├── assets/
│   ├── css/              base.css (común) · home.css (portada) · doc.css (manual, novedades, privacidad)
│   ├── js/               common.js (común) · home.js (escenas de la portada) · manual.js
│   ├── data/novedades.js las versiones
│   ├── fonts/            CMU Serif, CMU Sans y JetBrains Mono (woff2)
│   └── img/              capturas reales de Pyx, icono e imagen para redes sociales
└── tools/
    ├── manual.py         genera el manual web a partir de manual-pyx.pltx
    ├── og.html · og.js   generan assets/img/og.png
```

## Tareas habituales

### Anunciar una versión nueva

1. Abre `assets/data/novedades.js` y añade un objeto **al principio** de la lista (el archivo explica cada campo). La portada muestra la primera versión; `/novedades/` las muestra todas.
2. Si cambia el número de versión, búscalo en `index.html` (aparece en la portada y en la sección de descargas) y en `manual/plantilla.html`.

### Actualizar el manual

El manual web sale de la misma fuente que el PDF, el documento `manual-pyx.pltx` del repositorio de Pyx:

```bash
python3 tools/manual.py "../Pyx/Manual de usuario/manual-pyx.pltx"
cp "../Pyx/Manual de usuario/Manual de usuario de Pyx.pdf" manual/manual-pyx.pdf
```

El script solo usa la biblioteca estándar de Python. Escribe `manual/index.html` a partir de `manual/plantilla.html`, extrae la gráfica que calcula una celda del manual (`assets/img/flecha.png`) y avisa si alguna orden de LaTeX se ha quedado sin convertir. Los valores que calculan las celdas del manual (fecha, versiones de Python y NumPy, la flecha del capítulo 7) están en `VALORES_PY`, al principio del script.

Si el manual usa capturas nuevas, conviértelas a WebP y ponlas en `assets/img/` con el mismo nombre:

```bash
python3 -c "from PIL import Image; import sys; [Image.open(f).save(f[:-4]+'.webp', quality=90, method=6) for f in sys.argv[1:]]" capturas/*.png
```

### Ver la web en local

```bash
python3 -m http.server 8000
```

y abre <http://localhost:8000>.

## Publicación

La web se publica con **GitHub Pages** desde la rama `main`, carpeta raíz (`Settings → Pages → Build and deployment → Deploy from a branch`). El archivo `.nojekyll` evita que GitHub procese la web con Jekyll.

## Licencia

El código de la web, con licencia [MIT](LICENSE). Las fuentes conservan su licencia: Computer Modern Unicode y JetBrains Mono, [SIL Open Font License 1.1](assets/fonts/LICENSE-FONTS.txt). Las capturas son de Pyx.
