# CIR — Reprise et qualification locale

Origine : demande du fondateur et audit de la sauvegarde 11/09, interface publique 1.1 et cahiers 2.3.4.

Autorisations de requête recalculées depuis une session et les adhésions ; APIs internes de test distinctes de l’entrée Worker authentifiée. Nouveaux stockage de sessions et contrat transactionnel financier : migrations 0004/0005 additives. Interface échappée et adaptée aux relevés/net réel. Correction D1 de publication par groupId.

Impacts : les anciens utilisateurs sans compte authentifié ne sont pas automatiquement propriétaires ; rapprochement obligatoire avant exploitation distante. Pas de changement de monnaie ni activation de paiement. Les reversals préservent les écritures d’origine. Notes et cash passent par l’outbox sans preuve de paiement inventée.

Contrôles : suite existante, intégrité financière et rollback SQLite, isolation tenant, admission inter-tenant, relevés individuels et contrepassation, CSRF/session expirée/révocation, stockage local indisponible et réponse réseau perdue, inspection navigateur isolée. Voir QUALIFICATION.md.

Retour arrière : archive source d’origine conservée et manifeste des fichiers modifiés ; aucun effacement des bases. Ne pas remettre une entrée HTTP non authentifiée sur une base utilisateur.
