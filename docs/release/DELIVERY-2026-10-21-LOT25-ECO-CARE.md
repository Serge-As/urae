# L25 — Eco Care / SAV et attentes préventives

État : candidate **1.5.2.29-eco-care**, publication non encore revendiquée. La production attestée reste **1.5.2.28-notification-inbox**, source `0266e1b895d4a91a4bc57d189608aae360393c24`, livraison `39617145115 SUCCESS`. L25 doit passer ses portes complètes sur la même source avant déploiement, puis la sauvegarde restaurable et les empreintes publiques.

## Ce que cette étape apporte

Dans **À faire → Eco Care**, créer une demande privée ou choisir explicitement les gestionnaires du groupe actif. Un dossier présente son demandeur, son responsable ou l’absence d’affectation, la prochaine action, la partie attendue et une éventuelle date indicative. Les filtres Tous, En cours, Non affectés et Dont je suis responsable n’effectuent aucune mutation. Aucun agent humain ou délai garanti n’est inventé.

Pour le commerce personnel, le formulaire existant « Signaler un problème sur cette commande » ouvre une référence auprès de Kernel.Cases. Son audience indique les parties actuellement habilitées de la commande. Un vendeur autorisé retrouve ainsi le dossier créé par son acheteur, y compris entre deux tenants de compte. Les droits proviennent de MarketService et des mandats actuels de la boutique. Le demandeur et le vendeur travaillent sur le même dossier ; aucune copie de commande ou seconde comptabilité n’est créée.

Les anciens dossiers privés restent privés, y compris ceux ouverts depuis une commande avant cette version. Leur simple lecture ne les transforme pas en dossier partagé. Les dossiers historiques sans champs Eco Care sont pris en charge avec une révision initiale zéro, sans fabriquer d’anciens événements.

Le responsable peut être affecté, retiré avec motif, commencer l’examen, préciser une prochaine action et proposer une résolution. Le demandeur accepte ou refuse cette proposition ; une proposition n’est pas déjà une résolution acceptée. Après acceptation, il peut clôturer puis rouvrir avec un motif. La médiation et le recours restent des demandes tracées, sans décision juridique automatique. Le demandeur peut aussi retirer sa demande avec motif, sans prétendre qu’une opération métier a été réalisée.

Une résolution de dossier ne rembourse pas, ne paie pas, n’approuve pas une écriture financière, ne livre pas et ne corrige pas un stock. Ces actions restent chez leurs propriétaires existants. La fiche indique cette séparation ; les contrats retournent `financialOutcome: NOT_INFERRED`.

## Attentes avant engagement — I18

Un dossier de catégorie Prévention partagé avec les gestionnaires d’un groupe permet de convenir d’attentes avant un engagement : une ligne par attente, avec valeur ou « non applicable ». Un responsable distinct du demandeur doit être affecté. La proposition reçoit un numéro de version. Les deux personnes acceptent explicitement cette même version ; un accord ne naît pas de la seule proposition ou d’une seule signature.

Exemple : « Remise = Après essayage », « Transport = N/A ». Une version 2 proposée reste distincte de la version 1 déjà acceptée. Les anciennes versions et acceptations sont conservées dans l’historique du dossier et consultables. Une commande déjà acceptée ne peut pas recevoir rétroactivement de nouvelles conditions au moyen de ce mécanisme.

Limite explicite : cette étape fournit une référence préventive indépendante, à mentionner dans le parcours concerné. Elle n’ajoute pas automatiquement cet accord à chaque commande, boutique personnelle, devis ou capacité de l’application. Le parcours préventif de cette étape est celui du dossier de groupe avec deux parties habilitées. Un dossier de commande est un SAV et ne sert pas à introduire après coup ces conditions. La validité juridique n’est pas certifiée par le logiciel.

## Propriétaires et stockage

Kernel.Cases définit les transitions et événements. Le nouveau fichier `packages/platform-kernel/src/case-care.ts` constitue une extension de ce propriétaire. L’adaptateur `workers/api/src/care.ts` contrôle les accès et délègue ces transitions ; il ne crée pas un service de vérité parallèle. Les dépôts mémoire, D1 et fichier conservent les `CaseRecord` dans leur stockage acquis. Aucun nouveau schéma, migration ou stockage financier n’est introduit.

