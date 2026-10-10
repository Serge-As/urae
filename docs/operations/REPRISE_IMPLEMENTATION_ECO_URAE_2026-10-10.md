# ECO-SYSTEM — Procédure exécutable de reprise d’implémentation
**Édition : 10 octobre 2026 · Statut : procédure de reprise préparée, PAS recette du produit**

> **Décision :** reprendre les implémentations dans `Serge-As/urae` **privé**, sans reconstruire l’application, exposer ses moteurs dans `Serge-As/utrae` **public**, installer Ubuntu sur le PC du fondateur, acheter des minutes/crédits, désactiver des fonctionnalités, ni toucher à la production. Le marqueur **HOLD bloque la livraison, pas le travail sur les branches privées**.

## A. Sources de vérité — lecture obligatoire avant modification
Dans la **branche applicative exacte** choisie, appliquer l’ordre prescrit par `AGENTS.md` :
1. `AGENTS.md` ;
2. `docs/memory/CURRENT_TRUTH.md` ;
3. `docs/memory/PROJECT_TRUTH_LEDGER.json` ;
4. `PROJECT_STATE.md` ;
5. cahier maître 3.2.0 **et socle 2.3.4 intégral** ;
6. modèle économique / AdManager 3.2.0 ;
7. deux conventions fondatrices universelles ;
8. Living Rules Doctrine ;
9. `FEATURE_REGISTRY.yaml` ;
10. `NEXT_RUN.md` ;
11. CIR/ADR/Recall, checkpoints, preuves et tests du domaine ;
12. HEAD distant réel, état PR et runs GitHub.

Ne jamais traiter un ancien résumé comme un remplacement de ces documents. Un `main` documentaire ne prouve pas l’état du code livré. Tout nouveau lot doit citer sa **branche, son commit, ses modules canoniques, ses dépendances, ses tests et son état**, sans confusion entre `CODÉ`, `TESTÉ`, `CI`, `DÉPLOYÉ` et `RECETTÉ TERRAIN`.

## B. Situation effectivement vérifiée à la préparation
- Dépôts actuels : `Serge-As/urae` privé, `Serge-As/utrae` public. Aucune version du vrai code ne doit passer dans UTRAE.
- `main` d’URAE : essentiellement documentaire ; ne pas créer une version produit à partir de ses seuls fichiers.
- **Candidate code** : `a7c333699dad0d70cf0de8e2f8a841a00396d0d7`, tree `0c75c80833d78c807cc2fbef082b06f9c0c6aa7f`, branche `fix/confrontation-clock-recovery-20261008`, PR privée #72 en brouillon.
- **Branche preuves postérieure** : `evidence/cloud-qualification-20261009-a7c3336`, HEAD `6f06d6092a2eb84c2609711022e22f708554f9f6`. Elle est 6 commits devant la candidate ; ne jamais présenter ses commits documentaires comme une nouvelle qualification produit.
- **Cloud réel sur a7** : preuve observateur avant/après PASS ; Node **657/657 PASS** ; Chromium **8/8 PASS** ; WebKit **4/6 PASS, 2 FAIL** (DataChannel/ICE et A01) ; résultat global **FAIL**, aucune archive qualifiée. Voir `docs/qualification/CLOUD_QUALIFICATION_2026-10-09.json`.
- **Windows sur a7** : six scénarios Chromium souverains, **5 PASS/1 FAIL** ; premier QR dépasse le délai de 30 s. Local Room DataChannel et callbacks A01 réels PASS. Cause QR non établie. Voir `docs/qualification/QR_DIAGNOSTIC_2026-10-09.json` et `QR_WINDOWS_HANDOFF_2026-10-09.md`.
- **Qualification Linux gratuite** : `docs/qualification/free-codespaces/README.md` et `preparation.json` = **PRÉPARÉ, NON EXÉCUTÉ** ; quota et absence de dépense non vérifiés.
- Dernière **production attestée**, selon les documents de reprise : `1.5.2.14-live-sync` ; candidate 1.5.2.15 **non livrée**, **HOLD**, `FIELD_ACCEPTED=NOT_ACCEPTED`, `realMoneyEnabled=false`. Les chiffres/SHAs doivent être revérifiés au moment de reprendre.

