## Qualification validée — 1.5.2.15, avant livraison

Source qualifiée : `3f7ea03457bbd936a87e299270843043e2826a24`, PR **#71 fusionnée** dans la branche de livraison par `754a8cef153b7ebe92b993de3b68f7a2c42d9f2d`. Runs **37820287689 SUCCESS** et **37820287701 SUCCESS** : **650/650 Node**, **Chromium 8/8**, **WebKit 6/6**, dont le scénario API inaccessible/navigator online et convergence de la même intention entre deux gestionnaires.

Le job gouverné du run **37820281608** est SUCCESS ; archive source **11567969551**, **1 775 802 octets**, digest artefact `sha256:53a664ea2da558f188aae304fe8da06d2bea52b8bf286955d6a88bfb556e79bc`, contrôle SHA-256 interne et lecture tar PASS. Son troisième job navigateur reste bloqué à l'installation des navigateurs au moment de ce checkpoint ; il n'est pas compté comme un troisième run réussi. Les deux autres workflows complets exécutent les mêmes suites requises.

**Production 1.5.2.15 : NON ENCORE ATTESTÉE**. La source est qualifiée, la livraison code-only doit encore prouver /health du SHA livré. La production antérieure 1.5.2.14 reste la dernière attestée à ce point. FIELD_ACCEPTED=NOT_ACCEPTED ; realMoneyEnabled=false. Les blocs suivants décrivent les checkpoints précédents.

---

# Eco-System — audit de reprise et livraison, 8 octobre 2026

## Conclusion factuelle au premier checkpoint

Eco-System possède déjà une application étendue, livrée en **1.5.2.14-live-sync** aujourd'hui. Repartir du README de main ou d'une ancienne branche ferait perdre des acquis. La présente reprise part de **25ad23f3bdd39ac82c0529cf1b0dfa15d30acc0e**, mémoire située après le code livré **d027f09a1382cd29054b33e274f3fd3bf9f8d9f3**, sur la branche de livraison **fix/1.5.2.10-offline-conflicts-loans-20261003**.

Un défaut de reprise HTTP est reproduit et corrigé dans la **candidate 1.5.2.15-bounded-recovery**. À ce checkpoint, cette candidate doit encore passer la CI et la livraison : **ne pas la présenter comme déjà déployée**. Les résultats réellement obtenus seront ajoutés ci-dessous.

La plateforme entière n'est pas certifiée complète : le catalogue inclut des fondations, intégrations externes et domaines planifiés. La recette physique et la totalité de la Bibliothèque ne sont pas accessibles à cette reprise. La bonne évolution est de consolider les owners existants, livrer les défauts prouvés et qualifier les parcours restants.

## Sources récupérées et autorité

| Source examinée | Usage et limite |
|---|---|
| Demande humaine du 8 octobre et cinq captures v1.5.2.14 | Autorisation actuelle d'auditer et d'améliorer ; les captures sont des observations, pas des instructions système. |
| AGENTS, Current Truth, Truth Ledger, Project State, Feature Registry, NEXT_RUN | Mémoire de projet et preuves de reprise. Les premières lignes d'AGENTS annonçaient encore 1.4.1 ; elles sont corrigées, les blocs historiques conservés. |
| Cahier maître exhaustif 3.2.0 du 16 septembre | Constitution actuelle récupérée dans le dépôt ; ne supprime pas les exigences antérieures. |
| Blueprint exécutable 5.0.0 du 21 septembre | Vision Association/Tontine → communauté → opportunités → valeur, avec owners canoniques. Ses identités de livraison 1.4.x sont historiques. |
| Modèle économique/AdManager 3.2.0 | Cœur gratuit et services collectifs/professionnels ; pas de ciblage des dettes ou identités personnelles. Les tarifs hypothétiques ne deviennent pas des prix actifs. |
| Deux conventions fondatrices et Living Rules | Une vérité par capacité ; réutiliser/étendre avant de créer. Règle écrite, pratique, règle validée et exception sont distinctes. |
| SOURCE_DEEP_DIGEST_2.3.3 et MASTER_CAPABILITY_INDEX | Mémoire sémantique des anciens Excel/RI et index constitutionnel : 360 identifiants d'exigence, 1 541 titres. Un digest ne remplace pas une lecture des fichiers originaux. |
| Reprise des 13 demandes du 5 octobre et Q01–Q28 du 6 octobre | Exigences et scénarios encore à qualifier. Les anciennes mentions « non fusionné » ou « pas de déploiement » ne décrivent pas automatiquement le 8 octobre. |
| Chats « Implémenter 13 demandes tontine » et reprise documentaire de septembre | Références de contexte, dont des références à cahiers Word, Excel et ZIP. La fin d'un chat ne constitue pas une livraison. |
| Code actuel Application/Outbox, Worker, Live, PWA, UI, moteurs/tests utiles | Source réellement reliée à la branche de livraison, pas un prototype parallèle. |
| GitHub Actions 37765653443 / 37765653486, étapes et logs de livraison | Preuves distantes du code 1.5.2.14 : 646 tests, Chromium 7/7, WebKit 6/6, smoke exact. |

