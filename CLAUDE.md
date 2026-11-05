# Portfolio d'Etienne Monat

Site vitrine d'Etienne, développeur full-stack en recherche de poste (Loire, mobile Lyon ou Paris).
But : montrer son niveau à des recruteurs, avec des démos interactives et le raisonnement technique derrière chaque projet.
Langue du site et des échanges : français. Etienne veut des retours directs et critiques, sans détour.

## État actuel

- Site Astro statique (décision prise en novembre 2026) : `src/pages/` (une page par fichier), `src/layouts/Base.astro`
  (`<head>` commun), `src/components/` (en-tête, pied de page), `src/styles/site.css` (polices, couleurs, base, en-tête, pied).
- L'accueil (`src/pages/index.astro`) est l'ancien `index.html` repris tel quel : ses styles en `<style is:inline>`, son script
  en `<script is:inline>`. Ne pas le « moderniser » sans raison : il a été vérifié identique au pixel près à l'ancienne version.
- `compressHTML: false` dans `astro.config.mjs` est obligatoire : la compression par défaut d'Astro 7 retire des espaces
  entre éléments et casse la mise en page de l'accueil.
- En ligne sur https://etiennemonat.etiennemonat.workers.dev (Cloudflare, Worker à fichiers statiques relié à ce dépôt).
  Chaque commit sur `main` est redéployé, les autres branches ont une adresse d'aperçu. `wrangler.jsonc` lance le build
  (`npm run build`) et ne publie que `dist/` : les fichiers du dépôt (CLAUDE.md, README…) ne sont plus servis.
- L'adresse publique est écrite une seule fois, dans `astro.config.mjs` (`site`) ; `canonical`, `og:url` et `og:image` en découlent.
- `public/_headers` : en-têtes de sécurité (CSP minimale, HSTS, nosniff…) et cache long des polices et de `/_astro/`.
- Polices hébergées dans `public/fonts/` (licence OFL) : Anybody (variable wdth 50–150, wght 100–900), Schibsted Grotesk (wght 400–900), La Belle Aurore (manuscrite).
- `public/og.png` (1200×630), `favicon.svg`, `apple-touch-icon.png`.

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
- Etienne navigue avec un bloqueur de pub (Opera GX). Jamais de classe ou d'id du type `ad`, `ad-*`, `ads`, `banner`, `sponsor`, `promo` :
  les listes (EasyList, Liste FR, uBlock) masquent ces éléments. Une annonce de démo s'appelle `lot-*`.
  Après tout ajout de balisage, passer les règles cosmétiques génériques de ces listes sur la page (`querySelectorAll` de chaque sélecteur `##…`).
