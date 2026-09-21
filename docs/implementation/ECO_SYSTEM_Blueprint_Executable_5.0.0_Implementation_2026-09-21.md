# ECO-SYSTEM — BLUEPRINT EXÉCUTABLE 5.0.0
## Document maître d’implémentation · Association/Tontine · Communautés · Opportunités · Valeur

**Date de référence : 21 septembre 2026**  
**Branche d’implémentation : `next/1.4.3-blueprint-5-0-0-finalization-20260921`**  
**Version cible : `1.4.3-blueprint-5-0-0-finalized`**  
**Production de départ : `1.4.2-operational-center-sessions-blueprint` — socle préservé avant livraison 5.0.0**  
**La version 5.0.0 doit être qualifiée puis livrée par le workflow 1.4.3 ; la production 1.4.2 reste l’ancre de non-régression tant que le smoke 1.4.3 n’est pas vert.**  
**Socle préservé : `1.4.1-field-integrity-home-sessions` + acquis antérieurs**  
**D1 canonique : `eco-system-db` — NE JAMAIS RECRÉER**  
**R2 privé : `eco-system-backups`**  
**Argent réel : `realMoneyEnabled=false`**

---

# 0. À QUI S’ADRESSE CE DOCUMENT

Ce document est volontairement détaillé afin qu’un développeur, un agent logiciel, un autre modèle d’IA, un prestataire ou un mainteneur moins familier avec Eco-System puisse continuer le travail **sans réinterpréter le projet**.

L’implémentation n’est pas réservée à Codex, à ChatGPT ou à un agent particulier. Elle peut être réalisée par toute personne ou tout système ayant les compétences et autorisations requises, **à condition de respecter la vérité projet, les owners canoniques, les garde-fous BIR et les tests**.

Il n’est pas demandé au fondateur de modifier lui-même l’application avant qu’un développeur puisse continuer. Le fondateur précise les besoins métier, arbitre les règles de groupe et effectue la recette terrain. Le développeur/agent transforme ces décisions en code, tests, documentation et livraison qualifiée.

---

# 1. VISION DE DÉPART À PRÉSERVER

Eco-System part d’un besoin concret : aider les Associations et Tontines à organiser leurs membres, leurs séances, leurs règles, leurs finances, leurs responsabilités, leurs preuves et leurs activités sans perdre la réalité humaine du groupe.

L’application ne doit pas devenir un simple logiciel comptable. Elle doit être un **système d’organisation, de confiance, de développement et de circulation de valeur**.

Ordre stratégique :

1. **construire correctement Association/Tontine** ;
2. **construire autour de ce cœur** : communauté, opportunités, entraide, formation, commerce, fournisseurs, besoins collectifs, projets ;
3. **construire en dehors du cœur** : utilisateurs individuels, communautés d’intérêt, activités professionnelles, agriculture, commerce local, compétences, emplois, créateurs, partenaires ;
4. utiliser ces extensions pour renforcer le cœur plutôt que le diluer.

Formule de produit :

> **Association / Tontine d’abord → communauté autour → opportunités autour → valeur au-delà.**

Eco-System doit permettre à une personne ou un groupe de répondre à quatre questions :

- **Qui sommes-nous et quelles sont nos règles ?**
- **Que devons-nous faire maintenant et prochainement ?**
- **Que possédons-nous, savons-nous faire ou pouvons-nous mobiliser ?**
- **Qui, quelque part, a besoin de ce que nous avons — ou possède ce dont nous avons besoin ?**

---

# 2. ACCOMPAGNEMENT DES UTILISATEURS ET DES GROUPES

L’utilisateur ne doit pas être traité uniquement comme cotisant.

Eco-System doit progressivement l’aider à présenter ses acquis :
- compétences ;
- expérience ;
- activité professionnelle ;
- savoir-faire ;
- produits ;
- disponibilité ;
- réseau ;
- équipement ;
- capacité de transport ou stockage ;
- terrain ou espace productif ;
- production agricole ;
- capacité de transformation ;
- formation reçue ou donnée ;
- besoins ;
- projets ;
- opportunités recherchées.

Le même principe s’applique aux groupes :
- Association ;
- Tontine rotative ;
- GIC ;
- coopérative ;
- groupement de producteurs ;
- groupe de femmes ;
- groupe de jeunes ;
- collectif professionnel ;
- communauté d’intérêt ;
- structure d’entraide ;
- organisation locale.

Un groupe d’agriculteurs ne doit pas être obligé de créer un « autre compte Eco agricole » séparé. S’il possède déjà une Association/GIC enregistrée, cette identité de groupe devient le **point d’ancrage** pour :
- présenter ses producteurs ;
- annoncer une disponibilité future ;
- publier une récolte ;
- agréger une offre ;
- lancer une demande ;
- participer à un achat groupé ;
- organiser un Fresh Drop ;
- rechercher un acheteur ;
- préparer un contrat récurrent ;
- documenter une preuve de livraison ;
- travailler avec une ONG ou un partenaire.

---

# 3. DEUX CONVENTIONS FONDATRICES OBLIGATOIRES

## 3.1 Une capacité significative = une autorité canonique

Une activité métier ne doit avoir qu’une seule autorité de vérité.

Exemples :
- finance : Ledger/D1 ;
- créances : ReceivablesService ;
- séance : MeetingService ;
- présence : MeetingService ;
- bénéficiaire de séance : MeetingService ;
- preuve : KERNEL.EVIDENCE ;
- identité groupe : GroupIdentityService ;
- règles : Rubrics/Living Rules ;
- Marketplace : moteur Marketplace existant ;
- achats groupés : moteur Group Buy existant ;
- forum : Community/Forum existant ;
- anti-arnaque : SAFETY.ANTISCAM.

Une page peut afficher, agréger, filtrer ou proposer une action, mais elle ne devient pas une seconde autorité.

## 3.2 Réutiliser → étendre → adapter avant de créer

Avant tout nouveau service :
1. identifier l’owner actuel ;
2. vérifier s’il peut être réutilisé ;
3. l’étendre si nécessaire ;
4. utiliser un adapter si une intégration externe est nécessaire ;
5. créer un nouvel owner seulement si la responsabilité métier est réellement nouvelle.

---

# 4. RÈGLES DE NON-RÉGRESSION

Ne jamais supprimer ou réduire sans décision explicite :
- création groupe en 10 étapes ;
- plusieurs Tontines par groupe ;
- participations distinctes par membre et par rubrique ;
- Collation ;
- Living Rules ;
- Ledger canonique ;
- Récap financier ;
- fiches individuelles ;
- deux feuilles financières ;
- correction append-only ;
- prêts et intérêts ;
- épargne et intérêts ;
- Tontine Manager ;
- dossiers membres ;
- Forum/Community ;
- Marketplace ;
- AdManager ;
- Partners/NGO ;
- Premium Live déjà qualifié ;
- offline/outbox ;
- preuves/audit ;
- compatibilité faible réseau lorsque raisonnablement possible.

Une nouvelle interface ne doit jamais recréer une deuxième logique métier pour « simplifier ».

---

# 5. PROBLÈME UX AYANT DÉCLENCHÉ LA 1.4.2

