# ECO-SYSTEM — CURRENT TRUTH

Date : 2026-09-18

## 1. Production publique — vérité actuelle

- URL : `https://eco-system.sergemimf.workers.dev/`
- version : **1.4.0-master-2.3.4-closure**
- Worker : `eco-system`
- Worker Version ID : `182e7992-1bf9-479f-914b-c0f04ab1b85c`
- D1 canonique : `eco-system-db`
- R2 privé : `eco-system-backups`
- Premium Live : **ACTIF**
- Control Center : **BOUND / production**
- Forum v2 temps réel : **BOUND / production**
- stockage artifacts : **R2**
- argent réel : **DÉSACTIVÉ**
- workflow qualification + build + BIR+ pré/post + déploiement + smoke : run **35314965700 — SUCCESS**
- qualification parallèle du SHA déployé : **35314965698 — SUCCESS**
- source déployée : `e869918002a6a649751b68088de39510dad3b29a`
- tests dans le workflow : **231/231 PASS**
- D1 : **No migrations to apply**
- 1.3.3 et les lignes antérieures restent historiques et ne sont plus la production courante.

## 2. Branche et point de reprise

- branche de développement : `next/1.4.0-master-2.3.4-closure-20260917`
- production stable actuelle : cette même lignée 1.4.0, source `e869918002a6a649751b68088de39510dad3b29a`
- reprendre au **HEAD distant le plus récent**, jamais à partir d'un SHA mémorisé sans le revérifier.
- ne pas repartir d'une lignée 1.3.x pour corriger la production 1.4.0.

## 3. R2 / sauvegarde

Le jeton GitHub Cloudflare existant a été retesté après activation R2 :
- `d1=OK`
- `r2=OK`

Aucun nouveau jeton n'est nécessaire pour D1/R2 tant que ces contrôles restent verts.

La production 1.3.2 a :
- créé/réutilisé le bucket privé `eco-system-backups` ;
- exporté `eco-system-db` avant déploiement ;
- vérifié la restauration SQLite et `PRAGMA integrity_check=ok` ;
- archivé les sources ;
- calculé les SHA256 ;
- copié source + export D1 + checksums dans R2 sous le préfixe :
  `birplus/1.3.2/0226b9b145c8aa49eb94ed190dedfd8c544ff80c/predeploy/` ;
- téléchargé les checksums depuis R2 pour vérifier la copie ;
- résultat : **R2 BIR+ mirror PASS**.

Une sauvegarde BIR+ GitHub séparée avant le déploiement a aussi réussi : run **35095940942 — SUCCESS**.

## 4. Épargne — audit étendu du dossier historique

Sources auditées : le nouveau dossier historique, notamment `Feuille mensuelle.xlsx` et `Rubriques Epargne à intérêts.xlsx`.

Vérités corrigées du dossier complet :
- intérêts réellement collectés dans `Principal!F3` : **708 500 F CFA** ;
- principal Épargne classique : **14 935 199 F** ;
- principal Épargne scolaire : **1 081 000 F** ;
- exemple de clé décidée par le Bureau : **70 % Épargne classique = 495 950 F**, **10 % Épargne scolaire = 70 850 F**, **20 % Bureau = 141 700 F** ;
- coefficients historiques classiques : **9, 8, 7, 6, 5, 4, 3, 2, 1, 0,5, 0, 0** ;
- coefficients scolaires : **7, 6, 5, 4, 3, 2, 1, 0, 0, 0, 0, 0**.

### Moteur historique
Le pipeline détaillé du classeur reste reproductible pour explication. Mathématiquement, après normalisation, sa part relative est équivalente à :
`poids dépôt = montant × coefficient de période`, puis
`gain dépôt = pool de la caisse × poids dépôt / somme des poids`.
Eco-System conserve le pipeline historique pour audit, mais peut utiliser cette forme simplifiée pour calculer immédiatement le même résultat.

### Moteur Capital × Temps
Nouvelle politique transparente :
`score = montant^β × durée_éligible^α`.
- défaut : α=1, β=1 ;
- α>1 renforce explicitement la prime aux dépôts précoces ;
- β<1 peut, si le groupe le décide, atténuer la domination de dépôts exceptionnellement élevés ;
- date/session limite d'éligibilité entièrement configurable.

### Moteur productif attribué / hybride
Le nouveau dossier apporte des preuves supplémentaires :
- janvier : prêt ordinaire de **1 000 000 F** à Nicaise, remboursé en mars avec **90 000 F** d'intérêts ;
- avril : prêt ordinaire de **6 000 000 F** à Thierry, remboursé en juin avec **600 000 F** d'intérêts ;
- soit **690 000 F** d'intérêts à causalité forte sur **708 500 F** collectés ;
- **18 500 F** restent résiduels/non attribués avec certitude et ne doivent pas recevoir une causalité inventée.

Le moteur supporte désormais :
- `SEGREGATED` : caisses séparées ;
- `POOLED` : Épargne classique et scolaire mutualisées ;
- `CUSTOM_MATRIX` : matrice explicite des caisses autorisées par prêt ;
- résidu : `TIME_WEIGHTED`, `FIXED_FUND_SPLIT` ou `UNALLOCATED`.

