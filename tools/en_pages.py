"""English versions of the website's sub-pages: news, privacy and signing.

    python3 tools/en_pages.py

Each comes from its Spanish page: the chrome through en_chrome.py, the body
replaced here. Run it again after changing a Spanish page.
"""
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from en_chrome import to_english, spanish_switch  # noqa: E402

WEB = Path(__file__).resolve().parent.parent


def body_swap(html, new_body):
    i = html.index('<header class="page-head">')
    j = html.index('<footer class="colophon">')
    return html[:i] + new_body + html[j:]


def news():
    s = (WEB / "novedades/index.html").read_text(encoding="utf-8")
    s = to_english(s, "novedades")
    s = s.replace("<title>Novedades · Pyx</title>", "<title>What’s new · Pyx</title>")
    s = s.replace('content="Qué trae cada versión de Pyx, de la más reciente a la primera."', 'content="What each version of Pyx brings, from the latest to the first."')
    s = s.replace('<meta property="og:title" content="Novedades de Pyx">', '<meta property="og:title" content="What’s new in Pyx">')
    s = s.replace('<a href="../news/" aria-current="page">', '<a href="./" aria-current="page">')
    s = s.replace('<p class="eyebrow"><span>Registro de cambios</span>', '<p class="eyebrow"><span>Change log</span>')
    s = s.replace('<h1>Lo que ha ido <em>cambiando.</em></h1>', '<h1>What has been <em>changing.</em></h1>')
    s = s.replace('<p class="lede">Cada versión de Pyx, de la más reciente a la primera. Para tenerla basta con <span class="menu">Configuración → General → Buscar actualizaciones</span>.</p>',
                  '<p class="lede">Each version of Pyx, from the latest to the first. To get it, use <span class="menu">Settings → General → Check for updates</span>. Older versions are described in Spanish.</p>')
    s = s.replace('<noscript><p>Esta lista necesita JavaScript. Las versiones también están en <a href="https://github.com/LorGIOO/Pyx/releases">GitHub</a>.</p></noscript>',
                  '<noscript><p>This list needs JavaScript. The versions are also on <a href="https://github.com/LorGIOO/Pyx/releases">GitHub</a>.</p></noscript>')
    s = s.replace('>Instaladores de cada versión en GitHub</a>', '>Installers of every version on GitHub</a>')
    s = s.replace("const data = window.PYX_NOVEDADES || [];", "const data = (window.PYX_NOVEDADES || []).map((v) => (v.en ? { ...v, ...v.en } : v));")
    s = s.replace("toLocaleDateString('es-ES',", "toLocaleDateString('en-GB',")
    s = s.replace("`${data.length} versiones`", "`${data.length} versions`")
    s = s.replace("'<span class=\"badge\">la más reciente</span>'", "'<span class=\"badge\">the latest</span>'")
    s = s.replace("'<span class=\"badge\">versión grande</span>'", "'<span class=\"badge\">major version</span>'")
    s = s.replace("g.nombre !== 'Novedades'", "g.nombre !== 'Novedades' && g.nombre !== 'What’s new'")
    s = s.replace('<li><a href="./">What’s new</a></li>', '<li><a href="./">What’s new</a></li>')
    (WEB / "en/news/index.html").write_text(s, encoding="utf-8")


