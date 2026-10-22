# Groupes, gouvernance et confiance — livraison commune L03 / L04 / L21

Candidate 1.5.2.30-groups-governance-trust. Compilation complète réussie le 22 octobre 2026 : 73 ressources initiales et 54 dépendances transitives, aucun import local manquant. Cette fiche ne constitue pas une preuve de publication. Production précédente : 1.5.2.29-eco-care, source 8b864abda6b1d92af8dfd290edf1e3e41ed2c791. Argent réel désactivé ; FIELD_ACCEPTED=NOT_ACCEPTED.

## Parcours accessibles

Création / intégration : les dix étapes existantes restent disponibles. Le guide présente leur état, une aide FR/EN et un exemple de trois personnes calculé par le simulateur actuel. L'utilisateur peut enregistrer puis reprendre volontairement un brouillon sur son appareil. La mise à jour automatique du brouillon nécessite son activation explicite. Les champs, paramètres et clés de rubriques sont conservés ; les fichiers et documents d'identité bruts sont exclus. Une reprise incompatible rétablit les champs en cours. Une nouvelle confirmation reste nécessaire. Les ressemblances de noms ne fusionnent aucune identité ni participation.

Après une réponse de création perdue, la reprise réutilise le même projet. Le reçu et le Kit permettent de retrouver le groupe créé, puis de réessayer uniquement l'archivage du Kit. Un reçu achevé évite de proposer le même brouillon pour créer un doublon. Cette protection locale ne prétend pas être un verrou atomique inter-onglets. Les brouillons sont séparés par compte et tenant ; la déconnexion vide les champs privés affichés, sans effacer les acquis ou l'outbox financière.

Centre opérationnel : une décision adoptée et close peut recevoir une tâche, un responsable actif et un propriétaire d'effet déclaré. Le dossier conserve le scrutin, la version de règle et les références de discussion/preuves. Démarrer, rapporter un effet, examiner sa preuve et annuler sont des événements distincts. Une revue vise les rapports effectivement examinés ; un nouveau rapport concurrent reste à examiner. Une adoption ou un suivi ne décaisse rien, ne change pas un mandat et ne remplace pas le propriétaire métier. Le résultat est explicitement NOT_INFERRED pour l'effet canonique. Les scrutins annulés ou sans adoption ne créent pas de tâche d'exécution.

Paramètres → assertions : un gestionnaire habilité peut consigner un fait précis, son périmètre, sa date de fin et une référence privée. La déclaration de stock par son sujet est présentée comme une déclaration. Un examen documenté par le gestionnaire n'est pas une certification institutionnelle. Contestation, suspension, revue, remplacement et révocation restent dans l'historique ; une revue seule ne réactive aucun fait retiré. Le rapprochement d'identités et le Trust Graph gardent leurs propriétaires actuels.

Le sujet choisit un résumé partageable et une expiration. Sa carte utilise un code aléatoire ; seul son hash est conservé. Le secret figure dans le fragment du lien, puis une vérification explicite par POST, jamais dans une requête GET. Une autre personne avec un compte Eco peut vérifier cette carte sans accéder au dossier privé. La réponse divulgue seulement le résumé choisi, le type d'assertion, le niveau d'examen, les dates et les limites. Révoquer le partage, révoquer l'assertion, son expiration ou le retrait d'une appartenance/autorité invalident la vérification. Aucune capture hors ligne n'est présentée comme une validation actuelle.

## Propriétaires et protections

Launch Studio / GroupProjectService et StarterKitService portent leurs parcours existants. GovernanceVoteService porte les scrutins et leur suivi. TRUST.VERIFICATION est spécialisé dans le package trust acquis pour les faits datés ; il n'est ni un second propriétaire d'identité, ni un calcul de solvabilité. Le dépôt platform_records conserve les nouvelles lignes immuables. insertGovernedRecord utilise une insertion sans écrasement, sur mémoire, D1 et fichier, et vérifie module et périmètre. Le vote concurrent d'un même électeur ne produit qu'un bulletin.

Les routes génériques ne peuvent pas modifier ces faits, bulletins, scrutins ou suivis spécialisés. Les routes dédiées revalident l'appartenance, l'auteur et le rôle courant. Aucun client ne confère un droit par un en-tête arbitraire. Les projections sont vidées au changement de compte, tenant ou groupe ; les résultats asynchrones d'un ancien contexte sont rejetés. Aucune interrogation périodique ni abonnement payant n'est ajouté.

## Contrats d'accès

- GET/POST `/api/v1/groups/{group}/verification/assertions` : faits autorisés du groupe et création dédiée.
- POST `/api/v1/groups/{group}/verification/assertions/{assertion}/actions` : événement motivé.
- POST `/api/v1/groups/{group}/verification/assertions/{assertion}/shares` : partage choisi par le sujet.
- POST `/api/v1/groups/{group}/verification/assertions/{assertion}/shares/{share}/revoke` : retrait du partage.
- POST `/api/v1/verification/cards/verify` : vérification actuelle, avec compte Eco, réponse sans cache.
- GET `/api/v1/groups/{group}/governance/execution` : tâches autorisées et événements.
- POST `/api/v1/groups/{group}/governance/polls/{poll}/execution` : tâche issue d'une décision adoptée et close.
- POST `/api/v1/groups/{group}/governance/execution/{task}/actions` : suivi motivé avec référence de preuve pour rapport/revue.

## Limites conservées et qualification

Les dossiers ne remplacent pas une analyse humaine des pièces. Les références de preuves ne créent pas un hébergeur de fichiers ou une connexion institutionnelle. Un secret de carte perdu ne peut pas être reconstitué : son propriétaire révoque le partage et en crée un autre. Les anciens dossiers génériques restent conservés et ne deviennent pas des assertions examinées. Les mandats, fédérations et successions acquis ne sont pas automatiquement exécutés depuis une tâche. Aucun prestataire de paiement, reconnaissance vocale distante ou canal de notification externe n'est créé par cette étape.

Les 21 scénarios métier ciblés ont passé avant l'intégration finale, sur mémoire et SQLite/D1. Les trois scénarios Chromium du guide ont passé avant l'élargissement. Les premières nouvelles tentatives navigateur ont chargé « Not found » pendant une reconstruction interrompue ; elles ne sont pas une qualification et leurs logs sont conservés. La compilation finale a ensuite réussi. La qualification intégrée et les acquis doivent passer sur la source exacte avant publication ; consigner ici les résultats réels et le reçu public après leur obtention.

Retour arrière : retirer les raccords de surface tout en conservant faits, contestations, révocations et suivis. Ne pas effacer une base, recréer D1/R2, vider les données d'un navigateur ou remplacer l'outbox pour annuler une interface. Déploiement de code uniquement, après sauvegarde en lecture seule et restauration vérifiée.

BIR+ / ÉTAT DU PROJET APRÈS ÉTAPE : ensemble implémenté et en qualification ; aucune nouvelle publication attestée à ce stade. Les autres lots et innovations ne deviennent pas livrés par association. L'accès GitHub a répondu de nouveau le 22 octobre, branche de production toujours sur 8b864ab. Crédits exacts de ce chat non mesurables.
