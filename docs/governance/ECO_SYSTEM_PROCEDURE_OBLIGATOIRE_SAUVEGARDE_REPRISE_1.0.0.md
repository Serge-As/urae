# ECO-SYSTEM — PROCÉDURE OBLIGATOIRE DE SAUVEGARDE, CLÔTURE ET REPRISE

Version 1.0.0 — 5 septembre 2026. Inspirée de la discipline B.I.R./BlueAuto, adaptée et renforcée pour Eco-System.

## 1. Principe
Une étape substantielle n'est pas terminée parce que le code compile. Elle est terminée lorsque la vérité utile à la reprise est sauvegardée, vérifiable et indépendante du chat courant.

La procédure est **obligatoire** après : changement d'architecture, nouvelle capacité métier, correction P0/P1, migration, déploiement, changement de branche de référence, nouvelle version maître, incident de production, qualification d'un artefact, ou clôture d'un long chat.

## 2. Triple sauvegarde minimale
1. **Git** : code, migrations, tests, docs non sensibles, branche, commit et PR.
2. **Mémoire projet** : `CURRENT_TRUTH`, `PROJECT_TRUTH_LEDGER`, `PROJECT_STATE`, `NEXT_RUN`, Feature Registry, Recall/CIR/ADR.
3. **Archive de restauration** : Git bundle ou archive source déterministe avec SHA-256, plus manifeste de provenance. Une copie durable supplémentaire peut être conservée dans la Bibliothèque autorisée.

Aucun secret, PII brute, token, mot de passe, PIN, clé privée ou credential n'entre dans ces sauvegardes. Seuls le **nom**, l'existence et le périmètre d'un secret peuvent être documentés.

## 3. Préambule obligatoire avant mutation
Avant de modifier Eco-System :
- lire `AGENTS.md` ;
- lire la vérité courte et le Truth Ledger ;
- vérifier branche/HEAD/PR/CI réels ;
- vérifier Worker/D1 live uniquement si le chantier les concerne ;
- relire le Cahier maître et le Recall/CIR concernés ;
- identifier acquis, dépendances et zones interdites ;
- confirmer que la ressource demandée n'existe pas déjà avant de demander au fondateur de la recréer.

## 4. Échelle de preuve
- documenté ≠ implémenté ;
- implémenté ≠ testé ;
- testé localement ≠ CI distante ;
- CI verte ≠ déployé ;
- migration écrite ≠ migration appliquée ;
- Worker déployé ≠ parcours métier validé ;
- `/health` vert ≠ argent réel autorisé ;
- production technique ≠ pilote terrain accepté.

Tout changement de statut doit citer une preuve proportionnée.

## 5. Sauvegarde avant action distante risquée
Avant migration/déploiement/merge sensible :
1. working tree propre ou état explicitement enregistré ;
2. commit exact qualifié ;
3. CI appropriée ;
4. inventaire des migrations ;
5. sauvegarde/rollback selon risque ;
6. état précédent du Worker/DB noté ;
7. secrets seulement référencés par nom ;
8. autorisation distincte si action destructive, argent réel, secret ou production hors périmètre déjà autorisé.

## 6. Migrations
Doctrine : `expand → migrate/backfill → verify → contract`.
- additive/idempotente par défaut ;
- destructive seulement avec autorisation spécifique, sauvegarde et rollback ;
- appliquer dans l'ordre ;
- enregistrer la liste réellement appliquée ;
- vérifier schéma et comportement après migration ;
- ne jamais marquer `DEPLOYED` depuis le seul fichier SQL.

## 7. Déploiement Worker
Un déploiement est qualifié seulement si :
- commit exact identifié ;
- workflow/run identifié ;
- migrations qualifiées ;
- Worker cible identifié ;
- `/health` vérifié ;
- version/flags critiques cohérents ;
- `realMoneyEnabled=false` tant qu'une autorisation explicite séparée n'a pas changé cette règle ;
- aucune régression critique observée.

## 8. État de reprise obligatoire
Après chaque étape substantielle, consigner au minimum :
- Projet ; Version ; Date ; Branche ; HEAD ; PR ; CI/run ;
- GitHub ; Cloudflare Worker ; D1 ; migrations ;
- artefacts et SHA-256 ;
- problème traité ; cause ; correction ; fichiers modifiés ;
- tests exécutés et résultats ;
- acquis ; en chantier ; dormant/superseded/abandonné ;
- limites de preuve ; régression possible ;
- ce qu'il ne faut surtout pas modifier ;
- prochaine action exacte ;
- autorisation nécessaire ou non.

## 9. Règle de clôture de chat
Avant passage à un nouveau chat :
1. mettre à jour les fichiers de vérité ;
2. committer/pousser ce qui est qualifié ;
3. laisser les travaux non qualifiés explicitement `IN_PROGRESS`, jamais `ACQUIRED` ;
4. créer/vérifier l'archive de restauration et son SHA ;
5. inscrire le point de reprise exact ;
6. fournir un prompt de reprise court indiquant quoi lire avant d'agir ;
7. ne pas dépendre d'un message du chat pour une information indispensable.

## 10. Restauration / nouveau chat
Ordre :
`READ TRUTH → VERIFY GIT → VERIFY CI → VERIFY REMOTE IF RELEVANT → RECALL → REPRODUCE → CHANGE`.

Le nouvel agent ne refait pas un acquis. Il revalide seulement les vérités dynamiques nécessaires.

## 11. Contrôle anti-régression de la sauvegarde
La sauvegarde elle-même doit être testée :
- archive lisible ;
- SHA correct ;
- Git bundle vérifiable ;
- commit attendu présent ;
- aucun secret détecté ;
- procédure de restauration décrite ;
- au moins un chemin de reprise ne dépend pas de l'ancien chat.

## 12. Différences/améliorations par rapport à la pratique B.I.R.
Eco-System conserve la discipline B.I.R. de preuve, secrets hors sauvegarde, état de reprise, Git/CI/production séparés et historique non réécrit, et ajoute :
- Truth Ledger machine-lisible ;
- Memory Recall obligatoire ;
- Service Capability Directory et impact inter-services ;
- source→capability coverage ;
- distinction systématique `ACQUIRED/VERIFIED_LOCAL/VERIFIED_REMOTE` ;
- sauvegarde restaurable testée comme artefact ;
- migrations expand/contract ;
- multi-tenant/offline/anti-RSIA comme critères de restauration ;
- obligation de mettre à jour la vérité dans le même chantier qu'un changement distant.
