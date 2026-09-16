# ECO-SYSTEM — CURRENT TRUTH

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
