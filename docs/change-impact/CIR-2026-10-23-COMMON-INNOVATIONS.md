# CIR — Compléments communs des innovations, 23 octobre 2026

Autorisation : poursuite des lots et de leurs innovations demandée explicitement par le fondateur. Base publique acquise : v35, source dd1e7388829afe29cde453f1cdbefd6caedf98a8 ; clôture locale 283271b. Ce dossier ne vaut pas livraison du complément.

## Réutilisation avant construction

I01 étend `createJourneyContext` et le cockpit existants : durée locale 1/7/30 jours, oubli sélectif et pause par compte sur cet appareil. Les reprises restent des références sans titre, montant ou contenu ; le propriétaire métier revérifie les droits au clic. La mémoire Eco IA conserve son propriétaire, son consentement et son effacement existants.

I02/I03/I09/I12/I14 doivent être rapprochés des moteurs, interfaces et tests déjà livrés avant toute nouvelle construction : répétition isolée L05, budget et comparaison L28, modes L01, négociation L23. Aucune couverture complète n'est déduite de leurs noms. I16 requiert une orchestration Business Studio des ressources et des commandes canoniques ; aucun second stock ni moteur financier n'est autorisé. Un créneau non confirmé ne devient pas disponible par simple déclaration.

## Effets indirects et protections

Changer la durée peut retirer immédiatement une reprise ancienne ; augmenter la durée ne doit pas ressusciter une référence déjà purgée. La pause d'appareil concerne le compte courant et ses groupes sur ce navigateur, sans prétendre modifier les autres appareils. Elle masque les références et arrête leur enregistrement ; elle n'efface pas implicitement une donnée métier ou un autre compte. L'oubli reste local et ciblé. Une préférence locale illisible ne doit pas interrompre la navigation.

Ne pas modifier Ledger/D1, outbox, signatures, présence Live, modes ou commandes métier acquis. Aucune purge de cookies, IndexedDB ou données de site. Aucun redémarrage. Pas de migration ni de dépendance payante. `realMoneyEnabled=false`, `FIELD_ACCEPTED=NOT_ACCEPTED`.

## Qualification et retour

Vérifier expiration, réduction puis augmentation, oubli isolé, changement de compte/groupe, pause d'appareil, stockage indisponible, réponses tardives et droits retirés ; parcourir FR/EN et les modes à 360 pixels. Conserver les suites financières et synchronisation intégrales. Le futur déploiement exige la qualification native, Chromium et WebKit sur son SHA exact, sauvegarde préalable et empreintes publiques. Repli limité aux projections ajoutées, aucune restauration automatique des données.

## Implémentation candidate et limites

# Compléments communs : mémoire, pratique et moyens partagés

Version candidate `1.5.2.36-common-innovations`, base publique v35/dd1e7388829afe29cde453f1cdbefd6caedf98a8. Ce dossier décrit le code à qualifier. Il ne prouve pas un déploiement v36 ; les reçus publics et les deux qualifications sur la même source sont nécessaires.

## I01 — Mémoire contrôlée du parcours

Accueil → réglages de la mémoire : conserver les références de l'espace courant 1, 7 ou 30 jours ; oublier une destination ou une feuille consultée ; suspendre la mémorisation de ce compte sur cet appareil. Une réduction de durée purge les références trop anciennes de l'espace courant ; une augmentation ultérieure ne les ressuscite pas. Le réglage d'appareil masque les reprises et arrête les nouveaux enregistrements pour ce compte, dans tous ses groupes sur ce navigateur. Les autres comptes et appareils gardent leurs réglages.

La clé historique de chaque espace est conservée. Le stockage ne contient que destination, référence de séance et horodatage : aucun montant, titre métier, message ou conversation. La reprise ne dispense jamais le propriétaire du module de vérifier les droits. L'oubli d'une référence ne supprime aucune donnée métier. Le choix de mémorisation Eco IA reste gouverné par son consentement existant. Limite : pas de synchronisation des préférences entre appareils, ni de mémoire complète de tous les objets de chaque module.

## I02 — Répéter une correction puis un changement de membre

Depuis une feuille financière, ouvrir la répétition locale. Le bouton d'exemple guidé inscrit 1 000 pour Amina, remplace ce total par 1 500 et inscrit 500 dans une autre rubrique. Le total est 2 000. Le passage à Boris montre la synthèse figée d'Amina avant de permettre la saisie suivante. Le tableau contient vingt rubriques entièrement réparties par le même calcul de découpage que la feuille ; ses totaux couvrent toujours l'ensemble.

