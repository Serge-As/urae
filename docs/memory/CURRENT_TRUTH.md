# ECO-SYSTEM — CURRENT TRUTH

Date : 2026-09-20

## 1. Production publique — vérité actuelle

- URL : `https://eco-system.sergemimf.workers.dev/`
- version : **1.4.2-operational-center-sessions-blueprint**
- Worker : `eco-system`
- Worker Version ID : `b54df0a5-2338-4e37-8b4d-a05351b43658`
- D1 canonique : `eco-system-db`
- R2 privé : `eco-system-backups`
- Premium Live : **ACTIF**
- Control Center : **BOUND / production**
- Forum v2 temps réel : **BOUND / production**
- stockage artifacts : **R2**
- argent réel : **DÉSACTIVÉ**
- qualification du SHA déployé : **35497930024 — SUCCESS**
- workflow qualification + build + BIR+ pré/post + déploiement + smoke : **35497930031 — SUCCESS**
- source déployée : `61a6d83ac5793bb5fecac7ba77a7bd4149031e27`
- tests dans le workflow : **264/264 PASS**
- D1 : **No migrations to apply**
- BIR+ pré/post : restauration SQLite + `PRAGMA integrity_check=ok` + SHA256 + miroir R2 **PASS**.
- artifacts : pré-déploiement `10601637363` ; post-déploiement `10601512437`.
- smoke : version/health + Centre opérationnel + vraie page Séances + présence MeetingService + bénéficiaires/preuves + mobile + Blueprint exécutable + presets Forum/Communautés + Financial Lab + acquis 1.4.1 **PASS**.
- 1.4.1 et les lignes antérieures deviennent historiques ; elles restent des acquis de non-régression.

## 2. Branche et point de reprise

- branche de développement et de production courante : `next/1.4.2-operational-center-sessions-blueprint-20260920`
- source actuellement déployée : `61a6d83ac5793bb5fecac7ba77a7bd4149031e27`
- reprendre au **HEAD distant le plus récent**, jamais à partir d'un SHA mémorisé sans le revérifier.
- prochaine action normale : **BIR+ de fermeture 1.4.2**, puis recette terrain réelle Centre opérationnel / Séances / mobile / Blueprint / communautés / Financial Lab.
- le smoke production ne remplace pas la validation réelle Bureau/membre/offline/bruit/senior ni la réception terrain des nouveaux parcours 1.4.2.

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


## 16. Tranche terrain ciblée — qualifiée sur branche, production en attente (2026-09-18)

Checkpoint qualifié : `99a7c0c37fd7aa7f69fbce0eeb00342886b2bb2e` ; CI `35330825785 SUCCESS`.

Périmètre volontairement limité aux critiques terrain :
- deux feuilles visibles : « Votre feuille de séance » et « Vos fiches individuelles » ;
- saisie/correction par cellule avec éditeur compact ancré ; les valeurs environnantes restent visibles ;
- aucun renvoi obligatoire vers Finance pour saisir une cellule ;
- simulation Prêt : capital initial et paiements mensuels modifiables depuis la matrice ; moteurs CAPITAL_FIRST / INTEREST_FIRST inchangés ;
- menu Tontines synchronisé avec les rubriques TONTINE du groupe, création additionnelle possible, montant total du pot calculé, membres/cycles alimentés et classement des bénéficiaires ;
- vue « Membres & habilitations » dédiée ; Dossier Membre déplacé dans cette vue ;
- vue « Back-office » dédiée ;
- Carnet membre présenté en sections métier au lieu d'un dump JSON ;
- le starter métier est « Timbre de prêt » ; aucun starter générique « Timbre » n'est injecté automatiquement.

Statut : `QUALIFIED_BRANCH`. Ne pas déclarer `PRODUCTION_VERIFIED` avant BIR+, déploiement et smoke ciblé.

## 17. Production 1.4.1 — réajustement terrain livré (2026-09-20)

**Production actuelle : `1.4.1-field-integrity-home-sessions`.**  
**Branche : `next/1.4.1-field-integrity-guardrails-20260919`.**  
**Source déployée : `024b9837b6fa577c0c2c39297c2ce672f7d130b3`.**  
**Run production : `35488899806 SUCCESS`.**

