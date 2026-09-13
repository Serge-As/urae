# ECO-SYSTEM — NEXT RUN

Date : 2026-09-13

Lire d'abord `AGENTS.md`, `docs/memory/CURRENT_TRUTH.md`, `PROJECT_STATE.md`, `docs/memory/PROJECT_TRUTH_LEDGER.json`, le Cahier Maître, `FEATURE_REGISTRY.yaml` et la qualification 1.2.

## Acquis — ne pas refaire
- Production `1.2.0-functional-completion` déployée sur `eco-system.sergemimf.workers.dev`.
- Run Cloudflare `34766061058` SUCCESS ; Worker Version ID `f04625c8-30a9-4722-8de7-76f08f49b1e4`.
- D1 `eco-system-db` réutilisée ; aucune migration en attente.
- 139 capacités ; `realMoneyEnabled=false`.
- Multi-tontines indépendant par rubrique, argent/nature/mixte, participants différents, plus de montant global imposé.
- Test auth + 3 tontines + simulation + conversion SUCCESS : `34765998225`.
- Service Worker mis à jour avant auth ; cache r3.
- BIR+ pré-déploiement `34766026113` SUCCESS.
- R2 direct toujours refusé par Cloudflare code 10042 ; fallback D1 borné actif.

## Reprise normale
1. Partir de `next/1.2.0-functional-completion-20260913`.
2. Vérifier d'abord les derniers runs GitHub et la dernière sauvegarde, sans recommencer les lots déjà qualifiés.
3. Si l'utilisateur signale encore l'ancien cockpit, lui faire effectuer une actualisation forcée une seule fois ; ne pas effacer ses données navigateur sans nécessité.
4. Continuer les pilotes encore non certifiés (notamment capture vocale/OCR terrain, accessibilité/old-device et complétude de certains services communautaires) par petits lots testés.
5. Préserver `realMoneyEnabled=false` tant qu'aucune autorisation séparée n'est donnée.
6. Quand R2 devient réellement accessible au token Cloudflare, remplacer automatiquement le fallback pour les gros artefacts et vérifier upload/restore ; ne pas migrer silencieusement des PII.

## Interdictions
- ne pas recréer `eco-system-db`;
- ne pas demander les secrets déjà acquis;
- ne pas force-push/fusionner `main` sans décision explicite;
- ne pas réintroduire une cotisation nominale unique;
- ne pas supposer que tous les membres participent à toutes les tontines;
- ne pas activer l'argent réel;
- ne pas introduire de migration destructive;
- ne pas présenter un workflow/catalogue comme moteur métier terminé sans parcours, persistance, droits et tests.
