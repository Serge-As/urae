# Eco-System — Live, contrôle membre et refonte visible

## Sources vérifiées
- Production observée le 13 octobre 2026 via /health : 881a3e6a59269ce7c63633dd811bc14ba7d579c9, 1.5.2.15-bounded-recovery ; D1/R2 présents, argent réel désactivé.
- Candidate PR92 : 54dba6c7be24d36ca164ca34472942051da65e5e ; fichiers récupérés et empreintes Git vérifiées, tree 950a5db228eb478ec1af2f60d95fd51ca65d12da.
- Préproduction de référence 1d9be38e7549a9e467f7ff0b54b7f917d342614d.
- Guide du 12 octobre modifié par le fondateur : synthèse de contrôle gestionnaire avant passage ; correction par ligne ; réserve membre par ligne.
- Doctrine et vision du 10 octobre, reprise de refonte du 12 octobre, réorganisation historique, Cahier 3.2.0 / socle 2.3.4, Blueprint5, 155 capacités, deux conventions et Living Rules lus avant modification.

## Défaut reproduit dans la CI précédente
PR92, run38387973137 : 7 Chromium PASS, 1 FAIL. Après une projection distante à3000, le rechargement hors connexion retourne0. Une qualification verte distincte ne ferme pas ce défaut. Aucun succès terrain déduit de ce run.

## Contrat de reprise
Réconcilier d'abord la candidate visuelle avec les correctifs applicatifs réels de881a3e6, par comparaison à leur ancêtre5c300276. Aucun écrasement des saisies/conflicts, aucune réécriture d'histoire Git distante. Le miroir Git local sert uniquement au travail ; les commits distants doivent garder leur parent GitHub exact.

## Autorités et réutilisation
- Ledger/D1 et services spécialisés : montants, prêts, remboursement, correction ; aucune décision financière dans Live.
- MeetingService : contexte de séance ; GroupLiveHub coordonne ses projections, passages et rythme de transport.
- Application/Outbox/IndexedDB : intentions durables et copies de lecture par compte/tenant/groupe ; données distantes distinctes des intentions locales.
- MemberFinancialControlService : confirmation, réserve, revue et historique ; NotificationService reste l'unique owner des alertes.
- Modules UX existants : identité, groupes, finance, Récap, forums, médias, commerce, cockpit et contrôle ; refonte additive de leurs projections.

## Comportements exigés
Choix Réunion/Hors réunion avant première validation ; détection de plusieurs responsables distincts ; commit et réception immédiats dans les deux modes ; contrôle léger nominal1Hz en réunion, aucun rechargement complet ; reprise automatique. Synthèse unique par membre et passage, fermeture après reçus terminaux, hors réunion120–180s ; contrôle et correction du gestionnaire, réserve membre par ligne sans annuler la comptabilité. Dernier membre et changements de mode traités. Retours hors connexion, dates d'origine, états de livraison et droits conservés.

## Vérification et livraison
Reproduire le défaut avant/après ; tester vrais services/SQLite, stockage navigateur, concurrence, rejouages, rôles, vues1/2/5, langues, restauration et PWA. Qualifier la source exacte, archiver/contrôler une sauvegarde restaurable avant promotion par le workflow existant. La demande du13octobre autorise la production ; cette autorisation ne transforme pas un test en succès. Les HOLD historiques demeurent des preuves jusqu'à une nouvelle qualification documentée. FIELD_ACCEPTED et argent réel ne sont pas promus par la refonte.

## État
IN_PROGRESS — compilation/correction/recette/déploiement non encore attestés. Innovations expérimentales du guide conservées derrière qualification ; elles ne remplacent pas les garanties de base.

## Sous-lot : barrière avant transport

