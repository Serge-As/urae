# RECALL — Stabilisation Live gratuit, dettes, épargne, rubriques et offline

**Date : 2026-10-02**  
**Branche source : `fix/1.5.2.6-field-persistence-pc-mobile-20260925`**  
**Checkpoint fonctionnel avant clôture : `c746dc9ceb2eaf550ab99793d55af41fc4c7ca54`**  
**Nature : Memory Before Code / anti-régression**

## 1. Mandat terrain
Le fondateur signale plusieurs défauts réels sur la production 1.5.2.9 :
- une modification 1500 → 3000 peut apparaître chez l'autre gestionnaire mais rester à 1500 chez l'auteur ;
- après rafraîchissement, des montants peuvent momentanément revenir à 0 ou disparaître avant de réapparaître ;
- le polling quasi-continu de synchronisation a épuisé très rapidement le quota journalier D1 Cloudflare ;
- le Live doit rester interactif sans multiplier les lectures D1 ;
- les dettes doivent inclure capital, intérêts déjà dus, prochain intérêt projeté et autres dettes ;
- le modèle doit rester compatible avec le classeur historique « Rubriques Emprunts » sans créer un deuxième moteur financier ;
- la rubrique Remboursements et les rubriques historiques doivent rester visibles/restaurables ;
- Prêts + Intérêts et le plus grand nombre possible de fonctions doivent rester utilisables offline ;
- chaque rubrique doit fournir un tableau récapitulatif membres × séances ;
- Épargne + Intérêts doit se nourrir automatiquement des données réelles du Ledger, des feuilles et des périodes de prêt.

## 2. Décisions de stabilisation

### 2.1 Live en mode conservation gratuit
Le polling financier D1 récurrent est désactivé en mode gratuit. Le chemin normal devient :
1. écriture canonique ;
2. réponse de transaction ;
3. WebSocket/Durable Object pour la propagation immédiate ;
4. Outbox idempotente si la connexion échoue ;
5. lecture canonique uniquement lors d'un accès explicite, reprise, changement de contexte ou action qui en a réellement besoin.

Le code du polling reste conservé derrière le garde-fou `FREE_CONSERVATION_MODE` afin de pouvoir être réactivé plus tard si une offre payante le justifie.

### 2.2 Valeur confirmée côté auteur
Une valeur confirmée localement/serveur ne doit plus être écrasée par une projection canonique momentanément en retard. La dernière valeur confirmée est conservée temporairement comme vérité d'affichage côté auteur jusqu'à ce qu'une version canonique égale ou plus récente la confirme.

### 2.3 Rafraîchissement
La validation d'une cellule ne doit pas reconstruire toute la page. Le tableau conserve sa position et les changements ciblés mettent à jour la cellule et les totaux concernés. Les gros rafraîchissements restent réservés aux changements structurels.

### 2.4 Dettes / intérêts
La projection dette suit :
- capital restant ;
- intérêts déjà exigibles ;
- prochain intérêt projeté ;
- amendes/pénalités ;
- autres obligations/impayés ;
- dette exigible ;
- dette + prochaine échéance.

Les intérêts impayés sont séparés du capital et ne produisent pas d'intérêt sur intérêt. Les politiques `NEXT_SESSION_DUE`, `UPFRONT_DEDUCTED` et `UPFRONT_REQUIRED` restent distinctes.

### 2.5 Épargne + Intérêts
La source canonique combine :
- reçus Ledger liés aux rubriques d'épargne ;
- rubriques d'épargne dynamiques, y compris Épargne scolaire ;
- événements de remboursement ;
- intérêts encaissés ;
- périodes de prêt ;
- prêts ouverts ;
- obligations du groupe.

Le tableau de santé compare les remboursements + intérêts collectés aux dettes courantes puis à l'épargne totale. Le stress de prochaine échéance reste séparé de la dette actuellement exigible.

### 2.6 Rubriques
Les rubriques archivées restent visibles dans le menu Rubriques avec leur historique et une action de restauration. Chaque rubrique peut exposer un récapitulatif membres en lignes × séances en colonnes, calculé à partir de la même vérité financière.

### 2.7 Offline
Le noyau Completion/Loan sait créer et transitionner localement avec Outbox. Le décaissement, le remboursement et l'historique de prêt disposent d'un chemin offline local, puis synchronisation idempotente. Les capacités impossibles sans serveur externe ne doivent pas mentir : elles conservent la dernière projection disponible et signalent clairement leur état.

## 3. Invariants anti-régression
- Ledger canonique unique.
- Deux feuilles = deux vues d'une même vérité.
- Remplacement exact d'une cellule, jamais addition silencieuse.
- ✓ et Entrée restent deux moyens équivalents de valider.
- Prêt = sortie de caisse + créance sur membre.
- Intérêts séparés du capital ; aucun intérêt sur intérêt.
- Offline = intention locale puis synchronisation, jamais faux succès serveur.
- D1 existante `eco-system-db` réutilisée ; aucune recréation.
- R2 existant réutilisé ; migrations additives uniquement.
- `realMoneyEnabled=false`.
- Présence de code ≠ preuve terrain.

## 4. Preuves automatisées du checkpoint c746dc9
- P0 financier navigateur : run **37012029747 — SUCCESS**.
- Persistance terrain : run **37012029824 — SUCCESS**.
- Sovereign Offline + WebKit/iOS : run **37012029869 — SUCCESS**.
- Tests dédiés : `free-conservation-live-2026-10-02.test.mjs`, `debt-workbook-rubric-recap-2026-10-02.test.mjs`, `offline-sync-confirmed-projection-2026-10-02.test.mjs`.

## 5. Vérité au moment de cette clôture
Le checkpoint fonctionnel est qualifié automatiquement mais le premier workflow de livraison du SHA `c746dc9...` a été bloqué **avant mutation production** par le Memory Gate, faute de RECALL/CIR dans le commit déclencheur. Cette clôture ajoute ces deux pièces puis relance la livraison. Aucun FIELD_ACCEPTED ne doit être déclaré avant nouvelle recette réelle Opera/Chrome/mobile/offline par le fondateur.
