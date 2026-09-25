## CURRENT OVERRIDE — 1.5.2.3 FINANCIAL ENTRY OFFLINE — PRODUCTION VERIFIED, FIELD ACCEPTANCE PENDING (2026-09-25)

**Repository opérationnel : `SergeDelor/tontine-platform`.**
**Production publique : `1.5.2.3-financial-entry-offline`.**
**Statut : CI_QUALIFIED + DEPLOYED + SMOKE_VERIFIED. FIELD_ACCEPTED est volontairement NON déclaré tant que le fondateur n'a pas reproduit les tests ✓ / Entrée / offline sur ses appareils.**

### Pourquoi 1.5.2.3 existe
La recette réelle du fondateur a invalidé l'affirmation 1.5.2.2 selon laquelle la saisie montant + ✓ était acquise : le montant saisi pouvait être durablement placé dans l'outbox tandis que la lecture Ledger suivante renvoyait encore la valeur serveur précédente. L'interface repeignait alors 0 et donnait l'impression que ✓ n'avait rien fait. Ce constat terrain prime sur l'ancien test source/CI.

### Correction livrée
- **✓ et touche Entrée utilisent exactement le même chemin de validation** ; Entrée empêche le submit parasite et déclenche la même commande canonique.
- une première saisie de contribution placée en file locale reste **immédiatement visible dans la matrice**, même si le Ledger distant n'a pas encore confirmé l'écriture ;
- les corrections de cellule déjà persistées dans l'outbox exposent leur **valeur cible locale** et ne reviennent plus visuellement à l'ancienne valeur pendant l'attente réseau ;
- une saisie offline/queue affiche explicitement **« Enregistré hors ligne · synchro en attente »** ;
- les intentions sont persistées dans l'outbox IndexedDB puis synchronisées vers l'owner financier canonique ; aucun second Ledger n'a été créé ;
- les réponses ambiguës / indisponibilités temporaires n'effacent plus visuellement l'intention locale ;
- déduplication par idempotency key : une écriture déjà présente dans la projection serveur/cache n'est pas comptée deux fois ;
- PWA isolée dans un nouveau cache pour empêcher un ancien `main.js` 1.5.2.2 de masquer le correctif.

### Preuves techniques
- branche hotfix : `hotfix/1.5.2.3-financial-entry-offline-20260925`
- qualification hotfix : run **36155504042 — SUCCESS — 365/365 PASS**
- tests spécifiques : projection visible d'une saisie queue alors que le serveur retourne 0 ; déduplication ; correction offline avec cible locale ; ✓ + Entrée + état pending
- workflow production : **36155682018 — SUCCESS**
- commit exact déployé : `655cf0b76e2cb1d8ac2338f855c0b93981a1fef3`
- version runtime : `1.5.2.3-financial-entry-offline`
- build ID : `eco-system-1.5.2.3-20260925`
- PWA cache : `eco-system-v1523-financial-entry-offline-20260925`
- Worker Version ID : `84b9f2ef-9780-4d5b-95f4-e533a5ab3a33`
- catalogue production : **158 capacités**
- argent réel : **false / OFF**
- stockage artefacts : **R2**
- D1 canonique : `eco-system-db` réutilisée ; migrations additives uniquement
- R2 canonique : `eco-system-backups` réutilisé
- sauvegarde pré-déploiement : artifact **10873442195**
- sauvegarde post-déploiement : artifact **10872769858**
- restauration post-déploiement : **PASS**, SQLite + `PRAGMA integrity_check=ok`
- PR d'intégration : **#23 — MERGED**, merge commit `6f013c8b5e3c5d084595be607dc71635ad0bf6b9`

### Blocage fonctionnel volontaire
Le chantier L7–L12 est **mis en pause**. Aucune poursuite ne doit être présentée comme prioritaire avant la recette terrain de cette correction financière.

