# ECO-SYSTEM — CAMEROUN : PAIEMENTS MOBILE MONEY, NÉGOCIATION LIBRE ET ANTI-CONTOURNEMENT

**Date : 19 octobre 2026**  
**Statut : NOTE FONDATRICE / PISTES À INSTRUIRE — non implémentées, non déployées, non autorisées pour argent réel.**  
**Destination :** dépôt privé `Serge-As/urae`, information de tous les contributeurs autorisés, futurs repreneurs, développeurs et agents IA. **Ne pas transférer vers `Serge-As/utrae` public ni rendre le dépôt public.**  
**Mission :** Eco-System doit prospérer sans punir les utilisateurs qui négocient librement et sans transformer les associations/tontines en source involontaire de commissions commerciales.

## 1. Contexte métier camerounais apporté par le fondateur

Le Mobile Money (MTN MoMo, Orange Money) s'impose dans la pratique commerciale au Cameroun, mais les prix sont souvent **négociés directement** entre un acheteur et un fournisseur. Eco peut apporter découverte, comparaison, recommandation, mise en relation, demande de devis, confiance et logistique, mais **ne peut ni imposer ni connaître avec certitude le prix final** après une discussion hors plateforme.

Une fois leurs coordonnées partagées, les deux parties peuvent conclure par téléphone, WhatsApp, espèces ou Mobile Money direct sans déclarer la vente : une commission Eco fondée seulement sur une déclaration volontaire du prix final devient non recouvrable ou source de conflits. Le contournement peut être bilatéral ou décidé unilatéralement par un vendeur. Interdire tout contact direct détruirait l'utilité du service pour les ventes réellement négociées.

Deuxième obstacle : un paiement marchand peut sembler gratuit à l'acheteur, mais **le marchand/plateforme qui collecte supporte des frais de transaction, de liquidation ou de retrait**. Le fondateur rapporte des frais de l'ordre de 1 % lorsqu'Eco récupère ses fonds. Il connaît aussi des SIM commerciales d'agents/call-boxeurs avec mouvements et déstockage dans un régime particulier, et demande d'examiner si une **offre professionnelle contractuellement autorisée** peut donner une économie similaire au projet. **Ne jamais déduire d'une expérience d'agent que les mêmes exonérations s'appliquent à une marketplace.**

**Objectifs :** client gratuit à l'utilisation de base et, lorsque possible, au paiement ; Eco rémunéré pour un service démontrable ; coût de collecte/liquidation vérifié et minimisé, idéalement 0 F de frais selon une convention écrite ; bénéfices raisonnables pour vendeurs et associations ; transparence des frais et taxes ; aucune fraude.

## 2. Doctrine économique proposée : un modèle résistant à la vente invisible

**Priorité A — facturer AVANT le contact commercial une valeur réelle, pas une vente supposée.**

1. **Eco Demande Qualifiée / Eco Leads :** client gratuit ; besoin réel (produit, quantité, ville, délai, budget facultatif), anti-spam, anonymisation initiale ; offre de réponse payante clairement tarifée à un nombre limité de vendeurs pertinents. Une réponse est un service mesurable, **pas une garantie de vente**. Recrédit si demande frauduleuse/expirée avant la prestation. Aucune vente de carnets de contacts ni divulgation sans consentement.
2. **Eco Business Pro :** abonnement professionnel pour catalogue, gestion de devis, CRM, commandes, SAV, stocks, relances, statistiques, factures et outils de rentabilité. Essentiel gratuit ou accessible. La rémunération ne dépend pas de la déclaration de la vente.
3. **Eco Procurement pour groupes :** accompagnement d'achats groupés approuvés : appel à devis, comparaison, consolidation de besoins, mandat, vérification et éventuellement frais pour dossiers fournisseurs explicites. Ne pas vendre des marchés fictifs ni permettre que celui qui paie achète automatiquement la décision d'achat.
4. **Eco Réservation / Service vérifiable :** frais justifiés pour rendez-vous, livraison sécurisée, vérification, réservation de créneau, traçabilité, protection du paiement, SAV, assurances partenaires approuvées. Si vente libre sans service payant, ne pas prétendre collecter une commission non prouvée.
5. **Publicité, sponsoring, formation, études de marché sourcées, achats de capacité B2B, intégration professionnelle :** diversifier pour ne pas dépendre d'un unique prélèvement transactionnel.

