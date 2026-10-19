# ECO-SYSTEM — ECOPAY : ARCHITECTURES ALTERNATIVES, COMPENSATION, MOBILE MONEY ET STABLECOIN

**19 octobre 2026 — Conception prospective / note fondatrice.**
**Statut : étude exploratoire non implémentée, non homologuée, non déployée.**
**Dépôt privé : Serge-As/urae uniquement.**
**Rattachement :** [Stratégie Cameroun paiement MoMo et anti-contournement](ECO_CAMEROUN_PAIEMENT_MOBILE_MONEY_ANTI_CONTOURNEMENT_2026-10-19.md), issue privée #97.
**Mandat fondateur :** examiner sans autocensure créative les moyens de créer une économie et un circuit de paiement Eco utilisant, complétant ou concurrençant partiellement le Mobile Money existant, avec très peu de friction et de frais. Étudier une valeur Eco, voire un stablecoin, sans prétendre que coder un jeton suffit à émettre une monnaie ou autorise la conservation de fonds.

## 0. Doctrine et cinq vérités

1. **« Gratuit pour client et Eco » ne signifie pas coût nul pour toute la chaîne.** Quelqu'un doit assumer les frais réseau, d'exploitation, d'interopérabilité, de conformité et les taxes. Les coûts peuvent être évités, déplacés, négociés, pris en charge par un sponsor ou compensés par une marge réelle, mais non supprimés par renommage d'un compte ou d'un token.
2. Ne pas mélanger **coupon/point marketing**, **créance commerciale**, **ordre de paiement**, **monnaie électronique**, **dépôt**, **actif numérique** et **crypto-stablecoin** : les régimes et risques divergent radicalement.
3. Le contexte économique local exige **négociation libre**, paiement direct au vendeur optionnel, préservation des espèces, et possibilité de fonctionner sur 2G/Android ancien. Eco ne doit pas devenir obligatoire pour une vente.
4. **Interopérabilité existante** : BEAC décrit GIMACPAY comme écosystème cartes/mobile/transferts reliant banques, opérateurs et agrégateurs. **Adhésion, certification et tarifs ne sont pas acquis pour Eco**.
5. **Confidentialité et contrôle :** aucun changement du Ledger financier des tontines, de l'Outbox, de la production, D1/R2/secrets/HOLD, `realMoneyEnabled=false`. Cette note ne constitue pas un accord de déploiement.

## 1. Inventaire des huit concepts

| Concept | Ce que voit l'utilisateur | Nature réelle | Actuellement prototypable | Risque principal |
|---|---|---|---|---|
| **ECOPOINTS** | points, niveaux, avantages | fidélité non transférable, non convertible en espèces | Oui, données synthétiques et avantages marketing financés, sous examen droit consommation/fiscalité | devenir monnaie déguisée si échangeables/convertibles |
| **ECOPASS** | bon de réduction du marchand/partenaire | remise ciblée, usage unique, non revendable | Oui en sandbox marketing | doubles usages, sponsor incapable de financer la réduction |
| **ECOPAY DIRECT** | devis et bouton payer le vendeur | ordre vers MoMo/OM/bank PSP, **pas de fonds Eco** | Oui, maquette et redirection vérifiable; API réelles contractuelles | faux reçus/captures d'écran |
| **ECOSWITCH** | payer par le moyen disponible le moins cher | agrégation logique via prestataires agréés | Simulable ; impossible de présumer tous rails accessibles | taux et frais de liquidation incomplets |
| **ECOCLEARING** | rapprochement de factures B2B, règlement net | compensation de créances mutuelles sous contrats; multilatérale via montage réglementé | Oui pour 2 entreprises et créances synthétiques | absence de consentement, litiges et compensation assimilable à paiement |
| **ECOHUBS** | commerce ou agent local d'assistance au paiement | réseau d'agents **du partenaire agréé**, non agence bancaire sauvage Eco | annuaire et expérience, hors manipulation de liquidité | agents utilisant mauvais statut/SIM, blanchiment |
| **ECOWALLET** | portefeuille en FCFA, réception et paiement | monnaie électronique émise par acteur habilité, Eco prestataire/agent dans son périmètre | UX et sandbox PSP ; non lancement sans contrat | conservation réglementée de fonds, KYC et liquidité |
| **ECOCFA** | jeton 1 unité = objectif 1 XAF | actif numérique / éventuel stablecoin | uniquement simulation non monétaire jusqu'aux avis/permissions | stabilité, remboursement, réglementation COBAC/COSUMAF/BEAC |

