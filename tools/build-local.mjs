// LOCAL VERIFICATION BUILD (sandbox without npm access). Production build is `npm run build` (Vite).
// Bundles src/ with esbuild from the machine's global modules and aliases react-router-dom to tools/shims.
import { createRequire } from 'node:module';
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const GLOBAL = process.env.GLOBAL_MODULES || '/opt/npm-tools/node_modules';
const require = createRequire(GLOBAL + '/');
const esbuild = require('esbuild');
const out = path.join(root, 'dist-local');
fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out + '/assets', { recursive: true });
await esbuild.build({
  entryPoints: [path.join(root, 'src/main.tsx')], bundle: true, outdir: out + '/assets', entryNames: 'app',
  format: 'iife', jsx: 'automatic', minify: true, sourcemap: false, target: 'es2020',
  nodePaths: [GLOBAL], alias: { 'react-router-dom': path.join(root, 'tools/shims/react-router-dom.tsx') },
  define: { 'process.env.NODE_ENV': '"production"', 'import.meta.env.DEV': 'false' }, logLevel: 'warning',
});
let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8')
  .replace('<script type="module" src="/src/main.tsx"></script>', '<script defer src="./assets/app.js"></script>')
  .replace('</head>', '    <link rel="stylesheet" href="./assets/app.css" />\n  </head>');
fs.writeFileSync(path.join(out, 'index.html'), html);
console.log('built', fs.readdirSync(out + '/assets').map(f => f + ' ' + Math.round(fs.statSync(out + '/assets/' + f).size / 1024) + 'KB').join(', '));