En 1.4.1, le menu visible **Séances** ouvrait en réalité un grand cockpit transversal :
- Membres ;
- Séance & PV ;
- Impayés ;
- Rapports ;
- Recrutement & communication ;
- État fonctionnel ;
- cycle de vie ;
- participation ;
- règles ;
- feuilles.

Cette page ressemblait donc à tout sauf à une page centrée sur une séance.

Décision 1.4.2 :
- l’ancien contenu est **préservé** ;
- le menu est renommé **Centre opérationnel** ;
- une nouvelle page **Séances** est créée ;
- l’owner métier de la séance reste MeetingService.

---

# 6. CENTRE OPÉRATIONNEL — RÔLE EXACT

Le Centre opérationnel est le cockpit transversal du groupe.

Il conserve :
- membres ;
- cycle de vie ;
- participations par rubrique ;
- habilitations ;
- impayés ;
- rapports ;
- recrutement ;
- communication ;
- état fonctionnel ;
- PV et décisions ;
- gouvernance ;
- règles vivantes ;
- feuilles historiques/canoniques déjà présentes ;
- raccourcis vers les moteurs spécialisés.

Il ne doit plus se présenter comme la page « Séances ».

## 6.1 Compatibilité

Le `data-view="operations"` est conservé pour éviter de casser les liens internes historiques.

Seul le **libellé UX** change :
- ancien : Séances ;
- nouveau : Centre opérationnel.

## 6.2 Présence

Avant 1.4.2, une partie du Centre écrivait la présence dans un workspace générique `MEETING.ATTENDANCE`.

Cela créait un risque de double vérité avec la présence canonique ajoutée en 1.4.1.

Correction :
- GET présence → route MeetingService ;
- POST présence → route MeetingService ;
- l’ancien champ générique de preuve est retiré du rôle d’autorité ;
- PV et actions peuvent rester des workspaces car ils ne concurrencent pas l’état de présence.

---

# 7. NOUVEAU MENU SÉANCES

Le menu principal comporte désormais séparément :
- **Centre opérationnel**
- **Séances**

La page Séances correspond à une **réunion précise**.

## 7.1 Sélecteur

La page fournit :
- précédente ;
- actuelle ;
- suivante ;
- liste des séances existantes ;
- bouton nouvelle séance.

La dénomination humaine est :
> **Réunion du [date]**

Le titre technique historique reste secondaire.

## 7.2 Préparation de séance

Champs :
- date/heure ;
- lieu ou canal ;
- thème ;
- tenue/code vestimentaire ;
- note interne.

Ces données enrichissent MeetingService. Elles ne créent pas un autre calendrier.

---

# 8. ONGLETS DU MENU SÉANCES

Huit onglets constituent le minimum opérationnel.

## 8.1 Vue d’ensemble
Affiche :
- Réunion du… ;
- date ;
- exercice/cycle ;
- lieu/canal ;
- thème ;
- tenue ;
- statut ;
- nombre de présences renseignées ;
- nombre de présents/représentés ;
- bénéficiaires déclarés ;
- situation financière de séance selon droits.

## 8.2 Feuille de séance
Responsable :
- lignes = membres ;
- colonnes = rubriques actives ;
- cellule = projection nette de la même vérité financière ;
- total membre.

Membre :
- uniquement sa propre fiche de séance.

Règle critique :
> Le tableau de la nouvelle page Séances est une **projection**.  
> La saisie/correction reste dans le composant canonique des deux feuilles tant qu’un éditeur partagé n’a pas été extrait proprement.

Bouton :
**Saisir / corriger dans la feuille canonique**.

Cette décision évite deux éditeurs concurrents.

## 8.3 Présences
Statuts :
- Présent ;
- En retard ;
- Représenté ;
- Excusé ;
- Absent.

Responsable :
- voit la liste ;
- modifie.

Membre :
- ne voit que son statut.

Toutes les modifications passent par MeetingService et restent auditables.

## 8.4 Bénéficiaires & preuves
Flux :
1. responsable déclare bénéficiaire ;
2. montant et rubrique ;
3. génération `ECO-RCP-XXXXXXXXXX` ;
4. preuve :
   - confirmation personnelle ;
   - émargement papier ;
   - photo/PDF ;
5. Evidence immuable ;
6. déclaration DONE.

Le code ECO-RCP est un identifiant, jamais un secret d’autorisation.

## 8.5 Récap & caisse
Responsable :
- ouverture ;
- recettes ;
- dépenses ;
- clôture théorique ;
- comptage physique ;
- écart ;
- rapprochement.

Sans rapprochement :
> **À rapprocher**

Aucune valeur inventée.

## 8.6 Dettes & amendes
Responsable :
- vue groupe.

Membre :
- propres obligations uniquement.

Le filtrage est réalisé dans ReceivablesService, pas seulement en CSS.

## 8.7 Classements & programmation
Affiche :
- s-1 ;
- s ;
- s+1 ;
- lieu ;
- thème ;
- tenue ;
- bénéficiaires ;
- classement Tontines ;
- Assistances lorsqu’elles existent.

## 8.8 Historique
Historique métier lisible :
- présence ;
- bénéficiaire ;
- preuve ;
- PV ;
- action.

L’audit serveur reste l’autorité probatoire pour les opérations critiques.

---

# 9. CADRE MINIMUM ACCUEIL — ASSOCIATION/TONTINE

L’Accueil Groupe continue d’afficher :
- nom ;
- code ECO-GRP ;
- type ;
- création historique ;
- date/heure ;
- déclaration ;
- Bureau ;
- mandat ;
- mise en ligne ;
- nombre membres ;
- exercice/cycle ;
- boutons séances/fiches ;
- situation financière ;
- report d’exercice si réellement enregistré ;
- recettes ;
- dépenses ;
- solde ;
- balance ;
- redevables ;
- classement Tontines ;
- précédente/actuelle/prochaines séances.

## 9.1 Suppression historique

Les demandes « supprimer membre » ou « supprimer rubrique » sont interprétées :
- membre → sortie/suspension/lifecycle ;
- rubrique → archivage ;
- suppression physique uniquement si aucune dépendance financière/probatoire.

---

# 10. ACCUEIL MEMBRE

Le membre doit progressivement disposer de :
- groupe + code ;
- création ;
- Bureau/mandat ;
- mise en ligne ;
- première inscription ;
- exercice ;
- numéro membre ;
- situation personnelle ;
- propres dettes ;
- Tontines reçues/à recevoir ;
- bénéfices/réceptions ;
- Collation/Aide locale si existantes ;
- Assistances si existantes ;
- amendes ;
- présence ;
- simulations.

## 10.1 Situation Assistance

Ne pas afficher artificiellement « en règle » ou « pas en règle » si la politique n’est qu’un texte libre.

Règle :
- politique Assistance validée + critère calculable → statut calculé ;
- sinon → **À vérifier**.

Cette prudence est préférable à une conformité inventée.

---

# 11. MOBILE — NAVIGATION LISIBLE

Problème observé :
- barre du bas trop basse ;
- items trop étroits ;
- texte en 10 px ;
- `white-space: nowrap` ;
- libellés coupés.

