# Reprise Fiscalibre et hébergement indépendant

Sources relues : AGENTS, ARCHITECTURE_COMPACTE, Current Truth, CIR six lots, contribution rules, release contract ; mémoire Fiscalibre locale et compétence de livraison sur source exacte. HEAD distant 3bc26691 ; production v44 acquise et ses preuves conservées.

Le ZIP du fondateur est une version 2.5 plus riche que le démonstrateur 0.1 : conserver paie, académie, CMUP, scénarios, budget, navigation et lexique tout en corrigeant leurs assertions. Le catalogue n'est pas une certification et une écriture équilibrée ne prouve pas le bien-fondé de ses comptes ni la règle fiscale.

Autorisation directe : héberger Fiscalibre avec un lien sous connexion/inscription sans régression Eco. Choix technique : route protégée autonome, même dépôt et infrastructure existante, aucun accès aux sessions/D1 Eco. API Harmony non activée : raccordement préparé et transparent, aucun endpoint présumé ni faux succès. DGI/CNPS réels restent hors de la portée automatisée actuelle.

Prochaines preuves : CI complète de la candidate, Chromium/WebKit Linux, BIR source/D1 lecture seule restauré et relu privé, déploiement puis santé et empreintes publiques. Ne pas marquer déployé à partir du catalogue ni d'un test local. Aucune donnée d'appareil purgée. Argent réel désactivé, recette terrain non acceptée.


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