## C. Répartition opérationnelle des trois environnements
| Lieu | Peut faire | Ne doit pas faire |
| --- | --- | --- |
| **URAE privé** | Sources métier, PR, cahiers, tests critiques finances/rubriques/groupes/Discover/offline/sécurité, preuve SHA, release | Rendre public le code ou une archive ; ignorer des gates pour économiser |
| **UTRAE public** | Tests **indépendants et synthétiques**, présentation publique, accessibilité/composants audités et contrats non sensibles explicitement autorisés | Cloner URAE ; utiliser un PAT privé ; inclure ses algorithmes, packs, bundles, source maps, tests révélateurs, logs, données, docs ou historiques |
| **Cloudflare privé** | Workers/DO/D1/R2 déjà acquis, Workers Builds privés sous accès contrôlé, staging isolé, livraisons autorisées | Transformer D1/R2 en cache de sources publiques ; déployer sans gate ; utiliser D1 prod pour tests |

Les minutes GitHub privées, gratuites publiques et les minutes **Workers Builds** Cloudflare sont des budgets séparés. **Les 3 000 minutes Cloudflare Builds ne signifient pas 3 000 minutes supplémentaires de tests GitHub ni de requêtes D1.** Ne supposer aucun quota restant sans lecture effective des paramètres de facturation des comptes.

## D. Première reprise concrète — sans Ubuntu local, sans dépense
### D0 — Protection / inventaire
1. Lire `docs/operations/URAE_UTRAE_CONFIDENTIALITE_CI_2026-10-10.md` et `docs/operations/AUDIT_INITIAL_CI_2026-10-10.md`. Ces documents existent sur la PR privée de gouvernance #79 ; ne pas supposer qu’ils sont déjà fusionnés sur la branche applicative.
2. Vérifier dans GitHub les visibilités, collaborateurs, permissions `Actions`, protections de branche et exigences de PR. Le connecteur de lecture ne peut pas confirmer les règles de protection (403) ; ce contrôle doit être fait dans l’interface GitHub.
3. Vérifier les consommations **réelles** GitHub du propriétaire `Serge-As` et Workers Builds Cloudflare, puis enregistrer les limites et la date de remise à zéro. Aucune confirmation du quota gratuit ne doit être inventée.
4. Comparer les workflows de la branche applicative ; 66 fichiers ont été repérés, ce qui **n’implique pas** 66 exécutions. Ne désactiver aucun test, aucun workflow de sauvegarde, aucun contrôle de sécurité sans mesure par run et équivalence démontrée.

### D1 — Retrouver la bonne source en espace privé
Dans une machine de travail **privée de confiance** disposant déjà de Git/Node 24, ou une machine Linux/macOS cloud accessible au propriétaire **dans une enveloppe gratuite vérifiée** :
```bash
git remote -v
git fetch origin --prune
git status --short
git rev-parse HEAD
git branch --show-current
git show --no-patch --format=fuller a7c333699dad0d70cf0de8e2f8a841a00396d0d7
```
**Ne pas** réécrire `main`, faire de force-push, purger un dossier de travail non sauvegardé ni synchroniser URAE avec UTRAE. Pour la preuve candidate, travailler sur une branche privée créée depuis le commit exact, en conservant une copie vierge du SHA de référence. Les branches documentaires ultérieures n'en changent pas le contenu testé.

