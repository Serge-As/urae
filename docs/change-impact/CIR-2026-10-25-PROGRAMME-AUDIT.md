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

## Clôture prouvée

## Audit finalisé et livraison v41 vérifiée — 25 octobre 2026

Production **1.5.2.41-programme-audit**, source `6d3264bd7f345d808fb8cbfcc618d99c274d3891`, arbre `b2fc714baf776d0de9e36d542d1dd654e8aa5eea`, Worker `b426cd0c-af79-4d7b-9dfc-aed6333ad457`. Livraison et qualification indépendante du même SHA : [40235349803 SUCCESS](https://github.com/Serge-As/urae/actions/runs/40235349803) ; [40235349738 SUCCESS](https://github.com/Serge-As/urae/actions/runs/40235349738). **1061/1061 natifs, 82/82 Chromium et 20/20 WebKit**, zéro échec et zéro ignoré. Santé, catalogue de **164 capacités** et 76 empreintes publiques vérifiés lors de la livraison ; **13 fichiers publics relus indépendamment**, dont le correctif `data-quality-ui.js`, CSS et PWA. Pas d’écriture de recette en production.

Les **28 lots, 48 propositions fonctionnelles A/I et 44 références T/M** sont rapprochés des documents d’origine. Les **92 identifiants et critères restent intacts**. Matrice détaillée : `docs/implementation/PROGRAMME_AUDIT_2026-10-25.md` et `.json`. Trois outils sont réellement réutilisés/intégrés dans leur portée (Playwright, PDF.js, Tesseract.js) ; les **41 autres références** restent facultatives et non importées. Aucune ambition stratégique ou promesse de revenu n’est déclarée acquise par ce bilan.

Défauts fermés : référence de preuve inexistante acceptée par le garde ; statuts d’outils/limites historiques contradictoires ; clic de reprise perdu lors d’un déplacement WebKit de **297 px** entre appui et relâchement, puis défilement/focus mobile sous l’en-tête. Test négatif conservé, placement des commandes stabilisé et défilement limité aux paramètres. **Trois régressions natives nouvelles** et **un scénario navigateur permanent dans chaque moteur**, assertions financières conservées. Vérifications locales complémentaires : 21 natifs ciblés et 11 WebKit, dont OCR réel FR/EN, tous réussis. Les échecs initiaux restent dans les artefacts locaux ; aucune relance aveugle du SHA final en CI.

BIR+ avant mutation du Worker : export D1 en lecture seule, restauration sur copie vierge, **50 tables / 48 attendues**, intégrité et clés étrangères valides. Archive privée R2 relue SHA256 `d4425a25da7b48cb8d87a8ce2bb8444962351432d25ef1da01d9b84105ecbfb6`. Portée **D1_AND_EXACT_SOURCE_ONLY** ; pièces R2, données/outbox d’appareil et prestataires exclus. Source exacte récupérable : `Eco-System_1.5.2.41_Source_Verifiee_6d3264bd_2026-10-25.zip`, **962 fichiers Git vérifiés**, SHA256 `db43508bd416a5aa9b862b089350e9e41d30716015858ba55ce984cb121435b4`. Aucune restauration de production ni migration.

Invariants conservés : dix étapes, rubriques et deux feuilles, Ledger/D1 canonique, politiques de prêt, Living Rules, droits, historique, Live et outbox. Aucun reset, force-push, fusion de main, nouveau fournisseur ou redémarrage. `realMoneyEnabled=false`, **`FIELD_ACCEPTED=NOT_ACCEPTED`** : l’acceptation sur vrais groupes, comptes et appareils reste distincte. URAE reste public conformément au choix déjà confirmé du fondateur ; aucune visibilité modifiée.

**ÉTAT DU PROJET APRÈS ÉTAPE** : programme audité, correctifs prouvés, qualifiés et publiés dans leur portée explicite. Aucun reliquat de code identifié dans ce programme borné ; tests terrain et résultats/contrats externes restent à valider. Réutiliser ces preuves du même SHA. Consommation exacte de crédits non mesurable.
