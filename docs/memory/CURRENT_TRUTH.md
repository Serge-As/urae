# ECO-SYSTEM — État vérifié le 13 septembre 2026

Version active : `1.2.0-functional-completion`  
Branche de livraison : `next/1.2.0-functional-completion-20260913`  
Production : `https://eco-system.sergemimf.workers.dev/`  
Worker : `eco-system`  
D1 canonique : `eco-system-db`  
Argent réel : `realMoneyEnabled=false` — invariant maintenu.  
`main` : non fusionné.

## Production vérifiée

Le workflow Cloudflare `34766061058` est **SUCCESS**. Le Worker publié a le Version ID `f04625c8-30a9-4722-8de7-76f08f49b1e4`. La qualification, le build, la résolution de l'infrastructure, les migrations additives, le déploiement et le smoke test ont tous réussi. D1 a été réutilisée et Wrangler a répondu **No migrations to apply**.

Le smoke test a confirmé :
- `/health` : version `1.2.0-functional-completion`;
- catalogue canonique : **139 capacités**;
- `realMoneyEnabled=false`;
- stockage d'artefacts opérationnel;
- racine PWA accessible.

R2 est demandé en priorité mais l'API Cloudflare utilisée par GitHub Actions renvoie encore le code `10042` (« Please enable R2 through the Cloudflare Dashboard »). La production utilise donc actuellement le mode sûr `D1_FALLBACK` pour les petits artefacts/imports, avec taille bornée. Aucun bucket R2 n'est revendiqué comme opérationnel tant que ce code persiste.

## Correction métier multi-tontines — acquise

Le lancement d'un groupe n'impose plus une cotisation nominale globale. **Toutes les familles de groupes** utilisent désormais des rubriques indépendantes.

Une association ou une tontine peut avoir plusieurs tontines/rubriques simultanées : par exemple Tontine 1 000 F, Tontine 10 000 F, Savons, Huiles, Draps. Chaque rubrique définit séparément :
- sa participation : libre/volontaire, obligatoire ou selon une règle;
- ses propres participants — ils ne sont pas obligatoirement tous les membres du groupe;
- argent, nature ou mode mixte;
- article, unité et quantité pour les tontines en nature;
- montant monétaire lorsqu'il existe;
- nombre de parts/noms, pots, tours et durée;
- frais/coûts;
- note de contexte propre à la rubrique;
- bénéficiaires/parts prévus lorsque nécessaire.

Un membre peut donc participer à 0, 1, plusieurs ou toutes les tontines. Les participants et les nombres de parts peuvent différer d'une tontine à l'autre.

Le test authentifié de bout en bout `34765998225` est **SUCCESS** : connexion → projet avec trois tontines distinctes (1 000 F, 10 000 F et Savons en nature) → simulation → conversion en groupe → récupération des trois rubriques persistées.

## Parcours de connexion et PWA

La PWA vérifie maintenant le Service Worker **avant** l'authentification avec `updateViaCache:'none'`. Le cache 1.2 a été tourné vers `eco-system-cahier-app-v120-completion-r3-20260913`. Navigation et scripts restent network-first afin d'éviter qu'un ancien cockpit reste affiché après un déploiement.

Si une session expire pendant un formulaire de lancement, l'écran de connexion est présenté sans effacer le DOM du brouillon courant. Le message indique que la saisie de la page est conservée.

## Moteurs spécialisés acquis

La ligne 1.2 comprend notamment : tontine opérationnelle (cycles, parts, planning, service d'un pot dans le Ledger), prêts et remboursements, décisions gouvernées/quorum, attendus et impayés, affectation explicite des reçus, épargne, soldes d'ouverture, détenteurs de caisse, garants, solidarité, marché (stock, commandes, livraisons, retours, litiges, achats groupés), import historique contrôlé, explication des montants, recherche documentaire sourcée, comparaison de règles, détection d'anomalies, calendrier, interface FR/EN, snapshots de réunion hors ligne et Relay chiffré AES-GCM.

Une carte ou un workspace générique ne vaut toujours pas moteur métier terminé : chaque fonction spécialisée doit conserver persistance, droits, reprise et tests.

## Sauvegarde / reprise

La sauvegarde pré-déploiement multi-tontines `34766026113` est **SUCCESS** : archive source, export D1, restauration SQLite, `PRAGMA integrity_check = ok`, SHA-256 et GitHub Artifact. Une sauvegarde post-déploiement est également déclenchée après le run Cloudflare validé.

Garde-fous permanents :
- ne pas recréer `eco-system-db`;
- migrations additives uniquement;
- ne pas demander/recréer les secrets Cloudflare déjà acquis;
- ne pas force-push ou fusionner `main` sans décision explicite;
- ne pas activer l'argent réel sans autorisation séparée;
- ne pas publier PII/archives privées;
- préserver Living Rules, Ledger et Membership canoniques, isolation multi-tenant, idempotence et outbox.

## Ancres historiques à préserver

La ligne `1.0.0-complete-app` reste une référence historique supersédée et ne doit pas être effacée du Truth Ledger. Les prérequis **CLOUDFLARE** déjà acquis, notamment les secrets GitHub documentés sans valeur et la D1 `eco-system-db`, restent valides. La doctrine **Living Rules** et l'invariant `realMoneyEnabled=false` demeurent applicables à la ligne 1.2.

## Point de reprise

Partir exclusivement de `next/1.2.0-functional-completion-20260913`. Considérer la production 1.2 et le correctif multi-tontines comme acquis. Ne pas revenir à l'ancien cockpit 2.3.4 / build 2026-09-11 ni à la logique d'une cotisation nominale unique.
