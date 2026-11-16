// Writes docs/coverage-matrix.md from src/app/coverage.ts (single source of truth).
import { createRequire } from 'node:module'; import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath, pathToFileURL } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const esbuild = createRequire((process.env.GLOBAL_MODULES || '/opt/npm-tools/node_modules') + '/')('esbuild');
const out = path.join(root, 'tools/.coverage.mjs');
await esbuild.build({ entryPoints: [path.join(root, 'src/app/coverage.ts')], outfile: out, format: 'esm', bundle: true, logLevel: 'error' });
const { REFERENCE_VIEWS, STATE_LINKS } = await import(pathToFileURL(out).href); fs.rmSync(out);
const areas = { A: 'A. Discovery and first lesson', B: 'B. Account, payments and support', C: 'C. Learning, assessments and certificates', D: 'D. Instructor workspace', E: 'E. Administration' };
let md = `# Coverage matrix\n\nAll 60 reference views from the design-system brief, where each is implemented, and how to inspect its alternative states. Generated from \`src/app/coverage.ts\` (also rendered in the app at \`#/coverage\`).\n\n- **One responsive app.** Every view is a single responsive implementation, checked at 320, 390, 768, 1024 and 1440 px.\n- **No duplicate routes.** Views share routes where the task does (for example, payment failure is a state of the payment status route). Alternative states use \`?demo=<state>\` or the demo data itself.\n- **Personas.** Learner routes need a learner persona, \`/teach\` needs Tunde Bakare and \`/admin\` needs Grace Eze. Switch persona in the Demo bar.\n\n`;
for (const [k, t] of Object.entries(areas)) {
  md += `## ${t}\n\n| # | Reference view | Route | Implemented as | State variants |\n|---|---|---|---|---|\n`;
  for (const v of REFERENCE_VIEWS.filter((x) => x.area === k)) md += `| ${v.n} | ${v.name} | \`#${v.route}\` | ${v.how} | ${v.states.join(' · ') || '—'} |\n`;
  md += '\n';
}
md += `## Quick links to alternative states\n\nThese are also available in the app under **Demo bar → States & journeys**.\n\n`;
for (const g of STATE_LINKS) md += `**${g.group}**\n\n` + g.links.map(([l, to, p]) => `- ${l}: \`#${to}\`${p !== undefined ? ` (as ${p || 'visitor'})` : ''}`).join('\n') + '\n\n';
md += `## Supporting pages (not counted as reference views)\n\n- **Component showcase:** \`#/showcase\`\n- **Coverage matrix:** \`#/coverage\`\n- **Not found / restricted access:** shared system states\n`;
fs.mkdirSync(path.join(root, 'docs'), { recursive: true }); fs.writeFileSync(path.join(root, 'docs/coverage-matrix.md'), md);
console.log('wrote docs/coverage-matrix.md', REFERENCE_VIEWS.length, 'views');
