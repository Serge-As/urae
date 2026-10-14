## Barrière de durabilité — correction reproduite et qualifiée

Au SHAce631534 : gouvernance native PASS, Chromium6/8PASS ; deux FAIL, zéro skip, pas de livraison. Le diagnostic sélectionné montrait CLOCK_REVIEW avec une ancre présente mais sans deviceSequence. Un test natif de concurrence reproduit l'envoi d'une intention avant la fin de recordFinancialCellIntent (FAIL1!==0 avant correction).

Correction : Outbox expose les commandes en préparation uniquement à la projection locale ; elles sont exclues du drainage et de persistOutbox jusqu'au commit. Le marqueur est libéré après la vraie transaction IndexedDB ; le drainer relit la commande canonisée. Les modes/non-financiers sont persistés individuellement, sans sauvegarder une intention financière non préparée. Régression vérifiée et suite complète **722/722 PASS, zéro skip**. Un second test interdit la réécriture d'une synthèse financière livrée via PUT/workspaces. Le prochain SHA doit encore réussir les navigateurs ; aucun déploiement production attesté.

## Complément qualifié — 13 octobre 2026

Suite native complète : **720/720 PASS, aucun skip** ; le test ajouté lie les décaissements et remboursements à leurs véritables écritures et notices, sans doubler la finance. Synthèses spécialisées raccordées, reprise événementielle des projections non diffusées. Sauvegarde read-only avant livraison préparée : export D1, restauration SQLite avec integrity/FK check, archive source, dépôt privé R2 et relecture/hash ; **aucune sauvegarde de production exécutée ou prétendue à ce stade**. Validateur testé sur un exemple synthétique sain et un SQL invalide rejeté.

CheckpointGitHubc9cba457 : gouvernance/CI native PASS ; Chromium3PASS5FAIL. Les cinq scénarios restaient devant le choix de mode sans le sélectionner. Le correctif de recette répond explicitement au dialogue ; délais financiers inchangés. Sa qualification navigateur est à relancer. Réconciliation avec881a3e6 conservée ; ce parent déployé est joint dans l'historique de reprise après vérification de son commit et de ses corrections. Aucun déploiement, FIELD_ACCEPTED=NOT_ACCEPTED.

## Reprise intégrée — 13 octobre 2026 : Live, modes et refonte

La source privée candidate54dba6c est réconciliée avec les corrections applicatives réellement servies en production881a3e6. Guide modifié du fondateur appliqué aux synthèses : correction gestionnaire par ligne, réserve membre par ligne. Compilation native Node24 réussie ; dernière suite complète exécutée : **719/719 PASS, zéro skip**. Des modifications de transport postérieures restent à requalifier sur le prochain SHA. Architecture, constitution, mémoire, source coverage et gouvernance PASS.

Implémentation : réception des cellules canonisées persistée avant avancement du curseur ; intentions Outbox ajoutées pendant la synchronisation drainées ; journal Live séquencé/filtré par audience ; choix Réunion/Hors réunion, contrôle1Hz WebSocket uniquement en réunion, synthèse des cotisations/corrections avec notifications120–180s hors réunion ; correction/réserve par ligne. Les flux spécialisés de prêt/remboursement ne sont pas encore prouvés de bout en bout dans la nouvelle synthèse ; ne pas annoncer la totalité des parcours acceptée.

Version source candidate1.5.2.16-live-modes-refonte et caches distincts ; cache production15215 et anciennes lignes de récupération conservés. Refonte importée de préproduction + correctifs UI accessibles ; **recette visuelle authentifiée complète, Chromium/WebKit sur ce SHA, sauvegarde restaurable et déploiement production encore NON ATTESTÉS**. PR72 resteHOLD historique ; PR92 demeure candidate, jamais assimilée à la production. Aucun achat/argent réel, aucune modification de la base de production.


Prochaines étapes exactes : publier le checkpoint privé ; qualifier le SHA exact ; finir le regroupement spécialisé ; valider les parcours navigateur/captures, sauvegarde restaurable, puis seulement promouvoir via la branche applicative canonique. Le miroir local ne reproduit pas le SHA GitHub ; commits distants avec parent54dba6c, sans réécriture de référence.

## Livraison finale constatée — 14 octobre 2026

Source c3b7b589086d4d9439612d6cf6a5e959c8d1080f, livraison38522445853 SUCCESS, qualification38522445843 SUCCESS. 723Node/11Chromium/6WebKit PASS. Le HTML public et /health ont été relus indépendamment : identité de version cohérente et source exacte. Sauvegarde D1 restaurée, archive privée R2 relue et vérifiée, reçu11874562075 ; aucune mutation du schéma ni remplacement des ressources.

Lot de version **livré** ; recette exhaustive155 **non acceptée**. Le navigateur authentifié a montré Séances, puis a bloqué les observations par protection native des données de connexion ; navigation de récupération également refusée. Handoff nécessaire pour la seule suite de cette recette, sans reprise de l'implémentation financière qualifiée. Voir `docs/release/DELIVERY-2026-10-14-FINALISATION.md`.
