#!/usr/bin/env python3
"""Genera la versión web del manual de usuario de Pyx.

Lee el código LaTeX del manual (el documento ``manual-pyx.pltx`` del
repositorio de Pyx) y escribe:

  manual/index.html          el manual navegable (a partir de manual/plantilla.html)
  assets/data/atajos.json    los atajos de teclado, para la página principal
  assets/img/flecha.png      la gráfica que calcula una celda del manual

Uso (desde la raíz de este repositorio):

    python3 tools/manual.py "../Pyx/Manual de usuario/manual-pyx.pltx"

Solo usa la biblioteca estándar de Python.
"""
from __future__ import annotations

import base64
import html
import json
import re
import sys
import zipfile
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent

# Valores que calcularon las celdas del manual la última vez que se compiló.
# Si el manual cambia de versión, basta con actualizarlos aquí.
VALORES_PY = {
    "fecha": "14 de noviembre de 2026",
    "mes_anio": "noviembre de 2026",
    "version_python": "3.13.7",
    "version_numpy": "2.3.4",
    'f"{flecha:.2f}"': "7.69",
    'f"{admisible:.1f}"': "10.0",
}
VALORES_PYIF = {"flecha <= admisible": True}
VALORES_PY_EN = dict(VALORES_PY, fecha="November 22, 2026", mes_anio="November 2026")

# --en: the English manual (manual-pyx-en.pltx) into en/manual/.
EN = "--en" in sys.argv


def L(es: str, en: str) -> str:
    return en if EN else es


# --------------------------------------------------------------------------
# Lectura
# --------------------------------------------------------------------------
def leer_pltx(ruta: Path) -> tuple[str, dict]:
    with zipfile.ZipFile(ruta) as z:
        fuente = z.read("source.tex").decode("utf-8")
        nombres = z.namelist()
        salidas = json.loads(z.read("outputs.json").decode("utf-8")) if "outputs.json" in nombres else {}
    return fuente, salidas


def cuerpo(fuente: str) -> str:
    """El documento entre \\begin{document} y \\end{document}."""
    return fuente.split("\\begin{document}", 1)[1].split("\\end{document}", 1)[0]


def limpiar(t: str) -> str:
    """Sin celdas, sin portada, sin la página de créditos y sin el índice."""
    t = re.sub(r"^%#python.*?^%#end[^\n]*\n", "", t, flags=re.S | re.M)
    t = re.sub(r"\\begin\{titlepage\}.*?\\end\{titlepage\}", "", t, flags=re.S)
    # página de créditos (hasta el primer \clearpage) e índice
    t = re.sub(r"\\thispagestyle\{empty\}\s*\\vspace\*\{\\fill\}.*?\\clearpage", "", t, count=1, flags=re.S)
    t = t.replace("\\tableofcontents", "").replace("\\clearpage", "")
    return t


# --------------------------------------------------------------------------
# Utilidades del analizador
# --------------------------------------------------------------------------
def quitar_comentarios(t: str) -> str:
    lineas = []
    for linea in t.split("\n"):
        m = re.search(r"(?<!\\)%", linea)
        if m:
            resto = linea[: m.start()]
            if not resto.strip():
                continue  # la línea entera era un comentario
            linea = resto
        lineas.append(linea)
    return "\n".join(lineas)


def grupo(t: str, i: int) -> tuple[str, int]:
    """Lee un grupo {…} que empieza en t[i] (saltando espacios). Devuelve
    (contenido, posición tras la llave de cierre)."""
    while i < len(t) and t[i] in " \t\n":
        i += 1
    if i >= len(t) or t[i] != "{":
        # argumento de un solo token
        if i < len(t) and t[i] == "\\":
            m = re.match(r"\\[A-Za-z]+|\\.", t[i:])
            return m.group(0), i + len(m.group(0))
        return (t[i], i + 1) if i < len(t) else ("", i)
    nivel, j = 0, i
    while j < len(t):
        c = t[j]
        if c == "\\":
            j += 2
            continue
        if c == "{":
            nivel += 1
        elif c == "}":
            nivel -= 1
            if nivel == 0:
                return t[i + 1 : j], j + 1
        j += 1
    raise ValueError("llave sin cerrar cerca de: " + t[i : i + 80])


