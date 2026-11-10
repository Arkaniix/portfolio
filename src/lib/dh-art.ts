// Dessins de la page Deal Hunter : objets des annonces inventées, icônes des six salons, objets écartés.
// Trait encre 2 px, aplats aux couleurs du site, aucun logo ni dessin de marque.
import { C, gpuArt, type Art } from "./listing-art";

const S = `stroke="${C.I}" stroke-width="2"`;
const SJ = `${S} stroke-linejoin="round" stroke-linecap="round"`;

// ---------- Objets des annonces (contenu d'un <svg viewBox="0 0 176 100">) ----------
const GPU_ART: Record<string, Art> = {
  fe: { fans: 2, len: 138, body: C.R, fan: C.I, blade: C.W, stripe: C.I },
  dusty: { fans: 2, len: 128, body: C.I, fan: C.I2, blade: C.W, stripe: C.P, dust: true },
  huge: { fans: 3, len: 156, body: C.I, fan: C.Y, blade: C.I, stripe: C.Y },
  mid: { fans: 2, len: 120, body: C.W, fan: C.G, blade: C.I, stripe: C.B },
  amd: { fans: 3, len: 146, body: C.W, fan: C.P, blade: C.W, stripe: C.I },
};
const cpu = () =>
  `<path d="${[0, 1, 2, 3, 4, 5].map((i) => `M${62 + i * 10.5} 12v7M${62 + i * 10.5} 81v7M44 ${30 + i * 8}h7M125 ${30 + i * 8}h7`).join("")}" ${S}/>` +
  `<rect x="51" y="19" width="74" height="62" rx="6" fill="${C.G}" ${S}/><rect x="64" y="30" width="48" height="40" rx="4" fill="${C.W}" ${S}/>` +
  `<path d="M72 42h32M72 50h22M72 58h28" ${SJ}/><circle cx="58" cy="74" r="3" fill="${C.Y}" ${S}/>`;
const ram = () =>
  [0, 1].map((k) => `<g transform="translate(0 ${k * 30})"><rect x="16" y="20" width="144" height="26" rx="3" fill="${k ? C.B : C.P}" ${S}/>` +
    Array.from({ length: 7 }, (_, i) => `<rect x="${24 + i * 19}" y="24" width="13" height="12" rx="1.5" fill="${C.W}" ${S}/>`).join("") +
    `<rect x="16" y="40" width="144" height="6" fill="${C.Y}" ${S}/><path d="M86 40v6" stroke="${C.W}" stroke-width="4"/></g>`).join("");
const glasses = () =>
  `<path d="M24 38q10-8 22-4l22 2q10 1 20-2q10 3 20 2l22-2q12-4 22 4" fill="none" ${SJ}/>` +
  `<path d="M30 38h48q2 22-8 30q-10 6-24 4q-14-2-16-34z" fill="${C.I}" ${SJ}/><path d="M98 38h48q-2 32-16 34q-14 2-24-4q-10-8-8-30z" fill="${C.I}" ${SJ}/>` +
  `<path d="M78 42q10-6 20 0" fill="none" ${S}/><path d="M38 46l14 14M108 46l14 14" stroke="${C.W}" stroke-width="3" stroke-linecap="round" opacity=".55"/>` +
  `<path d="M24 38l-12 6M152 38l12 6" ${SJ}/>`;
const laptop = () =>
  `<rect x="40" y="10" width="96" height="62" rx="5" fill="${C.I}" ${S}/><rect x="47" y="16" width="82" height="48" rx="2" fill="${C.B}"/>` +
  `<path d="M54 28h34M54 38h52M54 48h24" stroke="${C.W}" stroke-width="3" stroke-linecap="round" opacity=".8"/>` +
  `<path d="M26 72h124l8 14H18z" fill="${C.R}" ${SJ}/><path d="M76 79h24" ${SJ}/>`;
const jacket = () =>
  `<path d="M62 14q26 8 52 0l26 16-10 18-10-6v48H56V42l-10 6-10-18z" fill="${C.Y}" ${SJ}/>` +
  `<path d="M88 22v70" ${S} stroke-dasharray="3 3"/><path d="M62 14q-4 14 12 22M114 14q4 14-12 22" fill="${C.W}" ${SJ}/>` +
  `<rect x="66" y="58" width="16" height="10" rx="2" fill="${C.W}" ${S}/><rect x="94" y="58" width="16" height="10" rx="2" fill="${C.W}" ${S}/>`;