PRIVACY = '''<header class="page-head">
  <p class="eyebrow"><span>Privacy policy</span><span class="n">Website and application</span></p>
  <h1>Your documents are <em>yours.</em></h1>
  <p class="lede">Neither this website nor Pyx asks you for an account, sets cookies or sends usage statistics. Here, point by point, is the little that leaves your computer and why.</p>
</header>

<div class="doc-layout single">
  <main class="doc-body legal" id="contenido">
    <p class="updated">Last updated: 22 November 2026</p>

    <div class="summary">
      <ul>
        <li><strong>This website</strong> uses no cookies, analytics or third-party resources: fonts and images are served from here. It only remembers the theme (light or dark) in your browser if you change it.</li>
        <li><strong>What you type or paste in the demos</strong> stays in your browser. It is not sent anywhere.</li>
        <li><strong>The Pyx application</strong> has no telemetry, automatic error reports or accounts. Your documents do not leave your computer.</li>
        <li>Pyx connects to the Internet <strong>only</strong> to look for updates, set up Python or <span class="latex">L<sup>a</sup>T<sub>e</sub>X</span> when you ask, install a missing library and, if you configure it, check the text with LanguageTool.</li>
      </ul>
    </div>

    <h2 id="responsable">1. Who is behind it</h2>
    <p>Pyx is an MIT-licensed free software project maintained by <a href="https://github.com/LorGIOO">LorGIOO</a> on GitHub. For any question about this policy, open an issue at <a href="https://github.com/LorGIOO/Pyx/issues">github.com/LorGIOO/Pyx/issues</a>. Bear in mind that GitHub issues are public: do not write personal data in them that you do not want published.</p>

    <h2 id="web">2. This website</h2>
    <h3>Hosting</h3>
    <p>The website is published with GitHub Pages, a service of GitHub, Inc. As with any page, when you visit it your browser connects to GitHub’s servers and sends them your IP address and technical data of the request (the page you ask for, the browser you use). GitHub may log them for security and operation, according to its <a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement">privacy statement</a>. Whoever maintains Pyx receives neither those logs nor visit statistics.</p>
    <h3>Cookies and storage</h3>
    <p>The website uses no cookies. If you press the theme button, it saves the word <code>light</code> or <code>dark</code> in your browser’s local storage, under the key <code>pyx-tema</code>, to remember it on your next visit. It cannot identify you and it does not leave your browser. You can delete it at any time by clearing this site’s data in your browser.</p>
    <h3>Third parties</h3>
    <p>Loading the website contacts no other service: there is no analytics, advertising, embedded video or external fonts. The download, source code and issue links lead to <code>github.com</code>, which has its own policy.</p>
    <h3>The demos</h3>
    <p>The lab, the spell checker, completion, table pasting and annotations run entirely in your browser, with JavaScript. What you type, paste or draw is neither saved nor sent, and it disappears when you close the page.</p>

    <h2 id="app">3. The Pyx application</h2>
    <p>Pyx works offline. It asks for no registration, sends no usage statistics or error reports, and neither reads nor uploads your documents. What you write, your data and your results stay in your project folders and in Pyx’s data folder on your computer: <code>%LOCALAPPDATA%\\com.pyx.studio</code> on Windows and <code>~/.local/share/pyx</code> on Linux. The settings are kept in <code>%APPDATA%\\Pyx\\config.json</code> (<code>~/.config/Pyx</code> on Linux). When you uninstall Pyx, the uninstaller offers to delete the data folder.</p>
    <p>These are all the connections it makes, and when:</p>
    <div class="table-wrap">
      <table>
        <thead><tr><th>When</th><th>Where to</th><th>What is sent</th></tr></thead>
        <tbody>
          <tr><td>A few seconds after start-up, and when you press <span class="ui-btn">Check for updates</span></td><td><code>api.github.com</code>; <code>github.com</code> if you download the new version</td><td>A query for the latest published version. The downloaded installer is checked with its SHA-256 fingerprint before it is installed.</td></tr>
          <tr><td>When you press <span class="ui-btn">Set up</span> in «Set up Pyx»</td><td><code>github.com</code> (uv, standalone Python and Tectonic) and the Python Package Index, PyPI (the libraries)</td><td>Normal download requests. Nothing from your documents.</td></tr>
          <tr><td>When Tectonic compiles a document that needs <span class="latex">L<sup>a</sup>T<sub>e</sub>X</span> packages it does not have yet</td><td>Tectonic’s package servers</td><td>The request for those packages. The document is compiled on your computer.</td></tr>
          <tr><td>When you press <span class="ui-btn">Install …</span> for a missing library, or use <code>pip</code> in Pyx’s terminal</td><td>PyPI</td><td>The name of the library being installed.</td></tr>
          <tr><td>Only if you type a server in <span class="menu">Settings → Proofing → LanguageTool server</span></td><td>The server you typed</td><td>The document’s text, to check it. With your own server (<code>http://localhost:8081</code>) it does not leave your computer; with the public one (<code>api.languagetool.org</code>) LanguageTool receives it.</td></tr>
          <tr><td>With linked Jupyter notebooks</td><td>The Jupyter on your own computer (<code>localhost</code>)</td><td>Nothing leaves the computer.</td></tr>
        </tbody>
      </table>
    </div>
    <p>Pyx’s spell checker (red, blue and green) works offline, with dictionaries included in the application. Reading Excel workbooks with <code>\\hoja</code> and <code>\\celda</code> happens on your computer too. Since Pyx’s code is open, anyone can check this list in the <a href="https://github.com/LorGIOO/Pyx">source code</a>.</p>

    <h2 id="derechos">4. Your rights</h2>
    <p>Whoever maintains Pyx neither collects nor keeps personal data of the people who visit the website or use the application, so there is no data of yours to consult, correct or delete. About the technical data GitHub logs when serving the website or the downloads, you can exercise your rights with GitHub, as its privacy statement explains. If you believe something does not comply with data protection law, you can also turn to the supervisory authority of your country (in Spain, the Agencia Española de Protección de Datos).</p>

    <h2 id="cambios">5. Changes to this policy</h2>
    <p>If a version of Pyx or of the website changes any of the above (for instance, a new connection), this page will be updated first and its release notes will say so. The date above is the last revision.</p>
  </main>
</div>

'''


