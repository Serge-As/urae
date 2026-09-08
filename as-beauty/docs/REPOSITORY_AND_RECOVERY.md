# Dépôt et reprise

Dépôt cible : `Delor85/as-beauty` (privé pendant l'amorçage). Le connecteur GitHub disponible dans cette session peut écrire dans des dépôts existants mais ne peut pas créer un dépôt. Le paquet est donc sauvegardé immédiatement dans une branche isolée du dépôt privé accessible `Delor85/tontine-platform`, puis pourra être migré sans transformation vers le dépôt dédié.

Branche de sauvegarde : `as-beauty/bootstrap-0.1.0`.

## Copies reconstructibles

- Source ZIP : `AS_BEAUTY_SOURCE_0.1.0_2026-09-08.zip`
- Git bundle : `AS_BEAUTY_0.1.0_2026-09-08.bundle`
- SHA-256 ZIP : `33f952f614775402d37613557b21bd07eb8516777fe1c6c75c9a4ef7fa7b4118`
- SHA-256 bundle : `495e5e4f048c9e616898ea69e0ed4afa279db91126282485700e63301668b50d`

Ces deux fichiers sont conservés dans la Bibliothèque ChatGPT `/As-Beauty/`. Le Git bundle a été vérifié localement et contient une histoire complète.

## Reprise obligatoire

1. Lire `governance/CURRENT_TRUTH.md`.
2. Lire `docs/AS_BEAUTY_MASTER_1.2.0.md`.
3. Vérifier la branche distante et la CI avant toute mutation.
4. Ne jamais fusionner cette branche dans `tontine-platform/main` : ce dépôt n'est qu'un coffre Git temporaire.
5. Dès que `Delor85/as-beauty` existe, y migrer l'historique As Beauty puis requalifier CI avant développement.
6. Ne jamais versionner secret, token, mot de passe, donnée KYC brute ou localisation privée.