const waterblock = () =>
  `<rect x="20" y="22" width="136" height="54" rx="6" fill="#C9CEFF" fill-opacity=".85" ${S}/>` +
  `<path d="M34 34h108M34 44h108M34 54h108M34 64h108" stroke="${C.B}" stroke-width="2" opacity=".5"/>` +
  `<rect x="58" y="30" width="60" height="38" rx="4" fill="${C.W}" fill-opacity=".7" ${S}/>` +
  `<rect x="128" y="12" width="12" height="14" rx="2" fill="${C.R}" ${S}/><rect x="128" y="72" width="12" height="14" rx="2" fill="${C.R}" ${S}/>` +
  `<path d="M72 49h32" stroke="${C.B}" stroke-width="4" stroke-linecap="round"/>`;

const ssd = () =>
  `<rect x="20" y="34" width="136" height="32" rx="4" fill="${C.B}" ${S}/><rect x="20" y="34" width="14" height="32" fill="${C.Y}" ${S}/>` +
  `<rect x="44" y="41" width="30" height="18" rx="2" fill="${C.W}" ${S}/><rect x="80" y="41" width="30" height="18" rx="2" fill="${C.W}" ${S}/>` +
  `<rect x="116" y="43" width="16" height="14" rx="2" fill="${C.G}" ${S}/><circle cx="146" cy="50" r="5" fill="${C.R}" ${S}/>`;
const unknown = () =>
  `<rect x="52" y="18" width="72" height="64" rx="8" fill="${C.W}" ${S}/>` +
  `<path d="M78 40q0-10 10-10t10 9q0 6-7 9q-3 1-3 7" fill="none" stroke="${C.B}" stroke-width="4" stroke-linecap="round"/><circle cx="88" cy="64" r="2.8" fill="${C.B}"/>`;

export const PIC: Record<string, { svg: string; bg: string }> = {
  ssd: { svg: ssd(), bg: "mat" },
  unknown: { svg: unknown(), bg: "lined" },
  "gpu-fe": { svg: gpuArt(GPU_ART.fe), bg: "wood" },
  "gpu-dusty": { svg: gpuArt(GPU_ART.dusty), bg: "floor" },
  "gpu-huge": { svg: gpuArt(GPU_ART.huge), bg: "sheet" },
  "gpu-mid": { svg: gpuArt(GPU_ART.mid), bg: "mat" },
  "gpu-amd": { svg: gpuArt(GPU_ART.amd), bg: "sheet" },
  cpu: { svg: cpu(), bg: "mat" },
  ram: { svg: ram(), bg: "lined" },
  glasses: { svg: glasses(), bg: "sheet" },
  laptop: { svg: laptop(), bg: "wood" },
  jacket: { svg: jacket(), bg: "floor" },
  waterblock: { svg: waterblock(), bg: "sheet" },
};

// ---------- Icônes des six salons (viewBox 0 0 120 80), animées au survol (classes an-*) ----------
export const SALON_ART: Record<string, string> = {
  fire: `<g class="an-flame"><path d="M60 72q-26 0-26-24q0-16 14-30q0 14 10 18q-2-18 14-32q4 22 14 30q4 6 4 14q0 24-30 24z" fill="${C.P}" ${SJ}/>` +
    `<path d="M60 72q-12 0-12-12q0-8 8-14q2 8 8 8q6 6 6 12q0 6-10 6z" fill="${C.Y}" ${SJ}/></g>`,
  drop: `<path d="M14 66h92" ${SJ}/><polyline class="an-line" pathLength="1" points="18,18 40,30 56,24 74,46 96,58" fill="none" stroke="${C.B}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>` +
    `<g class="an-tagd"><path d="M84 48l14 12-18 4z" fill="${C.B}" ${SJ}/></g><rect x="20" y="6" width="38" height="16" rx="8" fill="${C.W}" ${S}/><path d="M28 14h22" stroke="${C.I}" stroke-width="2.5" stroke-dasharray="3 3"/>`,
  hs: `<g class="an-wrench"><g transform="rotate(-40 60 40)"><rect x="54" y="30" width="12" height="44" rx="4" fill="${C.Y}" ${S}/><path d="M46 14a14 14 0 1 0 28 0l-5 8h-18z" fill="${C.R}" ${SJ}/></g></g>` +
    `<path d="M84 22l14 0M91 15l0 14" stroke="${C.P}" stroke-width="3" stroke-linecap="round"/>`,
  suspect: `<g class="an-shake"><path d="M60 8l46 64H14z" fill="${C.Y}" ${SJ}/><path d="M60 30v20" stroke="${C.I}" stroke-width="5" stroke-linecap="round"/><circle cx="60" cy="60" r="3.5" fill="${C.I}"/></g>`,
  flat: `<path d="M14 66h92" ${SJ}/><polyline class="an-line" pathLength="1" points="18,40 40,42 62,40 84,42 100,41" fill="none" stroke="${C.I2}" stroke-width="4" stroke-linecap="round"/>` +
    `<g class="an-zz"><text x="78" y="26" font-family="Anybody, sans-serif" font-weight="800" font-size="16" fill="${C.I}">z</text><text x="90" y="16" font-family="Anybody, sans-serif" font-weight="800" font-size="12" fill="${C.I}">z</text></g>`,
  other: `<g class="an-box"><path d="M30 34l30-12 30 12v30l-30 12-30-12z" fill="#E2C08F" ${SJ}/><path d="M30 34l30 12 30-12M60 46v30" fill="none" ${SJ}/></g>` +
    `<circle cx="98" cy="20" r="4" fill="${C.G}" ${S}/><circle cx="20" cy="24" r="3" fill="${C.B}" ${S}/>`,
};

