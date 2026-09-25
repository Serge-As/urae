# ECO-SYSTEM — 1.5.3 VALUE MARKET CLOSURE
## Clôture terrain 1.5.2.1 + Community & Value Network opérationnel
Date : 23 septembre 2026

## 1. Objet

Cette release ferme le dossier issu de l’audit et des tests terrain du fondateur. Elle ne remplace aucun owner canonique. Elle corrige d’abord les régressions réelles observées sur la 1.5.2, puis rend opérationnelles les étapes 14, 15, 16, 17 et 19 du Community & Value Network qui restaient encore trop proches d’un Blueprint descriptif.

Doctrine permanente :

**réutiliser → étendre → adapter → créer seulement si aucun owner canonique ne couvre le besoin.**

Les owners conservés sont notamment Ledger, MeetingService, Rubrics/Living Rules, Membership/Identity, Marketplace, Community/Forum, GroupLiveHub, Business Studio, Launch/Ready-to-Use Kit, Evidence/Trust et Control Center.

## 2. Lignée vérifiée

### Production avant 1.5.3

La production 1.5.2.1 a été livrée et smoke-testée par le workflow GitHub Actions **35870745271 — SUCCESS**.

- source déployée : `109078c84374dddf5f64d8d836a2a726fd4a92ea`;
- version : `1.5.2.1-field-finance-debt-ux`;
- build : `eco-system-1.5.2.1-20260923`;
- cache PWA : `eco-system-v1521-field-finance-debt-ux-20260923`;
- D1 existante : `eco-system-db`, préservée ;
- R2 existant : `eco-system-backups`, préservé ;
- migrations : additives uniquement ;
- sauvegarde D1 avant et après déploiement avec vérification de restauration ;
- argent réel : **OFF**.

### Candidate 1.5.3

- branche : `finish/1.5.3-value-market-closure-20260923`;
- identité runtime : `1.5.3-value-market-closure`;
- build : `eco-system-1.5.3-20260923`;
- cache PWA : `eco-system-v153-value-market-closure-20260923`;
- rollback PWA cohérent : `eco-system-v1521-field-finance-debt-ux-20260923`;
- catalogue canonique : **160 capacités uniques** ;
- checkpoint fonctionnel qualifié : `bb4036906f28438831ea5faa6e22a8f9e2758656`;
- qualification du checkpoint fonctionnel : workflow **35890924444 — SUCCESS**.

Les commits documentaires postérieurs au checkpoint fonctionnel doivent repasser la même CI avant merge. Un run vert n’est jamais assimilé à une recette terrain.

## 3. Corrections terrain consolidées en 1.5.2.1 et préservées en 1.5.3

### 3.1 Feuille de séance et fiches individuelles

Les deux surfaces utilisent un owner de tableau financier unique.

Le bouton ✓ n’est plus décoratif :
- contribution → moteur de contribution canonique ;
- sortie/dépense → moteur de dépense ;
- prêt → création/décaissement du prêt ;
- remboursement → moteur de remboursement du prêt.

Une correction conserve les mécanismes existants de version, contrepassation, motif, consensus et revue indépendante. Il n’existe pas de second Ledger.

### 3.2 Prêt, dette et intérêts

Un prêt est une **sortie de caisse** et une position négative du membre, jamais une recette/cotisation positive.

La dette totale est explicitement :
- capital restant ;
- + intérêts déjà dus ;
- + autres obligations ouvertes.

À la clôture d’une séance, l’intérêt de la période est calculé sur le capital restant et rattaché explicitement à la **séance suivante**. Il ne rétroagit pas sur la séance qui vient d’être clôturée. Le mécanisme est idempotent et ne produit pas de double intérêt. Les intérêts impayés restent séparés du capital : pas d’intérêt sur intérêt.

### 3.3 Scroll, Membres, corbeille et alertes

- la roulette verticale fait défiler la page même si le pointeur se trouve au-dessus d’une grande matrice financière ;
- le scroll horizontal du tableau reste local ;
- les boutons de gestion Membres ne sont plus écrasés en lettres verticales ;
- après restauration, le message de corbeille reste visible 72 h puis disparaît de l’interface ;
- l’Accueil affiche au maximum cinq alertes prioritaires ;
- le reste se trouve dans le Centre d’alertes dédié ;
- les alertes gardent leurs actions de navigation.