Correction 1.4.2 :
- barre plus haute ;
- scroll horizontal ;
- scroll snap ;
- item environ 98–104 px ;
- texte 2 lignes autorisé ;
- libellés mobiles dédiés ;
- Centre opérationnel → **Centre op.** sur petit écran ;
- Séances → **Séances** ;
- item actif centré automatiquement.

Aucune fonction n’est cachée.

---

# 12. ONGLETS INTERNES DU CENTRE OPÉRATIONNEL SUR MOBILE

Les tabs historiques sont conservés mais deviennent :
- horizontalement défilables ;
- largeur minimum ;
- texte multiligne ;
- cible tactile ~50 px ;
- scroll snap.

Le but est de **rendre lisible**, pas de supprimer des onglets.

---

# 13. SAISIE FINANCIÈRE

Les deux feuilles restent l’éditeur canonique.

Doivent rester disponibles :
- feuille de séance ;
- fiches individuelles ;
- popover par cellule ;
- saisie ;
- correction ;
- motif ;
- accès rubrique ;
- dictée ;
- preview.

La page Séances n’invente pas une autre écriture.

---

# 14. CORRECTION FINANCIÈRE

Cas de référence :
> 2 000 F → 5 000 F.

Chaîne :
1. original 2 000 conservé ;
2. contrepassation ;
3. remplacement 5 000 ;
4. motif ;
5. auteur ;
6. avis financier ;
7. revue indépendante ;
8. réserve membre possible.

Toute correction exige la revue d’un autre responsable habilité.

L’auteur ne peut pas se relire lui-même.

---

# 15. RUBRIQUES

Le clic sur une rubrique doit conserver :
- tableau récapitulatif ;
- lignes membres ;
- colonnes séances/périodes ;
- contributions ;
- configuration rubrique.

Accès global réservé aux responsables.

## 15.1 Timbre
Ne pas recréer un doublon générique.
- Timbre de prêt : frais liés au prêt ;
- un éventuel Timbre administratif général doit exister uniquement si le groupe le définit explicitement comme rubrique distincte.

---

# 16. PRÊTS — UX SENIOR

Conserver :
- capital initial éditable ;
- remboursement éditable ;
- popup ;
- remboursement partiel/total ;
- recalcul ;
- systèmes de calcul comparables ;
- dette suivante.

Objectif :
un utilisateur senior peut agir sur les valeurs qu’il comprend sans reconstruire le scénario.

---

# 17. OFFLINE

Règles :
- cache shell ;
- IndexedDB actor-scoped ;
- dernière copie datée ;
- écriture en attente ;
- API jamais falsifiée ;
- erreur HTTP réelle jamais remplacée par un vieux succès ;
- resynchronisation idempotente.

PWA installée : expérience meilleure.
Installation : pas prérequis logique absolu pour toute lecture cache compatible.

---

# 18. DICTÉE

1. Web Speech si disponible ;
2. plusieurs alternatives ;
3. niveau de confiance ;
4. faible confiance signalée ;
5. montant incertain ne remplace pas automatiquement la valeur ;
6. preview obligatoire ;
7. clavier toujours disponible.

Ne pas écrire « bruit résolu » avant recette réelle.

---

# 19. BLUEPRINT EXÉCUTABLE — PRINCIPE

La stratégie validée n’est plus seulement un document.

Eco-System expose un cockpit de workflows persistants.

Doctrine :

> **OBSERVER / PRÉDIRE → PROPOSER → VALIDATION HUMAINE → EXÉCUTER DANS L’OWNER CANONIQUE**

Règle :
> **Prévision ≠ demande ≠ engagement ≠ transaction**

Tout workflow initial :
- `DRAFT` ;
- `humanValidated=false` ;
- `commercialCommitment=false` ;
- `realMoney=false`.

Après validation :
- `ACTIVE`.

Après réalisation :
- `DONE`.

Fin de vie :
- `ARCHIVED`.

---

# 20. BLUEPRINT — COUCHE 1 : ASSOCIATION/TONTINE D’ABORD

## GROUP.ANTICIPATION
But :
- préparer les besoins futurs ;
- observer calendrier, règles, historiques et signaux.

Ne peut pas :
- modifier le RI ;
- modifier Ledger ;
- créer une obligation financière ;
- déplacer une séance automatiquement.

## GROUP.MEETING_AUTOPILOT
Prépare :
- projet de séance ;
- budget de travail ;
- lieu ;
- équipe ;
- logistique ;
- invitations ;
- liste de besoins.

Le résultat est un **brouillon**, pas une décision.

## GROUP.DOCTOR
Observe :
- anomalies ;
- créances ;
- incohérences ;
- blocages ;
- règles manquantes.

Il alerte ; il ne devient pas autorité métier.

---

# 21. BLUEPRINT — COUCHE 2 : BESOINS & OPPORTUNITÉS

## OPPORTUNITY.NEED
Formalise :
- « j’ai besoin de… »
- « le groupe cherche… »
- « je peux proposer… »

## MARKETPLACE.DEMAND_EXCHANGE
Transforme plusieurs besoins compatibles en demande agrégée à confronter au marché.

## MARKETPLACE.PROCUREMENT
Prépare :
- RFQ ;
- sourcing ;
- demandes de devis ;
- comparaison.

## MARKETPLACE.GROUP_BUY
Cas spécial :
le moteur existe déjà.

Le Blueprint **ne crée pas** un deuxième achat groupé.
Il transmet vers le moteur Marketplace canonique.

---

# 22. BLUEPRINT — COUCHE 3 : ECO NOW & COMMERCE LOCAL

## Eco NOW
Deux intentions :
- **J’ai besoin maintenant**
- **Je peux fournir maintenant**

Match futur :
- besoin ;
- stock/capacité ;
- lieu ;
- prix ;
- confiance ;
- temps.

## Eco Harvest & Local Commerce
Personas :
- producteur ;
- groupement ;
- GIC ;
- coopérative ;
- Association ;
- agrégateur mandaté ;
- transformateur ;
- commerçant.

L’utilisateur n’a pas besoin d’être expert numérique : son groupe peut l’accompagner.

## Disponibilité prochaine
Employer dans l’UX :
- Pré-récolte ;
- Disponibilité prochaine ;
- Harvest Preview.

Éviter « forward market » tant qu’aucune structure juridique spécifique n’existe.

## Fresh Drop
Données minimales :
- produit ;
- unité normalisée ;
- origine ;
- quantité ;
- qualité ;
- statut confirmé/prévisionnel ;
- date ;
- heure ;
- retrait ;
- vendeur/groupe ;
- conditions.

Une prévision n’est jamais affichée comme stock confirmé.

## Pickup Network
Décrire une capacité :
- collecte ;
- retrait ;
- stockage court ;
- redistribution.

Eco-System commence comme réseau de capacité, pas comme propriétaire d’entrepôts.

---

# 23. BLUEPRINT — COUCHE 4 : VALEUR, BUSINESS, TALENT, CRÉATION

