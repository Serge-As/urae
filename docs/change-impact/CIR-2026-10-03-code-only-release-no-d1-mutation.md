# CIR — 2026-10-03 — Release event-push code-only

## Fichiers concernés
- workers/api/src/index.ts
- apps/web/sw.js
- docs/release/CURRENT_RELEASE_CONTRACT.json
- .github/DEPLOY_ECO_SYSTEM_1_5_2_9_SOVEREIGN_ONCE
- .github/workflows/deploy-1.5.2.9-sovereign-offline.yml
- tests/release-free-event-push-code-only-2026-10-03.test.mjs
- tests/field-feedback-1.5.2.2.test.mjs
- tests/final-mega-field-regressions-1.4.5.test.mjs

## Changement de comportement
Aucun changement du Ledger, des règles de dettes, des rubriques, des prêts ou du schéma D1. Le lot change uniquement l'identité de release et le mode de livraison Cloudflare.

Quand le marqueur contient `db_mutation: none`, le workflow :
1. qualifie et construit le code ;
2. résout les bindings existants ;
3. saute les exports D1 ;
4. saute les migrations D1 ;
5. refuse un rollback de SHA ;
6. déploie le Worker/PWA ;
7. vérifie l'identité exacte par smoke.

## Effet quota
La production ne déclenche plus de polling financier D1 en mode gratuit. Cette livraison elle-même évite les opérations D1 lourdes qui n'ont aucun intérêt puisqu'aucune migration n'est nécessaire.

## Non-régressions obligatoires
- aucun `setInterval` Live côté client ;
- pas de polling canonique actif en `FREE_CONSERVATION_MODE` ;
- validation poussée par événement serveur ;
- reprise seulement lors d'une reconnexion ou d'un événement explicite ;
- ancien cache cohérent conservé pour rollback ;
- Android 6 et iOS restent couverts par les qualifications existantes ;
- dettes/Remboursements/Épargne/récaps/offline inchangés.

## Rollback
Le cache `eco-system-v1529-free-conservation-debt-syncfix2-20261002` reste déclaré comme précédent. Aucune donnée D1 n'est modifiée par ce lot, donc le rollback applicatif ne requiert aucune restauration de base.
