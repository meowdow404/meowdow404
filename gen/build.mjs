// Generates the README's retro-window SVGs into ../assets. Run: node gen/build.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, '..', 'assets');
fs.mkdirSync(out, { recursive: true });
// VT323 (SIL OFL), subset to ASCII + middle dot; embedded because README images can't load web fonts
const font = fs.readFileSync(path.join(here, 'vt323.woff2')).toString('base64');

const C = {
  cream: '#fbf9f0', ink: '#34402c', soft: '#5f704f', faint: '#8a9a7c', line: '#34402c',
  grass1: '#7fa65a', grass2: '#5f8a3f', grass3: '#9cc274', petal: '#ffffff', petalShade: '#d6dcc8',
  sun: '#f4c542', pink: '#b03a64', blush: '#f7c6d2', sky: '#d7e8f5', mint: '#e3efd6', chip: '#eef4e4',
};
const CW = 0.4; // VT323 advance width per em (monospace)

// One day lasts CYCLE seconds: day, golden hour, sunset, night, dawn, and back to day.
// Every window runs the same clock, so their title bars change together with the header.
const CYCLE = 60;
const KEYS = [0, 0.28, 0.4, 0.5, 0.58, 0.84, 0.93, 1];
const PHASES = ['day', 'day', 'gold', 'dusk', 'night', 'night', 'dawn', 'day'];
function cyc(attr, by, tag = 'animate', type = '') {
  return `<${tag} attributeName="${attr}"${type ? ` type="${type}"` : ''} values="${PHASES.map((p) => by[p]).join(';')}" keyTimes="${KEYS.join(';')}" dur="${CYCLE}s" repeatCount="indefinite"/>`;
}
const SKY = {
  top: { day: '#bcdcf5', gold: '#ffc98a', dusk: '#e8744a', night: '#0b1230', dawn: '#f3b6c0' },
  mid: { day: '#d9eaf7', gold: '#ffe0b5', dusk: '#f7a76a', night: '#1b2550', dawn: '#ffd9c4' },
  low: { day: '#fbf9f0', gold: '#fff6e8', dusk: '#ffd2a0', night: '#2b3463', dawn: '#fff0e0' },
};
const BAR = {
  left: { day: '#d7e8f5', gold: '#ffd29e', dusk: '#f4a06a', night: '#2a3466', dawn: '#f6c6cc' },
  right: { day: '#e3efd6', gold: '#ffe8c6', dusk: '#ffc890', night: '#3d4780', dawn: '#ffe3d0' },
};
const TEXT = {
  ink: { day: '#34402c', gold: '#4a2a17', dusk: '#3d1f12', night: '#f3eedd', dawn: '#4a2a17' },
  soft: { day: '#4f5f41', gold: '#86512f', dusk: '#6e3418', night: '#c9cfe8', dawn: '#86512f' },
  faint: { day: '#55654a', gold: '#7a4526', dusk: '#5e2a12', night: '#aab3d6', dawn: '#7a4526' },
  greet: { day: '#a8325a', gold: '#9a3a1a', dusk: '#5a1a0c', night: '#f7a6c0', dawn: '#8f2f55' },
};

const style = `<style>@font-face{font-family:'VT323';src:url(data:font/woff2;base64,${font}) format('woff2');}
text{font-family:'VT323',monospace;}</style>`;

// grid of chars -> merged rects
function pix(grid, colors, px, x0, y0) {
  let s = '';
  grid.forEach((row, r) => {
    let c = 0;
    while (c < row.length) {
      const ch = row[c];
      if (!colors[ch]) { c++; continue; }
      let e = c; while (e < row.length && row[e] === ch) e++;
      s += `<rect x="${x0 + c * px}" y="${y0 + r * px}" width="${(e - c) * px}" height="${px}" fill="${colors[ch]}"/>`;
      c = e;
    }
  });
  return s;
}

const DAISY = [
  '...WWW...',
  '.WW.W.WW.',
  '.WWWWWWW.',
  'W.WYYYW.W',
  'WWWYYYWWW',
  'W.WYYYW.W',
  '.WWWWWWW.',
  '.WW.W.WW.',
  '...WWW...',
];
function daisy(x, y, px, shade = true) {
  const sh = shade ? pix(DAISY, { W: C.petalShade, Y: '#d9a92e' }, px, x + px, y + px) : '';
  return sh + pix(DAISY, { W: C.petal, Y: C.sun }, px, x, y);
}

