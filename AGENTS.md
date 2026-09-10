# AGENTS.md — Eco-System / Plateforme Tontines & Associations

## Mission
Continuer le produit réel Eco-System selon sa Constitution versionnée, sans jamais recommencer depuis zéro. Priorités : intégrité, richesse métier historique, simplicité terrain, faible coût, offline honnête, accessibilité vieux appareils, confidentialité et non-régression systémique.

## Ordre obligatoire avant tout code — MEMORY BEFORE CODE
Lire dans cet ordre :
1. `AGENTS.md` ;
2. `docs/memory/CURRENT_TRUTH.md` ;
3. `docs/memory/PROJECT_TRUTH_LEDGER.json` ;
4. `PROJECT_STATE.md` ;
5. `docs/constitution/ECO_SYSTEM_Cahier_des_Charges_Maitre_Exhaustif_Sauvegarde_2.3.4_2026-09-05.md` puis toute décision plus récente versionnée ;
6. `docs/engineering/ECO_SYSTEM_Playbook_Developpement_Memoire_GardeFous_2.3.1.md` ;
7. `FEATURE_REGISTRY.yaml` ;
8. `NEXT_RUN.md` ;
9. CIR/ADR/recalls pertinents ;
10. lancer `node scripts/memory-recall.mjs "<chantier>" --write` avant toute modification substantielle.

Le dernier prompt n'est jamais la totalité du besoin. Une absence dans un résumé, une maquette, un écran ou le dernier chat ne signifie jamais suppression.

## Sources de vérité
1. Métier : Cahier Maître Eco-System 2.3.3 + décisions ultérieures explicitement versionnées. 2.3.3 conserve 2.3.2/2.3.1 et ajoute la réingestion forensic profonde + vérité opérationnelle anti-régression ; les sources brutes privées ne sont requises que pour audit/ambiguïté.
2. Implémentation : code + tests réellement exécutés.
3. Production : état Cloudflare réellement vérifié, jamais supposé depuis un ancien compte-rendu.
4. Mémoire : Project Memory Vault + `MASTER_CAPABILITY_INDEX.json` + Caverne d'idées + recalls.
5. Corpus fondateur privé : utilisable pour comprendre et tester, mais jamais publié brut sans autorisation.

## Source Ingestion avant Recall
- Toute nouvelle archive/document historique utile est d'abord inventorié, fingerprinté et ingéré/anonymisé avant d'être utilisé comme mémoire de projet.
- Les SHA-256 et enseignements anonymisés peuvent être versionnés ; les PII et archives brutes privées ne le sont pas par défaut.
- `docs/memory/MASTER_CAPABILITY_INDEX.json` est l'index machine du Cahier Maître, pas un remplacement du texte source.
- `docs/memory/SOURCE_DEEP_DIGEST_2.3.3.json` conserve les sémantiques historiques anonymisées ; aucune donnée personnelle/credential brut ne doit y entrer.
- Toute idée utile non retenue reste retrouvable (`DORMANT`, `REJECTED_FOR_NOW`, `SUPERSEDED` avec raison) au lieu d'être effacée.

## Règle RI / Statuts — APPRENDRE SANS UNIVERSALISER
Eco-System, ses IA, Codex et tout agent doivent apprendre continuellement des statuts, règlements intérieurs, règlements financiers, PV, formulaires et autres textes de groupes pertinents afin de mieux comprendre les groupes, rubriques, caisses, prêts, assistances, obligations et gouvernances.

Mais :
- un RI bien rédigé décrit **ce groupe**, pas tous les groupes ;
- le nom d'une rubrique n'est jamais sa sémantique ;
- une rubrique peut être entrée, sortie, mixte, nature, obligation, remboursable, non remboursable, reconstituable, liée à un événement ou combinaison de plusieurs modèles ;
- toute extraction devient d'abord un **knowledge claim sourcé** avec provenance et statut ;
- l'IA peut suggérer une correspondance ou une règle, mais ne peut pas activer seule une règle financière, de gouvernance, de sanction ou d'exclusion ;
- les apprentissages inter-groupes proviennent seulement de sources publiques, consenties ou agrégées/anonymisées ;
- une observation terrain ne devient jamais une norme universelle sans validation.

Voir `docs/memory/GOVERNANCE_CORPUS_PROTOCOL.md`.

## Règle Discovery / confiance
- Discovery expose des projections publiques/opt-in, jamais les tables privées du groupe.
- Les groupes `SECRET` ne sont pas énumérables ; les groupes `INVITE_ONLY` ne deviennent pas librement adhérables.
- Téléphone/email exacts ne servent jamais d'annuaire public ; anti-enumeration obligatoire.
- La proximité est grossière/consentie par défaut, pas une localisation précise silencieuse.
- **Richesse, apparence, prestige, train de vie ou richesse supposée ne sont jamais des signaux de sérieux.**
- La fiabilité est contextuelle à un niveau/type d'engagement, fondée sur preuves comportementales, taille d'échantillon et confiance, explicable et contestable.
- Pas de blacklist ou exclusion automatique sur prédiction. Fraude avérée peut déclencher les politiques prévues, avec preuve, habilitation et recours.

## Charte d’évolution
- Une activité métier = une autorité/service canonique.
- UI, Ultra Simple, Oral, IA, API, imports et dashboards réutilisent les mêmes services métier.
- Compléter/fusionner avant de dupliquer.
- Avant remplacement : tests de caractérisation + parité + migration + rollback.
- Coexistence de moteurs similaires uniquement temporaire, feature-flaggée, avec stratégie de sortie.
- Pas de couche de contournement si un refactor contrôlé du service canonique est possible.
- Après trois couches sur la même responsabilité, revue de consolidation obligatoire.
- Ne jamais supprimer une fonction utile pour corriger un bug non démontré.

