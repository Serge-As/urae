# ECO-SYSTEM — CURRENT TRUTH

Date : 2026-09-10

## Ligne produit
- Cible visible : `1.0.0-complete-app`
- Branche : `next/1.0.0-complete-app`
- Anciennes lignes 0.5.1/0.6 : sauvegarde/repli, pas cible produit.
- `main` : ne pas modifier.
- `realMoneyEnabled=false` : invariant obligatoire.

## Acquis distants
- GitHub Secrets `CLOUDFLARE_ACCOUNT_ID` et `CLOUDFLARE_API_TOKEN` : acquis, valeurs non stockées dans le dépôt.
- Account API Token Cloudflare : vérifié actif, run diagnostic `34426666080`.
- D1 `eco-system-db` : VERIFIED_REMOTE ; réutiliser, ne pas recréer.
- Worker `eco-system` : VERIFIED_REMOTE sur dernière ligne déployée 0.6.
- `/health` et racine PWA : vérifiés sur 0.6 avant bascule 1.0.

## Mission actuelle
Livrer Complete App 1.0 selon le Prompt Maître A→J :
Identity/Discovery/Membership ; Group Launch/Rubrics ; Session Command Center ;
Ledger/prêts/solidarité ; communauté/marketplace/fournisseurs/achats groupés ;
AdManager ; Academy/ONG/IA/Paper Bridge ; exports/intégrations ; hardening/pilote.

## Doctrine Living Rules
« Voilà comment un groupe peut décrire la manière dont sa collation fonctionne. »

L'application distingue règle écrite, pratique observée, règle opérationnelle validée,
exceptions, autorités et preuves. Les pratiques d'un groupe ne deviennent pas des
interdictions universelles.

## Complete App 1.0 — état avant déploiement
- nouvelle coque mobile Complete App ;
- navigation complète ;
- catalogue de 139 capacités ;
- moteurs spécialisés existants réutilisés ;
- workspace universel persistant D1 pour capacités en maturation ;
- aucune duplication du Ledger, Membership ou des services canoniques ;
- CI et déploiement 1.0 encore à qualifier au moment de ce fichier.

## Garde-fous
Ne pas recréer D1 ou les Secrets déjà acquis. Ne pas force-push `main`.
Aucune migration destructive. Aucune PII fondatrice brute. Aucun argent réel.
