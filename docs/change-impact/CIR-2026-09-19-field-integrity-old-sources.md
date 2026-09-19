# CIR — Impact de reprise terrain 2026-09-19

**Branche : `next/1.4.1-field-integrity-guardrails-20260919`**  
**Risque : élevé pour finance/offline ; moyen pour UX ; documentation seule pour capacités historiques**

## 1. Objectif
Corriger les écarts terrain signalés sans régression et sans créer de moteurs parallèles.

## 2. Autorités canoniques concernées

| Capacité | Owner canonique | Surfaces consommatrices |
|---|---|---|
| vérité financière | Ledger / D1 | feuille séance, fiche individuelle, rubrique, RECAP, relevé |
| correction financière | Ledger + Member Financial Control | feuilles, relevé, notifications |
| prêts | moteur Loan | feuilles, simulateur, dossier membre |
| règles | Living Rules / Rubrics | rubrique, création, séance |
| offline | Offline/Outbox + projections autorisées | PWA |
| identité/membres | Membership/Identity | dossier, feuilles, forum |
| preuves | audit/evidence existant à étendre | décharges, corrections |
| notifications | Notification | alertes correction/revue |

## 3. Lot A — intégrité des corrections

### Changement
Toute correction de cotisation effectuée par un responsable doit exiger une revue indépendante, pas seulement l'auto-modification.

### Pourquoi
Le retour terrain prouve qu'une correction peut modifier une situation financière importante. La mémoire historique exige une seconde validation des modifications. L'auto-bénéfice reste le cas aggravé.

### Ce qui ne change pas
écriture originale conservée ; reversal + replacement ; Ledger canonique ; réserve membre ; idempotence ; rôle manager requis ; la revue n'efface pas l'historique.

### Risque
Une correction ordinaire restera marquée “à vérifier” jusqu'à revue par un second responsable. C'est voulu.

### Tests
correction d'un autre membre → UNDER_REVIEW ; auteur ne peut pas effectuer sa propre revue ; autre responsable peut revoir ; tâche indépendante créée/fermée ; old receipt net=0, replacement=nouveau montant ; ancienne/nouvelle valeur + motif restent visibles.

## 4. Lot B — offline
Câbler des snapshots IndexedDB pour les lectures essentielles après une première synchronisation. Ne pas cacher un paiement confirmé ; ne pas prétendre qu'une écriture offline est serveur-confirmée ; ne pas transformer le Service Worker en second backend.

Test terrain : ordinateur + téléphone ; PWA installée et non installée ; réseau coupé après synchro ; dernière date de synchro visible.

## 5. Lot C — dictée
Prévisualisation obligatoire avant écriture. Ajouter signal de confiance/faible confiance et répétition lorsque supportée ; fallback texte toujours disponible. Le bruit n'est pas déclaré “résolu” avant test terrain.

## 6. Lot D — Accueil/Séances
Réutiliser les projections existantes. Aucun second calcul financier. Renommer la navigation “Réunion” en “Séances” ; construire les sections du cadre minimal progressivement ; données absentes = “À compléter”, jamais inventées ; tableaux manager-only selon droits ; membre = propre situation seulement.

## 7. Rollback
Chaque lot est isolé en commit. Aucun déploiement production n'est inclus dans le présent mandat sans qualification et étape explicite ultérieure.
