"""en/examples/index.html: the example projects in English (ejemplos/src-en).

Written by tools/ejemplos_pagina.py after the Spanish page; it reuses its
highlighter and file tree. The zips, PDFs and previews live with the Spanish
ones, in ejemplos/descargas, ejemplos/pdf and ejemplos/img.
"""
import html
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import ejemplos_pagina as ep  # noqa: E402
from en_chrome import to_english  # noqa: E402

WEB = ep.WEB
SRC_EN = WEB / "ejemplos" / "src-en"
REPO_EN = "https://github.com/LorGIOO/Pyx-web/tree/main/ejemplos/src-en/"

EXAMPLES = [
    {"slug": "00-template", "titulo": "Empty template", "lema": "The starting point for a new piece of work.",
     "etiquetas": [".pltx preamble", ".sty style", "subdocuments"],
     "texto": "The same structure as the calculation report, without content: a main document that only gathers chapters, a <code>.sty</code> file with the whole look (margins, colours, cover, <code>\\pass</code> and <code>\\fail</code>) and a resources folder for images, data and calculations.",
     "muestra": ["<code>_Preamble.pltx</code> only has the cover, the table of contents and one <code>\\input</code> per chapter.",
                 "Each chapter is a separate <code>.pltx</code>, with its own Python cells.",
                 "<code>pyxstyle.sty</code> keeps the style: change it once and the whole document changes."],
     "abrir": "1. Main/_Preamble.pltx", "fragmentos": [("1. Main/_Preamble.pltx", [(9, 20)])]},
    {"slug": "01-calculation-report", "titulo": "Calculation report", "lema": "A fictitious footbridge, from the input data to the conclusions.",
     "etiquetas": ["chapters", "CSV and Excel", "handcalcs", "pint", "plots", "\\pyif", "Jupyter"],
     "texto": "A large piece of work organised as it would be in real life. The data is read from a CSV and an Excel file; the beam is designed with <em>handcalcs</em>, which writes every formula with its values, and with <em>pint</em> for units; the text says «PASSES» or «FAILS» depending on the result. The wind annex has no cells: it calls the functions of a Jupyter notebook.",
     "muestra": ["The variables of one chapter are used in the following ones.",
                 "One table with a <code>\\py{}</code> in each cell and another written whole with <code>tabletex</code>.",
                 "A table whose rows a loop writes, comparing three sections.",
                 "Change <code>section = \"IPE 330\"</code> to <code>\"IPE 300\"</code> and watch the text, the plot and the tables change."],
     "abrir": "1. Main/_Preamble.pltx", "orden": [4, 3, 5, 6, 2, 1],
     "fragmentos": [("2. Chapters/3. Beam design.pltx", [(30, 50)])]},
    {"slug": "02-handcalcs-and-units", "titulo": "Handcalcs and units", "lema": "Hand calculations, without writing them by hand.",
     "etiquetas": ["handcalcs", "pint", "\\pyif", "plots"],
     "texto": "A single file with the most striking side of Pyx for a technical calculation: a footing and a column. <code>%%render</code> cells put the full development of each formula in the PDF; <code>%%render params</code> writes the data in columns. Every quantity carries its units and conversions happen by themselves.",
     "muestra": ["Greek letters and subscripts from the names: <code>lamb_r</code> is written λ<sub>r</sub>.",
                 "<code>\\pyif</code> compares kPa with MPa without manual conversions.",
                 "A buckling curve with the column's point and a summary table."],
     "abrir": "calculation-with-units.pltx", "fragmentos": [("calculation-with-units.pltx", [(62, 71)])]},
    {"slug": "03-jupyter-notebook", "titulo": "Only a Jupyter notebook", "lema": "A report without a single cell: all the calculation lives in the notebook.",
     "etiquetas": ["\\pynotebook", "\\pyfile", ".ipynb", ".py with # %%", "pandas", "\\pyif"],
     "texto": "For whoever already calculates in Jupyter or VS Code. The document links a notebook (<code>\\pynotebook</code>) and a script with <code># %%</code> blocks (<code>\\pyfile</code>) and, from there, uses their variables and <strong>calls their functions</strong> with the arguments it wants. The plot is saved by the notebook and the document includes it with <code>\\includegraphics</code>.",
     "muestra": ["A whole table written by a function of the notebook: <code>\\py{period_rows([2, 5, 10])}</code>.",
                 "A pandas table queried cell by cell: <code>\\py{quantiles.loc[100, 'P']}</code>.",
                 "If the notebook is open and run, Pyx copies its values without running anything."],
     "abrir": "report.pltx", "fragmentos": [("report.pltx", [(26, 27), (49, 55)]), ("calcs/rainfall.ipynb", "period_rows")]},
    {"slug": "04-tables-plots-and-conditionals", "titulo": "Tables, plots and conditionals", "lema": "A normal DataFrame and a document that asks it questions.",
     "etiquetas": ["pandas", "tabletex", "loops", "matplotlib", "\\pyif", "cells"],
     "texto": "Fictitious energy data in a pandas DataFrame with nothing prepared for LaTeX. The first table is written in LaTeX and the document asks for each number: <code>\\py{df.at[\"Jan\", \"total\"]}</code>. The second is the same DataFrame in one line with <code>tabletex</code>, and the third is written by a loop.",
     "muestra": ["Two ways to place a plot: <code>figtex()</code> (the whole figure) and <code>figure()</code> + <code>\\includegraphics</code>.",
                 "Sentences that change with the data, with colours and even the plural: «1 month» or «4 months».",
                 "Change a datum of the DataFrame: tables, plots and sentences change at once."],
     "abrir": "study.pltx", "fragmentos": [("study.pltx", [(60, 70)])]},
    {"slug": "05-excel-data", "titulo": "Excel and CSV data", "lema": "A budget whose numbers live in Excel, without a line of Python.",
     "etiquetas": ["\\hoja", "\\celda", ".xlsx", ".csv", "no Python"],
     "texto": "The document links an Excel workbook with <code>\\hoja[Quantities]{data/works.xlsx}</code> and places its cells with <code>\\celda{E4}</code>, or a whole range with <code>\\celda{A2:E7}</code>, which comes out as the body of a table. A chapter reads a CSV with the <code>;</code> and decimal comma of Excel in many European languages. Change a number in Excel, save and compile: the document changes by itself.",
     "muestra": ["A single cell in a sentence: <code>\\celda{B3}</code>; another sheet: <code>\\celda{Summary!B5}</code>.",
                 "A whole table from Excel: header <code>\\celda{A1:E1}</code> and body <code>\\celda{A2:E7}</code>.",
                 "<code>\\celda[T]{B2:B6}</code> places a column as a row (and the other way round).",
                 "It reads what Excel saved, including the results of formulas."],
     "abrir": "report.pltx", "fragmentos": [("report.pltx", [(20, 20), (35, 52)])]},
]


