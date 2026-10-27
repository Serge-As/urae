# Canopée + Repères — livraison et place des capacités

Le 27 octobre 2026, le fondateur autorise explicitement le déploiement et demande de vérifier la présence des capacités métier à leur place. Il confirme avoir lui-même rendu **Serge-As/urae public** et demande de conserver ce choix. Cette instruction directe prévaut sur la désignation « privé » du 24 octobre. Secrets, sessions, pièces et données financières réelles restent exclus de Git, des artefacts publics et des fixtures.

## Source et conservation

Parent distant vérifié : `35f4ff6774685a6a06058093ca30f5165551f312`, après la livraison v41 `6d3264bd7f345d808fb8cbfcc618d99c274d3891`. Clone unique de cette branche. Le patch local Canopée est appliqué sur ce parent ; les onze différences historiques entre le miroir et GitHub sont conservées du côté distant, notamment la configuration Cloudflare et les gardes. Aucun historique réécrit, force-push ou fusion de main.

## Défauts de placement

Le catalogue contenait des fonctions actives qui ouvraient un dossier générique malgré un propriétaire opérationnel existant : feuilles et historique financiers, séance et présence, épargne, rubriques, campagnes publicitaires, commerce, NOW, connaissances, documents et Relay. Les nouveaux handoffs de présentation sont consommés par `openModule` après ses ouvertures spécialisées existantes. Ils délèguent au routeur, aux panneaux, aux contrôleurs et aux règles de droits existants. Prêt et remboursement restent saisis sur les feuilles canoniques. Les entrées planifiées ou structurelles ne sont jamais promues en fonctions opérationnelles par ce changement.

Les 164 cartes sont conservées, recherchables et activables au clavier. Le registre des 92 propositions, les contrats de maturité, les dix étapes et les propriétaires financiers ne changent pas.

## Tableaux et saisie

Finition commune Canopée : en-têtes dorés, chiffres tabulaires, lignes alternées, focus de saisie visible, validation verte, défilement horizontal contenu, totaux lisibles et impression sobre. Aucune modification de largeur mesurée, offsets des colonnes fixes, valeurs, confirmation, champs, calculs, synchronisation ou actions métier. Les bordures rouges de conflit et les états de validation restent portés par le contrôleur canonique.

## Qualification et publication

Trois régressions navigateur complémentaires : inventaire des cartes et destinations montées ; ouverture réelle de neuf capacités au clavier sans mutation métier ; saisie sur téléphone et mode Senior avec conflit visible. Les suites financières, multi-comptes, offline, rechargement et WebKit souverain restent obligatoires, sans suppression ni assouplissement de leurs assertions. La limite WebRTC de WebKit Windows documentée à l'étape locale sera qualifiée dans le runtime Linux déjà utilisé par la CI ; aucun skip ne la masque.

Avant le Worker : archive du SHA exact, export D1 en lecture seule, restauration de copie et vérification intégrité/clefs, archive R2 privée relue par hash. Portée `D1_AND_EXACT_SOURCE_ONLY`, pas de migration, réécriture, restauration de production ni rotation de clé existante. Après publication : santé, identité de source/build/cache, catalogue et hashes publics. `realMoneyEnabled=false`, `FIELD_ACCEPTED=NOT_ACCEPTED`. Les comptes et appareils réels restent une recette distincte.

## Correction du contrôle bilingue avant mise en ligne

La première publication `8bac6c194b9343ce5ff18da6ea346f34298b016b` est arrêtée par la CI avant toute mutation du Worker : 1061/1062 tests natifs, quatre nouvelles chaînes visibles du catalogue sans entrée anglaise. Ajout des traductions de ces quatre chaînes ainsi que de l’intitulé et de la notice du catalogue. Le test bilingue et ses assertions sont conservés ; une nouvelle qualification complète sur le commit corrigé est obligatoire. Les résultats de cette première tentative ne sont pas comptés comme une livraison réussie.

## Stabilité des parcours productifs pendant le chargement

La trace Linux WebKit du premier run montre un retrait de transmission cliqué sans requête au serveur : les panneaux précédant le formulaire changent de hauteur pendant le geste. Le panneau productif existant est placé après le titre de la vue, avant les projections facultatives, comme le correctif de stabilité du panneau de récupération v41. Son contrôleur, ses commandes, permissions, gardes de contexte et API sont inchangés. Une régression complémentaire presse réellement une action, fait grandir le panneau d’accompagnement de 1 020 pixels et vérifie la position inchangée ainsi que l’unique commande attendue. Le test inter-comptes d’origine reste obligatoire sans modification.

La demande supplémentaire du fondateur impose la comparaison avec les acquis antérieurs à la refonte et ceux des 28 lots / 92 propositions : suites historiques conservées, contrôle des 92 propositions, inventaire des 164 capacités, absence de modification des moteurs métier et du schéma. La qualification automatique ne vaut pas recette exhaustive des intégrations encore planifiées, ni acceptation physique sur comptes réels.

Comparaison de source réalisée avec `5cba15abc3e5d61f2ad35d40fefb5d320e3f28d2` (v19, parent du premier lot de navigation) et `6d3264bd7f345d808fb8cbfcc618d99c274d3891` (v41, dernière livraison avant refonte) : les 95 fichiers canoniques du socle v19 sont conservés ; les 114 fichiers de moteurs et migrations actuels sont identiques à v41 ; les 250 fichiers de tests historiques restent présents. L’unique changement de l’API est l’identité de version/build/cache. La couverture des 92 propositions / 28 lots reste vérifiée par son garde existant.

La relecture visuelle téléphone a révélé des boutons de choix du mode financier comprimés. Le titre occupe désormais sa propre ligne et les boutons gardent 140 pixels minimum dans la barre, avec retour à la ligne. Le test téléphone/mode Senior vérifie aussi ces dimensions, tout en conservant son assertion de conflit rouge et d’éditeur numérique utilisable. Aucune modification du choix de mode, des champs ni de leur contrôleur.

## Complément documentaire de livraison

Le run `40524258034` / qualification `40524258136` du commit `21c81f6ea74dbc43d102c2ac3c24ca16d8dd851f` s’arrête avant les tests natifs et toute mutation du Worker : le garde mémoire exige un rappel modifié dans le même lot de correction, que le CIR seul ne remplace pas. Le rappel existant est complété avec les deux diagnostics, les 1062 natifs locaux, les 18 WebKit locaux et la comparaison des versions. Aucun changement applicatif ni assouplissement de garde dans ce complément. Nouvelle CI complète requise sur son SHA exact.
