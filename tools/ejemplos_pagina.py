"""La página ejemplos/index.html, generada a partir de los proyectos.

Los fragmentos de código se leen de los archivos reales (por líneas), así que
la página nunca enseña un código distinto del que se descarga. La cabecera y el
pie se copian de novedades/index.html, que está a la misma profundidad.
"""
import html
import json
import re
from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).resolve().parent))

WEB = Path(__file__).resolve().parent.parent
SRC = WEB / "ejemplos" / "src"
REPO = "https://github.com/LorGIOO/Pyx-web/tree/main/ejemplos/src/"
GENERADO = {"xref", "figuras", "__pycache__", ".ipynb_checkpoints"}

EJEMPLOS = [
    {
        "slug": "00-plantilla",
        "titulo": "Plantilla vacía",
        "lema": "El punto de partida para un trabajo nuevo.",
        "etiquetas": ["preámbulo .pltx", "estilo .sty", "subdocumentos"],
        "texto": "La misma estructura que la memoria de cálculo, sin contenido: un documento principal "
                 "que solo reúne capítulos, un archivo <code>.sty</code> con todo el aspecto (márgenes, "
                 "colores, portada, <code>\\cumple</code> y <code>\\nocumple</code>) y una carpeta de "
                 "recursos para imágenes, datos y cálculos.",
        "muestra": [
            "<code>_Preámbulo.pltx</code> solo tiene la portada, el índice y un <code>\\input</code> por capítulo.",
            "Cada capítulo es un <code>.pltx</code> aparte, con sus propias celdas de Python.",
            "<code>memoria.sty</code> guarda el estilo: cámbialo una vez y cambia todo el documento.",
        ],
        "abrir": "1. Main/_Preámbulo.pltx",
        "fragmentos": [("1. Main/_Preámbulo.pltx", [(9, 20)])],
    },
    {
        "slug": "01-memoria-de-calculo",
        "titulo": "Memoria de cálculo",
        "lema": "Una pasarela peatonal ficticia, de los datos a las conclusiones.",
        "etiquetas": ["capítulos", "CSV y Excel", "handcalcs", "pint", "gráficas", "\\pyif", "Jupyter"],
        "texto": "Un trabajo grande organizado como se haría en la vida real. Los datos se leen de un CSV "
                 "y de un Excel; la viga se calcula con <em>handcalcs</em>, que escribe cada fórmula con "
                 "sus valores, y con <em>pint</em> para las unidades; el texto dice «CUMPLE» o «NO CUMPLE» "
                 "según el resultado. El anejo de viento no tiene celdas: llama a las funciones de un "
                 "cuaderno de Jupyter.",
        "muestra": [
            "Las variables de un capítulo se usan en los siguientes.",
            "Una tabla con un <code>\\py{}</code> en cada celda y otra entera con <code>tabletex</code>.",
            "Una tabla cuyas filas escribe un bucle, comparando tres perfiles.",
            "Cambia <code>perfil = \"IPE 330\"</code> por <code>\"IPE 300\"</code> y mira cómo cambian el texto, la gráfica y las tablas.",
        ],
        "abrir": "1. Main/_Preámbulo.pltx",
        "orden": [4, 3, 5, 6, 2, 1],   # primero las páginas con cálculo
        "fragmentos": [("2. Capítulos/3. Cálculo de la viga.pltx", [(31, 51)])],
    },
    {
        "slug": "02-handcalcs-y-unidades",
        "titulo": "Handcalcs y unidades",
        "lema": "Cálculos a mano, sin escribirlos a mano.",
        "etiquetas": ["handcalcs", "pint", "\\pyif", "gráficas"],
        "texto": "Un solo archivo con lo más vistoso para un cálculo técnico: una zapata y un pilar. "
                 "Las celdas <code>%%render</code> ponen en el PDF el desarrollo completo de cada fórmula; "
                 "<code>%%render params</code> escribe los datos en columnas. Cada magnitud lleva sus "
                 "unidades y las conversiones se hacen solas.",
        "muestra": [
            "Letras griegas y subíndices a partir de los nombres: <code>lamb_r</code> se escribe λ<sub>r</sub>.",
            "<code>\\pyif</code> compara kPa con MPa sin conversiones a mano.",
            "Una curva de pandeo con el punto del pilar y una tabla resumen.",
        ],
        "abrir": "calculo-con-unidades.pltx",
        "fragmentos": [("calculo-con-unidades.pltx", [(62, 71)])],
    },
    {
        "slug": "03-cuaderno-de-jupyter",
        "titulo": "Solo un cuaderno de Jupyter",
        "lema": "Un informe sin ninguna celda: todo el cálculo vive en el cuaderno.",
        "etiquetas": ["\\pynotebook", "\\pyfile", ".ipynb", ".py con # %%", "pandas", "\\pyif"],
        "texto": "Para quien ya calcula en Jupyter o en VS Code. El documento vincula un cuaderno "
                 "(<code>\\pynotebook</code>) y un script con bloques <code># %%</code> "
                 "(<code>\\pyfile</code>) y, a partir de ahí, usa sus variables y <strong>llama a sus "
                 "funciones</strong> con los argumentos que quiere. La gráfica la guarda el cuaderno y el "
                 "documento la incluye con <code>\\includegraphics</code>.",
        "muestra": [
            "Una tabla entera escrita por una función del cuaderno: <code>\\py{filas_periodos([2, 5, 10])}</code>.",
            "Una tabla de pandas consultada celda a celda: <code>\\py{cuantiles.loc[100, 'P']}</code>.",
            "Si el cuaderno está abierto y ejecutado, Pyx copia sus valores sin ejecutar nada.",
        ],
        "abrir": "informe.pltx",
        "fragmentos": [("informe.pltx", [(26, 27), (49, 55)]), ("calculos/lluvias.ipynb", "filas_periodos")],
    },
    {
        "slug": "04-tablas-graficas-y-condicionales",
        "titulo": "Tablas, gráficas y condicionales",
        "lema": "Un DataFrame normal y un documento que le pregunta.",
        "etiquetas": ["pandas", "tabletex", "bucles", "matplotlib", "\\pyif", "celdas"],
        "texto": "Datos ficticios de consumo energético en un DataFrame de pandas sin nada preparado para "
                 "LaTeX. La primera tabla se escribe en LaTeX y cada número lo pide el documento: "
                 "<code>\\py{df.at[\"Ene\", \"total\"]}</code>. La segunda es el mismo DataFrame en una "
                 "línea con <code>tabletex</code>, y la tercera la escribe un bucle.",
        "muestra": [
            "Dos formas de llevar una gráfica: <code>figtex()</code> (la figura entera) y <code>figure()</code> + <code>\\includegraphics</code>.",
            "Frases que cambian con los datos, con colores y hasta el plural: «1 mes» o «4 meses».",
            "Cambia un dato del DataFrame: tablas, gráficas y frases cambian a la vez.",
        ],
        "abrir": "estudio.pltx",
        "fragmentos": [("estudio.pltx", [(60, 70)])],
    },
    {
        "slug": "05-datos-de-excel",
        "titulo": "Datos de Excel y CSV",
        "lema": "Un presupuesto cuyos números viven en Excel, sin una línea de Python.",
        "etiquetas": ["\\hoja", "\\celda", ".xlsx", ".csv", "sin Python"],
        "texto": "El documento vincula un libro de Excel con <code>\\hoja[Mediciones]{datos/obra.xlsx}</code> "
                 "y coloca sus celdas con <code>\\celda{E4}</code> o un rango entero con "
                 "<code>\\celda{A2:E7}</code>, que sale como el cuerpo de una tabla. Un capítulo lee un "
                 "CSV con el <code>;</code> y la coma decimal del Excel en español. Cambia un número en Excel, "
                 "guarda y compila: el documento cambia solo.",
        "muestra": [
            "Una celda suelta en una frase: <code>\\celda{B3}</code>; otra hoja: <code>\\celda{Resumen!B5}</code>.",
            "Una tabla entera desde Excel: cabecera <code>\\celda{A1:E1}</code> y cuerpo <code>\\celda{A2:E7}</code>.",
            "<code>\\celda[T]{B2:B6}</code> pone una columna como fila (y al revés).",
            "Lee lo que Excel guardó, también los resultados de las fórmulas.",
        ],
        "abrir": "informe.pltx",
        "fragmentos": [("informe.pltx", [(18, 18), (34, 50)])],
    },
]

