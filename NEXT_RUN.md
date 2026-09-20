# ECO-SYSTEM — NEXT RUN

## CURRENT OVERRIDE — 1.4.2 PWA visibility hotfix (2026-09-20)

Current production source: `a9fe00f94daa7a6787d5a4440a5edc0bc5e4a1c8` on `next/1.4.2-operational-center-sessions-blueprint-20260920`.

Verified evidence:
- qualification exact production SHA: `35499693852 SUCCESS`;
- deploy + smoke + pre/post BIR+: `35499693884 SUCCESS`;
- pre artifact: `10602035551`;
- post artifact: `10602215385`;
- runtime version remains `1.4.2-operational-center-sessions-blueprint`;
- real money remains OFF.

The hotfix only activates the already-defined Service Worker update path so a previously stale 1.4.1 PWA shell can converge to deployed 1.4.2. Do not change D1, Ledger, business rules, cache identity or release identity to address this issue.

Next normal action:
1. founder field reception on the real phone/browser;
2. confirm visible **Centre opérationnel** + separate **Séances**;
3. exercise the 8 Sessions sections;
4. test Blueprint DRAFT → human validation → ACTIVE with no silent transaction;
5. convert every reproducible defect into a permanent test before a targeted correction.

Do not redeploy merely because this document changed.

---


Date : 2026-09-20

## Lecture obligatoire
1. `AGENTS.md`
2. `docs/memory/CURRENT_TRUTH.md`
3. `PROJECT_STATE.md`
4. `docs/memory/PROJECT_TRUTH_LEDGER.json`
5. socle constitutionnel **2.3.4**
6. `docs/constitution/ECO_SYSTEM_Cahier_des_Charges_Maitre_Exhaustif_3.2.0_2026-09-16.md`
7. `docs/memory/recalls/RECALL-2026-09-17-master-2.3.4-closure.md`
8. `docs/change-impact/CIR-2026-09-17-master-2.3.4-closure.md`
9. `FEATURE_REGISTRY.yaml`
10. derniers runs GitHub et état Cloudflare réel.

## Branche de reprise
`next/1.4.2-operational-center-sessions-blueprint-20260920`

Toujours récupérer le HEAD distant réel avant toute modification.

## Production actuelle
- version : **1.4.2-operational-center-sessions-blueprint**
- source déployée : `61a6d83ac5793bb5fecac7ba77a7bd4149031e27`
- Worker Version ID : `b54df0a5-2338-4e37-8b4d-a05351b43658`
- production + smoke + BIR+ pré/post : **35497930031 SUCCESS**
- qualification du SHA déployé : **35497930024 SUCCESS**
- tests : **264/264 PASS**
- D1 : `eco-system-db` réutilisée ; **No migrations to apply**
- R2 : `eco-system-backups` ; pré/post BIR+ restaurés, checksummés et remirrored
- Premium Live / Founder Control / Community Realtime / R2 : actifs/bound
- `realMoneyEnabled=false`.

## Invariants à ne plus casser
- seules **Votre feuille de séance** et **Vos fiches individuelles** sont les surfaces normales de saisie financière membre ;
- toute rubrique créée et non archivée apparaît dans les deux feuilles ;
- 20 rubriques n'est pas une règle : 1 et 40 sont testées ; le plafond 100 est une limite technique de lancement, pas une décision métier du groupe ;
- Prêt / Remboursement / Remboursement intérêts restent des rubriques des feuilles ;
- le capital restant génère l'intérêt de chaque nouvelle période ; un remboursement partiel réduit l'assiette suivante ;
- intérêts impayés séparés, jamais capitalisés ;
- deux politiques officielles : `CAPITAL_FIRST` et `INTEREST_FIRST` ;
- si la politique le demande, nouveau prêt impossible avant apurement capital + intérêts ;
- un membre simple voit sa propre fiche et ses propres prêts, jamais ceux d'un autre membre ;
- Ledger D1 canonique unique ; Live reste projection/coordination.

## Exemple de contrôle permanent
50 000 XAF à 5 %, paiements 0 / 30 000 / 20 000 :
- Capital d'abord → fin mois 3 : capital 0, intérêts 6 000 ; mois 4 : 6 000 à payer, sans nouvel intérêt.
- Intérêts d'abord → fin mois 3 : capital 6 250 ; mois 4 : intérêt théorique 312,5, arrondi entier XAF actuel 313 ; total 6 563.

## Prochain chantier
**Recette terrain production 1.4.0, puis corrections ciblées uniquement.**
1. créer/tester groupe avec un nombre choisi de rubriques ;
2. vérifier la même liste dans les deux feuilles ;
3. vérifier compte membre simple et confidentialité ;
4. saisir Prêt, remboursement capital, remboursement intérêts depuis les feuilles ;
5. comparer les deux systèmes puis valider la politique du groupe ;
6. faire vivre un prêt sur plusieurs séances et confronter la matrice réelle ;
7. transformer chaque défaut observé en test permanent.

## Anti-interruption
Commit atomique → CI exacte → Truth → BIR+ avant production → smoke → BIR+ post-production. Ne jamais déclarer « terminé » si le site public n'a pas reçu le SHA concerné.


## Point de reprise immédiat — tranche terrain ciblée

Continuer exclusivement depuis `next/1.4.0-master-2.3.4-closure-20260917`.

Ordre obligatoire :
1. conserver le périmètre ciblé de la tranche 6 ;
2. obtenir CI verte sur le HEAD documentaire final ;
3. lancer BIR+ ;
4. déployer la même ligne 1.4.0 ;
5. smoke production : deux feuilles visibles, pop-up cellule, Membres & habilitations, Back-office, Tontines / montant total du pot, matrice Prêt ;
6. BIR+ de fermeture puis mise à jour de la vérité de production.