**Priorité B — conserver un parcours transactionnel Eco plus intéressant qu'un contournement :**

- Négociation **dans Eco** : demandes, contre-offres, devis versionnés, prix final choisi et validé uniquement par vendeur + acheteur ; Eco **ne négocie pas à la place du vendeur**.
- **Eco Deal Passport** : identifiant non financier de négociation/devis/commande, preuves consenties, reçu, livraison, garantie, retour et réputation vérifiée ; utilisable pour SAV et bonus de fidélité non monétaires. Le service doit rester utile à ceux qui auraient pu discuter directement.
- Pour transactions éligibles : paiement d'acompte ou intégral par PSP autorisé, **partage de recettes uniquement si le PSP le propose contractuellement**, reçu et remboursement gérés. Une vente hors Eco ne devient pas artificiellement « payée » dans le logiciel.
- Contacts révélés lorsque nécessaires ; ne pas emprisonner acheteur et vendeur, ni simuler des acheteurs pour monétiser des réponses. Règles de transparence et contestation pour frais de lead.

## 3. Architecture des paiements : quatre modèles à mettre en concurrence

| Modèle | Parcours | Ce que gagne Eco | Coûts/contraintes |
|---|---|---|---|
| M1 — **Paiement direct vendeur** | Acheteur verse 100 % directement au vendeur, y compris MoMo/OM/espèces ; Eco ne détient pas les fonds | Lead payé d'avance, abonnement vendeur, pub et services | Coût de retrait Eco = 0 sur **ce flux absent**, mais frais éventuels du vendeur et frais de facturation à Eco ; pas de commission garantie sur vente |
| M2 — **Encaisser seulement Eco** | Vendeur paie d'avance l'abonnement/le crédit de service Eco (paiement marchand, facture, bank) ; vente ultérieure indépendante | Chiffre d'affaires attesté sur montant limité | Frais prestataire sur la **seule recette Eco**, pas sur le prix entier du bien ; attention au coût et à la consommation des crédits |
| M3 — **Checkout PSP avec reversement réglementé** | Devis final accepté, client paie via PSP agréé, qui règle vendeur et éventuellement Eco selon contrat de marketplace/split | Commission vérifiable **uniquement sur paiements intégrés** | Disponibilité et coûts du split/encaissement/settlement, KYC, remboursements, litiges, fiscalité ; ne pas supposer fonctionnalité offerte |
| M4 — **Services, bons et commandes de groupe** | Eco facture la gestion de la consultation et fournit un bon vérifiable ; argent des achats versé aux fournisseurs directement ou par PSP autorisé | Dossier de consultation, coordination, livraison, contrôles et outils pros | Mandat associatif et RI, politique de conflit d'intérêts ; jamais de prélèvement dans les caisses tontine |

