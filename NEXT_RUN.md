# NEXT RUN — ECO-SYSTEM 1.5.2.7

## REPRISE PRIORITAIRE — ECO PR #66 — CLOUDFARE/LIVE ET RECETTE TERRAIN (2026-10-05)

Référence : `fix/field-regressions-recovery-20261005`, revue `docs/recovery/ECO_FIELD_13_POINTS_2026-10-05.md`; base `393f80df88076072317f08adee81fe14d54d06c5`. Dernière preuve CI pré-checkpoint : `9c3ce510f3c2791cbd5c9de81b1e8a77f451b052`, GitHub Actions `37317103271` SUCCESS (590/590 unitaires et tests navigateurs critiques). Vérifier **CI sur HEAD exact après ce checkpoint**.

**Interdictions :** aucune mise en production depuis cette branche, aucune migration, effacement de cache utilisateur, création D1/R2, activation d'argent réel, changement de rubrique/politique non demandé. Ne pas déclarer le quota D1 épuisé sans preuve de réponse ou dashboard Cloudflare.

**Reste à faire :** tests R01–R15 sur véritables comptes A/B et appareils (vrai mode avion F5 avec vieux cache et retour au même écran, brouillons/typing/ACK auteur/date, push après validation, conflits 1000→3000/2000 en deux ordres, Outbox et remboursement sans doublon), simulations comptables S2/S3, règles prêt financement/report/rewards, audit de la consommation réelle en D1 vs WebSocket au repos, puis nouvelle identité release/SW/manifest/contract, backups BIR+/D1/R2 et smoke SHA/health avant toute mise en production. PR **en brouillon**, production **inchangée**.

---

## REPRISE PRIORITAIRE — RECETTE TERRAIN 1.5.2.9 SOVEREIGN OFFLINE (2026-09-28)

Production : `faa23c6b279197b267dd1981529e39b5bd994d62`, Worker `0902744e-3293-448f-ad4c-5f6af2dd4804`, delivery `36380950649 SUCCESS`.

Recette physique sans nouveau déploiement :
1. iPhone/iPad Safari puis PWA installée : ouvrir Eco Relay, tester caméra QR ; si standalone échoue, confirmer Safari + Eco Pack.
2. Appairer 2–3 membres, préparer Broadcast, recevoir chaque capsule, vérifier qu'un téléphone ne stocke que sa capsule.
3. Mode avion : créer/ouvrir exercice, séance, saisir finances, prêt/remboursement/tontine, fermer/réouvrir app, vérifier persistance.
4. Eco Local Room : deux appareils sur même Wi-Fi/hotspot, échange offre/réponse QR, connexion DataChannel, capsule membre, confrontation gestionnaires.
5. Eco Vault : exporter, copier sur autre support, restaurer sur appareil de test, vérifier journal et outbox.
6. Clôture exercice : intérêts, Fonds Secours/Réserve/Bureau, enveloppes, report, exercice suivant.
7. Ne déclarer FIELD_ACCEPTED que pour les éléments physiquement observés.

---

## REPRISE PRIORITAIRE — N° MEMBRES + FINANCE OFFLINE 1.5.2.8 (2026-09-28)

Production vérifiée :
- SHA : `8e8a927ea0f968ce474473f3103cbddc0341a880`
- Worker : `53eca7cc-ca2e-459a-b472-4741dfb9dc61`
- delivery/recovery : **36365348227 SUCCESS**
- backup pré : **10947511514**
- backup post : **10947645903**
- E2E Chromium : **36365348179 SUCCESS**
- WebKit/iOS : **36365348226 SUCCESS**
- argent réel : **OFF**

