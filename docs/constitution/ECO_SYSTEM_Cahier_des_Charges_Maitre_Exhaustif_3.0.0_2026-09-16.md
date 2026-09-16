# ECO-SYSTEM — Cahier des Charges Maître Exhaustif 3.0.0
## Plateforme de gestion de tontines, associations, communautés et écosystème économique
**Date de consolidation : 16 septembre 2026**  
**Ligne de développement : `next/1.3.1-recovery-recap-services-20260915`**  
**Principe de sécurité : aucune régression silencieuse ; aucune activation d'argent réel sans qualification distincte.**

---

## 0. Comment lire ce cahier

Ce document est volontairement compréhensible par une personne qui ne développe pas de logiciels.

Chaque capacité est classée selon quatre statuts :

- **ACQUIS VÉRIFIÉ** : code + tests, et lorsque nécessaire preuve distante.
- **BÊTA FONCTIONNELLE** : le moteur fonctionne mais son ergonomie, ses intégrations externes ou sa qualification terrain doivent encore progresser.
- **STRUCTURE À COMPLÉTER** : le domaine existe mais ne doit pas être présenté comme un service terminé.
- **PROPOSITION 3.0** : amélioration nouvelle à mettre en œuvre progressivement.

Une carte, un bouton ou un dossier ne vaut jamais preuve qu'un moteur métier est terminé.

---

# 1. Contexte et objet

Eco-System remplace progressivement les feuilles Excel, cahiers papier, calculs manuels, appels téléphoniques et messages dispersés utilisés par les tontines et associations.

L'objectif n'est pas de forcer tous les groupes à fonctionner de la même manière. Au contraire, Eco-System doit apprendre et représenter les règles propres à chaque groupe :

- association à accumulation ;
- tontine rotative ;
- tontine en argent ;
- tontine en nature ;
- plusieurs tontines dans le même groupe ;
- secours ;
- épargne ;
- prêts ;
- remboursements ;
- collation ;
- transport ;
- assistance ;
- main levée ;
- amendes ;
- inscription ;
- fonctionnement du Bureau ;
- projets ;
- caisses particulières ;
- fêtes/cassation ;
- rubriques inventées par le groupe.

**Objet central :** rendre le fonctionnement réel d'un groupe numérique, explicable, auditable, modifiable et suffisamment simple pour être utilisé par une personne âgée, un novice ou un utilisateur en faible connexion.

---

# 2. Doctrine produit

## 2.1 Living Rules

Une règle ne doit pas être transformée en vérité universelle simplement parce qu'elle est vraie dans un groupe.

Eco-System distingue :

1. **règle écrite** : RI, Statuts, PV, décision ;
2. **pratique observée** : ce que le groupe fait réellement ;
3. **règle opérationnelle validée** : ce que le groupe choisit d'appliquer à une date donnée ;
4. **exception** : décision ponctuelle autorisée et tracée.

## 2.2 Une seule vérité financière

La comptabilité canonique reste le Ledger append-only.

Les interfaces, RECAP, statistiques, partenaires, ONG, IA et Live sont des projections de cette vérité ; ils ne maintiennent pas chacun un deuxième solde.

## 2.3 UNKNOWN n'est jamais SUCCEEDED

En faible réseau ou lorsqu'un service externe échoue :

- on met l'intention en attente ;
- on conserve l'idempotence ;
- on réessaie ;
- on n'affiche jamais un faux succès.

## 2.4 Régression interdite

Une amélioration n'autorise pas la suppression d'un acquis.

Les dix étapes de création, les multi-tontines, l'offline, les Living Rules, le Ledger, les communautés, le Marketplace, le RECAP et les autres acquis disposent progressivement de tests de contrat anti-régression.

---

# 3. Les utilisateurs et leurs besoins

## 3.1 Membre simple

Il doit comprendre en quelques secondes :

- ce qu'il doit ;
- ce qu'il a payé ;
- ses épargnes ;
- ses prêts ;
- ses intérêts ;
- ses tontines ;
- ses prochains pots ;
- ses prochaines réunions ;
- les opérations qui viennent de modifier sa situation ;
- les messages, événements et communautés utiles.

## 3.2 Responsable de groupe

Il doit pouvoir :

- créer/configurer un groupe ;
- importer un groupe historique ;
- définir les règles ;
- organiser les réunions ;
- saisir ou importer des transactions ;
- gérer rubriques, tontines, caisses et prêts ;
- vérifier chaque fin de séance ;
- réaliser la Cassation ;
- clôturer l'exercice ;
- démarrer l'exercice suivant ;
- communiquer avec les membres ;
- exploiter le Forum, les partenaires, ONG et offres économiques.

## 3.3 Fondateur/équipe Eco-System

Elle doit disposer :

- d'une vérité technique du produit ;
- d'une observabilité ;
- d'un contrôle des régressions ;
- d'analytics agrégées ;
- d'un moteur économique ;
- d'un AdManager ;
- d'un observatoire des apprentissages non sensibles ;
- de mécanismes de sauvegarde/reprise BIR+.

---

# 4. Création d'un groupe — contrat des 10 étapes
**Statut : ACQUIS VÉRIFIÉ.**

