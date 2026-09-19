# ECO-SYSTEM — PLAN D'IMPLÉMENTATION ET AUDIT DE RÉAJUSTEMENT 1.4.1

**Date : 19 septembre 2026**  
**Branche : `next/1.4.1-field-integrity-guardrails-20260919`**  
**Statut : document de contrôle d'implémentation — vérité de branche, distincte de la production 1.4.0**  
**Sources principales :**
- `Cadre minimal des pages Accueil et Séances des groupes.docx` fourni par le fondateur ;
- anciens Cahiers Eco-System et Cahier Maître 3.2.0 ;
- classeurs historiques Feuille mensuelle / RECAP / Fiches membre / Caisses / Tontines / Prêts / Épargne ;
- retours terrain du 19 septembre 2026 ;
- code, tests et registres réels de la branche.

> Règle : ne pas réécrire ce qui fonctionne. Chaque exigence est reliée à son propriétaire canonique ; une adaptation historique n'est conservée que si elle n'introduit pas de régression.

---

# 1. Objectif

Le réajustement 1.4.1 ne crée pas un nouveau produit. Il réinjecte dans l'application déjà fonctionnelle :
1. les règles oubliées utiles ;
2. le minimum Accueil/Séances demandé ;
3. la traçabilité financière manquante ;
4. l'usage hors ligne honnête ;
5. une dictée plus sûre ;
6. la présence, les bénéficiaires et preuves ;
7. l'identité administrative du groupe ;
8. les anciennes ambitions de confiance/éducation, sans les confondre avec des fonctions déjà opérationnelles.

---

# 2. Deux conventions transversales devenues obligatoires

## 2.1 Une capacité significative = une autorité canonique
Exemples :
- finance → Ledger/D1 ;
- règles → Living Rules/Rubrics ;
- séance → MeetingService ;
- identité groupe → GroupIdentityService ;
- créances → ReceivablesService ;
- preuves → KERNEL.EVIDENCE ;
- anti-arnaques/labo → SAFETY.ANTISCAM.

## 2.2 Reuse Before Build
Ordre : réutiliser → étendre → adapter → nouveau service uniquement si responsabilité réellement nouvelle.

---

# 3. Matrice des remarques terrain

| Besoin fondateur | Avant 1.4.1 | Owner | Action 1.4.1 | Statut |
|---|---|---|---|---|
| Offline réellement utile | shell/outbox mais lecture terrain incomplète | Offline + projections | snapshots IndexedDB actor-scoped, date dernière synchro, API jamais cachée comme vérité | FUNCTIONAL_BETA / terrain requis |
| Dictée en bruit | Web Speech sans garde confiance | Voice adapter | confiance, alternatives, no-speech, rejet montant incertain, preview obligatoire | FUNCTIONAL_BETA / bruit terrain requis |
| Saisie financière visible | déjà restaurée en haut | deux feuilles → Ledger | conservée, tests non-régression | ACQUIS À PRÉSERVER |
| Clic rubrique → tableau membres × séances | déjà présent | Rubric Detail + Ledger | conservé et protégé | ACQUIS À PRÉSERVER |
| correction 2 000 → 5 000 silencieuse | reversal existait, revue insuffisante | Ledger + Member Control | ancienne valeur + reversal + nouvelle valeur + motif + auteur + revue indépendante pour toute correction | FUNCTIONAL_BETA |
| auteur corrige sa propre situation | conflit détecté mais chaîne à durcir | Member Control | auteur interdit de revue ; autre responsable obligatoire ; réserve membre | FUNCTIONAL_BETA |
| titres séance/user humains | partiellement corrigé | Meeting/Membership projections | « Réunion du… », noms humains, IDs secondaires | ACQUIS À PRÉSERVER |
| dossier membre | self-edit/Bureau-read déjà présent | Member Profile | conservé | ACQUIS À PRÉSERVER |
| saisie financière trop basse | déjà remontée | UI deux feuilles | conservée au sommet de Séances | ACQUIS À PRÉSERVER |
| simulation prêt simple seniors | popup capital/remboursements existant | Loan simulator | conservé ; recette senior requise | FUNCTIONAL_BETA |
| Timbre / Timbre de prêt | doublon historique corrigé | Rubrics | ne pas auto-réinjecter Timbre générique | ACQUIS À PRÉSERVER |
| Menu Séances | absent comme nom explicite | shell | « Séances » | FUNCTIONAL_BETA |