const CAT = [
  '......OOOOOOOO......',
  '....OOHHHHHHHHOO....',
  '...OHHOOOOOOOOHHO...',
  '..OHO.KK....KK.OHO..',
  '..OHOKFFK..KFFKOHO..',
  '.OOOOKFFFFFFFFKOOOO.',
  '.OHHHKFFFFFFFFKHHHO.',
  '.OHHHKFwEFFwEFKHHHO.',
  '.OHHHKFEEFFEEFKHHHO.',
  '.OHHHKffFNNFffKHHHO.',
  '.OOOOKffffffffKOOOO.',
  '.....KFKffffKFK.....',
  '....KFFKffffKFFK....',
  '....KFFFffffFFFK.KK.',
  '....KFFFffffFFFKKFK.',
  '....KffKFFFFKffKFK..',
  '.....KK.KKKK.KKKK...',
];
const CLOUD = ['....WWW......', '..WWWWWWW.WW.', '.WWWWWWWWWWWW', 'WWWWWWWWWWWWW'];
const CATC = { K: '#3b3330', F: '#b08968', f: '#e6cfb3', E: '#2a2a2a', w: '#ffffff', N: '#e89aa8', H: '#fdfcf8', O: '#7d776b' };
const NOTE = ['..XX.', '..X.X', '..X..', '..X..', 'XXX..', 'XXX..'];
const SPARK = ['..X..', '..X..', 'XX.XX', '..X..', '..X..'];

const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// a retro window frame; body is drawn by the caller inside the clip
function windowFrame(w, h, title, body) {
  const bx = w - 4 - 3 * 24;
  const btn = (i) => {
    const x = bx + i * 24, y = 10;
    const glyph = i === 0 ? `<rect x="${x + 5}" y="${y + 12}" width="8" height="2" fill="${C.ink}"/>`
      : i === 1 ? `<rect x="${x + 5}" y="${y + 4}" width="8" height="8" fill="none" stroke="${C.ink}" stroke-width="2"/>`
      : `<path d="M${x + 5} ${y + 4}l8 8M${x + 13} ${y + 4}l-8 8" stroke="${C.ink}" stroke-width="2"/>`;
    return `<rect x="${x}" y="${y}" width="18" height="18" fill="${C.cream}" stroke="${C.ink}" stroke-width="2"/>${glyph}`;
  };
  return `<defs><linearGradient id="bar" x1="0" x2="1"><stop offset="0" stop-color="${BAR.left.day}">${cyc('stop-color', BAR.left)}</stop><stop offset="1" stop-color="${BAR.right.day}">${cyc('stop-color', BAR.right)}</stop></linearGradient>
<clipPath id="win"><rect x="2" y="2" width="${w - 4}" height="${h - 4}" rx="8"/></clipPath></defs>
<g clip-path="url(#win)"><rect width="${w}" height="${h}" fill="${C.cream}"/>
<rect x="0" y="0" width="${w}" height="38" fill="url(#bar)"/><rect x="0" y="38" width="${w}" height="2" fill="${C.line}"/>
${daisy(14, 9, 2, false)}<text x="40" y="27" font-size="24" fill="${TEXT.ink.day}">${esc(title)}${cyc('fill', TEXT.ink)}</text>
${[0, 1, 2].map(btn).join('')}
${body}</g>
<rect x="2" y="2" width="${w - 4}" height="${h - 4}" rx="8" fill="none" stroke="${C.line}" stroke-width="3"/>`;
}

function svg(w, h, inner, label) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label)}">${style}${inner}</svg>\n`;
}

// deterministic noise so rebuilds don't churn the diff
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

function grass(w, top, h) {
  seed = 7;
  let s = `<rect x="0" y="${top + 14}" width="${w}" height="${h}" fill="${C.grass2}"/>`;
  for (let x = 0; x < w; x += 4) {
    const t = Math.floor(rnd() * 6) * 4;
    s += `<rect x="${x}" y="${top + 4 + t}" width="4" height="${h}" fill="${(x / 4) % 3 === 0 ? C.grass3 : C.grass1}"/>`;
  }
  return s;
}