Le nombre et l'ordre constituent désormais un contrat de non-régression.

1. **Origine**
   - Nouveau groupe ;
   - groupe existant hors Eco-System ;
   - transformation d'un groupe déjà enregistré.

2. **Famille**
   - association ;
   - tontine rotative ;
   - les tontines en nature sont représentées par leurs rubriques spécialisées.

3. **Gouvernance**
   - fondateur ;
   - communautaire ;
   - déléguée ;
   - accompagnée ONG ;
   - hybride.

4. **Exercice et calendrier**
   - début ;
   - nombre de séances ;
   - cadence ;
   - règle de réunion ;
   - présentiel/distance.

5. **Membres**
   - liste progressive ;
   - invitation ;
   - import ;
   - rapprochement historique ;
   - période d'essai/liste d'attente.

6. **Rubriques**
   - plusieurs occurrences de la même nature ;
   - contexte propre ;
   - plusieurs tontines ;
   - participants différents ;
   - argent/nature/mixte ;
   - assistant RI/voix.

7. **Finance et faisabilité**
   - simulation ;
   - coûts ;
   - volumes ;
   - aucune cotisation nominale globale obligatoire.

8. **Communication**
   - in-app ;
   - impression ;
   - SMS/WhatsApp/Telegram lorsque connecteurs disponibles.

9. **Accessibilité**
   - Ultra Simple ;
   - oral ;
   - 2G/faible connexion ;
   - anciens appareils ;
   - FR/EN.

10. **Prévisualisation et confirmation**
   - résumé complet ;
   - risques ;
   - confirmation humaine ;
   - création/intégration/transformation.

### Exemple

Une association de 20 membres peut créer simultanément :

- Secours 24 000 F/an ;
- Collation 2 000 F/séance ;
- Épargne libre ;
- Tontine 1 000 F : 12 participants ;
- Tontine 10 000 F : 8 participants ;
- Tontine Savons : 15 participants ;
- Tontine Draps : 6 participants.

Aucun membre n'est automatiquement inscrit à toutes les tontines.

---

# 5. Pourquoi certaines fonctions historiques avaient été simplifiées

La première génération du produit et plusieurs reprises ont parfois transformé des mécanismes Excel riches en interfaces plus génériques.

## 5.1 RECAP

Le mot « RECAP » avait fini par désigner principalement un tableau de bord :

- nombre de membres ;
- dernières opérations ;
- alertes ;
- état du Ledger ;
- Live ;
- boutique.

Ce tableau de bord est utile et doit être conservé.

Mais l'ancien RECAP avait une deuxième fonction beaucoup plus profonde : **moteur financier de clôture membre × rubrique**.

Il devait :

- rassembler les rubriques positives ;
- rassembler les rubriques négatives ;
- calculer les soldes individuels ;
- intégrer dettes, intérêts, retenues et ajustements ;
- préparer les enveloppes ;
- rapprocher la trésorerie ;
- préparer la clôture ;
- transporter certaines caisses vers l'exercice suivant.

La simplification consistait donc à garder « le tableau de bord » en perdant une partie de « l'algorithme financier de fin d'exercice ».

### Correction 3.0

Eco-System conserve deux vues :

**RECAP Cockpit** = pilotage quotidien.  
**RECAP Financier** = moteur de rapprochement et de clôture.

## 5.2 Rubriques

Certaines rubriques avaient été ramenées à :

> nom + montant + commentaire.

Or une rubrique réelle possède souvent :

- qui doit participer ;
- comment ;
- à quelle échéance ;
- ce qui entre ;
- ce qui sort ;
- ce qui est remboursable ;
- ce qui est reporté ;
- ce qui est prêté ou interdit de prêt ;
- qui autorise ;
- quand une règle change.

### Correction 3.0

Une `RubricDefinition` reçoit des politiques composables au lieu d'un énorme bloc rigide.

## 5.3 Paramétrage dans le temps

Une règle modifiée en septembre ne doit pas faire croire qu'elle existait en janvier.

Toute règle significative doit donc pouvoir être versionnée et posséder :

- date de décision ;
- date d'effet ;
- source ;
- auteur ;
- version précédente ;
- éventuelle exception.

---

# 6. RubricDefinition et politiques composables
**Statut : BÊTA FONCTIONNELLE, socle implémenté.**

Chaque rubrique conserve :

- identité ;
- nom local ;
- nature ;
- source ;
- règle écrite ;
- pratique observée ;
- règle opérationnelle ;
- politique(s).

Politiques principales :

- **ParticipationPolicy**
- **ContributionPolicy**
- **BeneficiaryPolicy**
- **RefundPolicy**
- **ReservePolicy**
- **LoanPolicy**
- **YieldPolicy**
- **AttendancePolicy**
- **LifecyclePolicy**
- **AssistancePolicy**
- **ApprovalPolicy**
- **CarryoverPolicy**

### Exemple Secours

> Secours — objectif annuel 24 000 F / membre

Peut recevoir :

- participation obligatoire ;
- échéance 6e séance ;
- réserve permanente ;
- remboursement partiel ;
- prêt interdit ;
- décaissement sur événement éligible ;
- reconstitution à la séance suivante ou sous délai décidé ;
- double validation au-dessus d'un seuil ;
- report de la caisse vers N+1.