## Invariants critiques
- Multi-tenant strict.
- Ledger append-only pour écritures financières.
- Idempotence des mutations.
- Donnée inconnue != zéro/succès.
- Fonds de groupe, wallet, cashback, points et business privé séparés.
- Offline : aucune fausse confirmation financière.
- RBAC + ABAC + scope groupe/rubrique/opération ; serveur autoritaire.
- Audit des actions sensibles.
- IA non décisionnelle pour argent, sanction, vote, accusation ou exclusion.
- Secrets jamais dans repo, logs, docs, frontend, tests ou prompts.
- Dépendance payante non essentielle interdite par défaut.
- `realMoneyEnabled=false` reste la valeur sûre jusqu'à autorisation explicite séparée.

## Architecture
- Monolithe modulaire / monorepo léger ; pas de microservices/Kubernetes sans preuve du besoin.
- Les modules de domaine ne dépendent pas de l'UI ni du fournisseur Cloudflare.
- Interactions inter-domaines via contrats/services/événements documentés ; pas de lecture sauvage des tables d'un autre domaine.
- Mode Ultra Simple, mode complet, Oral/IA et API partagent le même domaine.
- Cloudflare D1 reste derrière `PlatformRepository` ; le domaine ne connaît pas D1.

## Tests obligatoires
- Toute correction reproductible ajoute un test de non-régression.
- Toute refonte d'un service stable commence par des tests de caractérisation.
- Toute mutation critique teste selon pertinence : double clic, retry, deux appareils/concurrence, rôle insuffisant, tenant voisin, coupure réseau, donnée ancienne, conflit de version.
- Les tests du module ne remplacent pas les contrats transversaux.
- `npm run ci` doit inclure typecheck, architecture, constitution, Memory Gate, index mémoire, tests et build.

## Coût et performance
- Protéger bundle, CPU, requêtes, D1 rows, stockage, données mobiles, batterie et coût IA.
- Finance/auth/offline critique passent avant média, publicité, analytics décoratif et IA cloud en ressources contraintes.
- Pas d'appel payant ou IA cloud par défaut si une règle locale suffit.

## Règle Project Truth — anti-recréation / anti-fausse-progression
- Avant de demander au fondateur de créer/configurer une ressource, consulter `CURRENT_TRUTH.md` puis `PROJECT_TRUTH_LEDGER.json` et vérifier l'état externe si possible.
- Un élément `ACQUIRED` ou `VERIFIED_*` ne doit jamais être redemandé comme prérequis à créer ; on vérifie seulement son fonctionnement si nécessaire.
- `VERIFIED_LOCAL` ne signifie jamais `DEPLOYED` ; `MEMORY_ONLY` ne signifie jamais `IMPLEMENTED`.
- `SUPERSEDED` et `ABANDONED_WITH_REASON` restent conservés avec motif.
- Les valeurs de secrets ne sont jamais écrites dans ce registre ; seul leur existence/nom de variable peut être enregistré.
- Toute exécution distante qui change un fait (PR, CI, D1, Worker, migration, déploiement) met à jour le Truth Ledger dans le même chantier ou immédiatement après.

## Git / Cloudflare / livraison
- Travail isolé par branche/PR ; ne jamais force-push `main`.
- Secrets Cloudflare dans GitHub Actions ; ne jamais les imprimer ni demander au fondateur dans le chat.
- Migrations non destructives/idempotentes autorisées dans le cadre convenu ; toute migration destructive exige autorisation séparée.
- Argent réel, suppression de données production, achat de service et modification de secrets exigent autorisation spécifique.
- Le binaire/commit qualifié doit être celui livré.
- Un nom de branche comme `0.5.0` n'est pas une preuve : vérifier commit, contenu, CI et production.

## Multi-agent
Agents parallèles seulement pour tâches indépendantes. Ledger, auth/policy, migrations et mêmes machines d'état ne sont pas modifiés simultanément par plusieurs agents sans coordination explicite.

## Définition de fini
Ne jamais déclarer « toute l'app terminée » sans preuves CI, E2E, migrations, déploiement, sécurité, récupération et critères d'acceptation. Dire exactement `STRUCTURAL`, `FUNCTIONAL_ALPHA`, `VERIFIED`, `DEPLOYED`, `PILOT_VALIDATED` ou `PRODUCTION_APPROVED`.

## Procédure obligatoire de sauvegarde / reprise
Lire et appliquer `docs/governance/ECO_SYSTEM_PROCEDURE_OBLIGATOIRE_SAUVEGARDE_REPRISE_1.0.0.md`. Une étape substantielle n'est pas terminée sans sauvegarde de vérité, preuve proportionnée et point de reprise indépendant du chat.

## Fin de toute tâche substantielle
Toujours : commit cohérent → tests → `PROJECT_TRUTH_LEDGER.json`/`CURRENT_TRUTH.md` si la vérité change → `PROJECT_STATE.md` → `FEATURE_REGISTRY.yaml` → `NEXT_RUN.md` → Memory Recall/CIR/ADR → bloc **ÉTAT DU PROJET APRÈS CETTE ÉTAPE**.

Rapporter : version, branche, commit, PR, GitHub, Cloudflare, DB/migrations, artefacts, problème, cause, correction, fichiers modifiés, tests, résultats, acquis, reste, ce qu'il ne faut pas modifier, point de reprise, régression possible, autorisation nécessaire.

## Founder Product Brief rule
**The Founder Product Brief is additive, never exhaustive. Missing-from-brief does not mean removed-from-product.**
