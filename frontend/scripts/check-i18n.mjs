#!/usr/bin/env node
/**
 * Çeviri kataloglarını doğrular:
 *   1. Dört dilin anahtar kümeleri birebir aynı mı?
 *   2. Boş ya da hâlâ İngilizce/kaynak dilde bırakılmış değer var mı?
 *   3. ICU değişkenleri ({name}, {count}) diller arasında tutarlı mı?
 *
 * Kullanım: node scripts/check-i18n.mjs   (hata varsa çıkış kodu 1)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'messages');
const LOCALES = ['tr', 'de', 'en', 'ar'];
const BASE = 'en';

const flatten = (obj, prefix = [], out = {}) => {
  for (const [k, v] of Object.entries(obj)) {
    const p = [...prefix, k];
    if (v && typeof v === 'object') flatten(v, p, out);
    else out[p.join('.')] = v;
  }
  return out;
};

const cat = Object.fromEntries(
  LOCALES.map((l) => [l, flatten(JSON.parse(fs.readFileSync(path.join(dir, `${l}.json`), 'utf8')))])
);

const errors = [];
const warnings = [];
const baseKeys = Object.keys(cat[BASE]);

for (const locale of LOCALES) {
  const keys = new Set(Object.keys(cat[locale]));
  for (const k of baseKeys) if (!keys.has(k)) errors.push(`[${locale}] eksik anahtar: ${k}`);
  for (const k of keys) if (!(k in cat[BASE])) errors.push(`[${locale}] fazla anahtar: ${k}`);

  for (const [k, v] of Object.entries(cat[locale])) {
    if (typeof v !== 'string') { errors.push(`[${locale}] dizge değil: ${k}`); continue; }
    if (!v.trim()) errors.push(`[${locale}] boş değer: ${k}`);
  }
}

// ICU değişken tutarlılığı — yalnızca en dış seviyedeki argümanlar karşılaştırılır
// ({count, plural, one {watch} other {watches}} içindeki dal adları dile göre değişir).
const vars = (str) => {
  const found = new Set();
  let depth = 0;
  const s = String(str);
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '{') {
      if (depth === 0) {
        const m = /^\{\s*(\w+)/.exec(s.slice(i));
        if (m) found.add(m[1]);
      }
      depth++;
    } else if (s[i] === '}') {
      depth = Math.max(0, depth - 1);
    }
  }
  return [...found].sort().join(',');
};
for (const k of baseKeys) {
  const expected = vars(cat[BASE][k]);
  for (const locale of LOCALES) {
    if (locale === BASE || cat[locale][k] === undefined) continue;
    const got = vars(cat[locale][k]);
    if (got !== expected) errors.push(`[${locale}] değişken uyuşmazlığı ${k}: "${expected}" ≠ "${got}"`);
  }
}

// Çevrilmemiş kalmış olabilecek değerler (İngilizce ile birebir aynı)
for (const locale of LOCALES) {
  if (locale === BASE) continue;
  let same = 0;
  for (const k of baseKeys) {
    const a = cat[BASE][k], b = cat[locale][k];
    if (typeof a === 'string' && a === b && /[A-Za-z]{4}/.test(a) && !/^[A-Z0-9 ._·|@-]+$/.test(a)) {
      same++;
      if (same <= 15) warnings.push(`[${locale}] İngilizce ile aynı: ${k} = "${a}"`);
    }
  }
  if (same > 15) warnings.push(`[${locale}] … toplam ${same} anahtar İngilizce ile aynı`);
}

console.log(`Diller: ${LOCALES.join(', ')} — ${baseKeys.length} anahtar/dil`);
if (warnings.length) { console.log('\nUYARILAR:'); warnings.forEach((w) => console.log('  ' + w)); }
if (errors.length) {
  console.error(`\nHATALAR (${errors.length}):`);
  errors.slice(0, 60).forEach((e) => console.error('  ' + e));
  process.exit(1);
}
console.log('\n✓ Tüm kataloglar tutarlı.');
