# ECO-SYSTEM — PROJECT STATE

Date : 2026-09-20

## Production publique — VERIFIED_REMOTE
- version : **1.4.1-field-integrity-home-sessions**
- URL : `https://eco-system.sergemimf.workers.dev/`
- Worker : `eco-system`
- Worker Version ID : `d4e56867-077c-47cd-bfc9-9aba4735d596`
- source déployée : `024b9837b6fa577c0c2c39297c2ce672f7d130b3`
- branche : `next/1.4.1-field-integrity-guardrails-20260919`
- D1 : `eco-system-db`
- R2 : `eco-system-backups`
- Premium Live : actif
- Founder Control Center : bound
- Forum/Community Realtime : bound
- artifacts : R2
- argent réel : **désactivé**
- qualification du SHA déployé : run **35488899790 — SUCCESS**
- qualification + build + pré-BIR+ + déploiement + smoke + post-BIR+ : run **35488899806 — SUCCESS**
- tests du workflow : **256/256 PASS**
- migrations : **No migrations to apply**
- pré-BIR+ et post-BIR+ : restauration SQLite + `PRAGMA integrity_check=ok` + SHA256 + miroir R2 validés.
- smoke production : version 1.4.1, `realMoneyEnabled=false`, Premium Live/Founder Control/Community Realtime/R2 confirmés.

## Correction 1.4.0 — deux feuilles / toutes rubriques
La vérité métier opérationnelle est désormais :
1. **Votre feuille de séance** et **Vos fiches individuelles** sont les deux surfaces normales de saisie financière des membres.
2. Une rubrique créée et non archivée doit être visible sur les deux feuilles.
3. Le nombre de rubriques n'est jamais fixé à 20. Le test 20 reproduit un cas terrain ; les tests **1 rubrique** et **40 rubriques** passent également. Le validateur de lancement conserve un plafond technique de sécurité de 100 rubriques.
4. Amendes / Inscription / Timbre de prêt sont des rubriques possibles, pas un catalogue qui remplace les rubriques du groupe.
5. Un simple membre voit son groupe et sa propre fiche opérationnelle mais pas les fiches financières des autres.
6. Les menus spécialisés configurent/simulent/pilotent ; ils ne remplacent pas les deux feuilles comme saisie financière normale.

## Prêts + Intérêts — vérité 1.4.0
- les rubriques Prêt, Remboursement et Remboursement intérêts restent reliées aux deux feuilles ;
- le capital restant dû génère un intérêt à chaque nouvelle séance/période mensuelle tant qu'il est supérieur à zéro ;
- tout remboursement partiel du capital réduit immédiatement l'assiette taxable de la période suivante ;
- les intérêts impayés sont reportés séparément et ne génèrent jamais d'intérêt sur intérêt ;
- si le capital tombe à zéro et qu'il reste des intérêts, aucun nouvel intérêt n'est créé ;
- le gestionnaire peut comparer puis valider **CAPITAL_FIRST** ou **INTEREST_FIRST** au niveau de la politique de la rubrique Prêt ;
- la matrice de suivi est horizontale par mois/séance et expose capital initial/début, capital remboursé, capital restant, intérêt exigible, intérêt payé, intérêt restant, paiement, dette après séance, intérêt projeté et total projeté prochaine séance, avec synthèse/totaux ;
- longueur de simulation flexible, valeur par défaut 9 mois ; ce n'est pas une règle métier de 6 lignes ;
- lorsque la politique `blockNewLoanUntilSettled` est active, un nouveau prêt est refusé tant que le capital **ou** les intérêts du prêt précédent restent dus ;
- l'accrual mensuel est idempotent par prêt + séance.

### Exemple fondateur verrouillé
Capital 50 000 XAF, taux 5 %, paiements 0 / 30 000 / 20 000 :
- CAPITAL_FIRST : après le mois 3, capital = 0 ; intérêts dus = 6 000 ; mois 4 n'ajoute aucun intérêt et 6 000 libère la dette.
- INTEREST_FIRST : après le mois 3, capital restant = 6 250 ; mois 4 génère 312,5 XAF théoriques, arrondis actuellement à **313 XAF** dans l'unité entière XAF ; dette du mois 4 = **6 563 XAF**.

## Acquis conservés
10 étapes de création ; Collation ; multi-tontines ; participants distincts par tontine ; Living Rules ; Ledger canonique ; outbox/offline ; RECAP financier et séance ; fonds reconduits ; Tontine Manager ; savings yield ; CNI/phone/name matching protégé ; Forum/communautés ; Marketplace ; AdManager ; Partners/ONG ; Premium Live ; RI multi-documents ; Assistance Rulebook ; RegistrationPolicy ; Fairness Lab ; Group Doctor ; Meeting Autopilot ; AdOps/CRM ; House Ads contextuelles.

## Nuance de vérité
**Déployé + CI + smoke ne signifie pas recette terrain exhaustive.** Les nouveaux parcours 1.4.0 restent FUNCTIONAL_BETA jusqu'à validation terrain du fondateur.

