# ECO-SYSTEM — PROJECT STATE

Date : 2026-09-16

## Production publique
- version : **1.3.2-savings-control-forum-live**
- URL : `https://eco-system.sergemimf.workers.dev/`
- Worker : `eco-system`
- Version ID : `f6e8b41f-8093-4ca9-9feb-202a4037c7b9`
- D1 : `eco-system-db`
- R2 : `eco-system-backups`
- Premium Live : actif
- Founder Control Center : actif/bound
- Forum v2 : actif/bound
- artifacts : R2
- argent réel : désactivé
- smoke : run `35096484915` SUCCESS.

## Développement courant
- branche : `next/1.3.2-savings-control-forum-live-20260916`
- reprendre au HEAD distant le plus récent.
- la 1.2 et la 1.3.1 restent historiques, pas des bases de reprise.

## Acquis 1.3.2
- audit du moteur Excel réel : reproduction exacte à la précision flottante ;
- moteur alternatif « capital réellement productif » avec no-loan-no-yield ;
- Secours par membre ;
- Control Center auto-supervisé ;
- Forum v2 multi-appareils ;
- CNI/téléphone/nom protégés par HMAC ;
- R2 opérationnel + BIR+ miroir vérifié ;
- bootstrap durable du propriétaire plateforme ;
- secrets HMAC générés une seule fois dans Cloudflare ;
- Premium Live en production ;
- tests et smoke verts.

## Sauvegarde
- BIR+ GitHub run `35095940942` SUCCESS.
- miroir R2 pré-production sous `birplus/1.3.2/0226b9b145c8aa49eb94ed190dedfd8c544ff80c/predeploy/`.
- restauration SQLite vérifiée.
- `realMoneyEnabled=false`.

## Invariants
D1 unique ; migrations additives ; aucun second Ledger ; pas de données sensibles pour publicité/partenaires ; aucune activation argent réel ; non-régression des 10 étapes/multi-tontines/Collation ; sauvegarde + smoke obligatoires.

## Prochain jalon
Connecter le moteur productif aux sources de prêts/réemplois du Ledger, compléter RECAP/Cassation/Secours, puis photo R2/passkeys/Push/Forum avancé/RealtimeKit.