L'export explicite `eco-exercice-seance.json` contient uniquement les valeurs de cet exercice fictif, sa révision, les vingt rubriques, les totaux, l'état de la synthèse et le découpage visité. Il porte `syntheticExerciseOnly=true`, `canonicalFinancialPosting=false`. Le test conserve un vrai brouillon de 5 432 sur la feuille et exige qu'il reste identique après la répétition ; aucune commande financière ne doit partir. Fermer efface l'exercice en mémoire. Limite assumée : répétition pédagogique du tableau et de la revue, pas une exécution complète du moteur de prêts, de Live, de l'outbox ou d'un accusé serveur. I02 demeure partiel au regard de cette ambition complète.

## I16 — Assembler les moyens d'un projet sans second stock

Marketplace / Eco Business → Business Studio → « Assembler des moyens · accords et réservations ». Choisir le groupe actif, donner un nom privé au projet et décrire de une à quatre ressources : vitrine personnelle publique, stock publié, unité identique à la source, quantité entière, dates et conditions. Un accord explicite autorise l'envoi de chaque ligne à son seul propriétaire. Le titre privé et les autres ressources sont masqués pour celui-ci.

Exemple : une personne assemble une machine et du matériel pour un atelier. Chaque propriétaire répond séparément après lecture des conditions. L'accord affiche « non réservé ». Le porteur ouvre ensuite la boutique existante, vérifie la disponibilité et réserve par la commande Market habituelle. Il revient charger ses achats compatibles et lie la commande effectivement enregistrée. Le serveur recontrôle acheteur, propriétaire, ressource, unité, quantité active, absence de litige et conditions de la source. Cette preuve n'affirme aucun paiement. Une annulation, un retour, un changement des conditions, une fin de période ou un retrait de droits retire la preuve active.

Les vitrines publiques peuvent résider dans le tenant canonique du propriétaire. Le résolveur lit un véritable enregistrement Market, conserve l'acteur authentifié puis délègue à l'autorisation publique ou de partie de MarketService. Aucune identité ou tenant du formulaire n'est tenu pour autorité. Le plan est conservé par BusinessStudioService dans le tenant du groupe ; un index immuable d'affectation est conservé dans le tenant de la commande canonique et empêche de justifier deux plans, même dans des groupes de tenants différents, avec cette commande. Cet index n'est ni un stock ni une réservation.

La création est idempotente ; toutes les décisions utilisent la version attendue. Deux achats concurrents d'une unité disponible passent par la protection de stock Market existante : un seul peut réussir. Retirer ou archiver un plan n'annule jamais un achat. Une annulation doit suivre le parcours commercial existant et garder ses traces. Un conflit après insertion de l'affectation réserve cette affectation à la même ligne ; réessayer sur la version courante permet de terminer. Il n'existe pas de réaffectation automatique à un autre plan, de location à calendrier, de remboursement ou d'achat atomique de plusieurs propriétaires.

La liste est limitée aux trente plans les plus récents autorisés dans le groupe courant ; elle ne relit aucun stock ni commande. Un état « sources à relire » demande une action de relecture du plan choisi. Aucun polling. Les appartenances sont lues une fois par opération. Quatre ressources maximum bornent le nombre de relectures et la taille des formulaires. Les quantités futures ne sont pas présentées comme disponibles maintenant ; les dates doivent entrer dans la période de l'offre. Les brouillons de notes des autres lignes sont conservés lorsqu'une décision actualise la carte. Les réponses tardives ne franchissent pas un changement de compte, groupe ou langue.

## Innovations rapprochées des acquisitions

| Proposition | Propriétaire existant et preuve | Périmètre réel |
|---|---|---|
| I03 Budget de requêtes | Application / request-budget L28, tests natifs et navigateur | Mesure explicite par catégorie, pause et export ; pas une facture Cloudflare, une mesure de D1 ou des trames WebSocket. |
| I09 EcoMirror | `scripts/compare-lot-effects.mjs`, tests L28 | Rejeu Worker/SQLite de commandes et reçus, comparaison des effets financiers et des versions avec réduction des lectures concurrentes ; pas un rejeu universel de tous les modules. |
| I12 Modes | L01 et feuilles financières acquises, qualifications navigation et mobile | Visuel compact, senior et assisté ; droits et commandes partagés, brouillons préservés dans les scénarios qualifiés. Chaque nouvel écran doit encore prouver sa parité. |
| I14 Négociation | Eco IA / assistant-actions L23, tests FR/EN | Brouillons d'offre, contre-offre ou clarification, champs manquants signalés ; ni envoi, acceptation ni engagement autonome. |

