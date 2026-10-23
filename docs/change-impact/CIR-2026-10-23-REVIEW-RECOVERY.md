# CIR — L22 / L26 / L27, relecture et reprise contrôlées

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
