# Eco-System 0.6 — Guide de test Android terrain

Version : `0.6.0-mobile-living-rules`

URL : `https://eco-system.sergemimf.workers.dev/`

## Installation / ouverture
1. Ouvrir l'URL dans Chrome sur Android.
2. Vérifier que l'écran « Plateforme Tontines & Associations » s'affiche et qu'aucun JSON `NOT_FOUND` n'apparaît.
3. Utiliser le bouton d'installation de l'app s'il apparaît, ou le menu Chrome → « Installer l'application » / « Ajouter à l'écran d'accueil » selon la version Android.
4. Lancer ensuite Eco-System depuis l'icône d'accueil comme une app.

Si un ancien `NOT_FOUND` reste en cache, ouvrir d'abord l'URL dans un onglet privé ou effacer uniquement les données du site `eco-system.sergemimf.workers.dev`, puis recharger.

## Scénario minimal à tester
Utiliser uniquement des identités et montants de test au début.

1. Créer un projet de groupe/tontine.
2. Lancer une simulation.
3. Convertir le projet en groupe.
4. Ajouter quelques membres de test.
5. Ouvrir une réunion/séance.
6. Enregistrer des cotisations manuelles de test.
7. Clôturer la séance.
8. Tester une contribution tardive gouvernée après clôture lorsque la politique du groupe l'autorise.
9. Vérifier que la clôture répétée ne crée pas deux effets identiques.
10. Créer/configurer une rubrique et tester un cas de solidarité, par exemple : attendu 40 000 ; collecté membres 38 000 ; manquant membre 2 000 ; couverture groupe 2 000 ; décaissement bénéficiaire 40 000 ; dette membre 2 000.
11. Fermer l'app, la rouvrir et vérifier la persistance.
12. Tester ensuite un démarrage hors connexion, sans considérer une intention financière hors ligne comme définitivement confirmée tant que le serveur n'a pas synchronisé.

## Comment signaler un problème
Pour chaque anomalie, envoyer :
- écran / rubrique concernée ;
- action effectuée ;
- étapes exactes ;
- résultat attendu ;
- résultat réellement obtenu ;
- règle écrite du groupe si elle existe ;
- pratique réellement appliquée si elle diffère ;
- capture d'écran si utile, sans secret ni donnée personnelle sensible.

## Doctrine à préserver
Eco-System ne doit pas imposer une façon universelle de gérer une rubrique. Il doit permettre au groupe de décrire sa règle, constater sa pratique réelle, faire valider la règle opérationnelle et gouverner les exceptions/regularisations avec traçabilité.

`realMoneyEnabled=false` demeure obligatoire pendant ce preview.
