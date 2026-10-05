// QA do site: screenshots em 3 viewports + verificações automáticas.
// Uso: NODE_PATH=/Users/jester/121-portal/node_modules node tools/qa.js [outDir]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const http = require('http');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.resolve(process.argv[2] || path.join(ROOT, 'tools', 'qa-out'));
const PORT = 4173 + Math.floor(Math.random() * 500);
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.json': 'application/json', '.txt': 'text/plain', '.xml': 'application/xml', '.webmanifest': 'application/manifest+json', '.woff2': 'font/woff2' };

function serve() {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      let p = decodeURIComponent(req.url.split('?')[0]);
      if (p === '/') p = '/index.html';
      const f = path.join(ROOT, p);
      if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('404'); }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
      fs.createReadStream(f).pipe(res);
    });
    srv.listen(PORT, () => resolve(srv));
  });
}

const VIEWPORTS = [
  { name: 'mobile-390', width: 390, height: 844, mobile: true },
  { name: 'tablet-820', width: 820, height: 1180, mobile: true },
  { name: 'desktop-1440', width: 1440, height: 900, mobile: false },
];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const srv = await serve();
  const browser = await chromium.launch();
  const report = { url: `http://localhost:${PORT}/`, viewports: {} };
  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: vp.mobile, hasTouch: vp.mobile, deviceScaleFactor: 1, locale: 'pt-BR', timezoneId: 'America/Sao_Paulo' });
    const page = await ctx.newPage();
    const errors = []; const failed = [];
    page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`${m.type()}: ${m.text()}`); });
    page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
    page.on('requestfailed', r => failed.push(`${r.url()} ${r.failure()?.errorText}`));
    page.on('response', r => { if (r.status() >= 400 && !/fonts\.g/.test(r.url())) failed.push(`${r.status()} ${r.url()}`); });
    await page.goto(report.url, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(1500);
    // viewport screenshot (above the fold)
    await page.screenshot({ path: path.join(OUT, `${vp.name}-fold.png`) });
    // scroll through to trigger reveals, then full page
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < h; y += Math.round(vp.height * 0.7)) { await page.evaluate(yy => window.scrollTo(0, yy), y); await page.waitForTimeout(220); }
    await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(OUT, `${vp.name}-full.png`), fullPage: true });
    const checks = await page.evaluate(() => {
      const de = document.documentElement;
      const overflowX = de.scrollWidth > de.clientWidth + 1;
      const wide = [];
      if (overflowX) {
        for (const el of document.querySelectorAll('body *')) {
          const r = el.getBoundingClientRect();
          if (r.right > de.clientWidth + 1 && r.width > 0) { wide.push(`${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${el.className && typeof el.className === 'string' ? '.' + el.className.split(' ').filter(Boolean).slice(0, 2).join('.') : ''} right=${Math.round(r.right)}`); if (wide.length > 12) break; }
        }
      }
      const imgs = Array.from(document.images);
      const broken = imgs.filter(i => i.complete && i.naturalWidth === 0 && !i.loading).map(i => i.currentSrc || i.src);
      const noAlt = imgs.filter(i => !i.hasAttribute('alt')).map(i => i.currentSrc || i.src);
      const wa = Array.from(document.querySelectorAll('a[href*="wa.me"], a[href*="whatsapp"]')).map(a => a.href.replace(/\?.*$/, ''));
      const uniqueWa = [...new Set(wa)];
      const links = Array.from(document.querySelectorAll('a[href]')).map(a => a.getAttribute('href'));
      const anchors = links.filter(l => l.startsWith('#') && l.length > 1).filter(l => !document.querySelector(l)).map(l => l);
      const h1 = document.querySelectorAll('h1').length;
      const title = document.title; const desc = document.querySelector('meta[name="description"]')?.content || '';
      const lang = de.lang; const viewport = document.querySelector('meta[name="viewport"]')?.content || '';
      const smallTargets = Array.from(document.querySelectorAll('a,button')).filter(el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && (r.width < 40 || r.height < 40) && getComputedStyle(el).visibility !== 'hidden'; }).map(el => `${el.tagName.toLowerCase()} "${(el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 30)}" ${Math.round(el.getBoundingClientRect().width)}x${Math.round(el.getBoundingClientRect().height)}`).slice(0, 15);
      const noLabel = Array.from(document.querySelectorAll('a,button')).filter(el => !(el.textContent || '').trim() && !el.getAttribute('aria-label') && !el.querySelector('img[alt]')).length;
      return { overflowX, wide, broken, noAlt, uniqueWa, brokenAnchors: anchors, h1, title, desc, lang, viewport, smallTargets, noLabel, scrollHeight: de.scrollHeight };
    });
    report.viewports[vp.name] = { ...checks, consoleIssues: errors, failedRequests: failed };
    await ctx.close();
  }
  // reduced motion sanity: page renders content without animation
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce', locale: 'pt-BR' });
  const page = await ctx.newPage();
  await page.goto(report.url, { waitUntil: 'networkidle' }); await page.waitForTimeout(800);
  report.reducedMotion = await page.evaluate(() => {
    const hidden = Array.from(document.querySelectorAll('section *')).filter(el => { const cs = getComputedStyle(el); return (cs.opacity === '0' || cs.visibility === 'hidden') && el.getBoundingClientRect().height > 0 && el.closest('section'); });
    return { invisibleElements: hidden.length, sample: hidden.slice(0, 8).map(el => el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.split(' ').slice(0, 2).join('.') : '')) };
  });
  await page.screenshot({ path: path.join(OUT, 'reduced-motion-fold.png') });
  await ctx.close();
  await browser.close(); srv.close();
  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
})();
