// WCAG 2.x contrast ratios for the token pairs actually used in the UI.
const hex = h => h.replace('#', '').match(/../g).map(x => parseInt(x, 16) / 255).map(c => c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const L = h => { const [r, g, b] = hex(h); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const ratio = (a, b) => { const [x, y] = [L(a), L(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
const pairs = [
 ['Primary text on page bg', '#0F172A', '#F8FAFC', 4.5], ['Secondary text on surface', '#475569', '#FFFFFF', 4.5], ['Secondary text on subtle surface', '#475569', '#F1F5F9', 4.5],
 ['Muted text on surface', '#5E6D83', '#FFFFFF', 4.5], ['Muted text on page bg', '#5E6D83', '#F8FAFC', 4.5], ['Muted text on subtle surface (adjusted token)', '#5E6D83', '#F1F5F9', 4.5],
 ['White on primary button', '#FFFFFF', '#1D4ED8', 4.5], ['White on primary hover', '#FFFFFF', '#1E40AF', 4.5], ['Primary link on surface', '#1D4ED8', '#FFFFFF', 4.5], ['Primary on primary-subtle', '#1D4ED8', '#EFF6FF', 4.5],
 ['Accent on surface', '#0F766E', '#FFFFFF', 4.5], ['Accent on accent-subtle', '#0F766E', '#F0FDFA', 4.5], ['White on accent', '#FFFFFF', '#0F766E', 4.5],
 ['Success on success-subtle', '#166534', '#F0FDF4', 4.5], ['Warning on warning-subtle', '#92400E', '#FFFBEB', 4.5], ['Error on error-subtle', '#B91C1C', '#FEF2F2', 4.5], ['Error on surface', '#B91C1C', '#FFFFFF', 4.5], ['Info on info-subtle', '#1E40AF', '#EFF6FF', 4.5],
 ['Control border vs surface (non-text)', '#64748B', '#FFFFFF', 3], ['Focus ring vs surface (non-text)', '#2563EB', '#FFFFFF', 3], ['Focus ring vs white offset gap around any control (non-text)', '#2563EB', '#FFFFFF', 3],
 ['Subtle border vs surface (decorative)', '#E2E8F0', '#FFFFFF', 0], ['Accent progress fill vs track (non-text)', '#0F766E', '#E2E8F0', 3],
];
let fails = 0;
for (const [n, f, b, min] of pairs) { const r = ratio(f, b); const ok = r >= min; if (!ok) fails++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${r.toFixed(2)}:1  (min ${min})  ${n}  ${f} on ${b}`); }
console.log(fails ? fails + ' failing pair(s)' : 'all pairs pass');
