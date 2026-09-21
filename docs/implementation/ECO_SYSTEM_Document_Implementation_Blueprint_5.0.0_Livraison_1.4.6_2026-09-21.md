# ECO-SYSTEM — DOCUMENT D’IMPLÉMENTATION EXÉCUTABLE
## Livraison 1.4.6 · Centre opérationnel · Séances · Communautés & valeur · Blueprint 5.0.0

**Date : 21 septembre 2026**  
**Branche :** `next/1.4.6-ui-sessions-community-blueprint-final-20260921`  
**Base :** 1.4.5 qualifiée, elle-même descendante de 1.4.4 et de la production Blueprint 1.4.3.  
**Blueprint de référence :** `ECO_SYSTEM_Blueprint_Executable_5.0.0_FINAL_2026-09-21.docx`.  
**Règle :** ce document peut être exécuté par Codex, ChatGPT, un développeur humain ou un autre agent compétent. Aucun intervenant n’a le droit de réinterpréter la vision au point de recréer des moteurs parallèles ou de supprimer les acquis.

---

# 1. Vision de départ à préserver

Eco-System part d’abord de l’Association/Tontine : groupe, membres, règles, séances, contributions, caisses, preuves, prêts, épargne, solidarité, bénéficiaires, gouvernance et Récap. Ce cœur n’est ni réduit ni remplacé.

Autour du cœur, Eco-System doit aider :
- le membre à comprendre sa situation, ses obligations, ses acquis, ses compétences et ses possibilités ;
- le Bureau à organiser, anticiper, décider et contrôler ;
- le groupe à présenter ce qu’il sait faire, produit, possède, cherche ou peut offrir ;
- les fermiers, producteurs, GIC, coopératives, associations, commerçants, artisans, prestataires, créateurs et professionnels à être trouvés et accompagnés via leur groupe ou individuellement selon les droits ;
- les communautés à transformer des discussions utiles en besoins, offres, apprentissages, projets et opportunités ;
- les partenaires/ONG/programmes à accompagner sans accéder automatiquement aux finances individuelles ;
- la plateforme à construire de la valeur au-delà des tontines, sans perdre la priorité du cœur Association/Tontine.

Doctrine :
`OBSERVE / PREDICT → PROPOSE → HUMAN VALIDATION → EXECUTE IN CANONICAL OWNER`.

Interdictions :
- prévision ≠ demande ;
- demande ≠ engagement ;
- engagement ≠ transaction ;
- interface ≠ preuve de paiement ;
- Blueprint ≠ second Ledger/Marketplace/Forum ;
- `realMoneyEnabled=false` tant qu’une qualification paiement séparée n’existe pas.

---

# 2. Conventions universelles

## 2.1 Une activité significative = une autorité canonique
- finance : Ledger/D1 ;
- séance, présence, bénéficiaire : MeetingService ;
- preuve : KERNEL.EVIDENCE ;
- identité groupe : GroupIdentityService ;
- dette : ReceivablesService ;
- Tontines : Tontine Manager/Completion ;
- Marketplace : MARKETPLACE.CORE ;
- Group Buy : MARKETPLACE.GROUP_BUY ;
- Forum : COMMUNITY.FORUM ;
- Hubs : COMMUNITY.PRO_HUBS ;
- partenaires : PARTNERS.DIRECTORY ;
- opportunités : OPPORTUNITY ;
- anti-arnaques : SAFETY.ANTISCAM ;
- Blueprint : orchestration uniquement.

## 2.2 Réutiliser → étendre → adapter avant de créer
Toute nouvelle fonction doit d’abord rechercher l’owner existant. Si l’owner couvre la même responsabilité, on l’étend. Un adapter est utilisé pour une intégration externe. Un nouveau moteur est créé uniquement pour une responsabilité réellement nouvelle.

---

# 3. Lot UI 1.4.6 — Centre opérationnel distinct de Séances

## 3.1 Centre opérationnel
Le menu historique autrefois appelé « Séances » devient explicitement **Centre opérationnel**.

Il conserve, sans destruction :
- les deux feuilles financières ;
- le pilotage des membres ;
- le cycle de vie ;
- la participation par rubrique ;
- les impayés ;
- les rapports ;
- le recrutement et la communication ;
- les règles vivantes ;
- les configurations « Autres » ;
- le mode offline historique ;
- les accès Tontines ;
- PV/actions historiques.