### Exemple Collation

Le libellé officiel est **Collation**, jamais « Collection ».

La Collation peut être :

- due par tous les inscrits ;
- due seulement par les présents ;
- due par le membre représenté ;
- immédiatement remise à l'hôte ;
- encaissée puis décaissée dans la même séance ;
- laissée partiellement en caisse selon décision du groupe.

---

# 7. Assistant RI — « Rule Architect »
**Statut : BÊTA FONCTIONNELLE, à enrichir continuellement.**

L'assistant ne doit plus se limiter à repérer des mots.

Pipeline :

1. document original ;
2. extraction des articles/règles ;
3. faits sourcés ;
4. rubriques candidates ;
5. politiques candidates ;
6. contradictions ;
7. questions ciblées ;
8. simulation ;
9. validation humaine ;
10. activation versionnée.

### Comportement attendu

Si le RI dit :

> « Secours : 24 000 F par membre ; assistance prélevée dans la caisse ; la caisse doit être renflouée »

l'IA propose :

- rubrique : Secours ;
- type : Solidarité ;
- cible : 24 000 ;
- participation : obligatoire ;
- décaissement : assistance ;
- réserve : oui ;
- reconstitution : à confirmer ;
- source : article correspondant.

### Contradictions

Si un texte contient deux délais ou une fraction incohérente avec le pourcentage écrit, l'IA ne choisit pas silencieusement.

Elle affiche :

> « Deux règles semblent contradictoires. Laquelle doit gouverner l'exercice ? »

### Voix

Le gestionnaire peut parler :

> « Chez nous le secours est de 24 000 mais les anciens ont déjà 12 000 retenus. »

L'application reformule puis demande confirmation.

---

# 8. Tontines — gestion permanente
**Statut : BÊTA FONCTIONNELLE.**

Le menu **Tontines** reste accessible après la création du groupe.

Chaque tontine possède :

- définition ;
- participants ;
- parts/noms ;
- tours ;
- pots par tour ;
- calendrier ;
- bénéficiaires ;
- historique ;
- règles ;
- montant ou article en nature.

Actions :

- ajouter un retardataire ;
- ajouter une part ;
- programmer/reprogrammer ;
- annuler sans effacer l'historique ;
- servir un pot ;
- visualiser les tours futurs.

## Preuve financière

Une part ne peut être déclarée `SERVED` sans écriture Ledger canonique existante.

---

# 9. Réunion — Feuille mensuelle et RECAP de séance
**Statut : moteur BÊTA implémenté.**

Chaque séance doit se terminer par un rapprochement explicite.

Pour chaque rubrique :

- attendu ;
- entrée réelle ;
- sortie réelle ;
- manquant ;
- net ;
- montant libérable.

### Pourquoi ?

Certaines rubriques sont à la fois recettes et dépenses :

- Collation ;
- Tontines ;
- certaines Assistances ;
- Transport ;
- dépenses d'événement.

Exemple :

Collation :
- entrée : 40 000 ;
- sortie hôte : 40 000 ;
- net : 0.

Secours :
- entrée : 48 000 ;
- sortie assistance : 20 000 ;
- reste caisse Secours : 28 000.

Le RECAP de séance confronte ensuite :

**caisse début + entrées - sorties = caisse théorique fin**

et compare cette valeur à la caisse réellement comptée.

Tout écart reste visible ; il n'est jamais masqué automatiquement.

---

# 10. Prêts et intérêts
**Statut : BÊTA FONCTIONNELLE.**

Principe invariant :

**pas d'intérêt sur intérêt** sauf futur mode volontaire distinct explicitement autorisé ; le mode actuel ne capitalise jamais les intérêts impayés.

Deux modèles principaux :

## CAPITAL_FIRST

Prêt : 5 000  
Taux : 5 %  
Remboursement : 1 000

- intérêt courant : 250 ;
- capital payé : 1 000 ;
- capital restant : 4 000 ;
- intérêt impayé : 250 ;
- dette affichée : 4 250 ;
- prochaine assiette d'intérêt : **4 000**.

## INTEREST_FIRST

- intérêt courant : 250 ;
- intérêt payé : 250 ;
- capital payé : 750 ;
- capital restant : 4 250 ;
- prochaine assiette : **4 250**.

Les deux modèles sont proposés car ils représentent des pratiques réelles.

## Imputation explicite — Proposition 3.0

Le responsable indique :

> sur 1 000 reçus, 750 sont affectés au capital et 250 à l'intérêt.

Cette imputation est auditée.

---

# 11. Épargne et distribution exacte des intérêts
**Statut : BÊTA FONCTIONNELLE ; moteur exact par dépôt implémenté.**

## 11.1 Principe expliqué simplement

On ne prend **jamais le total annuel d'un membre pour lui appliquer un seul coefficient**.

Chaque dépôt garde sa période.

Exemple :

Paul :
- janvier : 100 000 × coef 9 ;
- mars : 50 000 × coef 7 ;
- septembre : 200 000 × coef 1.

Son score est la **somme des trois scores**.

Cela respecte simultanément :

- la taille du montant ;
- la précocité du dépôt.

Ainsi :

