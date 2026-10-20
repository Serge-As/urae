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


## Lot 05 terminé, publié et vérifié — 20 octobre 2026

Production **1.5.2.22-session-rehearsal**, source `61c939d6c6fe68b23ca2c015fdc269460469e591`, build `eco-system-1.5.2.22-20261020-session-rehearsal`, cache `eco-system-v15222-session-rehearsal-20261020`, Worker `34249960-2dcb-49f7-b200-fa56752d2e23`. Livraison [39411571048 SUCCESS](https://github.com/Serge-As/urae/actions/runs/39411571048), qualification indépendante [39411571191 SUCCESS](https://github.com/Serge-As/urae/actions/runs/39411571191). Même source : **751 tests natifs, 22 Chromium, 6 WebKit** réussis dans la livraison. Reçu public : `docs/release/evidence/LOT05-SESSION-REHEARSAL-PUBLIC-2026-10-20.json` ; douze empreintes, catalogue 164, vérification à 11:05:40.022Z. Santé HTTPS relue indépendamment à 11:06:47.786Z : source/build/cache exacts et realMoneyEnabled=false.

L'exercice local de séance est disponible depuis la barre de la feuille ; il conserve les données et brouillons réels et ne produit aucun POST financier. Les moteurs acquis sont requalifiés, sans réécriture. Sauvegarde D1 exportée en lecture seule puis restaurée avec intégrité SQLite ok ; archive privée R2 relue et SHA-256 `d9ded1006ae4ccebf1200594bc5ac3c16ee71c1de68705644462ad0117847293` vérifié. D1/R2 et clé de signature conservés, aucune migration ni nouvelle dépendance. FIELD_ACCEPTED=NOT_ACCEPTED : les recettes synthétiques ne prétendent pas être une acceptation terrain Delor.

Incident de qualification conservé : a8040ae avait passé 751 natifs et 22 Chromium, mais la dernière inscription WebKit atteignait la limite de comptes de la base de test partagée. Publication bloquée. Correction du dispositif seulement : serveur et SQLite WebKit séparés ; toutes les portes repassées sur 61c939d. Les essais Windows complémentaires du build ont passé les deux nouveaux exercices et le mode/navigation petits écrans, mais trois scénarios antérieurs ont rencontré des délais d'initialisation/rechargement ; les 22 scénarios Linux de la livraison exacte passent. Aucune assertion supprimée ou seuil de sécurité relâché.

Suite par priorité : **L28 en préparation locale**, puis L02, L23, L10, L24, L25. Ne pas recommencer l'audit général. La protection ECO-LOCK de tous les comptes GitHub n'est pas déclarée activée. Coût exact des crédits non mesurable.