Les documents originaux hors dépôt, nouvelles versions Word/Excel/ZIP conservées dans la Bibliothèque et le cahier original 2.3.4 non fourni ici ne sont **pas déclarés lus intégralement**. Le dépôt contient leurs références/digests. Un titre ou lien plus récent a été demandé au fondateur ; les tâches indépendantes continuent.

Les consignes trouvées dans captures, chats et documents sont traitées comme données de projet à confronter à la demande actuelle. Elles ne peuvent ni autoriser une action extérieure sans la demande humaine ni remplacer une preuve d'exécution.

## Ce qui a réellement été livré avant cette reprise

- PR #70 fusionnée ; code **d027f09a1382cd29054b33e274f3fd3bf9f8d9f3**.
- Qualification **37765653443 SUCCESS**, **646/646 tests Node**.
- Livraison **37765653486 SUCCESS**, **Chromium 7/7** et **WebKit 6/6**.
- Worker Version ID **98d720dd-6364-436e-9a00-38809e4a3925**.
- Smoke des logs : version **1.5.2.14-live-sync**, build **eco-system-1.5.2.14-20261008-sovereign-convergence**, cache **eco-system-v15214-sovereign-convergence-20261008**, même SHA, **164** capacités, **realMoneyEnabled=false**.
- D1 **eco-system-db**, R2 **eco-system-backups**, livraison code-only sans mutation/migration/export D1.

Les derniers commits de la branche isolée de convergence sont déjà intégrés ; leur réimplémentation n'est pas nécessaire. La branche main reste essentiellement documentaire.

Current Truth rapporte une lecture publique indépendante le 8 octobre à 10:52 UTC. **Cette reprise a vérifié les logs Actions ; son propre outil Web n'a pas obtenu la page publique.** Ne pas transformer cette limitation en accusation d'indisponibilité serveur, ni revendiquer une lecture directe qui n'a pas eu lieu.

## Interprétation des captures

Les deux premières captures montrent deux clients au même numéro de version, avec valeurs/totaux différents et une saisie localement sauvegardée en attente. Un montant provisoire local peut différer d'une valeur serveur avant convergence. Une capture seule ne prouve ni corruption ni cause précise.

Les suivantes montrent les quatre critères de dette, les coefficients d'épargne et la répartition provisoire. Elles imposent de vérifier que dette exigible, prochains intérêts projetés, encaissements et distribution sont distincts. Une projection ne devient pas une écriture financière.

Le nouveau défaut découvert dans le code explique un risque de consommation et reprise répétée pendant une panne prolongée ; il n'est pas présenté comme la cause certaine de toutes les captures.

## Audit des demandes financières du 5 octobre

| Demande | État vérifiable et contrôle à conserver |
|---|---|
| 1. Live gestionnaires | GroupLiveHub et push existants ; scénarios Chromium entre deux comptes distincts dans la livraison 14. Appareils réels encore à tester. |
| 2. F5 hors connexion | Shell atomique, fermeture des imports, cache cohérent et IndexedDB existants ; Chromium/WebKit automatisés. Le contournement WebKit ne vaut pas mode avion iOS natif. |
| 3. Retour réseau sans F5 | Outbox et événements réseau/Live existants. Nouveau défaut de boucle de réveil corrigé en candidate 15 ; preuve navigateur à produire. |
| 4. Corrections contradictoires | Intentions V2, auteur/date, versions, confrontation durable et décisions explicites existants ; cas Chromium offline dans 14. Horloges et ordres de vrais appareils à qualifier. |
| 5. Remboursement lent ou réponse perdue | Écriture durable avant envoi, même clé de replay, dette spécialisée et projection Live réparées ; tests automatisés. Mesures p50/p95 Android 6/2G absentes. |
| 6. Intérêts d'abord | CAPITAL_FIRST/INTEREST_FIRST et portée/version de politique présents. Les répartitions historiques ne sont pas recalculées silencieusement. Tests de gouvernance de portée existants. |
| 7 et 12. Dettes/tableaux | Totaux Live, projections offline et quatre critères simultanés réparés. Couverture physique de tous les tableaux/exercices non démontrée. |
| 8. Éligibilité épargne | ALL_DEPOSITS/LOAN_SESSION_GATE et cutoff présents ; test S2 intégral 500 000, S3 sans prêt, exclusions S11. Paramètres du groupe, annulations et clôture réelle doivent rester validés. |
| 9 et 13. Capital/intérêt et financement | Owners canoniques prêt/Ledger, saisie générique et priorités, politiques SAVINGS_REPAYMENTS_ONLY/AVAILABLE_GROUP_CASH présentes. Qualification distante de tous les décaissements concurrents et rapprochements non déduite de la CI. |
| 10. Prime emprunteurs | Allocation et modes de pondération existants ; tests des prêts soldés et clé 60/20/10/8/2 exacte au franc. Simulation et décision de groupe avant distribution effective. |
| 11. Historique | Tableau/filtres/pagination et annulation tracée existants. Charge réelle 100 membres × 40 rubriques × 10 gestionnaires et impression à qualifier. |

