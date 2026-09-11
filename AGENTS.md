# AGENTS.md — Eco-System Cahier App

## Mission
Continuer le produit réel Eco-System sans recommencer depuis zéro. La ligne produit active est `1.1.0-cahier-app` sur `next/1.1.0-cahier-app`. Les lignes 1.0/0.6/0.5 restent checkpoints/fallbacks, pas cible UI.

## Ordre obligatoire avant modification
1. Lire `docs/memory/CURRENT_TRUTH.md`.
2. Lire `docs/memory/PROJECT_TRUTH_LEDGER.json`.
3. Lire `PROJECT_STATE.md` et `NEXT_RUN.md`.
4. Lire le Cahier Maître 2.3.4 via son manifeste/fingerprint et le supplément Cahier App 1.1.
5. Exécuter Memory Recall + CIR pour toute modification substantielle.
6. Préserver les autorités canoniques, Living Rules et l'isolation multi-tenant.

## Invariants
- `realMoneyEnabled=false` jusqu'à autorisation explicite séparée.
- Réutiliser exclusivement D1 `eco-system-db`; ne pas la recréer.
- Aucune migration destructive.
- Une activité métier = une autorité canonique; aucun moteur parallèle créé par l'UI, l'IA ou l'offline.
- Règle écrite, pratique observée et règle opérationnelle validée restent distinctes.
- Une règle locale d'un groupe ne devient pas une interdiction universelle.
- Aucun secret/PII fondateur brut dans Git ou BIR+.
- Ne pas force-push ni fusionner `main` sans décision explicite du fondateur.

## Définition de fini
Recall → CIR → code → tests → CI → déploiement autorisé et smoke → Truth Ledger/Current Truth/Project State/NEXT_RUN → BIR+ vérifié → prompt de reprise.
