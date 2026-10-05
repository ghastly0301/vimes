// Screenshots por seção (viewport real, após rolagem) em desktop e mobile.
// Uso: NODE_PATH=... node tools/shots.js [outDir] [desktop|mobile|both]
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const http = require('http');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.resolve(process.argv[2] || path.join(ROOT, 'tools', 'shots'));
const MODE = process.argv[3] || 'both';
const PORT = 4300 + Math.floor(Math.random() * 400);
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.json': 'application/json', '.webmanifest': 'application/manifest+json' };
const SECTIONS = ['inicio', 'quem-somos', 'colecao', 'material', 'ambientes', 'entregas', 'depoimentos', 'consultores', 'showroom', 'como-comprar', 'contato'];

function serve() {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
      const f = path.join(ROOT, p);
      if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('404'); }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
    });
    srv.listen(PORT, () => resolve(srv));
  });
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const srv = await serve(); const browser = await chromium.launch();
  const vps = [];
  if (MODE !== 'mobile') vps.push({ name: 'desk', width: 1440, height: 900, mobile: false });
  if (MODE !== 'desktop') vps.push({ name: 'mob', width: 390, height: 844, mobile: true });
  for (const vp of vps) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: vp.mobile, hasTouch: vp.mobile, locale: 'pt-BR', timezoneId: 'America/Sao_Paulo' });
    const page = await ctx.newPage();
    await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2600);
    await page.screenshot({ path: path.join(OUT, `${vp.name}-00-hero.png`) });
    let i = 1;
    for (const id of SECTIONS) {
      await page.evaluate((id) => { const el = document.getElementById(id); el.scrollIntoView({ behavior: 'auto', block: 'start' }); }, id);
      await page.waitForTimeout(1500);
      await page.screenshot({ path: path.join(OUT, `${vp.name}-${String(i).padStart(2, '0')}-${id}.png`) });
      // second shot further down for long sections
      await page.evaluate((h) => window.scrollBy(0, h * 0.9), vp.height);
      await page.waitForTimeout(900);
      await page.screenshot({ path: path.join(OUT, `${vp.name}-${String(i).padStart(2, '0')}-${id}-b.png`) });
      i++;
    }
    // sheet open
    await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(400);
    await page.click('[data-open-sheet]:not(.fab)', { force: true }).catch(() => {});
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(OUT, `${vp.name}-99-sheet.png`) });
    await page.keyboard.press('Escape');
    if (vp.mobile) { await page.click('[data-menu-toggle]').catch(() => {}); await page.waitForTimeout(500); await page.screenshot({ path: path.join(OUT, `${vp.name}-98-menu.png`) }); }
    await ctx.close();
  }
  await browser.close(); srv.close();
  console.log('shots in', OUT);
})();
