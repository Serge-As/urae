# ECO-SYSTEM — NEXT RUN

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
`next/1.4.1-field-integrity-guardrails-20260919`

Toujours récupérer le HEAD distant réel avant toute modification.

## Production actuelle
- version : **1.4.1-field-integrity-home-sessions**
- source déployée : `024b9837b6fa577c0c2c39297c2ce672f7d130b3`
- Worker Version ID : `d4e56867-077c-47cd-bfc9-9aba4735d596`
- production + smoke + BIR+ pré/post : **35488899806 SUCCESS**
- qualification du SHA déployé : **35488899790 SUCCESS**
- tests : **256/256 PASS**
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