Recette terrain à faire sans redéploiement préalable :
1. Membres : choisir un classement différent de l'ordre d'inscription, enregistrer 1…N et vérifier qu'il reste identique après fermeture/réouverture.
2. Feuille séance : vérifier visuellement `N° | Membre | rubriques…`.
3. Dictée : dire « Eco, membre numéro 3, Secours 500, Épargne 1000 » et vérifier que la preview pointe vers le membre classé N°3.
4. Couper totalement Internet. Saisir et valider par ✓ puis Entrée une cotisation et une dépense ; recharger la page toujours hors ligne ; les valeurs doivent rester visibles et marquées synchro en attente.
5. Hors ligne : tester aussi une première saisie Prêt et Remboursement. Revenir en ligne puis vérifier un seul replay canonique sans doublon.
6. Refaire fermeture/réouverture après synchronisation et vérifier les mêmes montants.
7. Ne pas déclarer la dictée audio Workers AI comme offline : seule la persistance/validation financière est garantie hors connexion ; la transcription audio cloud exige le réseau.
8. Tout défaut reproductible devient un test avant correction.

---

## REPRISE PRIORITAIRE — PRODUCTION 1.5.2.8 GPS + VOIX (2026-09-28)

Production vérifiée :
- SHA : `4ae39be95d0b3faa16e2d86a95b2d47368eb0945`
- version : `1.5.2.8-geo-directory`
- Worker : `4e92501a-430d-463f-876e-784366a54b38`
- deploy/smoke/recovery : **36362622399 SUCCESS**
- sauvegarde pré : **10946680088**
- sauvegarde post : **10945783708**
- catalogue : **155 actives / 4 structurelles externes / 5 planifiées**
- argent réel : **OFF**

Prochaine action normale : **recette terrain, sans nouveau redéploiement aveugle**.
1. Actualiser/rouvrir la PWA et confirmer le shell 1.5.2.8.
2. GPS : cliquer volontairement « utiliser ma position », autoriser puis refuser/révoquer ; vérifier rayon et fallback localité.
3. Dictée finance : lancer le micro, parler normalement et vérifier que **rien ne s'écrit pendant l'enregistrement**.
4. Appuyer sur **Arrêter** ; vérifier qu'une seule transcription finale apparaît puis qu'une prévisualisation propose membre, séance, rubriques et montants.
5. Cas de référence : « Eco, chez Serge, Secours 500, Épargne 1000, Remboursement 5000 ». Vérifier l'absence de « écho » parasite entre les mots et corriger toute ambiguïté dans la preview avant validation.
6. Tester bruit réel, Chrome/Opera, mobile et appareil Android ancien. Sur navigateur sans MediaRecorder, le fallback SpeechRecognition doit rester final-only et sans boucle de redémarrage.
7. Vérifier qu'aucune écriture n'est créée tant que la prévisualisation n'est pas confirmée.
8. Tout défaut reproductible devient d'abord un test permanent ; ne pas réécrire Ledger, tableaux, Meeting owner, Discovery ou GPS déjà qualifiés.

Ne pas promouvoir artificiellement SMS / WhatsApp provider / Telegram / Email sans fournisseur réel. Ne pas déclarer FIELD_ACCEPTED à partir du CI/smoke seul.

---

Point de reprise exact : branche `finish/live-whatsapp-completion-20260927`.

1. Exiger une qualification verte sur le HEAD final.
2. Fusionner PR #29 dans `audit/live-completion-20260926`.
3. Vérifier la qualification du nouveau HEAD audit, puis fusionner PR #28 dans `fix/1.5.2.6-field-persistence-pc-mobile-20260925`.
4. Le marqueur `.github/DEPLOY_ECO_SYSTEM_1_5_2_7_LIVE_ONCE` doit déclencher `.github/workflows/deploy-1.5.2.7-live-completion.yml`.
5. Exiger : npm CI + build + tests navigateur, sauvegarde D1 pré, migrations additives seulement, déploiement, /health + catalogue 164, realMoney=false, sauvegarde post + restauration SQLite integrity_check=ok.
6. Après succès, consigner le SHA déployé, run, Worker version et artifacts de sauvegarde dans CURRENT_TRUTH/PROJECT_STATE.
7. Recette terrain ensuite seulement : Chrome/Opera PC, Android 6, offline/outbox, deux gestionnaires Live, WhatsApp Share Out, Aide locale/Collation comme rubriques principales.

Ne pas activer artificiellement les connecteurs externes SMS/WhatsApp provider/Telegram/Email ni les domaines planifiés sans moteur/fournisseur réel.


# ECO-SYSTEM — NEXT RUN

## CURRENT OVERRIDE — 1.5.0 audit implementation (2026-09-23)

