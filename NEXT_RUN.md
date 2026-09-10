# ECO-SYSTEM — NEXT RUN

Date : 2026-09-10

Lire `AGENTS.md`, `docs/memory/CURRENT_TRUTH.md`, le Cahier Maître 2.3.4, le Feature Registry et les Recall/CIR avant modification.

## Acquis — ne pas refaire
- Account API Token Cloudflare actif.
- Secrets GitHub Actions présents.
- D1 `eco-system-db` existe et est qualifiée.
- Worker `eco-system` existe.
- ancienne Alpha conservée comme fallback.
- `realMoneyEnabled=false`.

## Reprise
1. qualifier la Complete App 1.0 ;
2. publier sur `next/1.0.0-complete-app` ;
3. appliquer seulement les migrations additives ;
4. déployer le Worker/PWA 1.0 ;
5. vérifier `/`, `/health` et `/api/v1/product/capabilities` ;
6. ouvrir/mettre à jour la PR Complete App ;
7. produire BIR+ 1.0 ;
8. poursuivre les capacités encore STRUCTURAL_V1 vers des moteurs métier spécialisés.

## Interdictions
- ne pas recréer D1 ni les Secrets déjà acquis ;
- ne pas force-push ou fusionner `main` sans décision explicite ;
- ne pas activer l'argent réel ;
- ne pas publier PII/archives privées ;
- ne pas introduire de migration destructive ;
- ne pas hard-coder la pratique d'un groupe comme règle universelle.
