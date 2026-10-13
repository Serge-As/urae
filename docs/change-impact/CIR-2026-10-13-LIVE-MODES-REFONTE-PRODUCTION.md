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