### D2 — Diagnostiquer sans affaiblir les scénarios
- **Priorité n°1 :** premier QR Chromium Windows, délai inchangé de 30 secondes. Reprendre le **diagnostic passif** documenté `docs/qualification/QR_WINDOWS_HANDOFF_2026-10-09.md` ; contrôler `node --check`, utiliser le vrai SDK/Worker et le même SVG ; observer les étapes réellement bloquées. Un `BarcodeDetector.getSupportedFormats()` sans borne est une piste source, **pas une cause Windows prouvée**.
- **Priorité n°2 :** WebKit 6/6 réel sur environnement Linux/macOS avec ICE/WebRTC natif opérationnel. Avant la suite lourde, exécuter un **test de connexion DataChannel réel** ; ne pas simuler, désactiver sandbox, injecter faux candidats ICE, supprimer A01 ou allonger les seuils pour obtenir un PASS.
- Le cloud du 9 octobre ne disposait pas de candidats ICE. Un échec de l’environnement n'est pas une preuve de défectuosité produit ; il ne vaut pas un test réussi.
- Codespaces gratuit deux cœurs peut être envisagé uniquement si son quota et **zéro dépense** sont confirmés dans le compte. Ni Codespace, ni Actions payantes, ni Ubuntu local ne sont des prérequis imposés.

### D3 — Qualification complète, même SHA, puis preuves
Après résolution des blocages **sans changer les seuils de recette** :
```bash
npm ci --ignore-scripts
node scripts/qualify-eco-locally.mjs --skip-browser-install --output-root=/CHEMIN_PRIVE_DE_RESULTATS
```
Le drapeau `--skip-browser-install` n’est permis que si les **binaires exacts Playwright 1.56.1 existent déjà et démarrent** ; sinon consulter l’aide du lanceur et installer en espace privé autorisé. Le lanceur applique la preuve de régression ancienne/nouvelle, la CI gouvernée et les navigateurs. Une réussite revendiquée doit contenir les comptes réellement exécutés, dont les **657 Node / 8 Chromium / 6 WebKit** prévus pour cette candidate, zéro skip/cancel et les assertions de synchro inchangées, ainsi que SHA/tree, rapport natif et archive SHA-256. Si le nombre de tests augmente légitimement, documenter le nouveau contrat sans réduire la couverture.

### D4 — Reprendre l’implémentation métier pendant HOLD
Le HOLD n’interdit pas de travailler sur de **nouvelles branches privées**. Pour chaque lot :
1. Préambule : source + exigences du Cahier/RI et des conversations + problème reproduit + dépendances.
2. **Une autorité canonique** par capacité : Ledger/D1 pour finance, RubricDefinition/Policies pour rubriques, Membership pour adhésion, Living Rules pour règles, transport/outbox pour intentions/offline ; **reuse before build**.
3. Changement ciblé, tests de caractérisation puis tests négatifs, sans régression du shell, saisie ✓/Entrée, remplacement exact, offline/Outbox, permissions, intérêts, prêts, répartition, confrontation, Live, iOS/Android, RECAP, clôture.
4. PR privée, diff minimal, preuves source/test par SHA. Ne pas annexer d’artifact privé à UTRAE.
5. Différencier **fonction prête au code**, **qualifiée**, **recettée terrain** et **déployée**. L’implémentation suivante ne suppose jamais une candidate sous HOLD déjà livrée.

### D5 — Intégration / livraison sous contrôle
- Traiter le conflit de fusion de la PR #72 **après** identification de la base et des commits candidats ; préserver les deux historiques et toutes les preuves de défaillance. Pas de merge « pour débloquer ».
- Condition de livraison : source exacte propre, tests intégralement exécutés et PASS, sécurité, finance/offline/live, WebKit réel, backup BIR+ contrôlé, revue de confidentialité, gate de déploiement autorisé, smoke `/health` **du SHA effectivement déployé**, puis recette terrain des appareils.
- Aucun passage à `realMoneyEnabled=true` implicite. Aucune écriture dans D1/R2 de production ni modification de secrets, migrations ou exposition Cloudflare pendant cette procédure.
- Tout échec ou manque de quota laisse le candidat en HOLD ; la poursuite **du développement privé** reste possible avec preuve locale ciblée et statut non qualifié.

