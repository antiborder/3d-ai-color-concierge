import fs from 'fs';

function hslToRgb(h, s, l) {
  h /= 360;
  s /= 100;
  l /= 100;
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

const names = [
  'Red',
  'Red-orange',
  'Yellow',
  'Chartreuse',
  'Green',
  'Spring green',
  'Cyan',
  'Azure',
  'Blue',
  'Violet',
  'Magenta',
  'Rose',
];
const Ls = [10, 30, 50, 70, 90];
const Ss = [20, 40, 60, 80, 100];
const lines = [];
for (let i = 0; i < 12; i++) {
  const h = i * 30;
  for (const l of Ls) {
    for (const s of Ss) {
      if (s === 100 && l === 50) continue;
      const [r, g, b] = hslToRgb(h, s, l);
      const hex =
        '#' +
        [r, g, b]
          .map((x) => x.toString(16).padStart(2, '0').toUpperCase())
          .join('');
      lines.push(
        `  { hex: '${hex}', name1: '${names[i]}', name2: 'S${s} L${l}', name3: '', tag: ['SPECTRAL12'] },`
      );
    }
  }
}

const outPath = new URL('./spectral12grid.fragment.js', import.meta.url);
fs.writeFileSync(outPath, lines.join('\n') + '\n');
console.log('lines', lines.length, '->', outPath.pathname);
