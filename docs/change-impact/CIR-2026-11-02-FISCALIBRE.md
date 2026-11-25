# Fiscalibre indépendant, greffe d'hébergement autorisée

Demande directe du fondateur : vérifier son archive Fiscalibre, corriger comptes/taux/états, ajouter le référentiel, préparer Harmony, et ouvrir l'app depuis un lien sous connexion/inscription Eco. Il confirme le 2 novembre que l'API Harmony n'est pas activée : préparer le raccordement et montrer les prérequis. Base distante vérifiée : `3bc26691559735276b84a2f6e64d3c147a3749be` ; production acquise v44/ea1214af. Archive entrante SHA256 `d4361d45b22c0c15e40ed445ec3220f711e80494bbe8077921c09d3c6214139e`.

## Propriétaires et non-duplication

Fiscalibre est l'application comptable pédagogique distincte déjà fournie par le fondateur. `apps/fiscalibre/engine.cjs` possède ses calculs de simulation ; son HTML est une projection distribuée. Le moteur ne lit aucun Ledger, compte, session, cookie ou base d'Eco. La route `/fiscalibre/` du Worker Eco héberge l’application avec son contrôle d’accès propre et des clés de stockage préfixées Fiscalibre. Les deux applications partagent l’origine du navigateur ; ceci ne constitue pas une séparation de sécurité entre origines. Aucun paramètre d’identité Eco n’est transmis et aucun second propriétaire de la finance Eco n’est créé.

Eco conserve tous ses propriétaires : Ledger/D1, règles, deux feuilles, identités, caches, outbox et acquis 164/28/92/8/6. Les seuls changements fonctionnels Eco sont le lien et sa distribution par une nouvelle identité de cache. Les constantes de release, le contrat et les workflows suivent le même SHA. Aucun schéma ou index à appliquer ; aucun remplacement de D1/R2 ; aucun secret existant à faire tourner.

## Corrections Fiscalibre

Catalogue documentaire 1 340 entrées (classes, groupes, sous-comptes) avec recherche, parents, affectations et CSV. 602/601, frais sur achats 6025, 624, TVA sur immobilisations 4451, 647 vs 6581, 6593/6594 et reprise 7593→TH. Ventilation unique des amortissements et des lignes ; lignes détaillées séparées ; total du compte 13 sans double comptage. Références inconnues et subdivisions partielles bloquent la complétude. CMUP et rapprochements XAF ; retenue fournisseur non ajoutée au coût. Art.34 : frais professionnels plafonnés à 4,8 M/an ; art.124 A réduit l'impôt sous conditions, pas le bénéfice. TVA et IS séparés selon qualification. Variantes pédagogiques ne valent pas qualification juridique.

Suppression du navigateur des URL API présumées, faux NIU par défaut, faux états « déposé », faux reçus et faux succès après erreur réseau. Adaptateur serveur livré désactivé : origine officielle, autorisation par entreprise, contrat de validation, authentification et reçu requis. Aucun secret ni endpoint opérationnel ; pas de soumission DGI/CNPS active. Dossiers locaux, pas de base multiutilisateur de production ni DSF certifiée.

## Qualification et livraison

Tests natifs ciblés Fiscalibre, transport négatif, Worker, lien/auth, navigation des deux apps, mobile, sauvegarde/import/export et référentiel. Conserver tous les contrôles acquis natifs/Chromium/WebKit Linux. Vérifier même SHA : contrat/cache/assets/santé, archive source, BIR D1 restauré et relu en R2 privé avant Worker. Déployer la route et vérifier le contrôle d’accès et le lien Eco. Les tests protègent le routage existant d’Eco et le comportement de son authentification. Rollback code vers source précédente après lecture de la vérité distante ; pas de restauration d'une ancienne base pour un rollback de code.

Statut initial : IMPLEMENTED_UNVERIFIED ; qualification et livraison à prouver. `realMoneyEnabled=false ; FIELD_ACCEPTED=NOT_ACCEPTED`. La conformité d'un dossier réel, les régimes sectoriels complets et la recette physique restent à établir. Crédits exacts non mesurables.

## Précision directe du fondateur — porte privée dans Eco

