# Innovations : réalisation et limites

Le registre JSON voisin conserve les identifiants et titres des propositions du document accepté. Un modèle étudié n'est pas un produit installé et un lot publié ne signifie pas que toutes les idées de tous les documents sont finies. Aucune dépense ni dépendance nouvelle n'est nécessaire pour ce jalon.

| Amélioration | Propriétaire réutilisé | Preuve / état |
|---|---|---|
| A10 : dossier de la commande au retour | MarketService, transactions D1, Evidence | Publié en1.5.2.26 ; tests market-orders-lot10 |
| Vendeur personnel, collaborateurs actuels, réception acheteur | Même MarketService, scopes de boutique ; aucune caisse collective | Publié et vérifié1.5.2.27 ; tests market-personal-shops + parcours deux comptes |
| SAV référencé, sans copie de commande | Kernel.Cases | Publié et vérifié1.5.2.27 ; traitement transversal approfondi prévu L25 |
| M02 : continuité du dossier commercial | Liens devis → commande → preuves → dossier | Principe appliqué ; aucun ERP Odoo importé |
| M06 : échanges locaux et retrait convenu | Conditions de remise, vitrine publique consentie | Premier parcours appliqué ; aucun transporteur payant |
| M07 : séparer catalogue, stock, commande, règlement | Projections publiques, stock atomique, preuves, paiement non inféré | Principe appliqué ; Medusa non importé |
| Réduction des requêtes sans toucher aux acquis financiers | Mesure L28, lectures explicites, aucun polling commercial ajouté | L28 publié1.5.2.23 ; silence du nouveau panneau vérifié par navigateur |
| Cockpit et continuité volontaire | L02 et propriétaires existants | Publié1.5.2.24 ; preuve de livraison L02 |
| Eco IA FR/EN et mémoire volontaire | L23, outils locaux sans exécution autonome | Publié1.5.2.25 ; preuve de livraison L23 |

Les lots1,5,28,2,23 ont des preuves dans docs/release. Le parcours L10 programmé est clos avec limites documentées ; le programme continue L24 puisL25. Les autres propositions demeurent recensées, sans statut opérationnel inventé. La couverture exhaustive de chaque détail sera rattachée à son lot et à des scénarios réels, pas à une simple présence dans le registre des modules.

Preuve de publication personnelle : `docs/release/evidence/LOT10-PERSONAL-COMMERCE-PUBLIC-2026-10-21.json`. Les devis et l’approvisionnement étendus à chaque profil personnel restent des variantes futures ; le socle commande/réception/SAV référencé est livré. A10 passe DELIVERED_WITH_DOCUMENTED_LIMITS, les autres propositions ne sont pas promues automatiquement.

## L24 — réalisation locale, publication en attente

A24 réutilise NotificationService : événement/révision, destinataire actuel, lecture immuable, tentatives et résultat métier séparés, préférences/silence/permission et lien privé. I19 réutilise Kernel.Inbox pour les obligations et dossiers ouverts, dates présentes et partie attendue explicitement inconnue si non fournie. Modèle M18 de centralisation des alertes adapté au propriétaire existant ; aucun Nextcloud importé.

868 natifs et3 nouveaux Chromium passent sans ignoré. Reçu : `docs/release/evidence/LOT24-NOTIFICATION-INBOX-LOCAL-2026-10-21.json`. Statut local uniquement, aucune publication1.5.2.28 ni preuve fournisseur inventée. Les autres propositions ne changent pas de statut par association. Les limites de coût D1, du SAV L25 et des fournisseurs restent dans le dossier de livraison.

Qualification globale partielle : Chromium 8 réussis / 2 échoués ; WebKit 4 réussis / 2 échoués. Publication bloquée ; causes et comparatif de base dans le reçu. A24 et I19 sont implémentés localement, leur livraison reste ouverte.

## L24 — centre d’alertes, Inbox et liens privés publiés et vérifiés — 21 octobre 2026