def opcional(t: str, i: int) -> tuple[str | None, int]:
    j = i
    while j < len(t) and t[j] in " \t":
        j += 1
    if j < len(t) and t[j] == "[":
        nivel, k = 0, j
        while k < len(t):
            if t[k] == "{":
                nivel += 1
            elif t[k] == "}":
                nivel -= 1
            elif t[k] == "]" and nivel == 0:
                return t[j + 1 : k], k + 1
            k += 1
    return None, i


def slug(texto: str) -> str:
    s = texto.lower()
    for a, b in zip("áéíóúüñ", "aeiouun"):
        s = s.replace(a, b)
    s = re.sub(r"<[^>]+>", "", s)
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s or "seccion"


def plano(htm: str) -> str:
    return html.unescape(re.sub(r"<[^>]+>", "", htm))


# --------------------------------------------------------------------------
# Conversión
# --------------------------------------------------------------------------
BLOQUE = "\x00B\x00"  # marca de límite de bloque (no se envuelve en <p>)

LATEX_LOGO = '<span class="latex">L<sup>a</sup>T<sub>e</sub>X</span>'

PY_KW = r"\b(import|from|as|def|return|for|in|if|else|elif|while|with|True|False|None|and|or|not|lambda|class)\b"


def resaltar(codigo: str, lenguaje: str) -> str:
    """Resaltado mínimo en una sola pasada (el código llega sin escapar)."""
    if lenguaje == "python":
        patron = re.compile(
            r"(?P<magic>^\s*%%\w+.*$)|(?P<com>#.*$)|(?P<str>[rf]{0,2}(\"[^\"\n]*\"|'[^'\n]*'))"
            r"|(?P<kw>" + PY_KW + r")|(?P<num>(?<![\w.])\d+\.?\d*(?:e\d+)?)",
            re.M,
        )
        clases = {"magic": "tk-magic", "com": "tk-com", "str": "tk-str", "kw": "tk-kw", "num": "tk-num"}
    else:
        patron = re.compile(
            r"(?P<cell>^\s*%#.*$)|(?P<com>(?<!\\)%.*$)|(?P<py>\\(?:pyif|pyfile|pynotebook|py)\b)"
            r"|(?P<cmd>\\[A-Za-z]+)",
            re.M,
        )
        clases = {"cell": "tk-cell", "com": "tk-com", "py": "tk-py", "cmd": "tk-cmd"}
    out, pos = [], 0
    for m in patron.finditer(codigo):
        out.append(html.escape(codigo[pos : m.start()], quote=False))
        clase = clases[m.lastgroup] if m.lastgroup in clases else next(clases[k] for k in clases if m.group(k))
        out.append(f'<span class="{clase}">{html.escape(m.group(0), quote=False)}</span>')
        pos = m.end()
    out.append(html.escape(codigo[pos:], quote=False))
    return "".join(out)


