# Livraison vérifiée — Cockpit et Eco IA — 15 octobre 2026

Production : https://eco-system.sergemimf.workers.dev/

- Version : **1.5.2.17-cockpit-continuity**.
- Source réellement servie : **af08c4bc26a5f7511b9092cc5a9bf6c0927a5766**.
- Worker : **bbfc5fe6-4f5f-4880-be70-487e133e6249**.
- Livraison : [38712364934 SUCCESS](https://github.com/Serge-As/urae/actions/runs/38712364934).
- PR intégrée : [94](https://github.com/Serge-As/urae/pull/94).

## Changements livrés

Accueil compact avec reprise des espaces récents et accès directs aux séances, fiches, Marketplace, Eco NOW, foras et capacités. Présentation commune, en-tête adaptable, navigation active lisible, affichage mobile et tableaux harmonisés. Les longues feuilles réutilisent les partitions canoniques 1/2/5 avec sélection directe de la partie et rappel du périmètre des totaux.

Eco IA dispose de son espace FR/EN, de suggestions et de guides locaux pour préparer une séance, vendre/acheter, partager une opportunité, examiner un risque et retrouver les services existants. Les actions restent explicites. Le texte fonctionne localement ; la reconnaissance vocale dépend du navigateur. La dictée de cellule exige arrêt, relecture puis report ; la validation financière canonique reste distincte. Le déplacement de page qui absorbait le clic Eco IA est corrigé : les styles voix sont externes et autorisés par la CSP, sans assouplissement de cette politique.

La mémoire ajoutée conserve seulement les destinations de navigation, par compte/groupe sur cet appareil : 8 espaces, fenêtre de 30 jours, désactivation et effacement. Aucun montant, texte dicté, document ou conversation. Ce n’est pas une mémoire intégrale interappareils ni une intelligence générative autonome. Les profils et consentements métier existants restent propriétaires.

## Preuves

Le workflow de livraison a qualifié le SHA publié : **728 tests applicatifs PASS, 13 Chromium PASS, 6 WebKit PASS**, types, compilation et gates de gouvernance réussis. Le candidat avait également réussi les workflows38711155533 et38711155506. Les captures desktop, mobile et Eco IA de l’application réelle utilisent un compte synthétique sur serveur isolé : [artifact11961640038](https://github.com/Serge-As/urae/actions/runs/38711155533/artifacts/11961640038).

Le contrôle secondaire38712364922 a échoué une première fois sur une lecture immédiate du défilement horizontal après rafraîchissement. Sa relance, sur le même SHA sans changement de test ni de délai, réussit :9 Chromium et6 WebKit. Cette intermittence reste documentée ; elle ne constitue ni une preuve de perte financière ni une garantie absolue de stabilité de chaque interaction. Le scénario correspondant a également réussi dans la livraison principale.

Avant publication : export D1, restauration SQLite avec intégrité `ok`, archivage privé R2 puis relecture/hash vérifiés. SHA256 de l’archive : `fe55fca87960c98f342ce9d246940d1976bd6830bd977f152ae1ce9f234c4619`. Ressources D1/R2 et clé de signature existantes conservées ; aucune migration ni réécriture de données.

Lecture indépendante du site public le15octobre à09:38UTC : `/health` HTTP200, SHA/version/build/cache exacts, titre1.5.2.17, éléments du cockpit dans le HTML, code contextuel Eco IA et style du micro fixe présents, cache PWA17, catalogue164capacités cohérent. Live et stockage R2 liés ; `realMoneyEnabled=false`. Reçu local : `qualified-20261015/production-receipt.json`.

## Limites conservées

FIELD_ACCEPTED=NOT_ACCEPTED. Les tests ne remplacent pas une recette exhaustive de chaque capacité avec les données et rôles réels. L’ancien navigateur authentifié a été arrêté à la demande de sa protection native ; aucune tentative de contournement ni utilisation d’identifiants. PR72HOLD conservée. Des styles injectés historiques hors voix restent signalés par la CSP dans les logs : aucune promesse de console entièrement vierge. Ne pas effacer le stockage du navigateur pour mettre à jour ; recharger normalement et vérifier le badge1.5.2.17.