Branche : `next/1.5.0-audit-complete-platform-20260923`. Production 1.4.5 reste inchangée.

Reprise obligatoire :
1. lire `docs/implementation/ECO_SYSTEM_1.5.0_FULL_IMPLEMENTATION_SCOPE_2026-09-23.md` ;
2. relever le HEAD distant 1.5.0 et la dernière CI ;
3. corriger toute erreur CI avant nouveau lot ;
4. poursuivre L1 : CAS/version de cellule + concurrence D1 + revue après clôture ;
5. ne pas déployer avant qualification complète + BIR+ pré ;
6. préserver tous les acquis indiqués dans AGENTS/CURRENT_TRUTH et `realMoneyEnabled=false`.

Commits acquis de ce démarrage : correction intérêts après capital nul ; tests runtime prêt ; contrat correction financière atomique ; branchement Worker ; persistance outbox avant transport ; confrontation offline sur baseline ; tests/CI 1.5.0.

---


## CURRENT OVERRIDE — Reprise après production 1.4.5 (2026-09-22)

Production actuelle :
- version `1.4.5-final-mega-offline-governance`
- source `463035adab2303874878c8e72f1965475ac0b209`
- branche `next/1.4.5-final-mega-offline-governance-20260921`
- Worker Version ID `29c8f0e2-1cb1-4361-8481-27b514906fcf`
- qualification push/PR : `35713621161 SUCCESS` / `35713626133 SUCCESS`
- déploiement + smoke + BIR+ : `35713621388 SUCCESS`
- tests : **298/298 PASS**
- D1 `eco-system-db` : aucune migration
- R2 `eco-system-backups` : pré/post miroirs PASS
- artifacts : pré `10688266480`, post `10688236533`
- argent réel : **OFF**

Ordre obligatoire de la prochaine reprise :
1. ne pas redéployer avant la recette terrain ;
2. sur PC, vérifier menus Prêts/Épargne/Assistances/Rubriques/Fiches membres/Corbeille ;
3. vérifier feuille récapitulative par défaut dans Séances + Recap ;
4. vérifier « Saisir/corriger » sur la séance exacte ;
5. avec deux comptes gestionnaires, reproduire 1000 → 500 et vérifier qu'aucun 1500 n'apparaît ;
6. vérifier alertes vertes pendant séance ouverte et orange/rouge après clôture ;
7. modifier une séance clôturée et vérifier l'alerte responsables/membre selon donnée touchée ;
8. tester Retour depuis chaque navigation/hypertexte observé ;
9. tester corbeille séance/membre/rubrique + restauration ;
10. Android 6 : mettre à jour une fois vers le shell 1.4.5, puis couper le réseau et tester navigation/compte local/saisie ;
11. iOS : seulement quand un iPhone réel est disponible ; ne pas déclarer FIELD_ACCEPTED avant ce test ;
12. cas « appareil n'ayant jamais reçu Eco-System et zéro Internet » : livrer/tester un paquet physique installable avant de déclarer ce scénario totalement résolu.

Garde-fous : Ledger unique append-only ; correction par contrepassation ; pas de second Meeting owner ; pas de second moteur Prêt/Épargne/Assistance ; CRDT jamais pour l'argent ; Live n'est pas l'autorité canonique ; suppression définitive manuelle interdite ; real money OFF.

---

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

## Reprise après production 1.4.3 — 2026-09-21

Production :
- `1.4.3-blueprint-5-0-0-finalized`
- branche : `next/1.4.3-blueprint-5-0-0-finalization-20260921`
- source déployée : `96b8f41467af476b12179b786d7d8f140ef86ce7`
- Worker : `07939344-ceca-4578-bc3b-3d1d589ad7eb`
- deploy/smoke/BIR+ pré-post : `35560714108 SUCCESS`
- 265/265 tests PASS
- D1/R2 historiques conservés
- argent réel OFF.

Reprendre par :
1. recette téléphone : badge 1.4.3, Centre opérationnel, Séances distinctes, barre mobile lisible ;
2. recette Blueprint 5.0.0 ;
3. recette Hubs Business/Formation/Impact/Créateurs et posts contextuels ;
4. test groupe + membre + offline ;
5. consigner tout défaut reproductible et écrire le test avant correction.

