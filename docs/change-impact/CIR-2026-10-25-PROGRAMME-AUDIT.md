# CIR — reprise et audit du programme des 28 lots / 92 propositions

Autorisation : demande du fondateur du 25 octobre 2026 d'auditer, contrôler et finaliser le programme interrompu, puis confirmation de poursuivre en utilisant les documents fournis. Base locale `fe85f90f378aabe8819efbadd0ccd9bc1730ae10` ; runtime qualifié `67095d43701c3fcfb51461f8b5e7ac0ca3d4e71f` ; clôture distante `ffffb9c6741d895f52bdfdca566f81a6b43ff036`.

## Défauts reproduits et périmètre

Le garde `lint:proposals` accepte une preuve inexistante (`docs/absent-proof.json`) pour A01. Il vérifie la présence d'une liste sans ouvrir les fichiers. Trois fiches d'outils sont devenues inexactes : Playwright est déjà réutilisé ; PDF.js et Tesseract.js sont intégrés localement à la demande, mais le registre les classe encore comme non importés.

Le contrôle WebKit supplémentaire reproduit aussi une perte de clic sur la reprise A27/I10 : le chargement tardif d'un panneau de paramètres situé au-dessus déplace le contrôle de 297 pixels entre pointerdown et pointerup. La trace et une reproduction déterministe sur base synthétique échouent avant correction. Le panneau qualité/reprise est replacé après l'en-tête des paramètres et ses commandes avant les résultats asynchrones ; aucune commande métier n'est changée. Deux parcours passent avec ce placement, puis le mobile montre un défilement animé/focus faisant intercepter le bouton par l'en-tête. Le défilement des seuls paramètres devient direct avec marges sous l'en-tête, suivant le raccord déjà employé pour Documents/Communauté ; pas de modification du défilement des feuilles financières.

Correction limitée à ce placement dans les paramètres, au registre, au garde de traçabilité, à ses régressions et aux preuves d'audit. Les critères d'origine, les 28 lots et les 92 identifiants restent conservés. Une référence d'outil ne devient pas une obligation d'installation, ni une preuve de tous les usages envisagés.

## Propriétaires, risques et qualification

Le registre reste l'inventaire du programme ; les services métier conservent leurs autorités. Aucun changement du Ledger/D1, des prêts, des droits, du Live, de l'outbox ou des routes. Identité de release/cache renouvelée pour diffuser le correctif ; logique de persistance PWA acquise conservée. Aucun schéma ni migration. Le garde doit refuser les chemins sortant du dépôt, les preuves absentes, les JSON illisibles et une qualification fonctionnelle d'un autre SHA ; il ne transforme pas ces vérifications en recette terrain.

La chaîne locale de départ a passé 1058/1058 tests et tous ses gardes. Trois régressions du garde et la reproduction navigateur du clic sont ajoutées. Qualification de la nouvelle source dans Chromium/WebKit, régressions acquises et gardes documentaires avant publication ; les preuves du runtime précédent restent historiques. Tout nouvel échec reste visible et doit être diagnostiqué sans boucle de relance.

## Réversibilité et conservation

Checkpoint Git local pour les seules modifications revues ; un retour de ces fichiers annule ce changement sans effet sur les données. Le correctif de placement nécessite une release cohérente, qualifiée et déployée sur le même SHA. Le workflow établi effectue BIR+ D1 et source exacte avant mutation du Worker, sans migration ; rollback par la source précédente 67095d43, sans restauration destructive de D1. La portée de sauvegarde reste D1_AND_EXACT_SOURCE_ONLY, sans prétendre couvrir les pièces R2 ou les outbox d'appareils. Les artefacts locaux antérieurs sont conservés. `realMoneyEnabled=false`, `FIELD_ACCEPTED=NOT_ACCEPTED`.

ÉTAT DU PROJET APRÈS ÉTAPE : audit en cours ; correction de traçabilité autorisée, résultat final à consigner avec ses preuves. Consommation exacte de crédits non mesurable.
