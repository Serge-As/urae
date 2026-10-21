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