## Reprise 1.4.1 — 2026-09-20

La branche active et production courante est :
`next/1.4.1-field-integrity-guardrails-20260919`.

Version :
`1.4.1-field-integrity-home-sessions`.

Production vérifiée :
- source : `024b9837b6fa577c0c2c39297c2ce672f7d130b3` ;
- Worker : `d4e56867-077c-47cd-bfc9-9aba4735d596` ;
- qualification : `35488899790 SUCCESS` ;
- déploiement + smoke + BIR+ pré/post : `35488899806 SUCCESS`.

Ordre obligatoire suivant :
1. terminer le BIR+ de fermeture du checkpoint documentaire post-déploiement ;
2. faire la recette terrain Bureau puis membre ;
3. tester correction 2 000 → 5 000 + revue indépendante ;
4. tester présence et bénéficiaire + confirmation/papier/photo ;
5. vérifier qu'un membre simple ne voit que ses propres dettes ;
6. couper le réseau après synchronisation et vérifier la dernière copie connue ;
7. tester la dictée en environnement réellement bruyant ;
8. tester la matrice Prêt avec un utilisateur senior ;
9. transformer tout défaut reproductible en test permanent avant correction.

Ne pas rouvrir les moteurs déjà qualifiés sans défaut reproductible. Le smoke production ne vaut pas recette terrain.

## Checkpoint de fermeture acquis
- checkpoint : `4edf2dcb27c54303becce71ac9bd5b7db2c50496`
- CI : `35489112828 SUCCESS`
- BIR+ fermeture : `35489112862 SUCCESS`
- artifact : `10598209553`
- R2 final : `birplus/1.4.1/4edf2dcb27c54303becce71ac9bd5b7db2c50496/final/`

Reprendre directement par la recette terrain 1.4.1 ; ne relancer ni D1 ni déploiement sans défaut reproductible.

## Reprise 1.4.2 — production vérifiée, recette terrain à faire

Branche :
`next/1.4.2-operational-center-sessions-blueprint-20260920`

Version :
`1.4.2-operational-center-sessions-blueprint`

Preuves production :
- source déployée : `61a6d83ac5793bb5fecac7ba77a7bd4149031e27` ;
- qualification : `35497930024 SUCCESS` ;
- deploy/smoke/BIR+ pré/post : `35497930031 SUCCESS` ;
- Worker Version ID : `b54df0a5-2338-4e37-8b4d-a05351b43658` ;
- 264/264 tests ;
- aucune migration D1 à appliquer ;
- BIR+ pré/post R2 : PASS ;
- argent réel : OFF.

Ordre obligatoire suivant :
1. BIR+ de fermeture 1.4.2 **ACQUIS** : run `35498239942 SUCCESS`, artifact `10601038586`, R2 `birplus/1.4.2/d1a69bb5c904268d5f16fc2421e2246154000598/final/` PASS ;
2. recette terrain sur le téléphone du fondateur : distinguer visuellement **Centre opérationnel** et **Séances** ;
3. parcourir les huit sections Séances : vue d'ensemble, feuille, présence, bénéficiaires/preuves, obligations/impayés, caisse, actions/PV/historique selon les droits ;
4. confirmer la lisibilité des onglets/navigation mobile sans disparition de fonctionnalité ;
5. vérifier qu'une présence saisie depuis les parcours disponibles aboutit toujours à MeetingService ;
6. tester le Blueprint : brouillon → validation humaine → owner canonique, sans création silencieuse de transaction ;
7. tester les presets Forum/Communautés ;
8. tester le Financial Lab sur plusieurs scénarios et vérifier l'absence de verdict automatique ;
9. vérifier que les acquis 1.4.1 restent intacts : deux feuilles, correction indépendante, confidentialité membre, preuves bénéficiaire, offline, prêts/intérêts ;
10. pour chaque défaut reproductible : test permanent → correction ciblée → CI → vérité → sauvegarde.

Ne pas déclarer FIELD_ACCEPTED à partir du smoke seul. Ne pas réintroduire un second Ledger, un second Meeting owner, un second Marketplace/Forum, ni Eco Route/Backhaul dans Eco-System.


## Checkpoint de fermeture 1.4.2 acquis
- checkpoint : `d1a69bb5c904268d5f16fc2421e2246154000598`
- CI : `35498239952 SUCCESS`
- BIR+ fermeture : `35498239942 SUCCESS`
- artifact : `10601038586`
- R2 final : `birplus/1.4.2/d1a69bb5c904268d5f16fc2421e2246154000598/final/`

Reprendre directement par la recette terrain 1.4.2 ; ne redéployer que pour un défaut reproductible et couvert par test permanent.


## Reprise après clôture 1.4.2 post-hotfix
- production : `1.4.2-operational-center-sessions-blueprint`
- source : `a9fe00f94daa7a6787d5a4440a5edc0bc5e4a1c8`
- Worker : `6c7b4be2-7daa-4f15-ae11-0861d248f60a`
- HEAD documentaire final : `d686929b44bf9f5f61ddee2ddee434e891c39afb`
- CI finale : `35499946396 SUCCESS`
- BIR+ final : `35499946216 SUCCESS`
- artifact : `10600699685`
- prochaine action : recette terrain Centre opérationnel + Séances + Blueprint + Communautés sur téléphone/ordinateur ; aucun redéploiement avant défaut reproductible.
