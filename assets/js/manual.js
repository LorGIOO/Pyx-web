/* Pyx · manual: índice que sigue la lectura, buscador y prueba de atajos */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const body = $('#contenido');
  const toc = $('#indice');

  /* ---------- el índice resalta lo que lees ---------- */
  const links = new Map($$('.toc a', toc).map((a) => [a.getAttribute('href').slice(1), a]));
  const targets = [...links.keys()].map((id) => document.getElementById(id)).filter(Boolean);
  let current = null;
  const spy = () => {
    let hit = targets[0];
    for (const t of targets) if (t.getBoundingClientRect().top < innerHeight * 0.3) hit = t;
    if (hit === current) return;
    current = hit;
    $$('.toc a.is-on', toc).forEach((a) => a.classList.remove('is-on'));
    $$('.toc-chap.open', toc).forEach((li) => li.classList.remove('open'));
    const a = links.get(hit.id);
    if (!a) return;
    a.classList.add('is-on');
    const chap = a.closest('.toc-chap');
    chap?.classList.add('open');
    chap?.querySelector(':scope > a')?.classList.add('is-on');
    if (getComputedStyle(toc).position === 'sticky') {
      const r = a.getBoundingClientRect(), tr = toc.getBoundingClientRect();
      if (r.top < tr.top + 80 || r.bottom > tr.bottom - 20) toc.scrollTop += r.top - tr.top - tr.height / 3;
    }
  };
  let queued = false;
  addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(() => { queued = false; spy(); }); } }, { passive: true });
  spy();

  /* ---------- el índice en pantallas estrechas ---------- */
  const toggle = $('[data-toc-toggle]');
  const setToc = (open) => { toc.classList.toggle('open', open); toggle?.setAttribute('aria-expanded', String(open)); toggle.textContent = open ? 'Cerrar' : 'Índice'; };
  toggle?.addEventListener('click', () => setToc(!toc.classList.contains('open')));
  toc.addEventListener('click', (e) => { if (e.target.closest('a') && toc.classList.contains('open')) setToc(false); });

  /* ---------- buscador ---------- */
  const input = $('[data-search]');
  const results = $('[data-results]');
  const blocks = $$('h3, h4, h5, p, li, dt, dd, td, figcaption, .box-title', body).map((el) => {
    const chapter = el.closest('.chapter');
    let section = el.closest('section') && null;
    // el apartado más próximo por encima
    let prev = el;
    while (prev && !section) {
      prev = prev.previousElementSibling || prev.parentElement;
      if (!prev || prev === body) break;
      if (/^H[34]$/.test(prev.tagName)) section = prev;
    }
    const where = [chapter?.querySelector('h2')?.textContent, section?.textContent.replace(/#$/, '')].filter(Boolean).join(' › ');
    return { el, text: el.textContent.replace(/\s+/g, ' ').trim(), n: norm(el.textContent), where };
  }).filter((b) => b.text.length > 2);
  let found = [], sel = 0;
  const snippet = (text, q) => {
    const i = norm(text).indexOf(q);
    const a = Math.max(0, i - 50), z = Math.min(text.length, i + q.length + 80);
    return (a > 0 ? '…' : '') + esc(text.slice(a, i)) + '<mark>' + esc(text.slice(i, i + q.length)) + '</mark>' + esc(text.slice(i + q.length, z)) + (z < text.length ? '…' : '');
  };
  const search = () => {
    const q = norm(input.value.trim());
    sel = 0;
    if (q.length < 2) { found = []; results.innerHTML = ''; return; }
    const seen = new Set();
    found = blocks.filter((b) => b.n.includes(q) && !seen.has(b.el.closest('li, p, dd, td, h3, h4, h5, dt, figcaption')) && seen.add(b.el)).slice(0, 30);
    results.innerHTML = found.length
      ? found.map((b, i) => `<li><a href="#" data-i="${i}" class="${i === 0 ? 'is-on' : ''}"><small>${esc(b.where || 'Manual')}</small>${snippet(b.text, q)}</a></li>`).join('')
      : `<li class="none">Nada con «${esc(input.value.trim())}».</li>`;
  };
  const go = (i) => {
    const b = found[i];
    if (!b) return;
    results.innerHTML = '';
    setToc(false);
    const y = b.el.getBoundingClientRect().top + scrollY - innerHeight * 0.3;
    scrollTo({ top: y, behavior: 'smooth' });
    b.el.classList.remove('hit-flash'); void b.el.offsetWidth; b.el.classList.add('hit-flash');
  };
  input.addEventListener('input', search);
  input.addEventListener('keydown', (e) => {
    const items = $$('a', results);
    if (e.key === 'ArrowDown' && items.length) { e.preventDefault(); sel = (sel + 1) % items.length; }
    else if (e.key === 'ArrowUp' && items.length) { e.preventDefault(); sel = (sel - 1 + items.length) % items.length; }
    else if (e.key === 'Enter') { e.preventDefault(); go(sel); return; }
    else if (e.key === 'Escape') { input.value = ''; search(); input.blur(); return; }
    else return;
    items.forEach((a, k) => a.classList.toggle('is-on', k === sel));
    items[sel]?.scrollIntoView({ block: 'nearest' });
  });
  results.addEventListener('click', (e) => { const a = e.target.closest('a'); if (a) { e.preventDefault(); go(Number(a.dataset.i)); } });
  document.addEventListener('click', (e) => { if (!e.target.closest('.search')) results.innerHTML = ''; });
  addEventListener('keydown', (e) => {
    if (e.key === '/' && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) { e.preventDefault(); if (matchMedia('(max-width: 980px)').matches) setToc(true); input.focus(); }
  });

  /* ---------- prueba un atajo: se busca en la tabla ---------- */
  const table = $('table.shortcuts', body);
  if (table) {
    const box = document.createElement('div');
    box.className = 'keytest';
    box.innerHTML = '<label for="keytest" class="mono" style="font-size:13px;color:var(--ink-2)">Prueba un atajo</label><input id="keytest" readonly placeholder="Haz clic aquí y pulsa una combinación"><output aria-live="polite"></output><small>Algunas combinaciones, como Ctrl+W o Ctrl+N, las atrapa antes el navegador.</small>';
    table.closest('.table-wrap').before(box);
    const out = $('output', box), field = $('input', box);
    const NAMES = { Control: 'Ctrl', Shift: 'Mayús', Alt: 'Alt', Meta: 'Cmd', Enter: 'Intro', ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→', ' ': 'Espacio', Escape: 'Esc', Delete: 'Supr' };
    const rows = $$('tbody tr, tr', table).filter((tr) => tr.querySelector('td'));
    const combos = rows.map((tr) => {
      const first = tr.querySelector('td');
      // una celda puede tener dos atajos («Ctrl+Z / Ctrl+Y»)
      const groups = first.innerHTML.split(/\s\/\s/).map((part) => [...part.matchAll(/<kbd>(.*?)<\/kbd>/g)].map((m) => norm(m[1])).join('+'));
      return { tr, groups, action: tr.cells[1]?.textContent.trim() };
    });
    field.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') return;
      e.preventDefault();
      const mods = [];
      if (e.ctrlKey) mods.push('Ctrl');
      if (e.altKey) mods.push('Alt');
      if (e.shiftKey) mods.push('Mayús');
      if (e.metaKey) mods.push('Cmd');
      const k = NAMES[e.key] || (e.key.length === 1 ? e.key.toUpperCase() : e.key);
      if (['Ctrl', 'Alt', 'Mayús', 'Cmd'].includes(k)) { field.value = mods.join('+') + '+…'; return; }
      const combo = [...mods, k].join('+');
      field.value = combo;
      const n = norm(combo).replace('cmd', 'ctrl');
      $$('tr.match', table).forEach((tr) => tr.classList.remove('match'));
      const hit = combos.find((c) => c.groups.includes(n));
      if (hit) {
        hit.tr.classList.add('match');
        out.innerHTML = `<b>${esc(combo)}</b> · ${esc(hit.action)}`;
        hit.tr.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      } else out.textContent = `${combo}: no es un atajo de fábrica de Pyx.`;
    });
  }
})();
