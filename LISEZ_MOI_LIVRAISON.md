# Eco-System 1.1.2 — livraison locale

Cette archive contient les sources et la version précompilée. Elle reprend le serveur 1.0 sauvegardé et l’interface publique 1.1, avec corrections locales. La source distante 1.1 exacte a été récupérée et comparée. Tous les moteurs du cahier ne sont pas encore terminés.

## Démarrer sur Windows

1. Extraire entièrement l’archive dans un dossier court, par exemple `Documents\Codex\Eco-System-1.1.2`.
2. Utiliser Node.js 24 ou ultérieur. Il est déjà installé sur l’ordinateur utilisé pendant cette tâche.
3. Double-cliquer `DEMARRER_ECO_SYSTEM.cmd`, ou ouvrir un terminal dans ce dossier et exécuter `node scripts/dev-server.mjs`.
4. Ouvrir l’adresse affichée, normalement `http://127.0.0.1:4173/`. Si le port est occupé, le serveur annonce le port libre choisi.
5. Créer son compte personnel, puis un projet et un groupe. Ne pas ouvrir `index.html` directement depuis l’explorateur : l’API locale est nécessaire.

Pour reconstruire : `npm.cmd ci`, puis `npm.cmd run build`. Pour qualifier : `npm.cmd run ci`. La version précompilée démarre sans installation de dépendances npm.

## Données et arrêt

Les données sont conservées localement dans `.data/eco-system.sqlite` du dossier de lancement. Garder ce dossier. Arrêter le serveur avec Ctrl+C avant une copie manuelle de la base et de ses fichiers auxiliaires. Ne pas remplacer la base par une archive de code. Aucune donnée de la plateforme distante n’est importée automatiquement.

Les comptes et les sessions de vérification ne sont pas inclus. Sur une extraction neuve, créer un compte neuf. Le compte déjà essayé dans le workspace de cette tâche reste lié à sa base d’origine ; le ZIP ne la déplace pas.

Une file de cotisations en attente est liée au navigateur et au compte. Ne pas vider les données du navigateur tant qu’elle contient des opérations non confirmées. Une opération en attente n’est pas une confirmation comptable.

## Avant toute mise en ligne

Lire AUDIT_ET_LIVRAISON, QUALIFICATION, CURRENT_TRUTH et NEXT_RUN. GitHub et le serveur 1.1 ont été vérifiés. Rapprocher les anciens groupes des comptes vérifiés, qualifier l’authentification sur Workers et restaurer sur une base de recette. Ne pas écraser la production à partir de ce seul ZIP.

L’argent réel et les fournisseurs de paiement restent désactivés. Les domaines non terminés sont explicités dans l’audit.

## Association et tontines

Créer une association, ajouter les rubriques, choisir leur nature et leur nom, puis renseigner les caractéristiques de chacune. Pour une tontine, distinguer membres, parts souscrites et pots par tour. Une part bénéficie une fois dans le cycle. Les quatre parts d’un membre peuvent être programmées ensemble ou sur plusieurs tours, dans la capacité du tour. Simuler, puis créer. Tout changement impose une nouvelle simulation. Les réglages sont conservés et modifiables dans les rubriques du groupe.