### 3.4 Mode Visuel phare

Les trois modes conservent exactement les mêmes moteurs métier. Le mode Visuel reçoit une identité plus premium : profondeur, gradients sobres, cockpit, cartes, états, sans déplacer la vérité financière ni créer de fonctionnalités réservées à un mode.

## 4. Étape 14 — NOW Liquidation / Surplus NOW / Rescue Deal

Owner : `MarketService` + stock canonique.

Types :
- `NOW_LIQUIDATION`;
- `SURPLUS_NOW`;
- `RESCUE_DEAL`.

Publication obligatoire :
- stock canonique ;
- quantité réelle ;
- prix de référence réel et positif ;
- prix proposé inférieur ou égal au prix de référence ;
- raison réelle du rabais ;
- état/qualité du produit ;
- date du constat ;
- date de fin ;
- divulgation destinée à l’acheteur.

Garde-fous :
- stock réservé au pot/tontine non vendable ;
- pas de faux prix de référence ;
- pas de date de constat future ;
- pas de quantité supérieure au disponible ;
- pas de défaut caché présenté comme liquidation normale.

Une réservation membre crée une **commande canonique** et réserve le stock canonique. Elle ne crée aucun paiement réel.

## 5. Étape 15 — Predictive Demand Exchange

Pipeline obligatoire :

`ANTICIPATION → VALIDATION HUMAINE → MARKET_REQUEST`

Une demande `PREDICTED` exige :
- une référence `GROUP.ANTICIPATION`;
- le même groupe ;
- un état accepté (`ACTIVE` ou `DONE`) ;
- `humanValidated=true`.

Une prédiction ne peut donc jamais devenir silencieusement une commande, un engagement ou une transaction.

Une demande explicite reste possible sans prédiction.

## 6. Étape 16 — Eco Reverse Market

State machine :

`DRAFT/PREDICTED → OPEN → RESPONSES → SHORTLIST → SELECTED → FULFILLMENT → CLOSED`

Chemin de litige disponible depuis les états pertinents : `DISPUTED`.

Une réponse fournisseur conserve :
- fournisseur canonique ;
- prix unitaire ;
- quantité ;
- coût de livraison ;
- coût rendu ;
- délai ;
- conditions ;
- disponibilité ;
- preuve/référence ;
- variante.

Après sélection, le gestionnaire ne crée pas un enregistrement générique : il matérialise un **PROCUREMENT canonique** relié à la demande et à la réponse choisie.

## 7. Étape 17 — Eco Deals · Vente négociée

Types :
- Public Deal ;
- Group Deal ;
- Supplier Deal ;
- Fresh Deal ;
- Bulk Deal ;
- Institutional Deal.

Conditions publiques :
- prix public ;
- minimum fournisseur réel ;
- quantité maximale réelle ;
- qualité ;
- livraison ;
- date limite ;
- paliers quantité/prix réels.

Conditions internes réservées aux responsables :
- prix fournisseur ;
- commission ;
- promotion négociée ;
- bonus volume.

Les paliers doivent :
- augmenter strictement en quantité ;
- rester dans la quantité maximale ;
- ne jamais afficher un prix supérieur au palier précédent.

L’engagement d’un membre :
- incrémente une quantité réelle ;
- ne simule jamais de faux participants ;
- ne déclenche aucun débit.

Lorsque le vrai seuil est atteint, le Deal peut être activé. Pour un Deal lié à un stock, les engagements deviennent ensuite des **MARKET_ORDER canoniques**. Aucun second inventaire n’est créé.

## 8. Étape 19 — Eco Live Market

Capacités progressives :
- niveau 0 : texte ;
- niveau 1 : image / audio ;
- niveau 2 : vidéo courte ;
- niveau 3 : Live interactif.

Un Live peut épingler :
- un Deal ;
- un produit/stock ;
- un Hub/Forum ;
- une référence média/stream.

Fonctions :
- programmation ;
- démarrage ;
- présence unique par utilisateur ;
- compteur réel ;
- questions/interactions ;
- CTA d’engagement sur le Deal pendant le Live ;
- clôture.

Le chat durable reste le **Forum/Hub canonique**. Eco Live Market ne recrée pas un second moteur social.

Les changements principaux peuvent être diffusés via le `GroupLiveHub` existant avec le domaine `VALUE_MARKET`.

