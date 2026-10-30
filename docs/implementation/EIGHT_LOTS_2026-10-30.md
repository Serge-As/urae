# Huit lots Canopée — implémentation et preuves

Date : 30 octobre 2026. Candidat : 1.5.2.43-canopee-collective.
Base runtime : `1d6d2767e208b240d40f5fdd578f11e2582a8c8f` (v42).
Base du checkout : `9c8e8332fc0eb44102ba7a35b245a32630322459`.

Autorisation : le fondateur demande de reprendre et livrer tous les huit lots,
sans retrait silencieux des parcours existants. Les quatre couleurs restent
doré, blanc, rouge et vert. Associations et tontines rotatives restent prioritaires.

Statut au checkpoint : **IMPLEMENTED / FINAL_QUALIFICATION_IN_PROGRESS**.
Ce document n’atteste pas un déploiement. Les preuves exactes du SHA final seront
ajoutées dans `docs/release/evidence/`. `realMoneyEnabled=false` et
`FIELD_ACCEPTED=NOT_ACCEPTED` restent obligatoires.

## Matrice des 32 critères

| Critère | Comportement implémenté et destination | Propriétaire, droits et preuve |
|---|---|---|
| L1.1 | Garde de démarrage indépendante du graphe de modules, délai borné et reprise visible. | `startup-guard.ts`, tests navigateur eight-lots : panne auth et module secondaire absent. |
| L1.2 | Authentification et noyau prioritaires ; import des panneaux secondaires à la demande ; installation du SW après le premier démarrage. | `main.js`, contrôleurs existants, authentification inchangée ; qualification du graphe PWA et test téléphone. |
| L1.3 | Paramètres → Mon appareil : groupe actif, date des copies, opérations en attente, conflits, reprise vers les feuilles et outbox existantes. | `recovery-workspace.js`, copies de l’acteur/tenant/groupe courant ; aucune suppression de données. |
| L1.4 | Diagnostic téléchargeable limité aux étapes et capacités techniques. | `startup-guard.ts`, pas de montants, nom, identifiant, cookie, contenu de stockage ou message serveur brut ; test de confidentialité. |
| L2.1 | Nom du membre dans la feuille → sa fiche individuelle modifiable ; changement de membre soumis au passage financier existant. | `context-link.js`, routeur de détail et deuxième feuille canonique ; test réel à deux comptes. |
| L2.2 | Nom d’une rubrique → feuille globale en lecture financière et paramètres selon les droits. | Routeur et configuration Rubrics existants ; aucune troisième feuille de saisie ; test expérience. |
| L2.3 | Nom d’une séance → détail de cette séance ; contexte conservé dans les feuilles et l’historique du membre. | Identifiants métier dans les liens, routeur existant ; pas de sélection par nom ambigu. |
| L2.4 | Liens réutilisables dans matrices, dettes, présences, cumuls et historiques ; navigation de détail et retour conservés. | `context-link.js`, deux feuilles existantes, tests navigation acquis et contexte. |
| L3.1 | Titre « Synthèse du membre “Nom” avant de continuer », nom mis en couleur ; copie locale affichée immédiatement. | `member-synthesis-ui.js`, sélection courante, pas d’attente du rafraîchissement global. |
| L3.2 | Actualisation ciblée sur le membre, union des rubriques courantes de tous les gestionnaires ; auteur, date et version. | `MemberEnvelopeService` relit les sources Ledger existantes ; brouillons privés des collègues exclus. |
| L3.3 | Contrôle groupé des versions effectivement affichées ; commande durable et idempotente ; ACK explicite. | `synthesis-review.ts`, `closeFinancialPassage`, outbox ; tests rejet d’une même somme à une autre version, appel direct et rejoué. |
| L3.4 | Modifier revient à la cellule canonique ; nouvel événement actualise/invalide la synthèse ; réserves existantes conservées. | Contrôle canonique par cellule et Live existants ; aucune auto-approbation indépendante. Un lot de contrôles n’est pas présenté comme une transaction atomique. |
| L4.1 | Montants FR/EN, « 5 mille », « 5 thousand », « 5.000 », « 5,000 », nombres mixtes et bornes sûres. | `voice-commands`, corpus déterministe ; « 5 » reste 5 et n’est jamais transformé arbitrairement en 5000. |
| L4.2 | Montant lisible en chiffres et lettres, alternatives lorsqu’elles existent, accord explicite si confiance absente/faible. | `voice-entry-ui.ts`, report dans la cellule seulement ; validation financière séparée conservée. |
| L4.3 | Vosk français facultatif : téléchargement explicite, empreintes vérifiées, worker local, modèle supprimable isolément, reprise des fragments. | `vosk-local.ts`, verrou Apache-2.0, assets servis par Eco ; cache/IndexedDB réservés au modèle ; test installation, silence réel WASM, coupure et suppression ciblée. |
| L4.4 | Clavier financier et validation existants restent disponibles ; micro contextualisé sur la cellule. | Éditeur canonique inchangé ; tests des deux feuilles et tailles mobiles. Mesures sur téléphone réel, accents, bruit et batterie restent terrain. |
| L5.1 | Panorama du groupe : situation financière et humaine, Recap, caisse, prochains rendez-vous, bénéficiaires et accès utiles. | `group-home-ui.js`, projections existantes autorisées ; montants locaux signalés, pas de nouveau calcul comptable. |
| L5.2 | Atelier de séance → espace de réunion et deux feuilles existantes. | Propriétaire de navigation `operations/twoSheetWorkspace`, droits de gestion conservés. |
| L5.3 | Dossier membre : liens vers séances/rubriques et historique financier. | Routeur de détail, projections canoniques, limite de visibilité du membre conservée. |
| L5.4 | Cockpit personnel : associations puis tontines rotatives, activités et possibilités ; composition du groupe liée au compte. | `personal-cockpit-ui.js`, `group-home-ui.js`, portée acteur/tenant/groupe ; pas de préférence partagée entre comptes. |
| L6.1 | Recherche des membres, tri stable, colonnes choisies, minimum une rubrique, parties et colonnes fixes conservées. | `table-preferences.js` + renderer canonique ; aucun filtrage de la source comptable. |
| L6.2 | Total du groupe maintenu sous filtre, sous-total affiché distinctement ; détail des sources, formule, période et arrondi. | `financial-number-ui.js`, sommes des flux affichés en F CFA entiers ; caisse/dette non déduites de ces sommes. |
| L6.3 | Frise des tours de tontine et accès aux propriétaires prêts/remboursements. | `tontine-timeline.js`, cycles/parts existants ; SERVED exige une preuve, capital et intérêts restent séparés. |
| L6.4 | Simulations accessibles par le laboratoire acquis ; export/hypothèses déjà contrôlés. | Aucun moteur parallèle ni écriture Ledger depuis une simulation ; suite financial-explanations conservée. |
| L7.1 | Boutique : articles, disponibilité, réapprovisionnement et accès commandes/préparation/remises/litiges. | `community-shop-ui.js`, moteur Marketplace, droits existants ; une commande n’est pas un paiement. |
| L7.2 | Forum : transformer délibérément une discussion en décision, responsable, échéance et preuve ; brouillon privé durable. | `forum-decision-ui.js`, gouvernance/obligations existantes ; accès habilité et idempotence ; tests de contenu concurrent, lecture indépendante et rechargement. |
| L7.3 | AdManager : budget sandbox explicite, période, ciblage autorisé, provenance des compteurs observés. | Propriétaire publicitaire existant ; consentements et limites conservés, aucune dépense réelle inventée. |
| L7.4 | Opportunités : offres actuelles publiées, termes/quantité/prix/validité/auteur, coûts inconnus signalés, action et signalement. | `opportunity-lanes.js`, Value Network / Demand Exchange / Safety existants ; participation volontaire, aucun revenu garanti. |
| L8.1 | Recherche locale/Eco IA limitée aux copies de groupes accessibles par le compte courant, avec provenance et datation. | UniversalSearch, contrôle groupe/membre courant et refus serveur non masqué ; tests recherche et droits acquis. |
| L8.2 | Navigation, dialogues, tableaux et accès clavier contrôlés sur 320, 360, 768 et 1440 px. | Tests expérience + suites Canopée acquises ; captures produites par navigateur. Une feuille large défile dans son conteneur. |
| L8.3 | Matrice des 164 capacités distinguant copie, préparation, attente et confirmation serveur ; capacités non qualifiées indiquées. | Registre généré depuis les autorités du dépôt, gate `lint:offline-capabilities` ; pas de promesse globale de toutes les mutations hors ligne. |
| L8.4 | Besoin → propriétaire → destination → droits → preuve ; journal de conservation et reprise. | Ce document, CIR, registre, Current Truth, Truth Ledger et NEXT_RUN ; 28 lots/92 propositions conservés, aucun retrait de maturité caché. |

