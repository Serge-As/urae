# UTRAE — politique P0 de publication
Destination publique : SergeDelor/utrae. Source privée : SergeDelor/urae.
Ne pas modifier Delor85. Ne jamais publier ni refléter les branches/tags/commits/historique Git du dépôt privé.

## Règle : PRIVATE BY DEFAULT
AUCUN fichier original n'est publiable sans revue explicite. Toute nouvelle fonctionnalité est automatiquement confidentielle. Les assets JS servis au navigateur sont récupérables, même si le dépôt d'origine reste privé; aucune obfuscation ne résout ce problème.

Confidentiels par défaut, incluant mais dépassant cette liste :
- Cahiers, architecture, prompts, roadmap, gouvernance, modèle économique, logs, archives, souvenirs, captures, analyses, tests révélateurs, fichiers compressés, .bootstrap/, .recovery/, docs/, governance/, AGENTS.md, PROJECT_STATE.md.
- Rubriques (packages/rubrics, rubric-exceptions, misc-rubrics), règles, exceptions, création, paramètres, lancements et scripts UI launch-rubrics/misc-rubrics.
- Discover (packages/discovery, value-discovery, opportunity-graph, economic-intelligence), scoring, algorithmes, recommandations et interface value-discovery.
- Groupes, membres, séances et rôles : packages/group-*, member-*, meeting-*, domain, application, pairing, succession, group-documents et toutes interfaces associées.
- Intérêts, prêts, finances, recaps, wallet : packages/finance, loan-simulator, savings-yield, prepayments, expenses, recap-engine, economic-engine, repositories, imports, wallet, market, trust.
- Authentification, identité, sécurité, consentements, droit d'accès : packages/auth, identity-proof, group-identity, commercial-preferences, quiet-watch, offline*, relay.
- Cockpits et pilotage : packages/operational-cockpit, founder-*, business-studio, ad-manager, growth-referral, community*, interest-communities, innovation, guided-assistant, notifications, ecopulse.
- Tous les workers/, cloudflare/, scripts/, tests/, .github/, packages/ et apps/web/ sources restent non autorisés, de même que les fichiers inconnus. Un futur frontend public sera reconstruit/revu module par module; ne pas copier la version courante.

## Liste blanche initiale
Seuls les fichiers synthétiques, ne dépendant pas du code original, sous public-release/utrae/ sont actuellement approuvés. Il s'agit d'un simple squelette d'outillage public, PAS de l'application fonctionnelle. L'exporteur scripts/prepare-utrae-public.mjs n'en copie qu'une liste explicite.

## Conditions obligatoires avant la publication des fonctions métier
1. Sauvegarde vérifiée et inventaire de toutes les branches et artefacts privés.
2. Audit des secrets (y compris commits, logs, archives, sourcemaps et sources JS publiés), rotation de tout secret exposé.
3. Séparation réelle de la logique métier côté serveur dans un Worker privé. D1/R2 sont du stockage privé, pas un écran de confidentialité pour des JS distribués aux clients.
4. API protégées, règles d'autorisations et audit, base de staging différente de la production.
5. Compatibilité hors ligne : IndexedDB tontine-platform et Outbox inchangées; validation serveur des écritures financières, sans données réelles en test.
6. Export autorisé dans un dépôt à HISTORIQUE VIERGE. Ne jamais importer .git depuis urae; ne jamais faire un git push --mirror.
7. Tests de confidentialité, source/build, mobile, finance et régressions avant toute vraie livraison. CI publique limitée et sans jetons privés ni runner personnel exposé aux PR.

Une publication GitHub, même courte, est irréversible vis-à-vis des copies externes. Aucun dépôt public n'est encore créé par cette politique.