Acquis 1.4.1 sur branche :
- Accueil Groupe et Accueil Membre raccordés aux owners canoniques ;
- identité publique ECO-GRP + profil déclaration/mandat ;
- page Séances comme cockpit complet ;
- date/lieu/thème/tenue sur MeetingService ;
- présence gouvernée ;
- bénéficiaire déclaré avant preuve ;
- preuve de réception immuable et idempotente avec code ECO-RCP non secret ;
- photo/PDF de preuve via artifact store/R2 ;
- créances membre filtrées dans ReceivablesService ;
- correction financière avec revue indépendante systématique ;
- offline snapshot explicite, actor-scoped, jamais substitut d'une réussite serveur ;
- dictée à confiance contrôlée ;
- PWA/cache 1.4.1 ;
- workflow de production 1.4.1 avec qualification + BIR+ pré + déploiement + smoke + BIR+ post.

Ne pas confondre :
- CI branche = qualification technique ;
- smoke production = présence fonctionnelle de marqueurs ;
- recette terrain = validation réelle Bureau/membre/offline/bruit/senior.

`realMoneyEnabled=false` reste obligatoire.

## 18. BIR+ de fermeture 1.4.1
- checkpoint : `4edf2dcb27c54303becce71ac9bd5b7db2c50496`
- qualification : `35489112828 SUCCESS`
- backup final : `35489112862 SUCCESS`
- artifact : `10598209553`
- source + D1 exportés ;
- restauration SQLite : `PRAGMA integrity_check=ok` ;
- SHA256 vérifiés ;
- miroir R2 : `birplus/1.4.1/4edf2dcb27c54303becce71ac9bd5b7db2c50496/final/` PASS.

Le prochain travail normal est la recette terrain de la production 1.4.1. Aucun nouveau déploiement n'est nécessaire avant qu'un défaut reproductible le justifie.

## 19. Production 1.4.2 — Centre opérationnel / Séances / Blueprint

**Production actuelle : `1.4.2-operational-center-sessions-blueprint`.**  
**Branche : `next/1.4.2-operational-center-sessions-blueprint-20260920`.**  
**Source déployée : `61a6d83ac5793bb5fecac7ba77a7bd4149031e27`.**  
**Run production : `35497930031 SUCCESS`.**

Décisions d'architecture désormais implémentées :
1. `operations` = **Centre opérationnel**, cockpit transversal préservé.
2. `sessions` = page métier **Séances**, centrée sur une réunion déterminée.
3. `MeetingService` = owner unique du contexte séance et de la présence.
4. Ledger/Receivables/Evidence restent les owners canoniques de leurs vérités ; la nouvelle page ne crée pas de second moteur financier.
5. La saisie/correction membre reste déléguée aux deux feuilles canoniques.
6. Navigation mobile : labels lisibles, scroll horizontal/snap, recentrage de l'onglet actif, aucune fonction supprimée pour gagner de la place.

Blueprint 5.0.0 rendu exécutable :
- Association/Tontine d'abord : Anticipation, Meeting Autopilot, Group Doctor ;
- besoins/opportunités : Opportunity Need, Demand Exchange, Smart Procurement ;
- commerce local : Eco NOW, Harvest & Local Commerce, Fresh Drop, Pickup Network ;
- valeur/activité : Value Discovery, Business Studio, Business Agent, Talent, Creator & Seller Studio ;
- confiance : Trust Graph explicable, Market Intelligence, SAFETY.ANTISCAM ;
- les workflows sont créés en DRAFT, exigent validation humaine avant ACTIVE et ne créent jamais silencieusement une transaction ;
- doctrine : **PRÉDIRE/OBSERVER → PROPOSER → VALIDATION HUMAINE → EXÉCUTER DANS L'OWNER CANONIQUE** ;
- **prévision ≠ demande ≠ engagement ≠ transaction** ;
- Group Buy est transmis au moteur `MARKETPLACE.GROUP_BUY` existant ;
- Forum/Communautés sont enrichis via presets d'action, sans second moteur social ;
- Eco Route / Backhaul / Return Load demeure un projet autonome extérieur à Eco-System.

Financial Lab :
- `SAFETY.ANTISCAM.FINANCIAL_LAB` passe à **FUNCTIONAL_BETA** ;
- analyse déterministe de scénarios/hypothèses ;
- aucun verdict juridique automatique « Ponzi/arnaque » ;
- aucune action d'argent réel.

