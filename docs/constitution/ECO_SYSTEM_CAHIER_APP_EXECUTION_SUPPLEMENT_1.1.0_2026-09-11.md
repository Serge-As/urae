# ECO-SYSTEM — SUPPLÉMENT D’EXÉCUTION CAHIER APP 1.1.0

Date : 11 septembre 2026
Ligne : `1.1.0-cahier-app`
Branche : `next/1.1.0-cahier-app`
Référence métier : **Cahier Maître 2.3.4**.

## Décision de correction
Le fondateur a constaté que la version 1.0 déployée restait visuellement trop proche d'une vieille coque et ne matérialisait pas suffisamment l'étendue du Cahier. La 1.1 reconstruit donc l'interface visible autour des parcours du Cahier au lieu d'un simple catalogue générique.

## Structure visible obligatoire A→J
- B — Identity / Discovery / Membership.
- C — Studio de création/intégration/transformation en 10 étapes + Rubric Engine / Living Rules.
- D — Meeting Command Center, vue cartes smartphone + matrice membres × rubriques.
- E — Ledger canonique, caisse, épargne, prêts, solidarité et assistances.
- F — Forums, Hubs professionnels, marketplace, fournisseurs, achats groupés, Business Studio, réputation/références.
- G — AdManager et sponsoring.
- H — Academy, ONG, Knowledge, IA assistée, Safety/anti-arnaque, Governance Document Studio, Paper Bridge.
- I — Exports, dashboards, recherche universelle, calendrier, notifications et intégrations.
- J — Sécurité, performance, offline, PRA, observabilité, E2E et pilote.

## Vérité fonctionnelle
Toute capacité connue doit être **visible, localisable et actionnable**. Lorsqu'un moteur canonique spécialisé existe, l'interface l'utilise. Lorsqu'il n'existe pas encore, la capacité ouvre un dossier persistant D1 dans le Workspace universel et affiche son statut réel. Cette règle évite à la fois l'ancienne invisibilité et la fausse complétude.

## Living Rules
« Voilà comment un groupe peut décrire la manière dont sa collation fonctionne. »
La règle écrite, la pratique observée, la politique opérationnelle validée, les exceptions, autorités, justificatifs et régularisations restent des objets distincts et auditables.

## PWA / cache
La 1.1 change la stratégie du service worker afin que la navigation principale soit network-first et que les anciens caches de coques soient supprimés à l'activation. L'offline reste disponible par fallback sur le shell courant.

## Invariants
- D1 : exclusivement `eco-system-db`.
- aucune migration destructive ;
- une activité métier = une autorité canonique ;
- aucune PII/secrets bruts ;
- `realMoneyEnabled=false` ;
- `main` non fusionné sans décision explicite.