Après 720 tests natifs verts, la recette Chromiumce631534 termine6PASS2FAIL : CLOCK_REVIEW avec ancre mais sans séquence. Cause reproduite avant correction : le drainage observe une commande encore en préparation IndexedDB. Réutilisation Outbox/IndexedDbOutboxAdapter, aucune nouvelle vérité financière. Commandes préparées visibles localement mais inéligibles au transport et aux sauvegardes génériques jusqu'au commit ; adoption du paquet durable et relecture au drainage. Test rouge puis vert, suite722/722PASS. PUT générique des synthèses livrées interdit et testé. Navigateurs exacts/backup réelle/publication encore à prouver.

## Dernière qualification navigateur et revue hors connexion

0297518 : CI native722PASS ; Chromium6PASS2FAIL. Le Live multi-gestionnaires est PASS avec délais1913/966/961ms et zéro lecture périodique des dépenses au repos. La conservation du montant reçu3000 après rechargement hors connexion passe dans le scénario avant son étape suivante. Deux échecs restent : message pending perdu lors d'une reconstruction DOM, puis intention CLOCK_REVIEW exclue de pendingFinancialCellTargets donc hors confrontation. Correction : état appliqué aux cellules montées actuelles ; intentions CLOCK_REVIEW disponibles au contrôle humain mais toujours interdites au drainage. Test ajouté ; total attendu723, non encore qualifié sur la source suivante. Service d'exécution local indisponible transitoirement, poursuite via qualification GitHub native. Aucune publication attestée.

## Candidate finale et garde de livraison

9517985 : deux qualifications indépendantes SUCCESS ; CI native723PASS, Chromium8/8PASS, WebKit6/6PASS. Live et confrontation hors connexion réellement qualifiés ; aucun déploiement encore attesté. Complément avant promotion : reprise des deux scénarios navigateur de comptes/fenêtres présents dans la vraie production881a3e6 ; test de synthèse hors connexion après une ancienne synthèse en cache. Le SDK distingue une copie locale du serveur ; la revue utilise les montants locaux nouvellement enregistrés. Attendu Chromium11, Node723 et WebKit6, à vérifier sur le nouveau SHA.

Livraison : conserver la liaison R2 acquise, jamais basculer silencieusement vers D1 ; vérifier la restauration et relire l'archive privée R2 avant Worker mutation. GitHub ne conserve que le reçu/hash/manifeste sans dump financier. Refuser une production de source inconnue ; conserver la clé financière existante, créer la première clé seulement si son absence est prouvée, après sauvegarde et garde d'ascendance. Aucune rotation d'une clé existante et aucun achat. Le marqueur HOLD historique reste inchangé jusqu'à réussite de la candidate.

## Fermeture des deux écarts de la recette étendue
9cae101 : native723PASS, Chromium9PASS2FAIL, sans publication. Les deux comptes/fenêtres de production passent. Le test ajouté révèle une ancienne synthèse1 000 présentée en revue hors connexion après saisie2 000 ; une requête mise en cache ne doit pas remplacer le travail local. Le mode offline utilise directement la projection locale. Baseline de la commande préparée conservée dans le modèle UI ; une projection reçue de version inférieure/égale à cette baseline n'invalide pas l'intention plus récente. Les rappels de restauration du défilement s'appliquent une seule fois quand le tableau est visible ; ils ne doivent pas remettre à zéro un déplacement déjà effectué. Recette11 à réexécuter, aucun résultat futur présumé.

## Finalisation du 14 octobre : identité visible et recette réelle

Reprise depuis d96019c (documentation seule après production0d06e9a). `/health` réel confirme la production. Connexion sécurisée réussie ; page Séances observée sans mutation financière. Protection native des données ensuite bloquante, récupération de navigation refusée. Aucun succès Live terrain ou recette155 déduit de cette observation.

Défaut certain : titre/bannière/footer1.5.2.15 malgré version canonique1.5.2.16. Correction des trois libellés ; extension du gate de vérité existant aux quatre surfaces visibles, sans nouveau propriétaire de version. Registre project_version aligné, statuts de capacités inchangés. Ledger, D1/R2, intentions hors connexion, modes, réserves et parcours métier intacts. Contrôle local du gate réussi ; publication du nouveau SHA encore à attester.
