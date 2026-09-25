# ECO-SYSTEM — PLAN DE FINALISATION DE LA SAISIE FINANCIÈRE CANONIQUE
## Blocage terrain prioritaire · 25 septembre 2026

**Statut de ce document : EXÉCUTABLE / BLOQUANT / PRIORITÉ P0**  
**Production actuellement observée : 1.5.2.3-financial-entry-offline**  
**Décision : la 1.5.2.3 n'est PAS FIELD_ACCEPTED.**  
**Règle : aucun chantier L7–L12 ne peut être considéré prioritaire tant que la saisie financière de base n'est pas réellement fonctionnelle sur appareil réel.**

---

## 1. Constat terrain qui prime sur la CI

Le fondateur a testé la feuille de séance réelle et a constaté à plusieurs reprises que :

- un montant peut être tapé dans une cellule ;
- le bouton ✓ est visible ;
- le clic sur ✓ ne produit pas le résultat attendu dans la cellule ;
- la valeur totale affichée reste inchangée ;
- la touche Entrée ne constitue pas encore une preuve terrain de validation ;
- les changements de numéro de version ont été visibles, mais **pas le comportement métier attendu**.

Conclusion : les validations antérieures « 1.5.2.2 / 1.5.2.3 » ont prouvé des propriétés de code, de CI et de déploiement, mais **pas la réussite de l'interaction utilisateur réelle**.

### Règle de vérité
Ordre de preuve obligatoire :

`SPECIFIED → IMPLEMENTED → UNIT_TESTED → BROWSER_TESTED → DEPLOYED → SMOKE_VERIFIED → FIELD_ACCEPTED → ACQUIRED`

Une version, un test de chaîne, un grep ou un smoke HTTP ne valent jamais `FIELD_ACCEPTED`.

---

## 2. Minimum métier non négociable

Eco-System prétend gérer des tontines, associations, cotisations, prêts et caisses. Le minimum utilisable est donc :

1. le gestionnaire sélectionne une séance ;
2. il voit les membres × rubriques ;
3. il saisit un montant ;
4. il valide avec **✓** ou **Entrée** ;
5. la cellule affiche immédiatement la nouvelle valeur ;
6. les totaux ligne/colonne/global se recalculent ;
7. la saisie est durable ;
8. après actualisation, la valeur reste ;
9. hors connexion, la saisie reste durable localement et visible ;
10. au retour du réseau, elle se synchronise sans doublon ;
11. toute erreur est visible et compréhensible ;
12. aucune action utilisateur ne doit se terminer par un « rien ne se passe ».

Tant que ces douze points ne passent pas, la saisie financière n'est pas terminée.

---

## 3. Causes à investiguer et à fermer une par une

### P0-A — événement UI
Vérifier que le clic réel sur ✓ et la touche Entrée arrivent jusqu'au même contrôleur de cellule, sans interception par :
- un ancien listener ;
- `field-hardening.js` ;
- Voice UI ;
- un renderer concurrent ;
- un formulaire parent ;
- une réhydratation ou un MutationObserver ;
- une cellule reconstruite entre `mousedown` et `click`.

**Preuve attendue :** un événement unique `FINANCIAL_CELL_SUBMIT_STARTED` avec identifiant cellule/opération.

### P0-B — identité exacte de la cellule
La commande doit toujours transporter :
- tenant ;
- groupId ;
- meetingId ;
- membershipId ;
- rubricId ;
- valeur courante ;
- valeur cible ;
- version de cellule ;
- actorId ;
- clé d'idempotence.

**Interdit :** valider une cellule dont la séance ou la rubrique est ambiguë.

### P0-C — séance ouverte / clôturée
Le comportement doit être explicite :
- **séance ouverte + première saisie** : enregistrement direct ;
- **séance ouverte + correction** : correction canonique ;
- **séance clôturée** : régularisation/correction avec règle visible, jamais un clic silencieux ;
- si revue indépendante requise, l'UI affiche **« Proposition enregistrée — validation d'un second responsable requise »**, et non une valeur qui semble ignorée.

Le sélecteur doit afficher clairement l'état **OUVERTE / CLÔTURÉE** au-dessus de la matrice.

### P0-D — réponse serveur et état local
Une cellule suit un état explicite :
- `IDLE`
- `EDITING`
- `SAVING_LOCAL`
- `QUEUED_OFFLINE`
- `SYNCING`
- `CONFIRMED`
- `REVIEW_REQUIRED`
- `CONFLICT`
- `FAILED`

Chaque état doit être visible. Aucun échec silencieux.

### P0-E — projection locale durable
Dès validation :
- la valeur cible est écrite localement ;
- le rendu lit d'abord l'état local non résolu puis la vérité serveur ;
- le serveur ne peut pas repeindre une ancienne valeur par-dessus une intention locale plus récente ;
- l'outbox doit survivre à l'actualisation et au redémarrage PWA.

