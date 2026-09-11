# ECO-SYSTEM — NEXT RUN

Date : 2026-09-11

Lire `AGENTS.md`, `docs/memory/CURRENT_TRUTH.md`, `docs/memory/PROJECT_TRUTH_LEDGER.json`, le Cahier Maître 2.3.4, le supplément Cahier App 1.1, Feature Registry, Recall/CIR avant modification.

## Acquis — ne pas refaire
- D1 `eco-system-db` existe et doit être réutilisée exclusivement.
- Worker `eco-system` existe.
- Secrets Cloudflare acquis.
- anciennes lignes 1.0/0.6/0.5 conservées comme checkpoints.
- `realMoneyEnabled=false`.

## Reprise immédiate
1. qualifier la Cahier App 1.1 ;
2. publier sur `next/1.1.0-cahier-app` ;
3. appliquer seulement les migrations additives ;
4. déployer sur `eco-system` + `eco-system-db` ;
5. vérifier `/`, `/health` et `/api/v1/product/capabilities` ;
6. ouvrir/qualifier la PR 1.1 sans la fusionner ;
7. mettre Truth Ledger/Current Truth/Project State à jour ;
8. produire, télécharger, vérifier et sauvegarder BIR+ sous `/Eco-System/` ;
9. fournir le prompt `docs/prompts/ECO_SYSTEM_PROMPT_REPRISE_CHAT_CODEX_1.1.0.md`.

## Interdictions
- ne pas recréer D1 ni Secrets ;
- ne pas force-push/fusionner `main` sans décision explicite ;
- ne pas activer l'argent réel ;
- ne pas publier PII/archives privées ;
- ne pas introduire de migration destructive ;
- ne pas hard-coder la pratique d'un groupe comme règle universelle ;
- ne pas confondre Workspace structurel et moteur métier final.
