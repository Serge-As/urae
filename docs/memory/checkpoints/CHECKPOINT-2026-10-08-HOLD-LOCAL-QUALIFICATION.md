# Checkpoint courant — livraison HOLD, 8 octobre 2026

**La production 1.5.2.15 n'est pas attestée. Dernière production attestée : 1.5.2.14-live-sync, source d027f09a1382cd29054b33e274f3fd3bf9f8d9f3. FIELD_ACCEPTED=NOT_ACCEPTED ; realMoneyEnabled=false.**

Le travail le plus récent est sauvegardé à **e083a6a38b1ab76e6827e512bb7e900604911a4c** sur **fix/confrontation-clock-recovery-20261008**, [PR #72 brouillon](https://github.com/SergeDelor/tontine-platform/pull/72). Pour la reprise fonctionnelle, lire CURRENT_TRUTH, l'audit, le CIR et le Recall de **cette branche de travail**. Les blocs 650/8/6 de la branche de livraison sont des preuves antérieures du transport borné.

La PR #71 est fusionnée mais la livraison 37822250587 a été CANCELLED avant publication, après un échec de confrontation. Trois régressions d'horloge sont ensuite prouvées par ancien source en échec / correctif en réussite, avec 653 Node PASS. Le run **37826825035** du SHA **4022ef5** reste Chromium **7/8** : 4 000 attendu, 5 000 affiché. L'horloge seule ne clôt pas cet échec. Artefact 11571014847 conservé.

Le dernier source ajoute garde de contexte (comparaison étroite des vrais corps de méthode V8 réussie), quatrième régression Node, verrou Playwright 1.56.1 / ws 8.21.0 dont l'audit candidat est à zéro alerte connue, préalable navigateur de vraie confirmation serveur 5 000 et diagnostic expurgé de tickets. **654/8/6 finaux non exécutés** ; ne pas les annoncer PASS.

Le fondateur confirme que les **2 000 minutes gratuites Actions du mois sont épuisées**. Les derniers jobs n'ont ni runner ni étape, et le terminal Codex échoue avant création de processus. Ce sont deux obstacles d'exécution distincts, aucune preuve de résultat applicatif.

Le lanceur **scripts/qualify-eco-locally.mjs** et [son mode d'emploi](https://github.com/SergeDelor/tontine-platform/blob/e083a6a38b1ab76e6827e512bb7e900604911a4c/docs/recovery/ECO_FREE_QUALIFICATION_2026-10-08.md) sont prêts sur la branche de travail. Ils sont revus et parsés statiquement, non exécutés. Ils utilisent Node 24, source propre, verrou exact, mêmes gates et suites navigateur, SQLite synthétique isolée, rapport outputs/ et archive source exacte avec SHA-256. Aucun déploiement ni achat.

**Prochaine action nécessaire : rétablir une exécution, lancer les contrôles, lire le JSON de diagnostic si 4 000/5 000 échoue et corriger la cause prouvée. Maintenir le marqueur HOLD jusqu'à qualification complète du même SHA.** Puis la livraison existante doit requalifier et attester son SHA/version/build/cache/Worker/catalogue. La recette physique et les originaux Word/Excel/ZIP encore inaccessibles restent à traiter séparément.

Le compteur Codex n'expose aucun coût exact par chat. Toujours préciser cette limite dans le bilan ; un solde de crédits à zéro ne prouve pas une consommation nulle.