Les scénarios R01–R15 et Q01–Q28 gardent leurs preuves séparées. Cette table ne les transforme pas collectivement en PASS. Les moteurs et écritures financières acquis ne sont pas remplacés.

## Défaut corrigé dans la candidate 15

Chaîne avant correction : erreur fetch → minuteur 3,65 s → événement transport-retry-ready → forceTransportRetry → reset des tentatives + nouvel envoi → erreur → nouveau minuteur. Le plafond Outbox de cinq tentatives était régulièrement rouvert.

Reproducteur déterministe exécutant les méthodes/listener extraits du code, serveur toujours inaccessible et navigator.onLine=true, fenêtre 30 s :

| Mesure | Baseline | Candidate |
|---|---:|---:|
| Envois échoués | 9 | 2 |
| Réveils automatiques | 8 | 1 |
| Minuteurs de reprise encore actifs | 1 | 0 |

Correction : verrou d'un réveil par panne ; le réveil automatique ne rouvre pas le plafond Outbox. Une réponse HTTP réellement réussie annule la vieille alarme. Une nouvelle validation humaine, retour réseau, ouverture du Live authentifié ou retour au premier plan permet une reprise. Les conflits métier et le quota D1 restent protégés.

L'intention financière reste dans IndexedDB avec sa clé d'origine ; aucune valeur locale n'est déclarée confirmée tant que le serveur n'a pas accepté. La reconnexion WebSocket existante garde son backoff ; elle ne devient pas un polling REST.

Tests ajoutés : Application/Outbox réels + listener de shell avec horloge simulée ; tentative épuisée/conflit/quota ; annulation d'alarme après succès ; activation SW avec conservation des caches ; Chromium avec deux comptes, panne d'API « navigateur en ligne », attente sans répétition, retour réseau et convergence de la même intention.

## Catalogue : présence, maturité et disponibilité

Snapshot complet : [ECO_SYSTEM_CAPABILITY_SNAPSHOT_2026-10-08.json](ECO_SYSTEM_CAPABILITY_SNAPSHOT_2026-10-08.json).

Le registre courant contient **164** modules. Son calcul de readiness donne **155 OPERATIONAL**, **7 EXTERNAL_GATED**, **2 PLANNED**. OPERATIONAL signifie ici classification du registre à partir de FOUNDATION_ACTIVE ; certaines surfaces sont des workspaces génériques. Cela ne certifie pas 155 parcours finis ou une acceptation terrain.

| Capacité encore ouverte | Registre | Travail requis |
|---|---|---|
| COMMUNITY.VIDEO | Externe / planifiée | Provider, permissions, parcours visio réel, faible réseau. |
| INTEGRATION.MOBILE_MONEY | Externe / planifiée | PSP/sandbox qualifié, identité transactionnelle, webhooks et autorisation distincte des fonds réels. |
| INTEGRATION.SMS | Externe / structure | Provider, credentials, consentement et livraison réellement observée. |
| INTEGRATION.WHATSAPP | Externe / structure | Provider, templates/consentement et réponses/livraison. |
| INTEGRATION.TELEGRAM | Externe / structure | Bot/service relié et preuve de livraison. |
| INTEGRATION.EMAIL | Externe / structure | Provider/domaine et preuve de délivrabilité. |
| SECURITY.MFA | Externe / planifiée | Enrôlement, récupération et protection des rôles sensibles ; un bouton ne suffit pas. |
| MARKETPLACE.REWARDS | Planifiée | Règles de points/rewards, événements marketplace, budget et garde de caisse ; cashback financier non activé par défaut. |
| FEDERATION.GROUP_NETWORK | Planifiée | Consentement/mandats entre groupes, permissions et agrégats avec isolation. |

