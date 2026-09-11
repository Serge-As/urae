# ECO-SYSTEM — PROJECT STATE

Date : 2026-09-11

## Ligne produit courante
- Cible en qualification : `1.1.0-cahier-app`
- Branche : `next/1.1.0-cahier-app`
- Cahier Maître : `2.3.4`
- URL publique conservée : `https://eco-system.sergemimf.workers.dev/`
- Worker : `eco-system`
- D1 : exclusivement `eco-system-db`
- `realMoneyEnabled=false` : invariant obligatoire.
- `main` : ne pas fusionner sans décision distincte.

## Problème traité
Le fondateur a constaté que l'interface 1.0 visible ressemblait encore à une vieille version et ne matérialisait pas assez le Cahier. La 1.1 reconstruit l'expérience autour des parcours A→J et corrige la stratégie de cache PWA qui pouvait maintenir une ancienne coque.

## État avant déploiement 1.1
- branche créée depuis le checkpoint 1.0 qualifié ;
- interface Cahier App reconstruite localement ;
- Studio groupe 10 étapes, Meeting Command Center cartes + matrice, hubs B→J, recherche globale et contexte groupe ajoutés ;
- services canoniques et D1 réutilisés ;
- capacités sans moteur final restent dans un Workspace D1 truth-labelled ;
- aucun real money, aucune migration destructive ;
- déploiement 1.1 : **TO_VERIFY** jusqu'à CI et smoke distants.

## Acquis distants à préserver
- GitHub Secrets Cloudflare : acquis ; valeurs jamais stockées.
- Token Cloudflare : vérifié actif.
- D1 `eco-system-db` : VERIFIED_REMOTE ; ne pas recréer.
- Worker `eco-system` : VERIFIED_REMOTE sur la dernière ligne déployée.
- 1.0 et ses BIR+ restent rollback/recovery.

## Living Rules
« Voilà comment un groupe peut décrire la manière dont sa collation fonctionne. »
Règle écrite, pratique observée, politique opérationnelle validée, exceptions, autorités et preuves restent séparées et auditables.

## Prochaine action
Qualifier `npm run ci` → publier le commit 1.1 → déployer sur le même Worker/D1 → vérifier `/`, `/health`, `/api/v1/product/capabilities` → ouvrir la PR 1.1 → mettre la vérité à jour → BIR+ vérifié → Library `/Eco-System/`.