- 100 000 de janvier avec coefficient 9 obtient plus de poids que 100 000 de septembre avec coefficient 1 ;
- mais 1 000 000 de septembre peut légitimement avoir plus de poids que 100 000 de janvier.

## 11.2 Coefficients configurables

Mensuel, bimensuel, trimestriel ou calendrier libre.

Compatibilité ancien classeur :

9 ; 8 ; 7 ; 6 ; 5 ; 4 ; 3 ; 2 ; 1 ; 0,5 ; 0 ; 0.

Le Bureau peut remplacer cette série.

## 11.3 Quatre modes

1. **Exact Weighted Deposits — recommandé par défaut**
   - chaque dépôt × coefficient ;
   - partage proportionnel du vrai pool d'intérêts.

2. **Legacy Excel**
   - reproduit l'intention historique et ses coefficients ;
   - ne reproduit pas les erreurs de références de cellules.

3. **Coefficients libres**
   - mensuels, bimensuels, trimestriels ou personnalisés.

4. **Hybride Temps/Montant**
   - permet de diminuer l'influence disproportionnée d'un montant très élevé ;
   - reste une option, pas une vérité universelle.

## 11.4 Garantie 100 %

L'enveloppe à distribuer est connue avant le calcul.

Exemple :

Pool réel = 300 000 F.

Le système calcule les quotes-parts exactes puis utilise une règle déterministe de **plus grands restes** pour répartir les francs d'arrondi.

Résultat obligatoire :

**Somme des gains = 300 000 F exactement.**

Jamais 299 998 ou 300 002.

## 11.5 Sous-enveloppes

Exemple historique :

- Épargne : 70 % ;
- Épargne scolaire : 10 % ;
- indemnités Bureau : 20 %.

Ces pourcentages sont configurables et la somme des sous-enveloppes doit elle aussi égaler exactement le pool initial.

---

# 12. RECAP Financier global
**Statut : moteur de base BÊTA implémenté ; UI complète à poursuivre.**

Lignes : membres.

Colonnes :

- positives ;
- négatives ;
- total.

Les colonnes sont configurables.

Exemples positifs :

- Épargne ;
- intérêts Épargne ;
- Épargne scolaire ;
- intérêts scolaires ;
- montant remboursable Secours ;
- avoir projet ;
- bonus.

Exemples négatifs :

- capital prêt restant ;
- intérêts exigibles ;
- impayés ;
- retenue Tontine ;
- pénalité ;
- autres déductions.

## 12.1 Ajustement manuel gouverné

La valeur automatique n'est jamais détruite.

Exemple :

- automatique : 24 500 ;
- correction responsable : 22 000 ;
- ajustement : -2 500 ;
- raison : décision AG du 12/09 ;
- auteur et date enregistrés.

## 12.2 Colonnes manuelles

Le responsable peut créer 2, 3 ou davantage de colonnes temporaires positives/négatives.

## 12.3 Hyperliens

Cliquer sur « Épargne » ouvre le détail :

- dépôts ;
- séances ;
- reçus ;
- contrepassations ;
- calcul d'intérêts.

---

# 13. Clôture / Cassation / Caisses reconduites
**Statut : moteur de carryover BÊTA implémenté.**

La caisse de clôture ne devient pas un simple nombre sans explication.

Elle est décomposée.

Exemple :

Caisse physique : 2 600 000

dont :
- Fonds Secours membres : 1 200 000 ;
- Fonds Projet : 700 000 ;
- réserve fonctionnement : 100 000 ;
- cash non affecté : 600 000.

## 13.1 Secours par membre

Le fonds Secours transporte la liste :

| membre | montant déjà retenu |
|---|---:|
| M001 | 48 000 |
| M002 | 36 000 |
| M003 | 60 000 |

La somme de ces réserves peut constituer la première composante du solde initial N+1.

## 13.2 Autres fonds

Toute caisse peut recevoir une `CarryoverPolicy` :

- Projet ;
- matériel ;
- fonds immobilier ;
- réserve exceptionnelle ;
- autres.

Le système interdit de promettre en fonds reconduits plus que la caisse physique disponible.

---

# 14. Premium Live Ledger / Live Coordination
**Statut : ACQUIS SUR PILOTE ISOLÉ.**

Architecture actuelle :

**D1 = vérité financière canonique**  
**Durable Object = coordination temps réel**

Le DO ne maintient pas un second solde autonome.

## 14.1 Chaîne d'une cotisation

1. écriture Ledger + reçu + audit + projection outbox ;
2. confirmation de la transaction ;
3. projection vers avis membre ;
4. publication Live ;
5. WebSocket/reprise.

Si Live tombe après l'étape 1 :

- la cotisation reste réussie ;
- elle n'est pas transformée en échec HTTP ;
- la projection est réessayée.

## 14.2 Reprise

La pagination n'est plus limitée aux 500 premiers événements.

Le client peut reprendre après 500, 1 000, etc.

## 14.3 Avis membre

Après une opération :

> +2 000 F  
> nouvelle situation : 48 000 F  
> auteur : Trésorier  
> [Valider] [Émettre une réserve]

Une réserve ne modifie pas silencieusement le Ledger.

---