function swayingDaisy(x, y, px, stem, dur, delay) {
  const size = 9 * px, cx = x + size / 2, base = y + size + stem;
  return `<g><animateTransform attributeName="transform" type="rotate" values="-5 ${cx} ${base};5 ${cx} ${base};-5 ${cx} ${base}" dur="${dur}s" begin="${delay}s" repeatCount="indefinite"/>
<rect x="${cx - px / 2}" y="${y + size - px}" width="${px}" height="${stem + px}" fill="${C.grass2}"/>${daisy(x, y, px)}</g>`;
}

// ---------- header: one day passes every CYCLE seconds ----------
const SUN_FULL = ['.....ssssss.....', '...ssSSSSSSss...', '..sSSSSSSSSSSs..', '.sSSSSSSSSSSSSs.', '.sSSSSSSSSSSSSs.', 'sSSSSSSSSSSSSSSs', 'sSSSSSSSSSSSSSSs', 'sSSSSSSSSSSSSSSs',
  'sSSSSSSSSSSSSSSs', 'sSSSSSSSSSSSSSSs', 'sSSSSSSSSSSSSSSs', '.sSSSSSSSSSSSSs.', '.sSSSSSSSSSSSSs.', '..sSSSSSSSSSSs..', '...ssSSSSSSss...', '.....ssssss.....'];
const MOON = ['...MMMM...', '.MMMM.....', 'MMMM......', 'MMM.......', 'MMM.......', 'MMMM......', '.MMMMM....', '..MMMMMM..', '....MMMM..'];
const FIRE = ['.X.', 'XXX', '.X.'];

