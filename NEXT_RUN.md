# ECO-SYSTEM — NEXT RUN

Date : 2026-09-16

## Lecture obligatoire
1. `AGENTS.md`
2. `docs/memory/CURRENT_TRUTH.md`
3. `PROJECT_STATE.md`
4. `docs/memory/PROJECT_TRUTH_LEDGER.json`
5. `docs/constitution/ECO_SYSTEM_Cahier_des_Charges_Maitre_Exhaustif_3.1.0_2026-09-16.md`
6. `docs/economics/ECO_SYSTEM_Modele_Economique_Detaille_3.1.0_2026-09-16.md`
7. `FEATURE_REGISTRY.yaml`
8. derniers runs GitHub de la branche.

## Branche de reprise
`next/1.3.2-savings-control-forum-live-20260916`

Toujours récupérer le HEAD distant le plus récent.

## Vérité production
Eco-System 1.3.2 est **déployé et smoke-testé** :
- run production : `35096484915` SUCCESS ;
- Worker Version ID : `f6e8b41f-8093-4ca9-9feb-202a4037c7b9`;
- R2 `eco-system-backups` actif ;
- Premium Live / Founder Control / Community Realtime liés ;
- argent réel false.

## Ne pas refaire
- R2 est activé ; le jeton GitHub actuel passe D1 et R2.
- Ne pas demander à l'utilisateur de recréer ce token sans nouveau code d'erreur.
- Moteur historique Épargne déjà confronté au classeur réel : identique.
- Moteur productif déjà testé sur les prêts documentés ; il refuse les sources non prouvées.
- Forum v2, Control Center, Secours membre, identité phone/name/CNI sont acquis 1.3.2.
- Les peppers Cloudflare existent désormais ; les préserver.

## Prochains lots
1. Ledger → moteur productif : tracer source de prêt, principal remboursé, réemploi, caisse classique/scolaire.
2. RECAP/Cassation + UI Secours membre.
3. R2 media/photo + miniatures + contrôle.
4. Passkeys + Push.
5. Forum recherche, signets, voix, sondages, modération.
6. RealtimeKit audio/vidéo.
7. Demand Exchange/Deals + Analytics/Cost Control.
8. tests terrain seniors/2G.

## Interdictions
- ne pas recréer `eco-system-db`;
- pas de migration destructive ;
- pas d'argent réel ;
- pas de second Ledger ;
- pas de données individuelles sensibles en pub/partenaires ;
- pas d'intérêt impayé capitalisé automatiquement ;
- pas de suppression d'acquis pour simplifier l'UI ;
- pas de force-push/merge main sans décision.

## Procédure anti-interruption
Après 3–5 sous-lots significatifs : commit + CI + Current Truth/NEXT_RUN si la vérité change. Avant toute production : BIR+ source + export D1 + restauration/integrity check + Artifact GitHub + miroir R2 + smoke.