# 15. Identité et CNI
**Statut : BÊTA FONCTIONNELLE.**

La CNI est un indice d'identité important lorsque le groupe la collecte légalement.

Eco-System ne stocke pas le numéro brut dans le mécanisme de rapprochement.

Pipeline :

CNI normalisée → HMAC avec secret serveur → token → comparaison exacte.

Le serveur peut détecter :

> « ce compte pourrait correspondre à cette fiche historique »

sans exposer le numéro CNI dans les résultats.

Niveaux de rapprochement possibles :

- CNI exacte protégée ;
- code/QR sécurisé ;
- téléphone vérifié ;
- nom + autres éléments ;
- validation responsable en cas d'ambiguïté.

La CNI n'est pas utilisée comme critère publicitaire.

---

# 16. Forum et communautés
**Statut : BÊTA FONCTIONNELLE.**

Deux concepts restent séparés.

## 16.1 Forum/Hubs d'un groupe

Exemple :

**Forum CERDAS**

- discussion ;
- annonce ;
- offre ;
- demande ;
- modération ;
- espace privé/public ;
- fédération contrôlée.

## 16.2 Communautés d'intérêt indépendantes

Exemple :

**Yaoundé by Night**

Elle peut exister sans Tontine.

Fonctions :

- rejoindre/créer ;
- publication ;
- événement ;
- lieu ;
- offre/demande ;
- tags ;
- localité ;
- politiques d'adhésion.

### Propositions 3.0

- réponses imbriquées ;
- réactions ;
- épinglage ;
- sondages ;
- abonnements ;
- recherche ;
- réputation ;
- modération graduée ;
- suggestions EcoPulse.

---

# 17. Partenaires et ONG
**Statut : BÊTA FONCTIONNELLE spécialisée.**

Un responsable peut créer :

- un partenariat ;
- un programme ONG.

Exemples :

- institution financière ;
- microfinance ;
- assurance ;
- fournisseur ;
- opérateur ;
- logistique ;
- centre de formation ;
- administration ;
- ONG de développement.

## 17.1 Données financières agrégées autorisables

Un partenaire ne reçoit pas :

> Serge a 73 000 F de Secours.

Il peut recevoir, si le groupe autorise le partage :

> ECO-GRP-A83...  
> Tontine Savons : 150 000 F collectés  
> Épargne : 2 800 000 F collectés  
> 25 membres actifs  
> masse entrées/sorties agrégées.

Le dossier est :

- pseudonymisé ;
- borné dans le temps ;
- révocable ;
- audité ;
- bloqué lorsque le seuil d'agrégation n'est pas atteint ;
- bloqué lorsque PARTNER_MATCHING est désactivé.

## 17.2 ONG

Programme ONG :

- organisation ;
- programme ;
- objet ;
- localités ;
- thèmes ;
- groupes accompagnés ;
- données autorisées ;
- état du programme.

Propositions :

- indicateurs personnalisés ;
- formations ;
- animateurs ;
- subventions ;
- matériel distribué ;
- rapport de résultats ;
- suivi agrégé multi-groupes.

---

# 18. AdManager Eco-System
**Statut : BÊTA FONCTIONNELLE spécialisée, facturation réelle désactivée.**

AdManager ne doit pas devenir une usine à bannières.

## 18.1 Campagne

Cycle :

DRAFT → PENDING_REVIEW → APPROVED → ACTIVE → PAUSED/COMPLETED.

Une campagne ne peut pas passer directement de brouillon à active.

## 18.2 Objectifs

- notoriété ;
- rejoindre une communauté ;
- événement ;
- ouvrir un Deal ;
- achat groupé ;
- lead ;
- programme partenaire.

## 18.3 Ciblage autorisé

- localité ;
- centre d'intérêt ;
- type de groupe ;
- type de rubrique ;
- tranche de masse monétaire **agrégée au niveau groupe/rubrique**.

Exemple autorisé :

> groupes de Yaoundé ayant une Tontine Savons dans une bande agrégée de 100 000 à 500 000 F.

Exemples interdits :

- membres endettés ;
- Serge a un prêt ;
- CNI ;
- numéro de téléphone ;
- solde individuel ;
- santé ;
- litige ;
- religion/politique et autres catégories sensibles.

## 18.4 Frequency cap

Une campagne ne doit pas poursuivre l'utilisateur.

Le système plafonne le nombre d'expositions sur une période.

## 18.5 Analytics

- impressions ;
- ouvertures ;
- actions ;
- retours négatifs ;
- conversion vers destination interne.

### Propositions 3.0

- enchères internes par placement ;
- contrôle budgétaire ;
- A/B testing ;
- pacing quotidien ;
- coût par résultat ;
- brand-safety ;
- inventaire sponsorisé dans communautés ;
- attribution Deal/Achat groupé/événement ;
- tableau annonceur ;
- anti-fraude clic/impression.

---

# 19. Vision économique
## « Eco-System gratuit au cœur, financé par l'économie qu'il rend possible »

Le cœur membre/groupe doit rester autant que possible gratuit.

Eco-System ne doit pas dépendre d'une seule source de revenus.

Principe :

**ne pas vendre les personnes ; valoriser la demande, les services et les agrégats.**

