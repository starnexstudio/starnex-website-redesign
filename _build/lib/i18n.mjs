// Locale setup and translation lookup for the StarNex build.
// Albanian is the default and lives at the site root; English and German live under /en/ and /de/.

export const LOCALES = [
  { code: 'sq', prefix: '', htmlLang: 'sq', og: 'sq_AL', intl: 'sq-AL', short: 'SQ', label: 'Shqip' },
  { code: 'en', prefix: 'en/', htmlLang: 'en', og: 'en_GB', intl: 'en-GB', short: 'EN', label: 'English' },
  { code: 'de', prefix: 'de/', htmlLang: 'de', og: 'de_DE', intl: 'de-DE', short: 'DE', label: 'Deutsch' },
];
export const DEFAULT_LOCALE = 'sq';
export const CONTENT_FILES = ['site', 'home', 'services', 'projects', 'posts', 'legal'];

/** Loads every content module for one locale. */
export async function loadContent(code) {
  const out = {};
  for (const f of CONTENT_FILES) out[f] = (await import(new URL(`../content/${code}/${f}.mjs`, import.meta.url))).default;
  return out;
}

/**
 * Translator for one locale. In strict mode (the default build) a missing key stops the build;
 * with --dev it renders a visible ⟦missing:key⟧ marker instead, so gaps show on the page.
 */
export function translator(loc, dict, { strict = true, onMissing = () => {} } = {}) {
  const plural = new Intl.PluralRules(loc.intl);
  const missing = key => {
    onMissing(loc.code, key);
    if (strict) throw new Error(`[i18n] missing "${key}" in ${loc.code}`);
    return `⟦missing:${loc.code}:${key}⟧`;
  };
  // t('nav.home') reads content/<locale>/site.mjs; t.entry('services', slug) reads the other content files
  const get = key => key.split('.').reduce((o, k) => (o == null ? undefined : o[k]), dict.site);
  const fill = (s, vars) => s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
  const t = (key, vars = {}) => {
    let v = get(key);
    if (v && typeof v === 'object' && !Array.isArray(v) && 'other' in v) v = v[plural.select(vars.n ?? 0)] ?? v.other;
    if (v == null || v === '') return missing(key);
    return typeof v === 'string' ? fill(v, vars) : v;
  };
  /** Content entry (service, project, post) for a slug; same missing-key behaviour as t(). */
  t.entry = (group, slug) => dict[group]?.[slug] ?? (missing(`${group}.${slug}`), null);
  t.date = iso => new Date(iso + 'T12:00:00Z').toLocaleDateString(loc.intl, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  return t;
}

/** Site-relative URL of a page in a locale. page '' is the locale's homepage. */
export const pathFor = (loc, page) => '/' + loc.prefix + page;