### Recette terrain obligatoire avant FIELD_ACCEPTED
1. sur la feuille de séance, saisir un montant dans une cellule à 0 puis cliquer ✓ : la valeur doit apparaître immédiatement ;
2. saisir un autre montant et appuyer **Entrée** : résultat identique à ✓ ;
3. modifier une valeur existante : la cible doit être visible sans addition implicite ;
4. couper Internet, saisir/valider : la valeur doit rester visible avec **« Enregistré hors ligne · synchro en attente »** ;
5. rétablir Internet : la file doit se synchroniser sans double comptage ;
6. actualiser la page et vérifier que la valeur confirmée reste présente ;
7. répéter au moins une fois dans une fiche individuelle puisque le même renderer canonique est partagé.

**Point de reprise obligatoire : attendre la recette réelle du fondateur sur 1.5.2.3. Si elle échoue, corriger ce flux uniquement. Si elle réussit, seulement alors reprendre L7–L12 depuis la branche qualifiée prévue, en réintégrant d'abord ce hotfix.**

---

## CURRENT OVERRIDE — 1.5.2.2 GOVERNED FIELD FEEDBACK — PRODUCTION VERIFIED (2026-09-25)

**Repository opérationnel : `SergeDelor/tontine-platform`.**
**Production publique : `1.5.2.2-governed-field-feedback`.**
**Statut : DEPLOYED + SMOKE_VERIFIED. FIELD_ACCEPTED reste distinct et requiert la recette réelle fondateur/appareils.**

### Livraison exacte
- branche : `next/1.5.0-audit-complete-platform-20260923`
- commit exact déployé : `8d4bbee39cdf519f7c6c18296f840ef49313df6a`
- workflow production : **36144883224 — SUCCESS**
- GitHub-hosted Actions : **rétabli après transfert du dépôt vers SergeDelor**
- qualification hébergée préalable : **36144754009 — SUCCESS**
- version runtime : `1.5.2.2-governed-field-feedback`
- build ID : `eco-system-1.5.2.2-20260923`
- PWA cache : `eco-system-v1522-governed-field-feedback-20260923`
- catalogue : **158 capacités**
- argent réel : **false / OFF**
- Worker Version ID : `c3f78192-2b09-45e2-abb7-324978a0dd90`
- D1 canonique : `eco-system-db` réutilisée ; **No migrations to apply**
- R2 canonique : `eco-system-backups` réutilisé
- sauvegarde pré-déploiement : artifact **10868773224**, digest `sha256:efaa765f4a3d81b70352da8a9dc094d25608bbe1367466239e2440149c7b725b`
- sauvegarde post-déploiement : artifact **10868703315**, digest `sha256:e1fb14b8022fc67391565552452e217dc682a23533b2b9e9fb30aa120bee0715`
- restauration post-déploiement : **PASS**, SQLite + `PRAGMA integrity_check=ok`

### Corrections terrain désormais déployées
- saisie montant + ✓ réellement prise en compte dans les tableaux financiers canoniques ;
- prêt traité comme sortie/dépense et non comme rubrique positive ;
- dette totale = capital restant + intérêts dus + autres obligations ;
- intérêt calculé à la clôture N et attribué à N+1 sans double comptage ;
- dette visible dans les surfaces groupe/session/membre ;
- scroll souris restauré sur les tableaux ;
- UX Membres corrigée ;
- restauration Corbeille signalée 72 h ;
- Accueil limité à 5 alertes urgentes + Centre d'alertes ;
- mode Visuel renforcé ;
- isolation PWA/cache 1.5.2.2.

### Mapping de propriété GitHub
- Eco-System : `SergeDelor/tontine-platform`
- Beauty : `Delor85/as-beauty` tant qu'il n'est pas transféré
- Blue Magic : `Delor85/BlueAuto` tant qu'il n'est pas transféré
- auteurs historiques, commits, anciennes issues et PR signés `Delor85` : **ne pas réécrire**
- références opérationnelles du dépôt Eco actuel : utiliser `SergeDelor/tontine-platform`

### Point de reprise
La prochaine tranche est la fermeture fonctionnelle **L7–L12** (issue #21), en partant de cette production 1.5.2.2 prouvée et sans réintroduire de moteur parallèle.

---

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
