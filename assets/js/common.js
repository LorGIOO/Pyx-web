/* Pyx · comportamiento común a todas las páginas */
(() => {
  const root = document.documentElement;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* sin almacenamiento: no pasa nada */ } },
  };

  /* ---------- tema: claro / oscuro (el «contraste» del visor de Pyx) ---------- */
  const dark = () => root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  const themeBtn = document.querySelector('[data-theme-toggle]');
  const paintThemeBtn = () => {
    if (!themeBtn) return;
    themeBtn.setAttribute('aria-pressed', String(dark()));
    themeBtn.title = dark() ? 'Pasar al tema claro' : 'Pasar al tema oscuro';
  };
  themeBtn?.addEventListener('click', () => {
    root.dataset.theme = dark() ? 'light' : 'dark';
    store.set('pyx-tema', root.dataset.theme);
    paintThemeBtn();
    document.dispatchEvent(new CustomEvent('pyx:theme'));
  });
  paintThemeBtn();

  /* ---------- menú en pantallas estrechas ---------- */
  const head = document.querySelector('.runhead');
  const menuBtn = document.querySelector('.menu-btn');
  menuBtn?.addEventListener('click', () => {
    const open = head.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', String(open));
  });
  head?.querySelectorAll('nav a').forEach((a) => a.addEventListener('click', () => {
    head.classList.remove('open');
    menuBtn?.setAttribute('aria-expanded', 'false');
  }));

  /* ---------- la raya de la cabecera se llena al leer; el capítulo actual ---------- */
  const where = document.querySelector('.runhead .where');
  const chapters = [...document.querySelectorAll('[data-chapter]')];
  let ticking = false;
  const onScroll = () => {
    ticking = false;
    const max = document.documentElement.scrollHeight - innerHeight;
    root.style.setProperty('--read', `${max > 0 ? (scrollY / max) * 100 : 0}%`);
    if (where && chapters.length) {
      let cur = null;
      for (const c of chapters) if (c.getBoundingClientRect().top < innerHeight * 0.35) cur = c;
      const label = cur ? cur.dataset.chapter : where.dataset.default;
      if (where.dataset.cur !== label) {
        where.dataset.cur = label;
        where.innerHTML = label;
      }
    }
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();

  /* ---------- aparición al entrar en pantalla ---------- */
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  }, { rootMargin: '0px 0px -10% 0px' });
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

  /* ---------- visor de capturas ---------- */
  const box = document.createElement('div');
  box.className = 'lightbox';
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  box.setAttribute('aria-label', 'Imagen ampliada');
  box.innerHTML = '<figure style="margin:0"><img alt=""><p></p></figure>';
  document.body.appendChild(box);
  let lastFocus = null;
  const close = () => { box.classList.remove('open'); lastFocus?.focus(); };
  box.addEventListener('click', close);
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && box.classList.contains('open')) close(); });
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-zoom], .shot-zoom');
    if (!trigger) return;
    const img = trigger.querySelector('img') || trigger;
    const fig = trigger.closest('figure');
    box.querySelector('img').src = img.currentSrc || img.src;
    box.querySelector('img').alt = img.alt;
    box.querySelector('p').textContent = fig?.querySelector('figcaption')?.textContent.trim() || img.alt || '';
    lastFocus = trigger;
    box.classList.add('open');
  });

  /* ---------- copiar bloques de código ---------- */
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('.code-copy');
    if (!btn) return;
    const code = btn.parentElement.querySelector('pre')?.innerText ?? '';
    try {
      await navigator.clipboard.writeText(code);
      btn.textContent = 'Copiado';
    } catch {
      btn.textContent = 'Selecciónalo';
    }
    setTimeout(() => { btn.textContent = 'Copiar'; }, 1600);
  });

  /* ---------- año en el colofón ---------- */
  document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
})();
