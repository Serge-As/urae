# ECO-SYSTEM — PROJECT STATE

Date : 2026-09-18

## Production publique — VERIFIED_REMOTE
- version : **1.4.0-master-2.3.4-closure**
- URL : `https://eco-system.sergemimf.workers.dev/`
- Worker : `eco-system`
- Worker Version ID : `182e7992-1bf9-479f-914b-c0f04ab1b85c`
- source déployée : `e869918002a6a649751b68088de39510dad3b29a`
- branche : `next/1.4.0-master-2.3.4-closure-20260917`
- D1 : `eco-system-db`
- R2 : `eco-system-backups`
- Premium Live : actif
- Founder Control Center : bound
- Forum/Community Realtime : bound
- artifacts : R2
- argent réel : **désactivé**
- qualification + build + pré-BIR+ + déploiement + smoke + post-BIR+ : run **35314965700 — SUCCESS**
- qualification parallèle du SHA déployé : run **35314965698 — SUCCESS**
- tests du workflow : **231/231 PASS**
- migrations : **No migrations to apply**
- pré-BIR+ et post-BIR+ : restaurations SQLite + `PRAGMA integrity_check=ok` + SHA256 + miroir R2 validés.

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
