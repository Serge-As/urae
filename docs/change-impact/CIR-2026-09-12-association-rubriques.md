# CIR — Création d’association à partir des rubriques

Décision directe du fondateur dans le commentaire navigateur : définir et personnaliser les rubriques, identifier lesquelles sont tontines ou cotisations, leur donner leurs noms, puis leurs caractéristiques propres. Le montant nominal, les participants, les pots et la durée ne sont pas une propriété financière unique de l’association.

Impact prévu : contrat de projet avec rubriques configurées, simulation détaillée par rubrique, matérialisation dans le service canonique des rubriques, UI de création d’association, conservation et consultation des paramètres après création. Le parcours historique des tontines autonomes reste compatible. Aucun groupe existant ni écriture financière migré automatiquement.

Memory Recall effectué avant code : creation association rubriques avant simulation montant nominal pots duree. Références : commentaire utilisateur, Living Rules, index des cahiers, CIR de reprise du 12 septembre. Le sens métier du nombre de pots est demandé au fondateur ; aucune relation automatique pots/membres/tours ne doit être inventée.

Contrôles prévus : association avec plusieurs rubriques différentes, noms personnalisés, validation avant écriture, simulation par base déclarée, persistance SQL après conversion, reprise sans duplication, projet historique et séparation tenant. Vérification navigateur de l’ordre de saisie et de l’absence de cotisation globale pour une association.


## Décision du fondateur — reprise du 13 septembre 2026
Association → rubriques personnalisées → nature et nom → caractéristiques par rubrique. Les pots sont les passages bénéficiaires par tour. Chaque part a droit à un pot ; quatre parts peuvent bénéficier en un, deux ou quatre tours. La programmation est prévisionnelle, distincte des adhésions et des décaissements. Sept tests spécifiques ont réussi sur Node et SQLite.
