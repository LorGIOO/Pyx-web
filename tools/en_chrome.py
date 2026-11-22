"""The English site's header and footer (tools/en_pages.py, tools/ejemplos_pagina.py, tools/manual.py).

A Spanish page one level deep (novedades/, privacidad/…) becomes its English
counterpart two levels deep (en/news/…): its chrome is translated here and its
links re-pointed; the page body is each tool's business.
"""
import re

# Spanish page folder -> English page folder (inside en/)
PAGES = {"ejemplos": "examples", "novedades": "news", "privacidad": "privacy", "firma": "signing", "manual": "manual"}

CHROME = [
    ('<html lang="es">', '<html lang="en">'),
    ('>Saltar al contenido<', '>Skip to content<'),
    ('aria-label="Pyx, inicio"', 'aria-label="Pyx, home"'),
    ('aria-label="Principal"', 'aria-label="Main"'),
    ('>Laboratorio</a>', '>Lab</a>'),
    ('>Ejemplos</a>', '>Examples</a>'),
    ('>Novedades</a>', '>What’s new</a>'),
    ('Descargar</a>\n  </nav>', 'Download</a>\n  </nav>'),
    ('aria-label="El código de Pyx en GitHub" title="El código de Pyx en GitHub"', 'aria-label="Pyx’s code on GitHub" title="Pyx’s code on GitHub"'),
    ('aria-label="Cambiar el tema"', 'aria-label="Change the theme"'),
    ('aria-label="Menú"', 'aria-label="Menu"'),
    ('<p>El cálculo y el documento, en un mismo archivo.</p>', '<p>The calculation and the document, in one file.</p>'),
    ('<p>No usa cookies ni rastreadores.</p>', '<p>No cookies or trackers.</p>'),
    ('<h2>Producto</h2>', '<h2>Product</h2>'),
    ('>Descargar</a></li>', '>Download</a></li>'),
    ('<h2>Ayuda</h2>', '<h2>Help</h2>'),
    ('>Manual de usuario</a>', '>User manual</a>'),
    ('>Manual en PDF</a>', '>Manual as PDF</a>'),
    ('>Atajos de teclado</a>', '>Keyboard shortcuts</a>'),
    ('>Informar de un fallo</a>', '>Report a bug</a>'),
    ('<h2>Proyecto</h2>', '<h2>Project</h2>'),
    ('>Código fuente</a>', '>Source code</a>'),
    ('>Privacidad</a>', '>Privacy</a>'),
    ('>Firma de código</a>', '>Code signing</a>'),
    ('>Licencia MIT</a>', '>MIT licence</a>'),
    ('Pyx · Software libre</span>', 'Pyx · Free software</span>'),
]


def to_english(html, es_folder):
    """A Spanish sub-page's chrome in English, its links pointing at en/."""
    # the Spanish page's own EN button and hreflang links go: these are re-made
    html = re.sub(r'  <a class="icon-btn lang-btn"[^\n]*\n', '', html)
    html = re.sub(r'  <link rel="alternate" hreflang="[a-z]+"[^\n]*\n', '', html)
    for a, b in CHROME:
        html = html.replace(a, b)
    # one level deeper: ../assets -> ../../assets
    html = re.sub(r'(href|src|content)="\.\./assets/', r'\1="../../assets/', html)
    for es, en in PAGES.items():
        html = html.replace(f'href="../{es}/', f'href="../{en}/')
    html = html.replace('href="./"', 'href="./"')
    html = html.replace('manual/manual-pyx.pdf', 'manual/pyx-user-manual.pdf')
    html = html.replace('manual/#cap-atajos-de-teclado', 'manual/#cap-keyboard-shortcuts')
    en_folder = PAGES.get(es_folder, es_folder)
    lang = (f'  <a class="icon-btn lang-btn" href="../../{es_folder}/" hreflang="es" lang="es" '
            'title="Ver en español" aria-label="Ver en español">ES</a>\n')
    html = html.replace('  <a class="icon-btn gh-btn"', lang + '  <a class="icon-btn gh-btn"', 1)
    alt = (f'  <link rel="alternate" hreflang="es" href="https://lorgioo.github.io/Pyx-web/{es_folder}/">\n'
           f'  <link rel="alternate" hreflang="en" href="https://lorgioo.github.io/Pyx-web/en/{en_folder}/">\n')
    return html.replace('</head>', alt + '</head>', 1)


def spanish_switch(html, es_folder):
    """The EN button and hreflang links on a Spanish sub-page."""
    if 'lang-btn' in html:
        return html
    en_folder = PAGES.get(es_folder, es_folder)
    lang = (f'  <a class="icon-btn lang-btn" href="../en/{en_folder}/" hreflang="en" lang="en" '
            'title="View in English" aria-label="View in English">EN</a>\n')
    html = html.replace('  <a class="icon-btn gh-btn"', lang + '  <a class="icon-btn gh-btn"', 1)
    alt = (f'  <link rel="alternate" hreflang="es" href="https://lorgioo.github.io/Pyx-web/{es_folder}/">\n'
           f'  <link rel="alternate" hreflang="en" href="https://lorgioo.github.io/Pyx-web/en/{en_folder}/">\n')
    return html.replace('</head>', alt + '</head>', 1)