**Exemple arithmétique purement illustratif :** commande finale à 100 000 F CFA, commission supposée 3 % = 3 000 F. Avec une collecte à 1 % sur 100 000 F, **1 000 F** de coût sur ce seul étage (hors taxes, reversement, frais complémentaires et risque). Si le vendeur reçoit directement 100 000 F et que le service Eco de **3 000 F** est encaissé séparément après accord, 1 % de collecte sur 3 000 F vaut **30 F**, mais l'obligation de paiement d'Eco doit être sûre (de préférence prestation/forfait payé d'avance) : le cash-out et les taxes peuvent subsister. Les taux ne sont **pas des devis commerciaux Eco**.

## 4. Informations tarifaires vérifiées sur pages officielles (lecture du 19 octobre 2026)

1. **MTN Cameroon — MoMo Collections** : compte de collecte professionnel ; frais autour de **1 % par transaction, négociables** selon type et valeur moyenne ; documentation indiquant **aucun frais par appel API**. Fonds utilisables pour certains paiements à fournisseurs/partenaires ou liquidation bancaire selon conditions. **Source :** https://momoapi.mtn.com/Cameroon_Collection_productDetails
2. **MTN Cameroon — Disbursements** : compte professionnel préalimenté pour décaissements ; la documentation publiée indique **« Disbursement transactions are free »**. Cela **ne prouve pas** que l'approvisionnement initial, tout mouvement inter-réseaux, le cash-out, les impôts ou l'accès contractuel sont gratuits. **Source :** https://momoapi.mtn.com/Cameroon_Disbursement_productDetails
3. **MTN MoMo tarifs grand public** : paiement marchand annoncé **gratuit pour le client** ; retraits standard souvent autour de **1 % plus prélèvements** selon montant et grille affichée, à distinguer des contrats entreprises. **Source :** https://mtn.cm/fr/tarifs-momo/
4. **Orange Money Cameroun — paiement marchand** : affiché gratuit pour le payeur ; les frais de retrait sur compte personnel ne sont pas automatiquement ceux d'un compte marchand. **Source :** https://orangemoney.orange.cm/fr/tarification-orange-money.html
5. **Orange Money — OM ASSO** : produit distinct pour petits commerçants/secteur informel, notamment call-boxeurs, avec réception de nombreux paiements. Grille officielle des retraits OM ASSO : jusqu'à 10 000 F taux forfaitaires (par exemple 50 F dans la tranche 1 000–10 000), **0,50 % de 10 001 à 200 000 F**, puis **1 000 F de 200 001 à 500 000 F** sur la page consultée. Ce n'est ni un compte Eco agréé ni un zéro général. **Sources :** https://orangemoney.orange.cm/fr/om-asso.html ; https://orangemoney.orange.cm/fr/tarification-orange-money.html
6. **Orange Money — marchand à marchand** : paiement direct depuis le solde marchand sans retrait, **gratuit pour l'émetteur**, mais marchand destinataire facturé selon son tarif, interopérabilité concurrente non confirmée par cette page. Ce mécanisme économise une étape de cash-out **sans supprimer nécessairement tous les coûts**. **Source :** https://orangemoney.orange.cm/fr/paiements-entre-marchands.html
7. **Orange Money Business — compte bancaire** : promotion d'une liaison au compte bancaire « sans frais supplémentaire ». Vérifier **par écrit** si elle couvre le règlement net et quels autres frais restent dus. **Source :** https://orangemoneybusiness.orange.cm/services/paiement-marchand
8. **Cadre de services de paiement CEMAC/COBAC** : règlement n°04/18 ; analyse juridique obligatoire de l'encaissement pour compte de tiers, conservation d'argent, changement de statut d'agent et monnaie électronique. **Source :** https://www.beac.int/supervision-bancaire/reglements-de-cobac/ ; https://www.beac.int/systemes-paiement/instructions-circulaires-reglements/

**Attention :** pages Orange d'anciennes langues/domaines peuvent afficher une grille différente ; exiger une grille écrite, datée et **contractuelle** applicable au compte proposé. Aucun fournisseur interrogé individuellement ; aucune convention conclue.

## 5. Idées non conventionnelles — possibilités et limites

- **Eco Agent/HUB cash-in/cash-out autorisé :** partenariat formel avec MTN/Orange ou un agrégateur/agent principal habilité, avec statut, SIM, plafonds, KYC, formation, commissions, mandats, contrôles et responsabilité contractualisés. Étudier si des revenus de service agent ou une meilleure gestion de liquidité compensent les frais. **Ne pas détourner une SIM personnelle/agent d'autrui pour maquiller des encaissements marketplace**.
- **Boucle B2B sans cash-out fréquent :** payer, depuis un compte marchand professionnel, des fournisseurs de services Eco déjà marchands (publicité, SMS, transport, sous-traitance) si contrat et fiscalité l'autorisent. Les sommes restent dans le circuit et les liquidations diminuent ; **le destinataire peut être facturé**.
- **Règlement direct au vendeur + facture séparée Eco :** quasi zéro frais Eco sur le prix principal, commission de mise en relation remplacée par frais de service prépayés ; la grille commerciale doit être claire au vendeur.
- **Abonnements annuels/forfaits regroupés :** espacer l'encaissement ; utile contre les **frais fixes**, pas nécessairement contre un taux proportionnel. Préserver droit de résiliation, remboursements applicables et coût de petits vendeurs.
- **Échanges de prestations commerciaux documentés :** Eco fournit un logiciel ou une campagne et reçoit un service professionnel utile en contrepartie, avec factures et valorisation honnête. Le troc ne supprime pas automatiquement obligations fiscales.
- **Acheteur institutionnel / coopérative mandatée :** structure d'achat groupé négociant des prix et se rémunérant sur la prestation de coordination ; distinguer mandat d'association, qualité de revendeur, responsabilité produit, concurrence et taxes.
- **Parrainage rémunéré par un partenaire réglementé :** un PSP, opérateur ou banque finance l'acquisition, le référencement ou les outils Eco selon contrat B2B, pour que l'acheteur bénéficie du 0 F et qu'Eco touche un revenu hors cash-out. Pas de gratuité sans partenaire qui porte les coûts.
- **Modèle « marchand principal »** : Eco achète puis revend, connaît le prix et la marge ; fort contrôle, mais devient vendeur responsable (stock, TVA, retours, risques, fiscalité). **À envisager seulement sur produits ponctuels et après analyse**, pas comme substitution universelle.
- **Escrow/fiducie de paiement, wallet interne, compensation entre vendeurs, crédit transferable, caisse commune** : conceptuellement possibles, **mais réglementation/prudence renforcées** et prestataire dûment habilité ; jamais prétendre pouvoir lancer cela via un simple registre interne.

**Pistes à écarter faute d'autorisation démontrée :** prêt de SIM agent/call-box pour recettes d'Eco ; comptes prête-noms ; fausses ventes/retours ; dissimulation des commissions ou revenus ; fragmentation artificielle pour contourner plafonds/tarifs ; réutilisation des fonds des tontines ; simulation de statut « agréé » ; comptabilité fictive ; décaissements non consentis. Ces idées sont connues comme risques, **pas des procédures à exécuter**. Elles peuvent créer blocage, perte de fonds et responsabilité pénale/contractuelle.

## 6. Questions fermées à poser aux opérateurs/PSP avant tout développement

Demander une offre écrite MTN MoMo Corporate et Orange Money Business (et 1–2 PSP effectivement agréés au Cameroun) précisant :

1. Eco peut-il agir en tant que **place de marché / intermédiaire**, en collectant pour des vendeurs tiers ? Sous quel statut (agent technique, marchand, PSP partenaire) ?
2. Détail **payer → collecter → liquider banque → payer vendeur → retirer**, avec frais TTC, taxes (dont prélèvements sur transferts), minima, plafonds, tarification petits montants, frais reversés au vendeur.
3. Deux offres distinctes : **(a) client payant 0 F, Eco encaisse seulement ses services**, **(b) client payant 0 F, PSP répartit achat entre vendeur et Eco**. Split réel et reversement vers OM/MoMo/autre réseau disponibles ?
4. Encaissement/compensation **0 F** envisageable contre volume, abonnement mensuel, sponsoring ou accord d'acquisition ? Quels minimums contractuels et engagements de volume ?
5. Conditions d'un **compte marchand relié banque** sans cash-out manuel ; coût de virement, calendrier J/J+1/J+N, réserves, gel de fonds.
6. Pour le modèle call-box/agent : **contrat exact autorisant Eco** à être agent/agrégateur, commissions et restrictions d'usage de la liquidité.
7. API webhooks, statut idempotent, refunds/chargebacks, split, litiges, justificatifs, sandbox, KYC/KYB, données stockées, consentements, résolution d'incidents.
8. Rémunération possible d'Eco comme **apporteur d'affaires**/distributeur autorisé du PSP au lieu de frais de commission marchande.

Contacts officiels vérifiés : MTN `MoMoCorporate.CM@mtn.com` (sur sa documentation Collections) ; Orange `partenariat.OM@orange.com` (sur page partenaire OM Asso). **Vérifier à nouveau les coordonnées avant l'envoi.**

## 7. Pilote réaliste et critères de décision (aucune activation réelle autorisée)

**Lot documentaire (présent)** : cartographie produit, contextes financiers isolés, sources tarifaires, questionnaires PSP. **Aucune ligne de code, aucune migration, aucune CI, aucun déploiement.**

**Pilote de recherche, uniquement après autorisation séparée :**
- Interviewer des acheteurs (négociation, raisons de quitter la plateforme) et vendeurs (combien paieraient-ils pour une réponse qualifiée ?) ; échantillon volontaire, données anonymisées.
- Démonstration de 3 parcours sur données synthétiques : RFQ / devis négocié / paiement direct vendeur ; RFQ avec frais pro prépayés ; paiement PSP sandbox avec tarifs vérifiés.
- Comparer coûts **tout compris** de M1–M4 pour petites commandes et gros achats, taux de faux leads, refus, litiges, conversion, confidentialité, usage 2G/offline et compatibilité Android 6/iOS.
- Critères : client gratuit sur canal annoncé ; vendeur voit prix et service à l'avance ; Eco n'a pas à vérifier l'impossible ; **marge nette positive après frais et support** ; aucun impact négatif sur Ledger/Outbox/groupe ; conformité juridique vérifiée ; réversibilité.

**Recommandation initiale :** lancer commercialement dans l'ordre **Eco Leads qualifiés + Business Pro + achats groupés professionnels (paiement direct vendeur)**, puis paiement intégré **optionnel** avec PSP et partage contractuel. Poursuivre simultanément MTN (Collections négociables, Disbursements annoncés gratuits) et Orange (OM ASSO distinct, B2B marchand→marchand et règlement banque) : viser **zéro cash-out**, pas prétendre zéro coût bancaire/PSP sans accord écrit.

## 8. Gouvernance / interdictions de mélange

- Les valeurs **financières des groupes** (cotisations, prêts, intérêts, remboursements, pots, fonds secours) sont isolées du business personnel d'Eco, de la marketplace et de l'argent vendeur.
- Aucun débit de portefeuille, prélèvement de commission, transfert tiers ou émission de crédits convertibles/réutilisables tant que `realMoneyEnabled=false`.
- Ne modifier ni production, ni D1/R2/secrets, ni HOLD, ni Ledger/Outbox, ni UI existante du cœur métier. Préserver tous les acquis et `ECO-LOCK-001` en tant que proposition de gouvernance à instruire.
- Toute future mise en œuvre : revue par les propriétaires, autorisation bornée du fondateur, branche privée, tests offline/synchro, qualification documentée, convention PSP, vérification juridique, **autorisation distincte de déploiement**. Rédaction de la note **≠ implémentation**.
- Confidentialité : seul URAE privé accueille ce contexte stratégique. Publication publique éventuelle exige une version expurgée et une permission explicite.

## 9. Références internes pour l'équipe

- Cahier du 18 octobre : `Eco-System_Modele_Economique_Anti_Contournement_Market_Intelligence_2026-10-18.md` (bibliothèque du fondateur, ne pas supposer copié dans GitHub).
- Cahier du 18 octobre : `Eco-System_ECO_LOCK_001_Verrou_Acquis_Autorisation_Impact_2026-10-18.md` (bibliothèque du fondateur, **proposition** de règle, ne pas prétendre gate installé).
- `docs/operations/REPRISE_IMPLEMENTATION_ECO_URAE_2026-10-10.md` et `docs/operations/CI_QUOTA_ZERO_UTRAE.md` (GitHub privé).
- Stratégie à appliquer à **Eco Deal, Eco NOW, Value Network, Hubs, Business Studio, Market/Procurement, Boutique, Harvest**, sans dénaturer l'Association/Tontine First.

**VERDICT DOCUMENTAIRE :** l'existence d'une solution techniquement possible n'est pas une promesse qu'elle est économique, contractuellement disponible ou juridiquement autorisée au Cameroun. Document de référence pour arbitrage, pas une preuve de lancement.