Les 44 outils/modèles T/M du registre sont des références avec décision d'adoption. Leur affectation à un lot ne signifie pas 44 bibliothèques à installer. Aucun service payant ou nouvelle dépendance n'est ajouté ici. I10 conserve son export minimal d'incident livré en v35 ; une reproduction d'un vrai défaut à partir de cet export reste à attester.

## Contrôle de livraison et repli

Tests ciblés : expiration, changement de durée, oubli, pause isolée par compte, échec du stockage ; rapport figé et correction ; ressources sur mémoire et SQLite/D1, consentement, privacy, droits retirés, concurrence de stock, tenant canonique, affectation unique intergroupes, source périmée et unité incompatible. Tests navigateurs : deux comptes réels de recette, accord indépendant puis achat et lien canonique ; affichage EN à 360 pixels, échec réseau conservant les champs, inactivité sans lecture, déconnexion effaçant le contenu privé, exemple et export sans altération d'un brouillon financier.

Qualification intégrale obligatoire sur la source finale : CI gouvernée, Chromium acquis et nouveaux scénarios, WebKit hors ligne ; aucune assertion ou suite acquise supprimée. Sauvegarde D1 en lecture seule, restauration d'une copie vierge, empreintes et relecture privée R2 avant livraison. Vérifier santé, catalogue et 48 empreintes publiques après déploiement. Un cache v36 distinct conserve le cache v35 de repli et les générations préservées ; ne jamais purger IndexedDB, cookies ou outbox pour obtenir un test vert. Aucune restauration de production automatique.

**ÉTAT DU PROJET APRÈS ÉTAPE** : complément implémenté, qualification finale et publication à prouver. Production acquise v35. Ledger/D1, finance, signatures, présence Live, outbox et droits acquis conservés. `realMoneyEnabled=false`, `FIELD_ACCEPTED=NOT_ACCEPTED`. Aucun redémarrage. Consommation exacte de crédits non mesurable.


## Consigne complémentaire du fondateur — 24 octobre

ECO-REPO-001 : lire `docs/governance/ECO_REPOSITORIES_CONFIDENTIALITY_EFFICIENCY_2026-10-24.md`. Maximiser le public uniquement pour les contenus publiables ; aucune copie du produit, des preuves privées ou de son historique dans UTRAE. Les tests privés requis restent obligatoires. Réduire les interactions distantes par les caches locaux, publications groupées et lectures ciblées. Aucune modification des parcours métier ou du statut de livraison par cette règle.

## Livraison sobre — 24 octobre 2026

Le workflow de livraison exécutait la totalité des tests natifs une première fois avec `node --test tests/*.test.mjs`, puis tous les mêmes fichiers une seconde fois après succès. Cette deuxième exécution est retirée : aucun fichier, assertion ou contrôle bloquant n’est retiré. Un échec de la première suite reste bloquant ; les noms et emplacements des échecs sont conservés dans la sortie du runner Node. La qualification indépendante `npm run ci`, Chromium, WebKit, les comparaisons d’effets, sauvegardes et preuves publiques restent inchangés. Le gain attendu est la suppression d’une répétition, sans promesse de durée ou de coût mesurés avant le run final. Aucun code métier n’est modifié par cette optimisation.

La préparation du test L05 attend désormais la valeur effective du sélecteur de groupe et la cellule de la séance créée, plutôt qu'un toast temporaire de changement. Après rechargement, le groupe peut déjà être actif ; aucune notification de changement n'est alors due. Les assertions de protection du brouillon de 5 432, d'absence d'écritures, de couverture des vingt rubriques et du rapport guidé restent obligatoires. L'essai de réponse tardive attend explicitement le début de la requête interceptée avant la saisie, afin de reproduire réellement l'ordre testé.

## Qualification a8e3f6dc refusée avant déploiement

La source `a8e3f6dc3df32dd9d4f24775516f312466147c49` a réussi la CI gouvernée, les nouveaux essais de ressources et la répétition de séance, mais le contrôle Chromium de mémoire a refusé la livraison 40081553662 et la qualification 40081553661. L'observateur du nouveau test incluait le POST `/api/v1/bootstrap` normal de son propre `page.reload()`. Il mesure désormais séparément les actions locales avant et après ce rechargement, en exigeant zéro écriture dans chaque phase après stabilisation du démarrage. Le rechargement reste exécuté pour prouver la persistance de sept jours. Aucune URL métier supplémentaire n'est filtrée ; un bootstrap déclenché par une action de réglage resterait un échec. Les moteurs applicatifs et les autres assertions restent inchangés. La source corrigée exige ses propres qualifications ; aucune relance du run refusé ni promotion de recette terrain.
