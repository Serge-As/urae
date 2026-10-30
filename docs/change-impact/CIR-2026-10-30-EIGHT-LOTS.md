# CIR — huit lots Canopée, 30 octobre 2026

Autorisation directe : le fondateur demande d’implémenter et livrer les huit lots,
de préserver tous les parcours acquis et d’achever le déploiement autorisé.
Base : v42 `1d6d2767e208b240d40f5fdd578f11e2582a8c8f`.

Périmètre : garde de démarrage indépendante ; imports secondaires différés ;
liens contextuels vers les propriétaires existants ; synthèse collective nommée,
versionnée et durable ; lecture de montants et modèle vocal français facultatif ;
Panorama/Atelier/Journal ; tableaux filtrables avec sources ; actions économiques
canoniques ; copies hors ligne et brouillons privés. Les 32 critères et leurs
destinations/droits sont dans `docs/implementation/EIGHT_LOTS_2026-10-30.md`.

Impact financier : aucun nouveau moteur, aucune migration, aucune réécriture de
données. La clôture vérifie maintenant aussi la version d’une cellule et utilise
les contrôles canoniques existants. L’API et la commande outbox partagent le même
garde ; le serveur conserve ses contrôles de droits, périmètre et idempotence.
La synthèse n’attend plus le rafraîchissement de tous les panneaux ; elle prépare
une copie locale puis les seules lignes du membre et de la séance concernée.

Impact forum : sauvegarde locale privée et révisions durables ; mise à jour SQL
des seuls champs de brouillon ou des seuls repères de lecture ; refus de contenu
périmé. Le modèle de données existant est réutilisé, sans migration.

Impact voix : dépendance de build amont verrouillée, Apache-2.0, servie par Eco.
Téléchargement de modèle explicite, hors du shell initial. Cache/IndexedDB du
modèle séparés, suppression ciblée ; aucun transfert de son pour ce moteur.
Les mesures sur silence synthétique ne qualifient pas la précision en réunion.

Conservation : 164 capacités et maturités, 28 lots/92 critères, deux feuilles
financières, rôles, auteurs, réserves, conflits, outbox, historiquement conservés.
Les changements de navigation ne retirent aucun propriétaire. La caisse, la dette
et les sommes de flux restent distinguées. Argent réel désactivé.

Recette : suites natives acquises + nouveaux contrôles, Chromium et WebKit isolés,
capture de rendu 320/360/768/1440, installation/usage offline/suppression du modèle,
CI et preuve de source identique, BIR en lecture seule et vérification publique.
Retour : version et cache v42 conservés ; le cache v41 reste également retenu.
Aucun rollback ne doit effacer les intentions d’un appareil ou réécrire D1.

Statut au checkpoint : implémentation consolidée, qualification finale en cours.
`FIELD_ACCEPTED=NOT_ACCEPTED`, crédits exacts non mesurables.