Les éléments directement liés à une réunion sont présentés comme **accès historique / compatibilité**, avec un bouton visible vers le vrai module Séances. Les anciens identifiants DOM/routes restent conservés si leur suppression casserait une intégration.

## 3.2 Séances
Le menu **Séances** est une vue distincte et centrée sur une réunion précise.

En-tête :
- Réunion du… ;
- groupe ;
- exercice/cycle ;
- date/heure ;
- lieu/canal ;
- thème ;
- tenue ;
- précédente/actuelle/suivante ;
- création/programming ;
- accès fiche détaillée.

Huit onglets obligatoires :
1. Vue d’ensemble
2. Feuille de séance
3. Présences
4. Bénéficiaires & preuves
5. Récap & caisse
6. Dettes & amendes
7. Classements & programmation
8. Historique

### Vue d’ensemble
Projette les données canoniques de la séance. Aucun second calcul financier.

### Feuille de séance
Réutilise la même vérité que les deux feuilles historiques. La saisie/correction continue d’utiliser le composant canonique et la politique append-only.

### Présences
Lecture/écriture via MeetingService. L’ancien Centre opérationnel doit appeler la même API ; aucun workspace parallèle `MEETING.ATTENDANCE`.

### Bénéficiaires & preuves
Séquence :
déclaration → code ECO-RCP non secret → confirmation personnelle / émargement papier / photo-PDF → Evidence immuable → audit → idempotence.

### Récap & caisse
Solde d’ouverture, recettes, dépenses, théorique, compté, écart. Si absence de rapprochement : « À rapprocher », jamais valeur inventée.

### Dettes
Manager : groupe selon droits. Membre simple : uniquement ses propres obligations, filtrage dans ReceivablesService.

### Classements
Précédente/actuelle/suivante, bénéficiaires, parts Tontine et liens vers Tontine Manager.

### Historique
Présences, bénéficiaires, preuves, PV et actions lisibles. L’audit serveur reste l’autorité probatoire.

---

# 4. Mobile et lisibilité

Sur téléphone :
- navigation principale horizontalement scrollable ;
- aucun menu important masqué ;
- boutons de 108–110 px environ, hauteur ≥ 48 px ;
- icône + libellé court ;
- libellé desktop complet conservé ;
- Centre opérationnel → « Centre op. » ;
- Membres & habilitations → « Membres » ;
- Communautés & valeur → « Communautés » ;
- Sécurité & réglages → « Réglages ».

Les huit onglets Séances utilisent aussi un libellé mobile court :
Vue, Feuille, Présences, Bénéf., Récap, Dettes, Classement, Historique.

Les presets de forums/communautés doivent défiler horizontalement au lieu d’être coupés ou comprimés.

---

# 5. Blueprint 5.0.0 — exécution harmonisée

Le Blueprint reste visible dans **Communautés & valeur**, avec six couches.

## Couche 1 — Association/Tontine d’abord
### GROUP.ANTICIPATION
Observe cycle, calendrier, Living Rules, historique, dettes et signaux. Produit des propositions, jamais des modifications automatiques.

### GROUP.MEETING_AUTOPILOT
Prépare un brouillon : date, équipe, budget de travail, lieu, invitations, besoins, logistique. Validation humaine nécessaire.

### GROUP.DOCTOR
Détecte anomalies, règles manquantes, créances, incohérences, blocages. Il explique et renvoie vers l’owner.

### Brief du Bureau
Synthèse : événements à venir, décisions, dettes, séance future, règles à vérifier, besoins et opportunités.

## Couche 2 — Besoins / Opportunity / Demand Exchange / Procurement
### OPPORTUNITY.NEED
Owner canonique pour « j’ai besoin », « le groupe cherche », « je peux proposer ».

### Demand Exchange
Agrège les besoins compatibles. Une demande agrégée n’est pas une commande.

### Procurement
Brouillon RFQ/sourcing/devis/comparaison.

### Group Buy
Handoff vers MARKETPLACE.GROUP_BUY existant, jamais un second achat groupé.

### Opportunity Graph
Personne ↔ Compétence ↔ Communauté ↔ Besoin ↔ Projet ↔ Produit ↔ Service ↔ Professionnel ↔ Fournisseur ↔ Formation ↔ Emploi ↔ Business ↔ Événement.

