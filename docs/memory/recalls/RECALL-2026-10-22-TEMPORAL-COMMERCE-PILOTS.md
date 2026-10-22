# Recall — L13/L20, travail groupé

Base source publique v31 `98f5a71d9221368ab96a417898887d890d36ad69` vérifiée : 941 natifs, 48 Chromium, 6 WebKit, 39 empreintes publiques. Clôture locale `9a90f827976ccfdd06168bbbb3d83c0a908b0fc8` et paquet de reprise disponibles. Treize lots ont un périmètre publié, quinze restent à réaliser.

Réaliser ensemble les disponibilités temporaires/Harvest et les pilotes internes mesurables, propriétaires MarketService et AdManagerService. Lire le CIR correspondant avant modification. Aucun autre inventaire, rail financier, service externe ou dépendance payante. Ne pas déclarer tout L13/L20 livré à partir de boutons ou de tests isolés ; conserver les limites et exceptions non prouvées.

## Ensemble L13 / L20 / I06 / I08 — candidat commun du 22 octobre 2026

Production acquise : **1.5.2.31-business-value-network**, source `98f5a71d9221368ab96a417898887d890d36ad69`, livraison39798502924 SUCCESS ; qualification séparée39798502810 SUCCESS, 941 natifs/48 Chromium/6 WebKit, 39 empreintes publiques. La candidate **1.5.2.32-temporal-commerce-pilots** reste non publiée tant que ses contrôles sur la source exacte, sa sauvegarde et sa vérification publique ne sont pas établis.

Périmètre commun : disponibilités NOW/Deals/Harvest et créneaux de service sur le stock canonique existant ; confirmation du point/horaires/zone/échéance ; réservation réutilisant MarketService ; pertes et transformation dans la même unité avec insertion atomique du produit obtenu, non publié par défaut. Réservation et transformation concurrentes ne consomment pas deux fois la dernière quantité libre. Exemple qualifié :100kg dont60réservés,10perdus,20transformés en16 ; restent70kg physiques,10libres,60réservés,14perdus/écartés,16kg de produit obtenu distinct. Aucune écriture Ledger.

AdManager : brouillon gratuit, modération et activation explicites, maximum100diffusions et10par personne sur7jours, même campagne et CAS canonique. Une diffusion servie, une vue confirmée par le navigateur, une ouverture, une intention de contact et une commande reliée sont cinq faits distincts. Compte propriétaire/test exclu ; consentement personnel ET collectif relu avant chaque mesure, OFF prioritaire. Jusqu'à20commandes actuellement autorisées sont relues par bilan, retours déduits ; unités distinctes non additionnées ; valeur contractuelle séparée du paiement inconnu. Aucun débit, facture, revenu ou message envoyé inféré.

I08 : prix demandés sur les seules annonces personnelles publiques du tenant, comparables par catégorie/qualité/zone/unité/devise et confirmation récente ; au moins cinq vendeurs distincts, médiane par vendeur puis entre vendeurs. Aucun prix individuel, identité ou échantillon insuffisant exposé. Ce n'est ni le prix des ventes constatées ni une garantie de marché.

Accès prévu : **Eco NOW → Offres du moment**, **AdManager → Pilotes internes gratuits**. FR/EN,360px, chargements à l'ouverture ou à la demande ; aucun polling ajouté, champs conservés après erreur et panneaux privés retirés à déconnexion/changement de compte. Propriétaires MarketService/AdManagerService ; Ledger/D1 et les parcours financiers acquis conservés. Pas de dépendance, migration, service payant, carte ou transport ajouté.

Qualification locale actuelle : compilation TypeScript complète,64/64tests ciblés dont28nouveaux sur mémoire et SQLite/D1, rollback réel en cas de collision de sortie, absence de mélange kg/pièces et routes HTTP/consentement. Les trois nouveaux scénarios navigateur restent à consigner avant publication. Qualification complète prévue969natifs/51Chromium/6WebKit, nombres à relire dans les preuves ; une cible n'est pas un résultat.

Limites :100stocks récents ; annuaire initial du groupe/boutique autorisés, pas un réseau national cartographique ; points, qualité et pertes déclarés, non certifiés. Transformations physiques enkg/g sans conversion de recette ni gain de masse. Pilotes internes seulement,500événements/20commandes par campagne ; attribution volontaire sur7jours et non exclusive entre pilotes, non vérification d'une personne humaine. Les lectures sont bornées en appels ; leur coût en lignes dépend de l'historique. Les prix ne couvrent pas les groupes privés et ne permettent pas de prévoir les revenus.

BIR+ / **ÉTAT DU PROJET APRÈS ÉTAPE** :13lots ont un périmètre publié,15restent à qualifier ; L13/L20 et I06/I08 sont en cours, pas réputés entièrement livrés. `realMoneyEnabled=false`, `FIELD_ACCEPTED=NOT_ACCEPTED`. Crédits exacts non mesurables. Conserver l'historique et les preuves v31 ; prochaine action : qualification puis superposition bornée au HEAD distant avec contrôle du SHA.


## Correctif de cohérence et preuve de visibilité — 22 octobre

La source2cda05f0 a passé969/969tests natifs. Les nouveaux formulaires ont reçu une sélection initiale correcte et le raccord de langue canonique. Le scénario publicitaire doit faire défiler la création dans le viewport avant de demander une vue confirmée ; aucune impression hors écran n'est fabriquée. Le correctif d1abb3a4 met aussi à indisponible les vitrines Boutique lorsque le point de retrait temporel est fermé, conserve la quantité physique et ajoute l'assertion acquise sur mémoire/SQLite.

La qualification d1abb3a4 a été bloquée par le contrôle MEMORY BEFORE CODE parce que ce correctif substantiel ne modifiait pas encore le présent Recall. La trace est complétée ; aucun contrôle n'est supprimé, relaxé ni réputé passé. La source et les scénarios applicatifs restent inchangés dans ce complément documentaire. Relancer les deux workflows sur le nouveau SHA exact avec sauvegarde et vérification publique. Production acquise v31, FIELD_ACCEPTED=NOT_ACCEPTED ; aucun redémarrage PC exécuté ni autorisé sans demande explicite.
