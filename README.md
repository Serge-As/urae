# Eco-System — 1.1.2 locale
> **Développement du produit existant :** dépôt privé `Serge-As/urae`, dépôt public auxiliaire `Serge-As/utrae`. Voir [procédure de reprise et CI Windows privée](docs/operations/ECO_REPRISE_SERGE_AS.md). Aucun frontend, backend, module métier ou service de production ne doit être remplacé pour économiser des minutes.


Livraison du 13 septembre 2026 : sessions authentifiées, isolation des groupes,
encaissements atomiques, relevés individuels, contrepassations, matrice et outbox durable.
Qualification locale : 65 tests réussis. La plateforme complète du cahier reste en cours.

Pour lancer la version précompilée avec Node 24, lire [LISEZ_MOI_LIVRAISON.md](LISEZ_MOI_LIVRAISON.md).
Pour les preuves et limites : [QUALIFICATION.md](QUALIFICATION.md),
[audit](delivery-audit/AUDIT_ET_LIVRAISON_2026-09-12.md), [état actuel](docs/memory/CURRENT_TRUTH.md).
Aucun déploiement distant effectué par cette reprise. Ne pas écraser la production 1.1
sans rapprocher les identités historiques et qualifier le fonctionnement Workers.
La branche distante 1.1 a été récupérée et comparée.
Rubriques personnalisées, simulation indépendante et programmation de chaque part sont ajoutées.
Plan détaillé des vingt innovations : docs/roadmap/PLAN_20_INNOVATIONS_ET_REPRISE_2026-09-13.md.

## Documentation historique de la sauvegarde 1.0

Current product line: `1.0.0-complete-app`.

Eco-System is a mobile-first PWA for associations, tontines and community economies. The visible product is no longer the old Alpha UI. It exposes canonical group/meeting/ledger/discovery/rubric flows plus a searchable catalogue of the whole project.

- App: `https://eco-system.sergemimf.workers.dev/`
- Health: `https://eco-system.sergemimf.workers.dev/health`
- Real money: **disabled**.
- Doctrine: Living Rules — written rule, observed practice, validated operational rule.
- Prompt: `docs/prompts/ECO_SYSTEM_PROMPT_MAITRE_CODEX_LIVRAISON_COMPLETE_1.0.0.md`

Statuses are explicit: canonical core, workspace operational, sandbox operational, hardening required.