- Pour comparer deux versions au pixel près : `page.clock.install()` puis `page.clock.pauseAt()` (sinon l'horloge simulée
  avance en temps réel), `runFor()` pour chaque instant, transitions CSS coupées (elles tournent sur l'horloge réelle),
  `Math.random` remplacé par un générateur à graine, et une courte attente réelle après chaque `scrollTo`.

## Architecture de l'accueil (`src/pages/index.astro`)

- Récit en 5 diapositives sur une scène collante (`.story` / `.stage`) : 1 Moi, 2 Videntis, 3 Deal Hunter, 4 recon, 5 Contact.
  Texte à gauche (`.caps`), animation à droite (`#viz`, éléments positionnés en absolu).
- Machine à états temporelle : le défilement choisit la diapositive (`want`), puis `enter()` la démarre et `render()` la joue
  dans le temps (`clock`, durées `DUR`). Fondu des éléments qui disparaissent (`snap`), fondu enchaîné en cas de retour arrière ou de saut (`leaving`).
- Aides : `place(el, x, y, scale, rot, opacity)`, `ease`, `backOut`, `seg`, `lerp`, `clamp`. Mise en page recalculée dans `layout()` (variable `small` sous 560 px).
- Section après le récit : « Parcours » (frise tracée au défilement, logos qui prennent leurs couleurs, `pathFrame`).
  « Ma méthode » a quitté l'accueil pour la page Videntis (composant `MethodPipe.astro`). Les règles `.live` restées dans
  le style de l'accueil s'appliquent aussi aux points `.dot.live` de la diapositive Videntis : ne pas les supprimer.
- La diapositive Videntis porte un lien « Voir le projet » (`.plink`) à côté du titre, avec des marges verticales négatives
  pour ne pas grandir la ligne : sur téléphone, la hauteur des textes fixe la place laissée à l'animation de toutes les diapositives.
- Boucle unique `frame()` en requestAnimationFrame.

## Projets présentés (contenu factuel)

- **Videntis** : SaaS B2B d'intelligence tarifaire pour le matériel informatique d'occasion, conçu, codé et opéré seul.
  Ramène les annonces (Leboncoin, Vinted, eBay) au bon modèle et en tire un prix de référence. Python, FastAPI, PostgreSQL, React, Stripe, Claude Haiku.
  Prêt mais pas encore en production (novembre 2026). Site public : videntis-corp.fr (Lens, Estimator, verdicts FONCER / NÉGOCIER / TENTER / PASSER,
  formules Free, Standard, Pro). Ne jamais montrer les collecteurs côté serveur (proxys, contournement des protections anti-robots).
  Les fiches du Repair Guide sont rédigées par Claude (à dire comme tel). Pas de photos de cartes : les annonces de démo sont dessinées (`src/lib/listing-art.ts`).
- **Deal Hunter** : module de Videntis. Filtres déterministes, puis diagnostic de chaque annonce par Claude Haiku, puis alerte Discord si le prix passe nettement sous la référence.
  Code dans le dépôt privé Arkaniix/deal-hunter (collecteurs compris : ne jamais les montrer) ; la référence de prix vient de l'API (Arkaniix/monark-api).
- **recon** : outil OSINT local (FastAPI, httpx, React Flow, xterm.js) qui relie les résultats de plusieurs sources dans un graphe.
- **Méthode** : spécifications, agents (Claude Code côté serveur, Lovable côté interface), relecture de chaque diff, tests golden master, déploiement unique qui refuse un dépôt sale.
  Chronologie : ChatGPT sur PC et copier-coller vers le VPS (2025), Claude Code sur le VPS (janvier–février 2026), Lovable (avril 2026), tout sous Git (30 avril 2026).

## Suite prévue : les pages de démo

Objectif : une page par projet, avec une démo interactive et le cheminement technique, plus éventuellement une page sur l'infrastructure du site.

Décisions déjà prises :
- Démos d'abord dans le navigateur : vrai code là où c'est peu coûteux (par exemple la normalisation des titres),
  réponses d'IA et jeux d'annonces enregistrés, signalés comme tels. Une démo doit marcher à tous les coups.
- Si une démo a besoin d'un vrai serveur : sur le VPS d'Etienne, sous une adresse à part (`api.…`), conteneur Docker isolé,
  limite de requêtes et plafond de dépenses sur la clé Claude. À sortir du VPS de Videntis quand celui-ci passera en production.
- recon : jamais de requête sur une vraie personne dans une démo publique, identité fictive uniquement.
- Videntis et Deal Hunter : pas de collecte en direct sur Leboncoin ou Vinted depuis une démo publique, jeux de données enregistrés.

- Structure tranchée : Astro (voir « État actuel »). Travail sur une branche, fusion dans `main` seulement après validation d'Etienne.

## Pages projet (`src/pages/projets/<slug>.astro`, adresse `/projets/<slug>/`)

- Modèle : la page Videntis (`videntis.astro`). Gabarit `Base.astro` + `SiteHeader` (variante sous-page : transparente sur la
  bande de couleur, fond papier dès qu'on défile) + `SiteFooter`. Styles propres à la page dans `src/styles/<slug>.css`.
- Mise en page en bandes pleine largeur : `.band.b-yellow | b-blue | b-pink | b-ink | b-green | b-paper`, contenu dans `.wrap`
  (1180 px) ; titres `.v-h1`, `.v-h2`, chapeau `.intro`. Sur-titre `.kicker` : marge proportionnelle à la taille du titre.
- Sections de Videntis, pour référence : en-tête animé (une annonce tombe, son titre est lu, le tampon du verdict tombe),
  fonctions (tuiles dessinées animées au survol), démo, captures réelles (loupe au clic), « Le plan » (architecture en trois
  colonnes reliées), méthode (époques + frise `MethodPipe.astro`), choix (la question en bandeau, la réponse, l'option écartée),
  « Ce qui a cassé » (problème, cause, solution, avec schéma), suite (boucle, jauge, feuille de route), carte « Projet suivant ».
- Composants et données réutilisables :
  - `Draw.astro` : dessins SVG trait encre (composants, fonctions, époques), classes `an-*` animées au survol ;
  - `src/lib/listing-art.ts` : cartes graphiques dessinées (4 variantes), boîte, loupe, et leurs décors `data-bg`
    (sheet, wood, mat, floor, lined) ;
  - `src/scripts/videntis-engine.js` : code porté du produit (reconnaissance du modèle, règles d'intention, verdict),
    avec `src/data/videntis/` (catalogue GPU et règles réels, marché inventé) ; `VidentisDemo.astro` l'utilise.
- Captures réelles dans `src/assets/<slug>/`, affichées avec `<Image>` d'`astro:assets` ; bandeau et e-mail masqués.
- Aperçu à commenter : un artifact autonome tiré de `dist` (CSS en ligne, polices et images en data URI, liens réécrits vers
  le site en ligne), republié sous le même fichier pour garder l'adresse.
- Aperçu Cloudflare d'une branche : `https://<branche>-etiennemonat.etiennemonat.workers.dev/`. Si un envoi n'est pas
  construit (webhook manqué, aucune vérification sur le commit), un commit vide relance le build.
- Retours d'Etienne sur la page Videntis, à appliquer d'emblée : peu de texte, beaucoup de dessins, schémas et captures ;
  chaque exemple visuellement distinct ; animation au survol de tout ce qui est interactif ; questions et titres mis en avant ;
  aucune section « légère » de quelques lignes ; chiffres exacts tirés du code ou d'Etienne, jamais estimés.
- Liens : chaque page a sa pastille « Voir le projet » sur sa diapositive de l'accueil (`.plink`) et la carte
  « Projet suivant » de la page précédente pointe vers elle ; une carte vers une page qui n'existe pas encore est masquée.

## En attente côté Etienne

- Nom de domaine (par exemple `etiennemonat.fr`), puis mise à jour de `site` dans `astro.config.mjs`.
- Lien GitHub et bouton « Télécharger mon CV » (PDF à fournir par Etienne).
