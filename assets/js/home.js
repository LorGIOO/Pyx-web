/* Pyx · portada: escenas interactivas */
(() => {
  'use strict';
  // The same scenes in Spanish and English: the page's <html lang> decides.
  const EN = document.documentElement.lang === 'en';
  const T = (es, en) => (EN ? en : es);
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  /** Lo que escribe \py{} con un float: coma fija, 12 cifras, sin ceros sobrantes. */
  const pyfmt = (x) => (Number.isInteger(x) ? String(x) : String(Number(x.toPrecision(12))));
  const coma = (s) => String(s).replace('.', ',');
  const bump = (el) => {
    if (!el) return;
    el.classList.add('bump');
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.remove('bump')));
  };
  const setText = (el, txt) => {
    if (!el || el.textContent === txt) return;
    el.textContent = txt;
    bump(el);
  };
  const progressOf = (el) => {
    const r = el.getBoundingClientRect();
    const span = r.height - innerHeight;
    return span > 0 ? clamp(-r.top / span, 0, 1) : 0;
  };
  const onScrollFrame = (fn) => {
    let queued = false;
    const run = () => { queued = false; fn(); };
    addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(run); } }, { passive: true });
    addEventListener('resize', run);
    run();
  };
  /** Lee un número como lo leería Python en `P = …`. */
  const pyNumber = (src) => {
    const s = src.trim();
    if (/^[-+]?(\d+(_\d+)*(\.\d*)?|\.\d+)([eE][-+]?\d+)?$/.test(s)) return { ok: true, value: Number(s.replace(/_/g, '')) };
    if (/^\d+,\d+$/.test(s)) return { ok: false, error: T(`TypeError: ${s} es una tupla en Python; usa punto decimal.`, `TypeError: ${s} is a tuple in Python; use a decimal point.`) };
    return { ok: false, error: s ? T(`SyntaxError: «${s}» no es un número.`, `SyntaxError: «${s}» is not a number.`) : T('SyntaxError: falta el valor.', 'SyntaxError: the value is missing.') };
  };
  /** Un campo de código mide lo que su texto, como en el editor. */
  const fitInput = (el) => { el.style.width = `${Math.max(el.value.length, 1) + 0.6}ch`; };
  /** Teclea un texto en un campo, letra a letra; devuelve una función que lo detiene. */
  const autoType = (el, text, onChange, delay = 600) => {
    let stopped = false, timer = 0;
    const stop = () => { stopped = true; clearTimeout(timer); };
    const steps = [];
    for (let i = el.value.length - 1; i >= 0; i--) steps.push(el.value.slice(0, i));
    for (let i = 1; i <= text.length; i++) steps.push(text.slice(0, i));
    let k = 0;
    const tick = () => {
      if (stopped || k >= steps.length) return;
      el.value = steps[k++];
      el.classList.add('typing');
      if (el.matches('.code-in')) fitInput(el);
      if (k === steps.length) { el.classList.remove('typing'); onChange(); return; }
      timer = setTimeout(tick, k <= el.value.length + 1 ? 70 : 120);
    };
    timer = setTimeout(tick, delay);
    return stop;
  };
  const whenVisible = (el, fn, margin = '0px 0px -20% 0px') => {
    if (!el) return;
    const io = new IntersectionObserver((es) => {
      if (es.some((e) => e.isIntersecting)) { io.disconnect(); fn(); }
    }, { rootMargin: margin });
    io.observe(el);
  };

  /* ------------------------------------------------------------------------
     Gráfica de la deformada de una ménsula (la misma que dibuja el manual)
     ------------------------------------------------------------------------ */
  const SVGNS = 'http://www.w3.org/2000/svg';
  function drawPlot(svg, { L, flecha, adm }) {
    const [, , W, H] = svg.getAttribute('viewBox').split(' ').map(Number);
    const m = { l: 36, r: 10, t: 10, b: 24 };
    const w = W - m.l - m.r, h = H - m.t - m.b;
    const ymax = Math.max(flecha, adm) * 1.18 || 1;
    const X = (x) => m.l + (x / L) * w;
    const Y = (y) => m.t + (y / ymax) * h; // la flecha va hacia abajo
    let s = '';
    // rejilla y ejes
    const step = niceStep(ymax);
    for (let v = step; v < ymax; v += step) s += `<line class="plot-grid" x1="${m.l}" x2="${m.l + w}" y1="${Y(v)}" y2="${Y(v)}"/><text class="plot-txt" x="${m.l - 5}" y="${Y(v) + 3.5}" text-anchor="end">${pyfmt(Math.round(v * 10) / 10)}</text>`;
    s += `<text class="plot-txt" x="${m.l - 5}" y="${Y(0) + 3.5}" text-anchor="end">0</text>`;
    const nx = L <= 1.5 ? 0.25 : L <= 3.2 ? 0.5 : 1;
    for (let x = 0; x <= L * 0.86 + 1e-9; x += nx) s += `<text class="plot-txt" x="${X(x)}" y="${m.t + h + 15}" text-anchor="middle">${pyfmt(Math.round(x * 100) / 100)}</text>`;
    s += `<path class="plot-axis" d="M${m.l} ${m.t}V${m.t + h}H${m.l + w}"/>`;
    // límite L/300
    s += `<line class="plot-lim" x1="${m.l}" x2="${m.l + w}" y1="${Y(adm)}" y2="${Y(adm)}"/>`;
    s += `<text class="plot-lbl" x="${m.l + 6}" y="${Y(adm) - 4}">L/300 = ${pyfmt(Math.round(adm * 10) / 10)} mm</text>`;
    // viga sin deformar y deformada: v(x) = f · x²(3L − x) / (2L³)
    s += `<line class="plot-beam" x1="${X(0)}" x2="${X(L)}" y1="${Y(0)}" y2="${Y(0)}"/>`;
    let d = '';
    for (let i = 0; i <= 48; i++) {
      const x = (L * i) / 48;
      const v = (flecha * x * x * (3 * L - x)) / (2 * L * L * L);
      d += `${i ? 'L' : 'M'}${X(x).toFixed(1)} ${Y(v).toFixed(1)}`;
    }
    s += `<path class="plot-curve" d="${d}"/>`;
    s += `<circle cx="${X(L)}" cy="${Y(flecha)}" r="2.6" fill="#007acc"/>`;
    s += `<text class="plot-txt" x="${m.l + w}" y="${m.t + h + 15}" text-anchor="end" dx="0" style="font-style:italic">x (m)</text>`;
    svg.innerHTML = s;
  }
  function niceStep(max) {
    const raw = max / 4;
    const p = Math.pow(10, Math.floor(Math.log10(raw)));
    const n = raw / p;
    return (n < 1.5 ? 1 : n < 3.5 ? 2 : n < 7.5 ? 5 : 10) * p;
  }

  // Ménsula con un IPE 300: flecha = P·L³ / (3·E·I)
  const flechaDe = (P, L, I = 8356) => (P * 1e3 * Math.pow(L * 1e3, 3)) / (3 * 210e3 * I * 1e4);

  /* ------------------------------------------------------------------------
     Portada: la hoja que se gira
     ------------------------------------------------------------------------ */
  (function hero() {
    const hero = $('#portada');
    const sheet = $('[data-sheet]');
    if (!hero || !sheet) return;
    const steps = $$('.hero-step', hero);
    const hint = $('.scroll-hint', hero);
    const lines = $$('.ed-lines li', sheet);
    const plot = $('[data-h="plot"]', sheet);
    const input = $('[data-hero-p]');
    const note = $('[data-hero-note]');
    let current = -1, typed = false, stopTyping = null;

    const paint = (P) => {
      const L = 3, f = flechaDe(P, L), adm = (L * 1e3) / 300, ok = f <= adm;
      setText($('[data-h="P"]', sheet), pyfmt(P));
      setText($('[data-h="f"]', sheet), f.toFixed(2));
      const v = $('[data-h="ok"]', sheet);
      setText(v, ok ? T('cumple', 'passes') : T('no cumple', 'fails'));
      v.classList.toggle('ok', ok); v.classList.toggle('ko', !ok);
      $('[data-h="Pcode"]', sheet).textContent = input.value.trim();
      drawPlot(plot, { L, flecha: f, adm });
    };
    paint(15);
    const fromInput = () => {
      const r = pyNumber(input.value);
      input.classList.toggle('bad', !r.ok);
      fitInput(input);
      if (r.ok && r.value >= 0) {
        paint(r.value);
        note.textContent = r.value * 7.6923 / 15 > 10 ? T('Más de 10 mm: el párrafo ya dice «no cumple».', 'Over 10 mm: the paragraph already says «fails».') : T('Escribe otra carga en la línea de arriba.', 'Type another load in the line above.');
      } else note.textContent = r.ok ? T('Una carga negativa no tiene sentido aquí.', 'A negative load makes no sense here.') : r.error;
    };
    input.addEventListener('input', (e) => { if (e.isTrusted) stopTyping?.(); fromInput(); });
    input.addEventListener('focus', () => stopTyping?.());
    fitInput(input);

    onScrollFrame(() => {
      const p = progressOf(hero);
      let ry, rx = 0, s = 1, rz = 0;
      if (p < 0.26) { const t = ease(p / 0.26); ry = lerp(-16, 0, t); rx = lerp(6, 0, t); rz = lerp(-1.5, 0, t); }
      else if (p < 0.48) ry = lerp(0, 180, ease((p - 0.26) / 0.22));
      else if (p < 0.64) ry = 180;
      else if (p < 0.84) ry = lerp(180, 360, ease((p - 0.64) / 0.2));
      else ry = 360;
      sheet.style.setProperty('--ry', `${ry}deg`);
      sheet.style.setProperty('--rx', `${rx}deg`);
      sheet.style.setProperty('--rz', `${rz}deg`);
      sheet.style.setProperty('--s', s);
      sheet.style.setProperty('--sheen', `${100 - ((ry % 360) / 360) * 100}%`);
      // en el reverso se iluminan, una tras otra, las líneas que producen el texto
      const lit = p > 0.47 && p < 0.66 ? Math.floor(((p - 0.47) / 0.17) * lines.length) : -1;
      lines.forEach((li, i) => li.classList.toggle('lit', i === lit || (lit >= 8 && i >= 8 && i <= lit)));
      const step = p < 0.28 ? 0 : p < 0.64 ? 1 : 2;
      if (step !== current) {
        current = step;
        steps.forEach((el, i) => { el.classList.toggle('is-on', i === step); el.inert = i !== step; });
        // la primera vez que llega el paso 2, la carga se teclea sola: 15.0 → 25.0
        if (step === 2 && !typed) {
          typed = true;
          stopTyping = autoType(input, '25.0', fromInput, 700);
        }
      }
      if (hint) hint.style.opacity = p > 0.04 ? 0 : 1;
    });
  })();

  /* ------------------------------------------------------------------------
     § 1 — Erratas: el documento copiado a mano frente al de Pyx
     ------------------------------------------------------------------------ */
  (function errata() {
    const box = $('[data-errata]');
    if (!box) return;
    const P0 = 15;
    const f0 = flechaDe(P0, 3);
    const xl = $('[data-xl-p]', box), py = $('[data-new-p]', box);
    let stopTyping = null;
    // la misma carga en los dos sitios: la hoja usa coma decimal; Python, punto
    const paint = (P, from) => {
      const f = flechaDe(P, 3), inside = f <= 10;
      if (from !== xl) xl.value = coma(String(P.toFixed(1)));
      if (from !== py) { py.value = P.toFixed(1); fitInput(py); }
      setText($('[data-xl-f]', box), coma(f.toFixed(2)));
      setText($('[data-new-f]', box), f.toFixed(2));
      setText($('[data-new-v]', box), inside ? T('dentro', 'within') : T('fuera', 'outside'));
      const wrongF = Math.abs(f - f0) > 1e-9;
      const wrongV = inside !== (f0 <= 10);
      $('[data-old-f]', box).classList.toggle('wrong', wrongF);
      $('[data-old-v]', box).classList.toggle('wrong', wrongV);
      $('[data-errata-n]', box).textContent = (wrongF ? 1 : 0) + (wrongV ? 1 : 0);
    };
    xl.addEventListener('input', (e) => {
      if (e.isTrusted) stopTyping?.();
      const v = Number(xl.value.replace(',', '.'));
      const ok = xl.value.trim() !== '' && Number.isFinite(v) && v >= 0;
      xl.classList.toggle('bad', !ok);
      if (ok) paint(v, xl);
    });
    py.addEventListener('input', (e) => {
      if (e.isTrusted) stopTyping?.();
      const r = pyNumber(py.value);
      fitInput(py);
      py.classList.toggle('bad', !r.ok || r.value < 0);
      if (r.ok && r.value >= 0) paint(r.value, py);
    });
    [xl, py].forEach((el) => el.addEventListener('focus', () => stopTyping?.()));
    paint(P0);
    // si nadie lo toca, alguien cambia la carga en la hoja al cabo de un momento
    whenVisible(box, () => {
      stopTyping = autoType(xl, '22,5', () => xl.dispatchEvent(new Event('input')), 1400);
    });
  })();

  /* ------------------------------------------------------------------------
     § 2 — Tres gestos
     ------------------------------------------------------------------------ */
  (function gestures() {
    const track = $('[data-gestures]');
    if (!track) return;
    const items = $$('.gest-list li', track);
    const win = $('.win', track);
    const led = $('.led', win);
    const status = $('[data-gstatus]', win);
    let cur = -1, timer = 0;
    onScrollFrame(() => {
      const step = Math.min(2, Math.floor(progressOf(track) * 3));
      if (step === cur) return;
      cur = step;
      items.forEach((li, i) => li.classList.toggle('is-on', i === step));
      win.className = `win s${step}`;
      clearTimeout(timer);
      led.className = 'led';
      if (step === 0) status.textContent = T('Kernel listo', 'Kernel ready');
      if (step === 1) {
        led.className = 'led py'; status.textContent = T('Ejecutando Python…', 'Running Python…');
        timer = setTimeout(() => { led.className = 'led'; status.textContent = T('Celdas Python: 4 ms (1 ejecutada de 1)', 'Python cells: 4 ms (1 run of 1)'); }, 700);
      }
      if (step === 2) {
        led.className = 'led tex'; status.textContent = T('Componiendo LaTeX…', 'Typesetting LaTeX…');
        timer = setTimeout(() => { led.className = 'led'; status.textContent = T('Compilado · 0,4 s', 'Compiled · 0.4 s'); }, 800);
      }
    });
  })();

  /* ------------------------------------------------------------------------
     § 3 — Laboratorio
     ------------------------------------------------------------------------ */
  const IPE = { // I (cm⁴), W (cm³)
    'IPE 200': [1943, 194], 'IPE 220': [2772, 252], 'IPE 240': [3892, 324], 'IPE 270': [5790, 429],
    'IPE 300': [8356, 557], 'IPE 330': [11770, 713], 'IPE 360': [16270, 904], 'IPE 400': [23130, 1160],
  };
  const lab = { P: 15, L: 3, perfil: 'IPE 300' };
  const labResult = () => {
    const [I, W] = IPE[lab.perfil];
    const flecha = (lab.P * 1e3 * Math.pow(lab.L * 1e3, 3)) / (3 * 210e3 * I * 1e4);
    const sigma = (lab.P * lab.L * 1e6) / (W * 1e3);
    const adm = (lab.L * 1e3) / 300, fyd = 275 / 1.05;
    return { I, W, flecha, sigma, adm, fyd, ok: flecha <= adm && sigma <= fyd };
  };

  (function laboratory() {
    const root = $('[data-lab]');
    if (!root) return;
    const body = $('.lab-body', root);
    const code = $('.lab-code', root);
    const pdf = $('[data-lab-pdf]', root);
    const led = $('[data-lab-led]', root);
    const state = $('[data-lab-state]', root);
    const cells = $('[data-lab-cells]', root);
    const run = $('[data-lab-run]', root);
    const o = (k) => $(`[data-o="${k}"]`, pdf);
    const g = (k) => $(`[data-g="${k}"]`, root);
    let count = 1, compileTimer = 0, phaseTimer = 0;

    const fields = Object.fromEntries($$('.code-in[data-var]', root).map((el) => [el.dataset.var, el]));
    // los valores en gris junto a cada \py{}: se ponen al día al ejecutar la celda
    const paintGhosts = () => {
      const r = labResult();
      g('L').textContent = ` = ${pyfmt(lab.L)}`;
      g('P').textContent = ` = ${pyfmt(lab.P)}`;
      g('perfil').textContent = ` = ${lab.perfil}`;
      g('f').textContent = ` = ${r.flecha.toFixed(2)}`;
      g('s').textContent = ` = ${Math.round(r.sigma)}`;
    };
    const paintPdf = () => {
      const r = labResult();
      setText(o('L'), pyfmt(lab.L));
      setText(o('P'), pyfmt(lab.P));
      setText(o('perfil'), lab.perfil);
      setText(o('f'), r.flecha.toFixed(2));
      setText(o('s'), String(Math.round(r.sigma)));
      const v = o('verdict');
      const html = T(`La sección <b>${r.ok ? 'cumple' : 'no cumple'}</b>.`, `The section <b>${r.ok ? 'passes' : 'fails'}</b>.`);
      if (v.innerHTML !== html) { v.innerHTML = html; bump(v); }
      v.classList.toggle('ok', r.ok); v.classList.toggle('ko', !r.ok);
      setText(o('f2'), `${r.flecha.toFixed(2)} mm`);
      setText(o('adm'), `${r.adm.toFixed(2)} mm`);
      setText(o('uf'), `${Math.round((100 * r.flecha) / r.adm)} %`);
      setText(o('s2'), `${r.sigma.toFixed(1)} MPa`);
      setText(o('us'), `${Math.round((100 * r.sigma) / r.fyd)} %`);
      drawPlot(o('plot'), { L: lab.L, flecha: r.flecha, adm: r.adm });
    };
    /** Ejecuta la celda con lo que hay escrito: un valor nuevo o un error, como Python. */
    const execute = () => {
      const P = pyNumber(fields.P.value), L = pyNumber(fields.L.value);
      const perfil = fields.perfil.value;
      if (!P.ok) return { line: 4, error: P.error };
      if (!L.ok) return { line: 5, error: L.error };
      if (!IPE[perfil]) return { line: 7, error: T(`KeyError: '${perfil}' (hay del IPE 200 al IPE 400)`, `KeyError: '${perfil}' (IPE 200 to IPE 400 available)`) };
      if (L.value === 0) return { line: 9, error: T('ZeroDivisionError: el vuelo no puede ser 0', 'ZeroDivisionError: the span cannot be 0') };
      if (P.value < 0 || L.value < 0) return { line: P.value < 0 ? 4 : 5, error: T('ValueError: la carga y el vuelo deben ser positivos', 'ValueError: the load and the span must be positive') };
      Object.assign(lab, { P: P.value, L: L.value, perfil });
      return { ok: true };
    };
    // compilar al escribir: cuando dejas de teclear (o con Ctrl+S), ejecuta, compone y muestra el PDF
    const compile = () => {
      clearTimeout(compileTimer); clearTimeout(phaseTimer); clearTimeout(idleTimer);
      led.className = 'led py'; state.textContent = T('Ejecutando Python…', 'Running Python…');
      run.textContent = `… [${count + 1}]`; run.className = 'cell-run mono busy';
      $$('.code-lines li.err-line', root).forEach((li) => li.classList.remove('err-line'));
      compileTimer = setTimeout(() => {
        count += 1;
        const res = execute();
        if (!res.ok) {
          run.textContent = `✗ [${count}] ${res.error}`; run.className = 'cell-run mono err';
          $(`[data-line="${res.line}"]`, root)?.classList.add('err-line');
          cells.textContent = T('Celdas Python: error en la línea ', 'Python cells: error on line ') + res.line;
          led.className = 'led err'; state.textContent = T('Error en la celda · se conserva el PDF anterior', 'Error in the cell · the previous PDF is kept');
          return;
        }
        const ms = 2 + Math.round(Math.random() * 3);
        run.textContent = `✓ [${count}] ${ms} ms`; run.className = 'cell-run mono';
        cells.textContent = T(`Celdas Python: ${ms} ms (1 ejecutada de 1)`, `Python cells: ${ms} ms (1 run of 1)`);
        paintGhosts();
        led.className = 'led tex'; state.textContent = T('Componiendo LaTeX…', 'Typesetting LaTeX…');
        phaseTimer = setTimeout(() => {
          paintPdf();
          led.className = 'led';
          state.textContent = T(`Compilado · ${coma((0.3 + Math.random() * 0.2).toFixed(1))} s`, `Compiled · ${(0.3 + Math.random() * 0.2).toFixed(1)} s`);
        }, 260);
      }, 320);
    };
    let idleTimer = 0;
    Object.values(fields).forEach((el) => {
      fitInput(el);
      el.addEventListener('input', () => {
        fitInput(el);
        clearTimeout(idleTimer);
        led.className = 'led'; state.textContent = T('Sin guardar · compila al dejar de escribir', 'Unsaved · compiles when you stop typing');
        idleTimer = setTimeout(compile, 900);
      });
      el.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 's' || (e.shiftKey && e.key.toLowerCase() === 'b'))) { e.preventDefault(); compile(); }
        if (e.key === 'Enter') { e.preventDefault(); compile(); }
      });
    });

    // Ctrl+clic: del PDF al código y del código al PDF
    const range = (spec) => { const [a, b] = String(spec).split('-').map(Number); return [a, b || a]; };
    const flashLines = (spec) => {
      const [a, b] = range(spec);
      $$('.code-lines li.lit', code).forEach((x) => x.classList.remove('lit'));
      const lis = $$('.code-lines li', code).filter((li) => { const n = Number(li.dataset.line); return n >= a && n <= b; });
      if (!lis.length) return;
      lis.forEach((li) => li.classList.add('lit'));
      code.scrollTo({ top: lis[0].offsetTop - code.clientHeight / 3, behavior: 'smooth' });
      setTimeout(() => lis.forEach((li) => li.classList.remove('lit')), 1600);
    };
    pdf.addEventListener('click', (e) => {
      const t = e.target.closest('[data-sync]');
      if (!t) return;
      e.stopPropagation();
      if (body.dataset.view === 'pdf' && matchMedia('(max-width: 960px)').matches) setView('code');
      flashLines(t.dataset.sync);
    });
    $('[data-lab-code]', root).addEventListener('click', (e) => {
      if (e.target.closest('.code-in')) return;
      const li = e.target.closest('li');
      if (!li) return;
      const n = Number(li.dataset.line);
      // la orden más interior que cubre la línea (el veredicto antes que el párrafo)
      const hit = $$('[data-sync]', pdf).filter((x) => { const [a, b] = range(x.dataset.sync); return n >= a && n <= b; }).pop();
      if (!hit) return;
      if (body.dataset.view === 'code' && matchMedia('(max-width: 960px)').matches) setView('pdf');
      $$('[data-sync].lit', pdf).forEach((x) => x.classList.remove('lit'));
      hit.classList.add('lit');
      setTimeout(() => hit.classList.remove('lit'), 1600);
    });

    // pestañas en pantallas estrechas
    const setView = (v) => {
      body.dataset.view = v;
      $$('[data-lab-view]', root).forEach((b) => {
        const on = b.dataset.labView === v;
        b.classList.toggle('is-on', on);
        b.setAttribute('aria-selected', String(on));
      });
    };
    $$('[data-lab-view]', root).forEach((b) => b.addEventListener('click', () => setView(b.dataset.labView)));

    paintGhosts();
    paintPdf();
  })();

  /* ------------------------------------------------------------------------
     § 4 — Grafo reactivo
     ------------------------------------------------------------------------ */
  (function dag() {
    const root = $('[data-dag]');
    if (!root) return;
    const TIMES = { datos: 0.002, excel: 1.8, sim: 30, graf: 0.4, tabla: 0.05 };
    const TOTAL = Object.values(TIMES).reduce((a, b) => a + b, 0);
    const S = {
      texto: { run: [], edges: [], line: T('Cambias el texto: <b>no se ejecuta ninguna celda</b>. Solo se compone el PDF.', 'You change the text: <b>no cell runs</b>. Only the PDF is typeset.') },
      grafica: { run: ['graf'], edges: [], line: T('Cambias la gráfica: <b>solo se ejecuta la gráfica</b>. La simulación no se repite.', 'You change the plot: <b>only the plot runs</b>. The simulation is not repeated.') },
      datos: { run: ['datos', 'sim', 'graf', 'tabla'], edges: ['datos-sim', 'sim-graf', 'sim-tabla', 'datos-tabla'], line: T('Cambias los datos: <b>se ejecuta lo que los usa</b>, directa o indirectamente. La lectura del Excel no.', 'You change the data: <b>what uses them runs</b>, directly or indirectly. Reading the Excel file does not.') },
      excel: { run: ['excel', 'sim', 'graf', 'tabla'], edges: ['excel-sim', 'sim-graf', 'sim-tabla'], line: T('Cambia el archivo que lee una celda: <b>esa celda se repite</b> aunque su código sea el mismo, y con ella todo lo que depende.', 'The file a cell reads changes: <b>that cell runs again</b> even though its code is the same, and everything depending on it.') },
      mismo: { run: ['datos'], cut: true, edges: [], line: T('Vuelves a escribir g = 9.81: la celda da <b>el mismo resultado</b> y la cadena se corta ahí.', 'You type g = 9.81 again: the cell gives <b>the same result</b> and the chain stops there.') },
    };
    const nodes = Object.fromEntries($$('.dag-node', root).map((n) => [n.dataset.n, n]));
    const edges = $$('.dag-svg .edges path', root);
    let timers = [];
    const fmtT = (t) => (t === 0 ? '0 s' : t < 1 ? `${Math.max(1, Math.round(t * 1000))} ms` : `${coma(t.toFixed(1))} s`);
    const play = (key) => {
      timers.forEach(clearTimeout); timers = [];
      const sc = S[key];
      $$('[data-dag-do]', root).forEach((b) => b.classList.toggle('is-on', b.dataset.dagDo === key));
      $$('[data-dag-do]', root).forEach((b, i, all) => b.classList.toggle('past', all.findIndex((x) => x.dataset.dagDo === key) > i));
      Object.values(nodes).forEach((n) => { n.className = 'dag-node' + (n.dataset.n === 'sim' ? ' heavy' : ''); n.dataset.badge = ''; });
      edges.forEach((e) => e.classList.remove('on', 'cut'));
      Object.keys(nodes).filter((k) => !sc.run.includes(k)).forEach((k) => { nodes[k].classList.add('skip'); });
      sc.run.forEach((k, i) => {
        timers.push(setTimeout(() => {
          nodes[k].classList.remove('skip');
          nodes[k].classList.add('run'); nodes[k].dataset.badge = 'ejecutando';
          sc.edges.filter((e) => e.endsWith(`-${k}`)).forEach((e) => $(`[data-e="${e}"]`, root)?.classList.add('on'));
        }, 120 + i * 520));
        timers.push(setTimeout(() => {
          nodes[k].classList.remove('run');
          if (sc.cut) {
            nodes[k].classList.add('cut'); nodes[k].dataset.badge = 'mismo valor: se corta';
            ['datos-sim', 'datos-tabla'].forEach((e) => $(`[data-e="${e}"]`, root)?.classList.add('cut'));
          } else { nodes[k].classList.add('done'); nodes[k].dataset.badge = '✓ ejecutada'; }
        }, 120 + i * 520 + 480));
      });
      const t = sc.run.reduce((a, k) => a + TIMES[k], 0);
      const n = sc.run.length;
      $('[data-dag-line]', root).innerHTML = `${sc.line}<br><span style="color:var(--ink-3)">${T(`Celdas Python: ${fmtT(t)} (${n} ${n === 1 ? 'ejecutada' : 'ejecutadas'} de 5)`, `Python cells: ${fmtT(t)} (${n} run of 5)`)}</span>`;
      $('[data-dag-pyx]', root).style.setProperty('--w', `${(t / TOTAL) * 100}%`);
      $('[data-dag-pyxt]', root).textContent = fmtT(t);
    };
    // las flechas salen del borde de una celda y llegan al de la siguiente
    const board = $('.dag-board', root), svg = $('.dag-svg', root);
    const layout = () => {
      const br = board.getBoundingClientRect();
      svg.setAttribute('viewBox', `0 0 ${br.width} ${br.height}`);
      edges.forEach((path) => {
        const [a, b] = path.dataset.e.split('-').map((k) => nodes[k].getBoundingClientRect());
        const ax = a.left + a.width / 2 - br.left, bx = b.left + b.width / 2 - br.left;
        const sx = ax + clamp((bx - ax) * 0.3, -a.width * 0.35, a.width * 0.35);
        const ex = bx + clamp((ax - bx) * 0.3, -b.width * 0.35, b.width * 0.35);
        const sy = a.bottom - br.top + 2, ey = b.top - br.top - 3;
        const k = (ey - sy) * 0.55;
        path.setAttribute('d', `M${sx.toFixed(1)} ${sy.toFixed(1)}C${sx.toFixed(1)} ${(sy + k).toFixed(1)} ${ex.toFixed(1)} ${(ey - k).toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`);
      });
    };
    new ResizeObserver(layout).observe(board);
    // los cinco cambios pasan solos, uno tras otro, mientras el grafo está a la vista
    const order = ['texto', 'grafica', 'datos', 'excel', 'mismo'];
    let idx = 0, cycle = 0;
    const next = () => { play(order[idx]); idx = (idx + 1) % order.length; };
    new IntersectionObserver((es) => {
      const on = es.some((e) => e.isIntersecting);
      clearInterval(cycle);
      if (on) { next(); cycle = setInterval(next, 4600); }
    }, { threshold: 0.35 }).observe(root);
  })();

  /* ------------------------------------------------------------------------
     § 5 — Cuadernos vinculados
     ------------------------------------------------------------------------ */
  (function notebooks() {
    const root = $('[data-nb]');
    if (!root) return;
    const card = $('.nb-card', root);
    const MODES = [
      ['live', T('El cuaderno está abierto en VS Code y ya lo has ejecutado.', 'The notebook is open in VS Code and you have already run it.'), T('· abierto en VS Code', '· open in VS Code'), T('Pyx copia Hs del kernel de Jupyter. En el cuaderno no se ejecuta nada.', 'Pyx copies Hs from the Jupyter kernel. Nothing runs in the notebook.')],
      ['saved', T('Has cerrado Jupyter y el cuaderno no ha cambiado.', 'You closed Jupyter and the notebook has not changed.'), T('· cerrado', '· closed'), T('Pyx usa los valores que tomó la última vez. Nada que ejecutar.', 'Pyx uses the values it took last time. Nothing to run.')],
      ['diff', T('Jupyter está cerrado y has editado la celda [2].', 'Jupyter is closed and you edited cell [2].'), T('· cerrado, celda [2] editada', '· closed, cell [2] edited'), T('Pyx recupera lo que dejó la última ejecución y repite solo la celda [2].', 'Pyx recovers what the last run left and repeats only cell [2].')],
      ['once', T('Es la primera vez que lo vinculas y Jupyter está cerrado.', 'It is the first time you link it and Jupyter is closed.'), T('· cerrado, nunca ejecutado', '· closed, never run'), T('Pyx lo ejecuta una vez, desde su carpeta, y guarda sus valores.', 'Pyx runs it once, from its folder, and saves its values.')],
    ];
    const situation = $('[data-nb-situation]', root);
    const paint = (i) => {
      const [mode, text, where] = MODES[i];
      root.classList.remove('mode-live', 'mode-saved', 'mode-once', 'mode-diff');
      root.classList.add(`mode-${mode}`);
      $$('[data-nb-step]', root).forEach((li) => li.classList.toggle('is-on', li.dataset.nbStep === mode));
      card.classList.toggle('closed', mode !== 'live');
      $('[data-nb-where]', root).textContent = where;
      situation.textContent = text;
      situation.classList.remove('swap'); void situation.offsetWidth; situation.classList.add('swap');
      $$('.nb-cell', root).forEach((c, k) => c.classList.toggle('re', mode === 'once' || (mode === 'diff' && k === 1)));
    };
    let i = 0, cycle = 0;
    paint(0);
    new IntersectionObserver((es) => {
      clearInterval(cycle);
      if (es.some((e) => e.isIntersecting)) cycle = setInterval(() => { i = (i + 1) % MODES.length; paint(i); }, 4200);
    }, { threshold: 0.35 }).observe(root);
  })();

  /* ------------------------------------------------------------------------
     § 6.1 — Corrector: rojo ortografía, azul puntuación, verde redacción
     ------------------------------------------------------------------------ */
  (function spell() {
    const root = $('[data-spell]');
    if (!root) return;
    const paper = $('[data-spell-text]', root);
    const DOC = EN ? [
      'The ', { t: 'beam beam', fix: 'beam', c: 'green', why: 'Repeated word.' },
      ' is designed to the code', { t: ' ,with', fix: ', with', c: 'blue', why: 'There is a space before the comma and none after it.' },
      ' a load of ', { t: '25kN', fix: '25 kN', c: 'blue', why: 'A space goes between a number and its unit.' },
      '. The ', { t: 'stresess', fix: 'stresses', c: 'red', why: 'Not in the dictionary.' },
      ' that were not considered', { t: '  ', fix: ' ', c: 'blue', why: 'Two spaces in a row.' },
      'in the ', { t: 'calculaton', fix: 'calculation', c: 'red', why: 'Not in the dictionary.' },
      ' are now included.',
    ] : [
      'La ', { t: 'viga viga', fix: 'viga', c: 'green', why: 'Palabra repetida.' },
      ' se dimensiona ', { t: 'en base a', fix: 'según', c: 'green', why: 'Expresión que conviene evitar.' },
      ' la norma', { t: ' ,con', fix: ', con', c: 'blue', why: 'Sobra el espacio antes de la coma y falta uno después.' },
      ' una carga de ', { t: '25kN', fix: '25 kN', c: 'blue', why: 'Entre un número y su unidad va un espacio.' },
      '. ', { t: 'Sobretodo', fix: 'Sobre todo', c: 'green', why: 'Con el sentido de «especialmente», se escribe separado.' },
      ', ', { t: 'habían', fix: 'había', c: 'green', why: '«Haber» impersonal va en singular: «había muchos».' },
      ' muchos ', { t: 'esfuersos', fix: 'esfuerzos', c: 'red', why: 'No está en el diccionario.' },
      ' que no se consideraron', { t: '  ', fix: ' ', c: 'blue', why: 'Dos espacios seguidos.' },
      'en el ', { t: 'calculo', fix: 'cálculo', c: 'red', why: 'Como sustantivo lleva tilde: «cálculo».' },
      '.',
    ];
    const NAMES = EN ? { red: 'Spelling', blue: 'Punctuation and spacing', green: 'Style' } : { red: 'Ortografía', blue: 'Puntuación y espacios', green: 'Redacción' };
    paper.innerHTML = DOC.map((d, i) => typeof d === 'string' ? esc(d)
      : `<span class="err ${d.c}" tabindex="0" role="button" data-i="${i}" aria-label="${esc(NAMES[d.c])}: ${esc(d.why)} ${T('Sugerencia', 'Suggestion')}: ${esc(d.fix.trim() || T('un espacio', 'a space'))}">${esc(d.t)}</span>`).join('');
    const tip = document.createElement('div');
    tip.className = 'spell-tip'; tip.setAttribute('aria-hidden', 'true');
    paper.appendChild(tip);
    const left = $('[data-spell-left]', root);
    const count = () => {
      const n = $$('.err:not(.fixed)', paper).length;
      left.textContent = n ? `${n} ${n === 1 ? T('aviso', 'warning') : T('avisos', 'warnings')}` : T('Sin avisos ✓', 'No warnings ✓');
    };
    const show = (el) => {
      const d = DOC[el.dataset.i];
      tip.innerHTML = `<b>${NAMES[d.c]}</b>${esc(d.why)}<br><span class="s">${esc(d.fix.trim() ? d.fix : '␣')}</span>`;
      const r = el.getBoundingClientRect(), pr = paper.getBoundingClientRect();
      tip.style.left = `${clamp(r.left - pr.left, 8, pr.width - 300)}px`;
      tip.style.top = `${r.bottom - pr.top + 8}px`;
      tip.classList.add('show');
    };
    const hide = () => tip.classList.remove('show');
    const menu = document.createElement('div');
    menu.className = 'spell-menu'; menu.setAttribute('role', 'menu'); menu.hidden = true;
    paper.appendChild(menu);
    let menuFor = null;
    const closeMenu = () => { menu.hidden = true; menuFor = null; };
    const openMenu = (el) => {
      const d = DOC[el.dataset.i];
      menuFor = el; hide();
      menu.innerHTML = `<button type="button" role="menuitem" data-act="fix">${esc(d.fix.trim() ? d.fix : T('un solo espacio', 'a single space'))}</button>`
        + (d.c === 'red' ? '<button type="button" role="menuitem" data-act="dict">' + T('Añadir al diccionario', 'Add to dictionary') + '</button>' : '')
        + '<button type="button" role="menuitem" data-act="ignore">' + T('Ignorar', 'Ignore') + '</button>';
      const r = el.getBoundingClientRect(), pr = paper.getBoundingClientRect();
      menu.style.left = `${clamp(r.left - pr.left, 8, pr.width - 220)}px`;
      menu.style.top = `${r.bottom - pr.top + 6}px`;
      menu.hidden = false;
      menu.querySelector('button').focus();
    };
    const dismiss = (el) => {
      el.classList.add('fixed', 'settled');
      el.removeAttribute('tabindex'); el.removeAttribute('role');
      count();
    };
    menu.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b || !menuFor) return;
      const el = menuFor;
      closeMenu();
      if (b.dataset.act === 'fix') fix(el); else dismiss(el);
    });
    menu.addEventListener('keydown', (e) => {
      const items = $$('button', menu), k = items.indexOf(document.activeElement);
      if (e.key === 'ArrowDown') { e.preventDefault(); items[(k + 1) % items.length].focus(); }
      if (e.key === 'ArrowUp') { e.preventDefault(); items[(k - 1 + items.length) % items.length].focus(); }
      if (e.key === 'Escape') { const el = menuFor; closeMenu(); el?.focus(); }
    });
    document.addEventListener('click', (e) => { if (!menu.hidden && !menu.contains(e.target) && !e.target.closest('.err')) closeMenu(); });
    const fix = (el) => {
      if (el.classList.contains('fixed')) return;
      el.textContent = DOC[el.dataset.i].fix;
      el.classList.add('fixed');
      el.removeAttribute('tabindex'); el.removeAttribute('role');
      setTimeout(() => el.classList.add('settled'), 60);
      hide(); count();
      el.focus?.();
    };
    paper.addEventListener('pointerover', (e) => { const el = e.target.closest('.err:not(.fixed)'); if (el) show(el); });
    paper.addEventListener('pointerout', (e) => { if (e.target.closest('.err')) hide(); });
    paper.addEventListener('focusin', (e) => { const el = e.target.closest('.err:not(.fixed)'); if (el) show(el); });
    paper.addEventListener('focusout', hide);
    const pickErr = (e) => { const el = e.target.closest('.err:not(.fixed)'); if (el) { e.preventDefault(); openMenu(el); } };
    paper.addEventListener('click', pickErr);
    paper.addEventListener('contextmenu', pickErr);
    paper.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ' || e.key === 'ContextMenu') && e.target.closest('.err:not(.fixed)')) { e.preventDefault(); openMenu(e.target); } });
    count();
  })();

  /* ------------------------------------------------------------------------
     § 6.2 — Autocompletado
     ------------------------------------------------------------------------ */
  (function autocomplete() {
    const root = $('[data-ac]');
    if (!root) return;
    const input = $('[data-ac-input]', root);
    const list = $('[data-ac-list]', root);
    const added = $('[data-ac-added]', root);
    const CMDS = [
      ['\\py{expresión}', 'Valor de Python en el PDF', 'Pyx'],
      ['\\pyif{condición}{sí}{no}', 'Un texto u otro según Python', 'Pyx'],
      ['\\pyfile{datos.py}', 'Vincula un archivo .py', 'Pyx'],
      ['\\pynotebook{cuaderno.ipynb}', 'Vincula un cuaderno de Jupyter', 'Pyx'],
      ['\\qty{valor}{unidad}', 'Cantidad con unidades', 'siunitx', true],
      ['\\num{número}', 'Número con formato', 'siunitx', true],
      ['\\frac{num}{den}', 'Fracción', ''],
      ['\\sqrt{x}', 'Raíz cuadrada', ''],
      ['\\section{título}', 'Sección', ''],
      ['\\subsection{título}', 'Subsección', ''],
      ['\\textbf{texto}', 'Negrita', ''],
      ['\\textit{texto}', 'Cursiva', ''],
      ['\\includegraphics{archivo}', 'Imagen', 'graphicx'],
      ['\\begin{equation}', 'Ecuación numerada', 'entorno'],
      ['\\begin{figure}', 'Figura con su \\caption y \\label', 'entorno'],
      ['\\begin{table}', 'Tabla con su tabular', 'entorno'],
      ['\\begin{align}', 'Ecuaciones alineadas', 'amsmath'],
      ['\\ref{etiqueta}', 'Referencia a una etiqueta', ''],
      ['\\cref{etiqueta}', 'Referencia con su nombre', 'cleveref', true],
      ['\\cite{clave}', 'Cita de la bibliografía', ''],
      ['\\gls{entrada}', 'Entrada del glosario', 'glossaries', true],
    ];
    // English page: the same commands, described in English.
    if (EN) [['\\py{expression}', 'Python value in the PDF'], ['\\pyif{condition}{yes}{no}', 'One text or another depending on Python'], ['\\pyfile{data.py}', 'Links a .py file'], ['\\pynotebook{notebook.ipynb}', 'Links a Jupyter notebook'], ['\\qty{value}{unit}', 'Quantity with units'], ['\\num{number}', 'Formatted number'], ['\\frac{num}{den}', 'Fraction'], ['\\sqrt{x}', 'Square root'], ['\\section{title}', 'Section'], ['\\subsection{title}', 'Subsection'], ['\\textbf{text}', 'Bold'], ['\\textit{text}', 'Italic'], ['\\includegraphics{file}', 'Image'], ['\\begin{equation}', 'Numbered equation'], ['\\begin{figure}', 'Figure with its \\caption and \\label'], ['\\begin{table}', 'Table with its tabular'], ['\\begin{align}', 'Aligned equations'], ['\\ref{label}', 'Reference to a label'], ['\\cref{label}', 'Reference with its name'], ['\\cite{key}', 'Bibliography citation'], ['\\gls{entry}', 'Glossary entry']].forEach(([c, d], k) => { if (CMDS[k]) { CMDS[k][0] = c; CMDS[k][1] = d; if (CMDS[k][2] === 'entorno') CMDS[k][2] = 'environment'; } });
    let items = [], sel = 0, ctx = null;
    const vars = () => {
      const r = labResult();
      return [
        ['P', pyfmt(lab.P), 'float'], ['L', pyfmt(lab.L), 'float'], ['perfil', lab.perfil, 'str'],
        ['flecha', r.flecha.toFixed(4), 'float'], ['sigma', r.sigma.toFixed(2), 'float'], ['fyd', r.fyd.toFixed(2), 'float'],
        ['I', String(r.I), 'int · perfiles.py'], ['W', String(r.W), 'int · perfiles.py'],
        ['comprobaciones', 'DataFrame 2×4', 'DataFrame'], ['fig', '\\begin{figure}…', 'str'],
      ];
    };
    const context = () => {
      // sin el foco, el cursor se supone al final de la línea
      const pos = document.activeElement === input ? (input.selectionStart ?? input.value.length) : input.value.length;
      const before = input.value.slice(0, pos);
      let m = before.match(/\\py\{([A-Za-z_]\w*)?$/);
      if (m) return { kind: 'var', start: pos - (m[1] || '').length, word: m[1] || '', pos };
      m = before.match(/\\([A-Za-z]*)$/);
      if (m) return { kind: 'cmd', start: pos - m[0].length, word: m[1], pos };
      return null;
    };
    const render = () => {
      ctx = context();
      if (!ctx) { items = []; list.innerHTML = ''; input.setAttribute('aria-expanded', 'false'); return; }
      const w = ctx.word.toLowerCase();
      if (ctx.kind === 'var') {
        items = vars().filter(([n]) => n.toLowerCase().startsWith(w)).map(([n, v, t]) => ({ insert: n, label: n, desc: `${v}`, tag: t }));
      } else {
        items = CMDS.filter(([c]) => c.slice(1).toLowerCase().startsWith(w)).map(([c, d, p, add]) => ({ insert: c, label: c.replace(/\{[^}]*\}/g, '{…}'), desc: d, tag: add ? T('se añade \\usepackage', 'adds \\usepackage') : p, add: add ? p : null }));
      }
      sel = clamp(sel, 0, Math.max(0, items.length - 1));
      list.innerHTML = items.map((it, i) => `<li role="option" id="ac-${i}" aria-selected="${i === sel}" data-i="${i}"><span>${esc(it.label)}</span><small>${esc(it.desc)}</small>${it.tag ? `<em class="${it.add ? 'add' : ''}">${esc(it.tag)}</em>` : '<span></span>'}</li>`).join('');
      input.setAttribute('aria-expanded', String(items.length > 0));
      if (items.length) input.setAttribute('aria-activedescendant', `ac-${sel}`);
      // desplaza solo la lista, nunca la página
      const cur = $(`#ac-${sel}`, list);
      if (cur) {
        if (cur.offsetTop < list.scrollTop) list.scrollTop = cur.offsetTop - 4;
        else if (cur.offsetTop + cur.offsetHeight > list.scrollTop + list.clientHeight) list.scrollTop = cur.offsetTop + cur.offsetHeight - list.clientHeight + 4;
      }
    };
    const accept = (i) => {
      const it = items[i];
      if (!it || !ctx) return;
      const v = input.value;
      if (ctx.kind === 'var') {
        const after = v.slice(ctx.pos);
        const close = after.startsWith('}') ? '' : '}';
        input.value = v.slice(0, ctx.start) + it.insert + close + after;
        const caret = ctx.start + it.insert.length + 1;
        input.setSelectionRange(caret, caret);
      } else {
        input.value = v.slice(0, ctx.start) + it.insert + v.slice(ctx.pos);
        // deja seleccionado el primer hueco, como en Pyx (Tab salta al siguiente)
        const m = it.insert.match(/\{([^}]*)\}/);
        if (m && !it.insert.startsWith('\\begin')) {
          const a = ctx.start + it.insert.indexOf(m[0]) + 1;
          input.setSelectionRange(a, a + m[1].length);
        } else {
          const end = ctx.start + it.insert.length;
          input.setSelectionRange(end, end);
        }
        if (it.add) { added.hidden = false; added.innerHTML = `+ <span class="tk-cmd">\\usepackage</span>{${esc(it.add)}} ${T('añadido al preámbulo', 'added to the preamble')}`; }
      }
      input.focus();
      render();
    };
    input.addEventListener('input', () => { sel = 0; render(); });
    input.addEventListener('click', render);
    input.addEventListener('keyup', (e) => { if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) render(); });
    input.addEventListener('keydown', (e) => {
      if (!items.length) return;
      if (e.key === 'ArrowDown') { e.preventDefault(); sel = (sel + 1) % items.length; render(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); sel = (sel - 1 + items.length) % items.length; render(); }
      else if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); accept(sel); }
      else if (e.key === 'Escape') { items = []; list.innerHTML = ''; }
    });
    list.addEventListener('mousedown', (e) => e.preventDefault());
    list.addEventListener('click', (e) => { const li = e.target.closest('li'); if (li) accept(Number(li.dataset.i)); });
    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-controls', 'ac-list');
    list.id = 'ac-list';
    // no se toca el cursor al cargar: en el móvil, colocarlo en un campo hace que la página salte hasta él
    render();
  })();

  /* ------------------------------------------------------------------------
     § 6.3 — Pegar una tabla de Excel
     ------------------------------------------------------------------------ */
  (function paste() {
    const root = $('[data-paste]');
    if (!root) return;
    const grid = $('[data-paste-grid]', root);
    const codeEl = $('[data-paste-code]', root);
    const renderEl = $('[data-paste-render]', root);
    const area = $('[data-paste-area]', root);
    const SAMPLE = [
      [T('Perfil', 'Section'), 'I (cm⁴)', 'W (cm³)', T('Peso (kg/m)', 'Weight (kg/m)')],
      ['IPE 200', '1943', '194', '22.4'],
      ['IPE 240', '3892', '324', '30.7'],
      ['IPE 300', '8356', '557', '42.2'],
      ['IPE 360', '16270', '904', '57.1'],
    ];
    const isNum = (s) => /^[-+]?(\d+([.,]\d+)?|[.,]\d+)(e[-+]?\d+)?\s*%?$/i.test(s.trim());
    const texEsc = (s) => s.replace(/\\/g, '\\textbackslash{}').replace(/([&%$#_{}])/g, '\\$1').replace(/~/g, '\\textasciitilde{}').replace(/\^/g, '\\textasciicircum{}');
    const gridHtml = (rows) => {
      const cols = Math.max(...rows.map((r) => r.length));
      const letters = 'ABCDEFGHIJ';
      return `<table><thead><tr><th></th>${Array.from({ length: cols }, (_, i) => `<th>${letters[i] || ''}</th>`).join('')}</tr></thead><tbody>${rows.map((r, i) => `<tr><th>${i + 1}</th>${Array.from({ length: cols }, (_, j) => `<td class="${isNum(r[j] || '') ? 'n' : ''}">${esc(r[j] || '')}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    };
    const toLatex = (rows) => {
      const cols = Math.max(...rows.map((r) => r.length));
      const body = rows.slice(1);
      const spec = Array.from({ length: cols }, (_, j) => (body.length && body.every((r) => isNum(r[j] || '0')) ? 'r' : 'l')).join('');
      const line = (r) => `    ${Array.from({ length: cols }, (_, j) => texEsc((r[j] || '').trim())).join(' & ')} \\\\`;
      return [
        `\\begin{tabular}{${spec}}`, '    \\toprule', line(rows[0]), '    \\midrule',
        ...body.map(line), '    \\bottomrule', '\\end{tabular}',
      ];
    };
    const hl = (l) => esc(l).replace(/\\(begin|end|toprule|midrule|bottomrule|textbackslash|textasciitilde|textasciicircum)/g, '<span class="tk-cmd">\\$1</span>').replace(/(\{[lrc]+\})/, '<span class="tk-str">$1</span>').replace(/ &amp; /g, ' <span class="tk-py">&amp;</span> ');
    const renderTable = (rows) => {
      const cols = Math.max(...rows.map((r) => r.length));
      const body = rows.slice(1);
      const right = Array.from({ length: cols }, (_, j) => body.length && body.every((r) => isNum(r[j] || '0')));
      renderEl.innerHTML = `<table class="booktabs"><thead><tr>${Array.from({ length: cols }, (_, j) => `<th style="text-align:${right[j] ? 'right' : 'left'}">${esc(rows[0][j] || '')}</th>`).join('')}</tr></thead><tbody>${body.map((r) => `<tr>${Array.from({ length: cols }, (_, j) => `<td style="text-align:${right[j] ? 'right' : 'left'}">${esc(r[j] || '')}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    };
    let typing = 0;
    const emit = (rows, animate) => {
      clearInterval(typing);
      const lines = toLatex(rows);
      if (!animate) { codeEl.innerHTML = lines.map(hl).join('\n'); renderTable(rows); return; }
      codeEl.innerHTML = ''; renderEl.innerHTML = '';
      let i = 0;
      typing = setInterval(() => {
        codeEl.innerHTML = lines.slice(0, ++i).map(hl).join('\n');
        if (i >= lines.length) { clearInterval(typing); renderTable(rows); }
      }, 70);
    };
    const parse = (text) => text.replace(/\r/g, '').split('\n').filter((l) => l.trim() !== '').map((l) => l.split('\t'));
    grid.innerHTML = gridHtml(SAMPLE);
    const fromArea = (text) => {
      const rows = parse(text);
      if (!rows.length) return;
      emit(rows, true);
      area.value = '';
    };
    area.addEventListener('paste', (e) => {
      const text = e.clipboardData?.getData('text/plain');
      if (!text) return;
      e.preventDefault();
      area.value = text;
      fromArea(text);
    });
    // un pegado sin portapapeles accesible (algunos navegadores móviles) llega como texto escrito
    area.addEventListener('input', (e) => { if (e.inputType === 'insertFromPaste') fromArea(area.value); });
    // al copiar la tabla de ejemplo, la página la entrega separada por tabuladores, como Excel
    grid.addEventListener('copy', (e) => {
      const sel = getSelection();
      if (!sel || sel.isCollapsed) return;
      const rows = $$('tbody tr', grid).map((tr) => $$('td', tr).filter((td) => sel.containsNode(td, true)).map((td) => td.textContent)).filter((r) => r.length);
      if (!rows.length) return;
      e.preventDefault();
      e.clipboardData.setData('text/plain', rows.map((r) => r.join('\t')).join('\n'));
      grid.classList.add('copied');
      setTimeout(() => grid.classList.remove('copied'), 900);
    });
    // al llegar, la primera tabla se pega sola
    whenVisible(root, () => {
      area.value = '';
      setTimeout(() => { area.classList.add('flash'); emit(SAMPLE, true); setTimeout(() => area.classList.remove('flash'), 600); }, 500);
    });
  })();

  /* ------------------------------------------------------------------------
     § 7 — Visor: anotar el PDF
     ------------------------------------------------------------------------ */
  (function viewer() {
    const root = $('[data-viewer]');
    if (!root) return;
    const canvas = $('[data-ink]', root);
    const ctx = canvas.getContext('2d');
    let tool = 'hl', color = '#e5484d';
    let strokes = [], history = [], cur = null, laser = [], raf = 0, W = 0, H = 0, dpr = 1;
    canvas.tabIndex = 0;

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      dpr = Math.min(2, devicePixelRatio || 1);
      W = r.width; H = r.height;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      draw();
    };
    new ResizeObserver(resize).observe(canvas);

    const P = (e) => { const r = canvas.getBoundingClientRect(); return [(e.clientX - r.left) / W, (e.clientY - r.top) / H]; };
    const px = ([x, y]) => [x * W, y * H];
    const snap = (a, b) => {
      const [ax, ay] = px(a), [bx, by] = px(b);
      const ang = Math.round(Math.atan2(by - ay, bx - ax) / (Math.PI / 4)) * (Math.PI / 4);
      const len = Math.hypot(bx - ax, by - ay);
      return [(ax + Math.cos(ang) * len) / W, (ay + Math.sin(ang) * len) / H];
    };

    function drawStroke(s) {
      ctx.save();
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.strokeStyle = s.color; ctx.fillStyle = s.color;
      const pts = s.pts.map(px);
      if (s.tool === 'hl') {
        ctx.globalAlpha = 0.32;
        ctx.globalCompositeOperation = 'multiply';
        const [a, b] = [pts[0], pts[pts.length - 1]];
        const x = Math.min(a[0], b[0]), w = Math.abs(b[0] - a[0]);
        ctx.fillRect(x, a[1] - 11, w, 22);
      } else if (s.tool === 'pen') {
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.moveTo(pts[0][0], pts[0][1]);
        for (let i = 1; i < pts.length - 1; i++) {
          const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2;
          ctx.quadraticCurveTo(pts[i][0], pts[i][1], mx, my);
        }
        const last = pts[pts.length - 1];
        ctx.lineTo(last[0], last[1]);
        ctx.stroke();
      } else if (s.tool === 'arrow') {
        const [a, b] = [pts[0], pts[pts.length - 1]];
        ctx.lineWidth = 2.6;
        ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
        const ang = Math.atan2(b[1] - a[1], b[0] - a[0]), hl = 13;
        ctx.beginPath();
        ctx.moveTo(b[0], b[1]);
        ctx.lineTo(b[0] - hl * Math.cos(ang - 0.42), b[1] - hl * Math.sin(ang - 0.42));
        ctx.lineTo(b[0] - hl * Math.cos(ang + 0.42), b[1] - hl * Math.sin(ang + 0.42));
        ctx.closePath(); ctx.fill();
      } else if (s.tool === 'rect') {
        const [a, b] = [pts[0], pts[pts.length - 1]];
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.roundRect(Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1]), 6);
        ctx.stroke();
      }
      ctx.restore();
    }
    function draw() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      strokes.forEach(drawStroke);
      if (cur && cur.tool !== 'eraser' && cur.tool !== 'laser') drawStroke(cur);
      // láser: brilla un momento y desaparece
      const now = performance.now();
      laser = laser.filter((p) => now - p.t < 700);
      if (laser.length > 1) {
        ctx.save();
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        for (let i = 1; i < laser.length; i++) {
          const a = laser[i - 1], b = laser[i], life = 1 - (now - b.t) / 700;
          ctx.strokeStyle = `rgba(255, 40, 60, ${life})`;
          ctx.shadowColor = 'rgba(255, 30, 50, .9)'; ctx.shadowBlur = 12;
          ctx.lineWidth = 2 + life * 4;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
        ctx.restore();
      }
    }
    const loop = () => { draw(); raf = laser.length ? requestAnimationFrame(loop) : 0; };
    const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };

    const segDist = (p, a, b) => {
      const dx = b[0] - a[0], dy = b[1] - a[1];
      const t = clamp(((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy || 1), 0, 1);
      return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
    };
    const hits = (s, p) => {
      const pts = s.pts.map(px);
      const R = 12;
      if (s.tool === 'pen') return pts.some((q, i) => i && segDist(p, pts[i - 1], q) < R);
      const a = pts[0], b = pts[pts.length - 1];
      if (s.tool === 'arrow') return segDist(p, a, b) < R;
      if (s.tool === 'hl') return p[0] > Math.min(a[0], b[0]) - 4 && p[0] < Math.max(a[0], b[0]) + 4 && Math.abs(p[1] - a[1]) < 14;
      if (s.tool === 'rect') {
        const c = [[a[0], a[1]], [b[0], a[1]], [b[0], b[1]], [a[0], b[1]]];
        return c.some((q, i) => segDist(p, q, c[(i + 1) % 4]) < R);
      }
      return false;
    };
    const save = () => { history.push(strokes.slice()); if (history.length > 80) history.shift(); };

    canvas.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      canvas.setPointerCapture(e.pointerId);
      const p = P(e);
      if (tool === 'laser') { cur = { tool }; laser.push({ x: p[0] * W, y: p[1] * H, t: performance.now() }); kick(); return; }
      if (tool === 'eraser') { save(); cur = { tool, erased: false }; erase(p); return; }
      cur = { tool, color, pts: [p] };
    });
    const erase = (p) => {
      const q = px(p);
      const before = strokes.length;
      strokes = strokes.filter((s) => !hits(s, q));
      if (strokes.length !== before) { cur.erased = true; draw(); }
    };
    canvas.addEventListener('pointermove', (e) => {
      if (!cur) return;
      const p = P(e);
      if (cur.tool === 'laser') { laser.push({ x: p[0] * W, y: p[1] * H, t: performance.now() }); kick(); return; }
      if (cur.tool === 'eraser') { erase(p); return; }
      if (cur.tool === 'pen') cur.pts.push(p);
      else cur.pts[1] = cur.tool === 'arrow' && e.shiftKey ? snap(cur.pts[0], p) : p;
      draw();
    });
    const end = () => {
      if (!cur) return;
      if (cur.tool === 'eraser') { if (!cur.erased) history.pop(); }
      else if (cur.tool !== 'laser' && cur.pts.length > 1) { save(); strokes.push(cur); }
      cur = null;
      draw();
    };
    canvas.addEventListener('pointerup', end);
    canvas.addEventListener('pointercancel', end);

    $$('[data-tool]', root).forEach((b) => b.addEventListener('click', () => {
      tool = b.dataset.tool;
      $$('[data-tool]', root).forEach((x) => x.classList.toggle('is-on', x === b));
      canvas.style.cursor = tool === 'eraser' ? 'cell' : tool === 'laser' ? 'none' : 'crosshair';
    }));
    $$('[data-color]', root).forEach((b) => b.addEventListener('click', () => {
      color = b.dataset.color;
      $$('[data-color]', root).forEach((x) => x.classList.toggle('is-on', x === b));
    }));
    const undo = () => { if (history.length) { strokes = history.pop(); draw(); } };
    $('[data-undo]', root).addEventListener('click', undo);
    $('[data-clear]', root).addEventListener('click', () => { if (strokes.length) { save(); strokes = []; draw(); } });
    root.addEventListener('keydown', (e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); undo(); } });

    // unas marcas de ejemplo, para que se vea qué se puede hacer
    whenVisible(root, () => {
      requestAnimationFrame(() => {
        if (strokes.length) return;
        const page = $('.viewer-page', root).getBoundingClientRect();
        const desk = canvas.getBoundingClientRect();
        const fx = (x) => (page.left - desk.left + x * page.width) / W;
        const fy = (y) => (page.top - desk.top + y * page.height) / H;
        strokes.push({ tool: 'rect', color: '#007acc', pts: [[fx(0.67), fy(0.73)], [fx(0.92), fy(0.81)]] });
        strokes.push({ tool: 'arrow', color: '#e5484d', pts: [[fx(0.98), fy(0.6)], [fx(0.88), fy(0.71)]] });
        draw();
      });
    });
  })();

  /* ------------------------------------------------------------------------
     § 9 — Preparar Pyx y la carpeta limpia
     ------------------------------------------------------------------------ */
  (function setup() {
    const term = $('[data-term]');
    if (term) whenVisible(term, () => {
      const lines = $$('[data-term-lines] li', term);
      const bar = $('[data-term-bar]', term);
      lines.forEach((li, i) => setTimeout(() => {
        li.classList.add('on');
        bar.style.width = `${((i + 1) / lines.length) * 100}%`;
      }, 300 + i * 650));
    });
    const folders = $('[data-folders]');
    if (folders) whenVisible(folders, () => setTimeout(() => folders.classList.add('cleaned'), 900));
  })();

  /* ------------------------------------------------------------------------
     § 11 — Novedades (de assets/data/novedades.js)
     ------------------------------------------------------------------------ */
  (function news() {
    const box = $('[data-news]');
    const data = window.PYX_NOVEDADES;
    if (!box || !data?.length) return;
    const v0 = data[0];
    const v = EN && v0.en ? { ...v0, ...v0.en } : v0;
    const md = (s) => esc(s).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    const fecha = new Date(`${v.fecha}T12:00:00`).toLocaleDateString(EN ? 'en-GB' : 'es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
    $('[data-news-title]').innerHTML = `Pyx ${esc(v.version)}. <em>${esc(v.titulo.split(':')[0])}.</em>`;
    box.insertAdjacentHTML('beforebegin', `<p class="eyebrow" style="margin:-36px 0 28px"><span>${esc(fecha)}</span><span class="n">${esc(v.titulo.includes(':') ? v.titulo.split(':').slice(1).join(':').trim() : '')}</span></p>`);
    box.innerHTML = v.grupos.map((g) => `<div class="news-group"><h3>${esc(g.nombre)}</h3><ul>${g.cambios.slice(0, 4).map((c) => `<li>${md(c)}</li>`).join('')}</ul></div>`).join('');
  })();

  /* ------------------------------------------------------------------------
     Descargar: resalta el sistema de quien visita
     ------------------------------------------------------------------------ */
  (function detectOS() {
    const ua = (navigator.userAgentData?.platform || navigator.platform || '') + ' ' + navigator.userAgent;
    const os = /win/i.test(ua) ? 'windows' : /linux|x11/i.test(ua) && !/android/i.test(ua) ? 'linux' : null;
    if (os) $(`.dl-card[data-os="${os}"]`)?.classList.add('is-you');
  })();
})();