Preuves production :
- qualification : `35497930024 SUCCESS` ;
- déploiement + smoke + BIR+ pré/post : `35497930031 SUCCESS` ;
- Worker Version ID : `b54df0a5-2338-4e37-8b4d-a05351b43658` ;
- tests : **264/264 PASS** ;
- D1 : `eco-system-db`, aucune migration ;
- R2 : `eco-system-backups`, préfixes pré/post du SHA déployé, miroir PASS ;
- artifacts GitHub : `10601637363` et `10601512437` ;
- `realMoneyEnabled=false`.

**Limite vraie :** ces preuves établissent CI + déploiement + smoke. Les capacités orientées utilisateur restent FUNCTIONAL_BETA jusqu'à la recette terrain du fondateur.

Document maître :
`docs/implementation/ECO_SYSTEM_Document_Maitre_Implementation_Blueprint_Executable_1.4.2_2026-09-20.md`


## 20. BIR+ de fermeture 1.4.2
- checkpoint : `d1a69bb5c904268d5f16fc2421e2246154000598`
- qualification : `35498239952 SUCCESS`
- backup final source + D1 : `35498239942 SUCCESS`
- artifact : `10601038586`
- restauration SQLite : `PRAGMA integrity_check=ok`
- SHA256 : vérifié
- miroir R2 : `birplus/1.4.2/d1a69bb5c904268d5f16fc2421e2246154000598/final/` — PASS

La production 1.4.2 est donc sauvegardée après synchronisation de la vérité projet. Prochaine étape : recette terrain réelle ; ne pas confondre PRODUCTION_QUALIFIED et FIELD_ACCEPTED.


## LATEST — hotfix visibilité PWA 1.4.2 (2026-09-20)

La production fonctionnelle reste **1.4.2-operational-center-sessions-blueprint**, mais sa source déployée est désormais :
`a9fe00f94daa7a6787d5a4440a5edc0bc5e4a1c8`.

Pourquoi ce hotfix :
- le shell 1.4.2 était déployé et smoke-testé ;
- un navigateur/PWA déjà contrôlé par l'ancien shell pouvait cependant rester visuellement sur 1.4.1 ;
- `ensureCurrentServiceWorker()` était défini mais jamais appelé.

Correction :
- invocation active du contrôle/mise à jour du Service Worker avant `start()` ;
- aucun changement de cache canonique, version runtime, Ledger, D1, modèle métier ou argent réel ;
- test anti-régression permanent.

Preuves :
- commit test qualifié : `113ad9fc021edecdb4fdc03696d7288125ca9c81` — **35499635884 SUCCESS** ;
- source de production : `a9fe00f94daa7a6787d5a4440a5edc0bc5e4a1c8` ;
- qualification même SHA : **35499693852 SUCCESS** ;
- déploiement + smoke + BIR+ : **35499693884 SUCCESS** ;
- artifacts : pré **10602035551**, post **10602215385** ;
- D1 `eco-system-db` et R2 `eco-system-backups` réutilisés ;
- `realMoneyEnabled=false`.

Point terrain immédiat : ouvrir/actualiser l'application sur le téléphone et vérifier que le menu affiche **Centre opérationnel** séparé de **Séances**, puis tester les huit sections Séances. Ne pas marquer FIELD_ACCEPTED avant cette vérification réelle.


## 19. Production 1.4.2 post-hotfix — références finales
- source déployée : `a9fe00f94daa7a6787d5a4440a5edc0bc5e4a1c8`
- Worker Version ID : `6c7b4be2-7daa-4f15-ae11-0861d248f60a`
- qualification production : `35499693852 SUCCESS`
- deploy/smoke/BIR+ : `35499693884 SUCCESS`
- tests : `265/265 PASS`
- checkpoint documentaire final : `d686929b44bf9f5f61ddee2ddee434e891c39afb`
- qualification finale : `35499946396 SUCCESS`
- BIR+ final : `35499946216 SUCCESS`
- artifact : `10600699685`
- R2 final : `birplus/1.4.2/d686929b44bf9f5f61ddee2ddee434e891c39afb/final/`
- realMoneyEnabled : `false`.

La production est TECHNIQUEMENT QUALIFIÉE. Les nouveaux parcours restent FIELD_ACCEPTED uniquement après observation réelle du fondateur.
