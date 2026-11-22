#!/usr/bin/env python3
"""Construye los ejemplos descargables de la web.

Para cada proyecto de ejemplos/src/<nombre>/:
  1. lo copia tal cual, sin lo que se genera al compilar (xref/, figuras/);
  2. convierte cada .pltx de texto en el formato que guarda Pyx (un zip con
     manifest.json y source.tex), para que sea idéntico a uno hecho en la app;
  3. lo comprime en ejemplos/descargas/<nombre>.zip;
  4. lo compila con el compilador REAL de Pyx (el kernel de Python y XeLaTeX,
     a través de test/e2e/real-compile.test.js del repositorio de Pyx), dos
     veces: la segunda reutiliza los valores guardados, como al reabrir;
  5. copia el PDF a ejemplos/pdf/<nombre>.pdf y hace las vistas previas de sus
     páginas en ejemplos/img/<nombre>-<n>.webp.

  6. escribe la página ejemplos/index.html (tools/ejemplos_pagina.py).

Uso:  PYX_REPO=/ruta/a/Pyx python3 tools/ejemplos.py [nombre ...]
      python3 tools/ejemplos.py --pagina      (solo la página)
Necesita: Node con las dependencias de Pyx instaladas, Python con numpy,
pandas, matplotlib, openpyxl, handcalcs y pint, XeLaTeX, pdftoppm y Pillow.
"""
import json
import os
import shutil
import subprocess
import sys
import tempfile
import zipfile
from pathlib import Path

WEB = Path(__file__).resolve().parent.parent
SRC = WEB / "ejemplos" / "src"
SRC_EN = WEB / "ejemplos" / "src-en"   # the same projects, in English
ZIPS = WEB / "ejemplos" / "descargas"
PDFS = WEB / "ejemplos" / "pdf"
IMGS = WEB / "ejemplos" / "img"
PYX = Path(os.environ.get("PYX_REPO", WEB.parent / "Pyx")).resolve()

# El documento principal de cada proyecto (el que se compila).
RAIZ = {
    "00-plantilla": "1. Main/_Preámbulo.pltx",
    "01-memoria-de-calculo": "1. Main/_Preámbulo.pltx",
    "02-handcalcs-y-unidades": "calculo-con-unidades.pltx",
    "03-cuaderno-de-jupyter": "informe.pltx",
    "04-tablas-graficas-y-condicionales": "estudio.pltx",
    "05-datos-de-excel": "informe.pltx",
    # English
    "00-template": "1. Main/_Preamble.pltx",
    "01-calculation-report": "1. Main/_Preamble.pltx",
    "02-handcalcs-and-units": "calculation-with-units.pltx",
    "03-jupyter-notebook": "report.pltx",
    "04-tables-plots-and-conditionals": "study.pltx",
    "05-excel-data": "report.pltx",
}
GENERADO = {"xref", "figuras", "figures", "__pycache__", ".ipynb_checkpoints"}
MAX_PAGINAS = 6


def a_pltx(ruta: Path) -> None:
    """Un .pltx de texto -> el contenedor que escribe Pyx (pltx.rs)."""
    if zipfile.is_zipfile(ruta):
        return
    texto = ruta.read_text(encoding="utf-8")
    with zipfile.ZipFile(ruta, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("manifest.json", json.dumps({"format": "pyx-pltx", "version": 1}))
        z.writestr("source.tex", texto)


def copiar(nombre: str, destino: Path) -> Path:
    raiz = destino / nombre
    src = SRC / nombre if (SRC / nombre).is_dir() else SRC_EN / nombre
    shutil.copytree(src, raiz,
                    ignore=lambda d, fs: [f for f in fs if f in GENERADO])
    for p in raiz.rglob("*.pltx"):
        a_pltx(p)
    return raiz


def comprimir(carpeta: Path, salida: Path) -> None:
    salida.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(salida, "w", zipfile.ZIP_DEFLATED) as z:
        for p in sorted(carpeta.rglob("*")):
            if p.is_file():
                z.write(p, p.relative_to(carpeta.parent).as_posix())


def compilar(raiz_doc: Path, pdf: Path) -> None:
    env = dict(os.environ, PYX_E2E_ROOT=str(raiz_doc), PYX_E2E_OUT=str(pdf))
    for vez in (1, 2):
        r = subprocess.run(["npx", "vitest", "run", "test/e2e/real-compile.test.js"],
                           cwd=PYX, env=env, capture_output=True, text=True)
        if r.returncode != 0 or not pdf.exists():
            log = Path(f"{pdf}.log")
            sys.exit(f"No compila ({vez}.ª vez): {raiz_doc}\n{r.stdout[-3000:]}\n"
                     + (log.read_text()[:3000] if log.exists() else ""))
        print(f"  compilado ({vez}.ª vez)")


def vistas(pdf: Path, nombre: str) -> int:
    from PIL import Image
    IMGS.mkdir(parents=True, exist_ok=True)
    for viejo in IMGS.glob(f"{nombre}-*.webp"):
        viejo.unlink()
    with tempfile.TemporaryDirectory() as t:
        subprocess.run(["pdftoppm", "-r", "110", "-l", str(MAX_PAGINAS), "-png",
                        str(pdf), f"{t}/p"], check=True)
        paginas = sorted(Path(t).glob("p-*.png"))
        for i, png in enumerate(paginas, 1):
            Image.open(png).convert("RGB").save(IMGS / f"{nombre}-{i}.webp", "WEBP", quality=82)
    return len(paginas)


def main() -> None:
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    import ejemplos_pagina
    if sys.argv[1:] == ["--pagina"]:
        ejemplos_pagina.escribir()
        return
    nombres = sys.argv[1:] or sorted(RAIZ)
    resumen = {}
    with tempfile.TemporaryDirectory() as tmp:
        tmp = Path(tmp)
        for nombre in nombres:
            print(nombre)
            raiz = copiar(nombre, tmp)
            comprimir(raiz, ZIPS / f"{nombre}.zip")
            # Se compila la copia (con los .pltx ya en formato zip): es
            # exactamente lo que abrirá quien lo descargue.
            PDFS.mkdir(parents=True, exist_ok=True)
            pdf = PDFS / f"{nombre}.pdf"
            if pdf.exists():
                pdf.unlink()
            compilar(raiz / RAIZ[nombre], pdf)
            log = Path(f"{pdf}.log")
            if log.exists():
                log.unlink()
            n = vistas(pdf, nombre)
            resumen[nombre] = {"paginas": n, "zip_kb": round((ZIPS / f"{nombre}.zip").stat().st_size / 1024)}
            print(f"  {n} vistas previas, zip de {resumen[nombre]['zip_kb']} KB")
    print(json.dumps(resumen, indent=1, ensure_ascii=False))
    ejemplos_pagina.escribir()


if __name__ == "__main__":
    main()