def card(n, e):
    slug = e["slug"]
    num = lambda p: int(p.stem.rsplit("-", 1)[1])
    imgs = sorted((WEB / "ejemplos" / "img").glob(f"{slug}-*.webp"), key=num)
    if e.get("orden"):
        imgs.sort(key=lambda p: e["orden"].index(num(p)) if num(p) in e["orden"] else 99)
    zipkb = round((WEB / "ejemplos" / "descargas" / f"{slug}.zip").stat().st_size / 1024)
    pages = "".join(
        f'<button class="ej-page" type="button" data-full="../../ejemplos/img/{p.name}" aria-label="Enlarge page {num(p)}">'
        f'<img src="../../ejemplos/img/{p.name}" alt="{html.escape(e["titulo"])}, page {num(p)}" loading="lazy" width="910" height="1287"></button>'
        for p in imgs)
    code = ""
    for archivo, lang, txt in (ep.fragmento(slug, a, c) for a, c in e["fragmentos"]):
        code += (f'<figure class="code"><span class="code-lang">{html.escape(archivo)}</span>'
                 f'<pre><code>{ep.resaltar(txt, lang)}</code></pre></figure>')
    tags = "".join(f"<li>{html.escape(t)}</li>" for t in e["etiquetas"])
    shows = "".join(f"<li>{m}</li>" for m in e["muestra"])
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
      <ul class="ej-list">{shows}</ul>
      <div class="ej-actions">
        <a class="key primary" href="../../ejemplos/descargas/{slug}.zip" download><svg aria-hidden="true"><use href="#i-down"/></svg>Download .zip <span class="k-hint">{zipkb} KB</span></a>
        <a class="key" href="../../ejemplos/pdf/{slug}.pdf">View the PDF</a>
        <a class="key" href="{REPO_EN}{slug}">View on GitHub</a>
      </div>
      <p class="ej-open">Open <code>{html.escape(e["abrir"])}</code> and press <b>Compile &amp; view</b>.</p>
      <details class="ej-tree"><summary>Project files</summary><pre>{ep.arbol(slug)}</pre></details>
    </div>
    <div class="ej-pages" data-pages="{len(imgs)}">{pages}</div>
  </div>
  {code}