---

# 20. Pourquoi la commission classique est trop fragile

Scénario fragile :

Eco-System → envoie client → vendeur et client se rencontrent → négocient → paient cash → vendeur déclare « aucune vente ».

La plateforme supporte les coûts mais ne capture aucun revenu.

La stratégie 3.0 consiste donc à créer des revenus **avant, pendant ou indépendamment de la déclaration volontaire de la vente**.

---

# 21. Eco-System Economic Flywheel

Groupes
↓  
Besoins/rubriques/projets
↓  
Demande agrégée
↓  
Pouvoir de négociation
↓  
Appel d'offres / Deal exclusif
↓  
Prix ou conditions meilleurs
↓  
Plus de groupes utilisent Eco-System
↓  
Plus de demande agrégée
↓  
Meilleures conditions partenaires
↓  
Revenus Eco-System + économies utilisateurs

Le véritable actif économique n'est pas le fichier des utilisateurs.

C'est **la capacité de concentrer et comprendre une demande réelle**.

---

# 22. Demand Exchange — proposition prioritaire

Eco-System peut détecter, sous forme pseudonymisée :

- 37 groupes veulent du savon ;
- quantité cumulée : X ;
- fenêtre : octobre ;
- prix cible médian : Y ;
- zones : Yaoundé/Douala.

Puis inviter des fournisseurs à soumissionner.

## 22.1 Reverse auction

Les fournisseurs proposent :

- prix unité ;
- transport ;
- quantité disponible ;
- délai ;
- fiabilité.

Le moteur calcule le **landed cost** :

prix + transport + contraintes.

Le fournisseur le moins cher n'est pas automatiquement choisi s'il ne peut pas livrer la quantité ou s'il est peu fiable.

---

# 23. Rendre le contournement économiquement peu intéressant

Eco-System ne doit pas empêcher deux personnes de parler.

Il doit rendre la transaction capturée plus avantageuse.

## 23.1 Deal Lock

Avantages réservés au token Eco-System :

- prix négocié ;
- quantité garantie ;
- livraison ;
- garantie ;
- preuve ;
- litige ;
- points ;
- priorité ;
- bonus partenaire.

Si le client sort du parcours, ces avantages peuvent disparaître.

## 23.2 Négociation native

Bouton :

**Faire une offre**

Vendeur :
- accepte ;
- refuse ;
- contre-propose.

La négociation camerounaise devient une fonctionnalité du produit.

## 23.3 Achat groupé

10 acheteurs → prix A  
50 acheteurs → prix B  
100 acheteurs → prix C.

---

# 24. Les rails de revenus Eco-System

Le moteur économique reconnaît déjà plusieurs familles :

1. **ADS** — AdManager ;
2. **SPONSORING** — contenu/programme sponsorisé ;
3. **SUPPLIER_ACCESS** — accès aux appels d'offres/demandes agrégées ;
4. **DEAL_RESERVATION** — réservation du prix/avantage ;
5. **GROUP_BUY** — rémunération contractualisée d'achat groupé ;
6. **VERIFIED_LEAD** — prospect vérifié par token/QR/action mesurable ;
7. **PARTNER_SAAS** — outils professionnels ;
8. **NGO_PROGRAM** — gestion de programme/rapports ;
9. **INSIGHTS** — intelligence statistique agrégée ;
10. **PRO_SERVICES** — services avancés ;
11. **EVENTS** — billetterie/promotion ;
12. **DOCUMENT_SERVICES** — impression, dossiers, exports, assistance documentaire.

## Règle

Aucun rail ne doit représenter à lui seul la survie de l'entreprise.

---

# 25. Revenus qui résistent au contournement

Priorité aux revenus qui ne dépendent pas de :

> « vendeur, veuillez nous dire si vous avez vendu ».

Exemples :

- forfait campagne payé avant diffusion ;
- sponsoring ;
- abonnement professionnel ;
- frais d'accès fournisseur à un appel d'offres ;
- programme ONG ;
- abonnement Insights ;
- réservation de Deal ;
- coupon unique/QR consommé ;
- frais de lead vérifié ;
- services documentaires ;
- logistique contractualisée.

La commission sur vente capturée devient un rail supplémentaire, pas l'unique fondation.

---

# 26. Eco-System Insights

Produit B2B agrégé.

Exemples :

- évolution des masses par type de rubrique ;
- besoins de savon/huile/textile ;
- saisonnalité des dépenses ;
- zones de forte demande ;
- rythme de création des groupes ;
- taille moyenne des achats groupés ;
- taux de participation aux programmes.

Jamais :

- fiche financière nominative d'un membre ;
- dettes individuelles ;
- CNI ;
- téléphone.

## Seuils

Les segments trop petits ne sont pas exportables.

Un groupe peut également couper explicitement PARTNER_MATCHING.

---

# 27. Analytics et intelligence économique

Séparer :

**D1** : transactions et vérités métier.  
**Analytics Engine** : événements analytiques à grande fréquence.  
**R2** : documents/médias/archives selon activation.  
**Durable Objects** : coordination Live.  

Événements économiques :

