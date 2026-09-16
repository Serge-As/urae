# AGENTS.md — Eco-System 1.3.1 Recovery / Recap / Services

## Mission
Continuer Eco-System sans recommencer, simplifier ou remplacer silencieusement les acquis.

### Vérité courante
- production publique qualifiée : `1.2.0-functional-completion`;
- développement courant : `next/1.3.1-recovery-recap-services-20260915`;
- Premium Live : pilote isolé qualifié, pas encore activé sur la production publique ;
- argent réel : `realMoneyEnabled=false`.

## MEMORY BEFORE CODE
Avant tout lot substantiel, lire dans cet ordre :
1. `AGENTS.md` ;
2. `docs/memory/CURRENT_TRUTH.md` ;
3. `docs/memory/PROJECT_TRUTH_LEDGER.json` ;
4. `PROJECT_STATE.md` ;
5. `docs/constitution/ECO_SYSTEM_Cahier_des_Charges_Maitre_Exhaustif_3.0.0_2026-09-16.md` ;
6. `docs/economics/ECO_SYSTEM_Modele_Economique_AdManager_Intelligence_3.0.0_2026-09-16.md` ;
7. `docs/governance/ECO_SYSTEM_LIVING_RULES_DOCTRINE_1.0.0.md` ;
8. `FEATURE_REGISTRY.yaml` ;
9. `NEXT_RUN.md` ;
10. CIR/ADR/Recall pertinents ;
11. vérifier le HEAD distant et les derniers runs GitHub avant de coder.

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