**Règle** : l'application demande explicitement au Bureau si Épargne classique et Épargne scolaire sont mélangées pour les prêts, car cette décision varie selon les groupes.

## 5. Acquis 1.3.2 anti-régression

- parcours création 10 étapes ;
- Collation ;
- rubriques multiples et multi-tontines avec participants propres ;
- Tontine Manager permanent ;
- Ledger D1 canonique ;
- panne Live ≠ rollback d'une finance déjà commitée ;
- Premium Live + Durable Object ;
- moteurs Épargne historique et capital productif ;
- Fonds Secours : détail contribution/retenue par membre ;
- RECAP financier/session/carryover ;
- Forum v2 : messages, threads, réactions, brouillons serveur, curseur/ancre de lecture multi-appareils ;
- Control Center : auto-enregistrement des capacités, incidents, plaintes, contenus ;
- propriétaire initial du Control Center persisté dans D1, distinct du simple rôle fondateur d'un groupe ;
- identité CNI + téléphone + nom normalisé par HMAC serveur ;
- R2 pour imports/médias/sauvegarde ;
- AdManager spécialisé, profil économique agrégé, Demand Exchange, Partners/ONG ;
- PWA/offline/FR-EN ;
- `realMoneyEnabled=false`.

## 6. Secrets production

Les clés `COLLECTIVE_LEARNING_PEPPER` et `IDENTITY_MATCH_PEPPER` ont été créées une seule fois comme **Cloudflare Worker secrets** durant la livraison 1.3.2. Elles ne doivent jamais être copiées dans GitHub ou dans le dépôt.
Les prochains déploiements doivent les **préserver**, pas les régénérer.

`FOUNDER_TEAM_ACTORS` est optionnel : le propriétaire plateforme durable en D1 donne l'accès initial au Control Center ; ce secret pourra servir plus tard à ajouter explicitement des contrôleurs supplémentaires.

## 7. Documents maîtres

- `docs/constitution/ECO_SYSTEM_Cahier_des_Charges_Maitre_Exhaustif_3.2.0_2026-09-16.md` (continuation détaillée ; socle 2.3.4 conservé)
- `docs/economics/ECO_SYSTEM_Modele_Economique_AdManager_Approfondi_3.2.0_2026-09-16.md`
- audit classeur réel livré séparément en XLSX.

## 8. Limites vraies

- moteur productif : besoin d'une preuve prêt → caisse/source → remboursement → remise en prêt pour une allocation causale complète ;
- Épargne scolaire : politique de mutualisation des prêts à préciser ;
- photo R2 + vérification faciale volontaire 1-à-1 : à implémenter ;
- passkeys/WebAuthn : à implémenter ;
- appels audio/vidéo RealtimeKit : à implémenter ;
- Push complet, recherche Forum, voix/sondages/live avancés : à implémenter ;
- argent réel : non autorisé.

## 9. Garde-fous permanents

- ne jamais recréer `eco-system-db` ;
- migrations additives uniquement ;
- pas de second Ledger ;
- pas d'intérêt impayé automatiquement capitalisé ;
- aucune finance/CNI/téléphone/biométrie individuelle dans AdManager ou partage partenaire ;
- OFF explicite > BETA_OPEN ;
- UNKNOWN ≠ SUCCEEDED ;
- sauvegarde BIR+ avant production ;
- tout nouveau service supervisable est automatiquement inscrit au Control Center ;
- pas de force-push / merge main sans décision explicite.

## 10. Prochain point de reprise

Priorités :
1. relier automatiquement le moteur Épargne au Ledger/Feuille mensuelle et aux vraies sources de prêts ;
2. UX Fonds Secours par membre + RECAP/Cassation complète ;
3. photos R2 et pipeline média ;
4. passkeys + Web Push ;
5. Forum recherche/signets/voix/sondages ;
6. RealtimeKit réunions audio/vidéo ;
7. Demand Exchange/Deals + Analytics/Cost Control ;
8. tests terrain 2G/seniors.

Après 3–5 sous-lots : commit + CI + mise à jour de cette vérité + checkpoint BIR+.


## 11. Compatibilité avec les garde-fous historiques

- Infrastructure : **CLOUDFLARE** Workers + D1 + R2 + Durable Objects.
- Lignée de récupération conservée : **1.0.0-complete-app** reste une balise historique du projet et ne désigne pas la version courante.
- Finance réelle : **realMoneyEnabled=false**.
- Doctrine métier : **Living Rules** ; écrit, pratique observée, règle activée et exception restent distincts.


## 12. 1.3.3 — production qualifiée

