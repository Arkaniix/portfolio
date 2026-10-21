# Portfolio Etienne Monat

Site statique : aucune étape de build.

- `index.html` : la page d'accueil (styles et script inclus)
- `fonts/` : Anybody, Schibsted Grotesk, La Belle Aurore (licence SIL OFL, fichiers LICENSE à côté)
- `favicon.svg`, `apple-touch-icon.png` : icônes
- `og.png` : image d'aperçu pour les partages (LinkedIn, messageries)
- `_headers` : en-têtes de sécurité et de cache, lus par Cloudflare Pages

## Déploiement sur Cloudflare Pages

Réglages du projet : framework « None », commande de build vide, dossier de sortie `/`.

L'adresse publique est écrite à trois endroits de `index.html` (`canonical`, `og:url`, `og:image`),
réglée sur `https://etiennemonat.pages.dev`. Si l'adresse change (autre nom de projet, domaine à toi),
remplace-la à ces trois endroits.