---

# 4. Accueil du groupe — conformité au cadre minimal

## 4.1 Identification
Implémenté/projeté depuis les owners existants :
- nom ;
- code public non secret `ECO-GRP-…` ;
- famille Association/Tontine ;
- date de création historique quand connue ;
- date/heure courante ;
- déclaration : date + numéro ;
- Bureau/responsables ;
- période de mandat ;
- date de mise en ligne ;
- nombre de membres ;
- exercice/cycle.

Aucune déclaration ou date de mandat n'est inventée. Le Bureau peut les renseigner dans `IDENTITY.GROUP_PROFILE`.

## 4.2 Actions
- Nouvelle séance ;
- Anciennes séances ;
- Fiches individuelles ;
- Gérer membres ;
- Gérer/archiver rubriques ;
- ouvrir Récap.

**Adaptation non régressive :** l'ancien terme « Supprimer membre/rubrique » devient départ/suspension/archivage lorsque des historiques financiers existent. Une suppression physique ne doit jamais effacer la preuve comptable.

## 4.3 Situation financière Bureau
Projection, jamais seconde comptabilité :
- report/solde initial si écriture d'ouverture disponible ;
- recettes exercice ;
- dépenses exercice + Back-office ;
- solde caisse Ledger ;
- balance visuelle ;
- table créances/redevables ;
- classement Tontines depuis les parts canoniques.

## 4.4 Calendrier précédent / actuel / futur
Pour chaque séance affichable :
- Réunion du… ;
- lieu/canal ;
- thème ;
- tenue/code vestimentaire ;
- bénéficiaires déclarés ;
- présence renseignée ;
- accès au cockpit complet.

## 4.5 Accueil membre
Le membre obtient :
- groupe/code ;
- date première inscription ;
- ID membre ;
- exercice ;
- propre situation financière ;
- propres dettes/échéances ;
- propres parts Tontine ;
- réceptions/Assistances/Collation déclarées sur les séances visibles ;
- fiche individuelle ;
- accès aux simulations.

**Assistance « en règle / pas en règle » :** ne devient vert/rouge que si un moteur d'éligibilité fondé sur une politique Assistance validée sait réellement conclure. En l'absence de règle calculable : **À vérifier**, jamais une valeur fabriquée.

---

# 5. Page Séances — conformité au minimum

Le clic sur une séance ouvre désormais un cockpit.

## 5.1 Identification
- groupe ;
- Réunion du… ;
- exercice/cycle ;
- date programmée ;
- lieu/canal ;
- thème ;
- tenue ;
- auteur ;
- clôture ;
- références techniques repliées.

Le Bureau peut modifier date/lieu/thème/tenue via **MeetingService**, sans second calendrier.

## 5.2 Temporalité
- séance précédente ;
- séance courante ;
- séance suivante ;
- liste complète des anciennes/prochaines séances en bas.

## 5.3 Finance
Responsables :
- solde début si rapprochement disponible ;
- recettes ;
- dépenses ;
- solde théorique/clôture ;
- comptage physique ;
- écart ;
- si non rapproché, affichage **À rapprocher** au lieu d'un chiffre inventé ;
- dettes détaillées ;
- prêts avec dette ;
- Back-office de la séance ;
- matrice membres × rubriques.

Membre :
- uniquement propre projection de séance.

## 5.4 Présence
Statuts :
- Présent ;
- Retard ;
- Représenté ;
- Excusé ;
- Absent.

Le Bureau écrit ; chaque membre ne voit que son propre statut lorsque la vue globale n'est pas autorisée. Les modifications sont auditées.

