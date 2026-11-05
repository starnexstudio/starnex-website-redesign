// Writes plain objects as readable ES modules (used once to move the English copy out of the code).
const str = s => (s.includes('\n') ? '`' + s.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${') + '`' : `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`);
const key = k => (/^[A-Za-z_$][\w$]*$/.test(k) ? k : `'${k}'`);
export function serialize(v, ind = '') {
  const i2 = ind + '  ';
  if (typeof v === 'string') return str(v);
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (Array.isArray(v)) {
    if (v.every(x => typeof x === 'string') && v.join('').length < 90 && !v.some(x => x.includes('\n'))) return '[' + v.map(str).join(', ') + ']';
    return '[\n' + v.map(x => i2 + serialize(x, i2) + ',').join('\n') + '\n' + ind + ']';
  }
  return '{\n' + Object.entries(v).map(([k, x]) => `${i2}${key(k)}: ${serialize(x, i2)},`).join('\n') + '\n' + ind + '}';
}
export const moduleText = (comment, obj) => `// ${comment}\nexport default ${serialize(obj)};\n`;
