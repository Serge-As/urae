## Résultat ultérieur : qualification refusée avant déploiement

La source a8e3f6dc a réussi les contrôles gouvernés et la répétition L05, mais les deux chaînes ont refusé le nouveau test de mémoire qui incluait le bootstrap normal de son rechargement dans la mesure des actions locales. Correction de la portée de mesure décrite dans CIR-COMMON-INNOVATIONS ; nouvelle source et nouvelles qualifications requises. Les preuves initiales ci-dessous sont historiques et ne signifient pas déploiement.

# Reprise — ensemble commun v36 publié, qualification à suivre

Le code est publié dans le dépôt privé URAE, sans forçage de branche :

- source : `a8e3f6dc3df32dd9d4f24775516f312466147c49` ;
- arbre exact : `779211d512c5ac09305f4bf80c54aac1036de4d5` ;
- parent de production : `dd1e7388829afe29cde453f1cdbefd6caedf98a8` ;
- livraison : https://github.com/Serge-As/urae/actions/runs/40081553662 ;
- qualification indépendante : https://github.com/Serge-As/urae/actions/runs/40081553661 ;
- état observé à 09:23 UTC : les deux runs en cours, aucun succès final ou déploiement encore déduit.

Périmètre regroupé : I01 mémoire locale contrôlée ; complément pédagogique I02, toujours partiel pour tous les moteurs financiers ; I16 orchestration Business Studio de quatre ressources et commandes canoniques Market. Réutilisation I03/I09/I12/I14. Aucun second stock ou moteur financier, migration, service payant ou redémarrage.

Preuves locales : compilation et 26 tests natifs ciblés réussis ; huit contrôles de gouvernance/architecture/source et index mémoire réussis ; les deux nouveaux parcours Chromium de moyens partagés passent, dont la réponse tardive et le parcours réel à deux comptes synthétiques. Les anciennes attentes fragiles de préparation L05 ont été remplacées par le groupe, la séance exacte et la vue intégrale. La dernière tentative locale a échoué avant démarrage du serveur Windows ; la preuve finale L05 et cockpit doit venir du run exact, avec toutes les autres suites acquises. Les échecs intermédiaires ne valent pas succès.

Source exacte privée locale : `../../../../Eco-System_1.5.2.36_Source_Verifiee_2026-10-24.zip`, 903 blobs vérifiés, 3267991 octets, SHA256 `02de5ab37f36689dc916e8d7a661cc21a9445d38294a89f6984ce475b6985115`. Ce ZIP correspond à l'arbre distant ; il ne prouve pas le déploiement.

Reprise efficace : réutiliser `../evidence/COMMON_RELEASE.json`, `COMMON_OVERLAY.json` et les reçus déjà présents. `common-release-evidence.py status` lit une seule fois les runs du SHA ; `diagnose` lit seulement les jobs et le journal en échec ; `finish` exige les deux succès et récupère seulement les petits reçus. Ne pas republier ou relancer sans diagnostic. Après succès : `verify-common-public-curl.py` puis `close-common-v36.py` et les contrôles de clôture ; relecture du document avant livraison.

Le transport d'envoi JSON volumineux a échoué avant toute mise à jour de référence. Le transport Git natif autorisé a réussi : authentification en mémoire seulement, fetch ciblé de la base une fois, arbre construit dans un index temporaire pour conserver les octets relus malgré les normalisations de fins de ligne Windows, push compressé non forcé. Le fichier de reprise local n'est pas le SHA runtime ; conserver la distinction des sources. Aucun contenu privé transmis à UTRAE.

`realMoneyEnabled=false`, `FIELD_ACCEPTED=NOT_ACCEPTED`. Production attestée v35 jusqu'à clôture des contrôles v36. Consommation exacte de crédits non mesurable.
