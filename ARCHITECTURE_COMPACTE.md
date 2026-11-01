# Entrée obligatoire pour contribuer à Eco System

Lire ce fichier et le début de CURRENT_TRUTH avant toute modification. Ouvrir ensuite seulement les règles du domaine touché, le CIR courant et le propriétaire canonique. Lire les constitutions complètes au premier travail sur un domaine inconnu ou en cas de conflit ; ne pas les réécrire pour un micro-correctif.

## Invariants bloquants

- Une capacité possède un propriétaire canonique. Réutiliser, étendre ou adapter avant de construire.
- Ledger/D1 seul possède la vérité financière. UI, Live, cache, documents et recherche sont des projections datées.
- Les deux feuilles sont les surfaces normales de saisie ; les autres vues renvoient vers elles.
- Une correction remplace le montant absolu ; elle ne l’ajoute pas. Historique, auteur et version restent traçables.
- Une intention offline durable ne devient confirmée qu’après ACK du serveur. Ne jamais purger les brouillons/outbox pour réparer un écran.
- Un contrôle indépendant ne modifie aucun montant et ne supprime pas les réserves des autres.
- Les droits sont contrôlés côté service. Les vues personnelles restent isolées par acteur, tenant et groupe.
- Prêt : capital/intérêts séparés, ordre défini par la politique, pas d’intérêt sur intérêt.
- Épargne : répartition par dépôt ; somme distribuée exactement égale au pool en XAF entiers.
- Tontine SERVED exige preuve Ledger ; participants et parts propres à chaque tontine.
- Règle écrite, pratique observée et règle opérationnelle validée restent distinctes.
- Toute rubrique active reste dans les deux feuilles. Collation et fonds reconduits ne disparaissent pas.
- Association/Tontine First ; visibilité réduite ne vaut pas désactivation de service.
- Aucune donnée réelle, session, secret ou sauvegarde brute dans Git ou artefact public.
- realMoneyEnabled=false et FIELD_ACCEPTED=NOT_ACCEPTED jusqu’aux autorisations et preuves distinctes.

## Travail requis

1. Décrire l’effet attendu, ce qui doit rester et le propriétaire dans un CIR.
2. Trouver les règles applicables dans docs/governance/CONTRIBUTION_RULES.json.
3. Ajouter une preuve de comportement pour chaque risque nouveau ; conserver les tests acquis.
4. Exécuter lint:contribution et les scénarios du domaine, puis les contrôles complets du SHA de livraison.
5. Mettre à jour les faits changés une fois au jalon ; un checkpoint local ne demande pas un push/CI complet.
6. La publication exige même SHA qualifié, sauvegarde restaurable, santé/cache/assets concordants.

## Références ciblées

- Principes : docs/governance/DELOR85_DEUX_CONVENTIONS_FONDATRICES_UNIVERSELLES_1.0.0.md
- Règles locales : docs/governance/ECO_SYSTEM_LIVING_RULES_DOCTRINE_1.0.0.md
- Finance : packages/domain/src/index.ts, packages/member-control/src/index.ts, packages/meeting-live-consensus/src/index.ts
- Stockage : packages/repositories/src/index.ts ; migrations additives sous cloudflare/migrations
- Connexion/offline : packages/application, packages/offline ; aucune seconde identité.
- Exercice : packages/exercise et packages/savings-yield ; clôture et versement sont distincts.
- UI : apps/web/src ; composants canoniques et liens par ID, pas par nom.
- Conditions de livraison : docs/release/CURRENT_RELEASE_CONTRACT.json
- Programme acquis : docs/implementation/EIGHT_LOTS_2026-10-30.md ; 28 lots/92 propositions conservés.

Les anciens incidents ne sont pas effacés. Les textes détaillés restent accessibles et font autorité sur leur périmètre. Une exception explicite du fondateur est tracée dans le CIR ; aucune dérogation implicite d’un développeur.