Ne pas réintroduire Backhaul/Eco Route dans Eco-System.



## Reprise candidat 1.5.2.7 — 2026-09-27

Point de départ :
- branche : `finish/live-whatsapp-completion-20260927`
- PR #29 : ouverte vers `audit/live-completion-20260926`
- runtime : `1.5.2.7-live-completion`
- qualification de référence : run **#397 / 36353667354 SUCCESS**
- catalogue : **154 FOUNDATION_ACTIVE / 5 STRUCTURAL_V1 / 5 PLANNED_DOMAIN**
- real money : **OFF**

Ordre obligatoire de finalisation :
1. qualifier les commits documentaires de fermeture ;
2. ne fusionner PR #29 que si la CI reste verte ;
3. qualifier PR #28 avec la tête intégrée avant fusion dans `fix/1.5.2.6-field-persistence-pc-mobile-20260925` ;
4. utiliser un workflow de déploiement 1.5.2.7 dont les attentes correspondent exactement à :
   - version `1.5.2.7-live-completion` ;
   - build ID `eco-system-1.5.2.7-20260927` ;
   - PWA cache `eco-system-v1527-live-completion-20260927` ;
   - SHA exact de livraison ;
   - `realMoneyEnabled=false` ;
5. BIR+ pré-déploiement → migrations additives seulement → deploy → smoke root/health/catalog → BIR+ post et restauration/integrity check ;
6. recette terrain : Chrome + Opera PC, mobile, offline, reprise réseau, deux gestionnaires Live sans rafraîchissement, WhatsApp handoff/deep return, saisies financières/Entrée, Aide locale/Collation/Main levée, séances/prêts/dettes ;
7. ne marquer FIELD_ACCEPTED qu'après constat réel.

À ne pas « compléter » artificiellement :
- `GEO.DIRECTORY` tant que la géolocalisation appareil consentie n'est pas implémentée/qualifiée ;
- SMS/WhatsApp provider/Telegram/Email sans fournisseur configuré ;
- vidéo, rewards, Mobile Money, MFA et fédération tant que leurs dépendances réelles ne sont pas présentes.


## Reprise après production 1.5.2.7 — 2026-09-27

Production :
- version : `1.5.2.7-live-completion`
- source déployée : `c0dcbfa4391b46773d1e2c8d6b9733cc5d8b367c`
- Worker : `0c06d6f3-382c-4433-91b4-b071c0573ccd`
- qualification : **36354372028 SUCCESS**
- E2E financier navigateur : **36354371970 SUCCESS**
- deploy/smoke/recovery : **36354371977 SUCCESS**
- pre-recovery : artifact **10943029509**
- post-recovery : artifact **10942949813**
- D1 : aucune migration à appliquer
- R2 : actif
- catalogue : 164
- real money : OFF

Prochaine action normale : **recette terrain**, pas nouveau chantier technique aveugle.
1. Chrome PC puis Opera PC : connexion, navigation, saisies financières, Enter, modifications, totaux, scroll.
2. Mobile : shell 1.5.2.7, installation PWA, navigation senior/novice, saisie et retour.
3. Offline : saisie → validation locale → outbox → retour réseau → confirmation serveur sans doublon.
4. Deux gestionnaires : modification d'une cellule/session sur A → réception proactive sur B sans refresh ; réserve/confrontation si désaccord.
5. WhatsApp : partage volontaire → ouverture deep link → authentification éventuelle → retour sur l'objet exact.
6. Rubriques : confirmer Collation/Ration/Aide locale au même niveau principal ; Main levée dans Assistance/Solidarity ; « Autres » réservé aux petites rubriques correspondantes.
7. Prêts/dettes/intérêts : simulation, décaissement négatif, intérêts après clôture, situation membre.
8. Documenter tout défaut reproductible ; écrire/adapter le test permanent avant correction.

Ne pas activer artificiellement GPS, SMS/WhatsApp provider/Telegram/Email, vidéo, rewards, Mobile Money, MFA ou fédération tant que leurs dépendances réelles ne sont pas présentes.
