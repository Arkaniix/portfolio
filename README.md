# Portfolio Etienne Monat

Site statique : aucune étape de build.

- `index.html` : la page d'accueil (styles et script inclus)
- `fonts/` : Anybody, Schibsted Grotesk, La Belle Aurore (licence SIL OFL, fichiers LICENSE à côté)
- `favicon.svg`, `apple-touch-icon.png` : icônes
- `og.png` : image d'aperçu pour les partages (LinkedIn, messageries)
- `_headers` : en-têtes de sécurité et de cache, lus par Cloudflare

## Déploiement

Hébergé sur Cloudflare (Worker à fichiers statiques, relié à ce dépôt) : chaque commit sur `main`
est redéployé automatiquement. Aucune commande de build, répertoire racine `/`.

L'adresse publique est écrite à trois endroits de `index.html` (`canonical`, `og:url`, `og:image`),
actuellement `https://etiennemonat.etiennemonat.workers.dev`. Si elle change (domaine à toi),
remplace-la à ces trois endroits.
