// Gera assets/og-image.jpg (1200x630) a partir de um template HTML com a identidade do site.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const logo = fs.readFileSync(path.join(ROOT, 'assets/vimes-logo.svg'), 'utf8');
const photo = 'data:image/webp;base64,' + fs.readFileSync(path.join(ROOT, 'assets/img/webp/showroom-mesa-redonda-md.webp')).toString('base64');
const html = `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;1,9..144,500&family=Manrope:wght@500;600&display=swap" rel="stylesheet">
<style>
body{margin:0;width:1200px;height:630px;background:#F4EEE3;font-family:Manrope,sans-serif;color:#2C3320;position:relative;overflow:hidden}
.bg{position:absolute;inset:0;background-image:repeating-linear-gradient(45deg, rgba(44,51,32,.04) 0 1px, transparent 1px 8px),repeating-linear-gradient(-45deg, rgba(44,51,32,.03) 0 1px, transparent 1px 8px)}
.photo{position:absolute;right:0;top:0;width:520px;height:630px;object-fit:cover;object-position:50% 55%}
.strip{position:absolute;right:500px;top:-80px;width:120px;height:800px;background:#F4EEE3;transform:skewX(-30deg)}
.copy{position:absolute;left:72px;top:72px;width:560px}
.logo{width:230px;color:#191A18}
.k{margin-top:46px;font-size:15px;letter-spacing:.2em;text-transform:uppercase;color:#95602C;font-weight:600}
h1{font-family:Fraunces,serif;font-weight:500;font-size:66px;line-height:1;margin:14px 0 20px;letter-spacing:-.01em}
h1 em{font-style:italic;color:#95602C}
p{font-size:21px;line-height:1.45;margin:0;color:#3B3D39;max-width:520px}
.rope{position:absolute;left:72px;bottom:60px;width:560px;height:30px}
.tags{position:absolute;left:72px;bottom:28px;font-size:13px;letter-spacing:.16em;text-transform:uppercase;color:#3B3D39;font-weight:600}
</style></head><body>
<div class="bg"></div>
<img class="photo" src="${photo}">
<div class="strip"></div>
<div class="copy">
  <div class="logo">${logo.replace('<svg ', '<svg style="width:230px;height:auto" ')}</div>
  <div class="k">Móveis de área externa · Joinville, SC</div>
  <h1>A trama certa para <em>viver lá fora.</em></h1>
  <p>Corda náutica, alumínio e madeira. Mais de 20 anos de experiência na fabricação, showroom em Joinville e até 18x sem juros na loja.</p>
</div>
<svg class="rope" viewBox="0 0 560 30" preserveAspectRatio="none"><path d="M0 15 C 100 5, 180 25, 280 15 S 460 5, 560 15" fill="none" stroke="#4A5531" stroke-width="4" stroke-linecap="round"/><path d="M0 15 C 100 5, 180 25, 280 15 S 460 5, 560 15" fill="none" stroke="#CDBB97" stroke-width="1.8" stroke-dasharray="5 6"/></svg>
<div class="tags">Corda náutica · Alumínio · Teca e jatobá · Tecido náutico</div>
</body></html>`;
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
  await p.setContent(html, { waitUntil: 'networkidle' }); await p.waitForTimeout(1500);
  await p.screenshot({ path: path.join(ROOT, 'assets/og-image.jpg'), type: 'jpeg', quality: 86 });
  await b.close(); console.log('og-image.jpg ok');
})();
