/* ==========================================================================
   Historial de versiones de Pyx.
   Para anunciar una versión nueva, añade un objeto AL PRINCIPIO de la lista.
   La portada muestra la primera; /novedades/ las muestra todas.

   Campos:
     version   "2.1.0"
     fecha     "2026-12-01"            (AAAA-MM-DD)
     titulo    una frase que resuma la versión
     destacada true para marcarla como versión grande (opcional)
     grupos    [{ nombre: "Compilar y ver", cambios: ["…", "…"] }]
               Dentro de los cambios se puede usar `código` y **negrita**.
   ========================================================================== */
window.PYX_NOVEDADES = [
  {
    version: "2.2.0",
    fecha: "2026-11-22",
    titulo: "Excel en el documento, abrir carpeta y un modo noche que respeta los colores",
    destacada: true,
    grupos: [
      {
        nombre: "Datos de Excel y CSV, sin Python",
        cambios: [
          "`\\hoja[Hoja]{libro.xlsx}` vincula un libro y su hoja; `\\celda{E4}` coloca una celda y `\\celda{A2:E7}` un rango entero, listo para una tabla. `\\celda[T]{…}` lo transpone.",
          "Pyx lee el archivo en cada compilación: cambia un número en Excel, guarda y compila. También CSV con «;» y coma decimal.",
        ],
      },
      {
        nombre: "Como en VS Code",
        cambios: [
          "**Abrir carpeta**: la carpeta del proyecto queda fija en el explorador, que ahora se ve como el de VS Code.",
          "Autocompletado y panel de problemas con el aspecto de VS Code.",
          "Ctrl+T sobre una palabra comenta solo esa palabra; la negrita con el cursor en un `\\py{}` se aplica al comando entero.",
        ],
      },
      {
        nombre: "Y además",
        cambios: [
          "**Modo noche del PDF**: el papel se oscurece y el texto se aclara, pero los colores y las imágenes se conservan.",
          "Los archivos de trabajo de LaTeX se borran al cerrar Pyx. La configuración se guarda también en un `config.json` legible.",
          "El manual y los proyectos de ejemplo, en español y en inglés, y un ejemplo nuevo con Excel.",
          "Los números de línea ya no se desalinean al hacer zoom en el editor; un documento nuevo empieza vacío.",
        ],
      },
    ],
    en: {
      titulo: "Excel in the document, open folder and a night mode that respects colours",
      grupos: [
        {
          nombre: "Excel and CSV data, without Python",
          cambios: [
            "`\\hoja[Sheet]{workbook.xlsx}` links a workbook and its sheet; `\\celda{E4}` places a cell and `\\celda{A2:E7}` a whole range, ready for a table. `\\celda[T]{…}` transposes it.",
            "Pyx reads the file at every compile: change a number in Excel, save and compile. CSV with «;» and decimal comma too.",
          ],
        },
        {
          nombre: "Like VS Code",
          cambios: [
            "**Open folder**: the project folder stays in the explorer, which now looks like VS Code's.",
            "Completion and the problems panel look like VS Code's.",
            "Ctrl+T on a word comments only that word; bold with the caret in a `\\py{}` applies to the whole command.",
          ],
        },
        {
          nombre: "And also",
          cambios: [
            "**PDF night mode**: the paper darkens and the text lightens, but colours and pictures are kept.",
            "LaTeX's working files are deleted when Pyx closes. The settings are also saved in a readable `config.json`.",
            "The manual and the example projects, in Spanish and English, and a new example with Excel.",
            "Line numbers no longer drift when zooming the editor; a new document starts empty.",
          ],
        },
      ],
    },
  },
  {
    version: "2.1.0",
    fecha: "2026-11-17",
    titulo: "Un visor que no salta, arrastre a tu gusto y proyectos de ejemplo",
    grupos: [
      {
        nombre: "Visor de PDF",
        cambios: [
          "Al compilar, o tras un cambio grande, **el PDF ya no salta hacia la derecha**: la vista se queda donde estaba.",
          "Elige con qué se arrastra la página: **botón derecho, rueda o los dos**, en `Configuración → Atajos de teclado`.",
        ],
      },
      {
        nombre: "Python",
        cambios: [
          "Las **funciones de un cuaderno** vinculado con `\\pynotebook{}` siguen funcionando al reutilizar los valores guardados.",
          "En `tabletex()` y `tex()`, `prec` son siempre decimales, también en tablas de pandas: `41.2`, no `4e+01`.",
          "Un `\\py{}` dentro del código de una celda o en un comentario de LaTeX ya no se evalúa ni avisa.",
        ],
      },
      {
        nombre: "Y además",
        cambios: [
          "**Compartir** queda en pausa mientras se mejora: ya no aparece en la interfaz.",
          "En la web, una página de **ejemplos**: proyectos completos para descargar y compilar.",
        ],
      },
    ],
    en: {
      titulo: "A viewer that does not jump, dragging your way and example projects",
      grupos: [
        { nombre: "PDF viewer", cambios: ["When compiling, or after a big change, **the PDF no longer jumps to the right**.", "Choose what drags the page: **right button, wheel or both**, in `Settings → Keyboard shortcuts`."] },
        { nombre: "Python", cambios: ["The **functions of a notebook** linked with `\\pynotebook{}` keep working when the saved values are reused.", "In `tabletex()` and `tex()`, `prec` is always decimals, also in pandas tables: `41.2`, not `4e+01`.", "A `\\py{}` inside a cell's code or in a LaTeX comment is no longer evaluated nor reported."] },
        { nombre: "And also", cambios: ["**Sharing** is paused while it is improved: it no longer appears in the interface.", "On the website, an **examples** page: complete projects to download and compile."] },
      ],
    },
  },
  {
    version: "2.0.0",
    fecha: "2026-11-13",
    titulo: "La nueva etapa: compilar más rápido, anotar de verdad y carpetas limpias",
    destacada: true,
    grupos: [
      {
        nombre: "Compilar y ver",
        cambios: [
          "«Compilar y ver» aprovecha el motor de LaTeX con el preámbulo ya cargado, y XeLaTeX escribe el PDF con compresión ligera: en un informe real de 18 páginas, cada pasada baja de **17,3 s a 13,5 s**.",
          "El visor dibuja en segundo plano el resto del documento mientras la vista está quieta: desplazarse es instantáneo.",
          "La página del PDF se mueve arrastrando con el botón derecho.",
          "Ctrl+clic exacto entre el código y el PDF, también debajo de tablas y figuras escritas con `\\py{}` y en páginas sin texto.",
          "Marcadores del PDF fiables tras cada compilación, con número de página.",
          "Las figuras y tablas no pasan de su apartado (opcional, activado).",
        ],
      },
      {
        nombre: "Anotar el PDF",
        cambios: [
          "Marcas editables con tiradores; flechas rectas, curvas o en codo, con una o dos puntas; trazo discontinuo; grosor a medida.",
          "Puntero circular del tamaño de la punta, borrador entero o por partes, cuadros de texto, láser y comentarios plegables a su icono.",
          "Exportar el PDF con las anotaciones.",
          "Mientras una herramienta está en la mano, las páginas no se mueven: ni solas ni al dibujar con un lápiz digital o con el dedo.",
        ],
      },
      {
        nombre: "Escribir",
        cambios: [
          "Pegar una imagen la guarda en la carpeta del proyecto y escribe su figura.",
          "Asistentes de tabla y figura nuevos, con vista previa del código, pegar desde Excel en una rejilla y un estilo propio que se guarda.",
          "Corrector más completo en español: vocabulario técnico, verbos con pronombres, prefijos y adverbios; **rojo** para la ortografía, **azul** para la puntuación y los espacios, **verde** para la redacción.",
          "Ctrl+R reemplaza la palabra seleccionada en todo el documento.",
        ],
      },
      {
        nombre: "Aplicación",
        cambios: [
          "Configuración → General → «Buscar actualizaciones»: descarga, comprueba, instala y reabre Pyx sin más pasos.",
          "Un `.pltx` guarda solo el documento y los resultados de sus celdas, no el PDF ni los archivos de compilación: pesa lo que el texto.",
          "La carpeta de trabajo no acumula basura: el visor no duplica el PDF y al arrancar se borra lo que ya no sirve.",
          "La versión se ve en el título de la ventana. Pestañas más pequeñas, con ancho configurable.",
          "Instaladores comprobados con antivirus antes de publicarse.",
        ],
      },
    ],
  },
  {
    version: "1.8.2",
    fecha: "2026-11-13",
    titulo: "Instalador de Windows que el antivirus deja pasar",
    grupos: [{ nombre: "Aplicación", cambios: ["La versión de Rust queda fijada en la 1.99.1: con la 1.100.0 Kaspersky bloqueaba el instalador."] }],
  },
  {
    version: "1.8.1",
    fecha: "2026-11-13",
    titulo: "Instaladores de Windows publicados de nuevo",
    grupos: [{ nombre: "Aplicación", cambios: ["Los instaladores de la 1.8.0 los bloqueaba Kaspersky; se vuelven a publicar."] }],
  },
  {
    version: "1.8.0",
    fecha: "2026-11-13",
    titulo: "Compilación y visor más rápidos, anotación rehecha y Ctrl+clic exacto",
    grupos: [
      {
        nombre: "Novedades",
        cambios: [
          "Compilación y visor más rápidos.",
          "Modo de anotación del PDF rehecho y marcadores fiables.",
          "Ctrl+clic exacto también bajo tablas y figuras.",
          "Asistentes de tabla y figura rehechos; pegar una captura como figura.",
          "Pegado de tablas de Excel mejorado, Ctrl+R y pestañas más pequeñas.",
          "Configuración ampliada.",
        ],
      },
    ],
  },
  {
    version: "1.7.0",
    fecha: "2026-11-10",
    titulo: "Cada compilación termina en un PDF nuevo",
    grupos: [
      {
        nombre: "Novedades",
        cambios: [
          "Cada compilación termina en un PDF nuevo en pantalla o en un motivo que explica por qué no lo hay.",
          "El visor se desplaza como un lector nativo.",
          "Cinta adaptable al estilo de Word: sin desplazamiento horizontal.",
          "LED de compilación en el modo zen: se ve si compila, si terminó y por qué no hay PDF, sin salir del modo.",
          "Archivos vinculados fiables: una función de un archivo vinculado lee desde su carpeta, la llame quien la llame.",
          "Cerrar pregunta por lo no guardado, guardar no pierde lo escrito mientras tanto y la actualización se verifica siempre.",
        ],
      },
    ],
  },
  {
    version: "1.6.6",
    fecha: "2026-11-04",
    titulo: "Visor rápido, herramientas de revisión y actualizaciones desde la app",
    grupos: [{ nombre: "Novedades", cambios: ["Visor de PDF rápido.", "Herramientas de revisión del PDF.", "Actualizaciones desde la propia aplicación.", "Fin del bloqueo al compilar."] }],
  },
  {
    version: "1.6.5",
    fecha: "2026-11-02",
    titulo: "Cuadernos que solo ejecutan lo que cambia",
    grupos: [{ nombre: "Novedades", cambios: ["Los cuadernos vinculados solo ejecutan las celdas que cambian y las que dependen de ellas.", "Las variables de un Jupyter abierto llegan en milisegundos.", "Cinta de cuatro botones."] }],
  },
  {
    version: "1.6.4",
    fecha: "2026-10-25",
    titulo: "Archivos .py vinculados y funciones de cuadernos en \\py{}",
    grupos: [{ nombre: "Novedades", cambios: ["Archivos `.py` vinculados con `\\pyfile{}`.", "Las funciones de un cuaderno se llaman desde `\\py{}`.", "Cada `\\py{}` toma el valor más próximo por encima."] }],
  },
  {
    version: "1.6.2",
    fecha: "2026-10-22",
    titulo: "Cuadernos de Jupyter vinculados",
    grupos: [{ nombre: "Novedades", cambios: ["`\\pynotebook{…}` trae las variables de un cuaderno de Jupyter.", "Se toman sus valores sin volver a ejecutarlo.", "Ejecución mucho más rápida y tablas como en Jupyter."] }],
  },
  {
    version: "1.6.0",
    fecha: "2026-10-18",
    titulo: "Grafo de dependencias, jedi y Python sin instalar",
    destacada: true,
    grupos: [
      {
        nombre: "Novedades",
        cambios: [
          "Grafo de dependencias de celdas: solo se ejecuta lo que un cambio alcanza.",
          "Autocompletado de Python con jedi, firmas al escribir y ayuda al pasar el ratón.",
          "Autocompletado de LaTeX desde datos: 336 comandos y 51 entornos con su paquete.",
          "Sin instalaciones previas: Pyx prepara Python (uv) y LaTeX (Tectonic) por sí mismo.",
          "Buscar en todo el proyecto (Ctrl+Mayús+F) y pegar tablas de Excel como tabular.",
          "Macros en Python, glosarios, marcadores del PDF e historial del cursor.",
          "Primer manual de usuario, escrito y compilado con Pyx.",
        ],
      },
    ],
  },
  {
    version: "1.5.0",
    fecha: "2026-10-16",
    titulo: "Compilación casi instantánea y diagnósticos en vivo",
    grupos: [
      {
        nombre: "Novedades",
        cambios: [
          "Motor precalentado: LaTeX espera con el preámbulo ya cargado.",
          "Reglas de latexmk para bibliografías e índices.",
          "Diagnósticos de LaTeX mientras escribes (al estilo de texlab) y ChkTeX opcional.",
          "Panel de variables, como el inspector de Jupyter.",
          "El PDF sigue lo que escribes.",
          "Motor Tectonic opcional.",
        ],
      },
    ],
  },
  {
    version: "1.4.0",
    fecha: "2026-09-22",
    titulo: "La celda al estilo de VS Code",
    grupos: [{ nombre: "Novedades", cambios: ["Las celdas se dibujan y se manejan como en VS Code.", "Correcciones de una campaña de pruebas."] }],
  },
  {
    version: "1.3.1",
    fecha: "2026-09-04",
    titulo: "Compilar deja de repetir trabajo ya hecho",
    grupos: [{ nombre: "Novedades", cambios: ["Compilar ya no repite lo que no ha cambiado.", "La lupa del visor."] }],
  },
  {
    version: "1.2.0",
    fecha: "2026-08-31",
    titulo: "Resultados fiables y ejecución incremental",
    grupos: [{ nombre: "Novedades", cambios: ["Ejecución incremental de las celdas.", "Salidas aisladas y resultados fiables.", "Kernel plano, sin librerías privilegiadas (1.2.1)."] }],
  },
  {
    version: "1.1.0",
    fecha: "2026-07-13",
    titulo: "Los primeros instaladores",
    grupos: [{ nombre: "Novedades", cambios: ["Primeros instaladores de Pyx."] }],
  },
];
