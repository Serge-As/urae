## Finalisation intégrée vérifiée v40 — 25 octobre 2026

Production **1.5.2.40-document-recovery**, source `67095d43701c3fcfb51461f8b5e7ac0ca3d4e71f`, arbre `9809d06c3658150334956a8cbb25b2a7df5f55d6`, Worker `b147a132-2ae3-46bc-bae1-92287792f028`. Livraison et qualification indépendante : [40222475194 SUCCESS](https://github.com/Serge-As/urae/actions/runs/40222475194) ; [40222475251 SUCCESS](https://github.com/Serge-As/urae/actions/runs/40222475251). **1058/1058 tests natifs, 81/81 Chromium, 19/19 WebKit**, zéro échec et zéro ignoré, même source. Santé et catalogue de 164 capacités contrôlés ; 76 empreintes de fichiers publics vérifiées lors de la livraison, dont 17 moteurs verrouillés, et 13 fichiers critiques relus indépendamment. OCR réel FR/EN après déploiement : [preuve indépendante](https://github.com/Serge-As/urae/actions/runs/40224028371), zéro fournisseur externe et zéro écriture distante.

Les 28 périmètres et les 48 propositions fonctionnelles A01–A28 / I01–I20 du programme consolidé restent livrés dans leurs limites documentées. Les 24 outils et 20 modèles sont des références de réalisation, pas 44 installations manquantes. Les limites historiques de quatre entrées du registre ont été rapprochées des compléments effectivement livrés en v38/v39, avec conservation du texte antérieur. La matrice d'acceptation conserve les critères et preuves ; la vision future et les résultats économiques réels ne sont pas déclarés achevés.

**Dernières corrections** : l'extraction documentaire locale peut être arrêtée dès le chargement du moteur. Un échec de langue ou de worker libère le formulaire, propose une nouvelle tentative et la transcription manuelle. La reconnaissance s'arrête après 60 secondes sans progrès ou 180 secondes maximum par pièce/page. L'hôte jetable possède ses workers descendants. Les réponses tardives d'une extraction arrêtée n'alimentent pas la relecture suivante. Le changement FR/EN conserve le fichier dans l'entrée réellement liée, l'écran actif, le titre et les corrections de relecture ; les confirmations humaines restent nécessaires. Les tests navigateur injectent un vrai échec réseau et un chargement interrompu, puis réussissent une relance et la relecture.

**Non-régression** : mêmes propriétaires métier ; Ledger/D1, droits, six politiques de prêt, Live, outbox, reprise F5 et rejeux synthétiques conservés. Pas de migration, purge navigateur, réécriture des données, fournisseur payant ou redémarrage. Les pièces documentaires ne sont pas envoyées à un OCR externe. `realMoneyEnabled=false`, `FIELD_ACCEPTED=NOT_ACCEPTED` ; aucun compte réel Delor ni écriture financière réelle de recette.

**Transparence de qualification** : la première exécution indépendante WebKit a conservé la file fictive mais n'a pas déclenché le résultat du rejeu après F5. La livraison avait passé les mêmes 19 contrôles WebKit sur cette source. Le contexte d'échec et le journal sont conservés ; une seule relance du job navigateur a été effectuée, sans modifier le code ni les assertions. Les chiffres ci-dessus concernent la qualification finale ; ils n'effacent pas cette première observation. La capture ne suffit pas à attribuer une cause certaine à ce non-déclenchement. Toute réapparition doit rouvrir le diagnostic, pas déclencher des relances en boucle.

**Reprise** : D1 exporté en lecture seule et restauré sur copie vierge, 50 tables dont 48 attendues, intégrité et clés étrangères valides. Archive R2 privée relue SHA256 `87bcd7888b604e5947588ffaa8065051f6c8e2d0aec8bcd00566970cea09d80a`. Portée D1_AND_EXACT_SOURCE_ONLY : objets R2, outbox/données d'appareil et fournisseurs externes exclus ; aucune restauration de production. Source exacte : 952 fichiers Git, `Eco-System_1.5.2.40_Source_Verifiee_67095d43_2026-10-25.zip`, SHA256 `351eec2e26fc0729520d2a87d6256bb7dc2767d0c6c2f08515ae20abc2bad0d9`. Le commit de clôture documentaire suivant ne change pas le runtime déployé.

**ÉTAT DU PROJET APRÈS ÉTAPE** : programme consolidé publié et automatiquement qualifié dans ses limites ; aucun reliquat de code identifié dans ce programme. Les autorisations de partenaires, résultats économiques et acceptation sur comptes réels demeurent des validations distinctes. Réutiliser ces reçus du même SHA ; ne pas rouvrir les lots ou relancer un audit sans défaut nouveau. La consommation exacte de crédits n'est pas mesurable.

## Historique conservé

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
