// Annonces inventées de la démo Deal Hunter, et réponses de Claude Haiku écrites pour la démo
// au format exact du bot (consignes « revendeur » et « réparateur » de bot.py). Rien ici ne vient d'une vraie annonce.

export type Section = { h: string; l: string[] };
export type Sample = {
  id: string; pic: string; title: string; price: number; platform: "leboncoin" | "vinted";
  city?: string; zip?: string; condition?: string; description?: string; ago: string;
  brand?: string; cond?: string; likes?: number; ship?: boolean; // affichage Leboncoin / Vinted
  ai?: Section[]; aiDrop?: Section[]; aiHs?: boolean;
};

export const SAMPLES: Sample[] = [
  {
    id: "s1", pic: "gpu-fe", title: "RTX 3080 Founders Edition comme neuve", price: 210, platform: "leboncoin", city: "Lyon", zip: "69003", ago: "il y a 3 min",
    description: "Achetée en 2022, jamais minée. Remise en main propre possible.",
    ai: [
      { h: "PLAUSIBILITÉ", l: ["Ratio prix/revente : 0.69", "Drapeaux : aucun", "Conclusion : PLAUSIBLE"] },
      { h: "VERDICT", l: ["ACHETER IMMÉDIATEMENT"] },
      { h: "RENTABILITÉ", l: ["Prix annonce 210 € vs revente 306 €. Profit net +96 € en main propre sur LBC, +73 € via Vinted. RTX 3080 très liquide, 41 ventes observées."] },
      { h: "IMAGE", l: ["Carte complète, ventilateurs propres, aucun défaut visible. Photo cohérente avec l'annonce."] },
    ],
    aiDrop: [
      { h: "PLAUSIBILITÉ", l: ["Ratio prix/revente : 0.62", "Drapeaux : aucun", "Conclusion : PLAUSIBLE"] },
      { h: "VERDICT", l: ["ACHETER IMMÉDIATEMENT"] },
      { h: "RENTABILITÉ", l: ["La baisse à 189 € ajoute 21 € de marge : +117 € en main propre sur LBC, +94 € via Vinted. Un vendeur qui baisse accepte souvent de négocier encore."] },
      { h: "IMAGE", l: ["Carte complète, aucun défaut visible. Même photo qu'à 210 €."] },
    ],
  },
  {
    id: "s2", pic: "gpu-dusty", title: "RTX 3070 écran noir, pour pièces", price: 90, platform: "leboncoin", city: "Saint-Étienne", zip: "42000", ship: true, ago: "il y a 6 min",
    condition: "pourpieces", description: "Elle démarre puis écran noir au bout de quelques minutes. Vendue en l'état.", aiHs: true,
    ai: [
      { h: "DIAGNOSTIC TECHNIQUE", l: ["Démarre puis écran noir après quelques minutes : surchauffe probable, pâte et pads thermiques secs. Certitude moyenne sans test."] },
      { h: "RÉPARABILITÉ", l: ["FACILE à MODÉRÉ : pâte et pads d'abord. Si des artefacts apparaissent ensuite, la VRAM est en cause : EXPERT."] },
      { h: "COÛT RÉPARATION ESTIMÉ", l: ["Pâte et pads : 15 à 25 € en le faisant soi-même."] },
      { h: "VALEUR PIÈCES SI IRRÉPARABLE", l: ["N/A"] },
      { h: "VIGILANCE SCAM", l: ["Symptômes, état « pour pièces » et prix cohérents. Aucun drapeau."] },
      { h: "VERDICT", l: ["RÉPARABLE PROBABLEMENT. À 90 €, la marge reste large si la carte repart. Ne pas dépasser 120 €."] },
    ],
  },
  {
    id: "s3", pic: "gpu-huge", title: "RTX 4090 Founders neuve sous blister", price: 350, platform: "vinted", brand: "Nvidia", cond: "Neuf avec étiquette", likes: 14, ago: "il y a 1 min",
    description: "Verkaufe meine Grafikkarte, sehr gut Zustand. Versand nur aus Deutschland.",
    ai: [
      { h: "PLAUSIBILITÉ", l: ["Ratio prix/revente : 0.27", "Drapeaux : ratio < 0.30 ; annonce en allemand ; envoi depuis l'étranger ; photo de boîte scellée type catalogue", "Conclusion : ARNAQUE PROBABLE"] },
      { h: "VERDICT", l: ["ARNAQUE PROBABLE -- NE PAS ACHETER. Une RTX 4090 neuve à 27 % de sa revente, décrite en allemand avec envoi depuis l'étranger."] },
    ],
  },
  {
    id: "s4", pic: "cpu", title: "Ryzen 7 5800X, très bon état", price: 95, platform: "vinted", brand: "AMD", cond: "Très bon état", likes: 3, ago: "il y a 9 min",
    ai: [
      { h: "PLAUSIBILITÉ", l: ["Ratio prix/revente : 0.79", "Drapeaux : aucun", "Conclusion : PLAUSIBLE"] },
      { h: "VERDICT", l: ["BON DEAL"] },
      { h: "RENTABILITÉ", l: ["Profit net +25 € en main propre sur LBC, +11 € via Vinted. Processeur courant et liquide, mais marge mince une fois les frais comptés."] },
      { h: "IMAGE", l: ["Processeur seul, broches visibles et droites. Aucun problème visible."] },
    ],
  },
  {
    id: "s5", pic: "gpu-mid", title: "RTX 3060 Ti Gaming OC 8 Go", price: 190, platform: "leboncoin", city: "Grenoble", zip: "38000", ship: true, ago: "il y a 12 min",
    ai: [
      { h: "PLAUSIBILITÉ", l: ["Ratio prix/revente : 1.13", "Drapeaux : aucun", "Conclusion : PLAUSIBLE"] },
      { h: "VERDICT", l: ["Au-dessus de la revente réaliste : à passer, sauf à l'obtenir sous 150 €."] },
      { h: "RENTABILITÉ", l: ["Prix annonce 190 € vs revente 168 €. Perte de 22 € en main propre, 38 € via Vinted."] },
      { h: "IMAGE", l: ["Carte complète, aucun défaut visible."] },
    ],
  },
  { id: "s6", pic: "ram", title: "Kit 2x16 Go DDR4 3200 Corsair Vengeance", price: 110, platform: "vinted", brand: "Corsair", cond: "Très bon état", likes: 2, ago: "il y a 4 min" },
  { id: "s7", pic: "glasses", title: "Lunettes Ray-Ban RX 5154 noires", price: 60, platform: "leboncoin", city: "Nantes", zip: "44000", ago: "il y a 2 min" },
  { id: "s8", pic: "laptop", title: "PC portable Legion 5 RTX 3070", price: 450, platform: "leboncoin", city: "Paris", zip: "75011", ago: "il y a 5 min" },
];

