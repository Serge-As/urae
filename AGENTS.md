# AGENTS.md — Eco-System 1.4.1 Production / Field Integrity / Master 2.3.4

## Mission
Continuer Eco-System sans recommencer, simplifier ou remplacer silencieusement les acquis.

### Vérité courante
- production publique qualifiée : `1.4.1-field-integrity-home-sessions` ;
- lignée de production : `next/1.4.1-field-integrity-guardrails-20260919` ;
- branche de travail courante : `next/1.4.1-field-integrity-guardrails-20260919` ;
- source déployée : `024b9837b6fa577c0c2c39297c2ce672f7d130b3` ;
- Worker Version ID : `d4e56867-077c-47cd-bfc9-9aba4735d596` ;
- qualification du SHA déployé : run `35488899790` SUCCESS ;
- qualification + déploiement + smoke + BIR+ pré/post : run `35488899806` SUCCESS ;
- Premium Live : actif en production 1.4.1 ;
- argent réel : `realMoneyEnabled=false`.

## MEMORY BEFORE CODE
Avant tout lot substantiel, lire dans cet ordre :
1. `AGENTS.md` ;
2. `docs/memory/CURRENT_TRUTH.md` ;
3. `docs/memory/PROJECT_TRUTH_LEDGER.json` ;
4. `PROJECT_STATE.md` ;
5. `docs/constitution/ECO_SYSTEM_Cahier_des_Charges_Maitre_Exhaustif_3.2.0_2026-09-16.md` + socle constitutionnel 2.3.4 ;
6. `docs/economics/ECO_SYSTEM_Modele_Economique_AdManager_Approfondi_3.2.0_2026-09-16.md` ;
7. `docs/governance/DELOR85_DEUX_CONVENTIONS_FONDATRICES_UNIVERSELLES_1.0.0.md` ;
8. `docs/governance/ECO_SYSTEM_LIVING_RULES_DOCTRINE_1.0.0.md` ;
9. `FEATURE_REGISTRY.yaml` ;
10. `NEXT_RUN.md` ;
11. CIR/ADR/Recall pertinents ;
12. vérifier le HEAD distant et les derniers runs GitHub avant de coder.

Un prompt, une capture ou un résumé n'est jamais la totalité du besoin. **Absence visible ≠ suppression autorisée.**

## Contrats anti-régression
Ne pas supprimer ou réduire :
- les dix étapes de création ;
- Collation ;
- multi-tontines ;
- participants distincts par tontine ;
- Living Rules ;
- Ledger canonique ;
- outbox/offline ;
- RECAP financier et de séance ;
- fonds reconduits ;
- Tontine Manager ;
- savings yield par dépôt ;
- CNI matching protégé ;
- communautés/Forum ;
- Marketplace ;
- AdManager ;
- Partners/ONG ;
- Premium Live qualifié.

## Doctrine métier
> « Voilà comment un groupe peut décrire la manière dont sa collation fonctionne. »

Distinguer :
- règle écrite ;
- pratique observée ;
- règle opérationnelle validée ;
- exception.

Ne jamais convertir automatiquement une pratique locale en interdiction universelle.

## Deux conventions universelles obligatoires
- **Autorité canonique** : une capacité métier significative possède un seul propriétaire de vérité. Toute autre surface délègue, projette ou consomme cette vérité ; elle ne la duplique pas.
- **Reuse Before Build** : réutiliser, étendre ou adapter le propriétaire canonique avant de créer un service, moteur, base ou workflow parallèle. Une nouvelle autorité exige une justification CIR/ADR et une preuve de non-duplication.
- Source normative : `docs/governance/DELOR85_DEUX_CONVENTIONS_FONDATRICES_UNIVERSELLES_1.0.0.md` + `SHARED_GUARDRAIL_REGISTRY.json`.
- Portée : tous les projets actuels et futurs du fondateur ; adoption additive, jamais prétexte à une réécriture régressive.

