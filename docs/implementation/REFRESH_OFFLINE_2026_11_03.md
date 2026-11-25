# Reprise en ligne et hors ligne — v46

## Comportement

Une fenêtre conserve son identifiant valide de sessionStorage quand window.name est effacé. Web Locks ou BroadcastChannel conserve le contrôle de possession et sépare les onglets dupliqués avant lecture de compte ou envoi réseau. Aucun secours global entre comptes.

Au retour sur une fenêtre connue, ConnectedApplication relit sa session locale et ses projections autorisées. Pendant cette restauration, les GET utilisent leurs copies dans IndexedDB et une donnée absente reste indisponible ; aucun POST n'est fabriqué. L'Outbox est restaurée par le bootstrap existant. La vérification d'autorisation serveur suit en arrière-plan. Un compte local non finalisé reste utilisable localement. Un quota D1 connu reste respecté.

Les propriétaires des panneaux secondaires sont conservés et chargés selon la vue utile. Les montants, auteurs, clés d'idempotence et conflits de l'Outbox ne sont ni fusionnés ni réécrits. Les valeurs de travail de cette file durable sont chargées avant la création des cellules membres/séances, pour éviter l'affichage transitoire d'un ancien zéro. Le retour réseau regroupe les signaux sur 400 ms et réutilise la reprise sérialisée existante. Le rafraîchissement structurel attend la sortie du champ en cours ; les projections financières peuvent se mettre à jour sans effacer le brouillon.

Le délai HTTP couvre les en-têtes et le corps JSON. Une réponse interrompue ne remplace pas une copie valide par un objet vide. Une réponse serveur encore incomplète ne vaut pas confirmation d'écriture.

L'installation du service worker démarre sans attendre l'authentification ou les panneaux. Chaque ressource échouée reçoit au plus trois tentatives. Un échec conserve les téléchargements candidats, revérifiés par SHA256 au prochain essai. Le marqueur de disponibilité et l'activation exigent toujours la totalité du graphe statique. Aucun rechargement forcé d'un document en cours d'édition. Une reconnexion déclenche aussi une vérification du service worker, regroupée avec la reprise.

## Limites et garde-fous

Pas de promesse de 80 ms, de deux requêtes universelles ou de disponibilité d'une donnée jamais chargée. Les modules externes et les capacités sans politique offline qualifiée restent identifiés comme tels. L'effacement volontaire du navigateur ou une éviction imposée par le système ne peut être transformé en persistance garantie ; storage.persist reste demandé lorsqu'il est disponible.

Fiscalibre conserve sa route et son cookie séparés, le document privé exclu du cache PWA, la session absolue d'une heure et ses dossiers locaux. API DGI/CNPS désactivées. Aucun schéma D1, montant financier réel, rôle, consentement ou historique modifié.

## Recette et livraison

Les tests acquis restent dans les workflows ; trois scénarios de reprise sont ajoutés à Chromium et WebKit, ainsi que treize tests natifs de comportement. Les quatre contrôles statiques historiques concernés suivent les nouveaux points d'entrée sans retirer leurs garanties.

État de préparation : 1 138 tests natifs locaux réussis avec le dernier ajustement d'ordre de peinture. Le premier passage natif complet a identifié deux assertions statiques anciennes, corrigées et revérifiées avec leurs suites. Les premiers parcours Windows ont conservé les traces du problème de préparation d'empreintes et d'une URL incorrecte dans le nouveau test ; aucun affaiblissement d'autorisation ou de contrôle financier.

La première source distante `6ef04d61980ae8955fb98f3993b59eb5ab9d11a3` a passé le job natif gouverné [41645484193](https://github.com/Serge-As/urae/actions/runs/41645484193). Son nouveau parcours WebKit a rencontré le défaut d'émulation hors ligne déjà documenté par la recette souveraine acquise : navigation du service worker rejetée par Playwright/WebKit. La recette utilise désormais une coupure réelle d'un relais HTTP/WebSocket limité à `127.0.0.1:4173`, sur les deux navigateurs, avec les mêmes assertions métier. Les tests acquis d'émulation restent présents. La mesure de repos commence après le rétablissement Live ; la propagation et les accusés de réception restent comptés pendant la reprise.

La livraison [41645484300](https://github.com/Serge-As/urae/actions/runs/41645484300) s'est arrêtée au format du marqueur, avant toute mutation de production. Les trois lignes exactes attendues sont rétablies. Les échecs sont conservés comme traces négatives. Les résultats finaux du même SHA, le BIR privé et la production doivent encore être consignés après exécution.

Sources techniques : [cycle de vie PWA](https://developer.chrome.com/docs/workbox/service-worker-lifecycle), [signal navigator.onLine](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/onLine), [waitUntil](https://developer.mozilla.org/en-US/docs/Web/API/ExtendableEvent/waitUntil).

realMoneyEnabled=false ; FIELD_ACCEPTED=NOT_ACCEPTED. Crédits exacts non mesurables.
