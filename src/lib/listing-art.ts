// Dessins des « photos » d'annonces inventées (en-tête et démo de la page Videntis).
// Trait encre 2 px, aplats aux couleurs du site, aucun logo ni dessin de marque.
// Chaque dessin est le contenu d'un <svg viewBox="0 0 176 100">.

export const C = { I: "#111216", W: "#FFFFFF", B: "#2B45FF", P: "#FF4F9A", G: "#3DDC97", Y: "#FFD93B", R: "#D3D6DC", I2: "#4A4E57" };

export type Art = { fans: number; len: number; body: string; fan: string; blade: string; stripe: string; dust?: boolean };

const fan = (cx: number, cy: number, r: number, fill: string, blade: string) =>
  `<g class="an-fan"><circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="${C.I}" stroke-width="2"/>` +
  [0, 72, 144, 216, 288].map((a) => `<path d="M${cx} ${cy}q${r * .55} ${-r * .15} ${r * .78} ${r * .32}" fill="none" stroke="${blade}" stroke-width="2.4" stroke-linecap="round" transform="rotate(${a} ${cx} ${cy})"/>`).join("") +
  `<circle cx="${cx}" cy="${cy}" r="${r * .26}" fill="${C.W}" stroke="${C.I}" stroke-width="2"/></g>`;

/** Carte graphique : longueur, nombre de ventilateurs, couleurs, poussière éventuelle. */
export const gpuArt = (o: Art) => {
  const x = Math.round((176 - o.len - 10) / 2), y = 20, h = 56, step = o.len / o.fans, r = Math.min(20, step * .4);
  let s = `<rect x="${x}" y="${y}" width="${o.len}" height="${h}" rx="8" fill="${o.body}" stroke="${C.I}" stroke-width="2"/>`;
  s += `<path d="M${x + 10} ${y + 5}h${o.len - 20}" stroke="${o.stripe}" stroke-width="3" stroke-linecap="round"/>`;
  for (let i = 0; i < o.fans; i++) s += fan(+(x + step * (i + .5)).toFixed(1), y + h / 2 + 2, r, o.fan, o.blade);
  s += `<rect x="${x + o.len}" y="14" width="10" height="68" rx="2" fill="${C.R}" stroke="${C.I}" stroke-width="2"/>`;
  const pw = Math.min(80, Math.round(o.len * .52));
  s += `<rect x="${x + 26}" y="${y + h}" width="${pw}" height="9" fill="${C.Y}" stroke="${C.I}" stroke-width="2"/>`;
  s += `<path d="${Array.from({ length: Math.floor(pw / 6) }, (_, i) => `M${x + 31 + i * 6} ${y + h + 1}v7`).join("")}" stroke="${C.I}" stroke-width="1.2"/>`;
  if (o.dust) s += [[18, 30], [44, 66], [70, 26], [96, 70], [118, 34], [140, 62], [60, 46], [128, 50]]
    .map(([dx, dy], i) => `<circle cx="${x + dx}" cy="${dy}" r="${i % 3 ? 1.6 : 2.4}" fill="${C.I2}" opacity=".55"/>`).join("");
  return s;
};

/** Boîte en carton vide, rabats ouverts : l'annonce ne vend que l'emballage. */
export const boxArt = () =>
  `<path d="M52 40 L88 30 L124 40 L124 84 L88 94 L52 84 Z" fill="#E2C08F" stroke="${C.I}" stroke-width="2" stroke-linejoin="round"/>` +
  `<path d="M52 40 L88 50 L124 40 M88 50 V94" fill="none" stroke="${C.I}" stroke-width="2" stroke-linejoin="round"/>` +
  `<path d="M52 40 L36 26 L72 16 L88 30 Z" fill="#EDD3AA" stroke="${C.I}" stroke-width="2" stroke-linejoin="round"/>` +
  `<path d="M124 40 L140 26 L104 16 L88 30 Z" fill="#EDD3AA" stroke="${C.I}" stroke-width="2" stroke-linejoin="round"/>` +
  `<path d="M58 54 L80 60 V74 L58 68 Z" fill="${C.W}" stroke="${C.I}" stroke-width="1.6"/>` +
  `<path d="M62 60 l14 4 M62 65 l10 3" stroke="${C.I2}" stroke-width="1.4" stroke-linecap="round"/>` +
  `<path d="M70 41 l36 0" stroke="${C.I}" stroke-width="1.4" stroke-dasharray="3 3" opacity=".5"/>`;

/** Pas de produit : une annonce « Recherche », une simple loupe sur un point d'interrogation. */
export const wantedArt = () =>
  `<circle cx="80" cy="46" r="26" fill="${C.W}" stroke="${C.I}" stroke-width="2.5"/>` +
  `<path d="M99 65 L122 88" stroke="${C.I}" stroke-width="9" stroke-linecap="round"/>` +
  `<path d="M99 65 L122 88" stroke="${C.Y}" stroke-width="4.5" stroke-linecap="round"/>` +
  `<path d="M71 39 q0 -10 9 -10 q9 0 9 8 q0 6 -7 9 q-2 1 -2 6" fill="none" stroke="${C.B}" stroke-width="4" stroke-linecap="round"/>` +
  `<circle cx="80" cy="61" r="2.6" fill="${C.B}"/>`;

/** Les quatre cartes graphiques et leur décor, dans l'ordre des annonces de l'en-tête. */
export const GPUS: { art: Art; bg: string }[] = [
  { art: { fans: 2, len: 136, body: C.W, fan: C.B, blade: C.W, stripe: C.I }, bg: "sheet" },
  { art: { fans: 3, len: 154, body: C.I, fan: C.P, blade: C.W, stripe: C.P }, bg: "wood" },
  { art: { fans: 2, len: 112, body: C.W, fan: C.G, blade: C.I, stripe: C.Y }, bg: "mat" },
  { art: { fans: 3, len: 148, body: C.R, fan: C.I2, blade: C.W, stripe: C.I, dust: true }, bg: "floor" },
];
