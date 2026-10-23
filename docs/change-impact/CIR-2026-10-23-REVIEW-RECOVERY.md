# CIR — L22 / L26 / L27, relecture et reprise contrôlées

### Correction de la qualification du conteneur et du chevauchement de démarrage

Contrôle suivant4d6595992f923cc9e26b529acb870eb0b5a762c0 : l'archive source et les1008tests natifs réussissent, et le parcours acquis de boutique passe. La livraison39993629234 exigeait cependant Chromium1194 de Playwright1.56.1 dans une image1.55.0 : le package-lock et package.json imposent déjà1.56.1, tandis que l'autre workflow le remplaçait temporairement par1.55.0. Les deux jobs utilisent maintenant l'image1.56.1 et le paquet déjà verrouillé par npm ci, sans substitution temporaire, avec assertion de version avant lancement réel des deux navigateurs. La qualification39993629206 a ensuite observé la première lecture Business Studio pendant sa mesure d'inactivité : le test attend désormais le résultat affiché de cette lecture précise avant d'exiger toujours zéro requête pendant l'intervalle. Aucun événement ou appel périodique n'est filtré de cette assertion.

La source6b1c801474212cf384872691638b2c6b51970ec6 a validé les1008tests natifs, mais la livraison39980223145 a refusé l'archive Git pour propriété du dossier CI. Chaque job conteneur déclare maintenant uniquement `$GITHUB_WORKSPACE` comme dossier Git sûr, après checkout et avant toute barrière ; aucune exception globale `*` n'est ajoutée. Le job navigateur39980223175 a détecté l'absence des réglages de la boutique après sa création. L'inspection a identifié un rafraîchissement facultatif du démarrage capable d'invalider le formulaire pendant la commande. Le rafraîchissement de groupe capture désormais le contexte, la génération et l'activité de la projection de boutique avant ses lectures asynchrones ; une navigation, saisie ou soumission plus récente rend cette intention caduque. Les rafraîchissements explicites et les effacements à changement de compte/groupe restent acquis. Le service canonique et les transactions ne changent pas.

Un essai navigateur déterministe retient séparément la lecture Inbox et la commande de création, libère la fin du démarrage, exige la conservation du nom et de la commande en cours, puis une seule boutique privée et ses réglages après confirmation serveur. Les suites acquises restent intégralement exécutées. Les échecs précédents sont conservés ; la source corrigée doit obtenir ses propres qualifications et sa preuve publique avant d'être dite déployée.

Autorisation : poursuite explicite des lots et innovations demandée par le fondateur ; aucun redémarrage. Base applicative locale v34, publication v34 qualifiée séparément. Cette note ne vaut pas preuve de déploiement de v35.

## Périmètre et propriétaires

- SafetyCaseService conserve les signalements et reçoit des analyses pédagogiques personnelles immuables : questionnaire versionné, source déclarée, information inconnue, hypothèses et flux reproductibles. Un dossier personnel ne devient jamais une accusation publique ni un score financier.
- GroupDocumentService conserve les documents. Le téléversement prépare une relecture éditable, puis une confirmation distincte du texte et des nombres avant enregistrement. Une image sans texte extrait exige une transcription humaine ; aucune capacité OCR automatique inexistante n'est annoncée.
- Les outils de sauvegarde existants vérifient une restauration sur copie, les tables attendues et des empreintes des données. Leur périmètre D1 + source est explicite ; les objets binaires R2 et les files locales d'un appareil ne sont pas réputés sauvegardés.
- Le panneau qualité permet un diagnostic sans écriture et l'export volontaire d'un incident minimal sans texte libre, identité, montant, URL ou pièce. Le gabarit synthétique proposé n'est pas une preuve que le défaut réel a été reproduit.

## Défaut constaté et effets indirects

La liste sans groupe de SafetyCaseService et plusieurs commandes de dossiers personnels ne contrôlaient pas le créateur. Le recours n'imposait pas de lien avec le dossier. Correction ciblée : propriétaire personnel, responsables autorisés du groupe, et recours limité aux parties concernées encore autorisées. Les voies workspace génériques ne doivent ni lire ni réécrire ces agrégats. Le graphe de confiance conserve uniquement la référence et l'état du dossier pour le sujet autorisé, sans résumé privé.

