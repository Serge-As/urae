# Livraison commune Business Studio et Value Network — L11 / L12

Candidate 1.5.2.31-business-value-network, non publiée à la rédaction. Production précédente attestée1.5.2.30/8f553482, livraison39783822953. Argent réelOFF, terrainNOT_ACCEPTED. Ce document distingue les capacités effectivement ajoutées et les variantes encore absentes.

## Parcours et propriétaires

Business Studio contient un atelier privé d'expériences : clientèle visée, problème, offre, quantité/unité, deux prix, cinq postes de coûts, temps, durée choisie et seuil de décision. Un coût vide est inconnu ; zéro est une déclaration explicite d'absence de coût. Une variante est un nouveau dossier lié à l'original. Une observation est immuable et sélectionnée explicitement pour la comparaison. Les hypothèses n'alimentent ni ventes, ni factures, ni recettes du cockpit.

MarketService relit les commandes liées avec les droits commerciaux actuels. Le bilan distingue quantité livrée nette des retours, valeur contractuelle livrée, marge à coûts déclarés complets, trésorerie déclarée et temps. Un résultat partiel, une monnaie/unité incompatible ou une autorisation retirée empêchent une marge présentée comme confirmée. Aucun paiement ni mouvement Ledger n'est inféré. Le dossier privé peut être exporté volontairement ; l'export de brouillon commercial limite les champs à l'offre et au prix choisi, avec confirmation et sans publication automatique.

ValueNetworkService contient les besoins mutualisés I04. Un gestionnaire ouvre le besoin avec unité, zone approximative, échéance et contraintes. Chaque membre confirme sa propre quantité et le seul partage de son agrégat. Une conversion compatible (kg/g, litre/ml, heure/minute) conserve les quantités. La première confirmation ne compte qu'une fois. Retirer une participation est définitif pour ce besoin et reste possible après le retrait du membre ; un nouveau besoin permet de corriger une campagne. Les données individuelles ne sont pas listées aux autres participants. Les membres inactifs ne contribuent plus au total.

La clôture et l'expiration à la lecture retirent les quantités actives et empêchent de nouvelles participations. Les rapprochements utilisent le même moteur acquis : contraintes obligatoires avant score, coûts inconnus, unité/zone/date/spécification/qualité ; aucune commande, promesse de stock ou réputation automatique. Opportunity Graph filtre les besoins et offres expirés ; ses liens de catégorie restent des indications, pas des compatibilités détaillées acquises.

## Droits, reprise et ressources

Les nouvelles écritures immuables utilisent l'insertion atomique acquise sur mémoire, D1 et fichier. Les routes génériques ne peuvent ni fabriquer leurs tags ni les modifier et ne listent pas les dossiers spécialisés. La clé de répétition est conservée après erreur avec les mêmes valeurs ; la mutation est séparée du résultat visuel. Changer de compte/groupe ou se déconnecter efface les projections privées affichées, sans effacer l'outbox, les données de l'appareil ou les acquis financiers.

Les lectures sont explicites, sans polling ni service payant. Lister dix besoins mutualisés réutilise trois lectures du dépôt (groupe, membres, enregistrements), vérifiées par scénario. Le volume de lignes demeure dépendant de l'historique ; ceci n'est pas une promesse de coût D1 constant. Le bilan lit au plus vingt références de commandes chez leur propriétaire ; au-delà, il s'annonce incomplet et ne conclut pas une marge complète. Cent dossiers/besoins récents sont affichés ; les autres restent conservés. Les plafonds d'admission ne sont pas présentés comme un verrou transactionnel inter-acteurs.

## Limites explicites

L'assemblage et la réservation exclusive des ressources I16, les lots Harvest I06, une publication automatique, une commande groupée acceptée par tous et un fournisseur externe ne sont pas livrés par cette étape. Les besoins mutualisés sont visibles dans leur groupe, sans publication d'identités ni carnet public de demandes individuelles. Une quantité déjà confirmée ne s'édite pas silencieusement ; retrait et nouveau besoin conservent l'historique. L'export JSON reste volontaire ; aucun document n'est envoyé à autrui. Les calculs d'expériences utilisent des coûts auto-déclarés et ne sont pas un résultat comptable certifié.

## Preuves et récupération

Premier passage intégré e25c2f1c :940/941 tests natifs passent. Le refus concerne une offre historique sans date d'expiration, masquée par le nouveau filtre du graphe. Le correctif conserve sa visibilité et indique que sa validité est inconnue, sans assouplir le test acquis ; les échéances dépassées restent exclues. Les deux cas sont vérifiés sur les deux dépôts. Les3 nouveaux parcours Chromium passent déjà en local, dont deux comptes réels synthétiques et le mobile anglais. La source corrigée doit repasser la qualification complète. L'incident GitHub Actions concomitant peut retarder ses résultats, sans transformer cet échec réel en réussite.

Les22 scénarios métier ciblés passent sur mémoire etSQLite/D1 avant qualification intégrée. Compilation de la candidate réussie :73ressources initiales,55transitives. Contrôles architecture, gouvernance, solidarité, vérité et mémoire passent. Les contrôles navigateur nouveaux et l'ensemble des acquis, la sauvegarde restaurée et l'identité publique doivent encore être consignés sur la source publiée réelle. Les premiers refus de syntaxe lors de la préparation sont conservés dans les logs locaux ; aucun de ces états n'a été publié.

Revenir sur les raccords d'interface ne supprime ni observation, ni consentement, ni retrait. Aucun effacement de base/navigateur, aucune recréation D1/R2 ni rotation de clé financière. BIR+ / ÉTAT DU PROJET APRÈS ÉTAPE : candidat en qualification ; les autres lots et innovations ne changent pas de statut par association. Consommation exacte des crédits non mesurable.
