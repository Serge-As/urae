# Eco-System — Prompt maître de reprise pour nouveau chat / Codex

Tu reprends le projet **Eco-System** de Delor85. Ne repars jamais de zéro et ne demande jamais au fondateur de recréer un acquis sans preuve qu'il a disparu.

## Références obligatoires à lire avant toute modification
1. `AGENTS.md`
2. `docs/memory/CURRENT_TRUTH.md`
3. `docs/memory/PROJECT_TRUTH_LEDGER.json`
4. `PROJECT_STATE.md`
5. `NEXT_RUN.md`
6. `FEATURE_REGISTRY.yaml`
7. `docs/recovery/ECO_SYSTEM_PROCEDURE_SAUVEGARDE_REPRISE_COMPLETE_APP_2026-09-13.md`
8. le Cahier Maître effectivement présent et vérifiable dans le dépôt / bibliothèque
9. `docs/governance/ECO_SYSTEM_LIVING_RULES_DOCTRINE_1.0.0.md`
10. les Recall/CIR pertinents.

Ensuite exécute :
`npm run memory:recall -- "<chantier courant>" --write`
puis :
`npm run ci`

## Vérité produit à préserver
- Produit : Eco-System, plateforme de gestion de tontines, associations et communautés.
- Architecture canonique : PWA TypeScript + Cloudflare Worker + D1 derrière `PlatformRepository`.
- Worker : `eco-system`.
- Base distante canonique : **exclusivement `eco-system-db`** sauf ADR explicite futur.
- URL publique : `https://eco-system.sergemimf.workers.dev/`.
- `realMoneyEnabled=false` demeure obligatoire jusqu'à autorisation explicite séparée.
- `main` ne doit jamais être force-pushé.
- migrations D1 additives uniquement.
- les anciennes branches/checkpoints Recovery/Alpha/0.6/1.0 sont des sauvegardes à conserver.

## Doctrine métier obligatoire — Living Rules
Principe fondateur : « Voilà comment un groupe peut décrire la manière dont sa collation fonctionne. »

L'application doit distinguer :
- règle écrite ;
- pratique réellement observée ;
- règle opérationnelle validée ;
- exceptions ;
- autorités et délégations ;
- quorum/approbations ;
- preuves et notifications ;
- appel/régularisation.

Ne jamais transformer la pratique d'un seul groupe en interdiction universelle. Interdire uniquement les véritables invariants de sécurité, confidentialité, intégrité comptable, isolation multi-tenant ou autorisation.

## Modèle financier à préserver
- caisse physique XAF non négative et entière ;
- dette/manquant membre séparé de la caisse physique ;
- attendu, encaissé membre, manquant/dette, couverture solidaire, décaissement bénéficiaire et solde de rubrique sont des flux distincts ;
- la clôture d'une séance est un checkpoint versionné, pas une tombe irréversible ;
- une opération tardive peut être acceptée si la règle validée du groupe l'autorise et si ses conditions de gouvernance sont satisfaites ;
- offline financier = intention en attente, jamais finalité fictive.

## UX / périmètre visible attendu
Le shell visible doit être le **Master Cockpit**, pas l'ancienne Alpha. Il doit donner accès, avec statut honnête, aux domaines :
- création/intégration/transformation de groupe ;
- Discovery / Identity / Membership ;
- Meeting Command Center ;
- Living Rules / rubriques ;
- Ledger / prêts / épargne / solidarité / impayés ;
- communauté / forum / chat / gouvernance / mandats / votes ;
- marketplace / fournisseurs / achats groupés / Business Studio / partenaires ;
- AdManager ;
- Academy / ONG / IA assistée / anti-arnaque / documents / Paper Bridge ;
- rapports / recherche / calendrier / notifications / géolocalisation consentie ;
- sécurité / auth / MFA / audit / compatibilité / offline / BIR+ / PRA ;
- catalogue de toutes les capacités avec leur vrai statut.

Une capacité `STRUCTURAL_V1` peut avoir un workspace persistant et une UI de préparation, mais ne doit jamais être présentée comme moteur finalisé. Préserve l'autorité canonique : un besoin métier = un service maître ; les interfaces et variantes réutilisent ce service au lieu de dupliquer le moteur.

## Priorités de développement après restauration de l'interface correcte
1. vérifier que le navigateur/PWA reçoit bien la dernière release et ne reste pas bloqué sur une ancienne cache ;
2. continuer à transformer les capacités `STRUCTURAL_V1` prioritaires en moteurs métier fonctionnels ;
3. approfondir Discovery bidirectionnel et Membership ;
4. renforcer Group Launch / modèles / rubriques / gouvernance ;
5. enrichir Meeting Command Center et finances sans casser le Ledger canonique ;
6. implémenter progressivement communauté, marketplace, partenaires, achats groupés, AdManager, Academy, ONG, Paper Bridge et rapports ;
7. auth/session/MFA pour rôles sensibles ;
8. tests multi-tenant hostiles ;
9. PRA D1 backup/restore ;
10. tests Android ancien / faible débit / offline ;
11. pilote contrôlé avant toute décision de production financière.

## Procédure de livraison
Pour chaque lot :
1. lire la vérité courante et les dépendances ;
2. écrire/mettre à jour Recall/CIR si nécessaire ;
3. modifier sans supprimer les acquis ;
4. exécuter `npm run ci` ;
5. déployer seulement via les workflows autorisés ;
6. réutiliser `eco-system-db` ;
7. vérifier `/`, `/health`, `/api/v1/product/capabilities` et le marqueur de release ;
8. mettre à jour Current Truth, Truth Ledger, Project State, NEXT_RUN et la PR ;
9. créer un BIR+ reconstructible ;
10. télécharger et vérifier l'archive ;
11. sauvegarder la copie persistante sous `/Eco-System/` ;
12. donner au fondateur l'URL publique et un état de reprise complet.

## Format obligatoire de fin d'étape
Version ; Branche ; Commit ; État GitHub/PR ; État Cloudflare ; D1 ; migrations ; URL ; problème traité ; cause ; correction ; fichiers modifiés ; tests ; résultats ; acquis ; reste à faire ; à ne pas modifier ; point de reprise ; régression possible ; BIR+ ; autorisation nécessaire avant toute action non couverte.

Ne prétends jamais que toute l'application est terminée sans preuve de statut par capacité. En revanche, tout ce qui est déjà acquis et vérifié doit rester présent et accessible.
