# CIR — lot 05, séances et répétition locale

Autorisation : poursuivre les lots selon le classement accepté, après clôture du lot 01. Base publiée 1.5.2.21, source `5c9366445d6699b7a608f06a49a4efb61ec7d1ff`, mémoire documentaire distante `dc5ad743ecc3f5430cb86339df25a05225d0120b`. Le lot 01 a ses preuves publiques et ses qualifications réussies ; ne pas recommencer l'audit général.

## Bénéfice et propriétaires

Requalifier les acquis des séances : partitions complètes, montants et totaux, synthèse immédiate du membre précédent par pointeur et clavier, présence, brouillons persistés, concurrence et reprise hors ligne. Réemployer `main.js`, `financial-work-ui.js`, `smart-grid-view.js`, l'outbox et Live. Aucun changement du Ledger, des prêts, du transport ou des autorisations.

Ajouter l'innovation I02 : une répétition pédagogique accessible depuis la barre de la feuille. Trois personnes fictives et vingt rubriques, valeurs totales locales, découpage calculé par le même planificateur visuel, synthèse figée avant le passage au membre suivant. Cet exercice s'efface à la fermeture. Il n'utilise aucun compte, groupe, montant, clé, stockage ni endpoint métier réel. Il n'affirme pas simuler le serveur, des prêts ou la totalité d'une séance réelle.

## Changements et conséquences indirectes

Module UI isolé `session-rehearsal.js`, bouton dans la barre existante et styles limités à son dialogue. Le module réemploie les fonctions de partition et de somme d'affichage ; ses valeurs sont exclusivement des exemples pédagogiques. Aucun nouveau moteur financier de production et aucun nouvel abonnement ou bibliothèque.

Risques : focus et dialogues concurrents, détachement d'un bouton pendant Live, étroitesse mobile, confusion entre exercice et validation réelle. Mesures : dialogue absent quand fermé, refus d'ouverture par-dessus un autre dialogue, libellés d'exercice visibles, aucune référence d'app injectée, restauration de focus, vue fiche si une colonne ne tient pas, tests de brouillon réel inchangé et zéro requête financière provoquée par l'exercice. Graphe PWA et nouvelle identité de cache cohérents avant publication.

## Qualification et récupération

Modèle pédagogique : montants invalides, valeur cible idempotente, total général sur toutes les rubriques, synthèse immuable et révision exacte, réinitialisation et isolation de deux exercices. Navigateur : exercice depuis une vraie feuille synthétique contenant un brouillon, navigation de toutes les parties, synthèse puis première saisie du membre suivant, fonctionnement sans réseau, aucun POST métier et brouillon initial intact. Petit écran et mode senior. Requalifier toutes les suites financières acquises, puis le SHA intégré exact avant publication et vérifier les douze ressources publiques.

Retrait du seul bouton et du module ou retour au Worker précédent avec son shell cohérent ; aucune donnée métier à annuler et aucune migration. D1/R2 existants et clé de signature conservés. `realMoneyEnabled=false`, `FIELD_ACCEPTED=NOT_ACCEPTED`. État initial : réalisation en cours, aucune livraison du lot 05 annoncée.

Qualification du candidat a8040ae : 751 tests natifs et 22 Chromium passent ; la qualification indépendante passe également. La livraison est bloquée avant publication par RATE_LIMITED lors de la dernière création de compte WebKit, les comptes synthétiques Chromium et WebKit partageant le même serveur de test. Correction du seul dispositif de qualification : serveur WebKit et fichier SQLite synthétique séparés, même build, six assertions WebKit conservées. Aucun seuil de sécurité de production modifié. La nouvelle source doit repasser toutes les portes avant publication.