# --------------------------------------------------------------- resaltado
PY_KW = {"import", "from", "as", "def", "return", "for", "in", "if", "else", "elif", "not", "and",
         "or", "lambda", "with", "True", "False", "None", "while", "class", "try", "except"}


def _py(line: str) -> str:
    out, i = [], 0
    pat = re.compile(r'(#.*$)|("(?:[^"\\]|\\.)*"|\'(?:[^\'\\]|\\.)*\')|(\b\d+(?:\.\d+)?(?:e[+-]?\d+)?\b)|([A-Za-z_]\w*)|(%%\w+(?: \w+)?)')
    for m in pat.finditer(line):
        out.append(html.escape(line[i:m.start()]))
        t = html.escape(m.group(0))
        if m.group(1): out.append(f'<span class="tk-com">{t}</span>')
        elif m.group(2): out.append(f'<span class="tk-str">{t}</span>')
        elif m.group(3): out.append(f'<span class="tk-num">{t}</span>')
        elif m.group(4): out.append(f'<span class="tk-kw">{t}</span>' if m.group(4) in PY_KW else t)
        else: out.append(f'<span class="tk-magic">{t}</span>')
        i = m.end()
    out.append(html.escape(line[i:]))
    return "".join(out)


def _tex(line: str) -> str:
    # el comentario empieza en el primer % sin escapar
    cut = None
    for k, c in enumerate(line):
        if c == "%" and (k == 0 or line[k - 1] != "\\"):
            cut = k
            break
    body, com = (line, "") if cut is None else (line[:cut], line[cut:])
    out, i = [], 0
    for m in re.finditer(r"\\(py(?:if|file|notebook)?|hoja|celda)\b|\\[A-Za-z@]+|\\.", body):
        out.append(html.escape(body[i:m.start()]))
        cls = "tk-py" if m.group(1) else "tk-cmd"
        out.append(f'<span class="{cls}">{html.escape(m.group(0))}</span>')
        i = m.end()
    out.append(html.escape(body[i:]))
    if com:
        out.append(f'<span class="tk-com">{html.escape(com)}</span>')
    return "".join(out)