## Value Discovery
Accompagne l’utilisateur avec :
- ce que j’ai ;
- ce que je sais faire ;
- où je suis ;
- quand je suis disponible ;
- équipement ;
- produits ;
- stock ;
- terrain ;
- réseau ;
- expérience.

L’IA peut suggérer des opportunités sur la base d’une demande réelle observée.

Elle ne promet jamais un revenu.

## Eco Business Studio
Point de départ :
- activité ;
- catalogue ;
- clients ;
- leads ;
- demandes ;
- devis ;
- commandes ;
- visibilité ;
- statistiques.

## Business Agent
Peut :
- répondre à FAQ ;
- organiser demandes ;
- préparer relances ;
- brouillon de devis ;
- résumer.

Ne peut pas :
- inventer prix ;
- confirmer paiement non confirmé ;
- contourner règles.

## Talent
Cycle :
> Learn → Prove → Work → Earn

Preuves :
- formation ;
- pratique ;
- portfolio ;
- commande accomplie ;
- évaluation ;
- certification.

## Creator & Seller Studio
Cycle :
- contenu ;
- intérêt ;
- conversation ;
- action ;
- transaction dans moteur canonique.

---

# 24. BLUEPRINT — COUCHE 5 : CONFIANCE & INTELLIGENCE

## Trust Graph
Doit rester explicable.

Signaux possibles :
- identité ;
- ancienneté ;
- mandat ;
- participation ;
- livraisons ;
- évaluations ;
- compétences prouvées ;
- incidents.

Pas de score opaque universel.

## Market Intelligence
Seulement :
- agrégé ;
- gouverné ;
- anonymisé/pseudonymisé ;
- sans exposition des finances personnelles.

Exemples :
- demande par zone ;
- disponibilité ;
- saisonnalité ;
- manque ;
- délai ;
- prix observés.

---

# 25. FORUMS ET COMMUNAUTÉS — ADAPTATION AU BLUEPRINT

Ne pas créer un second réseau social.

Les forums existants sont enrichis par des **raccourcis de contexte**.

## 25.1 Presets de Hubs
- Forum principal ;
- Opportunités ;
- Marché & besoins ;
- Compétences & emploi ;
- Agriculture & production ;
- Actualités sourcées.

Ce sont des préremplissages. L’utilisateur décide de créer ou non le Hub.

## 25.2 Presets de publication
- Besoin ;
- Offre ;
- Intention achat groupé ;
- Récolte / arrivage ;
- Compétence / service ;
- Formation / savoir ;
- Info sourcée ;
- Tendance / Buzz.

Ils réutilisent :
- REQUEST ;
- OFFER ;
- DISCUSSION ;
- ANNOUNCEMENT ;
- POST ;
- EVENT ;
- PLACE.

Aucun second type de message backend n’est nécessaire.

## 25.3 Information sourcée
Une information sourcée doit inviter à indiquer :
- fait ;
- source ;
- auteur/organisme ;
- date ;
- référence/preuve.

## 25.4 Buzz
Le buzz peut circuler mais doit pouvoir être marqué comme :
- tendance ;
- rumeur/non vérifié ;
- opinion ;
- source disponible.

Règle constitutionnelle :
> Une tranche horaire ne rend jamais un contenu vrai.

L’ancienne idée « 17h–20h uniquement infos vérifiées » est donc transformée en :
- espace éditorial possible ;
- filtre de sources ;
- badge de provenance ;
- jamais critère de vérité fondé sur l’heure.

---

# 26. LABO FINANCIER & ANTI-ARNAQUES — FONCTIONNEL BETA

Owner :
`SAFETY.ANTISCAM`.

Entrées implémentées :
- participants ;
- mise initiale ;
- rendement mensuel promis ;
- durée ;
- revenus économiques documentés ;
- nouveaux dépôts attendus ;
- mécanisme déclaré ;
- preuve/source ;
- mode simple ou capitalisé.

Calculs :
- collecte initiale ;
- valeur promise ;
- ressources documentées sans nouveaux dépôts ;
- écart sans nouveaux entrants ;
- ressources incluant nouveaux dépôts ;
- écart résiduel.

Messages :
- mécanisme absent ;
- source absente ;
- ressources documentées insuffisantes ;
- dépendance à nouveaux dépôts ;
- rendement très élevé.

Interdiction :
> Eco-System ne conclut jamais automatiquement « Ponzi » ou « arnaque ».

Le résultat est une analyse pédagogique d’hypothèses.

---

# 27. LABO DES SYSTÈMES FINANCIERS SAINS — EXTENSION DU MÊME OWNER

Ne pas créer un autre « Prosperity Lab ».

SAFETY.ANTISCAM / Financial Lab doit ultérieurement intégrer des scénarios sains :
- épargne ;
- prêt ;
- intérêt ;
- fonds collectif ;
- trésorerie ;
- investissement productif documenté ;
- marge ;
- liquidité ;
- risque.

Même moteur de simulation ; nouvelles bibliothèques de scénarios.

---

# 28. RÉALITÉ AGRICOLE ET COMMERCE LOCAL

Exemple de parcours :

1. une Association/GIC inscrit son groupe ;
2. elle utilise Harvest Local ;
3. elle crée une disponibilité :
   - manioc ;
   - unité normalisée ;
   - quantité ;
   - village/localité ;
   - date ;
   - qualité ;
   - statut prévisionnel ;
4. le besoin peut être diffusé au forum Marché & besoins ;
5. Demand Exchange agrège l’intérêt ;
6. un responsable humain valide la demande réelle ;
7. un Fresh Drop peut être préparé ;
8. Marketplace gère l’offre/commande ;
9. Pickup Network prépare retrait ;
10. preuve/livraison nourrit Trust.

Ne jamais masquer :
- pertes ;
- qualité ;
- frais ;
- transport ;
- commission ;
- prix producteur.

La valeur doit être intéressante pour l’acheteur **et** viable pour le producteur.

---

# 29. UNITÉS ET QUALITÉ AGRICOLES

Éviter les unités subjectives telles que « gros bâton » comme seule mesure.

Prévoir :
- poids ;
- nombre ;
- botte normalisée ;
- calibre ;
- tolérance ;
- photo de référence ;
- grade ;
- qualité déclarée ;
- qualité vérifiée si applicable.

Toujours distinguer :
- déclaré par vendeur ;
- constaté ;
- vérifié par Eco/partenaire.

---

# 30. SURPLUS / RESCUE / TRANSFORMATION

Workflows à héberger sous les owners Marketplace :
- Surplus NOW ;
- Rescue Deal ;
- Raw-to-Value ;
- sous-produits.

Ces workflows doivent respecter sécurité alimentaire et réglementation applicable avant industrialisation.

---

# 31. PARTENAIRES, ONG ET INSTITUTIONS

Une ONG, commune, entreprise ou programme peut :
- sponsoriser onboarding ;
- financer communication ;
- soutenir un Market Day ;
- aider transport pilote ;
- financer formation ;
- accompagner digitalisation.

Reporting :
- groupes accompagnés ;
- volumes ;
- quantités vendues ;
- producteurs ;
- pertes évitées ;
- réachat ;
- satisfaction.

Ne jamais exposer les finances personnelles brutes.