## 5.5 Bénéficiaires et reconnaissance de réception
Séquence :
1. Bureau déclare bénéficiaire + rubrique + montant ;
2. génération d'un identifiant court non secret `ECO-RCP-XXXXXXXXXX` ;
3. preuve possible :
   - confirmation par le compte du membre lui-même ;
   - émargement papier constaté ;
   - photo/PDF stocké en R2 ;
4. création d'une preuve `MEETING_BENEFIT_RECEIPT` immuable ;
5. déclaration marquée DONE ;
6. retry idempotent.

Le code lie la preuve à :
`tenant + groupe + séance + membre + rubrique + déclaration + montant + méthode`.

Le code court est un **identifiant**, jamais un secret d'autorisation. Un QR peut ultérieurement encoder ce même identifiant sans modifier l'owner.

---

# 6. Dette, amendes et confidentialité

Le cadre source demande :
- Bureau : liste de tous les membres redevables ;
- membre : ses dettes uniquement.

Un défaut a été identifié dans `ReceivablesService.report()` : un membre autorisé au groupe pouvait obtenir le rapport de toutes les obligations du groupe.

Correction 1.4.1 :
- responsable → rapport groupe ;
- membre simple → obligations assignées à son propre userId uniquement.

Cette règle est dans le service canonique, pas seulement cachée dans l'UI.

---

# 7. Labo financier / anti-Ponzi

L'idée historique est rétablie sous le propriétaire existant `SAFETY.ANTISCAM`.

Document normatif :
`docs/safety/ECO_SYSTEM_LABO_FINANCIER_ANTI_ARNAQUES_PONZI_1.0.0.md`.

Il prévoit :
- origine économique d'un rendement ;
- flux promis ;
- dépendance aux nouveaux entrants ;
- stress retraits ;
- signaux d'alerte expliqués ;
- scénarios sain/ambigu/risqué ;
- preuves/sources ;
- éducation financière.

**Statut : STRUCTURAL_V1.**  
Il n'est pas qualifié comme fonction utilisateur opérationnelle dans 1.4.1.

---

# 8. Vision historique — réintégration sans prolifération

Les notions du document source sont conservées, mais mappées aux engines existants.

| Vision historique | Traduction actuelle |
|---|---|
| Ingénierie Association/Tontine | Group Core + Living Rules + Meeting + Reporting |
| Ingénierie sociale | Community + Trust + Discovery |
| Ingénierie financière | Ledger + Fairness Lab + Loans + Savings + Antiscam Lab |
| Ingénierie économique | Marketplace + Demand Exchange + Eco Business |
| Prospérité/développement | Opportunity Graph + Academy + Business + Anticipation |
| Développement de compétences | Academy / Knowledge |
| Partage | Community / Forum / Social Commerce |
| Outils technologiques avancés | capability-based progressive enhancement |
| Sources/auteurs vérifiés | provenance + vérification + Trust/Moderation |
| Buzz/information | contenu avec provenance et labels, sans transformer une tranche horaire en critère de vérité |

La proposition historique « 17h–20h = informations vérifiées » n'est pas reprise littéralement : une information ne devient pas plus vraie à une heure donnée. La partie utile conservée est **source, auteur, niveau de vérification, nature opinion/tendance/sponsorisé**.

---

# 9. Offline — frontière honnête

Fonctionnalités 1.4.1 :
- shell PWA ;
- outbox idempotente ;
- snapshot de lecture IndexedDB ;
- source/date du dernier snapshot visible ;
- relecture de contextes essentiels ;
- aucune réponse HTTP d'échec remplacée par une fausse réussite ;
- API Service Worker network-only.

L'installation PWA améliore la persistance/ergonomie mais n'est pas, en soi, une condition logique absolue pour bénéficier du cache après première visite compatible.

**À prouver sur terrain :**
- Windows navigateur installé/non installé ;
- téléphone Android ;
- réseau coupé après synchro ;
- redémarrage ;
- reconnexion et resynchronisation.

---

# 10. Dictée — frontière honnête

