import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Collapse the Vite build into ONE self-contained HTML file.
 *
 * Two reasons this exists: it can be emailed or opened straight off a laptop
 * with no server, and it is what gets published as a shareable artifact (whose
 * CSP blocks every external host, so nothing may be referenced by URL).
 */

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const DIST = path.join(root, 'dist');
const OUT = path.join(root, 'university-ip-prototype.html');

if (!fs.existsSync(DIST)) {
  console.error('No dist/ — run `npm run build` first.');
  process.exit(1);
}

const assets = fs.readdirSync(path.join(DIST, 'assets'));
const cssFile = assets.find((f) => f.endsWith('.css'));
const jsFile = assets.find((f) => f.endsWith('.js'));

if (!cssFile || !jsFile) {
  console.error('Expected exactly one CSS and one JS asset in dist/assets.');
  process.exit(1);
}

const css = fs.readFileSync(path.join(DIST, 'assets', cssFile), 'utf8');
const js = fs.readFileSync(path.join(DIST, 'assets', jsFile), 'utf8');

// A module script only terminates on `</script`; if a future dependency ever
// embeds one, fail loudly rather than emit a silently broken page.
if (/<\/script/i.test(js) || /<\/style/i.test(css)) {
  console.error('Bundle contains a terminator sequence — inlining would break the page.');
  process.exit(1);
}

// No <!doctype>/<html>/<head>/<body>: the artifact pipeline supplies those, and
// a browser opening this file directly will imply them anyway.
const html = `<title>University IP — Wildfire Labs prototype</title>

<style>
${css}
</style>

<style>
  /* The prototype mirrors the Wildfire app, which ships light-mode only (its
     .dark block exists but is never toggled). Committing to light keeps these
     screens a 1:1 reference for whoever ports them, so pin the ground instead
     of inheriting the viewer's theme. */
  :root { color-scheme: light; }
  html, body {
    margin: 0;
    padding: 0;
    max-width: none;
    background: #f9fafb;
    color: #0f172a;
  }
  #root { min-height: 100vh; }
</style>

<div id="root"></div>

<script type="module">
${js}
</script>
`;

fs.writeFileSync(OUT, html, 'utf8');
console.log(`Wrote ${path.relative(root, OUT)} — ${(html.length / 1024).toFixed(0)} KB, fully self-contained.`);
