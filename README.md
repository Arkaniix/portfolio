# Portfolio Etienne Monat

Site statique construit avec Astro : aucune page n'envoie de JavaScript d'Astro, chaque page porte le sien.

- `src/pages/` : une page par fichier. `index.astro` est l'accueil (styles et script propres à la page inclus).
- `src/layouts/Base.astro` : le `<head>` commun (méta, partage, polices, styles partagés).
- `src/components/` : en-tête et pied de page communs.
- `src/styles/site.css` : polices, couleurs, base, en-tête, pied de page.
- `public/` : copié tel quel (polices sous licence SIL OFL, icônes, `og.png`, `robots.txt`, `_headers`).

## Travailler en local

```sh
npm install
npm run dev       # http://localhost:4321
npm run build     # produit dist/
```

## Déploiement

Hébergé sur Cloudflare (Worker à fichiers statiques, relié à ce dépôt). Chaque commit sur `main` est redéployé
automatiquement ; les autres branches ont une adresse d'aperçu. Le build est lancé par Wrangler (`wrangler.jsonc`,
champ `build`) et seul `dist/` est publié.

L'adresse publique est écrite une seule fois, dans `astro.config.mjs` (`site`). Les balises `canonical`, `og:url`
et `og:image` en découlent : c'est la seule ligne à changer le jour où un nom de domaine arrive.