Les partenariats institutionnels sont séparés de toute communication électorale/politique.

---

# 32. MONÉTISATION — GARDE-FOUS

Canaux précoces :
1. commission/marge de Deal ;
2. sponsoring ;
3. abonnement Eco Business fournisseur.

Plus tard :
- logistique ;
- pickup ;
- intelligence agrégée ;
- services B2B ;
- campagnes ;
- outils créateurs.

Formule de contrôle :
> Net Deal Margin = CA - fournisseur - paiement - logistique - promo - support - pertes/remboursements - taxes applicables - coûts variables.

Ne pas lancer une campagne à volume élevé si marge nette attendue négative sans décision explicite de subvention/acquisition.

---

# 33. PAIEMENT

État actuel :
`realMoneyEnabled=false`.

Ne pas implémenter la garde de fonds réelle sans qualification séparée.

Cible future :
Client → PSP autorisé → transaction Eco identifiée → règlement fournisseur + commission contractuelle.

États :
- ORDERED ;
- PSP_CONFIRMED ;
- DEAL_ACTIVATED ;
- SUPPLIER_DELIVERED ;
- READY_FOR_PICKUP ;
- PICKED_UP ;
- SETTLED.

Un écran « payé » ne suffit jamais à créer `PAID_CONFIRMED`.

---

# 34. ECO ROUTE / BACKHAUL

**EXCLUSION EXPLICITE DU PÉRIMÈTRE ECO-SYSTEM.**

Le projet d’optimisation des retours à vide de camions, grutiers et gros transporteurs est un projet autonome envisagé séparément.

Ne pas créer dans Eco-System :
- `ECO_ROUTE` ;
- `BACKHAUL` ;
- `RETURN_LOAD` ;
- moteur transport lourd autonome.

Eco-System peut ultérieurement consommer une capacité logistique externe via adapter si le projet séparé expose une API.

---

# 35. DONNÉES WORKSPACE DU BLUEPRINT

Structure générique initiale :

```text
moduleId
groupId?              // absent pour contexte personnel
title
summary
status = DRAFT | ACTIVE | DONE | ARCHIVED
tags = blueprint, human-validation-required, couche
data.blueprintLayer
data.context
data.locality
data.quantity
data.targetDate
data.evidenceRef
data.confidence
data.humanValidated
data.commercialCommitment
data.realMoney
```

Important :
un Workspace est une **fiche de travail**, pas une transaction.

---

# 36. NIVEAUX D’ANTICIPATION

Valeurs :
- CERTAIN ;
- VERY_PROBABLE ;
- HISTORICAL_INFERENCE ;
- OPPORTUNITY.

## CERTAIN
Fait directement observé :
- séance programmée ;
- dette ouverte ;
- règle validée.

## VERY_PROBABLE
Projection fortement étayée.

## HISTORICAL_INFERENCE
Inférence issue des cycles passés.

## OPPORTUNITY
Possibilité à examiner.

Toujours afficher le niveau.

---

# 37. ANTICIPATION AUTOMATIQUE ACTUELLE

Le Blueprint peut déjà préremplir des signaux certains :
- prochaine séance connue ;
- absence de séance future ;
- créances ouvertes.

Cela reste déterministe.

L’IA générative ne doit pas être nécessaire pour que ces signaux fonctionnent.

---

# 38. IA — RÔLE AUTORISÉ

L’IA peut :
- expliquer ;
- résumer ;
- proposer ;
- extraire ;
- comparer ;
- préparer ;
- suggérer.

Elle ne peut pas :
- écrire le Ledger sans workflow canonique ;
- inventer un prix ;
- confirmer paiement ;
- modifier RI ;
- modifier règle de groupe automatiquement ;
- accuser de fraude ;
- engager achat ;
- publier au nom du groupe sans validation lorsque gouvernance l’interdit.

---

# 39. CONFIDENTIALITÉ PUBLICITAIRE

Interdit pour ciblage publicitaire individuel :
- dette ;
- solde ;
- prêt ;
- CNI ;
- santé ;
- réserve/dispute ;
- finance brute.

Autorisé sous gouvernance :
- contexte collectif ;
- catégorie de groupe ;
- demande agrégée ;
- localité ;
- intention commerciale explicite ;
- signal non sensible.

---

# 40. ARCHITECTURE DES OWNERS 1.4.2

| Capacité | Owner |
|---|---|
| Finance | Ledger |
| Créances | ReceivablesService |
| Séances | MeetingService |
| Présence | MeetingService |
| Bénéficiaires séance | MeetingService |
| Preuves | KERNEL.EVIDENCE |
| Identité groupe | GroupIdentityService |
| Règles | Rubrics/Living Rules |
| Tontines | Tontine Manager / Completion |
| Prêts | Loan/Finance engines |
| Marketplace | MARKETPLACE.CORE |
| Achats groupés | MARKETPLACE.GROUP_BUY |
| Forums groupe | COMMUNITY.FORUM / Community |
| Communautés intérêt | Interest Communities |
| Ads | ADS.MANAGER |
| Anticipation | GROUP.ANTICIPATION workspace + owners observés |
| Labo financier | SAFETY.ANTISCAM |
| Blueprint | cockpit d’orchestration, jamais owner des transactions |

---

# 41. FICHIERS 1.4.2 PRINCIPAUX

## Navigation/UI
- `apps/web/index.html`
- `apps/web/styles.css`
- `apps/web/src/main.js`

## Séances
- `apps/web/src/sessions-ui.js`
- `apps/web/src/detail-ui.js`
- `packages/domain/src/index.ts`
- `packages/application/src/index.ts`

## Centre opérationnel
- `apps/web/src/master-closure-ui.ts`
- `apps/web/src/master-governance-ui.ts`

## Blueprint
- `apps/web/src/blueprint-executable-ui.js`
- `packages/module-registry/src/index.ts`

## Forums
- `apps/web/src/community-blueprint-presets.js`
- Community existant réutilisé.

## Labo
- `apps/web/src/financial-lab-ui.js`

## PWA
- `apps/web/sw.js`

## Tests
- `tests/operational-center-sessions-blueprint-1.4.2.test.mjs`
- tests 1.4.1 conservés/adaptés lorsque l’intention UX a réellement changé.

---

# 42. API SÉANCES

Routes déjà canoniques à réutiliser :

```text
GET  /api/v1/groups/:group/meetings
POST /api/v1/groups/:group/meetings
PUT  /api/v1/groups/:group/meetings/:meeting/context
POST /api/v1/groups/:group/meetings/:meeting/close

GET  /api/v1/groups/:group/meetings/:meeting/attendance
POST /api/v1/groups/:group/meetings/:meeting/attendance

GET  /api/v1/groups/:group/meetings/:meeting/beneficiaries
POST /api/v1/groups/:group/meetings/:meeting/beneficiaries

GET  /api/v1/groups/:group/meetings/:meeting/beneficiary-evidence
POST /api/v1/groups/:group/meetings/:meeting/beneficiary-evidence
POST /api/v1/groups/:group/meetings/:meeting/beneficiary-evidence/upload
```

Ne pas créer :
`/api/v2/new-session-engine`.

---

# 43. PERMISSIONS

