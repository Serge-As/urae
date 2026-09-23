# ECO-SYSTEM — Portée d’implémentation complète 1.5.0

Date : 23 septembre 2026  
Statut : **IMPLEMENTATION_AUTHORIZED / IN_PROGRESS**  
Branche : `next/1.5.0-audit-complete-platform-20260923`  
Base auditée : `57b99f5249535cef2edc90a3635b2a26fc7ebf12` (`fix/1.4.5.1-field-corrections-20260922`)  
Production inchangée pendant ce checkpoint : `1.4.5-final-mega-offline-governance`, source `463035adab2303874878c8e72f1965475ac0b209`.

Ce document adapte l’audit du 22/09/2026 aux décisions du fondateur et réincorpore les contours historiques du **Chat originel Eco (04/12/2025–04/09/2026)** et de **Conversation originelle Eco**. Les archives sont anciennes : elles décrivent l’intention fonctionnelle à préserver ; les contrats techniques présents et les nouvelles règles de sûreté restent l’autorité d’implémentation.

## 1. Décisions nouvelles du fondateur

### 1.1 Groupe successeur après pétition/reconstitution
Le nouveau groupe ne reçoit aucun transfert financier automatique décidé par l’application. Il décide, selon sa nouvelle gouvernance et les droits applicables, des actions à entreprendre concernant les actifs, dettes, créances et anomalies héritées du dossier de fermeture. Il peut notamment ouvrir un dossier de contestation, demander justification/régularisation ou engager une plainte en cas de soupçon de détournement.

Garde-fou : une décision du nouveau groupe ne fait pas disparaître les droits des tiers et ne transforme pas une accusation en fait établi. Eco-System conserve la provenance et les preuves autorisées nécessaires au workflow de contestation jusqu’à la purge applicable.

### 1.2 Purge six mois
La cible produit demandée est une **suppression complète des données métier du groupe de la plateforme** à expiration de la rétention, sauf données techniques/statistiques minimales non reconstructives : dates techniques nécessaires, préférences/cookies encore licites et métriques agrégées/anonymisées.

Ne doivent pas subsister comme données opérationnelles exploitables : groupe, membres, Ledger consultable, prêts, épargne, séances, rubriques, documents, messages privés, pièces, stocks, mandats ou snapshots restaurables.

La mise en œuvre doit couvrir D1, R2, indexes, caches, Relay et restauration de sauvegarde. Une ancienne sauvegarde ne doit jamais ressusciter un groupe purgé. Tant que les sauvegardes historiques ne permettent pas une destruction physique sélective prouvée, l’interface ne doit pas prétendre « effacement physique de toute copie ». Le plan de stockage devra évoluer vers rétention compatible et/ou chiffrement/crypto-effacement par périmètre sans sacrifier les sauvegardes des autres groupes.

## 2. Contours historiques rétablis

### 2.1 L7 — Group Launch Studio + Paper Bridge + Academy de lancement
Le Launch Studio n’est pas un simple assistant « nom + membres + montant ».

Il doit conserver les dix étapes historiques et couvrir :
- association, tontine rotative argent, tontine en nature et hybride ;
- groupe nouveau, groupe existant importé et groupe en évolution ;
- ancienneté/historique, localité, mission sociale, fréquence/mode de réunion ;
- gouvernance, confidentialité `SECRET / MEMBERS_ONLY / INVITE_ONLY / PUBLIC` ;
- mandat d’accompagnement `SILENT / FOUNDER_ONLY / BUREAU / CONTROL_COMMITTEE / MEMBERS / PLATFORM_MEDIATION` ;
- admission/recrutement, arrivée tardive, rattrapage ou participation prospective ;
- multi-tontines, participation indépendante, plusieurs parts/noms, bénéficiaires et cycles ;
- familles de rubriques positives, assistance/main-levée et négatives/prêts sans perdre les rubriques historiques ;
- RI Word/PDF/images → extraction → propositions → sources justificatives → validation humaine ;
- Cycle Planning Board, Session Command Center et continuité des feuilles ;
- Paper Bridge : feuille mensuelle, émargement, fiches individuelles, cahiers Président/Secrétaire/Trésorier/Commissaire, prêts, assistance et cartes membre ;
- transition volontaire Papier → Hybride → Numérique ;
- faisabilité multi-scénarios avant création, sans écriture Ledger ;
- Academy contextuelle pour novice/senior/professionnel, jamais prérequis discriminant.