// ---------- Écartés avant tout calcul (viewBox 0 0 64 64) ----------
export const OUT_ART: Record<string, string> = {
  lot: `<rect x="6" y="26" width="26" height="24" rx="2" fill="#E2C08F" ${S}/><rect x="32" y="26" width="26" height="24" rx="2" fill="#E2C08F" ${S}/><path d="M4 36h56" stroke="${C.P}" stroke-width="3"/><path d="M26 22q6-10 12 0" fill="none" stroke="${C.P}" stroke-width="3"/>`,
  box: `<path d="M12 26l20-6 20 6v26l-20 6-20-6z" fill="#E2C08F" ${SJ}/><path d="M12 26l-6-10 20-6 6 10M52 26l6-10-20-6-6 10" fill="#EDD3AA" ${SJ}/><path d="M24 36h16" stroke="${C.I}" stroke-width="2" stroke-dasharray="2 3"/>`,
  laptop: `<rect x="14" y="12" width="36" height="26" rx="2" fill="${C.B}" ${S}/><path d="M6 40h52l4 8H2z" fill="${C.R}" ${SJ}/>`,
  swap: `<path d="M12 22h36l-8-8M52 42H16l8 8" fill="none" stroke="${C.I}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`,
  mug: `<path d="M14 18h28v30q0 6-6 6H20q-6 0-6-6z" fill="${C.P}" ${SJ}/><path d="M42 26q12 0 10 10t-10 8" fill="none" ${S}/><path d="M20 30h16" stroke="${C.W}" stroke-width="3"/>`,
  fan: `<circle cx="32" cy="32" r="22" fill="${C.W}" ${S}/>${[0, 72, 144, 216, 288].map((a) => `<path d="M32 32q12-3 17 7" fill="none" stroke="${C.B}" stroke-width="3" stroke-linecap="round" transform="rotate(${a} 32 32)"/>`).join("")}<circle cx="32" cy="32" r="5" fill="${C.I}"/>`,
  glasses: `<path d="M6 26h22q0 14-10 14T6 26zM36 26h22q0 14-11 14T36 26z" fill="${C.I}" ${SJ}/><path d="M28 28q4-3 8 0" fill="none" ${S}/>`,
  old: `<rect x="6" y="18" width="46" height="26" rx="4" fill="${C.R}" ${S}/><circle cx="24" cy="31" r="8" fill="${C.I2}" ${S}/><rect x="52" y="14" width="6" height="34" rx="1" fill="${C.R}" ${S}/><text x="12" y="60" font-family="ui-monospace, Menlo, monospace" font-size="10" font-weight="700" fill="${C.I}">GTX</text>`,
};

// ---------- Ce qui a cassé : trois annonces pour un seul objet ----------
export const triple = () =>
  [0, 1, 2].map((i) => `<g transform="translate(${8 + i * 20} ${8 + i * 10})"><rect width="90" height="60" rx="6" fill="${C.W}" ${S}/>` +
    `<rect x="8" y="8" width="30" height="22" rx="3" fill="${C.P}" ${S}/><path d="M46 14h34M46 22h22" ${SJ}/><text x="8" y="48" font-family="ui-monospace, Menlo, monospace" font-size="10" font-weight="700" fill="${C.I}">n° ${["4471", "4472", "4475"][i]}</text></g>`).join("");