- version : `1.3.3-fairness-adops-doctor-launch` ;
- branche : `next/1.3.3-interest-lab-adops-ui-20260916` ;
- production 1.3.3 smoke-testée ;
- 181 tests couvrent notamment les cinq politiques d'intérêts, RI multi-document, revue séquentielle, Assistance/Inscription, AdOps, House Ads, Group Doctor et Meeting Autopilot ;
- l'IA House Ads reçoit uniquement des signaux collectifs dérivés (familles et catégories de besoins), jamais les noms libres des rubriques ;
- BIR+ 1.3.3 : run `35138465887` SUCCESS ; déploiement/smoke : run `35138597876` SUCCESS ; Worker Version ID `fdb6c9f3-8e46-49e9-85df-1e238975d257` ; `realMoneyEnabled=false`.

**Point de reprise** : recette terrain 1.3.3 puis corrections ciblées ; toute nouvelle production reste précédée d'un BIR+ et d'un smoke.


## 13. Livraison 1.3.3 — preuves
- BIR+ : `35138465887` SUCCESS (source + export D1 + restauration SQLite + SHA + miroir R2).
- Deploy : `35138597876` SUCCESS.
- D1 : existante réutilisée ; `No migrations to apply`.
- R2 predeploy mirror : PASS.
- Worker Version ID : `fdb6c9f3-8e46-49e9-85df-1e238975d257`.
- Smoke : version 1.3.3, realMoney=false, Premium Live=true, Founder Control=true, Community Realtime=true, artifactStorageMode=R2.
- Les capacités 1.3.3 sont déployées mais restent FUNCTIONAL_BETA là où une recette terrain dédiée manque.


## 14. Checkpoint de clôture 1.3.3
- HEAD checkpoint : `4d7ce535f60fbc4af3317ed157374ec884b3ff2e`.
- qualification : run `35139053318` SUCCESS.
- BIR+ de clôture : run `35139053215` SUCCESS.
- ce checkpoint archive le code/documentation post-déploiement et exporte la D1 déjà en production 1.3.3, avec restauration/integrity, SHA256 et miroir R2.


## 15. 1.4.0 — deux feuilles / toutes rubriques / circuit Prêts + Intérêts — VERIFIED_REMOTE

Production 1.4.0 qualifiée le 2026-09-18.

### Deux feuilles
- **Votre feuille de séance** et **Vos fiches individuelles** sont les deux surfaces normales de saisie financière membre.
- Toute rubrique créée et non archivée apparaît sur les deux.
- Le test à 20 rubriques est uniquement un test de non-régression terrain. Les scénarios **1 rubrique** et **40 rubriques** sont également couverts et passent.
- Le validateur de lancement conserve un plafond technique actuel de 100 rubriques ; ce n'est pas une règle métier « 20 rubriques ».
- Amendes / Inscription / Timbre ne remplacent jamais le catalogue réel du groupe.
- Le simple membre voit sa propre fiche et ses propres prêts, pas ceux des autres membres.

### Prêts
- Le capital restant est l'assiette de l'intérêt de la nouvelle période.
- Après remboursement partiel du capital, la période suivante taxe uniquement le capital restant.
- Les intérêts impayés restent séparés et ne produisent jamais eux-mêmes des intérêts.
- Si capital = 0 mais intérêts > 0, aucun nouvel intérêt n'est produit.
- Le gestionnaire compare puis valide **CAPITAL_FIRST** ou **INTEREST_FIRST** au niveau de la rubrique Prêt.
- Une période réelle de prêt est persistée par prêt + séance (`FINANCE.LOAN_PERIOD`) ; l'accrual est idempotent pour éviter un double intérêt dans la même séance.
- La matrice réelle/simulée est horizontale par séance/mois et contient : capital début, capital remboursé, capital restant, intérêt exigible, intérêt payé, intérêt restant, paiement, dette après séance, intérêt projeté suivant, total projeté suivant, plus synthèse/totaux.
- Si la politique du groupe active le blocage, un nouveau prêt est interdit tant que capital ou intérêts du précédent restent dus.

### Exemple fondateur permanent
50 000 XAF, 5 %, paiements 0 / 30 000 / 20 000 :
- CAPITAL_FIRST : fin mois 3 = capital 0, intérêts 6 000 ; mois 4 = 6 000 sans nouvel intérêt.
- INTEREST_FIRST : fin mois 3 = capital 6 250 ; période suivante = 6 250 + 5 % = 312,5 théoriques, arrondis actuellement à 313 XAF ; total final projeté 6 563 XAF.

### Preuves distantes
- qualification SHA déployé : run `35314965698` SUCCESS ;
- production + smoke : run `35314965700` SUCCESS ;
- tests : 231/231 PASS ;
- Worker Version ID : `182e7992-1bf9-479f-914b-c0f04ab1b85c` ;
- pré-BIR+ : export D1 restauré + integrity_check + SHA256 + miroir R2 PASS ;
- post-BIR+ : export D1 restauré + integrity_check + SHA256 + miroir R2 PASS ;
- migrations : aucune migration à appliquer ;
- production health : `1.4.0-master-2.3.4-closure`, realMoney=false, Premium Live/Founder Control/Community Realtime/R2 actifs.

**Réception terrain :** encore à effectuer. Ne pas confondre CI/smoke avec validation complète par le fondateur.