Réalisé :
- `maxAlternatives` ;
- confiance si fournie ;
- warning faible confiance ;
- montant numérique non écrasé si trop incertain ;
- no-speech ;
- erreur réseau ;
- preview avant écritures.

Non déclaré acquis :
- suppression de bruit professionnelle ;
- reconnaissance parfaite en environnement de réunion.

Étape future éventuelle : STT spécialisé derrière adapter/feature flag, après mesure de valeur/coût/compatibilité.

---

# 11. Prêts — UX senior

Déjà présent et conservé :
- matrice mensuelle ;
- capital initial modifiable directement ;
- chaque remboursement modifiable par popover ;
- deux stratégies Capital d'abord / Intérêts d'abord ;
- pas d'intérêt sur intérêt de dette ;
- simulation séparée du Ledger.

Reste une **recette utilisateur senior**, pas une réécriture technique.

---

# 12. Éléments volontairement partiels

| Élément | Pourquoi pas déclaré terminé terrain |
|---|---|
| offline | appareil réel requis |
| dictée bruit | environnement réel requis |
| ergonomie grand-mère prêt | test humain requis |
| éligibilité Assistance | nécessite politique validée calculable |
| Labo anti-Ponzi | spécifié mais pas encore moteur fonctionnel |
| QR graphique | code de réception et preuve déjà présents ; rendu QR peut venir comme représentation du même identifiant |
| actualités/buzz | vision à intégrer ultérieurement avec provenance/modération, pas priorité Groupe |

---

# 13. Tests permanents ajoutés

1. correction financière 2 000 → 5 000 ;
2. revue indépendante de toute correction ;
3. auteur interdit de revue ;
4. réserve membre ;
5. offline read fallback sans cache API ;
6. dictée faible confiance ;
7. Accueil canonique ;
8. confidentialité dette membre ;
9. déclaration/mandat identité groupe ;
10. contexte séance ;
11. présence manager/self ;
12. déclaration bénéficiaire préalable ;
13. self-confirm uniquement ;
14. émargement responsable ;
15. preuve photo exige artifact ;
16. immutabilité preuve ;
17. idempotence retry ;
18. code court de réception ;
19. sections minimales Accueil/Séances.

---

# 14. Ordre de validation terrain après qualification CI

## Parcours Bureau
1. ouvrir groupe existant ;
2. renseigner déclaration + mandat ;
3. vérifier code ECO-GRP ;
4. programmer une séance avec lieu/thème/tenue ;
5. ouvrir la séance ;
6. saisir contributions depuis feuille ;
7. corriger 2 000 → 5 000 ;
8. vérifier la revue indépendante ;
9. renseigner présence ;
10. déclarer bénéficiaire ;
11. émargement papier ou photo ;
12. vérifier dettes, Back-office et liste séances ;
13. couper réseau et vérifier dernière copie connue.

## Parcours membre
1. Accueil du groupe ;
2. uniquement propres dettes ;
3. propre situation ;
4. propre présence ;
5. propre Tontine ;
6. propre bénéficiaire déclaré ;
7. confirmer réception ;
8. réserve sur correction financière ;
9. offline après synchro.

---

# 15. Conditions de promotion

Le code 1.4.1 peut être **CI-qualified** lorsque le HEAD final passe `npm run ci`.

Il ne devient pas **field-qualified** sans les essais Bureau + membre + offline + téléphone.

Il ne devient pas **production** sans :
1. vérité projet finalisée ;
2. BIR+ ;
3. autorisation explicite de déploiement ;
4. déploiement du SHA exact ;
5. smoke ;
6. BIR+ post-production.

---

# 16. Conclusion d'architecture

Le réajustement respecte la doctrine :

> **Accueil et Séances sont des cockpits de projection et d'action ; ils ne sont pas de nouveaux moteurs comptables.**

> **Une preuve de réception ne remplace pas la transaction financière ; elle prouve la réception du bénéfice associé.**

> **Un code ECO-RCP identifie une preuve ; il n'autorise pas une action.**

> **Une absence de donnée devient “À compléter / À rapprocher / À vérifier”, jamais une donnée inventée.**