**Note lexicale :** ne jamais labelliser des EcoPoints comme « solde en F CFA », « épargne », « argent » ou « monnaie numérique » ; ne promettre aucune conversion. Si EcoPass prépayé ouvre un droit au remboursement, à de multiples marchands ou au transfert P2P, réexaminer sa qualification avant même un pilote.

## 2. Proposition architecturale centrale : « ECORELAY PAY NETWORK »

### Couches strictement séparées

- **Couche découverte / négociation** : opportunité, demande vérifiée, plusieurs devis, offres/contre-offres, facture acceptée (Eco Deal Passport).
- **Couche prix et rémunération Eco** : forfait Business Pro, réponse à demande qualifiée, publicité, dossier d'achats groupés, garantie/SAV contractuellement fournis. Facturer **avant** la rencontre dans la mesure du possible ; aucune promesse de commission sur une vente non connue.
- **Couche paiement** : objet PaymentIntent `CREATED / AUTHORIZED / CONFIRMED_BY_PSP / FAILED / UNKNOWN / REFUNDED` ; instruction PSP séparée du ledger financier des associations. Le vendeur et le client approuvent le montant final. Les fonds se déplacent exclusivement sur les rails agréés.
- **Couche aiguilleur** : cotation transparente des coûts : collecter, reverser, liquidité, change, taxe, règlement bancaire, paiement multi-opérateur, minimum/frais fixes; temps et disponibilité. Toute cotation est datée et liée au contrat, jamais imaginée.
- **Couche preuve** : accusé serveur signé/vérifié, idempotence de référence, journal d'évènements, rapprochement PSP, contestation, remboursement.
- **Couche avantages** : points et coupons non monétaires séparés des soldes de la caisse et de la monnaie véritable.

### Important : hors connexion

Un téléphone offline peut **préparer** un devis ou un bon de commande, scanner un QR contenant les détails et afficher « paiement à confirmer ». Il **ne doit jamais déclarer une valeur transférée, une recharge effectuée, un achat payé ou un retrait confirmé** sans preuve émise par un service habilité. Un QR signé n'est pas à lui seul une garantie de liquidité ni une prévention universelle de la double dépense. Une PWA ne peut pas créer une confirmation de paiement PSP lorsqu'elle est entièrement hors réseau.

## 3. Six montages économiquement très différents

**M1 — « Eco ne touche jamais le prix du vendeur » (première option) :** 100 000 F client→vendeur par Mobile Money direct/espèces; le fournisseur paie au préalable 500 F de réponse qualifiée, 5 000 F forfait ou une campagne explicite. Frais de retrait **Eco sur les 100 000 F = 0 car Eco ne les encaisse pas**, mais les frais du vendeur et du canal restent. C'est le levier anti-contournement le plus fort.

**M2 — Sponsor prend en charge les frais :** le commerçant, un annonceur, un opérateur ou une fédération finance les frais de paiement du client. Le prix ne change pas en apparence pour le client ; Eco ou partenaire provisionne la dépense en fonction d'une acquisition prouvée. Dire « sans frais pour client » et indiquer qui paie réellement.

**M3 — Eco facture seulement sa marge de service et non le panier :** sur panier 100 000 F, service Eco 3 000 F facturé distinctement au vendeur ; collecte de 1 % appliquée à 3 000 F représenterait 30 F de frais **sur cet étage seulement**, avant frais fixes, fiscalité et liquidation. Sur 100 000 F encaissés par Eco, 1 % = 1 000 F, sans compter le décaissement. D'où forte incitation à ne pas être encaisseur de la totalité.

**M4 — Règlement B2B en compte marchand :** payer certains fournisseurs directs depuis le solde marchand sans cash-out, seulement lorsque l'offre et le contrat l'autorisent. Orange Money annonce le transfert entre marchands gratuit pour l'émetteur mais **le destinataire est facturé**. Economie possible d'un retrait intermédiaire, non frais universel zéro.

**M5 — Compensation contractuelle bilatérale :** Eco doit 30 000 F à A, A doit 20 000 F à Eco pour des factures valides : convenir d'un règlement net de 10 000 F **si conditions de compensation satisfaites**. Pour A→B→C, la « chambre de compensation » devient multilatérale et requiert analyse du statut et des risques. Ne pas créer de jetons librement circulants représentant un net non payé.