## Couche 3 — Eco NOW / Harvest / Fresh Drop / Pickup
### Eco NOW
Intentions « besoin maintenant » / « disponible maintenant ».

### Harvest
Forecast distinct du stock confirmé. Producteur, GIC, coopérative, association ou agrégateur mandaté.

### Fresh Drop
Produit, unité, qualité, origine, quantité, date, lieu, conditions, retrait.

### Pickup
Capacité de collecte/retrait/micro-hub ; pas de flotte Eco obligatoire.

## Couche 4 — Value Discovery / Business / Talent / Creator
### Value Discovery
« Ce que j’ai / sais faire / peux mobiliser ». L’IA suggère à partir de besoins réels sans promettre de revenu.

### Eco Business
Activité, catalogue, prospects, devis, commandes, analytics. Pas de second Marketplace.

### Business Agent
Brouillons et assistance : n’invente pas prix, paiement ou stock.

### Talent
Learn → Prove → Work → Earn. Les preuves restent explicables.

### Creator & Seller Studio
Content-to-Action : apprendre, rejoindre, réserver, acheter, découvrir.

## Couche 5 — Communautés / Forums / Hubs / partenaires / Academy
Aucun second réseau social.

Presets Hubs :
- Forum principal ;
- Opportunités ;
- Marché & besoins ;
- Compétences & emploi ;
- Agriculture & production ;
- Business & fournisseurs ;
- Formation & transmission ;
- ONG · partenaires · impact ;
- Créateurs & vitrines ;
- Actualités sourcées & tendances.

Presets publication :
- Besoin ;
- Offre ;
- Achat groupé ;
- Récolte / arrivage ;
- Compétence / service ;
- Formation / savoir ;
- Activité / vitrine ;
- Partenaire / programme ;
- Création / contenu utile ;
- Info sourcée ;
- Tendance / Buzz.

Un message Forum peut devenir besoin/offre via OPPORTUNITY. Il doit demander une confirmation humaine et ne crée aucune transaction.

### Forum de groupe
Vie, décisions, annonces, échanges + contexte d’action.

### Communautés d’intérêt
Métier, ville, agriculture, jeunesse, formation, loisirs, commerce. Elles n’accèdent pas automatiquement aux données privées des groupes.

### Forum principal plateforme
Découverte/circulation de valeur avec modération et labels : information, opinion, tendance, sponsorisé.

### Hubs professionnels
Publics ou privés. Une fédération de groupes partage uniquement les codes identitaires publics, pas les listes de membres ni soldes.

### Partenaires / ONG
Programmes traçables. Aucun financement ou soutien n’est inventé.

### Academy
Formation, mentorat, savoir-faire et transmission.

## Couche 6 — Trust / Market Intelligence / Anti-arnaques
### Trust Graph
Preuves explicables, jamais score opaque de valeur humaine.

### Market Intelligence
Signaux agrégés/gouvernés.

### Financial Lab
Analyse déterministe éducative. Ne conclut pas légalement « Ponzi » ou « arnaque ».

---

# 6. Agriculture et groupes producteurs

Une Association, GIC ou coopérative inscrite peut présenter :
- productions ;
- disponibilités prochaines ;
- stocks confirmés ;
- besoins d’intrants ;
- besoins d’acheteurs ;
- compétences ;
- moyens de stockage/retrait ;
- projets ;
- besoins d’accompagnement.

Harvest Radar :
- disponibilité estimée ;
- période ;
- plage de quantité ;
- confiance ;
- marchés possibles.

Règles :
- prévision ≠ stock ;
- prix de référence barré uniquement si documenté ;
- unité/grade/poids/tolérance normalisés ;
- lot traçable ;
- date déclarée vs vérifiée distincte ;
- pertes, météo, qualité, retard et rappel prévus ;
- optimiser valeur client ET revenu net producteur.

Backhaul/Return Load pour gros transporteurs reste explicitement un projet autonome.

---

# 7. Accompagnement des utilisateurs et présentation des acquis

Eco-System doit permettre à un utilisateur/groupe de présenter, selon consentement :
- ce qu’il possède ;
- ce qu’il produit ;
- ses compétences ;
- ses formations ;
- ses preuves ;
- ses réalisations ;
- ses services ;
- ses besoins ;
- ses projets ;
- sa disponibilité.