def resaltar(texto: str, lang: str) -> str:
    lines, cell, out = texto.split("\n"), False, []
    for ln in lines:
        s = ln.strip()
        if lang == "python":
            out.append(_py(ln))
        elif s.startswith("%#python"):
            cell = True
            out.append(f'<span class="tk-cell">{html.escape(ln)}</span>')
        elif s.startswith("%#end"):
            cell = False
            out.append(f'<span class="tk-cell">{html.escape(ln)}</span>')
        else:
            out.append(_py(ln) if cell else _tex(ln))
    return "\n".join(out)


def fragmento(slug: str, archivo: str, cual) -> tuple:
    p = SRC / slug / archivo
    if archivo.endswith(".ipynb"):
        nb = json.loads(p.read_text(encoding="utf-8"))
        for c in nb["cells"]:
            src = "".join(c["source"])
            if c["cell_type"] == "code" and f"def {cual}" in src:
                # solo la función, sin lo que venga detrás
                txt = src[src.index(f"def {cual}"):].split("\n\ndef ")[0].rstrip()
                return archivo, "python", txt
        raise SystemExit(f"No está la función {cual} en {p}")
    lines = p.read_text(encoding="utf-8").split("\n")
    trozos = ["\n".join(lines[a - 1:b]) for a, b in cual]
    return archivo, "pyx", "\n% …\n".join(trozos)