function header() {
  const W = 840, H = 310;
  const greetings = ['hi, welcome!', 'aapka swagat hai', 'mharo swagat aapne', 'tamara swagat chhe', 'nimma swagata ide'];
  const n = greetings.length, cycle = n * 3.2;
  let typing = '';
  greetings.forEach((g, i) => {
    const s = i / n + 0.001, wpx = (g.length + 3) * 24 * CW;
    const k = [0, s, s + 0.07, s + 0.17, s + 0.19, 1].map((v) => Math.min(v, 1).toFixed(3)).join(';');
    typing += `<clipPath id="g${i}"><rect x="40" y="62" height="30" width="0"><animate attributeName="width" values="0;0;${wpx};${wpx};0;0" keyTimes="${k}" dur="${cycle}s" repeatCount="indefinite"/></rect></clipPath>
<text x="40" y="84" font-size="24" fill="${TEXT.greet.day}" clip-path="url(#g${i})">&gt; ${esc(g)}${cyc('fill', TEXT.greet)}</text>`;
  });

  const role = 'backend engineer · java · spring · aws';
  const prompt = '$ currently building a search engine that lives in s3';
  const cursorX = 40 + prompt.length * 22 * CW + 4;

  // sky, sun, moon and stars
  const skyStops = [[0, SKY.top], [0.45, SKY.mid], [0.8, SKY.low]].map(([o, by]) => `<stop offset="${o}" stop-color="${by.day}">${cyc('stop-color', by)}</stop>`).join('');
  const sun = `<g>${cyc('transform', { day: '70 -150', gold: '20 -60', dusk: '0 10', night: '0 90', dawn: '-60 20' }, 'animateTransform', 'translate')}
<circle cx="560" cy="262" r="170" fill="url(#sunglow)">${cyc('opacity', { day: 0.6, gold: 1, dusk: 1, night: 0, dawn: 0.7 })}</circle>
<g>${cyc('opacity', { day: 1, gold: 1, dusk: 0, night: 0, dawn: 0.5 })}${pix(SUN_FULL, { S: '#ffe27a', s: '#ffcf4d' }, 6, 512, 214)}</g>
<g opacity="0">${cyc('opacity', { day: 0, gold: 0, dusk: 1, night: 0, dawn: 0.5 })}${pix(SUN_FULL, { S: '#ff9a52', s: '#f2733a' }, 6, 512, 214)}</g></g>`;
  const moon = `<g opacity="0">${cyc('opacity', { day: 0, gold: 0, dusk: 0.3, night: 1, dawn: 0.2 })}${pix(MOON, { M: '#f6f1d8' }, 5, 730, 62)}</g>`;
  seed = 21;
  let starDots = '';
  for (let i = 0; i < 34; i++) starDots += `<rect x="${Math.floor(rnd() * 820) + 10}" y="${Math.floor(rnd() * 170) + 48}" width="3" height="3" fill="#fff8e0" opacity="${(0.4 + rnd() * 0.6).toFixed(2)}"/>`;
  const twinkle = (pts, color) => pts.map(([x, y, b]) => `<g opacity="0.2">${pix(SPARK, { X: color }, 3, x, y)}<animate attributeName="opacity" values="0.2;1;0.2" dur="2.6s" begin="${b}s" repeatCount="indefinite"/></g>`).join('');
  const stars = `<g opacity="0">${cyc('opacity', { day: 0, gold: 0, dusk: 0.25, night: 1, dawn: 0.15 })}${starDots}${twinkle([[560, 70, 0], [610, 112, 0.8], [790, 120, 1.6], [470, 60, 2.2]], '#fff8e0')}</g>`;
  const sparks = `<g>${cyc('opacity', { day: 1, gold: 0.6, dusk: 0.2, night: 0, dawn: 0.4 })}${twinkle([[560, 70, 0], [790, 80, 1.6]], C.sun)}${twinkle([[610, 112, 0.8], [520, 130, 2.2]], C.blush)}</g>`;
  const cloud = (x, y, px, dur, from) => `<g opacity="0.95">${pix(CLOUD, { W: 'currentColor' }, px, x, y)}<animateTransform attributeName="transform" type="translate" values="${from} 0;${from + 50} 0;${from} 0" dur="${dur}s" repeatCount="indefinite"/></g>`;
  const clouds = `<g color="#ffffff">${cyc('color', { day: '#ffffff', gold: '#fff1dc', dusk: '#ffc39a', night: '#39437a', dawn: '#ffe0e6' })}${cloud(420, 56, 4, 40, 0)}${cloud(700, 60, 3, 50, -30)}${cloud(250, 112, 3, 46, 20)}</g>`;

  // meadow, warmed at sunset and dimmed at night
  const daisies = [[28, 236, 3, 10, 3.4, 0], [150, 250, 2, 8, 2.9, 0.5], [262, 240, 3, 12, 3.8, 1], [404, 252, 2, 6, 3.1, 0.3],
    [500, 238, 3, 12, 3.5, 1.4], [600, 254, 2, 6, 2.7, 0.8], [790, 244, 3, 8, 3.3, 0.2]]
    .map((d) => swayingDaisy(...d)).join('');
  const front = [[96, 268, 3, 14, 3.0, 0.4], [340, 272, 3, 12, 3.6, 1.1], [560, 266, 4, 14, 3.2, 0.6], [470, 278, 2, 10, 2.8, 0]]
    .map((d) => swayingDaisy(...d)).join('');
  const shade = `<rect x="0" y="222" width="${W}" height="${H - 222}" fill="url(#warmfade)" opacity="0">${cyc('opacity', { day: 0, gold: 0.1, dusk: 0.2, night: 0, dawn: 0.06 })}</rect>
<rect x="0" y="222" width="${W}" height="${H - 222}" fill="url(#nightfade)" opacity="0">${cyc('opacity', { day: 0, gold: 0.03, dusk: 0.18, night: 0.5, dawn: 0.12 })}</rect>`;
  seed = 33;
  let flies = '';
  for (let i = 0; i < 9; i++) {
    const x = Math.floor(rnd() * 780) + 20, y = Math.floor(rnd() * 40) + 236, d = (2 + rnd() * 2).toFixed(1);
    flies += `<g opacity="0">${pix(FIRE, { X: '#ffe9a0' }, 2, x, y)}<animate attributeName="opacity" values="0;1;0" dur="${d}s" begin="${(rnd() * 3).toFixed(1)}s" repeatCount="indefinite"/></g>`;
  }
  const fireflies = `<g opacity="0">${cyc('opacity', { day: 0, gold: 0, dusk: 0.4, night: 1, dawn: 0 })}${flies}</g>`;

  // the cat: awake and blinking by day, heavy-lidded at sunset and dawn, asleep at night
  const catX = 640, catY = 166, cpx = 7;
  const at = (c, r, color) => `<rect x="${catX + c * cpx}" y="${catY + r * cpx}" width="${cpx}" height="${cpx}" fill="${color}"/>`;
  const eyes = (top, bottom, topR = top) => [7, 11].map((c) => at(c, 7, top) + at(c + 1, 7, topR) + at(c, 8, bottom) + at(c + 1, 8, bottom)).join('');
  const shut = [7, 11].map((c) => `<rect x="${catX + c * cpx}" y="${catY + 8 * cpx + 2}" width="${cpx * 2}" height="3" fill="${CATC.E}"/>`).join('');
  const awake = { day: 1, gold: 1, dusk: 0, night: 0, dawn: 0 };
  const catBase = pix(CAT.map((row, r) => (r === 7 || r === 8 ? row.replace(/[wE]/g, 'F') : row)), CATC, cpx, catX, catY);
  const cat = `<g><animateTransform attributeName="transform" type="translate" values="0 0;0 -3;0 0" dur="1.1s" repeatCount="indefinite"/>${catBase}
<g>${cyc('opacity', awake)}${eyes(CATC.w, CATC.E, CATC.E)}
<g opacity="0"><animate attributeName="opacity" values="0;0;1;0" keyTimes="0;0.93;0.95;0.98" dur="4.3s" repeatCount="indefinite"/>${eyes(CATC.F, CATC.F)}${shut}</g></g>
<g opacity="0">${cyc('opacity', { day: 0, gold: 0, dusk: 1, night: 0, dawn: 1 })}${eyes('#8a6a52', CATC.E)}</g>
<g opacity="0">${cyc('opacity', { day: 0, gold: 0, dusk: 0, night: 1, dawn: 0 })}${shut}</g></g>`;
  const notes = `<g>${cyc('opacity', { day: 1, gold: 1, dusk: 0.6, night: 0, dawn: 0.3 })}${[0, 1, 2].map((i) => {
    const nx = catX + (i % 2 ? 136 : -4), ny = catY + 44;
    return `<g opacity="0">${pix(NOTE, { X: i === 1 ? C.soft : C.pink }, 3, nx, ny)}
<animateTransform attributeName="transform" type="translate" values="0 0;${i % 2 ? 8 : -8} -60" dur="3s" begin="${i}s" repeatCount="indefinite"/>
<animate attributeName="opacity" values="0;1;0" dur="3s" begin="${i}s" repeatCount="indefinite"/></g>`;
  }).join('')}</g>`;
  const zzz = `<g opacity="0">${cyc('opacity', { day: 0, gold: 0, dusk: 0, night: 1, dawn: 0 })}${[[0, 18], [1, 23], [2, 28]].map(([i, size]) =>
    `<text x="${catX + 120 + i * 10}" y="${catY + 20 - i * 14}" font-size="${size}" fill="#e8ecff" opacity="0">${i === 2 ? 'Z' : 'z'}<animateTransform attributeName="transform" type="translate" values="0 0;10 -24" dur="3s" begin="${i}s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;1;0" dur="3s" begin="${i}s" repeatCount="indefinite"/></text>`).join('')}</g>`;

  const body = `<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">${skyStops}</linearGradient>
<linearGradient id="nightfade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b1230" stop-opacity="0"/><stop offset="0.35" stop-color="#0b1230"/></linearGradient>
<linearGradient id="warmfade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff7a2a" stop-opacity="0"/><stop offset="0.35" stop-color="#ff7a2a"/></linearGradient>
<radialGradient id="sunglow"><stop offset="0" stop-color="#fff3d6"/><stop offset="0.3" stop-color="#ffc46a" stop-opacity="0.8"/><stop offset="1" stop-color="#ffb35c" stop-opacity="0"/></radialGradient></defs>
<rect x="0" y="40" width="${W}" height="${H}" fill="url(#sky)"/>
${stars}${moon}${sun}${clouds}${sparks}
${daisies}${grass(W, 270, 60)}${front}${shade}${fireflies}${cat}${notes}${zzz}
${typing}
<text x="36" y="148" font-size="80" fill="${TEXT.ink.day}">maanas gaur${cyc('fill', TEXT.ink)}</text>
<text x="40" y="186" font-size="28" fill="${TEXT.soft.day}">${esc(role)}${cyc('fill', TEXT.soft)}</text>
<text x="40" y="220" font-size="22" fill="${TEXT.faint.day}">${esc(prompt)}${cyc('fill', TEXT.faint)}</text>
<rect x="${cursorX}" y="204" width="10" height="18" fill="${TEXT.faint.day}">${cyc('fill', TEXT.faint)}<animate attributeName="opacity" values="1;1;0;0" keyTimes="0;0.5;0.5;1" dur="1s" repeatCount="indefinite"/></rect>`;
  return svg(W, H, windowFrame(W, H, 'meowdow404', body), 'maanas gaur, backend engineer: java, spring, aws');
}