</article>'''


def write():
    es = (WEB / "ejemplos" / "index.html").read_text(encoding="utf-8")
    head = es[:es.index('<header class="page-head">')]
    foot = es[es.index('<footer class="colophon">'):es.index("</footer>") + len("</footer>")]
    head = to_english(head + "</footer>", "ejemplos").replace("</footer>", "")
    foot = to_english("<head></head>" + foot, "ejemplos").split("</head>", 1)[1]
    foot = re.sub(r'\s*<link rel="alternate"[^>]*>', "", foot)
    head = (head.replace("<title>Ejemplos · Pyx</title>", "<title>Examples · Pyx</title>")
            .replace('<meta property="og:title" content="Ejemplos de Pyx">', '<meta property="og:title" content="Pyx examples">')
            .replace('<a href="../examples/" aria-current="page">', '<a href="./" aria-current="page">')
            .replace('<a href="./" aria-current="page">Ejemplos</a>', '<a href="./" aria-current="page">Examples</a>'))
    head = re.sub(r'<meta name="description" content="[^"]*">', '<meta name="description" content="Pyx projects to download, compile and copy: a calculation report, handcalcs and pint, Jupyter notebooks, pandas tables, plots and Excel data.">', head, count=1)
    head = head.replace('href="../../assets/css/ejemplos.css', 'href="../../assets/css/ejemplos.css')
    foot = foot.replace('<li><a href="./">Ejemplos</a></li>', '<li><a href="./">Examples</a></li>')
    css_v = re.search(r"base\.css\?v=([\w]+)", head).group(1)
    # the ES button points at the Spanish examples page
    head = head.replace('href="../../ejemplos/" hreflang="es"', 'href="../../ejemplos/" hreflang="es"')
    old_src, old_ej = ep.SRC, ep.EJ
    ep.SRC, ep.EJ = SRC_EN, {e["slug"]: e for e in EXAMPLES}
    try:
        index = "".join(f'<li><a href="#{e["slug"]}"><span>{n:02d}</span>{html.escape(e["titulo"])}</a></li>' for n, e in enumerate(EXAMPLES))
        body = "".join(card(n, e) for n, e in enumerate(EXAMPLES))
    finally:
        ep.SRC, ep.EJ = old_src, old_ej
    page = f'''{head}<header class="page-head">
  <p class="eyebrow"><span>Examples</span><span class="n">{len(EXAMPLES)} projects to download</span></p>
  <h1>Projects to <em>open, compile and copy.</em></h1>
  <p class="lede">Complete Pyx projects with made-up data. Download one, open it and compile it as it is; then change a datum and watch the whole document rebuild itself. Copy them, break them, use them as templates.</p>
</header>

<div class="ej-layout">
  <main id="contenido">
    <ol class="ej-steps" aria-label="How to use them">
      <li><b>Download</b> the <code>.zip</code> and unzip it wherever you like.</li>
      <li><b>Open</b> in Pyx the main file each one names.</li>
      <li><b>Compile</b> with <span class="menu">Compile &amp; view</span> (Ctrl+Shift+B). The libraries they use come with the Python Pyx sets up.</li>
    </ol>
    <nav class="ej-index" aria-label="Examples"><ol>{index}</ol></nav>
{body}
    <p class="ej-foot">Every datum, name and result is fictitious. The examples are compiled with Pyx itself each time they are published; if one does not compile for you, <a href="https://github.com/LorGIOO/Pyx/issues">tell us</a>.</p>
  </main>
</div>

<dialog class="ej-lightbox" aria-label="Enlarged page"><button type="button" class="icon-btn" data-close aria-label="Close">✕</button><img alt=""></dialog>

{foot}

<script src="../../assets/js/common.js?v={css_v}"></script>
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
    out = WEB / "en" / "examples"
    out.mkdir(parents=True, exist_ok=True)
    (out / "index.html").write_text(page, encoding="utf-8")
    print("en/examples/index.html written")


if __name__ == "__main__":
    write()