## Documents de décision
- socle constitutionnel : Cahier maître 2.3.4, toujours actif sauf supersession explicite ;
- `docs/constitution/ECO_SYSTEM_Cahier_des_Charges_Maitre_Exhaustif_3.2.0_2026-09-16.md` ;
- `docs/memory/recalls/RECALL-2026-09-17-master-2.3.4-closure.md` ;
- `docs/change-impact/CIR-2026-09-17-master-2.3.4-closure.md`.

## Prochain jalon
Recette terrain ciblée de la production 1.4.0 : groupe à nombre variable de rubriques, présence identique dans les deux feuilles, compte simple membre, saisie Prêt/Remboursement/Intérêts depuis les feuilles, comparaison des deux politiques de remboursement et vérification du circuit réel sur plusieurs séances. Toute anomalie reproductible devient un test permanent avant correction.


## Correction terrain ciblée 2026-09-18 — candidate de production

- Checkpoint fonctionnel qualifié : `99a7c0c37fd7aa7f69fbce0eeb00342886b2bb2e`.
- CI de qualification : `35330825785 SUCCESS`.
- Deux feuilles visibles et éditables par cellule/pop-up compact.
- « Membres & habilitations » est séparé de Réunion ; Dossier Membre y est déplacé.
- Menu « Back-office » ajouté.
- Tontines reliées aux rubriques TONTINE ; calcul du montant total du pot ; listes Cycle/Membre ; classement bénéficiaires.
- Matrice Prêt modifiable pour la simulation sans altérer les règles financières.
- La production publique reste au checkpoint 1.4 précédent jusqu'au déploiement ciblé et au smoke final.

## Production 1.4.1 — Field Integrity / Accueil / Séances (2026-09-20)

La production publique **1.4.1 est maintenant déployée et smoke-testée** sur le SHA exact `024b9837b6fa577c0c2c39297c2ce672f7d130b3`.

Ligne de production :
- version : `1.4.1-field-integrity-home-sessions` ;
- branche : `next/1.4.1-field-integrity-guardrails-20260919` ;
- `realMoneyEnabled=false` inchangé ;
- D1 canonique à réutiliser : `eco-system-db` ;
- R2 privé à réutiliser : `eco-system-backups`.

Périmètre intégré :
1. Accueil Groupe enrichi sans second moteur comptable : code ECO-GRP, déclaration, mandat, Bureau, cycle, séances, situation Ledger/Récap, créances, classement Tontines.
2. Accueil Membre : propre situation, propres dettes, propres participations/bénéfices et accès aux fiches/simulations selon droits.
3. Séance complète : contexte date/lieu/thème/tenue, temporalité précédente/courante/suivante, finance, caisse, dettes, Back-office, présence, bénéficiaires, preuves et historique.
4. Preuve bénéficiaire : déclaration préalable, confirmation personnelle ou émargement responsable ou photo/PDF R2, preuve KERNEL.EVIDENCE immuable, retry idempotent, code `ECO-RCP-...` non secret.
5. Confidentialité créances : le responsable voit le rapport groupe ; le membre simple obtient uniquement ses obligations.
6. Correction financière : ancienne valeur + contrepassation + nouvelle valeur + motif + audit + revue indépendante ; auteur jamais son propre réviseur.
7. Offline : dernière projection actor-scoped avec horodatage, jamais faux succès serveur.
8. Dictée : garde de confiance, alternatives et preview obligatoire ; robustesse parfaite au bruit non déclarée acquise.
9. Deux conventions obligatoires : Autorité canonique unique + Reuse Before Build.
10. Labo financier anti-arnaques/Ponzi restauré comme `SAFETY.ANTISCAM` STRUCTURAL_V1, non présenté comme fonction terrain déjà qualifiée.

Documents :
- `docs/implementation/ECO_SYSTEM_PLAN_IMPLEMENTATION_REAJUSTEMENT_1.4.1_2026-09-19.md`
- `docs/constitution/ECO_SYSTEM_Additif_Reajustement_Accueil_Seances_Vision_1.4.1_2026-09-19.md`

Déploiement préparé par :
- `.github/workflows/deploy-production-1.4.1.yml`
- `.github/workflows/backup-birplus-1.4.1.yml`

Déploiement qualifié : run `35488899806 SUCCESS` ; Worker Version ID `d4e56867-077c-47cd-bfc9-9aba4735d596`. La recette terrain Bureau/membre/offline/bruit/senior reste distincte du smoke technique.

## Clôture BIR+ 1.4.1 — 2026-09-20
- checkpoint sauvegardé : `4edf2dcb27c54303becce71ac9bd5b7db2c50496`
- qualification du checkpoint : **35489112828 — SUCCESS**
- BIR+ final source + D1 : **35489112862 — SUCCESS**
- Artifact GitHub : **10598209553**
- D1 restaurée : `PRAGMA integrity_check=ok`
- SHA256 : validé
- miroir R2 final : `birplus/1.4.1/4edf2dcb27c54303becce71ac9bd5b7db2c50496/final/` — **PASS**
- ce BIR+ ferme le jalon de livraison ; la recette terrain reste la prochaine étape sans redéploiement préalable.

