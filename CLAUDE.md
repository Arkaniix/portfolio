# Portfolio d'Etienne Monat

Site vitrine d'Etienne, développeur full-stack en recherche de poste (Loire, mobile Lyon ou Paris).
But : montrer son niveau à des recruteurs, avec des démos interactives et le raisonnement technique derrière chaque projet.
Langue du site et des échanges : français. Etienne veut des retours directs et critiques, sans détour.

## État actuel

- Une seule page en ligne : `index.html` (HTML, CSS et JS dans le même fichier, sans dépendance ni build).
- En ligne sur https://etiennemonat.etiennemonat.workers.dev (Cloudflare, Worker à fichiers statiques relié à ce dépôt).
  Chaque commit sur `main` est redéployé automatiquement (commande `npx wrangler deploy`, racine `/`, pas de build).
- L'adresse publique est écrite dans `index.html` (`canonical`, `og:url`, `og:image`). À changer si un nom de domaine est ajouté.
- `_headers` : en-têtes de sécurité (CSP minimale, HSTS, nosniff…) et cache long des polices.
- Polices hébergées dans `fonts/` (licence OFL) : Anybody (variable wdth 50–150, wght 100–900), Schibsted Grotesk (wght 400–900), La Belle Aurore (manuscrite).
- `og.png` (1200×630), `favicon.svg`, `apple-touch-icon.png`.

## Direction artistique (à respecter sur toutes les pages)

Etienne rejette tout ce qui « fait vibecodé » ou généré par IA. Il veut du frais, coloré, tape-à-l'œil et original,
mais toujours compréhensible : chaque animation doit raconter quelque chose de clair.

- Couleurs (variables CSS dans `:root`) : `--paper #F3F4F6`, `--ink #111216`, `--ink-2 #4A4E57`, `--rule #D3D6DC`,
  `--blue #2B45FF`, `--yellow #FFD93B`, `--pink #FF4F9A`, `--pink-ink #D81B6A`, `--green #3DDC97`.
- Thème clair unique, assumé. Chaque diapositive de l'accueil a son fond : bleu, jaune, rose, noir, vert.
- Titres en Anybody (étroit, très gras, via `font-variation-settings: "wdth" ~70, "wght" ~820`), texte courant en Schibsted Grotesk.
- Composants récurrents : cartes blanches à bord encre 1,5 px, rayon 8 à 12 px, ombre portée pleine `0 4px 0 rgba(17,18,22,.2)`.
  État actif ou survol : décalage + ombre noire décalée (`-5px 5px 0 var(--ink)`). Pastilles arrondies colorées pour les étiquettes.
- Marques tierces : noms en texte simple, jamais de logo ni de couleurs de marque (Leboncoin, Vinted, eBay, Discord…).
  Les seuls logos autorisés sont ceux fournis par Etienne (section Parcours).
- Toutes les données de démo (annonces, prix, identités) sont inventées et signalées comme telles.

## Exigences sur les animations

- Chaque animation se joue en entier à chaque arrivée, sans état intermédiaire bancal. Elle est pilotée par le temps, pas par le défilement brut.
- Tout élément interactif réagit au survol de façon visible. Sur mobile, le toucher remplace le survol.
- `prefers-reduced-motion` : afficher directement l'état final.
- Vérifier chaque changement sur grand écran (1440×900, 1280×720) et sur téléphone (390×844, 375×667) avec Playwright,
  en capturant plusieurs instants de l'animation. Vérifier aussi l'absence d'erreur console.
  Etienne repère vite les bugs visuels : débordements, chevauchements, éléments qui passent au mauvais plan.

## Architecture de `index.html`

- Récit en 5 diapositives sur une scène collante (`.story` / `.stage`) : 1 Moi, 2 Videntis, 3 Deal Hunter, 4 recon, 5 Contact.
  Texte à gauche (`.caps`), animation à droite (`#viz`, éléments positionnés en absolu).
- Machine à états temporelle : le défilement choisit la diapositive (`want`), puis `enter()` la démarre et `render()` la joue
  dans le temps (`clock`, durées `DUR`). Fondu des éléments qui disparaissent (`snap`), fondu enchaîné en cas de retour arrière ou de saut (`leaving`).
- Aides : `place(el, x, y, scale, rot, opacity)`, `ease`, `backOut`, `seg`, `lerp`, `clamp`. Mise en page recalculée dans `layout()` (variable `small` sous 560 px).
- Sections après le récit : « Ma méthode » (frise animée de 5 étapes avec vignettes, `pipeFrame`) et « Parcours »
  (frise tracée au défilement, logos qui prennent leurs couleurs, `pathFrame`).
- Boucle unique `frame()` en requestAnimationFrame.

## Projets présentés (contenu factuel)

- **Videntis** : SaaS B2B d'intelligence tarifaire pour le matériel informatique d'occasion, conçu, codé et opéré seul.
  Ramène les annonces (Leboncoin, Vinted, eBay) au bon modèle et en tire un prix de référence. Python, FastAPI, PostgreSQL, React, Stripe, Claude Haiku. Pas encore en production.
- **Deal Hunter** : module de Videntis. Filtres déterministes, puis diagnostic de chaque annonce par Claude Haiku, puis alerte Discord si le prix passe nettement sous la référence.
- **recon** : outil OSINT local (FastAPI, httpx, React Flow, xterm.js) qui relie les résultats de plusieurs sources dans un graphe.
- **Méthode** : spécifications, agents (Claude Code côté serveur, Lovable côté interface), relecture de chaque diff, tests golden master, déploiement unique qui refuse un dépôt sale.

## Suite prévue : les pages de démo

Objectif : une page par projet, avec une démo interactive et le cheminement technique, plus éventuellement une page sur l'infrastructure du site.

Décisions déjà prises :
- Démos d'abord dans le navigateur : vrai code là où c'est peu coûteux (par exemple la normalisation des titres),
  réponses d'IA et jeux d'annonces enregistrés, signalés comme tels. Une démo doit marcher à tous les coups.
- Si une démo a besoin d'un vrai serveur : sur le VPS d'Etienne, sous une adresse à part (`api.…`), conteneur Docker isolé,
  limite de requêtes et plafond de dépenses sur la clé Claude. À sortir du VPS de Videntis quand celui-ci passera en production.
- recon : jamais de requête sur une vraie personne dans une démo publique, identité fictive uniquement.
- Videntis et Deal Hunter : pas de collecte en direct sur Leboncoin ou Vinted depuis une démo publique, jeux de données enregistrés.

À trancher au début : passer à plusieurs pages demande de partager l'en-tête, les styles et le pied de page.
Recommandation : Astro (pages statiques, mise en page partagée, démos en îlots JavaScript), sortie `dist/`, avec un
`wrangler.jsonc` qui sert `dist/` et une commande de build dans Cloudflare. Alternative sans build : plusieurs fichiers HTML
et un `assets/site.css` commun. Garder l'accueil identique visuellement lors de la migration.

## En attente côté Etienne

- Nom de domaine (par exemple `etiennemonat.fr`), puis mise à jour des trois lignes d'adresse dans `index.html`.
- Lien GitHub et bouton « Télécharger mon CV » (PDF à fournir par Etienne).