class Conversor:
    def __init__(self) -> None:
        self.capitulo = 0
        self.seccion = 0
        self.subseccion = 0
        self.figura = 0
        self.etiquetas: dict[str, tuple[str, str]] = {}  # clave -> (número, id)
        self.ultimo: tuple[str, str] = ("", "")
        self.indice: list[dict] = []  # capítulos con sus secciones
        self.atajos: list[dict] = []
        self.listados: list[str] = []
        self.ids: set[str] = set()

    # -- identificadores únicos
    def nuevo_id(self, base: str) -> str:
        i, n = base, 2
        while i in self.ids:
            i = f"{base}-{n}"
            n += 1
        self.ids.add(i)
        return i

    # -- listados (se protegen antes de convertir nada)
    def proteger_listados(self, t: str) -> str:
        def sustituir(m: re.Match) -> str:
            opciones, codigo = m.group(1) or "", m.group(2)
            lenguaje = "python" if "Python" in opciones else "latex"
            codigo = codigo.strip("\n")
            n = len(self.listados)
            etiqueta = "Python" if lenguaje == "python" else "Pyx · LaTeX"
            self.listados.append(
                f'<div class="code"><span class="code-lang">{etiqueta}</span>'
                f'<button class="code-copy" type="button" aria-label="{L("Copiar el código", "Copy the code")}">{L("Copiar", "Copy")}</button>'
                f"<pre><code>{resaltar(codigo, lenguaje)}</code></pre></div>"
            )
            return f"{BLOQUE}\x00L{n}\x00{BLOQUE}"

        return re.sub(r"\\begin\{lstlisting\}(?:\[(.*?)\])?\n?(.*?)\\end\{lstlisting\}", sustituir, t, flags=re.S)

    # -- conversión principal
    def convertir(self, t: str) -> str:
        out: list[str] = []
        i = 0
        n = len(t)
        while i < n:
            c = t[i]
            if c == "\\":
                i = self.orden(t, i, out)
                continue
            if c == "{" or c == "}":
                i += 1
                continue
            if c == "~":
                out.append("&nbsp;")
                i += 1
                continue
            if c == "$":
                j = t.find("$", i + 1)
                out.append(f'<span class="math">{self.mate(t[i + 1 : j])}</span>')
                i = j + 1
                continue
            if c == "-" and t.startswith("---", i):
                out.append("—")
                i += 3
                continue
            if c == "-" and t.startswith("--", i):
                out.append("–")
                i += 2
                continue
            if c == "&":
                out.append("\x00TD\x00")
                i += 1
                continue
            if c == "<":
                out.append("&lt;")
            elif c == ">":
                out.append("&gt;")
            else:
                out.append(c)
            i += 1
        return "".join(out)

    def mate(self, m: str) -> str:
        m = m.replace("\\ln", "ln ").replace("\\times", "×").replace("\\cdot", "·")
        m = re.sub(r"_\{([^}]*)\}", r"<sub>\1</sub>", m)
        m = re.sub(r"_(\w)", r"<sub>\1</sub>", m)
        m = re.sub(r"\^\{([^}]*)\}", r"<sup>\1</sup>", m)
        m = re.sub(r"\^(\w)", r"<sup>\1</sup>", m)
        return re.sub(r"(?<![<\w/])([A-Za-z])(?![\w>])", r"<i>\1</i>", m)

    def orden(self, t: str, i: int, out: list[str]) -> int:
        m = re.match(r"\\([A-Za-z]+\*?|.)", t[i:])
        nombre = m.group(1)
        i += len(m.group(0))

        # caracteres escapados
        escapes = {"{": "{", "}": "}", "%": "%", "&": "&amp;", "_": "_", "$": "$", "#": "#",
                   ",": "&thinsp;", " ": " ", "\\": "<br>", "-": "&shy;", "/": ""}
        if nombre in escapes:
            if nombre == "\\":
                _, i = opcional(t, i)
            out.append(escapes[nombre])
            return i

        def arg() -> str:
            nonlocal i
            a, i = grupo(t, i)
            return a

        def opt() -> str | None:
            nonlocal i
            o, i = opcional(t, i)
            return o

        conv = self.convertir

        # -- estructura
        if nombre in ("chapter", "chapter*"):
            titulo = conv(arg())
            if nombre == "chapter":
                self.capitulo += 1
                num = str(self.capitulo)
            else:
                num = ""
            self.seccion = self.subseccion = self.figura = 0
            ident = self.nuevo_id("cap-" + slug(titulo))
            self.ultimo = (num, ident)
            self.indice.append({"num": num, "titulo": titulo, "id": ident, "secciones": []})
            cierre = "</section>" if len(self.indice) > 1 else ""
            etiqueta = html.escape(f"<b>{num or '·'}</b> · {plano(titulo)}", quote=True)
            out.append(
                f'{BLOQUE}{cierre}<section class="chapter" id="{ident}" data-num="{num}" data-chapter="{etiqueta}">'
                f'<header class="chapter-head"><span class="chapter-num">{num or "·"}</span>'
                f"<h2>{titulo}</h2></header>{BLOQUE}"
            )
            return i
        if nombre == "section":
            titulo = conv(arg())
            self.seccion += 1
            self.subseccion = 0
            num = f"{self.capitulo}.{self.seccion}"
            ident = self.nuevo_id(slug(titulo))
            self.ultimo = (num, ident)
            self.indice[-1]["secciones"].append({"num": num, "titulo": titulo, "id": ident})
            out.append(f'{BLOQUE}<h3 id="{ident}"><span class="sec-num">{num}</span> {titulo}'
                       f'<a class="anchor" href="#{ident}" aria-label="{L('Enlace a esta sección', 'Link to this section')}">#</a></h3>{BLOQUE}')
            return i
        if nombre == "subsection":
            titulo = conv(arg())
            self.subseccion += 1
            num = f"{self.capitulo}.{self.seccion}.{self.subseccion}"
            ident = self.nuevo_id(slug(titulo))
            self.ultimo = (num, ident)
            out.append(f'{BLOQUE}<h4 id="{ident}"><span class="sec-num">{num}</span> {titulo}</h4>{BLOQUE}')
            return i
        if nombre == "subsubsection":
            titulo = conv(arg())
            ident = self.nuevo_id(slug(titulo))
            out.append(f'{BLOQUE}<h5 id="{ident}">{titulo}</h5>{BLOQUE}')
            return i
        if nombre == "label":
            self.etiquetas[arg()] = self.ultimo
            return i
        if nombre in ("ref", "eqref"):
            clave = arg()
            out.append(f"\x00R{clave}\x00")
            return i

        # -- formato en línea
        envolturas = {
            "textbf": ("<strong>", "</strong>"), "emph": ("<em>", "</em>"), "textit": ("<em>", "</em>"),
            "texttt": ("<code>", "</code>"), "menu": ('<span class="menu">', "</span>"),
            "boton": ('<span class="ui-btn">', "</span>"), "kbd": ("<kbd>", "</kbd>"),
            "ruta": ('<span class="menu">', "</span>"), "textsf": ("<span>", "</span>"),
            "numcirc": ('<span class="numcirc">', "</span>"), "underline": ("<u>", "</u>"),
        }
        if nombre in envolturas:
            a, b = envolturas[nombre]
            out.append(a + conv(arg()) + b)
            return i
        if nombre == "pyxcmd":
            out.append("<code>\\" + conv(arg()) + "</code>")
            return i
        if nombre == "url":
            u = arg()
            out.append(f'<a href="{html.escape(u)}">{html.escape(u.replace("https://", ""))}</a>')
            return i
        if nombre == "LaTeX":
            out.append(LATEX_LOGO)
            if t.startswith("{}", i):
                i += 2
            return i
        if nombre == "textbackslash":
            out.append("\\")
            if t.startswith("{}", i):
                i += 2
            while i < len(t) and t[i] == " ":
                i += 1
            return i
        if nombre == "textasciitilde":
            out.append("~")
            return i
        if nombre == "texorpdfstring":
            a = arg()
            arg()
            out.append(conv(a))
            return i
        if nombre == "py":
            expr = arg()
            out.append(html.escape((VALORES_PY_EN if EN else VALORES_PY).get(expr, expr)))
            return i
        if nombre == "pyif":
            cond, si = arg(), arg()
            no = ""
            j = i
            while j < len(t) and t[j] in " \n":
                j += 1
            if j < len(t) and t[j] == "{":
                no, i = grupo(t, j)
            out.append(conv(si if VALORES_PYIF.get(cond.strip(), True) else no))
            return i
        if nombre == "captura":
            ancho = opt()
            archivo, pie = arg(), arg()
            out.append(self.figura_html([(archivo, ancho)], conv(pie), "fig:" + archivo))
            return i
        if nombre == "includegraphics":
            opt()
            out.append(f"\x00IMG{arg()}\x00")
            return i
        if nombre == "caption":
            out.append(f"\x00CAP{arg()}\x00")
            return i
        if nombre == "grupo":
            out.append(f'\x00GRP{conv(arg())}\x00')
            return i
        if nombre == "newcommand":
            arg()
            opt()
            arg()
            return i
        if nombre in ("addcontentsline",):
            arg(); arg(); arg()
            return i
        if nombre in ("markboth", "rule"):
            arg(); arg()
            return i
        if nombre in ("vspace", "vspace*", "color", "thispagestyle", "setcounter", "hspace"):
            arg()
            return i
        if nombre == "pyxlogo":
            opt()
            return i
        if nombre == "tcbox":
            opt()
            out.append(conv(arg()))
            return i
        if nombre == "par":
            out.append("\n\n")
            return i
        if nombre in ("item",):
            etiqueta = opt()
            if etiqueta is not None:
                out.append(f"\x00DT{conv(etiqueta)}\x00")
            else:
                out.append("\x00LI\x00")
            return i
        if nombre in ("begin", "end"):
            entorno = arg()
            return self.entorno(t, i, nombre, entorno, out)
        # órdenes que no producen nada en la web
        return i

    # -- entornos
    def entorno(self, t: str, i: int, accion: str, entorno: str, out: list[str]) -> int:
        cajas = {"consejo": "Tip", "nota": "Note", "atencion": "Caution"} if EN else {"consejo": "Consejo", "nota": "Nota", "atencion": "Atención"}
        if entorno in cajas:
            if accion == "begin":
                titulo, i = opcional(t, i)
                titulo = self.convertir(titulo) if titulo else cajas[entorno]
                out.append(f'{BLOQUE}<aside class="box box-{entorno}"><p class="box-title">{titulo}</p>{BLOQUE}')
            else:
                out.append(f"{BLOQUE}</aside>{BLOQUE}")
            return i
        if entorno in ("itemize", "enumerate", "description"):
            if accion == "begin":
                opciones, i = opcional(t, i)
                cuerpo_fin = self.fin_entorno(t, i, entorno)
                interior = self.convertir(t[i:cuerpo_fin])
                i = cuerpo_fin + len(f"\\end{{{entorno}}}")
                out.append(self.lista(entorno, interior, opciones or ""))
            return i
        if entorno in ("tabular", "longtable"):
            if accion == "begin":
                _, i = grupo(t, i)  # especificación de columnas
                fin = self.fin_entorno(t, i, entorno)
                interior = self.convertir(t[i:fin])
                i = fin + len(f"\\end{{{entorno}}}")
                out.append(self.tabla(interior, atajos=(entorno == "longtable")))
            return i
        if entorno == "figure":
            if accion == "begin":
                _, i = opcional(t, i)
                fin = self.fin_entorno(t, i, entorno)
                interior = self.convertir(t[i:fin])
                i = fin + len("\\end{figure}")
                out.append(self.figura_entorno(interior))
            return i
        if entorno == "tcolorbox":
            if accion == "begin":
                _, i = opcional(t, i)
                out.append(f'{BLOQUE}<div class="pdf-sample"><span class="pdf-sample-tag">En el PDF</span>{BLOQUE}')
            else:
                out.append(f"{BLOQUE}</div>{BLOQUE}")
            return i
        if entorno == "novedad":
            out.append(f'{BLOQUE}<div class="novedad">{BLOQUE}' if accion == "begin" else f"{BLOQUE}</div>{BLOQUE}")
            return i
        if entorno == "minipage" and accion == "begin":
            _, i = opcional(t, i)
            _, i = grupo(t, i)
            return i
        if entorno == "center":
            out.append(f'{BLOQUE}<div class="center">{BLOQUE}' if accion == "begin" else f"{BLOQUE}</div>{BLOQUE}")
            return i
        return i

    def fin_entorno(self, t: str, i: int, entorno: str) -> int:
        abre, cierra = f"\\begin{{{entorno}}}", f"\\end{{{entorno}}}"
        nivel, j = 1, i
        while True:
            a, c = t.find(abre, j), t.find(cierra, j)
            if a != -1 and a < c:
                nivel += 1
                j = a + len(abre)
            else:
                nivel -= 1
                if nivel == 0:
                    return c
                j = c + len(cierra)

    def lista(self, entorno: str, interior: str, opciones: str) -> str:
        if entorno == "description":
            partes = interior.split("\x00DT")[1:]
            filas = []
            for p in partes:
                termino, texto = p.split("\x00", 1)
                filas.append(f"<dt>{termino.strip()}</dt><dd>{parrafos(texto.strip(), inline=True)}</dd>")
            return f'{BLOQUE}<dl class="desc">{"".join(filas)}</dl>{BLOQUE}'
        partes = interior.split("\x00LI\x00")[1:]
        etiqueta = "ol" if entorno == "enumerate" else "ul"
        clase = ' class="zones"' if "numcirc" in opciones else ""
        items = "".join(f"<li>{parrafos(p.strip(), inline=True)}</li>" for p in partes)
        return f"{BLOQUE}<{etiqueta}{clase}>{items}</{etiqueta}>{BLOQUE}"

    def tabla(self, interior: str, atajos: bool) -> str:
        filas_html = []
        grupo_actual = ""
        for fila in re.split(r"<br>", interior):
            fila = fila.strip()
            if not fila:
                continue
            g = re.search(r"\x00GRP(.*?)\x00", fila)
            if g:
                grupo_actual = plano(g.group(1)).strip()
                filas_html.append(f'<tr class="group"><th colspan="2">{g.group(1)}</th></tr>')
                fila = fila[g.end():].strip()
                if not fila:
                    continue
            celdas = [c.strip() for c in fila.split("\x00TD\x00")]
            if all(not c for c in celdas):
                continue
            if ("Atajo" in celdas[0] or "Shortcut" in celdas[0]) and atajos:
                filas_html.insert(0, "<thead><tr>" + "".join(f"<th>{plano(c)}</th>" for c in celdas) + "</tr></thead>")
                continue
            if atajos and len(celdas) == 2:
                teclas = celdas[0]
                self.atajos.append({
                    "grupo": grupo_actual,
                    "teclas": re.findall(r"<kbd>(.*?)</kbd>", teclas),
                    "texto": plano(teclas),
                    "accion": plano(celdas[1]),
                })
            filas_html.append("<tr>" + "".join(f"<td>{c}</td>" for c in celdas) + "</tr>")
        clase = "shortcuts" if atajos else "data"
        return f'{BLOQUE}<div class="table-wrap"><table class="{clase}">{"".join(filas_html)}</table></div>{BLOQUE}'

    def figura_html(self, imagenes: list[tuple[str, str | None]], pie: str, clave: str) -> str:
        self.figura += 1
        num = f"{self.capitulo}.{self.figura}"
        ident = self.nuevo_id("fig-" + slug(clave.split(":", 1)[1].rsplit(".", 1)[0]))
        self.etiquetas[clave] = (num, ident)
        self.ultimo = (num, ident)
        imgs = []
        for archivo, ancho in imagenes:
            estilo = ""
            if ancho:
                mm = re.match(r"([\d.]+)\\linewidth", ancho)
                if mm:
                    estilo = f' style="max-width:{float(mm.group(1)) * 100:.0f}%"'
            src = "../assets/img/" + archivo.replace(".png", ".webp")
            imgs.append(f'<img src="{src}" alt="{html.escape(plano(pie))}" loading="lazy" decoding="async"{estilo}>')
        return (f'{BLOQUE}<figure class="shot" id="{ident}"><button class="shot-zoom" type="button" aria-label="{L('Ampliar la imagen', 'Enlarge the image')}">'
                f'{"".join(imgs)}</button><figcaption><span class="fig-num">{L("Figura", "Figure")} {num}</span> {pie}</figcaption></figure>{BLOQUE}')

    def figura_entorno(self, interior: str) -> str:
        imagenes = re.findall(r"\x00IMG(.*?)\x00", interior)
        pies = re.findall(r"\x00CAP(.*?)\x00", interior, flags=re.S)
        etiquetas = [k for k, v in self.etiquetas.items() if False]  # se asignan abajo
        piezas = []
        for n, img in enumerate(imagenes):
            pie = self.convertir(pies[n]) if n < len(pies) else ""
            if "ruta_flecha" in img:
                archivo, src = "flecha", ("../../assets/img/flecha-en.png" if EN else "../assets/img/flecha.png")
            else:
                archivo = img.split("/")[-1]
                src = ("../../assets/img/" if EN else "../assets/img/") + archivo.replace(".png", ".webp")
            self.figura += 1
            num = f"{self.capitulo}.{self.figura}"
            ident = self.nuevo_id("fig-" + slug(archivo.rsplit(".", 1)[0]))
            self.ultimo = (num, ident)
            self.etiquetas["fig:" + archivo] = (num, ident)
            piezas.append(
                f'<figure class="shot" id="{ident}"><button class="shot-zoom" type="button" aria-label="{L('Ampliar la imagen', 'Enlarge the image')}">'
                f'<img src="{src}" alt="{html.escape(plano(pie))}" loading="lazy" decoding="async"></button>'
                f'<figcaption><span class="fig-num">{L("Figura", "Figure")} {num}</span> {pie}</figcaption></figure>'
            )
        del etiquetas
        clase = "shot-row" if len(piezas) > 1 else "shot-single"
        return f'{BLOQUE}<div class="{clase}">{"".join(piezas)}</div>{BLOQUE}'


