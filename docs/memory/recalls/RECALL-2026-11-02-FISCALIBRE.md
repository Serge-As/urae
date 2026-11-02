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
