# Vimes Joinville — site institucional

Site one-page em HTML/CSS/JS puro (sem build, sem dependências). Basta hospedar a pasta em qualquer servidor estático (Hostinger, Vercel, Netlify, Cloudflare Pages, cPanel…) com `index.html` na raiz.

## Estrutura

```
index.html              página única (todas as seções, JSON-LD, meta tags)
assets/css/style.css    estilos (tokens de cor/tipografia no topo)
assets/js/main.js       comportamento (status da loja, revelações, abas, folha de contatos, tour)
assets/img/webp/        fotos otimizadas em 3 tamanhos (-sm 640 / -md 1000 / -lg até 1600)
assets/img/*.jpg        originais tratados (não referenciados pela página; podem ser removidos do deploy)
assets/vimes-mark.svg   monograma V (vetor recriado a partir do logo)
assets/vimes-logo.svg   logo completo (monograma + lettering em paths)
assets/og-image.jpg     imagem de compartilhamento (WhatsApp, Instagram, Facebook)
site.webmanifest, robots.txt, sitemap.xml
tools/                  scripts de QA (não precisam ir para o servidor)
```

## Antes de publicar

- **Domínio**: `index.html`, `robots.txt` e `sitemap.xml` apontam para `https://vimesjoinville.com.br/`. Se o domínio for outro, troque nas tags `canonical`, `og:url`, `og:image` e no JSON-LD.
- **Número da Elaine**: o Linktree registra `(47) 8813-3937` (sem o 9º dígito). Confirmar com a loja. Para trocar, edite os `data-tel`, `data-tel-raw`, `data-wa` e os links `wa.me` do card da Elaine em `index.html` (seção Consultores) e no rodapé.
- **Tour 360°**: carrega o endereço `https://vimesjoinville.zenno.com.br/` em iframe, só quando o visitante clica. Se a Zenno bloquear iframes no futuro, o site mostra o link "Abrir em nova aba" automaticamente após 8 s.

## O que revisar periodicamente

- Seguidores no Instagram (99,4 mil), avaliações no Google (72, nota 4,9), recomendação no Facebook (100% · 11): aparecem em `index.html` (seção Quem somos / Depoimentos / rodapé) e no kicker dos depoimentos.
- Feiras: a faixa "Onde estivemos" cita a Feira Casa & Construção 2026 (Expoville).
- Horários: a lógica de "Aberto agora" está em `assets/js/main.js` (`HORARIOS`) e a tabela em `index.html` (seção Showroom). Os dois precisam mudar juntos.
- Condições comerciais (18x na loja, 12x via link, Fecha Mês): seções Quem somos, Como comprar e FAQ (+ JSON-LD da FAQ).

## Trocar fotos

Coloque o JPEG em `assets/img/` e gere os WebP com `tools/` (ou qualquer conversor) nos três tamanhos, mantendo o padrão `nome-sm.webp`, `nome-md.webp`, `nome-lg.webp`. Atualize `src`, `srcset`, `width`, `height` e o `alt` da `<img>` correspondente. Os cards 03 (Chaise orbital) e 04 (Balanço) da Coleção usam cartões de textura por falta de foto limpa — trocar quando a loja enviar.

## QA

Com Playwright instalado (`NODE_PATH` apontando para um `node_modules` que tenha `playwright`):

```
node tools/qa.js tools/qa-out        # 3 viewports: overflow, imagens, links, console, reduced-motion
node tools/shots.js tools/shots both # screenshots por seção (desktop e mobile)
node tools/og-image.js               # regenera assets/og-image.jpg
```