Production **1.5.2.28-notification-inbox**, source `0266e1b895d4a91a4bc57d189608aae360393c24`, build `eco-system-1.5.2.28-20261021-notification-inbox`, cache `eco-system-v15228-notification-inbox-20261021`, Worker `cdbd805c-cce8-4057-acb5-8b2238842655`. Livraison [39617145115 SUCCESS](https://github.com/Serge-As/urae/actions/runs/39617145115) et qualification indépendante [39617145012 SUCCESS](https://github.com/Serge-As/urae/actions/runs/39617145012), même source. **868 tests natifs, 36 Chromium et 6 WebKit** réussis à la livraison, sans ignoré. La qualification séparée a réellement exécuté 32 Chromium principaux et 2 à deux comptes, soit **34 Chromium**, plus 6 WebKit ; le nombre prévisionnel de 37 était erroné et ne constitue pas une preuve. **31 empreintes publiques** concordent avec la compilation GitHub puis la relecture indépendante du 2026-10-21T14:44:51.8540688Z. Catalogue : 164 capacités déclarées, sans déduire leur recette exhaustive de ce nombre. Preuve : `docs/release/evidence/LOT24-NOTIFICATION-INBOX-PUBLIC-2026-10-21.json`.

Livré : centre d’alertes multigroupes autorisé, filtres Toutes/Non lues/Urgentes, avis immuables par événement et révision, première lecture stable, historique de ses tentatives, préférences OFF conservées, heures silencieuses, pause temporaire et permission navigateur volontaire. Le lien privé retrouve la carte précise après connexion et revalidation des droits. Le panneau « Qui attend quoi ? » projette obligations et dossiers ouverts chez leurs propriétaires, sans inventer la partie attendue, l’échéance ou la résolution. Accès : **À faire → Centre d’alertes**. FR/EN, mobile 360 px et modes existants sont conservés.

NotificationService reste propriétaire ; FinancialWorkCoordinator conserve le déclenchement de synthèse au passage au membre suivant. Lire ne paie pas, n’approuve pas et ne clôt rien. Une tentative navigateur ne prouve pas une réception. Aucun fournisseur SMS/courriel/WhatsApp/Telegram, abonnement, polling supplémentaire, nouvelle autorité financière ou ordonnanceur caché n’est ajouté. Kernel.Cases reste propriétaire du futur traitement SAV transversal L25 ; GrowthReferral et MarketService conservent leurs responsabilités.

Les échecs locaux Windows restent dans le reçu LOCAL : connexion Live, réaffichage de cellule après F5 et deux contrôles Local Room. Le comparatif v27 échoue lui aussi après F5, sur une autre assertion ; il n’établit pas la cause du cas candidat. Le moteur WebKit Windows testé n’expose pas RTCPeerConnection même sur localhost sécurisé sans code Eco. Les mêmes scénarios passent sur Linux dans la qualification du SHA publié. Aucune assertion ni aucun délai acquis n’est assoupli. Cela ne vaut pas recette humaine de tous les appareils.

Sauvegarde préalable D1 existante en lecture seule, restauration de contrôle avec intégrité/clés étrangères ok et 50 tables ; archive privée R2 relue SHA256 `60c5f6e49a4feb0cb3d113497c708d601ea6ba3b24f0f284e80e408566111d6f`. Aucune migration, recréation D1/R2, rotation de clé existante, suppression du stockage navigateur ou activation d’argent réel. `realMoneyEnabled=false`, `FIELD_ACCEPTED=NOT_ACCEPTED`.

A24 et I19 sont livrés avec limites explicites : au plus 100 cartes affichées, 50 actions en attente, 20 tentatives présentées. Le dépôt lit encore les tentatives du groupe avant filtrage ; pas de pagination serveur achevée ni promesse de coût D1 constant. Pas de livraison fournisseur garantie ni de SAV L25 prétendument achevé. Les autres propositions ne changent pas de statut par association.

BIR+ / ÉTAT DU PROJET APRÈS ÉTAPE : L01, L05, L28, L02, L23, L10 et L24 publiés dans leurs périmètres documentés. Suite autorisée : **L25 Eco Care/SAV**, auprès de Kernel.Cases et du référentiel commercial existant. Ne pas recommencer l’audit général. GitHub est de nouveau accessible ; l’ancien blocage d’outils est historique. Ne pas pousser le Git local importé : relire le HEAD distant et appliquer les contenus exacts avec contrôle du HEAD attendu. Coût exact des crédits de ce chat non mesurable. Les checkpoints suivants sont historiques.

## L25 — candidate Eco Care et I18, qualification locale

30 scénarios natifs ciblés, les **898 tests natifs complets** et les **3 scénarios Chromium Care** passent sans ignoré. Les contrôles architecture, gouvernance, constitution, vérité, mémoire et couverture passent. Défauts initiaux conservés dans le reçu local : reprise réseau mobile, couverture du dictionnaire anglais et cache précédent de récupération. Corrections effectuées chez les propriétaires existants, sans affaiblir les assertions. Reçu : docs/release/evidence/LOT25-ECO-CARE-LOCAL-2026-10-21.json. La qualification complète distante du même SHA, la sauvegarde restaurable et les empreintes publiques restent obligatoires avant publication. FIELD_ACCEPTED=NOT_ACCEPTED ; coût exact du chat non mesurable.

A25 : responsable, prochaine action, demandeur décisionnaire, droits et événements chez Kernel.Cases. I18 : attentes préventives de groupe, deux parties et versions distinctes ; aucun accord commercial universel automatique ou rétroactif. Aucun service payant ajouté. A25/I18 restent IN_PROGRESS tant que les preuves distantes et publiques ne sont pas réunies.