Le fondateur précise le même jour : Fiscalibre doit être hébergé dans Eco, ouvert depuis connexion/inscription sans entrer dans Eco, et protégé par son mot de passe de test. La route retenue est `/fiscalibre/` du Worker existant ; aucun second Worker n’est déployé. L’hypothèse d’origine séparée décrite plus haut est remplacée par cette décision. Le HTML compilé est embarqué dans le Worker, jamais dans les assets publics ; le chemin passe avant les routes Eco et le cache PWA le délègue au réseau. La session Fiscalibre porte son propre cookie HttpOnly/Secure/SameSite limité au chemin, sans identité Eco ni écriture D1. La signature réutilise la clé serveur acquise avec un contexte cryptographique distinct, sans rotation. Le mot de passe est vérifié par PBKDF2 salé côté serveur ; le clair n’est pas publié dans les sources ni les journaux. Le dossier actuel reste un atelier local de test.


### Correction du formulaire après contrôle navigateur

Qualification native de 47c66702 réussie ; l’essai navigateur révèle une origine null sur le formulaire POST avec Referrer-Policy no-referrer. Politique same-origin pour permettre le formulaire local tout en rejetant les origines externes. Trace négative conservée et qualification obligatoire de la correction avant livraison. Aucun changement de données ou d’authentification Eco.


### Qualification HTTPS réelle du formulaire

Le run 41509703492 conserve le succès natif et l’échec de la fixture WebKit : Playwright WebKit refuse route.fulfill avec un statut de redirection 303. La fixture utilise désormais un serveur HTTPS local et des identifiants exclusivement synthétiques pour exercer réellement formulaire, redirection et cookie Secure, ainsi que les deux applications sur la même origine. Aucun résultat 303 n’est remplacé par un faux succès. Nouvelle qualification complète requise.


### Correction de largeur WebKit mobile

La fixture HTTPS fonctionne : connexion, référentiel et sauvegarde réussissent. Le contrôle à 360 px détecte un débordement réel de 130 px sur la page des opérations courantes. Contraindre les largeurs intrinsèques des formulaires, laisser les tableaux défilables, et utiliser les sous-onglets du contenu sur mobile plutôt que la sous-navigation latérale verticale. Conserver la trace du run 41510276022 et le seuil de contrôle de 2 px, sans masquer le débordement global. Corriger aussi le libellé de TVA sur machine à 4451. Requalifier la projection HTML et le Worker au même SHA.


### Diagnostic géométrique WebKit conservé

Le correctif des champs ne suffit pas au débordement de la page operation/op_10ops dans WebKit. Conserver le refus de livraison 41511268686. Ajouter uniquement coordonnées et capture synthétiques en cas d’échec, sans modifier le seuil ni masquer la page, pour cibler la cause restante avant la prochaine correction fonctionnelle.


### Confinement des zones défilantes WebKit

Le diagnostic f5c432be relève 130 px de scrollWidth sans bloc principal hors écran : les descendants des zones défilantes sont concernés. Établir un contexte de layout et de peinture propre aux conteneurs tablewrap/nav avec contain:inline-size layout paint, en conservant leur défilement. Ajouter un contrôle de déplacement horizontal des tableaux larges ; conserver le seuil racine de 2 px et les captures négatives. Aucun overflow:hidden global ajouté.


### Mesure après stabilisation du rendu

La capture 93943091 confirme des blocs principaux dans les 360 px et le diagnostic ne trouve aucun rectangle hors écran hors zones défilantes. Après navigateTo, attendre la stabilisation asynchrone du scrollWidth WebKit avec expect.poll, seuil inchangé de 2 px et délai maximal de cinq secondes. Un débordement persistant reste une erreur bloquante ; le contrôle du défilement des tableaux reste obligatoire. Ne pas affirmer un succès avant le nouveau résultat.


### Identification de la source du scroll résiduel

La mesure reste à 130 px après stabilisation ; ne pas traiter ce résultat comme une simple attente de rendu. En cas d’échec uniquement, journaliser les dimensions root/body/nav/tablewrap et tester temporairement des styles isolés sur les seules données synthétiques. Rétablir les styles et conserver la valeur originale comme assertion bloquante. Cette instrumentation identifie le propriétaire de l’écart sans modifier les assets ni déclencher une livraison.