def arbol(slug: str) -> str:
    raiz = SRC / slug
    filas = []

    def walk(d: Path, pre: str):
        hijos = sorted([h for h in d.iterdir() if h.name not in GENERADO],
                       key=lambda h: (h.is_file(), h.name.lower()))
        for k, h in enumerate(hijos):
            ult = k == len(hijos) - 1
            rama = "└─ " if ult else "├─ "
            nombre = html.escape(h.name) + ("/" if h.is_dir() else "")
            cls = "dir" if h.is_dir() else ("main" if h.relative_to(raiz).as_posix() == EJ[slug]["abrir"] else "")
            filas.append(f'{pre}{rama}<span class="{cls}">{nombre}</span>')
            if h.is_dir():
                walk(h, pre + ("   " if ult else "│  "))

    walk(raiz, "")
    return "\n".join(filas)


EJ = {e["slug"]: e for e in EJEMPLOS}

# --------------------------------------------------------------- página


def tarjeta(n: int, e: dict) -> str:
    slug = e["slug"]
    imgs = sorted((WEB / "ejemplos" / "img").glob(f"{slug}-*.webp"),
                  key=lambda p: int(p.stem.rsplit("-", 1)[1]))
    zipkb = round((WEB / "ejemplos" / "descargas" / f"{slug}.zip").stat().st_size / 1024)
    num = lambda p: int(p.stem.rsplit("-", 1)[1])
    if e.get("orden"):
        imgs.sort(key=lambda p: e["orden"].index(num(p)) if num(p) in e["orden"] else 99)
    paginas = "".join(
        f'<button class="ej-page" type="button" data-full="img/{p.name}" aria-label="Ampliar la página {num(p)}">'
        f'<img src="img/{p.name}" alt="{html.escape(e["titulo"])}, página {num(p)}" loading="lazy" width="910" height="1287"></button>'
        for p in imgs)
    codigo = ""
    for archivo, lang, txt in (fragmento(slug, a, c) for a, c in e["fragmentos"]):
        codigo += (f'<figure class="code"><span class="code-lang">{html.escape(archivo)}</span>'
                   f'<pre><code>{resaltar(txt, lang)}</code></pre></figure>')
    tags = "".join(f"<li>{html.escape(t)}</li>" for t in e["etiquetas"])
    muestra = "".join(f"<li>{m}</li>" for m in e["muestra"])
    return f'''
<article class="ej" id="{slug}" data-chapter="<b>{n:02d}</b> · {html.escape(e["titulo"])}">
  <header class="ej-head">
    <p class="ej-num">{n:02d}</p>
    <div>
      <h2>{html.escape(e["titulo"])}</h2>
      <p class="ej-lema">{html.escape(e["lema"])}</p>
      <ul class="ej-tags">{tags}</ul>
    </div>
  </header>
  <div class="ej-grid">
    <div class="ej-text">
      <p>{e["texto"]}</p>
      <ul class="ej-list">{muestra}</ul>
      <div class="ej-actions">
        <a class="key primary" href="descargas/{slug}.zip" download><svg aria-hidden="true"><use href="#i-down"/></svg>Descargar .zip <span class="k-hint">{zipkb} KB</span></a>
        <a class="key" href="pdf/{slug}.pdf">Ver el PDF</a>
        <a class="key" href="{REPO}{slug}">Ver en GitHub</a>
      </div>
      <p class="ej-open">Abre <code>{html.escape(e["abrir"])}</code> y pulsa <b>Compilar y ver</b>.</p>
      <details class="ej-tree"><summary>Archivos del proyecto</summary><pre>{arbol(slug)}</pre></details>
    </div>
    <div class="ej-pages" data-pages="{len(imgs)}">{paginas}</div>
  </div>
  {codigo}
</article>'''


