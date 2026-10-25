## Correction de qualification OCR — 25 octobre 2026

La source candidate `6efd34d584846281f5d2b6b49547d87bcfe9452a` a été arrêtée avant livraison : 4 des 5 nouveaux parcours Chromium passent, mais l'API OCR 7 sélectionne `relaxedsimd` absent du cœur 6.1.2. Le succès des empreintes de fichiers ne prouvait pas la compatibilité de ces deux versions. La production v38 n'est pas remplacée par ce candidat.

Correction bornée : API et worker Tesseract.js 6.0.1, cœur 6.1.2 conforme à sa dépendance officielle `^6.0.0`, quatre variantes SIMD/LSTM fournies, modèles français/anglais et PDF.js conservés. Les empreintes verrouillées sont renouvelées uniquement pour les trois petits fichiers de l'API. Le build refuse désormais une incohérence API/cœur ou une variante déclarée absente. Aucun repli vers un CDN à l'exécution ni désactivation des assertions OCR. Sources : https://github.com/naptha/tesseract.js/blob/v6.0.1/package.json et https://github.com/naptha/tesseract.js/blob/v6.0.1/src/worker-script/browser/getCore.js .

Vérifier le vrai parcours OCR jusqu'à la relecture humaine avant publication corrective, puis refaire toutes les qualifications obligatoires sur le SHA corrigé. La suite native locale a 1051 réussites et un refus Windows de renommage temporaire Care ; le fichier Care ciblé repasse 30/30 sans modification métier. La chaîne native/gouvernance distante du premier candidat passe ; ses preuves ne valent pas qualification intégrale du futur SHA. FIELD_ACCEPTED=NOT_ACCEPTED ; realMoneyEnabled=false.

# Reprise — finalisation consolidée

Base : v38 / `7eb2d1e499e3f0176da553999d68ca9c16bd8489`, livraison 40121419469 et qualification indépendante 40121419255, 1040 natifs, 73 Chromium, 11 WebKit, 52 empreintes. Lire le CIR voisin avant modification ; ne pas refaire l'audit général ni republier cette base.

Le fondateur demande une livraison intégrée de la fin du programme et non une succession de petits lots. Fermer les critères encore incomplets (I16 calendrier, A15 public consenti, A19 programme, A17/A24/A25 rappels, A26 extraction/relecture), vérifier tous les critères A/I et conserver les décisions T/M gratuites. Les limites externes et la recette terrain ne peuvent pas être changées en succès par déclaration.

Propriétaires : Market pour disponibilités ; Discovery pour visibilité ; BusinessStudio pour plans/programmes ; Notification pour rappels ; Kernel.Cases pour Care ; GroupDocuments pour texte relu. Aucun moteur financier parallèle ni écriture réelle d'essai. Contrôler les droits actuels et les réponses tardives de contexte.

Confidentialité : URAE privé ; UTRAE seulement outils génériques publics revus et synthétiques. Sources et données réelles interdites dans UTRAE. Preuves exactes réutilisées, lectures/publications regroupées, aucune boucle de polling GitHub. Aucun redémarrage autorisé.

ÉTAT DU PROJET APRÈS ÉTAPE : finalisation locale en cours, pas de v39 publiée. `realMoneyEnabled=false` ; `FIELD_ACCEPTED=NOT_ACCEPTED`. Consommation exacte de crédits non mesurable.

Le contrôle distant a aussi relevé une collision de structure dans l'Inbox : la nouvelle section de rappels était imbriquée dans « Qui attend quoi ? », ajoutant un second titre au périmètre historique. Les deux sections sont maintenant sœurs, chacune vidée sur changement de contexte et hors ligne. Les assertions historiques sont conservées. Aucun reçu de lecture ni état métier modifié.

Assemblage local : le worker amont non modifié est placé dans le dossier des quatre variantes du cœur. Le chargeur WASM externe résout son binaire depuis ce dossier, sans chercher à côté d’un autre worker ni accéder à un CDN. La source intermédiaire `62c14c88ed36cedb97058ce0c2f8d2f92ccf31de` est remplacée avant livraison par cet assemblage cohérent. Les fichiers binaires restent inchangés et leurs empreintes conservées.

## Qualification au repos et poursuite autorisée — 25 octobre 2026

La source `925f142e10abd2c5e056536d6f55fca6cb262211` passe la compilation, les contrôles de gouvernance, la suite native Linux et les parcours historiques Chromium, ainsi que le vrai parcours OCR local. Le nouveau test de rappel comptait une requête encore issue de l'ouverture de l'Inbox : son observation commençait avant la fin du chargement. La mesure commence désormais après `networkidle`, puis conserve strictement zéro requête rappel/plan pendant la période de repos ; une éventuelle requête est rapportée avec sa méthode et son URL. Aucune assertion métier supprimée, aucun temporisateur produit ajouté. Les cinq nouveaux parcours passent en tête des suites Chromium et WebKit, sans retirer les parcours antérieurs, pour arrêter plus tôt une livraison défectueuse.

Le fondateur a rendu URAE public puis demandé explicitement de poursuivre : « Tu vas seulement continuer, on verra le problème de confidentialité plutard. Priorité au travail ». Cette décision autorise la poursuite de cette livraison dans URAE tel qu'il est configuré ; elle ne vaut ni transfert vers UTRAE ni publication de secrets ou de données personnelles/financières réelles. Les exports D1 restent uniquement dans le stockage R2 privé existant ; seuls les reçus sans lignes de données sont conservés en artefacts CI. La politique durable de visibilité reste à réexaminer séparément. Aucun redémarrage de l'ordinateur.

Cette correction reste candidate tant que les deux chaînes obligatoires du SHA corrigé, le déploiement effectif et les empreintes publiques ne sont pas vérifiés. `FIELD_ACCEPTED=NOT_ACCEPTED`, `realMoneyEnabled=false`.

## Correction d’accessibilité de la relecture — 25 octobre 2026

La source `fe7d04c39fd599ca560d7f368830fa21f9bfd25d` passe 1052 tests natifs et les 78 parcours Chromium, y compris la mesure de zéro requête au repos. WebKit passe quatre des cinq nouveaux parcours, dont l’extraction OCR réelle, mais arrête le clic sur la confirmation du contenu : le défilement animé et l’en-tête fixe interceptent le pointeur. Le déploiement est resté arrêté avant toute mutation de production.

Correction visuelle limitée à Documents : défilement direct sur cette vue, marges de défilement adaptées à la hauteur réelle de l’en-tête et de la navigation, cases de relecture séparées dans des labels flexibles d’au moins 44 pixels. Les deux confirmations, leurs événements natifs et les assertions restent inchangés ; aucun clic forcé ou contournement de l’approbation humaine. Qualification complète exigée sur la source corrigée.