## 9. Blueprint 5.0.0 — plus de doublon

Les capacités devenues opérationnelles ne doivent plus être recréées comme dossiers génériques par le Blueprint.

Le Blueprint transmet désormais vers le Marché de valeur pour :
- `MARKETPLACE.DEMAND_EXCHANGE`;
- `MARKETPLACE.PROCUREMENT`;
- `MARKETPLACE.ECO_NOW`.

L’achat groupé, les Forums/Hubs et Partenaires/ONG conservent également leurs handoffs vers leurs owners canoniques.

## 10. Kit prêt à l’emploi et Business Studio

Ils ne sont pas réimplémentés dans 1.5.3, car leurs owners existants sont déjà fonctionnels et testés.

### Ready-to-Use Kit
Owner : Launch Studio.

Le kit est généré puis persisté avec le groupe après création. Il reste un accélérateur de mise en exploitation du groupe, pas une simple carte catalogue.

### Business Studio
Owner : Business Studio spécialisé.

Il conserve :
- faisabilité ;
- catalogue/offre ;
- demande ;
- commandes ;
- communication ;
- suivi prospect → encaissement documenté ;
- séparation stricte revenu privé / finance collective ;
- agent borné ;
- refus des extractions non documentées de la caisse du groupe.

Le Community & Value Network complète ces owners ; il ne les remplace pas.

## 11. UI et expérience

Nouvelle surface : `#valueMarketPanel` dans l’espace Ecosystème.

Elle expose quatre blocs opérationnels :
1. NOW / Surplus / Rescue ;
2. Predictive Demand + Reverse Market ;
3. Eco Deals ;
4. Eco Live Market.

Les erreurs métier sont traduites en messages compréhensibles pour un novice : anticipation non validée, rabais incohérent, quantité dépassée, seuil Deal non atteint, Live non démarré, etc.

L’affichage membre ne révèle pas les conditions internes de négociation ni les données de stock de gestion ; les libellés utiles sont projetés sans ouvrir les workspaces internes.

## 12. Tests de non-régression ajoutés

`tests/value-market-1.5.3.test.mjs` verrouille notamment :
- vérité du rabais et divulgation ;
- claim membre → commande canonique ;
- réservation du stock canonique ;
- prédiction non validée rejetée ;
- prédiction validée → demande ;
- fournisseur → réponse → shortlist → sélection ;
- sélection → procurement canonique ;
- faux palier Deal rejeté ;
- seuil réel ;
- confidentialité des conditions internes ;
- matérialisation en commandes canoniques ;
- Live niveau 3 ;
- produit/Deal épinglé ;
- compteur unique ;
- Q&A ;
- handoff Blueprint vers owner canonique.

Les suites historiques finance, offline, session, PWA, gouvernance, Business Studio, Kit, Community, D1 et architecture restent actives.

## 13. Garde-fous permanents

À ne pas modifier sans décision explicite et preuve de remplacement :
- `eco-system-db` ;
- `eco-system-backups` ;
- Ledger unique ;
- migrations additives ;
- finance réelle OFF ;
- aucun intérêt sur intérêt ;
- dix étapes de création ;
- Collation ;
- multi-tontines ;
- RECAP ;
- MeetingService ;
- Living Rules ;
- Forum/Hub canonique ;
- stock et commandes Marketplace canoniques ;
- Kit Launch Studio ;
- Business Studio spécialisé ;
- BIR+/snapshots avant et après production.

## 14. Critères de fermeture

Le dossier 1.5.3 ne peut être déclaré fermé qu’après :
1. CI du HEAD exact : SUCCESS ;
2. PR mergeable et fusionnée vers la branche release ;
3. workflow production avec D1/R2 acquis ;
4. snapshot pré-déploiement ;
5. migrations additives seulement ;
6. déploiement du SHA exact ;
7. smoke root + health + catalogue ;
8. version `1.5.3-value-market-closure` ;
9. build `eco-system-1.5.3-20260923` ;
10. cache `eco-system-v153-value-market-closure-20260923` ;
11. catalogue >= 160 capacités ;
12. `realMoneyEnabled=false` ;
13. snapshot post-déploiement restaurable, integrity check OK.

Après cela, la recette terrain du fondateur reste une preuve distincte. Toute anomalie terrain ouvre un correctif ciblé, sans annuler les acquis.
