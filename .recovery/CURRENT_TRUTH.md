# ECO-SYSTEM — CURRENT TRUTH

## CURRENT OVERRIDE — 1.5.0 AUDIT COMPLETE DEPLOYED (2026-09-23)

Production publique : `https://eco-system.sergemimf.workers.dev/`.
Version runtime : **1.5.0-audit-complete**.
Source déployée : `8283c5383db99d26a14f388a0890d15251b4dd87`.
Build ID : `eco-system-1.5.0-20260923`.
PWA cache : `eco-system-v150-audit-complete-20260923`.
Catalogue production : **158 capacités**.
Stockage artefacts : **R2**.
Argent réel : **DÉSACTIVÉ**.

Preuve production : workflow `35832177188` — **SUCCESS**. Le workflow a exécuté la CI complète avant mutation, résolu la D1 existante et le R2 existant, exporté la D1 avant déploiement, appliqué uniquement les migrations additives, déployé Worker/PWA/cron puis vérifié root + /health + catalogue + SHA exact. Artifact de récupération : `eco-system-pre-1.5.0-8283c5383db99d26a14f388a0890d15251b4dd87`, ID `10738091343`.

Acquis 1.5.0 à préserver : correction financière atomique/versionnée/idempotente ; séance explicite ; consensus multi-gestionnaires ; prêt séparé et intérêts stoppés après extinction du capital ; historique membre paginé ; compte local et migration d’identité reprenable ; shell PWA atomique ; corbeille six mois + maintenance serveur ; pétition/reconstitution 2/3 sans transfert automatique ; Value Network ; Business Studio ; Marketplace stock/fournisseur/crédit ; Referral ; Knowledge/Encyclopédie ; Academy ; Control Center à preuve ; ergonomie senior/mobile.

Décisions fondateur : le groupe successeur décide de ses actions sur actifs/dettes/contestations et peut ouvrir un dossier/plainte ; après six mois la purge vise la disparition des données métier, avec seules traces techniques/statistiques minimales non reconstructives.

Garde-fous : D1 `eco-system-db` jamais recréée ; migrations additives ; Ledger unique ; argent réel OFF ; dix étapes ; Collation ; multi-tontines ; RECAP ; Community/Forum/Live ; historique conservé ; aucune capacité déclarée terrain-acquise sans preuve terrain.

Validation distincte : la CI générale 1.5.0 est verte. Le smoke WebKit automatisé est une preuve navigateur séparée et ne remplace jamais une recette iPhone/iPad physique installée depuis l’écran d’accueil.

Point de reprise : branche `next/1.5.0-audit-complete-platform-20260923`, PR #13. Toujours relire le HEAD distant, cette vérité et la dernière CI avant toute nouvelle modification. La production doit être comparée au SHA déployé ci-dessus, pas supposée égale au HEAD documentaire ultérieur.

---


Date : 2026-09-16

## 1. Vérité à ne pas confondre

### Production publique actuelle
- URL : `https://eco-system.sergemimf.workers.dev/`
- dernière ligne de production qualifiée documentée : `1.2.0-functional-completion`
- Worker : `eco-system`
- D1 canonique : `eco-system-db`
- argent réel : **DÉSACTIVÉ**

### Ligne de développement qualifiée
- branche : `next/1.3.1-recovery-recap-services-20260915`
- base préservée : `next/1.3.0-guided-ai-live-20260915@ffee0901720b453167783868c10a59a484c61677`
- 1.3.1 n'est pas déclarée déployée sur le Worker public tant qu'un workflow de production séparé n'est pas autorisé et qualifié.

### Premium Live pilote isolé
- Worker : `eco-system-live-pilot`
- D1 : `eco-system-live-pilot-db`
- URL : `https://eco-system-live-pilot.sergemimf.workers.dev/`
- qualification end-to-end : run `35018989303` — **SUCCESS**
- preuve : Ledger → projection outbox → avis membre → Durable Object → flux Live.
- Worker Version ID de cette preuve : `ac345e24-c622-492c-8410-0949fe2dd027`
- `realMoneyEnabled=false`

## 2. Qualification 1.3.1

La qualification de base avant extension Partenaires/ONG : run `35018989468` — **151/151 PASS**.

Les extensions Partenaires/ONG et les documents 3.0 sont ensuite qualifiés à chaque push sur la même branche. Toujours vérifier le dernier run avant toute modification.

## 3. Acquis anti-régression