**M6 — PSP / GIMAC / banque « EcoWallet hébergé » :** l'émetteur et le teneur de fonds sont habilités ; Eco développe parcours utilisateur, acquisition, segmentation et outils pro. Coûts négociés au niveau business. Étudier tarif réduit en contrepartie de volume mesurable, abonnement forfaitaire, financement par partenaire, interopérabilité, règlement bancaire et reversals.

## 4. Option ambitieuse ECOCFA / « stablecoin Eco »

**Mécanique théorique** : 1 ECOCFA vise 1 F CFA. Les jetons ne peuvent être émis contre des fonds réels qu'au moyen d'un dispositif de réserve, d'émission, de remboursement, de contrôle des réserves, d'audit et de gestion des clés; et **seulement si le cadre juridique l'autorise**. Ne pas confondre « 1:1 défini dans un smart contract » et « convertibilité effective en cash ». Un stablecoin algorithmiquement supposé maintenir sa parité **ne résout pas** la liquidité ni l'insolvabilité. Un token en XAF ne supprime ni les frais pour entrer/sortir du Mobile Money, ni les taxes, ni les frais d'une blockchain, ni la nécessité de payeurs qui l'acceptent.

**Risques majeurs** : interdiction/règles applicables aux établissements bancaires et de paiement, exigence d'agréments pour services d'actifs numériques, dépôt et surveillance des réserves, fraude, volatilité si réserve inadéquate, risque de gel de liquidité, recours client, protection données, change et fiscalité.

**Phasage prudent** :
- Étude zéro argent : registre jouet synthétique, 100 000 jetons fictifs, scénarios de faillite, double dépense, gel PSP, cotation liquidité, pertes de clés, reprise de backups. Interface étiquetée `SIMULATION`, non destinée au public.
- Obtenir avis écrit BEAC/COBAC/COSUMAF et spécialiste local du statut du produit, avant toute décision de construction d'un jeton réel.
- Si interdiction ou coûts réglementaires élevés : conserver la marque EcoPay et utiliser EcoWallet **en marque blanche par émetteur agréé**, sans blockchain ni monnaie propre. Le nom commercial peut exister sans créer une monnaie.
- Ne jamais déguiser un token convertible sous le nom de point de fidélité ni passer par comptes tiers/SIM agent pour contourner la conformité.

## 5. Une idée atypique prometteuse : « réseau de dépenses évitées »

Le but n'est plus « envoyer 1 million de FCFA gratuitement », mais **« éviter qu'Eco manipule inutilement 1 million de FCFA »**. Les paiements réels restent acheteur→vendeur, et la valeur pour Eco est un service commercial payant, vérifiable et de montant relativement faible. Deux avantages : protection du modèle contre l'après-vente cachée et réduction du volume encaissé par Eco. Ce modèle peut être enrichi de financement publicitaire, de packs fournisseurs, d'achats groupés contractualisés, de remises partenaires, de crédit marketing non monétaire et de paiement intégré facultatif.

## 6. Prototypes et tests chiffrés sans débiter un seul franc

**Simulation A :** 100 achats de 100 000 F = 10 000 000 F en volume d'affaires ; taux de collecte hypothétique 1 % = 100 000 F sur ce seul étage si Eco encaisse l'intégralité ; sans intégrer reversement, taxes et fraude.
**Simulation B :** 100 achats directs aux vendeurs, Eco vend 100 prestations de matching à 500 F = 50 000 F de chiffre d'affaires; 1 % hypothétique sur la collecte Eco = 500 F, autres frais exclus. Cela n'implique pas 50 000 F de profit : coûts de qualification des demandes, acquisition, litiges, fraude, impôt, trésorerie, clients insatisfaits peuvent rendre le modèle déficitaire.
**Simulation C :** panier 100 000 F, prix négocié à 80 000 F, devis versionné; paiement 80 000 F directement au vendeur, Eco reçoit sa rémunération contractuelle de service indépendante du panier. Aucune commission supplémentaire si le vendeur conclut à 70 000 F sans le déclarer.
**Simulation D :** 30 fournisseurs, 5 catégories, 3 réseaux, frais variables/fixes + taxe et règlements sur 30 jours ; mesurer coût total XAF, nombre de transactions, perte/erreur, délais, UX sénior, compatibilité réseau faible.