def parrafos(htm: str, inline: bool = False) -> str:
    trozos = [x for x in htm.split(BLOQUE)]
    res = []
    for k, trozo in enumerate(trozos):
        if k % 2 == 1:  # bloque ya formado
            res.append(trozo)
            continue
        for p in re.split(r"\n\s*\n", trozo):
            p = re.sub(r"\s+", " ", p).strip()
            if not p:
                continue
            res.append(p if (inline and len(trozos) == 1) else f"<p>{p}</p>")
    return "\n".join(res)


def resolver(htm: str, conv: Conversor) -> str:
    def ref(m: re.Match) -> str:
        num, ident = conv.etiquetas.get(m.group(1), ("?", ""))
        return f'<a class="ref" href="#{ident}">{num}</a>' if ident else num

    htm = re.sub(r"\x00R(.*?)\x00", ref, htm)
    htm = re.sub(r"\x00L(\d+)\x00", lambda m: conv.listados[int(m.group(1))], htm)
    return htm


def indice_html(conv: Conversor) -> str:
    partes = []
    for cap in conv.indice:
        subs = "".join(
            f'<li><a href="#{s["id"]}"><span class="n">{s["num"]}</span><span class="t">{s["titulo"]}</span></a></li>' for s in cap["secciones"]
        )
        partes.append(
            f'<li class="toc-chap"><a href="#{cap["id"]}"><span class="n">{cap["num"] or "·"}</span><span class="t">{cap["titulo"]}</span></a>'
            + (f"<ol>{subs}</ol>" if subs else "")
            + "</li>"
        )
    return "<ol>" + "".join(partes) + "</ol>"


