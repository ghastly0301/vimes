// Gera uma variante do index.html para a prévia hospedada (claude.ai Artifact):
// CSS/JS inline, sem wrapper <html>/<head>/<body>, sem iframes (tour e mapa viram links).
// Uso: node tools/build-artifact.js <outDir>
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const OUT = path.resolve(process.argv[2] || path.join(ROOT, 'tools', 'artifact'));

let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(ROOT, 'assets/css/style.css'), 'utf8');
const js = fs.readFileSync(path.join(ROOT, 'assets/js/main.js'), 'utf8');

// corpo: tudo entre <body> e </body>
const body = html.slice(html.indexOf('<body>') + 6, html.lastIndexOf('</body>'));
// head: manter apenas fontes + json-ld
const head = html.slice(html.indexOf('<head>') + 6, html.indexOf('</head>'));
const fonts = (head.match(/<link[^>]+fonts\.googleapis[^>]*>/g) || []).join('\n');
const preconnect = (head.match(/<link rel="preconnect"[^>]*>/g) || []).join('\n');
const jsonld = (head.match(/<script type="application\/ld\+json">[\s\S]*?<\/script>/) || [''])[0];
const description = (head.match(/<meta name="description" content="([^"]*)"/) || ['', ''])[1];

let out = `<title>Vimes Joinville</title>
<meta name="description" content="${description}">
<meta name="color-scheme" content="light">
${preconnect}
${fonts}
<link rel="icon" href="assets/favicon.svg" type="image/svg+xml">
<style>
${css}
/* Ajustes da prévia hospedada */
.sheet { color: var(--oliva-900); }
</style>
${jsonld}
${body
  // tour: sem iframe no viewer -> link direto em nova aba
  .replace(/<button class="tour__btn" type="button" data-tour-btn aria-label="Entrar no tour virtual 360° do showroom">/, '<a class="tour__btn" href="https://vimesjoinville.zenno.com.br/" target="_blank" rel="noopener" aria-label="Entrar no tour virtual 360° do showroom (abre em nova aba)">')
  .replace(/<\/button>\s*<p class="tour__fallback"/, '</a>\n          <p class="tour__fallback"')
  .replace(/<a class="btn btn--ghost" href="#showroom" data-open-tour>/, '<a class="btn btn--ghost" href="https://vimesjoinville.zenno.com.br/" target="_blank" rel="noopener">')
  // mapa: link em vez de embed
  .replace(/<button class="btn btn--ghost btn--sm map__btn" type="button" data-map-btn>Ver o mapa aqui<\/button>/, '<a class="btn btn--ghost btn--sm map__btn" href="https://www.google.com/maps/place/?q=place_id:ChIJkyqeoRCv3pQRsYu0J8dUDiA" target="_blank" rel="noopener">Ver o mapa no Google Maps</a>')
  .replace(/<script src="assets\/js\/main\.js" defer><\/script>/, '')}
<script>
${js}
</script>
`;
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'index.html'), out);
console.log('artifact index.html', (Buffer.byteLength(out) / 1024).toFixed(0), 'KB ->', OUT);