Chaque commande indique une révision attendue et une clé de répétition. L’événement et le nouvel état sont écrits ensemble par mise à jour conditionnelle du dossier. Deux réponses incompatibles sur la même révision ne s’écrasent pas : une seule passe, l’autre reçoit un conflit. Répéter la même clé et le même contenu retrouve l’état confirmé ; changer le contenu avec cette clé est refusé. Cette reprise fonctionne aussi après une réponse perdue après écriture.

Le passage d’une révision à la suivante conserve les événements précédents. La référence de preuve doit correspondre à une preuve immuable dont la personne est l’auteur, dans le tenant et le périmètre du dossier. Les références sont conservées ; cette étape n’installe pas un nouvel hébergeur de pièces et ne prétend pas fournir une galerie universelle de fichiers privés. Les preuves d’un autre tenant ne sont pas transférées implicitement.

Les vérifications de groupes sont réutilisées uniquement pendant une liste HTTP, pour éviter une relecture identique pour chaque dossier. Une nouvelle requête ou commande revalide les droits. Aucun cache d’autorisation partagé entre comptes n’est ajouté.

## Contrats HTTP

| Route | Effet et droit |
| --- | --- |
| GET `/api/v1/care/cases` | Liste des dossiers actuellement autorisés ; au plus 100 présentés, avec indicateur de troncature. |
| POST `/api/v1/care/cases` | Création générale avec résumé, catégorie, groupe facultatif et clé de répétition. Auteur et état sont fixés par le serveur. |
| GET `/api/v1/care/cases/{id}` | Dossier, droits actuels, responsables habilités et noms utiles ; aucune exécution métier. |
| POST `/api/v1/care/cases/{id}/commands` | Commande versionnée auprès de Kernel.Cases ; aucune écriture Ledger ou stock. |
| POST `/api/v1/market/orders/{id}/support` | Adaptateur commercial existant, contrôlé par MarketService ; nouveaux dossiers partagés avec les parties autorisées. |

Les routes historiques `/api/v1/cases` restent disponibles. Le code client utilise les routes Care pour la nouvelle interface. Une liste ou un détail privé exige le serveur ; aucun vieux snapshot n’est présenté comme une revalidation d’autorisation. Hors ligne, le texte de la réponse reste dans le formulaire courant, sans confirmation fictive et sans alimenter l’outbox financière.

Exemple de création synthétique :

```json
{"summary":"Quantité remise à vérifier","category":"ISSUE","groupId":"group_demo","idempotencyKey":"care_create_demo_01"}
```

Exemple d’affectation, après lecture du dossier :

```json
{"action":"ASSIGN","expectedRevision":1,"assignedTo":"manager_demo","idempotencyKey":"care_assign_demo_01"}
```

La personne affectée doit être actuellement habilitée au périmètre ; un identifiant arbitraire ou un rôle simplement transmis dans un en-tête ne suffit pas. La révision suivante sert à la prochaine commande :

```json
{"action":"PROPOSE_RESOLUTION","expectedRevision":2,"note":"Vérifier la quantité avec les parties avant une correction chez le propriétaire du stock.","idempotencyKey":"care_proposal_demo_01"}
```

Le demandeur effectue ensuite `ACCEPT_RESOLUTION` ou `REFUSE_RESOLUTION`, avec sa révision actuelle. `CASE_VERSION_CONFLICT` et `CASE_IDEMPOTENCY_CONFLICT` sont des conflits HTTP 409. Les droits sont contrôlés avant la consultation et avant une reprise idempotente ; une ancienne autorisation n’accorde pas un accès permanent.

## Qualification et défauts effectivement rencontrés

La première compilation TypeScript/PWA normale a réussi : 73 assets initiaux et 51 transitifs, aucun import local absent. Sur cette première candidate, 29 scénarios natifs ont passé, couvrant mémoire et SQLite/D1, plus la persistance fichier. Deux scénarios Chromium ont passé : SAV entre comptes et attentes préventives à deux parties. Le troisième a échoué : après une coupure injectée, le texte restait conservé mais la reprise explicite était encore retenue par le court circuit de transport.