PLANTILLA_EN = [
    ("<title>Manual de usuario · Pyx</title>", "<title>User manual · Pyx</title>"),
    ('content="Manual de usuario de Pyx"', 'content="Pyx user manual"'),
    ('content="Todo Pyx, capítulo a capítulo."', 'content="All of Pyx, chapter by chapter."'),
    ('<a href="../manual/" aria-current="page">Manual</a>', '<a href="./" aria-current="page">Manual</a>'),
    ('<span class="n">Escrito y compilado con Pyx</span>', '<span class="n">Written and compiled with Pyx</span>'),
    ("<h1>Manual de <em>usuario</em></h1>", "<h1>User <em>manual</em></h1>"),
    ('href="manual-pyx.pdf"', 'href="pyx-user-manual.pdf"'),
    (">Manual en PDF <span", ">Manual as PDF <span"),
    ('href="#cap-atajos-de-teclado">', 'href="#cap-keyboard-shortcuts">'),
    ("<span>Versión 2.2.1</span>", "<span>Version 2.2.1</span>"),
    (">1,8 MB</span>", ">1.8 MB</span>"),
    ("<p class=\"lede\">Todo Pyx, capítulo a capítulo: desde instalarlo hasta el último atajo de teclado. Es el mismo texto que el PDF, que se escribió en Pyx con celdas de Python que se ejecutaron al compilarlo.</p>",
     "<p class=\"lede\">All of Pyx, chapter by chapter: from installing it to the last keyboard shortcut. It is the same text as the PDF, which was written in Pyx with Python cells that ran when it was compiled.</p>"),
    ('content="El manual de usuario completo de Pyx 2.2: instalación, la interfaz, LaTeX, celdas de Python, \\py{} y \\pyif, cuadernos de Jupyter, datos de Excel, ejecución reactiva, compilación, el visor de PDF, macros, configuración y atajos."',
     'content="The complete Pyx 2.2 user manual: installation, the interface, LaTeX, Python cells, \\py{} and \\pyif, Jupyter notebooks, Excel data, reactive execution, compiling, the PDF viewer, macros, settings and shortcuts."'),
    ('href="#cap-solucion-de-problemas">Solución de problemas</a>', 'href="#cap-troubleshooting">Troubleshooting</a>'),
    ('aria-label="Índice del manual"', 'aria-label="Contents of the manual"'),
    ('placeholder="Buscar en el manual" aria-label="Buscar en el manual"', 'placeholder="Search the manual" aria-label="Search the manual"'),
    ('aria-label="Resultados"', 'aria-label="Results"'),
    ('<p class="toc-title">Índice</p>', '<p class="toc-title">Contents</p>'),
    ("data-toc-toggle>Índice</button>", "data-toc-toggle>Contents</button>"),
    ("<p>Esta página se genera a partir de la fuente del manual en PDF. No usa cookies ni rastreadores.</p>", "<p>This page is generated from the source of the PDF manual. It uses no cookies or trackers.</p>"),
    ('<li><a href="./">User manual</a></li><li><a href="pyx-user-manual.pdf">', '<li><a href="./">User manual</a></li><li><a href="pyx-user-manual.pdf">'),
]