// ---------- about + stack ----------
function about(stack) {
  const W = 840, fs1 = 24, lh = 30;
  const lines = [
    ['p', '> whoami'],
    ['t', 'backend engineer. b.tech in cs & ai from iiit delhi.'],
    ['t', 'i build apis, mcp servers and ai tools on aws.'],
    ['g', ''],
    ['p', '> cat stack.txt'],
  ];
  let y = 80, s = '';
  for (const [k, t] of lines) {
    if (k === 'g') { y += 10; continue; }
    s += `<text x="${k === 'p' ? 32 : 52}" y="${y}" font-size="${fs1}" fill="${k === 'p' ? C.pink : C.ink}">${esc(t)}</text>`;
    y += lh;
  }
  // chips, wrapped
  let x = 52; y += 2; const ch = 32, gap = 10, cfs = 22;
  for (const t of stack) {
    const w = Math.round(t.length * cfs * CW + 24);
    if (x + w > W - 32) { x = 52; y += ch + gap; }
    s += `<rect x="${x}" y="${y - 22}" width="${w}" height="${ch}" rx="4" fill="${C.chip}" stroke="${C.grass2}" stroke-width="2"/>
<text x="${x + 12}" y="${y}" font-size="${cfs}" fill="${C.ink}">${esc(t)}</text>`;
    x += w + gap;
  }
  const H = y + 34;
  return svg(W, H, windowFrame(W, H, 'about.txt', s), 'about: backend engineer; stack: ' + stack.join(', '));
}

