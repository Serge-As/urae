> Checkpoint 2026-10-08 : publication HOLD au SHA 5ee23e8. Ne pas annoncer 1.5.2.15 livrée ; conserver l'échec de reconfirmation du run 37822250394. La reprise exige une preuve de causalité horloge/confrontation, puis les qualifications complètes et le smoke exact. Voir CURRENT_TRUTH et CIR-2026-10-08-BOUNDED-TRANSPORT-RECOVERY.

# AGENTS.md — Eco-System, vérité et reprise

## Mission
Continuer Eco-System sans recommencer, simplifier ou remplacer silencieusement les acquis.

## Vérité de reprise au 8 octobre 2026
- production attestée : `1.5.2.14-live-sync`, SHA `d027f09a1382cd29054b33e274f3fd3bf9f8d9f3`, livraison GitHub Actions `37765653486 SUCCESS` ;
- branche de livraison active : `fix/1.5.2.10-offline-conflicts-loans-20261003` ;
- candidate de travail : `fix/transport-recovery-bounded-20261008`, version `1.5.2.15-bounded-recovery`, qualifiée 650/650 Node + Chromium 8/8 + WebKit 6/6, PR #71 fusionnée ; déploiement à vérifier ;
- autorités de version et preuve : `docs/release/CURRENT_RELEASE_CONTRACT.json`, `docs/memory/CURRENT_TRUTH.md` et `docs/memory/PROJECT_TRUTH_LEDGER.json` ;
- schéma/D1/R2 préexistants conservés ; `realMoneyEnabled=false`, `FIELD_ACCEPTED=NOT_ACCEPTED` ;
- l'audit du 8 octobre documente un vrai défaut de polling de reprise et les capacités encore planifiées/externes. Le registre de modules ne vaut pas recette complète.

## Préférence persistante du fondateur
À la fin de chaque réponse de travail, préciser la consommation de crédits si elle est mesurable. Ne jamais inventer un coût exact : solde et quotas partagés ne mesurent pas le coût du chat. Indiquer explicitement l'absence d'une mesure exacte lorsque c'est le cas.

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

## Ligne historique production 1.4.1 — 2026-09-20
- branche de travail : `next/1.4.1-field-integrity-guardrails-20260919` ;
- runtime courant : `1.4.1-field-integrity-home-sessions` ;
- production 1.4.1 vérifiée sur le SHA exact `024b9837b6fa577c0c2c39297c2ce672f7d130b3` ;
- Accueil et Séances sont des **projections/cockpits**, jamais de nouvelles autorités financières ;
- ReceivablesService impose la confidentialité des dettes membre au niveau service ;
- MeetingService est owner du contexte séance, présence et déclaration de bénéficiaire ;
- KERNEL.EVIDENCE porte la preuve immuable de réception ;
- un code ECO-RCP identifie une preuve mais n'accorde aucun droit ;
- suppression historique d'un membre/rubrique se traduit par lifecycle/archivage si une trace métier doit être conservée.

## Ligne historique candidate 1.4.2 — séparation UX et Blueprint exécutable

Branche :
`next/1.4.2-operational-center-sessions-blueprint-20260920`

Runtime candidat :
`1.4.2-operational-center-sessions-blueprint`.

Invariants supplémentaires :
- l'ancien `view-operations` est le **Centre opérationnel** et son contenu historique reste préservé ;
- le vrai `view-sessions` est centré sur une réunion ;
- aucune présence ne doit être persistée dans un second workspace générique : utiliser MeetingService ;
- la page Séances ne devient jamais un second éditeur financier ;
- Blueprint : `Prévision != Demande != Engagement != Transaction` ;
- tous les workflows Blueprint démarrent sans engagement financier ;
- Group Buy doit déléguer au moteur Group Buy existant ;
- fora/communautés utilisent les moteurs existants ;
- Financial Lab n'émet aucun verdict légal ;
- Eco Route / Backhaul / Return Load est exclu du périmètre Eco-System.

## Historique production 1.4.3 / Blueprint 5.0.0 — 2026-09-21
- ligne active : `next/1.4.3-blueprint-5-0-0-finalization-20260921`
- version publique : `1.4.3-blueprint-5-0-0-finalized`
- source déployée : `96b8f41467af476b12179b786d7d8f140ef86ce7`
- Worker Version ID : `07939344-ceca-4578-bc3b-3d1d589ad7eb`
- production workflow : `35560714108 SUCCESS`
- 265/265 tests PASS ; D1/R2 réutilisés ; realMoney=false.
- Blueprint 5.0.0 orchestre six couches ; il ne devient owner d’aucune transaction.
- Forums/Hubs restent `COMMUNITY.FORUM` / `COMMUNITY.PRO_HUBS`; Group Buy reste `MARKETPLACE.GROUP_BUY`; Partners reste le moteur programmes existant.
- PWA 1.4.3 : scripts/styles network-first `cache:no-store`; aucun retour volontaire au cache v142.
- Backhaul / Return Load / Eco Route est un projet distinct, interdit dans ce repo sauf décision explicite future.