## E. Optimisation de l’énergie CI — sans « progression régressive »
1. Examiner l’historique **30 jours** des runs : par workflow, commit, événement, durée de job, type runner, nombre de reprises, motifs d’échec. Les échecs en 3 secondes nécessitent consultation des jobs et facturation, ils ne prouvent pas des échecs métiers.
2. Mesurer les chevauchements `eco-15212-pr-qualification`, `eco-q01-q28-qualification`, `qualify-1.5.2.10-offline-conflicts-loans`, les preuves de confrontation et gates de release. **Aucun raccourci** avant de prouver même SHA, mêmes garanties, même couverture.
3. Sur branches expérimentales uniquement : filtres chemin **après cartographie de dépendances**, `concurrency` contre runs obsolètes, installation verrouillée/caches sûrs. Sur release : toujours gate complet.
4. UTRAE n’héberge que son CI public autonome ; son workflow doit exécuter la liste blanche pour toute modification, sans cacher qu’un push public expose immédiatement le fichier. Protéger `main` par revue avant fusion et limiter les droits d’écriture.
5. Cloudflare Builds pour builds réels gouvernés, seulement après validation d’accès au dépôt privé, préproduction isolée et confirmation des quotas. Ne pas réorienter les historiques d’archives vers le dépôt public.
6. Objectif indicatif **100 minutes privées/jour** (soit environ 20 jours pour 2 000 minutes). C’est une cible de suppression de gaspillage, jamais une limite aux tests nécessaires ni une garantie commerciale.

## F. Vérification finale de préparation à la reprise
| Contrôle | Critère |
| --- | --- |
| Secrets et IP | URAE privé ; UTRAE strictement synthétique ; aucune copie transférée |
| Compte / transfert | `Serge-As` vérifié ; droits et remotes inspectés |
| Base de source | candidate `a7c3336` identifiée ; branche preuves `6f06d6` distinguée |
| Productivité | développement privé autorisé sous HOLD, sans mise en production |
| Gate navigateur | WebKit réel 6/6 encore requis ; QR Windows à diagnostiquer |
| Coûts | facturation vérifiée avant Codespace/Build/runner, zéro achat implicite |
| Livraison | 1.5.2.14 production attestée ; 1.5.2.15 **NOT RELEASED** |

## G. Prompt de reprise prêt à donner à l’agent implémenteur
> Travaille exclusivement dans le dépôt **privé `Serge-As/urae`**, sans copier de code/docs, tests ou artefacts dans `Serge-As/utrae` public. Lis `AGENTS.md` puis toutes les autorités dans l’ordre prescrit, et les présentes consignes. Établis SHA, source, branche et tests réels. La candidate code a7c3336 est sous HOLD ; la branche preuves 6f06d6 n’est pas une candidate nouvellement qualifiée. Reprends d’abord le diagnostic QR Windows réel et la qualification WebKit avec ICE réel, sans changer les délais ni contourner les tests. Continue les lots d’implémentation métier sur branches privées par propriétaires canoniques, sans couper de fonctionnalités. Préserve l’interface, les 10 étapes, rubriques, multi-tontines, crédits, intérêts, répartition, RECAP, offline/Outbox, Eco Relay, Live, Group Doctor, Discovery, Marketplace et les garde-fous. Aucun achat, Ubuntu sur le PC, publication publique, modification D1/R2, secret ou livraison 1.5.2.15 sans qualification intégrale, archivage et smoke exact. À chaque étape, distingue modifié / exécuté / PASS / FAIL / déployé ; conserve les preuves natives et actualise les checkpoints privés.

**Note de procédure :** ce document établit le chemin de reprise, il **ne représente pas** un résultat de test ni une autorisation de release.