### P0-F — synchronisation
Au retour du réseau :
- réutiliser la même clé d'idempotence ;
- recevoir un ACK canonique ;
- remplacer l'état local pending par la valeur serveur ;
- ne jamais additionner une intention déjà confirmée ;
- si conflit, conserver les deux preuves et afficher le parcours de résolution.

### P0-G — recalcul immédiat des totaux
Après validation locale ou serveur :
- total membre ;
- total rubrique/colonne ;
- total séance ;
- récap/caisse concernés ;
- fiches individuelles ;
doivent lire la même projection canonique.

### P0-H — persistance après actualisation
Test obligatoire :
1. saisir 1 000 ;
2. valider ;
3. actualiser ;
4. retrouver 1 000 ;
5. fermer/réouvrir la PWA ;
6. retrouver 1 000 ou son état pending explicite.

### P0-I — offline réel
Test obligatoire avec `navigator.onLine=false`/réseau coupé :
- saisie ;
- ✓ ;
- Entrée ;
- rechargement ;
- affichage pending ;
- reconnexion ;
- sync ;
- absence de doublon.

### P0-J — Android 6 / ancien Chromium
Éviter les dépendances non compatibles sans fallback :
- `structuredClone` déjà polyfillé ;
- événements clavier : `key`, `code`, fallback `keyCode=13` ;
- IndexedDB : pas de méthode moderne obligatoire sans fallback ;
- pas d'API navigateur récente indispensable au commit de cellule.

---

## 4. Refactor obligatoire : un seul contrôleur de cellule

La logique actuellement dispersée dans le renderer doit être regroupée dans un **FinancialCellController** canonique.

Responsabilités :

```text
readCell()
beginEdit()
validateTarget()
commitLocal()
dispatchCanonicalCommand()
applyAck()
markReviewRequired()
markConflict()
markFailure()
recoverPending()
```

Le renderer ne doit plus décider seul du métier. Il affiche l'état fourni par ce contrôleur.

### Contrat de cellule
```ts
type FinancialCellState = {
  key: string;
  groupId: string;
  meetingId: string;
  membershipId: string;
  rubricId: string;
  nature: 'CONTRIBUTION'|'OUTFLOW'|'LOAN'|'REPAYMENT';
  serverValue: number;
  localTarget?: number;
  displayedValue: number;
  serverVersion: number;
  state: 'IDLE'|'EDITING'|'SAVING_LOCAL'|'QUEUED_OFFLINE'|'SYNCING'|'CONFIRMED'|'REVIEW_REQUIRED'|'CONFLICT'|'FAILED';
  operationId?: string;
  idempotencyKey?: string;
  message?: string;
  updatedAt: string;
};
```

---

## 5. UX obligatoire dans chaque cellule

Chaque cellule éditable doit contenir :

- valeur actuelle visible ;
- champ montant ;
- bouton ✓ ;
- validation Entrée ;
- état de sauvegarde ;
- message d'erreur local si nécessaire.

### Feedback attendu
- pendant sauvegarde : **« Enregistrement… »**
- local/offline : **« Enregistré sur cet appareil — synchro en attente »**
- confirmé : **« Validé »**
- revue : **« Proposition enregistrée — 2e validation requise »**
- conflit : **« Conflit à résoudre »**
- erreur : texte explicite + bouton **Réessayer**

Le bouton ✓ ne doit jamais simplement revenir à son état initial sans message.

---

## 6. Règles de valeur

### Première saisie
`0 → 1 000` donne **1 000**.

### Modification
`1 000 → 500` donne **500**, jamais 1 500.

### Effacement
La valeur cible 0 doit suivre la politique de correction/suppression et laisser une trace.

### Prêt
Le prêt reste une sortie de caisse / dette. Il ne doit jamais être additionné aux rubriques positives.

### Remboursement
Doit réduire la dette selon la politique de remboursement sans devenir un revenu fictif du gestionnaire.

---

## 7. Offline : architecture obligatoire

### Ecriture locale avant réseau
Toute validation financière doit créer un enregistrement local durable avant tentative réseau.

### Outbox
Chaque mutation :
- id ;
- cellKey ;
- payload complet ;
- idempotencyKey ;
- createdAt ;
- status ;
- attempts ;
- lastError.

### Projection
L'écran doit fusionner :
1. dernier snapshot serveur ;
2. opérations locales non résolues ;
3. ACK confirmés.

La projection locale ne remplace jamais le Ledger canonique : elle est une **vue temporaire durable** en attente de synchronisation.

---

## 8. Tests obligatoires avant toute nouvelle livraison

### Tests unitaires
- 0→1000 ;
- 1000→500 ;
- 500→0 ;
- double clic ;
- double Entrée ;
- clic puis Entrée rapide ;
- idempotence ;
- conflit de version ;
- revue indépendante ;
- réseau indisponible ;
- reconnexion.