def escribir() -> None:
    base = (WEB / "novedades" / "index.html").read_text(encoding="utf-8")
    cabeza = base[:base.index('<header class="page-head">')]
    pie = base[base.index('<footer class="colophon">'):base.index("</footer>") + len("</footer>")]
    cabeza = (cabeza.replace("<title>Novedades · Pyx</title>", "<title>Ejemplos · Pyx</title>")
              .replace('content="Qué trae cada versión de Pyx, de la más reciente a la primera."',
                       'content="Proyectos de Pyx para descargar, compilar y copiar: memoria de cálculo, handcalcs y pint, cuadernos de Jupyter, tablas de pandas y gráficas."')
              .replace('<meta property="og:title" content="Novedades de Pyx">', '<meta property="og:title" content="Ejemplos de Pyx">')
              .replace('<a href="./" aria-current="page">Novedades</a>', '<a href="../novedades/">Novedades</a>')
              .replace('<a href="../ejemplos/">Ejemplos</a>', '<a href="./" aria-current="page">Ejemplos</a>')
              .replace('<link rel="alternate" type="application/atom+xml" title="Versiones de Pyx" href="https://github.com/LorGIOO/Pyx/releases.atom">\n', ""))
    css_v = re.search(r"base\.css\?v=([\w]+)", cabeza).group(1)
    cabeza = cabeza.replace("</head>", f'  <link rel="stylesheet" href="../assets/css/ejemplos.css?v={css_v}">\n</head>')
    pie = (pie.replace('<li><a href="./">Novedades</a></li>', '<li><a href="../novedades/">Novedades</a></li>')
              .replace('<li><a href="../ejemplos/">Ejemplos</a></li>', '<li><a href="./">Ejemplos</a></li>'))
    indice = "".join(f'<li><a href="#{e["slug"]}"><span>{n:02d}</span>{html.escape(e["titulo"])}</a></li>'
                     for n, e in enumerate(EJEMPLOS))
    cuerpo = "".join(tarjeta(n, e) for n, e in enumerate(EJEMPLOS))
    pagina = f'''{cabeza}<header class="page-head">
  <p class="eyebrow"><span>Ejemplos</span><span class="n">{len(EJEMPLOS)} proyectos para descargar</span></p>
  <h1>Proyectos para <em>abrir, compilar y copiar.</em></h1>
  <p class="lede">Proyectos completos de Pyx con datos inventados. Descarga uno, ábrelo y compílalo tal cual; luego cambia un dato y mira cómo se rehace el documento entero. Cópialos, rómpelos, úsalos de plantilla.</p>
</header>

<div class="ej-layout">
  <main id="contenido">
    <ol class="ej-steps" aria-label="Cómo se usan">
      <li><b>Descarga</b> el <code>.zip</code> y descomprímelo donde quieras.</li>
      <li><b>Abre</b> en Pyx el archivo principal que se indica en cada uno.</li>
      <li><b>Compila</b> con <span class="menu">Compilar y ver</span> (Ctrl+Mayús+B). Las librerías que usan las trae el Python que prepara Pyx.</li>
    </ol>
    <nav class="ej-index" aria-label="Ejemplos"><ol>{indice}</ol></nav>
{cuerpo}
    <p class="ej-foot">Todos los datos, nombres y resultados son ficticios. Los ejemplos se compilan con el propio Pyx cada vez que se publican; si alguno no te compila, <a href="https://github.com/LorGIOO/Pyx/issues">cuéntanoslo</a>.</p>
  </main>
</div>

<dialog class="ej-lightbox" aria-label="Página ampliada"><button type="button" class="icon-btn" data-close aria-label="Cerrar">✕</button><img alt=""></dialog>

{pie}

<script src="../assets/js/common.js?v={css_v}"></script>
<script>
(() => {{
  const box = document.querySelector('.ej-lightbox');
  const img = box.querySelector('img');
  document.addEventListener('click', (e) => {{
    const b = e.target.closest('.ej-page');
    if (b) {{ img.src = b.dataset.full; img.alt = b.querySelector('img').alt; box.showModal(); return; }}
    if (e.target === box || e.target.closest('[data-close]')) box.close();
  }});
}})();
</script>
</body>
</html>
'''
    from en_chrome import spanish_switch
    pagina = spanish_switch(pagina, "ejemplos")
    (WEB / "ejemplos" / "index.html").write_text(pagina, encoding="utf-8")
    print("ejemplos/index.html escrita")
    import ejemplos_en
    ejemplos_en.write()


if __name__ == "__main__":
    escribir()