- deal_viewed ;
- offer_made ;
- deal_reserved ;
- group_buy_joined ;
- supplier_bid_received ;
- coupon_redeemed ;
- ad_impression ;
- ad_action ;
- event_rsvp ;
- lead_verified ;
- marketplace_order ;
- dispute.

Objectif :

savoir où la valeur est créée et où elle fuit.

---

# 28. Economic Control Center — Proposition 3.0

Cockpit fondateur :

- utilisateurs/groupes actifs ;
- masse monétaire agrégée ;
- demande agrégée ;
- GMV influencé ;
- GMV capturé ;
- taux de fuite ;
- revenu Ads ;
- sponsoring ;
- fournisseur ;
- réservations ;
- SaaS ;
- ONG ;
- Insights ;
- coût Cloudflare ;
- coût IA ;
- coût paiement ;
- marge par rail ;
- revenu/marge par groupe de fonctionnalités.

Formule :

**Marge = revenus - coûts techniques - paiement - modération - support - partenaires.**

Une fonctionnalité populaire mais déficitaire doit être visible comme telle.

---

# 29. Paiements : progression pragmatique

L'argent réel reste OFF tant qu'une qualification réglementaire, technique et contractuelle n'est pas réalisée.

Progression souhaitée :

1. découverte/comparaison ;
2. réservation ;
3. acompte ;
4. paiement marchand partenaire ;
5. paiement complet ;
6. achat groupé.

Le Mobile Money doit être prioritaire au Cameroun.

Le paiement marchand ou QR peut servir à verrouiller un Deal sans obliger immédiatement Eco-System à détenir les fonds.

---

# 30. Cockpit membre

Accueil :

- groupes ;
- solde global ;
- dettes ;
- prochaine réunion ;
- prochain pot ;
- avis financiers à confirmer ;
- messages ;
- communautés ;
- opportunités/Deals pertinents.

Carte CERDAS :

> Secours : 18 000 / 24 000  
> Épargne : 215 000  
> Prêt : capital 40 000 + intérêts 2 000  
> Tontine Savons : prochain tour 8  
> Prochaine séance : samedi.

---

# 31. Cockpit gestionnaire

- réunions à préparer ;
- écarts de caisse ;
- impayés ;
- réserves membres ;
- tontines à servir ;
- obligations ;
- rapprochements historiques ;
- programmes partenaires/ONG ;
- campagnes AdManager ;
- clôture ;
- santé Live/offline.

---

# 32. Sécurité des données

Principes :

- moindre privilège ;
- sessions serveur ;
- pas d'identité fournie par headers clients non fiables ;
- isolation tenant/groupe ;
- idempotence ;
- journal d'audit ;
- secrets hors dépôt ;
- données sensibles exclues du ciblage ;
- HMAC pour CNI de rapprochement ;
- profils économiques pseudonymisés ;
- dossiers partenaires expirants/révocables ;
- migrations additives.

La loi camerounaise n°2024/017 du 23 décembre 2024 relative à la protection des données personnelles doit faire partie du cadre de conformité ; la conception finale doit être validée juridiquement avant exploitation commerciale à grande échelle.

---

# 33. Profil BETA_OPEN

BETA_OPEN permet de tester le plein potentiel :

- recommandations ;
- apprentissage non sensible ;
- découverte communauté ;
- matching partenaires.

Mais un **OFF explicite reste OFF**.

C'est désormais un invariant.

---

# 34. Accessibilité terrain

- français/anglais ;
- gros boutons ;
- 48 px environ pour actions tactiles importantes ;
- Ultra Simple ;
- assistant oral ;
- lecture à voix haute lorsque disponible ;
- faible débit ;
- PWA offline ;
- impression ;
- parcours sans jargon ;
- messages expliquant l'action suivante.

---

# 35. Budget technique Cloudflare — hypothèses à surveiller

En septembre 2026, les documentations Cloudflare indiquent notamment :

- D1 Free : 5 M lignes lues/jour, 100 000 lignes écrites/jour, 5 Go par compte ;
- ces limites quotidiennes Free sont désormais effectivement bloquantes lorsqu'elles sont dépassées ;
- Workers Free : 100 000 requêtes/jour ;
- Analytics Engine Free : 100 000 datapoints/jour et 10 000 requêtes de lecture/jour ;
- R2 : allocation gratuite de stockage/opérations selon la grille courante ;
- Workers AI : allocation gratuite quotidienne puis facturation sur plan payant.

**Règle :** re-vérifier les tarifs/limites avant chaque décision budgétaire importante.

---

# 36. Stratégie de coût

Pour rester gratuit au cœur :

- ne pas journaliser chaque clic dans D1 ;
- utiliser Analytics Engine pour les événements analytiques ;
- agréger ;
- cache ;
- pagination ;
- lectures bornées ;
- écritures idempotentes ;
- R2 pour médias/documents volumineux ;
- DO seulement pour groupes actifs en Live ;
- IA coûteuse uniquement lorsqu'elle apporte une valeur mesurable.

---

# 37. Critères anti-régression permanents

La CI doit vérifier au minimum :

