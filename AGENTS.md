# AGENTS.md — Eco-System Complete App

## Mission
Continuer le produit réel Eco-System sans recommencer depuis zéro. La version locale est `1.1.2-qualified-local`, reprise serveur de `1.0.0-complete-app` et interface publique 1.1. La production 1.1 n’a pas été remplacée. L’ancienne 0.5/0.6 reste fallback historique, pas cible UI.

## MEMORY BEFORE CODE
Avant tout lot substantiel, lire :
1. `AGENTS.md` ;
2. `docs/memory/CURRENT_TRUTH.md` ;
3. `docs/memory/PROJECT_TRUTH_LEDGER.json` ;
4. `PROJECT_STATE.md` ;
5. `docs/constitution/ECO_SYSTEM_COMPLETE_APP_EXECUTION_SUPPLEMENT_1.0.0_2026-09-10.md` ;
6. `docs/governance/ECO_SYSTEM_LIVING_RULES_DOCTRINE_1.0.0.md` ;
7. `FEATURE_REGISTRY.yaml` ;
8. `NEXT_RUN.md` ;
9. CIR/ADR/Recall pertinents ;
10. effectuer un Memory Recall avant code.

Le dernier prompt, un écran ou un résumé n’est jamais la totalité du besoin. Une absence ≠ suppression.

## Sources de vérité
- Métier : Cahiers Eco-System 2.3.x fingerprintés + décisions ultérieures versionnées + supplément Complete App.
- Implémentation : code + tests réellement exécutés.
- Déploiement : Cloudflare/D1 réellement vérifiés.
- Mémoire : Truth Ledger, Feature Registry, Deep Digest, Source Coverage, Recall/CIR.

## Doctrine
> « Voilà comment un groupe peut décrire la manière dont sa collation fonctionne. »

Comprendre et distinguer règle écrite, pratique observée, règle opérationnelle validée. Ne jamais transformer une pratique locale en interdiction universelle. Prévoir exception/habilitation/quorum/trace/régularisation lorsque l’intégrité le permet.

## Architecture
Une activité métier = une autorité canonique. Les `CAPABILITY_WORKSPACES` offrent un dossier opérationnel transversal, mais ne remplacent jamais Ledger, Membership, auth, paiement ou autres moteurs spécialisés.

## Sécurité
`realMoneyEnabled=false`. Pas de secret/PII brut dans Git. Pas de migration destructive. Pas de force-push `main`. Pas d’activation fournisseur/paiement réel sans autorisation distincte.

## Clôture obligatoire
Tests → Project State → Feature Registry → Current Truth/Truth Ledger → NEXT_RUN → Recall/CIR → BIR+ → bloc ÉTAT DU PROJET.

Lire aussi le supplément Cahier App 1.1 et la décision rubriques/parts/pots du CIR du 12 septembre. Le document des vingt innovations est un plan de reprises limitées ; ne pas toutes les activer implicitement.