**Indicateurs :** marge unitaire après coût d'acquisition, coût PSP effectif, échec/ambiguïté paiement, part hors plateforme, taux de faux leads, litige et remboursement, taux de conversion, confiance fournisseur, succès Android 6 et iOS, charge cloud et pas de boucle de polling coûteuse.

## 7. Questions contractuelles à résoudre avant toute activation

- GIMAC : voie d'accès à l'interopérabilité pour un intégrateur comme Eco, certification, sponsor bancaire/PSP, comptes concernés et tarification réelle ?
- MTN : Collections 1 % négociable selon documentation; Disbursements annoncé gratuit **depuis compte préalimenté**, coût du financement, règlement bancaire, revenus d'apporteur d'affaires ?
- Orange : marchand→marchand gratuit émetteur / payant destinataire, OM ASSO non automatiquement autorisé pour une plateforme, remboursement banque « sans frais supplémentaire », tarifs effectifs ?
- Société partenaire PSP : split réglementé, versements multiples et sous-comptes, réserves, gel, litige, KYC/KYB, frais et taxes TTC ?
- Régulateurs/conseil : statut exact d'un coupon multimarque, jeton prépayé, portefeuille hébergé, transfert P2P, monnaie électronique, et actif numérique/crypto.

## 8. Recommandation de séquençage

- **P0 :** étude/documentation + expériences synthétiques de négociation, EcoPoints, EcoPass, tarifiseur EcoSwitch. Aucune donnée financière vraie.
- **P1 :** petit pilote vendeur / acheteur de services professionnels **dans un cadre contractuel et paiement direct vendeur**, autorisé séparément, sans toucher au cœur tontines.
- **P2 :** accords PSP/MTN/Orange/GIMAC, sandbox réelle et KYC. Option EcoWallet en marque blanche s'il existe partenaire et prix rentable.
- **P3 :** compensation B2B si utilité démontrée + avis juridique ; aucun « réseau monétaire parallèle » non agréé.
- **P4 :** EcoCFA seulement si un schéma de stablecoin approuvé est juridiquement possible et économiquement meilleur que l'e-money hébergée. Sinon abandonner cette branche sans remettre en cause P0–P3.

## 9. Gouvernance de non-régression

**Il est strictement interdit par cette étude de modifier :** code métier existant; comptes et soldes; Ledger/Outbox; `realMoneyEnabled=false`; marqueur HOLD; D1/R2/secrets; production; données des associations, membres, prêts et pots. Une idée de paiement ne justifie jamais des écrans de saisie cassés, une perte d'offline ou une dépense CI non consentie. Toute phase au-delà de l'étude exige autorisations pertinentes d'édition, de branche, de qualification et de déploiement. Aucun crypto-actif ne doit être mis à disposition d'utilisateurs réels sur la base de ce document.

## Sources publiques (à revérifier à l'étape contractuelle)

- BEAC — GIMACPAY et interopérabilité : https://www.beac.int/systemes-paiement/systeme-de-monetique-interbancaire/
- GIMAC : https://gimac-afr.com/
- BEAC — Règlement 04/18 CEMAC services de paiement : https://www.beac.int/supervision-bancaire/reglements-de-cobac/
- COBAC — Communiqué mai 2022 cryptoactifs (archive institutionnelle) : https://www.finances.gouv.cg/fr/communiqu%C3%A9-de-presse-de-la-cobac-relatif-%C3%A0-linterdiction-de-lutilisation-des-crypto-actifs-dans-la
- COSUMAF — Règlement général mai 2023 : https://cosumaf.org/nos-documents/reglement-general-de-la-cosumaf-du-23-mai-2023
- MTN Collections Cameroun : https://momoapi.mtn.com/Cameroon_Collection_productDetails
- MTN Disbursement Cameroun : https://momoapi.mtn.com/Cameroon_Disbursement_productDetails
- Orange — marchand à marchand : https://orangemoney.orange.cm/fr/paiements-entre-marchands.html
- Orange Business — paiement marchand : https://orangemoneybusiness.orange.cm/services/paiement-marchand

**Verdict :** le meilleur premier « système de paiement Eco » est un **système d'orchestration des paiements, remises et rémunérations vérifiables sans garde de fonds**. La pièce monétaire réelle, si un jour elle existe, doit être portée ou autorisée par les organismes habilités.