Le nouveau contrôle des documents peut refuser un texte trop grand ou trop riche en nombres, plutôt que le tronquer silencieusement. Les autres créateurs de documents restent compatibles avec les documents historiques sans attestation de relecture. Deux corrections différentes d'un même fichier doivent rester distinctes ; une empreinte de fichier seule ne doit pas absorber une correction.

## Barrières avant publication

Tests mémoire et SQLite/D1 : isolement propriétaire/tiers/groupes, recours, blocage workspace, texte hostile inerte, nombres1000/10000, droits des pièces, absence d'écriture Ledger. Restauration synthétique : tables et relations, montants sources, adhésion retirée, fichier tronqué/incomplet refusé. Navigateur FR/EN et mobile : relecture réellement obligatoire, conservation des champs sur erreur, export volontaire et nettoyage à la déconnexion ; zéro polling nouveau. Qualification complète sur le SHA publié, sauvegarde préalable, vérification des assets publics et du Worker.

`realMoneyEnabled=false` et `FIELD_ACCEPTED=NOT_ACCEPTED`. Pas de migration, dépendance payante, rotation de signature, purge d'outbox, réparation automatique ou commande de redémarrage. Repli limité aux nouvelles projections ; aucune restauration aveugle de production.

Qualification des téléversements : le serveur de développement reçoit un adaptateur de fichiers éphémère en mémoire, limité32MiB et détruit avec le processus. Le test traverse le vrai parseur texte et le vrai registre de documents ; il ne certifie pas le fournisseur R2 ni un OCR image. Aucun changement de stockage de production.


Navigation : la promesse de démarrage est résolue après restauration du compte/groupe et chargement du catalogue, avant les lectures secondaires. L’historique courant reste prioritaire à la fin du démarrage. Un test bloque explicitement la lecture Inbox, ouvre le Labo, conserve un brouillon puis libère la lecture ; il doit confirmer le maintien de la destination et du brouillon. Les contrôles d’absence d’écriture métier du diagnostic excluent seulement les commandes de transport Live `retry-pending`, `signal` et `publish` ; toute autre écriture API reste un échec. La suite financière acquise demeure obligatoire sur la source finale.


### Contrôle de livraison v35 — correction complémentaire

La source `fe73b327b281d56538e21b777d4cd24aacaf53d9` a passé la qualification indépendante (1008 tests natifs,64 Chromium,6 WebKit), mais la livraison `39940630722` a refusé le déploiement : l’ouverture des réglages déclenchait un POST de cookie commercial pendant le diagnostic en lecture seule. Ce n’est pas un échec ignoré ni un motif de relance aveugle. Le rafraîchissement lit désormais seulement le contexte ; un bouton explicite conserve l’émission du cookie avec les consentements existants, sans passer outre un OFF. Le test observe les écritures avant l’ouverture des réglages, exige zéro écriture pour diagnostic et export, puis une seule commande après clic explicite. La source corrigée doit repasser les qualifications et obtenir sa propre preuve publique. La production reste v33 tant que ces contrôles ne sont pas clos.


Complément bilingue : la source `1f085150f0290489043243c3abd289204b106934` a été refusée avant déploiement par le contrôle de traduction statique (1007/1008). Les trois nouveaux libellés ont désormais leur traduction runtime FR/EN ; le scénario anglais attend le libellé réellement traduit. La barrière et ses assertions restent intactes.


### Qualification Linux reproductible

La source6395b3be4c196060df11e7ac3ac9cd1d4865b88b a validé1008/1008tests natifs, mais les deux tâches navigateur39969708536/39969708561 ont atteint45minutes pendant les190paquets APT du miroir Azure Ubuntu, avant toute exécution navigateur ou mutation de production. Les journaux sont conservés. Les deux jobs utilisent désormais l’image officielle `mcr.microsoft.com/playwright:v1.55.0-noble`, correspondant exactement à la version du moteur de tests déjà acquise. Python3.12est fourni par setup-python, Node24reste fourni par setup-node. Un précontrôle lance réellement Chromium et WebKit ; les listes de suites, workers, assertions, limites, sauvegarde et barrières de livraison sont inchangés. Aucun paquet ou navigateur de l’application déployée n’est modifié ; la modification concerne l’environnement de qualification. Aucun abonnement supplémentaire, contournement de test ni relance aveugle. Sources officielles : https://playwright.dev/docs/ci#via-containers et https://raw.githubusercontent.com/microsoft/playwright/v1.55.0/utils/docker/Dockerfile.noble .
