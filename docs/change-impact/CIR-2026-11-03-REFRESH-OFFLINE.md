# Reprise au rafraîchissement et retour réseau — 3 novembre 2026

Demande directe du fondateur : réparer F5/tirer pour rafraîchir sur ordinateur et téléphone ; conserver le travail local, reprendre automatiquement à la reconnexion et borner les requêtes. La proposition jointe est un objet d'audit, ses affirmations ne sont pas des preuves.

Base distante vérifiée : 2b7739f0f0b007b3cac3cf409212476d2e6facaa ; runtime v45 541c7239341c1d31de82d11de251f7d663017abb. Les modifications Fiscalibre déjà livrées sont conservées.

Propriétaires : BrowserWindowScope pour l'identité de fenêtre ; ConnectedApplication et IndexedDB pour les projections autorisées et la reprise ; Outbox pour les intentions durables ; Ledger/D1 pour les montants confirmés ; service worker pour le graphe statique cohérent. Aucun nouveau moteur financier, endpoint delta, fusion d'intentions, schéma ou migration.

Risques à couvrir : window.name effacé sans perte de sessionStorage ; onglet dupliqué ; session d'un autre compte ; démarrage lent ou réseau trompeur ; réponse dont le corps se bloque ; première installation interrompue ; événements réseau simultanés ; quota D1 encore actif ; brouillon ou écriture en cours ; cache privé Fiscalibre et verrou absolu d'une heure.

Implémentation prévue : restauration des copies locales dans leur portée de fenêtre, puis vérification serveur ; lecture initiale bornée aux surfaces utiles ; réveil réseau regroupé et sérialisé dans le propriétaire existant ; installation PWA anticipée et reprises de téléchargement avec validation des empreintes. Une absence de copie ne devient pas une valeur zéro. Aucun effacement de stockage utilisateur.

Qualification : tests natifs de comportement, scénarios Chromium/WebKit de reprise/offline et isolation acquis, puis gates complets du même SHA. Livraison seulement après succès ; sauvegarde privée restaurée et relue de portée D1_AND_EXACT_SOURCE_ONLY. IndexedDB/Outbox des appareils, pièces jointes R2 et prestataires sont exclus de cette sauvegarde. realMoneyEnabled=false ; FIELD_ACCEPTED=NOT_ACCEPTED.

Suivi de qualification : le relais local de panne réelle couvre HTTP et WebSocket sur Chromium et WebKit, sans modifier l'application pour contourner l'émulation WebKit. Les brouillons sont vérifiés séparément des intentions annoncées comme enregistrées : la matrice optimiste ne prouve pas la fin d'une transaction IndexedDB. Les valeurs durables sont préparées avant la création des cellules. Recette locale finale : 1 138/1 138 tests natifs et 3/3 nouveaux parcours Chromium, zéro échec/ignoré/flaky.

La source `73e1c6d6fc6208e6cd70ecc54d4265cce83da6f0` a été arrêtée avant déploiement par le garde de mémoire : le suivi d'impact et le Recall n'étaient pas inclus dans ce commit de correction. Les présentes mises à jour rétablissent la traçabilité requise ; le garde reste intact. Trace négative : [41660119895](https://github.com/Serge-As/urae/actions/runs/41660119895). La qualification du nouveau SHA et sa livraison restent à exécuter.