// ---------- one card per certification (badge PNG embedded: a README <img> SVG can't load remote images) ----------
// all certifications in one window, left-aligned; badges wrap four to a row, so more can be added later
function certs(badges) {
  const W = 840, size = 112, cell = 190, perRow = 4, rowH = size + 66, top = 58;
  const rows = Math.ceil(badges.length / perRow);
  let body = '';
  badges.forEach((b, i) => {
    const r = Math.floor(i / perRow), c = i % perRow;
    const cx = 32 + cell / 2 + c * cell, y = top + r * rowH;
    const data = fs.readFileSync(path.join(here, 'badges', b.file)).toString('base64');
    body += `<image x="${cx - size / 2}" y="${y}" width="${size}" height="${size}" href="data:image/png;base64,${data}"/>
<text x="${cx}" y="${y + size + 24}" font-size="19" fill="${C.ink}" text-anchor="middle">${esc(b.line1)}</text>
<text x="${cx}" y="${y + size + 44}" font-size="17" fill="${C.pink}" text-anchor="middle">${esc(b.line2)}</text>`;
  });
  const H = top + rows * rowH + 8;
  return svg(W, H, windowFrame(W, H, 'certifications/', body), 'AWS certifications: ' + badges.map((b) => `${b.line1} ${b.line2}`).join(', '));
}

// ---------- small link buttons ----------
function button(label) {
  const w = Math.round(label.length * 22 * CW + 40), h = 40;
  return svg(w + 4, h + 4, `<rect x="4" y="4" width="${w}" height="${h}" rx="4" fill="${C.grass2}"/>
<rect x="0" y="0" width="${w}" height="${h}" rx="4" fill="${C.cream}" stroke="${C.ink}" stroke-width="2"/>
<text x="${w / 2}" y="27" font-size="22" fill="${C.ink}" text-anchor="middle">${esc(label)}</text>`, label);
}

const cfg = JSON.parse(fs.readFileSync(path.join(here, 'content.json'), 'utf8'));
fs.writeFileSync(path.join(out, 'header.svg'), header());
fs.writeFileSync(path.join(out, 'about.svg'), about(cfg.stack));
fs.writeFileSync(path.join(out, 'certs.svg'), certs(cfg.badges));
for (const b of cfg.buttons) fs.writeFileSync(path.join(out, `btn-${b.id}.svg`), button(b.label));
console.log('built', fs.readdirSync(out).join(' '));