- 10 étapes exactement ;
- libellé Collation ;
- multi-tontines ;
- participants différents ;
- nature/argent/mixte ;
- Ledger équilibré ;
- pot Tontine avec preuve Ledger ;
- aucun intérêt sur intérêt ;
- intérêt Épargne par dépôt/période ;
- distribution exacte du pool ;
- RECAP +/− ;
- caisse Secours reconduite ;
- fonds Projet reconduit ;
- Live au-delà de 500 ;
- panne Live sans annuler une écriture déjà commitée ;
- isolation groupe A/groupe B ;
- OFF explicite respecté ;
- CNI brute non stockée dans le matching ;
- données financières partenaires agrégées uniquement ;
- AdManager sans ciblage financier individuel ;
- PWA offline ;
- FR/EN ;
- `realMoneyEnabled=false` jusqu'à autorisation.

---

# 38. Procédure BIR+ anti-interruption

Une conversation ChatGPT peut s'arrêter à cause d'une limite d'usage ou de contexte. Le logiciel ne doit jamais dépendre de la conversation pour conserver l'état du projet.

## Règle obligatoire

Après chaque lot atomique significatif :

1. commit Git ;
2. CI ;
3. CURRENT_TRUTH ;
4. PROJECT_TRUTH_LEDGER ;
5. NEXT_RUN ;
6. point de reprise ;
7. sauvegarde BIR+ lorsque le jalon le justifie.

**Aucun travail critique ne doit rester seulement dans la mémoire du chat.**

## Checkpoint de conversation

Toutes les 20–30 minutes de travail intensif ou après 3–5 sous-lots :

- HEAD ;
- changements ;
- tests ;
- reste ;
- prochaine action.

Ainsi, une interruption devient seulement une interruption d'interface, pas une perte de projet.

---

# 39. État de la ligne 1.3.1 au 16 septembre 2026

### Vérifié

- création en 10 étapes ;
- Collation corrigée ;
- multi-tontines ;
- Tontine Manager permanent ;
- preuve Ledger des pots ;
- prêts sans intérêt sur intérêt ;
- savings yield par dépôt ;
- coefficients Legacy dont octobre 0,5 ;
- distribution exacte ;
- RECAP moteur ;
- RECAP de séance ;
- Secours/Projet carryover ;
- consentements OFF explicites ;
- CNI matching HMAC ;
- profil économique pseudonymisé ;
- AdManager spécialisé ;
- moteur de demande/fournisseurs/marge ;
- Partners/ONG spécialisés ;
- Live outbox ;
- replay >500 ;
- pilote Premium Live end-to-end.

### Toujours à poursuivre

- expérience visuelle complète du RECAP financier ;
- enrichissement automatique des sources Excel ;
- Rule Architect plus conversationnel ;
- forum avancé (réponses/sondages/réactions) ;
- Deals/Offers/Negotiation spécialisés ;
- Analytics Engine distant ;
- Economic Control Center ;
- services ONG avancés ;
- intégrations WhatsApp/SMS/Email ;
- Mobile Money réel ;
- tests terrain seniors/2G/anciens téléphones.

---

# 40. Exemple CERDAS — démonstrateur de référence

Le RI CERDAS peut servir de scénario de qualification car il combine :

- inscription ;
- CNI ;
- réunions mensuelles ;
- Collation ;
- Secours ;
- Assistance ;
- Main levée ;
- prêts ;
- intérêts ;
- timbre ;
- amendes ;
- tenue ;
- fête de fin d'exercice.

Le Rule Architect doit pouvoir :

1. extraire ces concepts ;
2. proposer les rubriques ;
3. signaler les contradictions ;
4. demander validation ;
5. produire des policies ;
6. simuler ;
7. créer le groupe.

---

# 41. Définition de « terminé »

Une fonction n'est terminée que si :

- parcours accessible ;
- données persistées ;
- permissions ;
- erreurs ;
- audit si sensible ;
- offline si nécessaire ;
- tests ;
- documentation ;
- vérité projet mise à jour ;
- preuve distante si elle dépend du Cloud.

---

# 42. Point de reprise produit

Le développement doit continuer sur la ligne 1.3.1 sans fusion automatique de `main`.

Avant toute modification future :

1. lire Current Truth ;
2. vérifier HEAD ;
3. vérifier derniers runs ;
4. lire les acquis ;
5. consulter les dépendances ;
6. établir impact/non-régression ;
7. implémenter petit lot ;
8. tester ;
9. mettre à jour la vérité ;
10. seulement ensuite poursuivre.

---

# 43. Vision finale

Eco-System doit devenir simultanément :

- le **système d'exploitation d'une association** ;
- le **moteur financier d'une tontine** ;
- le **concierge des membres** ;
- le **réseau communautaire des groupes** ;
- le **marché agrégé de leurs besoins** ;
- la **porte d'entrée des partenaires et ONG** ;
- le **moteur publicitaire respectueux d'AdManager** ;
- l'**observatoire économique pseudonymisé** ;
- et une **infrastructure gratuite pour l'utilisateur, financée par la valeur économique qu'elle permet de créer**.

La plateforme gagne non pas parce qu'elle sait tout de chaque personne, mais parce qu'elle comprend mieux que quiconque — de façon gouvernée — **ce dont les groupes ont besoin, quand ils en ont besoin, en quelle quantité, sous quelles règles et avec quelle valeur économique agrégée**.