Le système ne transforme pas ces éléments en score humain opaque. Il les relie à Opportunity, Discovery, Academy, Business, Community et Marketplace.

Pour un groupe, les acquis peuvent inclure :
- ancienneté ;
- activités menées ;
- productions ;
- projets accomplis ;
- formations ;
- partenariats ;
- preuves/évaluations ;
- événements ;
- réalisations communautaires.

---

# 8. Intégrité financière maintenue

Toute correction :
original → contrepassation → nouvelle écriture → motif → auteur → revue indépendante.

L’auteur ne valide pas sa propre correction.

Les réserves membres restent distinctes de la comptabilité.

Offline ne fabrique jamais une réussite serveur.

---

# 9. PWA et visibilité de livraison

La release doit :
- incrémenter version HTML/runtime/health ;
- incrémenter le cache Service Worker ;
- précacher Sessions, Blueprint, Community Presets et modules critiques ;
- garder navigation network-first ;
- charger JS/CSS avec cache-busting 1.4.6 ;
- forcer le contrôle de mise à jour du Service Worker existant.

But : un téléphone ayant vu 1.4.3 doit converger vers 1.4.6 après actualisation/réouverture, sans effacement de données.

---

# 10. Tests de non-régression 1.4.6

Obligatoires :
- Centre opérationnel visible ;
- menu Séances distinct ;
- contenu historique du Centre conservé ;
- huit onglets Séances ;
- MeetingService owner présence ;
- Evidence bénéficiaire inchangée ;
- navigation mobile avec libellés courts ;
- presets communautaires ;
- Forum → Opportunity ;
- six couches Blueprint ;
- guards `humanValidated=false`, `commercialCommitment=false`, `realMoney=false`;
- Group Buy/Forum/Hubs/Partners = handoffs canoniques ;
- Backhaul absent ;
- Opportunity 1.4.4 préservé ;
- Evidence Gate 1.4.4 préservé ;
- consensus multi-responsables 1.4.5 préservé ;
- PWA 1.4.6 ;
- tous tests historiques.

---

# 11. Déploiement

Ordre impératif :
1. CI complète du SHA final ;
2. vérification D1/R2 existants ;
3. BIR+ pré-déploiement ;
4. migrations additives uniquement ;
5. déploiement du même SHA ;
6. smoke health/version ;
7. smoke Centre/Séances/mobile/Blueprint/communautés ;
8. smoke Opportunity/Evidence/consensus ;
9. BIR+ post ;
10. mise à jour Project State / Current Truth / Truth Ledger / Feature Registry / NEXT_RUN ;
11. BIR+ fermeture ;
12. recette terrain.

---

# 12. Recette terrain fondatrice

Téléphone :
- Centre op. lisible ;
- Séances lisible ;
- aucun onglet coupé de manière inutilisable ;
- 8 onglets scrollables ;
- communautés/presets scrollables.

Bureau :
- créer/sélectionner séance ;
- présence ;
- bénéficiaire/preuve ;
- caisse ;
- dettes ;
- consensus multi-manager.

Communautés :
- créer Hub ;
- publier Besoin/Offre/Récolte/Compétence/etc. ;
- Transformer en besoin → Opportunity DRAFT ;
- vérifier qu’aucune transaction n’est créée.

Blueprint :
- créer DRAFT ;
- vérifier guards ;
- human validate ;
- handoff vers owner.

---

# 13. Interdictions d’interprétation

Ne jamais :
- supprimer les 10 étapes de création ;
- réduire les Tontines à une seule rubrique ;
- imposer une cotisation nominale globale ;
- renommer Collation en Collection ;
- créer un second Ledger ;
- créer un second Forum ;
- créer un second Marketplace/Group Buy ;
- exposer soldes/listes de membres à une communauté publique ;
- annoncer une prévision comme stock confirmé ;
- annoncer une intention comme commande ;
- annoncer un clic UI comme paiement ;
- réintroduire Backhaul/Return Load dans Eco-System ;
- déclarer field accepted sur simple CI/smoke.

---

# 14. Point de reprise

Après livraison 1.4.6, reprendre uniquement depuis le HEAD distant qualifié et la vérité projet mise à jour. Toute anomalie terrain doit être reproduite, couverte par un test, puis corrigée par petit lot.