## Synthèse à plusieurs gestionnaires

Les saisies confirmées de Secours, Transport, Collation, Tontine, Épargne,
Remboursement et Prêt apparaissent selon les rubriques réellement présentes pour
le membre et la séance. Une correction conserve l’auteur et la version issus du
propriétaire canonique. Les saisies encore privées ou non synchronisées d’un
autre appareil ne peuvent pas être annoncées comme connues du serveur.

La clôture vérifie les versions et montants affichés, puis appelle le contrôle
canonique pour chaque ligne de collègue admissible. Une réserve n’est pas effacée
par cette action groupée. Si une ligne change pendant l’opération, la clôture
refuse la version périmée et demande une actualisation ; les contrôles déjà reçus
restent traçables. Une coupure conserve la commande sur l’appareil et affiche son
attente ; elle ne vaut pas confirmation serveur.

## Dictée locale et choix open source

Vosk-browser 0.0.8 et le modèle `vosk-model-small-fr-0.22` sont verrouillés par
SHA256, avec licence Apache-2.0 et notice. Le ZIP amont fait 42 233 323 octets ;
le build le transforme de façon déterministe en archive puis fragments d’au plus
8 Mio, pour rester sous les limites d’assets du déploiement. Le navigateur ne
contacte aucun CDN pour ce parcours. Le modèle se télécharge seulement sur
demande et le son reste dans les buffers du micro et du worker de cet appareil.
Le cache compressé et le montage IndexedDB extraits sont propres à la voix.
Les dossiers explicites de l’archive sont traversables (0755) et les fichiers
sont en lecture/écriture (0644), afin que le montage local puisse les synchroniser.