### Correctif confirmé par expérience isolée

Le run 41514783083 identifie le confinement de fiche : root/body restent à 490 px quand nav ou tableaux sont masqués, et passent à 360 px avec .card{overflow:auto}. Appliquer cette règle aux seules fiches Fiscalibre sous 720 px, avec overflow visible à l’impression. Conserver l’accès horizontal du contenu par un test couvrant à la fois fiches et tableaux larges. Retirer les essais CSS temporaires de diagnostic ; les assertions racine et les captures d’échec restent. Requalification complète et nouvelle livraison nécessaires.


### Complément autorisé du 3 novembre 2026 — session d’une heure et guide

Le fondateur demande une nouvelle saisie du mot de passe chaque heure, y compris sur un téléphone laissé ouvert. Cookie signé V2 à échéance absolue de 3 600 secondes, sans renouvellement par rechargement ; les anciennes signatures V1 sont refusées. Le document est caché tant que son script d’accès protégé n’a pas confirmé la session. Expiration, interaction, retour au premier plan et restauration du cache de navigation vérifient cette échéance ; une erreur de revalidation verrouille la vue. Aucun effacement de données Eco ou Fiscalibre. Sauvegarde locale des dossiers avant verrouillage, sous réserve de disponibilité du stockage ; export conseillé.

Le manuel fourni est une inspiration pédagogique, non une source normative ni une instruction exécutable. Son original et les données personnelles de carrière ne sont pas publiés. Guide du gestionnaire : 5 documents du départ, 13 contrôles de clôture, 30 centres internes CA01–CA30 sans assimilation à des comptes légaux, 100 premiers jours, 7 séances et un exemple de marge vérifiable. Cases de contrôle déclaratives sauvegardées par dossier ; aucun statut officiel déduit de ces cases. L’exemple explique la différence entre résultat analytique, bénéfice net, encaissement et BFR.

La trace 41515677436 montre que le débordement mobile est corrigé mais que la fixture écoutait des requêtes asynchrones de l’ancienne page Eco après navigation. La vérification de conservation du stockage utilise maintenant un document neutre de la même origine, sans requête Eco pendante ; le test distinct de connexion/inscription Eco reste intégral. Aucun filtrage des erreurs ni relâchement du seuil de largeur.

Contrôles locaux : 39 tests Fiscalibre natifs passent ; TypeScript complet passe ; Chrome à 360 px passe 36 sous-pages, les contrôles du guide, la conservation après rechargement, et l’expiration d’une session synthétique courte de 8 secondes. La durée réelle de production reste 3 600 secondes, aussi contrôlée par tests à horloge simulée. Qualification complète du nouveau SHA et livraison toujours à prouver à ce stade.


### Livraison vérifiée du 3 novembre 2026

Runtime : `541c7239341c1d31de82d11de251f7d663017abb` ; route privée `/fiscalibre/` dans Eco, porte sous connexion/inscription, aucun compte Eco requis. Session absolue d’une heure avec reverrouillage d’onglet ouvert, données locales conservées. Guide 5/13/30/100/7, référentiel 1 340 entrées, audit comptable/fiscal et CMUP. Qualification indépendante et livraison finale : 1 125 natifs, 116 Chromium, 54 WebKit. Backup privé D1/source restauré et relu, publication et vérification des assets du même SHA, puis recette en ligne 360/1 280 px. Trace de l’échec interne WebKit de la première tentative conservée ; aucun affaiblissement du contrôle. Voir `docs/release/evidence/FISCALIBRE_DELIVERY_2026-11-03.json`.

Harmony/CNPS préparés mais désactivés faute d’accès officiel ; aucune déclaration ou attestation officielle créée. Dossiers locaux au navigateur, pas de synchronisation serveur. Aucun schéma ni donnée financière Eco modifiés. `realMoneyEnabled=false ; FIELD_ACCEPTED=NOT_ACCEPTED`. Les états réels, règles sectorielles et formulaires DSF restent à qualifier avec les pièces. L’historique des états de préparation est conservé ci-dessous.