def main() -> None:
    args = [a for a in sys.argv[1:] if a != "--en"]
    base = RAIZ.parent / "Pyx" / "Manual de usuario"
    ruta = Path(args[0]) if args else base / ("manual-pyx-en.pltx" if EN else "manual-pyx.pltx")
    fuente, salidas = leer_pltx(ruta)

    # la gráfica de la ménsula que dibujó la celda manual02
    imagenes = salidas.get("cells", {}).get("manual02", {}).get("images", [])
    if imagenes:
        (RAIZ / "assets" / "img" / ("flecha-en.png" if EN else "flecha.png")).write_bytes(base64.b64decode(imagenes[0]))

    conv = Conversor()
    t = conv.proteger_listados(cuerpo(fuente))
    t = limpiar(t)
    t = quitar_comentarios(t)
    htm = conv.convertir(t)
    htm = parrafos(htm) + "\n</section>"
    htm = resolver(htm, conv)
    # lo que queda con barra invertida fuera del código, las rutas y los textos alternativos
    limpio = re.sub(r'<pre>.*?</pre>|<code>.*?</code>|<span class="menu">.*?</span>|alt="[^"]*"', "", htm, flags=re.S)
    restos = re.findall(r"\\[A-Za-z]+", limpio)
    if restos:
        print("Aviso: órdenes sin convertir:", sorted(set(restos)), file=sys.stderr)
    if "\x00" in htm:
        print("Aviso: quedan marcas internas sin resolver", file=sys.stderr)

    plantilla = (RAIZ / "manual" / "plantilla.html").read_text(encoding="utf-8")
    if EN:
        sys.path.insert(0, str(Path(__file__).resolve().parent))
        from en_chrome import to_english
        plantilla = to_english(plantilla, "manual")
        for a, b in PLANTILLA_EN:
            plantilla = plantilla.replace(a, b)
    pagina = plantilla.replace("{{INDICE}}", indice_html(conv)).replace("{{CONTENIDO}}", htm)
    salida = RAIZ / "en" / "manual" if EN else RAIZ / "manual"
    salida.mkdir(parents=True, exist_ok=True)
    (salida / "index.html").write_text(pagina, encoding="utf-8")
    if EN:
        print(f"Manual (en): {conv.capitulo} chapters, {len(conv.ids)} anchors.")
        return

    datos = RAIZ / "assets" / "data"
    datos.mkdir(parents=True, exist_ok=True)
    (datos / "atajos.json").write_text(json.dumps(conv.atajos, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"Manual: {conv.capitulo} capítulos, {len(conv.ids)} anclas, {len(conv.atajos)} atajos.")


if __name__ == "__main__":
    main()
