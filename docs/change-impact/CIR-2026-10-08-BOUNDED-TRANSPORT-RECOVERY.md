# CIR — reprise transport bornée, audit et continuité Eco-System

Date : 2026-10-08. Base : `25ad23f3bdd39ac82c0529cf1b0dfa15d30acc0e`, production servie attestée `d027f09a1382cd29054b33e274f3fd3bf9f8d9f3`. Candidate : 1.5.2.15.

## Problème concret

Une erreur fetch arme un réveil après 3,65 s. Le listener du shell appelait forceTransportRetry avant resumeOnline ; la tentative suivante en échec armait un autre réveil. Après cinq échecs, la même remise à zéro rouvrait le plafond Outbox. Un téléphone « en ligne » devant un serveur indisponible pouvait donc répéter indéfiniment les tentatives HTTP sans action utilisateur.

Reproducteur déterministe utilisant les corps de méthode et le listener réels, avec horloge simulée : baseline 9 envois échoués / 8 réveils / 1 minuteur restant en 30 s ; candidate 2 / 1 / 0. Ces nombres ne prétendent pas mesurer le trafic public ou la performance d'un appareil réel.

## Décision et owners

Étendre Application/Outbox et son shell actuel. Ajouter un verrou de réveil par épisode de panne ; l'alarme ne le réinitialise pas et ne rouvre pas les tentatives épuisées. Une vraie réponse HTTP réussie annule le réveil restant et réarme un futur épisode. Retour réseau, Live authentifié, retour au premier plan et nouvelle validation humaine restent des occasions de reprise. La protection quota D1 et les conflits métier restent distincts.

Aucun nouveau moteur, base, service financier, cache d'autorisation ou fournisseur. Ledger/D1, GroupLiveHub, Relay et les deux feuilles demeurent leurs owners. La fermeture locale reste durable avant transport et conserve la même clé d'idempotence.

## Release et récupération

Nouvelle identité cohérente 1.5.2.15 dans contrat, Worker, build, HTML, package et cache. Rollback v15214 ; conserver aussi les références v15213, réellement installé v15211 et legacy v15210. Aucune migration/suppression IndexedDB, ni mutation D1/R2 ou des politiques de prêt.

Réutiliser le workflow de qualification existant ; y inclure le scénario multi-manager déjà exigé par la livraison. Archive git de la source exacte, SHA-256 vérifié et lecture tar vérifiée, conservée comme artefact GitHub 30 jours. Ceci sauvegarde code/mémoire, pas les données financières de production. Le workflow de livraison existant reste code-only-no-d1-export-no-migration.

## Tests significatifs prévus

- Application/Outbox réels avec horloge Node simulée et listener du shell : panne prolongée, même intention durable jusqu'à vraie reprise ; pas de remise à zéro automatique après cinq échecs ; conflits/confirmations/quota préservés.
- Réponse HTTP réussie : aucune alarme obsolète ; un futur épisode de panne reçoit une seule reprise.
- Activation réelle du handler SW sous caches simulés : ancien cache récupérable conservé, cache étranger intact.
- Chromium, deux comptes distincts : API inaccessible pendant que navigator.onLine reste true, saisie durable, période inactive sans requêtes répétées, retour réseau, convergence et même clé ; aucune confirmation serveur fictive.
- Suite gouvernée complète, anciens tests Chromium et WebKit du même SHA.

Qualification et livraison : **pas encore attestées dans ce premier checkpoint**. Les vrais résultats seront ajoutés après lecture des runs. FIELD_ACCEPTED demeure NOT_ACCEPTED. Une recette physique Android 6/iOS/2G et les intégrations externes ne se déduisent pas de ces tests.

## Première qualification distante

Run `37819377867`, SHA `12e452865f127a210d2c1f55b45b20be74ffa4fb` : gates gouvernés/build exécutés, Node **648/650**, dont les trois tests fonctionnels de transport PASS. Deux fixtures SW échouent : ancien nom de cache courant codé en dur dans le test de prédécesseur installé, et origin manquant dans la nouvelle simulation. Les fixtures sont reliées au contrat courant et à un environnement SW complet ; les assertions de conservation et de readiness restent obligatoires. Sélection de groupe hors réseau pendant le setup des tests de transport évite un warmup d'horloge sans rapport avec leur scénario. Nouvelle CI requise ; aucune livraison de candidate présumée.

## Qualification validée — 1.5.2.15, avant livraison

Source qualifiée : `3f7ea03457bbd936a87e299270843043e2826a24`, PR **#71 fusionnée** dans la branche de livraison par `754a8cef153b7ebe92b993de3b68f7a2c42d9f2d`. Runs **37820287689 SUCCESS** et **37820287701 SUCCESS** : **650/650 Node**, **Chromium 8/8**, **WebKit 6/6**, dont le scénario API inaccessible/navigator online et convergence de la même intention entre deux gestionnaires.

Le job gouverné du run **37820281608** est SUCCESS ; archive source **11567969551**, **1 775 802 octets**, digest artefact `sha256:53a664ea2da558f188aae304fe8da06d2bea52b8bf286955d6a88bfb556e79bc`, contrôle SHA-256 interne et lecture tar PASS. Son troisième job navigateur reste bloqué à l'installation des navigateurs au moment de ce checkpoint ; il n'est pas compté comme un troisième run réussi. Les deux autres workflows complets exécutent les mêmes suites requises.

**Production 1.5.2.15 : NON ENCORE ATTESTÉE**. La source est qualifiée, la livraison code-only doit encore prouver /health du SHA livré. La production antérieure 1.5.2.14 reste la dernière attestée à ce point. FIELD_ACCEPTED=NOT_ACCEPTED ; realMoneyEnabled=false. Les blocs suivants décrivent les checkpoints précédents.

---

