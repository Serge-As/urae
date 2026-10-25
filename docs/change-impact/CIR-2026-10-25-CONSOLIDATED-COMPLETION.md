## Correction de qualification OCR — 25 octobre 2026

La source candidate `6efd34d584846281f5d2b6b49547d87bcfe9452a` a été arrêtée avant livraison : 4 des 5 nouveaux parcours Chromium passent, mais l'API OCR 7 sélectionne `relaxedsimd` absent du cœur 6.1.2. Le succès des empreintes de fichiers ne prouvait pas la compatibilité de ces deux versions. La production v38 n'est pas remplacée par ce candidat.

Correction bornée : API et worker Tesseract.js 6.0.1, cœur 6.1.2 conforme à sa dépendance officielle `^6.0.0`, quatre variantes SIMD/LSTM fournies, modèles français/anglais et PDF.js conservés. Les empreintes verrouillées sont renouvelées uniquement pour les trois petits fichiers de l'API. Le build refuse désormais une incohérence API/cœur ou une variante déclarée absente. Aucun repli vers un CDN à l'exécution ni désactivation des assertions OCR. Sources : https://github.com/naptha/tesseract.js/blob/v6.0.1/package.json et https://github.com/naptha/tesseract.js/blob/v6.0.1/src/worker-script/browser/getCore.js .

Vérifier le vrai parcours OCR jusqu'à la relecture humaine avant publication corrective, puis refaire toutes les qualifications obligatoires sur le SHA corrigé. La suite native locale a 1051 réussites et un refus Windows de renommage temporaire Care ; le fichier Care ciblé repasse 30/30 sans modification métier. La chaîne native/gouvernance distante du premier candidat passe ; ses preuves ne valent pas qualification intégrale du futur SHA. FIELD_ACCEPTED=NOT_ACCEPTED ; realMoneyEnabled=false.

# CIR — finalisation consolidée du programme

Autorisation : demandes répétées du fondateur de terminer l'ensemble du programme approuvé, en regroupant les travaux et sans nouvelle livraison partielle volontaire. Base distante vérifiée une fois : `7eb2d1e499e3f0176da553999d68ca9c16bd8489`, production v38. Les preuves immuables de cette base sont réutilisées.

## Périmètre et propriétaires

- I16 / A11 : calendrier des moyens sous MarketService, réservation explicite du propriétaire, capacité et concurrence contrôlées par la révision du stock canonique. BusinessStudio ne conserve que des références. Les offres existantes restent inchangées ; le calendrier est un choix nouveau, sans encaissement.
- A15 : champs publics consentis sous DiscoveryService ; projection relue à la source, aperçu identique, retrait effectif à la prochaine lecture. Les audiences privées, groupe et personnes choisies sont conservées.
- A19 / I05 : programme collectif sous BusinessStudio avec invitation, engagement volontaire, sortie, bilan et preuves séparées. Aucun financement automatique ou accès du coordinateur aux plans privés non partagés.
- A17 / A24 / A25 : rappels volontaires chez NotificationService, cibles revalidées à la lecture de l'Inbox, sans polling ni promesse de livraison externe. Le bilan Care réutilise seulement les dossiers autorisés.
- A26 : extraction locale facultative, prévisualisation des pièces et relecture humaine obligatoire chez GroupDocumentService. Bibliothèques gratuites servies localement, chargement à la demande, aucune image privée envoyée à un fournisseur OCR.
- Tous les critères A01–A28 et I01–I20 : matrice de preuves et scénarios de non-régression conservés ; les outils T et modèles M restent des décisions de réutilisation, pas des installations imposées.

## Risques et maîtrise

Réservation : concurrence, reprises et chevauchements ; CAS canonique, intervalles semi-ouverts, clés stables, annulation explicite et tests Memory/SQLite. Aucun changement du Ledger, des prêts, du Live ou de l'outbox financière. Les offres activées en calendrier ne peuvent être vendues simultanément comme du stock consommable.

Partage : ancien lien, retrait de mandat, donnée privée dans une copie ; pointeur de découverte sans contenu, relecture du propriétaire, liste blanche des champs et absence de cache partagé. Une copie déjà téléchargée n'est pas rétractable à distance.

Programmes et rappels : invitations indues, lecture d'un plan privé, cible périmée ; membres actuels, acceptation indépendante, contenu partagé explicitement, nouvelle autorisation à chaque lecture, absence de clôture métier déduite d'un clic.

OCR : poids initial, résultat faux, image énorme ou hostile ; chargement seulement au clic, limites de taille/pixels, formats raster contrôlés, traitement isolé et annulable, aucun HTML exécuté, nombres et contenu confirmés avant enregistrement. L'OCR ne valide ni règle ni écriture financière.

## Qualification et réversibilité

Tests ciblés de chaque propriétaire, compilation complète, suites natives et Chromium/WebKit, gardes architecture/gouvernance/constitution/mémoire/propositions. Les répétitions prêts/Live/outbox et incidents synthétiques restent obligatoires sur la même source finale. BIR+ en lecture seule, restauration sur copie, publication privée groupée, contrôle du runtime et empreintes publiques. La qualification automatique et la recette terrain restent distinctes ; `FIELD_ACCEPTED=NOT_ACCEPTED`, `realMoneyEnabled=false`.

Aucune migration destructive, purge navigateur, nouvelle base canonique, dépendance payante, copie publique du produit ou redémarrage. Retour à l'artefact précédent possible sans supprimer les nouveaux enregistrements ; conserver les créneaux et engagements jusqu'à leur annulation autorisée. Les versions antérieures ignorent les nouveaux types et ne doivent pas les modifier par une route générique.

État initial : travail local autorisé ; aucune v39 déployée revendiquée. La clôture exige les preuves effectives de la source intégrée.

Le contrôle distant a aussi relevé une collision de structure dans l'Inbox : la nouvelle section de rappels était imbriquée dans « Qui attend quoi ? », ajoutant un second titre au périmètre historique. Les deux sections sont maintenant sœurs, chacune vidée sur changement de contexte et hors ligne. Les assertions historiques sont conservées. Aucun reçu de lecture ni état métier modifié.