Responsable :
- vue groupe ;
- présence groupe ;
- bénéficiaires ;
- rapprochement ;
- dettes groupe ;
- planning.

Membre :
- situation personnelle ;
- présence personnelle ;
- propre dette ;
- propres preuves/réceptions ;
- confirmation personnelle.

Un rôle affiché dans UI ne suffit pas ; les services doivent filtrer.

---

# 44. TESTS AUTOMATIQUES OBLIGATOIRES

Les tests 1.4.2 doivent verrouiller :

1. Centre opérationnel visible ;
2. nouveau menu Séances visible ;
3. contenu historique du Centre préservé ;
4. huit onglets Séances ;
5. owner présence unique ;
6. owner finance unique ;
7. preuves bénéficiaires ;
8. dette membre propre uniquement ;
9. navigation mobile lisible ;
10. Blueprint sans argent réel ;
11. achats groupés transmis à owner canonique ;
12. Harvest/Opportunity/Talent enregistrés ;
13. Eco Route absent ;
14. forum presets ;
15. information sourcée ≠ vérité automatique ;
16. Financial Lab non-verdict ;
17. PWA cache nouveaux modules.

---

# 45. RECETTE TERRAIN — RESPONSABLE

À tester sur téléphone :

1. sélectionner groupe ;
2. ouvrir Centre opérationnel ;
3. vérifier anciens onglets ;
4. ouvrir Séances ;
5. créer réunion ;
6. renseigner date/lieu/thème/tenue ;
7. Vue d’ensemble ;
8. feuille ;
9. présence ;
10. déclarer bénéficiaire ;
11. émargement papier ;
12. photo/PDF ;
13. caisse ;
14. dettes ;
15. classement ;
16. historique ;
17. revenir Centre ;
18. aucune donnée perdue.

---

# 46. RECETTE TERRAIN — MEMBRE

1. connexion membre ;
2. Accueil ;
3. ouvrir Séances ;
4. voir propre situation ;
5. voir propre présence ;
6. ne pas voir dettes des autres ;
7. confirmer propre réception ;
8. consulter fiche ;
9. couper réseau après synchro ;
10. contrôler dernière copie connue.

---

# 47. RECETTE MOBILE

Contrôler :
- aucune superposition ;
- barre du bas scrollable ;
- Centre op. lisible ;
- Séances lisible ;
- onglet actif centré ;
- tabs Centre scrollables ;
- tabs Séances scrollables ;
- boutons minimum 44–48 px ;
- aucun texte critique coupé.

---

# 48. RECETTE BLUEPRINT

## Groupe
Créer :
- Anticipation ;
- Meeting Autopilot ;
- Group Doctor ;
- besoin ;
- Demand Exchange ;
- Harvest.

Vérifier :
- DRAFT ;
- validation humaine ;
- ACTIVE ;
- DONE ;
- archive ;
- aucun Ledger modifié.

## Personnel
Créer :
- Value Discovery ;
- Talent ;
- Business Agent.

Vérifier :
- pas de groupId forcé ;
- pas de promesse de revenu.

---

# 49. RECETTE FORUM

Créer/preset :
- Forum principal ;
- Opportunités ;
- Agriculture.

Publier :
- Besoin ;
- Offre ;
- Récolte ;
- Info sourcée ;
- Buzz.

Vérifier :
- types backend existants ;
- pas de second forum ;
- labels explicites.

---

# 50. RECETTE LABO FINANCIER

Cas synthétiques :
1. rendement faible + revenus documentés suffisants ;
2. rendement élevé sans activité décrite ;
3. ressources insuffisantes ;
4. dépendance aux nouveaux dépôts ;
5. source absente ;
6. capitalisation ;
7. calcul simple.

Vérifier :
- calcul reproductible ;
- aucune accusation ;
- hypothèses visibles ;
- sauvegarde historique ;
- realMoney=false.

---

# 51. STRATÉGIE DE DÉPLOIEMENT

Ordre :
1. HEAD final ;
2. `npm run ci` ;
3. BIR+ pré ;
4. résolution D1 existante ;
5. résolution R2 existant ;
6. migrations additives seulement ;
7. déployer SHA exact ;
8. `/health` ;
9. smoke UI ;
10. BIR+ post ;
11. vérité projet ;
12. BIR+ fermeture.

---

# 52. SMOKE 1.4.2

Marqueurs minimum :
- version 1.4.2 ;
- Centre opérationnel ;
- view-sessions ;
- Bénéficiaires & preuves ;
- sessions-ui ;
- Blueprint doctrine ;
- Harvest Local ;
- forum source/buzz ;
- Financial Lab ;
- navigation mobile ;
- Offline ;
- acquis 1.4.1.

---

# 53. CE QU’UN DÉVELOPPEUR NE DOIT PAS FAIRE

- recréer D1 ;
- supprimer ancien Centre ;
- recopier le Ledger dans Sessions ;
- recréer présence dans workspace générique ;
- créer second Group Buy ;
- créer second forum ;
- créer Eco Route dans ce repo ;
- déclarer Financial Lab comme autorité légale ;
- automatiser engagement commercial ;
- activer argent réel ;
- cibler publicité selon dette individuelle ;
- transformer une prévision agricole en stock confirmé ;
- afficher un faux rabais ;
- masquer coûts producteur ;
- force-push main.

---

# 54. PROCÉDURE DE REPRISE POUR UN AUTRE AGENT

Lire dans cet ordre :
1. `AGENTS.md`
2. `docs/memory/CURRENT_TRUTH.md`
3. `PROJECT_STATE.md`
4. `docs/memory/PROJECT_TRUTH_LEDGER.json`
5. ce document ;
6. Cahier Maître 3.2.0 ;
7. FEATURE_REGISTRY ;
8. NEXT_RUN ;
9. derniers runs GitHub ;
10. état Cloudflare réel.

Puis :
- fetch HEAD ;
- ne pas retravailler un acquis sans défaut reproductible ;
- créer branche enfant ;
- petits lots ;
- test ;
- vérité.

---

# 55. DÉFINITION DE “TERMINÉ”

Une idée n’est pas terminée parce qu’elle est écrite dans un cahier.

États :

## DOCUMENTÉ
La règle existe.

## STRUCTURAL_V1
Owner, contrats ou registre existent.

## FUNCTIONAL_BETA
Parcours exécutable + tests.

## FIELD_QUALIFIED
Utilisateur réel l’a testé.

## PRODUCTION_QUALIFIED
Même SHA déployé + smoke + backup.

## ACQUIS
Production + recette terrain suffisante + garde-fou permanent.

---

# 56. ÉTAT 1.4.2 AU MOMENT DE CE DOCUMENT

## 56.1 Production vérifiée

Implémenté, qualifié et déployé :
- Centre opérationnel séparé ;
- Sessions dédié ;
- mobile lisible ;
- owner présence consolidé sur MeetingService ;
- cadre minimum séance ;
- Blueprint exécutable ;
- forums/communautés adaptés ;
- module registry Blueprint ;
- Financial Lab déterministe ;
- PWA cache nouveaux modules ;
- tests de non-régression.