Les correctifs au worker amont concernent le montage isolé, le répertoire
stable du modèle, le marquage de sa réponse finale et son chargement depuis un
fichier worker séparé. Les liaisons Emscripten génèrent du JavaScript ; cette
permission est limitée à ce worker et à sa réponse HTTP, avec une politique
bloquant toute ressource extérieure. La page conserve sa CSP stricte. Le résultat
final explicite évite de tronquer la fin de dictée quand des réponses sont encore
en file. Le modèle acoustique et la reconnaissance ne sont pas modifiés.

Comparaison de décision : Vosk est retenu pour un petit modèle français et son
fonctionnement CPU/WASM ; `whisper.cpp` propose aussi WASM avec des exigences de
ressources propres à son modèle ; Transformers.js peut utiliser WASM/WebGPU,
dont la disponibilité dépend du navigateur. Aucun classement de précision ou de
vitesse sur les téléphones Eco n’est inventé. Les mesures automatiques portent
sur chargement froid/chaud, worker réel et silence ; elles ne mesurent ni les
accents camerounais, ni une réunion bruyante, ni l’autonomie d’un téléphone.

Sources primaires : [vosk-browser](https://github.com/ccoreilly/vosk-browser),
[modèles Vosk](https://alphacephei.com/vosk/models),
[whisper.cpp WASM](https://github.com/ggml-org/whisper.cpp/tree/master/examples/whisper.wasm),
[Transformers.js WebGPU](https://huggingface.co/docs/transformers.js/guides/webgpu).
Les packs natifs SpeechRecognition restent une option séparée lorsqu’ils sont
réellement disponibles ; Eco ne promet pas leur suppression via une API absente.

## Conservation et qualification

Pas de schéma SQL ou de migration ; aucun compte, montant réel, historique ou
permission modifié par une recette. Les propriétaires Ledger/D1, prêts, épargne,
tontines, rubriques, présence, forum, stocks et publicités restent en place.
La modification du stockage forum réutilise ses colonnes : l’enregistrement du
brouillon n’écrase plus le repère de lecture et réciproquement. La comparaison
du contenu empêche qu’une ancienne fenêtre écrase une rédaction plus récente.

Les fixtures financières et de forum sont synthétiques, dans des bases SQLite
séparées par fichier de navigateur. Les tests historiques sont conservés ; les
nouveaux tests complètent le contrôle acquis des 28 lots/92 propositions. La
preuve de livraison exige les gates complets sur le SHA réellement publié, BIR
D1/source en lecture seule puis concordance santé/catalogue/empreintes publiques.

La recette physique sur les téléphones concernés, groupes réels et réseau de
réunion reste **NOT_ACCEPTED** tant que ses preuves ne sont pas recueillies.
Elle ne justifie pas d’effacer cookies, IndexedDB, caches de copie ou outbox.

## Dernier contrôle fonctionnel local

Le 30 octobre 2026, les deux scénarios Chromium `eight-lots-experience` sont
passés sans saut ni relance : recherche/total conservé, sources et période,
320/360/768/1440 px, passage financier avant rubrique, global rubrique sans
saisie, Panorama/Journal ; puis installation volontaire du moteur Vosk réel,
chargement sans réseau, silence traité par WASM et suppression limitée au modèle.
Le cache et la base financière synthétiques restent présents. Les deux premiers
points d’échec ASR (CSP héritée et dossiers non traversables) ont été corrigés.
La compilation complète et les deux moteurs navigateur sur le SHA publié restent
la condition de livraison ; ce constat local ne remplace pas la recette physique.

La recette vocale WebKit utilise l’arrêt réel d’un proxy local isolé, conformément
aux tests souverains acquis : son simulateur offline bloque même les réponses
du shell en cache. Le test vérifie que ce proxy ne répond plus puis charge
réellement le moteur et le modèle depuis le stockage local. La permission
`connect-src data:` est limitée au worker vocal, pour son WASM intégré ; aucun
hôte extérieur n’est autorisé. Le navigateur de la page reste sous CSP stricte.


Contrôle des 164 destinations : le centre d’impression dépend du shell Documents,
créé par son propriétaire canonique. Son chargement attend désormais ce montage,
sans attendre les requêtes de documents et sans bloquer la restauration de session.
Le chargement différé reste conservé ; aucune route ni écriture financière ajoutée.
Les tests acquis de présence des propriétaires restent inchangés.


La suite WebKit Linux acquise a détecté un retrait de nettoyage à la déconnexion :
le proxy différé ne transmettait pas l’argument force de clearForContext(true).
Il transmet maintenant tous les arguments au contrôleur canonique, conservant
le nettoyage immédiat des vues privées sans effacer les données locales.
Le test de calendrier privé après déconnexion est conservé sans modification.


Audit complet des dépendances de montage différé : Business Studio précède les
ressources, expérimentations et Value Discovery ; Value Network précède les
expérimentations et offres temporelles ; Wallet précède son enveloppe ; Matching
précède le graphe et le registre opérationnel précède le registre de modèles.
Aucun de ces chargements ne bloque l’écran de connexion. Une recette retarde
réellement Documents et Business Studio puis vérifie leurs propriétaires enfants,
sans modifier les contrôles historiques de réservation ou de confidentialité.


La recette de retard de modules utilise son propre contexte sans service worker :
Chromium pouvait sinon fournir le module depuis son cache, hors du routeur de
requêtes du test. Les suites offline acquises restent actives et inchangées ;
aucun test ignoré, aucune réponse de produit simulée. WebKit complet 44/44 sur
le checkpoint précédent ; toutes les suites seront rejouées sur le SHA final.
