/* Vimes Joinville — main.js
   Sem dependências. Tudo dispara por IntersectionObserver; nenhum listener de scroll.
   Horários da loja (fonte única): seg–sex 09–19, sáb 09–15, dom fechado. */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const html = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const modoLeve = !!(navigator.connection && navigator.connection.saveData) || (navigator.deviceMemory && navigator.deviceMemory < 2);

  /* REVISAR TRIMESTRALMENTE (também no HTML): */
  const STATS = { google: '4,9', avaliacoes: 72, instagram: '99,4 mil', facebook: '100%', facebookAvaliacoes: 11 };
  const HEADLINE_ALTERNATIVA = { ativa: false, texto: 'Sua área externa, o ano inteiro.' };
  void STATS; void HEADLINE_ALTERNATIVA;

  /* ---------- Horário de funcionamento (America/Sao_Paulo) ---------- */
  const HORARIOS = { 1: [9, 19], 2: [9, 19], 3: [9, 19], 4: [9, 19], 5: [9, 19], 6: [9, 15], 0: null };
  const DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
  const DIA_IDX = { dom: 0, seg: 1, ter: 2, qua: 3, qui: 4, sex: 5, sáb: 6, sab: 6 };

  function agoraSP() {
    try {
      const parts = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
      const get = (t) => (parts.find(p => p.type === t) || {}).value || '';
      const wd = get('weekday').toLowerCase().replace('.', '').slice(0, 3);
      const dia = DIA_IDX[wd] ?? new Date().getDay();
      return { dia, h: parseInt(get('hour'), 10) % 24, m: parseInt(get('minute'), 10) || 0 };
    } catch (e) {
      const d = new Date(); return { dia: d.getDay(), h: d.getHours(), m: d.getMinutes() };
    }
  }

  function estadoLoja() {
    const { dia, h, m } = agoraSP();
    const t = h + m / 60;
    const hoje = HORARIOS[dia];
    if (hoje && t >= hoje[0] && t < hoje[1]) {
      return { aberto: true, texto: `Aberto agora · fecha às ${hoje[1]}h`, curto: `Atendendo agora · até ${hoje[1]}h`, pos: (t - hoje[0]) / (hoje[1] - hoje[0]), hoje };
    }
    // próximo dia com expediente
    if (hoje && t < hoje[0]) return { aberto: false, texto: `Fechado · abre hoje às ${hoje[0]}h`, curto: `Responde a partir das ${hoje[0]}h`, pos: 0, hoje };
    for (let i = 1; i <= 7; i++) {
      const d = (dia + i) % 7; const hs = HORARIOS[d];
      if (hs) {
        const quando = i === 1 ? 'amanhã' : DIAS[d];
        return { aberto: false, texto: `Fechado · abre ${quando} às ${hs[0]}h`, curto: i === 1 ? `Responde a partir das ${hs[0]}h` : `Responde ${DIAS[d]}, a partir das ${hs[0]}h`, pos: hoje ? 1 : 0, hoje };
      }
    }
    return { aberto: false, texto: 'Fechado', curto: 'Fora do horário', pos: 0, hoje };
  }

  function renderStatus() {
    const s = estadoLoja();
    $$('[data-status]').forEach(el => {
      el.classList.toggle('is-open', s.aberto);
      const t = $('[data-status-text]', el);
      const novo = el.hasAttribute('data-status-card') ? s.curto : s.texto;
      if (t && t.textContent !== novo) t.textContent = novo;
    });
    const after = $('[data-after-hours]');
    if (after) after.hidden = s.aberto;
    // tabela de horários: linha de hoje
    const { dia } = agoraSP();
    $$('[data-hours] [data-days]').forEach(row => {
      const spec = row.getAttribute('data-days');
      const match = spec.includes('-') ? (dia >= +spec.split('-')[0] && dia <= +spec.split('-')[1]) : (+spec === dia);
      row.classList.toggle('today', match);
    });
    // agulha
    const needle = $('[data-needle]');
    if (needle) {
      const hs = s.hoje;
      needle.hidden = !hs;
      if (hs) {
        $('[data-needle-open]', needle).textContent = `${String(hs[0]).padStart(2, '0')}:00`;
        $('[data-needle-close]', needle).textContent = `${String(hs[1]).padStart(2, '0')}:00`;
        needle.dataset.pos = String(Math.round(s.pos * 100));
        if (needle.classList.contains('in')) needle.style.setProperty('--pos', `${needle.dataset.pos}%`);
      }
    }
  }
  renderStatus();
  setInterval(renderStatus, 60000);

  /* ---------- Contatos: fonte única nos data-* dos cards ---------- */
  const contatos = $$('[data-contact]').map(el => ({
    nome: el.dataset.nome, papel: el.dataset.papel, tel: el.dataset.tel, telRaw: el.dataset.telRaw, wa: el.dataset.wa, inicial: el.dataset.inicial, cor: el.dataset.cor || '#6B7A48'
  }));
  const svgUse = (id, cls = '') => `<svg class="${cls}" aria-hidden="true"><use href="#${id}"></use></svg>`;
  $$('[data-contact-list]').forEach(list => {
    list.innerHTML = contatos.map(c => {
      const isLoja = c.papel.toLowerCase().includes('loja');
      const label = isLoja ? 'Falar no WhatsApp da loja' : `Conversar com ${c.nome} no WhatsApp`;
      const avatar = isLoja
        ? `<span class="avatar trama" style="--c:#6B7A48" aria-hidden="true"><svg viewBox="0 0 570.5 302.5" style="width:24px"><use href="#mark"></use></svg></span>`
        : `<span class="avatar trama" style="--c:${c.cor};${c.cor === '#CDBB97' ? 'color:#2C3320' : ''}" aria-hidden="true">${c.inicial}</span>`;
      return `<a href="${c.wa}" target="_blank" rel="noopener" aria-label="${label}">${avatar}<span class="meta"><strong>${isLoja ? 'WhatsApp da loja' : c.nome}</strong><span>${isLoja ? 'Vimes Joinville' : c.papel} · ${c.tel}</span></span>${svgUse('i-arrow', 'arrow')}</a>`;
    }).join('');
  });

  /* ---------- Folha de contatos (dialog) ---------- */
  const sheet = $('#sheet');
  let lastFocus = null;
  function abrirSheet(btn) {
    lastFocus = btn || document.activeElement;
    if (sheet.showModal) { sheet.showModal(); } else { sheet.setAttribute('open', ''); sheet.style.display = 'block'; }
    document.body.classList.add('menu-open');
    const first = $('a', sheet); if (first) first.focus();
  }
  function fecharSheet() {
    if (sheet.close) sheet.close(); else { sheet.removeAttribute('open'); sheet.style.display = ''; }
    document.body.classList.remove('menu-open');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  $$('[data-open-sheet]').forEach(b => b.addEventListener('click', () => abrirSheet(b)));
  $$('[data-close-sheet]').forEach(b => b.addEventListener('click', fecharSheet));
  sheet.addEventListener('click', (e) => { if (e.target === sheet) fecharSheet(); });
  sheet.addEventListener('close', () => { document.body.classList.remove('menu-open'); });
  sheet.addEventListener('cancel', (e) => { e.preventDefault(); fecharSheet(); });

  /* ---------- Menu mobile ---------- */
  const menu = $('#menu'); const burger = $('[data-menu-toggle]');
  function setMenu(open) {
    menu.classList.toggle('open', open); menu.setAttribute('aria-hidden', String(!open));
    burger.setAttribute('aria-expanded', String(open)); burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    document.body.classList.toggle('menu-open', open);
    $$('main, footer, .fab, .bar').forEach(el => { try { el.inert = open; } catch (e) { /* sem suporte */ } });
  }
  burger.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
  $$('a', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (menu.classList.contains('open')) setMenu(false);
    else if (sheet.hasAttribute('open') && !sheet.showModal) fecharSheet();
  });

  /* ---------- Nav: fundo ao rolar + scroll-spy (sem listener de scroll) ---------- */
  const nav = $('#nav');
  const sentinel = document.createElement('div'); sentinel.style.cssText = 'position:absolute;top:40px;height:1px;width:1px;pointer-events:none'; document.body.prepend(sentinel);
  new IntersectionObserver(([e]) => nav.classList.toggle('scrolled', !e.isIntersecting), { threshold: 0 }).observe(sentinel);
  const navLinks = $$('.nav__links a');
  const spy = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === `#${e.target.id}`));
    });
  }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });
  $$('main > section, footer').forEach(s => spy.observe(s));

  /* ---------- Tiras de revelação (geradas no load) ---------- */
  const mobile = matchMedia('(max-width: 767px)').matches;
  $$('[data-weave]').forEach(w => {
    if (reduced || modoLeve) { w.classList.add('in', 'done'); return; }
    let n = parseInt(w.dataset.weave, 10) || 3; if (n === 7 && mobile) n = 4;
    const strips = document.createElement('span'); strips.className = 'strips'; strips.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < n; i++) strips.appendChild(document.createElement('i'));
    w.appendChild(strips);
    strips.addEventListener('transitionend', () => { if (w.classList.contains('in')) w.classList.add('done'); });
  });

  /* ---------- Reveal genérico (um observer para tudo) ---------- */
  const revealIO = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const alvo = Math.min(0.3, 160 / Math.max(1, el.getBoundingClientRect().height));
      if (e.intersectionRatio < alvo) return;
      el.classList.add('in');
      if (el.hasAttribute('data-proof')) contar(el);
      if (el.hasAttribute('data-needle')) el.style.setProperty('--pos', `${el.dataset.pos || 0}%`);
      revealIO.unobserve(el);
    });
  }, { threshold: [0.02, 0.05, 0.1, 0.2, 0.3], rootMargin: '0px 0px -8% 0px' });
  $$('[data-reveal], [data-weave]:not(.hero__photo), .rope:not(.hero__materials .rope), [data-proof], [data-reviews], [data-team], [data-tour], [data-needle], .delivery-line').forEach(el => revealIO.observe(el));

  /* ---------- Veios de madeira: desenham com a visibilidade ---------- */
  const grainIO = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      const p = Math.min(1, Math.max(0, (e.intersectionRatio - 0.05) / 0.9));
      e.target.style.setProperty('--off', String(1 - (reduced ? 1 : p)));
      if (p >= 1) grainIO.unobserve(e.target);
    });
  }, { threshold: Array.from({ length: 21 }, (_, i) => i / 20), rootMargin: '0px 0px 25% 0px' });
  $$('[data-grain]').forEach(g => grainIO.observe(g));

  /* ---------- Contadores ---------- */
  function contar(root) {
    $$('[data-count]', root).forEach(el => {
      const fim = parseFloat(el.dataset.count); const dec = parseInt(el.dataset.decimals || '0', 10);
      const fmt = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec });
      if (reduced) { el.textContent = fmt.format(fim); return; }
      const t0 = performance.now(); const dur = 1200;
      const tick = (now) => {
        const t = Math.min(1, (now - t0) / dur); const ease = 1 - Math.pow(2, -10 * t);
        el.textContent = fmt.format(fim * (t >= 1 ? 1 : ease));
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }

  /* ---------- Hero: sequência única por sessão ---------- */
  const hero = $('.hero');
  const heroImg = $('.hero__photo img');
  const heroWeave = $('.hero__photo');
  function heroPronto(instant) {
    if (instant) { hero.classList.add('instant'); heroWeave.classList.add('instant', 'done'); }
    hero.classList.add('ready');
    heroWeave.classList.add('in');
    $('.hero__materials .rope').classList.add('in');
    try { sessionStorage.setItem('vimes-hero-ok', '1'); } catch (e) { /* sem storage */ }
  }
  let jaViu = false; try { jaViu = !!sessionStorage.getItem('vimes-hero-ok'); } catch (e) { /* ignore */ }
  if (jaViu || reduced || modoLeve) {
    heroPronto(true);
  } else if (mobile) {
    heroPronto(false); // texto primeiro: a foto está abaixo da dobra
  } else {
    Promise.race([heroImg.decode ? heroImg.decode().catch(() => {}) : Promise.resolve(), new Promise(r => setTimeout(r, 900))]).then(() => heroPronto(false));
  }

  /* ---------- Coleção: indicador de posição na esteira (mobile) ---------- */
  const carousel = $('[data-carousel]'); const pos = $('[data-carousel-pos]');
  if (carousel && pos) {
    const cards = $$('.card', carousel);
    const cIO = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting && e.intersectionRatio > 0.6) pos.textContent = `${String(cards.indexOf(e.target) + 1).padStart(2, '0')} / ${String(cards.length).padStart(2, '0')}`; });
    }, { root: carousel, threshold: [0.6] });
    if (mobile) { cards.forEach(c => cIO.observe(c)); pos.textContent = `01 / ${String(cards.length).padStart(2, '0')}`; } else { pos.hidden = true; }
  }

  /* ---------- Material: lupa de textura + escolha da corda ---------- */
  const materials = $('.materials');
  if (materials) {
    const panelImgs = $$('[data-panel] img'); const caption = $('[data-panel-caption]');
    const fichaIO = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const key = e.target.dataset.ficha;
        panelImgs.forEach(img => { const on = img.dataset.for === key; img.classList.toggle('active', on); img.setAttribute('aria-hidden', String(!on)); });
        if (caption) caption.textContent = e.target.dataset.caption || '';
      });
    }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
    $$('.ficha').forEach(f => fichaIO.observe(f));

    const CORES = { oliva: '#6B7A48', grafite: '#3B3D39', areia: '#CDBB97', preto: '#191A18' };
    let corEscolhida = null; try { corEscolhida = sessionStorage.getItem('vimes-corda'); } catch (e) { /* ignore */ }
    const aplicarCor = (cor) => {
      materials.style.setProperty('--trama', CORES[cor] || CORES.oliva);
      $$('.swatch').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.cor === cor)));
      // acrescenta a cor nas mensagens de orçamento das peças
      $$('#colecao a[href*="wa.me"], #ambientes a[href*="wa.me"]').forEach(a => {
        try {
          const u = new URL(a.href); let txt = u.searchParams.get('text') || '';
          txt = txt.replace(/,?\s*na cor de corda [a-zç]+\.?$/i, '').replace(/[.,]\s*$/, '');
          u.searchParams.set('text', `${txt}, na cor de corda ${cor}.`); a.href = u.toString();
        } catch (e) { /* ignore */ }
      });
    };
    if (corEscolhida && CORES[corEscolhida]) aplicarCor(corEscolhida);
    $$('.swatch').forEach(b => b.addEventListener('click', () => {
      aplicarCor(b.dataset.cor);
      try { sessionStorage.setItem('vimes-corda', b.dataset.cor); } catch (e) { /* ignore */ }
    }));

    // sombra do ombrelone: só anima com a seção em tela
    const shade = $('.materials__shade');
    if (shade && !reduced && !modoLeve && !matchMedia('(max-width: 479px)').matches) {
      new IntersectionObserver(([e]) => shade.classList.toggle('run', e.isIntersecting), { threshold: 0 }).observe(materials);
    }
  }

  /* ---------- Abas (Ambientes) ---------- */
  const tabs = $$('[role="tab"]');
  if (tabs.length) {
    const panels = tabs.map(t => document.getElementById(t.getAttribute('aria-controls')));
    const preparar = (i) => { const img = $('img', panels[i]); if (img && img.loading === 'lazy') img.loading = 'eager'; };
    const ativar = (i, focus = true) => {
      tabs.forEach((t, k) => {
        const on = k === i; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; panels[k].hidden = !on;
        if (on) {
          panels[k].classList.remove('in'); void panels[k].offsetWidth; panels[k].classList.add('in');
          const w = $('[data-weave]', panels[k]); const img = w && $('img', w);
          if (w && !w.classList.contains('in')) {
            preparar(k);
            const pronto = img && img.decode ? img.decode().catch(() => {}) : Promise.resolve();
            Promise.race([pronto, new Promise(r => setTimeout(r, 600))]).then(() => w.classList.add('in'));
          }
        }
      });
      if (focus) tabs[i].focus();
    };
    tabs.forEach((t, i) => {
      t.addEventListener('pointerenter', () => preparar(i)); t.addEventListener('focus', () => preparar(i));
      t.addEventListener('click', () => ativar(i, false));
      t.addEventListener('keydown', (e) => {
        const map = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 };
        if (e.key in map) { e.preventDefault(); ativar((map[e.key] + tabs.length) % tabs.length); }
      });
    });
  }

  /* ---------- Tour 360° (carrega só por intenção) ---------- */
  const tour = $('[data-tour]');
  function carregarTour() {
    if (!tour || tour.classList.contains('loaded') || tour.classList.contains('loading')) return;
    tour.classList.add('loading');
    const iframe = document.createElement('iframe');
    iframe.src = 'https://vimesjoinville.zenno.com.br/';
    iframe.title = 'Tour virtual 360° do showroom da Vimes Joinville';
    iframe.loading = 'lazy'; iframe.allow = 'fullscreen; xr-spatial-tracking'; iframe.setAttribute('allowfullscreen', '');
    iframe.referrerPolicy = 'no-referrer-when-downgrade';
    const timer = setTimeout(() => { const fb = $('[data-tour-fallback]'); if (fb) fb.hidden = false; }, 8000);
    iframe.addEventListener('load', () => { clearTimeout(timer); tour.classList.add('loaded'); tour.classList.remove('loading'); const full = $('[data-tour-full]'); if (full) full.hidden = false; });
    tour.appendChild(iframe);
  }
  const tourBtn = $('[data-tour-btn]'); if (tourBtn) tourBtn.addEventListener('click', carregarTour);
  $$('[data-open-tour]').forEach(a => a.addEventListener('click', (e) => {
    e.preventDefault();
    $('#showroom').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    setTimeout(carregarTour, reduced ? 0 : 500);
  }));
  const fullBtn = $('[data-tour-full]');
  if (fullBtn) fullBtn.addEventListener('click', () => { const el = tour; (el.requestFullscreen || el.webkitRequestFullscreen || function () {}).call(el); });

  /* ---------- Mapa (embed só por intenção) ---------- */
  const mapBtn = $('[data-map-btn]');
  if (mapBtn) mapBtn.addEventListener('click', () => {
    const wrap = $('[data-map]');
    const f = document.createElement('iframe');
    f.src = 'https://www.google.com/maps?q=-26.2952992,-48.8682947&z=16&output=embed&hl=pt-BR';
    f.title = 'Mapa: Vimes Joinville, Rua Presidente Campos Salles, 75, Joinville'; f.loading = 'lazy'; f.referrerPolicy = 'no-referrer-when-downgrade';
    wrap.replaceChildren(f);
  });

  /* ---------- Copiar número ---------- */
  const toast = $('[data-toast]'); let toastTimer;
  function avisar(msg) { if (!toast) return; toast.textContent = msg; toast.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 1600); }
  $$('[data-copy]').forEach(b => b.addEventListener('click', async () => {
    const txt = b.dataset.copy;
    try { await navigator.clipboard.writeText(txt); }
    catch (e) { const i = document.createElement('input'); i.value = txt; document.body.appendChild(i); i.select(); try { document.execCommand('copy'); } catch (err) { /* ignore */ } i.remove(); }
    b.classList.add('copied'); setTimeout(() => b.classList.remove('copied'), 1500); avisar('Número copiado');
  }));

  /* ---------- Barra inferior / FAB: somem onde já há CTA; theme-color no rodapé ---------- */
  const bar = $('[data-bar]'); const fab = $('.fab'); const theme = $('meta[name="theme-color"]');
  const hideIO = new IntersectionObserver((entries) => {
    const visible = entries.some(e => e.isIntersecting && e.intersectionRatio > 0.15);
    const anyVisible = $$('#consultores, #contato').some(el => { const r = el.getBoundingClientRect(); return r.top < innerHeight * 0.85 && r.bottom > innerHeight * 0.15; });
    const hide = visible || anyVisible;
    if (bar) bar.classList.toggle('hide', hide);
    if (fab) fab.classList.toggle('hide', hide);
    if (theme) { const foot = $('#contato').getBoundingClientRect(); theme.content = foot.top < innerHeight * 0.5 ? '#191A18' : '#F4EEE3'; }
  }, { threshold: [0, 0.15, 0.5, 1] });
  $$('#consultores, #contato').forEach(el => hideIO.observe(el));

  /* ---------- Links internos: fecham menu e respeitam reduced-motion ---------- */
  if (reduced) html.style.scrollBehavior = 'auto';
})();
