# CIR — Eco-System Cahier App 1.1

Date : 2026-09-11
Branch : `next/1.1.0-cahier-app`
Target : `1.1.0-cahier-app`

## Problème
Le site 1.0, bien que techniquement qualifié, restait trop proche d'une ancienne coque et rendait mal visible l'étendue du Cahier Maître 2.3.4. Un service worker cache-first pouvait également conserver une ancienne présentation sur un appareil déjà installé.

## Cause
La 1.0 avait privilégié le catalogue et le Workspace universel. Les grands parcours A→J n'étaient pas assez matérialisés dans la navigation et les écrans de premier niveau. Le cache PWA favorisait la réponse locale avant le réseau.

## Correction
- nouvelle interface Cahier App ;
- navigation par activités et hubs B→J ;
- Studio groupe en dix étapes visibles ;
- Meeting Command Center cartes + matrice ;
- accès spécialisés aux moteurs canoniques ;
- dossiers D1 truth-labelled pour capacités encore structurelles ;
- recherche universelle de capacités/groupes ;
- contexte groupe global ;
- design mobile/desktop, Mode Ultra Simple et grands contrôles ;
- SW network-first pour navigation et purge des caches anciens ;
- version runtime/health/catalogue `1.1.0-cahier-app`.

## Impact données
Aucune suppression ni refonte de données. Aucun nouveau D1. Aucune migration destructive. Les mêmes services et `eco-system-db` sont réutilisés.

## Risques / contrôles
- Régression d'IDs DOM : tests de couverture + TypeScript.
- Faux « tout est fini » : statuts visibles, specialized vs workspace conservé.
- Régression offline : shell mis en cache, navigation réseau d'abord puis fallback offline.
- Régression financière : `realMoneyEnabled=false` et Ledger canonique inchangé.
- Cache client ancien : version de cache `v110`, purge activation, `reg.update()` et `controllerchange`.

## Rollback
Le Worker version 1.0 et son BIR+ restent disponibles comme point de restauration. Aucun schéma destructif n'empêche le rollback.