- création en **10 étapes** ;
- libellé **Collation** ;
- plusieurs tontines par groupe ;
- participants propres à chaque tontine ;
- argent/nature/mixte ;
- Tontine Manager permanent ;
- part `SERVED` seulement avec preuve Ledger ;
- Ledger canonique D1 ;
- outbox transactionnelle pour projections Live ;
- panne Live ≠ échec d'une écriture financière déjà commitée ;
- replay Live au-delà de la séquence 500 ;
- OFF explicite prioritaire sur BETA_OPEN ;
- RubricDefinition + policies composables ;
- assistant RI policy-aware + contradictions ;
- calcul Épargne/intérêts **par dépôt/période** ;
- coefficients Legacy 9,8,7,6,5,4,3,2,1,0.5,0,0 ;
- distribution exacte par plus grands restes ;
- RECAP financier + RECAP de séance ;
- carryover Secours par membre et autres fonds structurés ;
- CNI matching HMAC sans numéro brut dans le moteur de rapprochement ;
- profil économique pseudonymisé par groupe/rubrique ;
- AdManager spécialisé ;
- moteur demande agrégée/fournisseurs/unit economics ;
- Forum/Hubs et communautés d'intérêt ;
- Partners/ONG spécialisés avec share packs agrégés expirants/révocables.

## 4. Documents de référence nouveaux

- `docs/constitution/ECO_SYSTEM_Cahier_des_Charges_Maitre_Exhaustif_3.0.0_2026-09-16.md`
- `docs/economics/ECO_SYSTEM_Modele_Economique_AdManager_Intelligence_3.0.0_2026-09-16.md`

## 5. Données économiques

Le profil partenaire peut inclure, lorsque le groupe l'autorise :
- code `ECO-GRP-...` ;
- effectif agrégé ;
- total collecté ;
- cash in/out ;
- masse monétaire par rubrique ;
- nombre d'opérations.

Il ne contient pas de montant financier individuel nominatif.

## 6. Identité / CNI

La CNI peut servir de preuve/indice durable de rapprochement.
Le mécanisme actuel normalise puis HMAC le numéro avec un secret serveur.
Aucune CNI brute ne doit être exposée dans les recherches, analytics ou ciblages.

## 7. Garde-fous permanents

- ne pas recréer `eco-system-db` ;
- migrations additives uniquement ;
- ne pas fusionner/force-push `main` sans décision explicite ;
- ne pas activer l'argent réel ;
- ne pas créer un second Ledger ;
- ne pas utiliser dettes/soldes/CNI/identité individuels pour AdManager ;
- ne pas confondre profil financier agrégé avec données personnelles de membre ;
- ne pas supprimer les parcours précédents pour simplifier l'interface ;
- ne pas présenter un domaine STRUCTURAL comme terminé.

## 7.1 Sauvegarde BIR+ 1.3.1 vérifiée

- workflow : `35062074470` — **SUCCESS** ;
- source archivée + export distant de `eco-system-db` ;
- restauration SQLite : `PRAGMA integrity_check = ok` ;
- Artifact GitHub : `eco-system-1.3.1-birplus`, ID `10432673201` ;
- digest Artifact ZIP : `cabb94e293d6aa347145344f4c37f7c5ee67f4e705dd32c90c88ca7e4640f476` ;
- tentative R2 : **NON QUALIFIÉE**, Cloudflare code `10042` via le token GitHub. L'Artifact GitHub reste la sauvegarde distante vérifiée ; ne pas prétendre que `eco-system-backups` a reçu cette sauvegarde.

## 8. Ancres historiques et infrastructure à préserver

- **CLOUDFLARE** : réutiliser les Secrets GitHub existants et les ressources déjà qualifiées ; ne pas demander leurs valeurs ni recréer les prérequis sans preuve qu'ils ont disparu.
- **`1.0.0-complete-app`** : reste une ancre historique supersédée dans le Truth Ledger ; ne jamais supprimer l'histoire parce que la ligne courante est 1.3.1.
- **Living Rules** : doctrine permanente. Règle écrite, pratique observée, règle opérationnelle validée et exception restent distinctes.
- D1 `eco-system-db` : ressource canonique de production à réutiliser.
- Les anciennes preuves 1.2/1.0 restent historiques même lorsqu'une nouvelle ligne les supersède.

## 9. Point de reprise

Reprendre sur `next/1.3.1-recovery-recap-services-20260915`, au HEAD distant le plus récent, après vérification de la CI.

Priorités suivantes :
1. terminer l'ergonomie RECAP financier/clôture ;
2. Deals/Offers/Négociation/Reverse Auction UI et persistance ;
3. Analytics Engine / Economic Control Center ;
4. Forum avancé ;
5. ONG/Partenaires avancés ;
6. connecteurs multicanaux ;
7. tests terrain seniors/2G ;
8. seulement après autorisation distincte : qualification production 1.3.1.
