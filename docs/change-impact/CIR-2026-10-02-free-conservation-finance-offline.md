# CIR — Stabilisation Free Conservation / Finance / Offline — 2026-10-02

**Checkpoint fonctionnel : `c746dc9ceb2eaf550ab99793d55af41fc4c7ca54`**  
**Risque : élevé finance/synchronisation ; moyen UX/offline ; faible schéma (aucune migration destructive)**

## 1. Objectif
Réduire drastiquement les lectures D1 tout en conservant une interaction rapide, corriger la cohérence de l'affichage côté auteur, reconstruire les dettes/intérêts/épargne depuis les preuves réelles, restaurer les rubriques historiques et étendre l'usage offline sans créer de moteurs parallèles.

## 2. Surfaces et autorités

| Domaine | Autorité canonique | Surfaces |
|---|---|---|
| saisie financière | Ledger + révisions de cellule | feuille séance, fiches membres, recap rubrique |
| propagation Live | Durable Object/WebSocket + Outbox | gestionnaires, membres concernés |
| dette | Completion LOAN + FINANCE.LOAN_PERIOD + obligations | Séances, Prêts + Intérêts, Épargne + Intérêts |
| épargne | Ledger receipts + rubriques SAVINGS | Épargne + Intérêts |
| rubriques | RubricDefinition + historique/corbeille | menu Rubriques, feuilles |
| offline | cache local + sovereign journal + Outbox | prêts, remboursements, completion, feuilles |

## 3. Impact technique

### A. Conservation gratuite
Le polling canonique périodique D1 est désactivé par défaut (`FREE_CONSERVATION_MODE=true`). Le WebSocket devient le fast path. Les lectures canonique complètes ne sont plus utilisées comme mécanisme d'horloge Live.

**Bénéfice attendu :** consommation D1 indépendante du nombre de secondes pendant lesquelles plusieurs navigateurs restent ouverts.

**Risque :** si le WebSocket tombe, l'actualisation immédiate peut être retardée jusqu'à une action/réouverture/reprise. L'Outbox et les projections locales empêchent la perte de données ; elles ne prétendent pas remplacer une confirmation serveur.

### B. Affichage auteur
`FINANCIAL_CONFIRMED_STORAGE` garde temporairement la dernière valeur confirmée et empêche une lecture canonique plus ancienne de remettre visuellement 1500 après validation de 3000. Elle s'efface lorsque la version canonique rejoint/dépasse la confirmation.

### C. Dette / intérêts
La route Savings Yield agrège prêts et périodes. Elle expose :
`outstandingPrincipal`, `outstandingInterest`, `nextInterestProjected`, `otherDebt`, `totalDebt`, `totalDebtIncludingNextInterest`.

La vue Séances consomme cette projection commune plutôt qu'une liste de prêts isolée.

### D. Remboursements et intérêts collectés
Les événements de feuille historiques et nouveaux sont interprétés par nature de rubrique : principal ou intérêts. Les libellés historiques « Remboursement(s) » et « Remboursement intérêts » restent reconnus. Le calcul évite de compter deux fois le même paiement.

### E. Rubriques
Le menu ne cache plus silencieusement une rubrique archivée : elle reste visible, signalée, consultable et restaurable. Un récap membres × séances est disponible à la demande pour chaque rubrique.

### F. Offline Prêts
`createCompletion`, `transitionCompletion`, `disburseLoan`, `repayLoan` et `loanHistory` ont un chemin offline local et rejouable. L'écriture offline reste explicitement en attente de synchronisation.

## 4. Données et schéma
Aucune suppression, aucun remplacement de D1, aucune migration destructive. Les nouveaux comportements reposent sur données existantes et projections locales. Les caches locaux sont bornés et peuvent être reconstruits depuis les autorités canoniques.

## 5. Tests obligatoires
- exact replacement 1500→3000 et persistance côté auteur ;
- même valeur visible sur deuxième navigateur sans reconstruction totale de page ;
- polling D1 récurrent absent en mode gratuit ;
- capital/intérêts séparés ;
- intérêt prochaine période calculé sans être prématurément comptabilisé comme encaissé ;
- rubriques historiques visibles/restaurables ;
- tableau rubrique membres×séances ;
- données Épargne/Remboursements/Intérêts issues des sources réelles ;
- création/décaissement/remboursement de prêt offline puis replay ;
- WebKit/iOS et PWA offline sans régression.

## 6. Rollback
Le code de polling n'est pas supprimé ; il est gelé derrière le mode conservation. En cas de défaut terrain critique, revenir au précédent cache PWA cohérent sans modifier les écritures Ledger/D1. Ne jamais restaurer une version plus ancienne par un workflow concurrent.

## 7. Critère de clôture
Le lot peut être livré si CI gouvernée, P0 financier, persistance et WebKit/offline passent sur le même lignage et si le smoke production confirme SHA/cache/version. La recette terrain reste distincte et doit pouvoir invalider la clôture fonctionnelle.


## 8. Impact additif — affichage immédiat de la commande offline
Le navigateur projette désormais le montant saisi avant d'attendre le transport, après validation syntaxique et métier locale. L'état de sauvegarde distingue toujours « Enregistrement », « synchro en attente » et confirmation.

**Risque contrôlé :** une erreur serveur réelle doit revenir à la valeur précédente. Les conflits de version suivent toujours leur resynchronisation ciblée.

**Test de non-régression :** la valeur 3000 doit apparaître en moins de 5 secondes après clic offline, l'Outbox doit rester visible et le replay ultérieur doit conserver exactement 3000.


## 9. Ajustement P0 — barrière de confirmation en ligne
L'optimisme d'affichage est restreint au navigateur explicitement hors ligne. En ligne, la réponse canonique redevient la barrière avant bascule visuelle du montant. Cela restaure la propriété testée « UI mise à jour ⇒ écriture Ledger déjà traitée » tout en conservant la réactivité offline.

Le cache PWA est rotaté vers `eco-system-v1529-free-conservation-debt-syncfix2-20261002` afin que Chrome/Opera n'exécutent pas un ancien `main.js` depuis le Service Worker.
