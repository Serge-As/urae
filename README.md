# urae

> **Projet ECO — développement de l'application EXISTANTE.** Ce dépôt est privé et contient les sources et l'historique réels; il ne doit pas être rendu public pour récupérer des minutes GitHub.

## Consigne impérative — quota GitHub Actions privé épuisé

**TOUS LES CONTRIBUTEURS doivent lire le [protocole interne de reprise, CI gratuite et confidentialité](docs/operations/CI_QUOTA_ZERO_UTRAE.md) avant chaque PR ou workflow.**

- `SergeDelor/urae` = code Eco réel, développement, sécurité, finance, groupes, rubriques, Discover et données stratégiques : **PRIVÉ**.
- `SergeDelor/utrae` = dépôt auxiliaire **PUBLIC**, ne testant que des fichiers publics audités, sans accès automatique à URAE : [annonce officielle](https://github.com/SergeDelor/utrae/issues/1) et [guide public](https://github.com/SergeDelor/utrae/blob/main/docs/GUIDE-CI-PUBLIQUE-PRIVEE.md).
- Les tests complets et les régressions financières sont lancés sur Windows/runner privé de confiance tant que le quota GitHub-hosted privé est indisponible.
- **Jamais de clone, token, artefact, logs, secrets, sauvegardes ou JS stratégique privé envoyés aux workflows publics UTRAE.**
- Aucun redémarrage du produit, aucune migration D1/R2, aucune mise en production ni refonte de frontend/backend ne résulte de cette séparation.

**Suivi :** [issue #77 — reprise technique](https://github.com/SergeDelor/urae/issues/77) · [issue #75 — contrôle du périmètre public](https://github.com/SergeDelor/urae/issues/75).

> La branche `main` sert actuellement à la documentation; valider la branche applicative et ses tests avant toute livraison.