def privacy():
    s = (WEB / "privacidad/index.html").read_text(encoding="utf-8")
    s = to_english(s, "privacidad")
    s = s.replace("<title>Privacidad · Pyx</title>", "<title>Privacy · Pyx</title>")
    s = re.sub(r'<meta name="description" content="[^"]*">', '<meta name="description" content="What data this website handles and what connections the Pyx application makes. No cookies, no analytics, no telemetry.">', s, count=1)
    s = re.sub(r'<meta property="og:title" content="[^"]*">', '<meta property="og:title" content="Pyx privacy policy">', s, count=1)
    s = body_swap(s, PRIVACY)
    (WEB / "en/privacy/index.html").write_text(s, encoding="utf-8")


def signing():
    s = (WEB / "firma/index.html").read_text(encoding="utf-8")
    s = to_english(s, "firma")
    s = s.replace("<title>Firma de código · Pyx</title>", "<title>Code signing · Pyx</title>")
    s = re.sub(r'<meta name="description" content="[^"]*">', '<meta name="description" content="Pyx code signing policy: who signs the installers, how they are built and what data the application transmits.">', s, count=1)
    s = s.replace('<p class="eyebrow"><span>Code signing policy</span><span class="n">Política de firma de código</span></p>', '<p class="eyebrow"><span>Code signing policy</span><span class="n">Windows installers</span></p>')
    s = s.replace('<h1>Firma de <em>código</em></h1>', '<h1>Code <em>signing</em></h1>')
    s = s.replace('<p class="lede">Quién firma los instaladores de Pyx para Windows, cómo se construyen y qué comprueba cada versión antes de publicarse. El texto oficial está en inglés, como lo exige el programa de firma.</p>', '<p class="lede">Who signs Pyx’s Windows installers, how they are built and what each version is checked for before it is published.</p>')
    s = s.replace('The full privacy policy, in Spanish, is at <a href="../privacy/">lorgioo.github.io/Pyx-web/privacidad/</a>.', 'The full privacy policy is at <a href="../privacy/">lorgioo.github.io/Pyx-web/en/privacy/</a>.')
    s = re.sub(r'\n    <h2 id="es">En español</h2>\n    <div lang="es">.*?</div>\n', '\n', s, flags=re.S)
    (WEB / "en/signing/index.html").write_text(s, encoding="utf-8")


def spanish_links():
    for folder in ["novedades", "privacidad", "firma"]:
        p = WEB / folder / "index.html"
        p.write_text(spanish_switch(p.read_text(encoding="utf-8"), folder), encoding="utf-8")


if __name__ == "__main__":
    spanish_links()
    news()
    privacy()
    signing()
    print("en/news, en/privacy, en/signing escritas")