Preuves :
- qualification : `35497930024 SUCCESS` ;
- deploy + smoke + BIR+ pré/post : `35497930031 SUCCESS` ;
- source : `61a6d83ac5793bb5fecac7ba77a7bd4149031e27` ;
- Worker Version ID : `b54df0a5-2338-4e37-8b4d-a05351b43658` ;
- tests : **264/264 PASS** ;
- D1 : `eco-system-db` réutilisée, **No migrations to apply** ;
- R2 : `eco-system-backups`, miroirs BIR+ pré/post PASS ;
- artifacts : `10601637363` pré, `10601512437` post ;
- `realMoneyEnabled=false`.

## 56.3 Fermeture BIR+

- checkpoint : `d1a69bb5c904268d5f16fc2421e2246154000598` ;
- qualification : `35498239952 SUCCESS` ;
- backup : `35498239942 SUCCESS` ;
- artifact : `10601038586` ;
- R2 : `birplus/1.4.2/d1a69bb5c904268d5f16fc2421e2246154000598/final/` ;
- SQLite restore + integrity + SHA256 : PASS.

## 56.2 Ce qui reste à FIELD_QUALIFIED

À ne pas qualifier « acquis terrain » avant test :
- confort réel mobile sur les appareils utilisés par le fondateur ;
- huit sections Séances sur flux réel Bureau/membre ;
- bruit réel de dictée ;
- ergonomie senior ;
- parcours Blueprint avec données terrain ;
- presets Forum/Communautés en usage réel ;
- Financial Lab confronté à des cas réels sans ambiguïté de verdict ;
- interprétation Assistance automatique ;
- performances à grande échelle du Blueprint ;
- workflows commerciaux lourds ;
- paiement réel.

**Règle :** CI + production + smoke = `PRODUCTION_QUALIFIED` ; ce n'est pas encore `ACQUIS` sans recette terrain suffisante.

---

# 57. POINT D’ARCHITECTURE FINAL

Eco-System ne doit pas devenir une collection de mini-applications.

Architecture cible :

> **Identité + Group Core + Living Rules + Ledger + Meeting + Evidence + Trust + Discovery + Community + Marketplace + Academy/Business + AI/Anticipation**

Le Blueprint relie ces moteurs.

Il ne les remplace pas.

---

# 58. FORMULE PRODUIT À CONSERVER

> **Connecter les personnes. Organiser les communautés. Faire circuler la valeur. Construire la confiance.**

et, pour l’exécution :

> **Détecter → proposer → faire valider → exécuter dans le bon moteur → prouver → apprendre.**

---

# 59. CHECKLIST DE LIVRAISON

- [x] CI HEAD déployé verte — `35497930024`
- [x] version runtime 1.4.2
- [x] D1 existante résolue
- [x] R2 existant résolu
- [x] BIR+ pré
- [x] migrations additives seulement — aucune migration à appliquer
- [x] SHA exact déployé — `61a6d83ac5793bb5fecac7ba77a7bd4149031e27`
- [x] health 1.4.2
- [x] Centre opérationnel smoke
- [x] Séances smoke
- [x] présence smoke
- [x] bénéficiaires/preuves smoke
- [x] mobile markers smoke
- [x] Blueprint smoke
- [x] Financial Lab smoke
- [x] forums presets smoke
- [x] acquis 1.4.1 smoke
- [x] BIR+ post
- [x] Project State
- [x] Current Truth
- [x] Truth Ledger
- [x] Feature Registry
- [x] NEXT_RUN
- [x] BIR+ fermeture — `35498239942 SUCCESS` · artifact `10601038586` · R2 final PASS
- [ ] recette terrain fondateur — obligatoire avant statut ACQUIS

---

# 60. RÈGLE DE CLÔTURE

Après livraison 1.4.2, le prochain travail normal n’est pas d’ajouter immédiatement dix nouvelles idées.

Il faut d’abord :
1. tester réellement ;
2. noter les défauts reproductibles ;
3. créer test permanent ;
4. corriger uniquement les défauts ;
5. préserver les acquis.

Ensuite, les modules STRUCTURAL_V1 du Blueprint peuvent être spécialisés progressivement selon les usages observés.

# 61. HOTFIX DE VISIBILITÉ PWA — LIVRAISON FINALE

## 61.1 Symptôme terrain

Après le premier déploiement 1.4.2, la production distante était qualifiée et smoke-testée, mais un appareil déjà contrôlé par l’ancien shell pouvait continuer à afficher l’interface 1.4.1.

Ce défaut n’était pas un défaut des données, du Ledger, de D1 ou du contenu 1.4.2. Il s’agissait d’un défaut de convergence du shell PWA.

## 61.2 Cause

La fonction `ensureCurrentServiceWorker()` existait dans `apps/web/src/main.js` et savait :
- enregistrer `/sw.js` au scope racine ;
- utiliser `updateViaCache:'none'` ;
- appeler `reg.update()` ;
- recharger une fois lors de `controllerchange`.

Mais elle n’était jamais invoquée.

## 61.3 Correction

Correction volontairement minimale :
1. invoquer `ensureCurrentServiceWorker()` avant `start()` ;
2. ne pas changer l’identité runtime 1.4.2 ;
3. ne pas changer le cache Service Worker qualifié ;
4. ne toucher ni au Ledger, ni aux règles métier, ni aux migrations ;
5. ajouter un test permanent qui vérifie que le mécanisme n’est plus seulement défini mais réellement déclenché.

## 61.4 Preuves

- commit du test anti-régression : `113ad9fc021edecdb4fdc03696d7288125ca9c81` ;
- qualification : **35499635884 SUCCESS** ;
- SHA final déployé : `a9fe00f94daa7a6787d5a4440a5edc0bc5e4a1c8` ;
- qualification du SHA final : **35499693852 SUCCESS** ;
- déploiement + smoke + BIR+ pré/post : **35499693884 SUCCESS** ;
- artifact BIR+ pré : **10602035551** ;
- artifact BIR+ post : **10602215385** ;
- D1 : `eco-system-db` réutilisée ;
- R2 : `eco-system-backups` réutilisé ;
- argent réel : toujours **OFF**.

## 61.5 Ce que l’utilisateur doit constater

Après ouverture/actualisation réseau de l’application :
- la navigation doit afficher **Centre opérationnel** ;
- un menu **Séances** séparé doit être visible ;
- la page Séances doit exposer ses huit sections ;
- le Blueprint exécutable doit être visible dans Communauté & économie ;
- les presets Forum/Communautés et le Labo financier doivent rester disponibles.

La première observation réelle sur l’appareil du fondateur reste une recette terrain. Elle ne doit pas être inventée à partir du smoke distant.

---

# 62. ÉTAT FINAL DU LOT

**Version runtime :** 1.4.2-operational-center-sessions-blueprint  
**Branche :** next/1.4.2-operational-center-sessions-blueprint-20260920  
**Source production :** a9fe00f94daa7a6787d5a4440a5edc0bc5e4a1c8  
**Qualification production :** 35499693852 SUCCESS  
**Deploy / smoke / BIR+ :** 35499693884 SUCCESS  
**D1 :** eco-system-db, conservée  
**R2 :** eco-system-backups, conservé  
**Real Money :** OFF  
**Terrain :** à recevoir sur téléphone/ordinateur du fondateur.

