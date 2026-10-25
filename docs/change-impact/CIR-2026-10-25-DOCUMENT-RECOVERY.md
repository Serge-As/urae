# CIR — Reprise documentaire et clôture du programme

Date : 25 octobre 2026. Base qualifiée : v39, source `4439791823cddc857ad898bfed8e702017b9f1d1` ; clôture documentaire distante `0376f5b6b2e0881157076f49209c04986a3ae96d`.

Autorisation : poursuite et finalisation intégrée demandées par le fondateur. Les 28 périmètres et 48 propositions fonctionnelles restent livrés dans leurs limites documentées. Les références d'outils/modèles ne commandent pas leur installation. Cette intervention ferme des défauts constatés, sans réouvrir les lots.

Publication : conserver la décision explicite de reprise du fondateur après son changement de visibilité URAE (« Tu vas seulement continuer, on verra le problème de confidentialité plutard. Priorité au travail »), déjà appliquée à la v39. Cette livraison ne change pas la visibilité du dépôt et ne crée aucun miroir UTRAE. La règle générale de séparation reste documentée ; secrets et données réelles brutes demeurent exclus de Git et des artefacts publics. Les sauvegardes D1 restent dans R2 privé, conformément à la proposition Cloudflare acceptée.

## Incidents et résultat attendu

1. Tesseract 6 peut appeler `errorHandler` après un échec de langue sans terminer sa promesse d'initialisation. L'interface pouvait attendre indéfiniment. Le poste Windows a effectivement rencontré un échec de téléchargement. L'initialisation et la reconnaissance doivent être annulables et bornées, avec voie manuelle et nouvelle tentative.
2. La reconstruction FR/EN du formulaire remplaçait l'entrée neuve par l'ancienne après avoir lié le nouvel extracteur. Le fichier était visible mais le contrôleur ne lisait plus la bonne entrée. Conserver la FileList dans l'entrée effectivement liée et préserver le titre et les corrections.

## Propriétaire, portée, effets indirects

GroupDocuments reste propriétaire du texte enregistré et de la relecture humaine. Deux petits modules navigateur possèdent un hôte OCR jetable, lui-même propriétaire du worker Tesseract ; l'arrêt de l'hôte termine ses descendants. Une seule reconnaissance active ; erreurs bornées et délais de 60 secondes sans progrès ou 180 secondes maximum par reconnaissance. Les moteurs FR/EN existants, leurs versions et empreintes restent conservés et chargés au clic.

Effets indirects à vérifier : compatibilité des workers imbriqués sur Chromium et WebKit ; CSP et résolution de chemins en production ; lecture des images Blob et des PDF rendus ; nettoyage lors d'annulation, erreur, changement de compte/groupe/langue ; sélection de fichier et relecture après FR/EN. Un appareil très lent peut atteindre la limite : la pièce reste sélectionnée, la saisie manuelle et la nouvelle tentative restent disponibles. Aucun échec ne vaut validation du texte.

Hors mutation : Ledger/D1, prêts, Live, outbox, règles, droits, rôles, paiements, données existantes. Aucun changement de schéma ni purge. Pas de fournisseur OCR externe ou nouveau modèle téléchargé en fond. `realMoneyEnabled=false`, `FIELD_ACCEPTED=NOT_ACCEPTED`.

## Vérification et retour

Tests de protocole : erreur de chargement, erreur native, annulation avant initialisation, résultat tardif, concurrence et deux limites de temps. Navigateurs : vraie extraction FR/EN préexistante, échec réseau injecté avec relecture manuelle, annulation puis relance, sélection conservée après langue. Qualification complète des moteurs prêts/Live/outbox sur la même source et vérification de publication. Les reçus antérieurs restent historiques ; aucune qualification v40 acquise par ce CIR.

Retour : rétablir le runtime v39 exact en cas de régression, sans restauration ou effacement des données ; conserver les sauvegardes privées vérifiées. Source et preuves de la nouvelle livraison seront identifiées après qualification effective.