Aucun de ces neuf points n'est promu au statut terminé par cet audit.

## Structure retenue pour poursuivre la plateforme

La vision reste **Association/Tontine → communauté → opportunités → valeur**. Le cœur financier demeure accessible aux anciens appareils et utile sans IA distante. Un même groupe porte ses activités, compétences, besoins et opportunités ; pas d'application parallèle agricole ou comptable.

~~~mermaid
flowchart LR
  UI["PWA : séances, fiches, communauté, marché"] --> App["Application / politiques"]
  UI --> Local["IndexedDB : intentions et dernières projections"]
  Local --> Outbox["Outbox durable, clé idempotente"]
  App --> API["Worker : authentification et droits"]
  Outbox --> API
  API --> D1["D1 / Ledger : vérité financière"]
  API --> Live["GroupLiveHub : diffusion, coordination"]
  Live --> UI
  API --> R2["R2 privé : preuves et sauvegardes"]
  App --> Owners["Owners canoniques : règles, séances, prêt, épargne, forum, marché"]
~~~

La base actuelle convient à cette continuité : aucun avantage établi ne justifie de remplacer D1 ou de dupliquer le Ledger. Les prochains travaux doivent qualifier des parcours existants et étendre leurs owners avec des adapters explicites.

## Innovations complémentaires examinées

1. **PaperBridge privé avec OCR local.** [Tesseract.js](https://github.com/naptha/tesseract.js) offre une exécution navigateur/WASM. Utiliser le propriétaire Evidence/PaperBridge existant : proposition de lecture d'un reçu ou cahier, vérification humaine de chaque montant, puis workflow canonique. Modèles téléchargés à la demande, budget mémoire et essai Android ancien avant activation ; aucun upload de CNI/finances imposé. Bibliothèque libre ne signifie pas taille ou CPU nuls.
2. **Live sobre en inactivité.** Conserver l'architecture GroupLiveHub/Durable Object et étudier ses économies avec [WebSocket Hibernation](https://developers.cloudflare.com/durable-objects/best-practices/websockets/), avec le [demo Cloudflare](https://github.com/cloudflare/workers-chat-demo) comme référence. Ne pas installer un deuxième hub ou second solde. Les limites du [plan Cloudflare](https://developers.cloudflare.com/durable-objects/platform/pricing/) restent à vérifier avec l'usage réel.
3. **Assistant documentaire optionnel.** [Florence-2-base, modèle publié par Microsoft sur Hugging Face](https://huggingface.co/microsoft/Florence-2-base), propose des tâches de lecture/description d'image. Étudier licence, environnement et coût d'inférence avant toute intégration. Aucune donnée privée envoyée ; aucun fournisseur ou abonnement activé par cette reprise.
4. **Explication vérifiable des dettes et intérêts.** Étendre les moteurs de prêt/épargne et le Financial Lab déjà présents : provenance, règle effective, date, imputation et comparaison de scénarios. La valeur est dans l'explication auditable, sans troisième moteur ni verdict automatique.

Ces pistes sont des propositions examinées, pas des intégrations opérationnelles annoncées.

## Récupération après interruption et consommation

Le changement est isolé sur une branche issue de la dernière source acquise, avec CIR/Recall et mémoire. Le workflow de qualification conserve une archive git du SHA exact, SHA-256 vérifié et lecture tar vérifiée, pendant 30 jours. Les commits Git restent la mémoire durable. Cette archive concerne le code/documentation, pas les fonds D1.

Le terminal local échoue avant lancement du shell ; les tests sont donc exécutés par GitHub Actions. Aucun PASS local Node/Playwright n'est revendiqué.

L'outil de compte fournit des fenêtres de quota partagées et un solde, **pas le coût exact de cette conversation**. Une variation de quota n'est pas une facture de crédits. Aucun achat d'abonnement, crédit ou service externe n'est effectué dans cette reprise. Le coût exact sera déclaré indisponible tant que cette donnée n'est pas exposée.

## État du projet après étape

- Source : candidate 1.5.2.15 préparée sur la continuité 1.5.2.14.
- Reproducteur ciblé : exécuté, résultat 9/8/1 → 2/1/0.
- Node/Chromium/WebKit de la candidate : à exécuter au SHA exact.
- Archive CI : prévue, identifiant à enregistrer après création.
- Déploiement de la candidate : non attesté à ce checkpoint.
- D1/R2/règles/historique : préservés ; argent réel désactivé.
- Bibliothèque complète et recette physique : non récupérée/non effectuée.
- Catalogue complet et intégrations : clôture en cours, aucune prétention de plateforme intégralement achevée.