### Tests intégration
- Outbox → API → Ledger → GET Ledger ;
- correction → version cellule ;
- snapshot + pending ;
- redémarrage application ;
- multi-gestionnaire.

### Test navigateur réel automatisé
Le test doit réellement :
1. ouvrir la page ;
2. sélectionner un groupe/séance ;
3. taper `1000` dans le champ ;
4. cliquer ✓ ;
5. attendre l'état `CONFIRMED` ou `QUEUED_OFFLINE` ;
6. vérifier le texte `1 000 F CFA` ;
7. taper `500` ;
8. appuyer Entrée ;
9. vérifier `500 F CFA` ;
10. vérifier les totaux ;
11. recharger ;
12. vérifier la persistance.

Un test qui se contente de rechercher `addEventListener('click')` ou une chaîne de texte n'est pas une preuve suffisante.

### Test offline navigateur
- charger une fois en ligne ;
- passer offline ;
- saisir et valider ;
- recharger offline ;
- vérifier valeur + badge pending ;
- repasser online ;
- attendre ACK ;
- vérifier absence de doublon.

---

## 9. Observabilité temporaire de diagnostic

Jusqu'à FIELD_ACCEPTED, ajouter un journal diagnostic léger et non sensible pour les cellules :

```text
CELL_EDIT
CELL_SUBMIT
CELL_LOCAL_COMMIT
CELL_NETWORK_SEND
CELL_ACK
CELL_RENDER
CELL_RETRY
CELL_CONFLICT
CELL_FAIL
```

Les événements contiennent des IDs techniques et montants nécessaires au diagnostic, mais pas de CNI/biométrie/téléphone.

Un panneau temporaire **Diagnostic saisie** réservé aux responsables/fondateur doit permettre de voir les 20 derniers événements de cellule.

---

## 10. Non-régressions à préserver

- Ledger unique ;
- D1 `eco-system-db` jamais recréée ;
- R2 `eco-system-backups` préservé ;
- migrations additives ;
- realMoneyEnabled=false ;
- tableaux séance et fiches individuelles = même owner ;
- multi-tontines ;
- Collation ;
- prêts/dettes/intérêts ;
- RECAP ;
- consensus multi-gestionnaires ;
- historique/audit ;
- Android 6 ;
- PWA/offline ;
- modes Visuel/Senior/Assisté ;
- aucun moteur financier parallèle.

---

## 11. Ordre exact de réalisation

### Lot F1 — reproduire et instrumenter
- journal d'événements cellule ;
- état explicite ;
- test du clic réel ;
- test Entrée réel ;
- vérifier séance ouverte/clôturée.

### Lot F2 — contrôleur canonique
- extraction du FinancialCellController ;
- clé de cellule stable ;
- projection server + local target ;
- idempotence.

### Lot F3 — persistance offline
- local commit avant réseau ;
- reprise après refresh ;
- sync/retry ;
- conflit visible.

### Lot F4 — totaux et surfaces
- recalcul ligne/colonne/global ;
- fiche individuelle ;
- feuille séance ;
- récap/caisse.

### Lot F5 — navigateur
- scénario complet click ;
- scénario Enter ;
- scénario correction ;
- scénario offline/reload/reconnect.

### Lot F6 — production
- CI complète ;
- BIR+ pré ;
- déploiement ;
- smoke exact ;
- BIR+ post + restore ;
- **pas de FIELD_ACCEPTED automatique**.

### Lot F7 — recette fondateur
- PC ;
- Android 6 ;
- si disponible iPhone/iPad ;
- online ;
- offline ;
- refresh ;
- correction ;
- totals.

---

## 12. Définition de DONE

Ce chantier est DONE uniquement si le fondateur peut démontrer sur son appareil :

> Je tape 1 000, je clique ✓ ou Entrée, la cellule affiche 1 000, les totaux changent, j'actualise et la valeur reste. Je coupe Internet, je recommence, la valeur reste localement et se synchronise au retour du réseau sans doublon.

Si cette phrase n'est pas vraie, le chantier reste ouvert.

---

## 13. Interdictions

- ne plus publier une nouvelle version uniquement pour changer des labels ;
- ne plus déclarer une fonction « corrigée » sur la seule base d'un test de présence de code ;
- ne pas reprendre L7–L12 avant passage du gate P0 financier ;
- ne pas effacer la D1 ;
- ne pas créer un second Ledger ;
- ne pas forcer une opération serveur pour masquer un bug d'interface ;
- ne pas transformer un échec ou une absence d'ACK en succès.

---

## 14. Point de reprise

**Branche de travail : `fix/1.5.2.4-financial-entry-e2e-20260925`.**

Première cible : reproduire la validation réelle de la cellule de la feuille de séance, la rendre observable, durable et testable de bout en bout.  
Le travail L7–L12 reste gelé jusqu'à FIELD_ACCEPTED de ce P0.
