// @ts-check
import { defineConfig } from "astro/config";

export default defineConfig({
  // Adresse publique : à changer ici seulement le jour où un nom de domaine arrive.
  site: "https://etiennemonat.etiennemonat.workers.dev",
  trailingSlash: "always",
  // Garder les espaces tels quels : l'accueil en dépend (éléments en ligne, textes animés).
  compressHTML: false,
  build: { format: "directory" },
});
