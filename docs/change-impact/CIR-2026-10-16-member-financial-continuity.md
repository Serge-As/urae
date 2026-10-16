# CIR — continuité financière membre, 16 octobre 2026

Le fondateur confirme la saisie et le mode Visuel compact de la version 1.5.2.18, puis signale des revues disparues au rafraîchissement, une validation abandonnée pendant la synthèse du membre précédent, un refus peu explicite de remboursement et des cotisations sans situation d'arriéré/avance. Il demande aussi un accès aux tontines rotatives et une meilleure lisibilité des dettes. Sa précision la plus récente impose la synthèse **dès le clic sur une cellule d'un autre membre, avant toute nouvelle saisie**.

Propriétaires réutilisés : FinancialWork UI/Application pour les passages et l'outbox durable ; MeetingLiveConsensus/MemberControl pour les revues ; Completion/Ledger/Receivables pour les prêts et dettes ; Completion TONTINE_CYCLE/TONTINE_SHARE, Rubrics et PrepaymentService pour participation et avances. Aucune nouvelle caisse, aucun moteur de prêt parallèle. Les deux feuilles restent les seules surfaces normales de saisie.

Défaut reproduit dans le code : le focus démarre `visit/finish`, tandis que `before` retourne `false` si `busy` existe. Le bouton de validation est ainsi abandonné avant `queueLocal`. La correction attend la revue et ouvre son dialogue avant toute attente réseau. Un montant indiqué enregistré doit déjà être persistant dans l'outbox.

Recette requise : changement par clic et clavier, dialogue lent, validation rapide, annulation/reprise, rechargement ; revue persistante/version exacte et disparition après accord confirmé ; dette due séparée des intérêts futurs, refus de trop-perçu, solde nul et dettes spéciales légitimes ; participation par tontine, deux parts × 100 × sept séances = 1400, rappels partiels et avances sans second encaissement ; dix étapes et parcours rotatifs préservés ; tableaux lisibles et aucun groupe supprimé/recréé pour masquer une absence.

État : implémentation et qualification en cours. Pas de recette du compte Delor ni de disparition du groupe de test attestée. FIELD_ACCEPTED reste NOT_ACCEPTED. Déploiement uniquement après contrôles sur le SHA exact et sauvegarde vérifiée ; aucune migration ni activation d'argent réel.
# Extension observée pendant la qualification — répertoire personnel

Le navigateur authentifié synthétique révèle un défaut préexistant dans `authenticatedApi` : `/api/v1/groups/mine` est pris pour `/groups/:groupId` avec identifiant `mine`, ce qui renvoie403. Cette route personnelle réutilise désormais exactement la collection `allowedGroups` construite à chaque requête depuis propriété et adhésions actives, comme `/api/v1/groups`. Les adhésions d'autres tenants sont incluses et les tiers restent exclus. Aucun droit de groupe n'est mis en cache ni élargi. Les tests de session révoquée, d'usurpation et d'admission intertenant sont étendus. Cela corrige une cause de répertoire vide sans conclure à la disparition ou à la récupération vérifiée du groupe Delor.

