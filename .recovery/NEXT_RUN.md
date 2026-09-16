# ECO-SYSTEM — NEXT RUN

Date : 2026-09-16

## Lecture obligatoire avant toute modification
1. `AGENTS.md`
2. `docs/memory/CURRENT_TRUTH.md`
3. `PROJECT_STATE.md`
4. `docs/memory/PROJECT_TRUTH_LEDGER.json`
5. `docs/constitution/ECO_SYSTEM_Cahier_des_Charges_Maitre_Exhaustif_3.0.0_2026-09-16.md`
6. `docs/economics/ECO_SYSTEM_Modele_Economique_AdManager_Intelligence_3.0.0_2026-09-16.md`
7. `FEATURE_REGISTRY.yaml`
8. derniers runs GitHub de la branche.

## Branche de reprise
`next/1.3.1-recovery-recap-services-20260915`

Toujours prendre le HEAD distant le plus récent ; ne jamais repartir de la 1.2 pour le développement courant.

## Ne pas confondre
- production publique : 1.2 qualifiée ;
- développement : 1.3.1 ;
- Premium Live : pilote isolé qualifié ;
- aucune autorisation n'a été donnée dans ce lot pour déployer 1.3.1 sur le Worker public.

## Acquis — ne pas refaire
- 10 étapes création ;
- Collation ;
- multi-tontines indépendantes ;
- RubricDefinition/policies ;
- Rule Architect avec contradictions ;
- Tontine Manager permanent ;
- preuve Ledger avant SERVED ;
- loans CAPITAL_FIRST/INTEREST_FIRST, pas d'intérêt sur intérêt ;
- savings-yield par dépôt et distribution exacte ;
- RECAP financier/session/carryover ;
- Secours par membre + autres fonds reportables ;
- outbox Live + replay >500 ;
- Premium Live pilote end-to-end vert ;
- CNI matching HMAC ;
- profil économique groupe/rubrique pseudonymisé ;
- AdManager spécialisé ;
- demande agrégée / supplier ranking / unit economics ;
- Forum et communautés ;
- Partners/ONG spécialisés avec share packs expirants/révocables.

## Prochains lots recommandés
1. UX complète RECAP/Cassation et persistance des modèles de clôture.
2. Deals/Offers/Negotiation et Demand Exchange avec persistance.
3. Economic Control Center + Analytics Engine optionnel.
4. Forum avancé.
5. Programmes ONG avancés et annuaire partenaires multi-groupes.
6. notifications/connecteurs.
7. tests terrain seniors/2G/Android anciens.
8. seulement avec autorisation explicite : préparation + backup + déploiement public 1.3.1.

## Interdictions
- ne pas recréer `eco-system-db`;
- ne pas réintroduire une cotisation nominale globale ;
- ne pas réduire le parcours 10 étapes ;
- ne pas utiliser une CNI brute dans pub/analytics ;
- ne pas exposer de finance individuelle à partenaires/ONG ;
- ne pas laisser BETA_OPEN écraser un OFF explicite ;
- ne pas créer de second Ledger ;
- ne pas capitaliser automatiquement les intérêts impayés ;
- ne pas activer l'argent réel ;
- pas de migration destructive ;
- pas de force-push/merge main sans décision.

## Checkpoint anti-interruption
Après chaque 3–5 sous-lots significatifs : commit + CI + Current Truth/NEXT_RUN si la vérité change.
Aucune décision critique ne doit rester uniquement dans un chat.