**Fin du document maître d’implémentation 1.4.2.**


# 63. CHECKPOINT FINAL POST-HOTFIX

Le lot 1.4.2 a été refermé après la correction de convergence PWA et la synchronisation de la vérité projet.

État final vérifié :
- version publique : `1.4.2-operational-center-sessions-blueprint` ;
- source réellement déployée : `a9fe00f94daa7a6787d5a4440a5edc0bc5e4a1c8` ;
- Worker Version ID : `6c7b4be2-7daa-4f15-ae11-0861d248f60a` ;
- qualification du SHA livré : `35499693852 SUCCESS` ;
- déploiement + smoke + BIR+ pré/post : `35499693884 SUCCESS` ;
- tests : **265/265 PASS** ;
- D1 : `eco-system-db`, réutilisée ;
- R2 : `eco-system-backups`, réutilisé ;
- migrations : **No migrations to apply** ;
- argent réel : **OFF**.

Checkpoint documentaire final :
- HEAD : `d686929b44bf9f5f61ddee2ddee434e891c39afb` ;
- qualification : `35499946396 SUCCESS` ;
- BIR+ final : `35499946216 SUCCESS` ;
- artifact final : `10600699685` ;
- restauration SQLite : `PRAGMA integrity_check=ok` ;
- SHA256 : validé ;
- R2 final : `birplus/1.4.2/d686929b44bf9f5f61ddee2ddee434e891c39afb/final/` — PASS.

La prochaine étape normale n'est pas un nouveau développement massif : c'est la recette terrain de cette production, puis des corrections uniquement sur défaut reproductible.



---

# 48. INTÉGRATION HARMONISÉE DES FORUMS ET COMMUNAUTÉS — BLUEPRINT 5.0.0

Le Blueprint 5.0.0 ne crée aucun « second réseau social ». Il enrichit les moteurs `COMMUNITY.FORUM`, `COMMUNITY.PRO_HUBS`, les communautés d’intérêt et les espaces du groupe.

## 48.1 Types de Hubs proposés

Un groupe peut préconfigurer, selon ses besoins :
- Forum principal ;
- Opportunités du groupe ;
- Marché & besoins ;
- Compétences & emploi ;
- Agriculture & production ;
- Business & fournisseurs ;
- Formation & transmission ;
- ONG · partenaires · impact ;
- Créateurs & vitrines ;
- Actualités sourcées & tendances.

Ces boutons ne créent pas automatiquement tous ces espaces. Ils préremplissent un Hub existant afin de laisser le groupe décider.

## 48.2 Publications orientées vers l’action

Dans les forums et Hubs :
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

Une publication sociale ne devient jamais automatiquement :
- une commande ;
- un paiement ;
- une obligation comptable ;
- une règle de groupe ;
- une promesse de financement.

Le forum peut servir de **porte d’entrée conversationnelle**, puis transférer l’utilisateur vers le moteur canonique concerné.

## 48.3 Association/Tontine d’abord

Pour un groupe enregistré, les communautés doivent renforcer :
1. la vie du groupe ;
2. la préparation des séances ;
3. les besoins collectifs ;
4. les compétences des membres ;
5. les achats groupés ;
6. les opportunités économiques ;
7. l’accompagnement par des partenaires ;
8. la transmission des savoir-faire.

Un membre ne doit pas être obligé de quitter le contexte du groupe pour présenter ce qu’il sait faire, ses produits, son activité ou ses besoins.

---

# 49. BLUEPRINT 5.0.0 — SIX COUCHES EXÉCUTABLES

## Couche 1 — Association / Tontine
- GROUP.ANTICIPATION ;
- GROUP.MEETING_AUTOPILOT ;
- GROUP.DOCTOR.

## Couche 2 — Besoins et opportunités
- OPPORTUNITY.NEED ;
- MARKETPLACE.DEMAND_EXCHANGE ;
- MARKETPLACE.PROCUREMENT ;
- MARKETPLACE.GROUP_BUY.

## Couche 3 — Eco NOW / Harvest / commerce local
- MARKETPLACE.ECO_NOW ;
- MARKETPLACE.HARVEST_LOCAL ;
- MARKETPLACE.FRESH_DROP ;
- MARKETPLACE.PICKUP_NETWORK.

## Couche 4 — Valeur / activité / talent / création
- MANAGER.VALUE_DISCOVERY ;
- MANAGER.BUSINESS_STUDIO ;
- MANAGER.BUSINESS_AGENT ;
- LEARNING.TALENT ;
- CREATOR.STUDIO.

## Couche 5 — Communautés / forums / accompagnement
- COMMUNITY.FORUM ;
- COMMUNITY.PRO_HUBS ;
- PARTNERS.DIRECTORY ;
- LEARNING.MANAGER_ACADEMY.

## Couche 6 — Confiance / intelligence
- TRUST.GRAPH ;
- MARKETPLACE.MARKET_INTELLIGENCE ;
- SAFETY.ANTISCAM.

---

# 50. GARDE-FOU DE TRANSFERT VERS UN OWNER CANONIQUE

Les modules suivants possèdent déjà un owner opérationnel :
- Forums / Hubs ;
- achats groupés ;
- Partenaires / programmes ;
- Marketplace.

Le Blueprint 5.0.0 doit donc afficher un **handoff explicite** :
> « Ouvrir le moteur canonique »

et ne pas créer un deuxième enregistrement métier qui divergerait.

---

# 51. LIVRAISON PWA VISIBLE

Le problème observé sur téléphone montre qu’un workflow vert ne suffit pas si un ancien Service Worker continue de servir des assets obsolètes.

La livraison 5.0.0 impose :
- version d’asset `v=143` ;
- cache PWA `eco-system-v143-blueprint-5-0-0-finalized-20260921` ;
- navigation network-first ;
- scripts/styles network-first avec `cache:'no-store'` ;
- fallback cache seulement en cas de perte réseau ;
- suppression des anciens caches Eco-System à l’activation ;
- marqueur visible `ECO-SYSTEM · 1.4.3` ;
- smoke sur le HTML, le Blueprint, les communautés et le Service Worker.

---

# 52. CRITÈRES DE FIN DE LOT

Le lot est considéré livré uniquement si :
1. CI du SHA exact = SUCCESS ;
2. BIR+ pré-déploiement = PASS ;
3. D1 existante réutilisée ;
4. R2 existant réutilisé ;
5. aucune migration destructive ;
6. version publique = `1.4.3-blueprint-5-0-0-finalized` ;
7. Centre opérationnel visible ;
8. vrai menu Séances visible ;
9. navigation mobile lisible ;
10. Blueprint 5.0.0 visible ;
11. Hubs communauté étendus visibles ;
12. publications d’action étendues visibles ;
13. Labo anti-arnaques conservé ;
14. `realMoneyEnabled=false` ;
15. smoke production = PASS ;
16. BIR+ post-déploiement = PASS ;
17. vérité projet mise à jour ;
18. BIR+ final de fermeture = PASS.