### 2.2 L8 — Business Studio + gestionnaire professionnel + boutique + fournisseurs
Le Business Studio représente une **activité professionnelle privée ou structurelle**, éventuellement exercée pour plusieurs groupes. Il ne doit pas être réduit à quatre KPI.

Il couvre :
- `BusinessWorkspace` privé, collaborateurs et activités ;
- `ManagementMandate` par groupe : services, durée, tarifs/honoraires, droits, approbations et fin de mandat ;
- prospects/clients consentis, services, devis, contrats, factures, dépenses, paiements constatés, temps, budgets et scénarios ;
- coût de déplacement/fournitures/formation, marge, trésorerie, impayés et point mort ;
- lien référentiel avec la dépense collective sans second paiement ni second Ledger ;
- profils/hubs professionnels et fournisseurs ;
- achats groupés historiques : besoin collectif → fournisseurs → devis → négociation → commande → distribution ;
- boutique virtuelle avec séparation stricte **stock des pots / stock commercial / consignation / dépôt-vente** ;
- propriété économique distincte de la détention physique ;
- Procurement, réception, stock, fulfilment, retour/perte/avoir ;
- crédit fournisseur avec débiteur exact et coût rendu réel ;
- possibilité de promouvoir légalement son offre via les moteurs Marketplace/AdManager existants, sans fusionner publicité et réputation.

### 2.3 L9 — Discovery/Membership + bouche-à-oreille + referral + campagnes + sûreté
Le recrutement n’est pas une fonction marketing isolée. Il prolonge Discovery et Membership Gateway historiques.

Il couvre :
- recherche de groupes publics par nom/localité/mission/activité ; SECRET absent de Discovery ;
- candidature → attente → décision autorisée → adhésion ;
- invitations à jeton opaque et recrutement volontaire de membres ;
- recommandation volontaire de groupe, gestionnaire, partenaire, produit/service ou contenu public autorisé ;
- partage système, lien, QR et carte, sans lecture/envoi automatique du carnet d’adresses ;
- métriques honnêtes : partage lancé ≠ reçu ≠ lead ≠ adhésion ;
- attribution directe et versionnée ;
- campagnes rémunérées à budget préfinancé/borné, avec événement réel prouvé et réservation atomique ;
- un seul niveau direct : aucun mécanisme pyramidal/multiniveau ;
- anti-fraude/anti-arnaque avec signaux explicables, revue humaine, recours et distinction soupçon/constat ;
- Community/Forum peut transformer une conversation en brouillon de recrutement/besoin, jamais en engagement automatique.

### 2.4 L10 — Knowledge Bank + Grande IA Fondateur + Encyclopédie + Academy + ONG + inclusion
La mémoire IA ne se limite pas à un chatbot.

Elle comprend :
- Knowledge Bank versionnée : fait observé, hypothèse, règle validée, cas/jurisprudence interne, source externe, validité et revalidation ;
- **Grande IA Fondateur** : synthèse gouvernée du produit/projet, capable d’expliquer les capacités et proposer des améliorations sans changer seule la finance ou les règles ;
- **Encyclopédie fonctionnelle** intégrée et recherchable : nom FR/EN, ID, état réel, description, owner, dépendances, audiences, tags, origine, histoire/mémoire et preuves ; recherche par « invitation », « prêt », « publicité », « rubriques », « ONG », « papier », « tontine », etc. ;
- Encyclopedia des rubriques et modèles validés ;
- Academy : parcours de gestionnaire, trésorier, président, formateur, fournisseur, fondateur, etc. avec exercices/simulation/preuves ; attestation ≠ rôle financier automatique ;
- programmes ONG/animateurs : mandat borné, agrégats par défaut, accompagnement, financement prouvé, formation et transfert progressif vers les responsables locaux ;
- Paper→Hybrid→Digital et accompagnement des groupes peu numérisés ;
- inclusion femmes/leadership comme parcours facultatifs sans sexe dans le score financier/réputation ;
- futur FederationHub uniquement comme extension documentée, jamais comme prétexte à un nouveau moteur parallèle.