La correction réutilise `canAttemptCriticalWrite` pour les seules nouvelles commandes Care explicites. Cette fonction acquise réouvre une tentative de transport bornée, conserve la protection des quotas D1 et ne modifie pas l’outbox financière. Elle-même et les chemins financiers ne sont pas réécrits. Un trentième scénario natif vérifie deux essais explicites, aucune requête sous blocage D1 et aucune modification de l’outbox. L’assertion mobile initiale est conservée ; aucun délai acquis n’est augmenté pour masquer le défaut.

Ces premiers résultats ne constituent pas la qualification finale de 1.5.2.29. La nouvelle source doit passer le jeu complet attendu : **898 natifs, 39 Chromium de livraison et 6 WebKit**, avec **33 empreintes publiques** après publication. La qualification séparée prévoit 35 Chromium principaux plus les deux acquis à deux comptes, soit 37, et 6 WebKit. Les chiffres définitifs doivent être pris dans les journaux réels, pas dans cette prévision.

## Limites d’exploitation et reprise

Liste affichée : 100 dossiers ; historique affiché initialement : 30 événements, avec accès à tout l’historique conservé. Conservation d’un dossier : au plus 200 événements et 256 Kio sérialisés, afin de refuser explicitement une croissance excessive avant une écriture partielle. Une poursuite peut mentionner la référence d’un ancien dossier, qui reste conservé. Aucun effacement silencieux d’événement n’est effectué.

Les lectures du dépôt ne constituent pas encore une pagination serveur à coût constant. Les actualisations sont volontaires ; aucun polling, ordonnanceur de relance, transport externe payant ou présence SAV humaine n’est ajouté. Les nouvelles pièces binaires ne sont pas gérées dans une seconde filière. Les autres innovations conservent leur propre statut dans le registre.

Le repli consiste à retirer la nouvelle projection en conservant les dossiers, leurs versions et événements, puis à corriger vers l’avant. Aucun vidage de navigateur, aucune suppression d’outbox, recréation D1/R2 ou rotation de clé n’est autorisé par cette étape. `realMoneyEnabled=false`, `FIELD_ACCEPTED=NOT_ACCEPTED`. La consommation exacte des crédits de ce chat n’est pas mesurable.

## Qualification locale après correction

30 scénarios natifs ciblés, les **898 tests natifs complets** et les **3 scénarios Chromium Care** passent sans ignoré. Les contrôles architecture, gouvernance, constitution, vérité, mémoire et couverture passent. Défauts initiaux conservés dans le reçu local : reprise réseau mobile, couverture du dictionnaire anglais et cache précédent de récupération. Corrections effectuées chez les propriétaires existants, sans affaiblir les assertions. Reçu : docs/release/evidence/LOT25-ECO-CARE-LOCAL-2026-10-21.json. La qualification complète distante du même SHA, la sauvegarde restaurable et les empreintes publiques restent obligatoires avant publication. FIELD_ACCEPTED=NOT_ACCEPTED ; coût exact du chat non mesurable.

Le contrôle natif complet initial avait 897 succès et un défaut de couverture des textes anglais. Les textes Care ont été ajoutés au dictionnaire runtime commun, au lieu de contourner le contrôle. Le rejeu complet produit 898 succès. Le contrôle du cache de récupération avait également refusé une référence v27 ; le prédécesseur réel v28 est désormais conservé avec v27. Le dernier contrôle navigateur mobile conserve les assertions initiales et passe. Les journaux avant correction restent archivés.

La lecture de la capture mobile a également révélé un ancien message d’échec encore visible après réussite. La projection Care efface désormais uniquement son propre message encore correspondant ; une autre erreur n’est pas masquée. Le dernier rejeu Chromium conserve les trois succès et vérifie immédiatement la disparition de l’ancienne erreur après l’action confirmée. Le moteur financier et son traitement d’erreurs restent inchangés. Cette fermeture visuelle est incluse dans la source soumise à la qualification complète distante.

La première qualification distante, source 2f7f65956f2c6f73c870c42cfd968402dec5347f, run 39657662164, a refusé la compilation TypeScript (TS1117) : la clé « Ouvrir un dossier » existait déjà dans une ligne du dictionnaire commun. La nouvelle occurrence a été retirée ; la traduction acquise reste en place. Le typecheck complet normal local passe après correction. La production v28 n’a pas été modifiée par cette candidate refusée. Le rejeu complet distant et la livraison restent obligatoires sur la nouvelle source. Les deux journaux initiaux sont conservés ; aucune porte ni assertion ne change.