// Réglages réels relevés dans les panneaux du bot (#bot-settings et panneau de chasse d'Etienne).
export const PIPELINE = { max_price: 500, min_profit_fire: 50 };
export const ME = {
  username: "Etienne", presence: "ON", notify_when_offline: true, auto_off: true,
  platforms: { lbc: true, vinted: true },
  categories: { gpu: true, cpu: true, ram: true, ssd: true, psu: true, mobo: true, pc: true },
  channels_to_ping: { deals_fire: true, deals_price_drop: true, deals_other: true, deals_not_rentable: true, deals_suspect: true, deals_hs: true },
  min_profit_to_ping: 50, max_price_perso: 500,
};
// Second chasseur : réglages par défaut du code (user_settings.build_defaults).
export const OTHER = {
  username: "second chasseur", presence: "ON", notify_when_offline: false, auto_off: true,
  platforms: { lbc: true, vinted: true },
  categories: { gpu: true, cpu: true, ram: true, ssd: true, psu: true, mobo: true, pc: true },
  channels_to_ping: { deals_fire: true, deals_price_drop: true, deals_other: true, deals_not_rentable: false, deals_suspect: false, deals_hs: true },
  min_profit_to_ping: 25, max_price_perso: 1500,
};

export const CHANNEL_INFO: Record<string, { name: string; label: string; c: string }> = {
  deals_fire: { name: "deals-fire", label: "Bonnes affaires", c: "fire" },
  deals_price_drop: { name: "deals-price-drop", label: "Baisses de prix", c: "drop" },
  deals_hs: { name: "deals-hs", label: "Pour pièces", c: "hs" },
  deals_suspect: { name: "deals-suspect", label: "Suspectes", c: "suspect" },
  deals_not_rentable: { name: "deals-not-rentable", label: "Pas rentables", c: "flat" },
  deals_other: { name: "deals-other", label: "Autres", c: "other" },
};
