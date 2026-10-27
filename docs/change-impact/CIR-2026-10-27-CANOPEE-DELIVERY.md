# Canopée + Repères — livraison et place des capacités

## Restauration tardive après une interaction — complément du 27 octobre

Les runs `40531481285` et `40531481504` de `294c8723336c3ee0d9c347642e9abe172fd6d9db` s'arrêtent avant toute mutation de production : natifs et gouvernance passent, la livraison passe les 36 WebKit puis échoue dans Chromium ; la qualification indépendante échoue dans la transmission de solution WebKit. La trace de ce second échec montre un bouton pressé, aucune commande de transmission envoyée, puis un retour du viewport vers `#marketEnginePanel` pendant le geste. Le démarrage rappelle encore `showView` après le chargement séquentiel des projections facultatives, même si l'utilisateur a déjà navigué et saisi des données.

Le propriétaire de navigation conserve désormais une révision locale d'interaction. Une restauration de démarrage, une frame différée ou un retour après actualisation attendue ne reprend pas la main après un nouveau geste ou une navigation. La restauration F5 sans interaction reste conservée. Aucun champ, droit, commande, calcul, donnée, moteur financier ou schéma ne change. Une régression navigateur retient une vraie requête facultative au démarrage, prépare un carnet dans l'interface existante et maintient le bouton pressé pendant la fin du chargement ; position, brouillon et action unique doivent rester utilisables. Le test financier F5 et le scénario inter-comptes d'origine restent obligatoires.

Les artefacts du job de livraison étaient collectés avant Chromium ; leur collecte `always()` passe après les deux navigateurs pour conserver aussi la preuve du dernier scénario en cas d'échec. Aucun contrôle, assertion ni navigateur n'est supprimé. La publication demeure non qualifiée tant que les deux workflows complets et les vérifications publiques du nouveau SHA n'ont pas réussi.

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

## Dernier propriétaire retrouvé dans les entrées préparatoires

La relecture des dix-huit destinations génériques identifie `SUCCESSION.NEXT_OF_KIN` : un registre de contacts existe déjà dans les réglages, onglet `succession`, mais le catalogue ouvrait son dossier générique. Le handoff de présentation appelle désormais `operationalRegistryUI.open('succession')` après la navigation existante. Aucun nouveau formulaire, service ou droit ; aucun héritier juridique, transfert financier ou rôle automatique. Le test au clavier couvre cette dixième destination et exige le vrai champ de contact, sans écriture métier. La matrice distingue donc 147 ouvertures vers un propriétaire existant et 17 dossiers préparatoires. La source finale doit de nouveau être qualifiée entièrement ; aucun reçu antérieur ne couvre ce raccord supplémentaire.

## Portefeuille de prêts stable entre lectures identiques

Le run de livraison `40525510748` / source `55dce6c3617d19918c010cdac49c4f57c615c38e` passe les 1062 natifs et 35 WebKit, puis le scénario Chromium historique de remboursement signale une cellule de portefeuille détachée entre sa lecture et la mesure de sa largeur (0 au lieu d’au moins 140 px). Les contrôles de remboursement, synchronisation et rechargement précédents passent ; la livraison reste arrêtée avant production. Le propriétaire d’affichage `completion-ui.js` conserve désormais les nœuds du portefeuille si sa projection de données, son compte/tenant/groupe, sa langue, sa politique, ses membres et ses séances sont identiques. Une variation relit et reconstruit la vue, en conservant la partie sélectionnée. Aucun cache de données transactionnelles, nouveau calcul ou changement des commandes financières. Une régression navigateur contrôle les nœuds réels lors de trois lectures simultanées, puis leur remplacement sur changement de valeur/version et de compte ; le test historique reste inchangé.

## Clôture distante vérifiée — 27 octobre 2026

Source 1d6d2767e208b240d40f5fdd578f11e2582a8c8f, livraison 40545875828 et qualification indépendante 40545876173 SUCCESS. 1062 natifs,99 Chromium,37 WebKit Linux,0 échec/ignoré/instable. 81 fichiers publics vérifiés en CI puis relus indépendamment ; santé/version/build/cache/catalogue cohérents. L’audit conserve147 propriétaires effectifs et17 dossiers préparatoires sur164 cartes. Les114 moteurs/schémas sont identiques à v41 et250 tests historiques conservés. Les incidents intermédiaires documentés restent des tentatives arrêtées avant production. Le correctif de démarrage est reproduit avant correction avec7345px de déplacement et passe après correction sans perte de brouillon ni action doublée ; les scénarios historiques restent inchangés.

BIR D1/source : 50/48 tables, intégrité/clefs valides, restauration de copie et relecture privée R2 par SHA256. Source ZIP977 fichiers vérifiés. Aucun schéma, clé existante, donnée réelle ou moteur financier modifié. Voir docs/release/evidence/CANOPEE-DELIVERY-QUALIFICATION-2026-10-27.json. Les preuves Windows locales antérieures ne limitent plus la qualification Linux finale ; leur diagnostic reste conservé. FIELD_ACCEPTED=NOT_ACCEPTED,realMoneyEnabled=false. Crédits exacts non mesurables.
