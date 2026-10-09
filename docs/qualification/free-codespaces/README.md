# Qualification Linux avec les ressources gratuites de GitHub Codespaces

**État : PREPARED / NOT EXECUTED.** Aucun Codespace n'est lancé. Le compte n'a pas encore confirmé ses ressources gratuites restantes ni le blocage des dépenses payantes.

Le fondateur demande les forfaits gratuits uniquement et souhaite continuer sans installer Ubuntu sur Windows. Cette procédure prépare un environnement Linux autonome ; elle n'enregistre aucun runner GitHub Actions et ne consomme pas les minutes Actions via un workflow. Elle ne modifie ni facturation ni production.

## Condition préalable de gratuité
Sur la page GitHub de facturation du compte personnel qui paierait le Codespace, vérifier les ressources Codespaces de calcul et de stockage encore incluses et le blocage de toute dépense au-delà. Ne pas ajouter de moyen de paiement ni activer un budget payant. En cas d'affichage ambigu, conserver ce dossier prêt et demander une capture de l'écran visible ; ne pas créer la machine sur la seule hypothèse qu'il reste du gratuit.

GitHub Free annonce 120 heures-cœur et 15 Go-mois inclus par mois pour un compte personnel. Ces plafonds publiés ne prouvent pas le solde de ce compte. Les prebuilds consomment des minutes Actions ; cette route n'en utilise pas.
Sources : [facturation Codespaces](https://docs.github.com/en/billing/concepts/product-billing/github-codespaces), [suivi des ressources incluses](https://docs.github.com/en/codespaces/troubleshooting/troubleshooting-included-usage).

## Création après vérification seulement
Créer depuis `fix/confrontation-clock-recovery-20261008` un Codespace Linux de **deux cœurs**, facturé au compte personnel vérifié, avec l'image par défaut et sans prebuild. Ne pas reprendre une machine payante ni un environnement contenant du travail non sauvegardé. Le source attendu est exactement `a7c333699dad0d70cf0de8e2f8a841a00396d0d7`.

Depuis le terminal du Codespace, récupérer le commit documentaire de ce dossier et charger le bootstrap/contrôleur dans `work/`. Le commit exact sera fourni après sauvegarde du dossier ; ne pas utiliser la candidate comme référence de ces fichiers puisqu'elle reste gelée. Vérifier le bootstrap avec `bash -n`, puis le lancer. Son contrôle `node --check` précède toute exécution du contrôleur.

Le bootstrap réutilise NVM de l'image par défaut pour Node 24.19.0 si nécessaire. Le contrôleur installe le lockfile et les navigateurs Playwright 1.56.1 correspondants. Il travaille sur une base SQLite de test isolée et garde `realMoneyEnabled=false`.

## Exécution unique et arrêt sur défaut
1. Vérifier le source propre et le contrat de version.
2. Exécuter le scénario WebKit inchangé d'ouverture d'une vraie Local Room et d'échange d'un paquet.
3. Exécuter le scénario QR Chromium inchangé avec son délai original de 30 secondes.
4. Après ces deux succès, exécuter une seule qualification canonique complète : preuve dépenses avant/après, contrôles de dépendances/TypeScript/architecture/mémoire, 657 tests Node, huit Chromium et six WebKit, puis archive du source exact et contrôle SHA-256.
5. Publier les journaux et rapports natifs dans une nouvelle branche documentaire `evidence/free-linux-...`. Le contrôleur utilise l'authentification Git existante, sans demander ni enregistrer de jeton.
6. Arrêter le Codespace après confirmation de sauvegarde. Un Codespace arrêté cesse de consommer le calcul, mais continue à occuper du stockage ; revoir ce stockage avant une prochaine utilisation. Cette procédure ne supprime pas les fichiers ou machines existants.

Un échec de précontrôle interrompt la suite avant la répétition des 657 tests. Les échecs restent publiés si la connexion Git le permet ; aucune suppression de scénario, extension de délai ou publication en production ne sert à obtenir un PASS. Si la publication des preuves échoue, elles restent dans `outputs/eco-free-linux-.../` et le résumé le signale.

## Limites des preuves
Le Cloud précédent n'a pas qualifié WebKit : 4 PASS / 2 FAIL. Le diagnostic Windows reste 5 PASS / 1 FAIL QR ; sa cause demeure non démontrée. Un succès QR sous Linux ne constitue pas une réparation prouvée du parcours Windows. Les reçus antérieurs restent disponibles.

Le dossier préparé n'a pas encore bénéficié de `node --check`, de `bash -n` ou d'une exécution native. Seule une lecture du code et une analyse syntaxique du corps JavaScript dans V8 ont été possibles depuis cette session. Le marqueur de livraison demeure HOLD ; tout déploiement exige les autres contrôles de livraison, de sauvegarde et de recette.