## Architecture
Une activité métier = une autorité canonique.
- finance : Ledger/D1 canonique ;
- Live : coordination/projection, jamais second solde ;
- partenaires/ONG : agrégats pseudonymisés, jamais finance individuelle ;
- analytics : observation, jamais autorité transactionnelle.

## Données
L'utilisation de données financières agrégées au niveau `ECO-GRP-...` est permise lorsqu'elle est gouvernée.
Interdiction de ciblage publicitaire individuel par :
- dette ;
- solde ;
- prêt ;
- CNI ;
- santé ;
- litige ;
- identité brute.

Un OFF explicite de consentement/préférence l'emporte toujours sur BETA_OPEN.

## Finance
- les seules surfaces normales de saisie financière membre sont **Votre feuille de séance** et **Vos fiches individuelles** ;
- toute rubrique créée et non archivée doit apparaître sur les deux feuilles ; le nombre de rubriques appartient au groupe (1, 20, 40 sont des scénarios valides ; plafond technique actuel du validateur de lancement : 100) ;
- les rubriques Prêt / Remboursement / Remboursement intérêts utilisent le moteur canonique du prêt depuis ces feuilles ;
- le capital restant dû génère l'intérêt de chaque nouvelle période tant qu'il est > 0 ;
- un remboursement partiel réduit l'assiette du mois suivant ;
- les intérêts impayés restent séparés et ne produisent jamais d'intérêt sur intérêt ;
- le groupe choisit **CAPITAL_FIRST** ou **INTEREST_FIRST** ;
- si la politique l'exige, aucun nouveau prêt tant que capital + intérêts du précédent ne sont pas apurés ;
- pas d'intérêt sur intérêt dans le modèle courant ;
- une part Tontine SERVED exige une preuve Ledger ;
- distribution d'intérêts Épargne calculée dépôt par dépôt ;
- somme distribuée = exactement le pool validé ;
- correction RECAP manuelle = ajustement tracé, pas destruction de la valeur source.

## Sécurité
- pas de secret/PII brut dans Git ;
- migrations additives ;
- pas de force-push/merge `main` sans décision ;
- ne pas recréer `eco-system-db` ;
- ne pas activer argent réel sans autorisation et qualification distinctes.

## Checkpoint anti-interruption
Un chat peut s'arrêter sans prévenir. Pour rendre cela sans conséquence :
- après 3–5 sous-lots ou tout changement d'architecture : commit ;
- laisser CI s'exécuter ;
- si la vérité change : mettre à jour Current Truth/Truth Ledger/NEXT_RUN ;
- ne jamais garder une décision critique uniquement dans le chat ;
- avant une longue phase : préférer plusieurs commits atomiques à un énorme commit final.

## Clôture obligatoire d'un jalon
Tests → Project State → Feature Registry → Current Truth/Truth Ledger → NEXT_RUN → CIR/Recall si besoin → BIR+ → bloc **ÉTAT DU PROJET APRÈS ÉTAPE**.

## Ligne production 1.4.1 — 2026-09-20
- branche de travail : `next/1.4.1-field-integrity-guardrails-20260919` ;
- runtime courant : `1.4.1-field-integrity-home-sessions` ;
- production 1.4.1 vérifiée sur le SHA exact `024b9837b6fa577c0c2c39297c2ce672f7d130b3` ;
- Accueil et Séances sont des **projections/cockpits**, jamais de nouvelles autorités financières ;
- ReceivablesService impose la confidentialité des dettes membre au niveau service ;
- MeetingService est owner du contexte séance, présence et déclaration de bénéficiaire ;
- KERNEL.EVIDENCE porte la preuve immuable de réception ;
- un code ECO-RCP identifie une preuve mais n'accorde aucun droit ;
- suppression historique d'un membre/rubrique se traduit par lifecycle/archivage si une trace métier doit être conservée.