### 2.5 L11 — Community & Value Network
Les six couches Blueprint restent des orchestrateurs branchés aux owners existants :
1. anticipation ;
2. besoins/approvisionnement ;
3. NOW/Harvest/Fresh Drop/Pickup ;
4. Business/Talent/Creator ;
5. communautés/Hubs/ONG/Academy ;
6. Trust/intelligence/anti-arnaque.

Un bouton/workspace générique n’est pas une capacité fonctionnelle. Chaque action acceptée doit créer/consommer l’objet du service canonique avec preuve et état réel.

### 2.6 L12 — Accueil, dashboards, recherche et Control Center
Le dernier lot ne signifie pas seulement « faire des KPI ».

Il doit conserver/adapter :
- **Accueil = poste de commandement**, pas page décorative ;
- Univers personnel : groupes, actions dues, alertes, données personnelles autorisées ;
- Centre opérationnel transversal ;
- Session Command Center : séance, attendance, attendu/reçu, prêts, votes, caisse, synchronisation ;
- tableaux Groupe/Membre/Finance/RECAP/Épargne/Caisse/Tontines ;
- analytics historiques : entrées, dépenses, épargne/trésorerie, répartition par rubrique, prévisions, comparaison réel/prévu ;
- Business, fournisseurs, procurement, Launch, simulations, Academy/ONG, Community/Value ;
- AdManager et statistiques publicitaires ;
- recherche globale + Encyclopédie fonctionnelle ;
- FR/EN, senior/novice, faible réseau : chiffres et mini-tendances avant graphiques lourds ;
- Control Center fondateur : auto-enregistrement des capacités, erreurs/latence/outbox/conflits/coûts, incidents/plaintes, contenus/articles/modération, état de surveillance, preuve avant « résolu » ;
- chaque carte déclare owner, formule, unité, date/fraîcheur, réel/prévu, permission et lien vers preuve ;
- indisponible ≠ zéro.

## 3. Invariants transversaux
- Ledger canonique unique, append-only tant que l’entité existe ; aucune UI/IA/Live n’est une seconde comptabilité.
- MeetingService owner des séances.
- Simulation ≠ engagement ≠ transaction.
- prévision ≠ demande ≠ commande ≠ stock.
- IA explique/propose ; elle ne déplace pas l’argent.
- API et Relay transportent les mêmes commandes/événements/permissions.
- argent réel reste OFF.
- migrations additives uniquement ; pas de recréation de `eco-system-db`.
- dix étapes, Collation, multi-tontines/parts/participants, RECAP, Community, Marketplace, AdManager, ONG, Premium Live et historique restent des acquis.

## 4. Implémentation commencée dans ce checkpoint
- nouveau branchage 1.5.0 depuis le SHA réellement audité ;
- correction du bug du simulateur INITIAL : aucun nouvel intérêt après capital = 0 ;
- tests d’exécution pour extinction du capital et intérêts résiduels ;
- nouveau contrat repository `FinancialCorrectionPlan` ;
- correction de cellule préparée et persistée comme plan atomique (contrepassations + remplacement + audit + outbox) ;
- première saisie 0→X retirée du raccourci non atomique ;
- commande de cellule sauvegardée localement avant transport avec même clé d’idempotence ;
- synchronisation offline compare la valeur de base et ouvre une confrontation si la vérité a changé ;
- workflow CI dédié 1.5.0 ajouté.

## 5. Prochains P0 avant expansion
1. version/CAS transactionnel de cellule, y compris deux premières saisies concurrentes ;
2. règle serveur de revue indépendante complète après clôture et auto-validation interdite ;
3. tests D1 de panne/concurrence/idempotence ;
4. cohérence release/PWA atomique et buildId unique ;
5. lifecycle corbeille/restauration transactionnel puis purge selon décision §1.2 ;
6. migration claim local reprenable ;
7. seulement ensuite promotion progressive L7–L12.

Aucun déploiement production n’est autorisé par ce checkpoint tant que CI, BIR+ pré, migrations additives éventuelles, smoke et preuves requises ne sont pas obtenus.
