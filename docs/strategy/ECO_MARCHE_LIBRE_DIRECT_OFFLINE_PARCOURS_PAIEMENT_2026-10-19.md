# ECO-SYSTEM — ECO MARCHÉ LIBRE : PAIEMENT DIRECT ET OFFLINE

**Version : 1.0 (19 octobre 2026)**  
**Statut : cahier métier/technique prospectif, NON implémenté, NON qualifié, NON déployé.**
**Source d'autorité business :** mandat fondateur : acheter/vendre, offrir/demander des biens, services, travaux, négocier librement, éviter les frais et le contournement. Associations et tontines restent prioritaires.  
**Contexte :** [Stratégie anti-contournement et MoMo Cameroun](ECO_CAMEROUN_PAIEMENT_MOBILE_MONEY_ANTI_CONTOURNEMENT_2026-10-19.md), [EcoPay idées alternatives](ECO_PAY_ARCHITECTURES_ALTERNATIVES_WALLET_CLEARING_STABLECOIN_2026-10-19.md), issue #97.
**Limites :** pas de code produit, pas de modification d'AGENTS, gates, tests existants, D1/R2, secrets, production ou LIVE; `realMoneyEnabled=false` et HOLD inchangés. Toute future édition d'acquis requiert autorisation distincte.

## 0 — Le contrat utilisateur

**Eco fournit la découverte, la négociation, le contrat, la preuve et le suivi; l'argent va directement au vendeur.** Le client n'a pas besoin de transférer son argent vers Eco. Eco ne peut prétendre retenir automatiquement une commission sur un montant négocié hors plateforme. Revenus Eco : abonnements pros, réponses à demandes qualifiées, publicité, dossier de consultation, vérification/logistique/SAV réellement fournis; frais annoncés AVANT la mise en relation si possible. Un paiement marchand gratuit pour le payeur n'implique aucun frais de retrait pour le commerçant.

Proposer : `PAYER AU VENDEUR` (MTN/Orange/banque), `PAYER EN ESPÈCES`, `PAYER À LA LIVRAISON` (si accepté), `AUTRE MODALITÉ CONVENUE`. Aucun intermédiaire Eco obligatoire; payer un tiers ne devient jamais automatiquement preuve de vente pour Eco.

## 1 — Transaction métier de bout en bout

1. Vendeur propose annonce structurée : ID, bien/service, unité, quantité, état, zone, livraison, modes de paiement acceptés; compte bénéficiaire vérifié par l'acheteur avant paiement.
2. Acheteur recherche (index local si précédemment téléchargé), ouvre demande et propose prix/quantité; conversation possible online ou échange physique offline par QR.
3. Version du devis : `OfferRevision{revisionId, parentRevisionId, priceXAF, qty, shippingTerms, validUntil, proposedBy}`. Acceptation bilatérale explicite; si ancienne version différente chez un participant, **conflit à résoudre**, aucune acceptation fictive.
4. Produire `DealPassport{dealId, version, buyerRef, sellerRef, itemSummary, qty, totalXAF, currency:XAF, deliveryTerms, acceptedAt?, paymentMode, sellerPayeeRef, expiration, sellerAcceptance, buyerAcceptance}`. Format court QR + document exportable/texte pour appareil sans caméra.
5. Paiement réel exécuté PAR L'UTILISATEUR dans le canal MTN, Orange, banque ou espèces. Pour QR opérateur, afficher code opérateur exact, pas QR Eco « magique ». Numéro/canal destinataire et montant à contrôler sur écran opérateur.
6. Preuve reçue : `buyerReported` peut être enregistrée mais ne valide pas la réception; `sellerAcknowledged` est une attestation du vendeur pour espèces/transfert externe; `providerConfirmed` uniquement si la preuve serveur d'un PSP/intégrateur contractuel est disponible. Screenshots/SMS présentés par l'acheteur **ne suffisent pas**.
7. Livraison séparée : `DISPATCHED`, `RECEIVED`, `ISSUE_OPEN`, `CLOSED`. Ni commande ni preuve de paiement ne sont équivalentes à livraison. Avis/réputation seulement après preuve d'interaction et sans mettre la caisse de groupe en risque.

## 2 — Trois modes offline distincts

**MODE A : internet indisponible, réseau téléphonique accessible**
- Eco déjà installé avec shell/ressources cache : consulter fiche/devis local, saisir montant, générer commande, préparer référence et affichage du bénéficiaire.
- L'utilisateur quitte provisoirement Eco pour son appli opérateur ou USSD. Sur Orange Money Cameroun, paiement marchand par code/QR ou `#150*47#` officiellement documenté. **Ceci utilise le réseau opérateur**, pas une transaction de monnaie réellement offline.
- De retour dans Eco sans data, acheteur marque `J'AI TENTÉ DE PAYER`; vendeur vérifie sur SON compte une confirmation réelle et peut attester `J'AI REÇU`. En l'absence de confirmation : `À VÉRIFIER`.
- La synchronisation des preuves Ecο se fait plus tard. Aucun PIN MoMo/Orange enregistré.

**MODE B : aucun réseau, rencontre physique**
- Bon de commande local et QR de partage entre appareils ou papier. Chaque participant compare oralement vendeur, quantité, prix final et référence.
- Espèces possibles : vendeur compte l'argent puis valide `ESPÈCES REÇUES`; buyer peut contresigner; double attestation hors ligne. Sans espèces ni réseau : **aucun paiement MTN/Orange n'a lieu**; la commande demeure payable plus tard.
- Transfert appareil-à-appareil : QR statique ou séquence QR, fichier local via partage système, Bluetooth/Wi-Fi Direct seulement si appareils/services disponibles. La PWA web n'est pas garantie capable d'initier Bluetooth/Wi-Fi Direct sur toutes versions Android/iOS.
- La validation offline constitue la **reconnaissance volontaire des personnes**, et non une attestation PSP/banque, et les preuves demandent vérification anti-rejeu lors de la première synchronisation.

**MODE C : relation à distance, zéro réseau des deux côtés**
- Pas de négociation ni de paiement synchrones à distance. Préparer devis local; envoyer plus tard via réseau/service, ou document papier transporté manuellement. N'afficher ni « accepté par l'autre » ni « payé ». Si l'un a accès à réseau, l'autre pourra recevoir plus tard.

## 3 — États distincts, audités

**Commande** : `LOCAL_DRAFT → OFFERED → ACCEPTED_BY_BUYER → AGREED_BOTH → AWAITING_PAYMENT → CANCELLED/COMPLETED`.
**Tentative de paiement** : `NOT_STARTED → INSTRUCTED → BUYER_REPORTED → PENDING_SELLER_CHECK → SELLER_ACKNOWLEDGED or PSP_CONFIRMED → DISPUTED/REFUNDED`.
**Livraison** : `NOT_SHIPPED → HANDED_OVER → BUYER_RECEIVED → CLOSED` avec branche litige.
**Connectivité** : `LOCAL_ONLY / QUEUED / SYNCING / SYNCED / CONFLICT`, visible séparément du statut financier.
**Attention :** `BUYER_REPORTED` ne vaut **jamais** `PAID`; `SELLER_ACKNOWLEDGED` = reçu déclaré par vendeur, pas autorisation bancaire. Seul `PSP_CONFIRMED` atteste une opération du canal intégré. Les commandes hors plateforme peuvent porter un reçu vendeur volontaire sans fausse qualification serveur.

Règles UI adaptées aux seniors : gros boutons 48px ou plus, libellés longs explicites, FR prioritaire/EN, contraste, saisie montant par clavier et micro si local réellement disponible, possibilité de revenir exactement à la page/position/état; jamais confondre « Envoyer l'ordre », « Confirmer la réception », « Livraison effectuée ». Aucune confirmation financière automatique par micro.

## 4 — Contrat d'échange QR et identité

Deux QR à ne jamais confondre :
- **QR Eco Accord** : `eco:deal:v1:<payload-résumé-sans-secrets>` ; référence et version, quantité, montant, date, nom commercial, empreinte, proposition/acceptation; **ce QR ne débite personne**.
- **QR du prestataire** : généré par MTN/Orange selon format et autorisation du prestataire. Ne pas inventer un QR pseudo-opérateur.
- **QR Eco Reçu** : `eco:receipt:v1:<référence de commande, reçu déclaré, rôle, nonce, horodatage local, preuve de consentement>`; il n'est pas une garantie cryptographique d'encaissement.
- Versions/hachages de contenu et identifiants aléatoires empêchent collision accidentelle; signatures vérifiées si clés provisionnées via un onboarding sûr. Le hachage sans signature ne prouve pas qui a consenti; l'heure locale n'est pas une preuve de temps fiable.
- Aucun numéro de compte complet dans les exports publics; données confidentielles chiffrées/encadrées lorsque disponibles. Gérer le cas où un QR est photographié, copié ou rejoué.

## 5 — Moteur minimal offline, sans faire régresser la tontine

**Module en isolation fonctionnelle**, pas de création de second Ledger financier. Réutiliser les propriétaires existants `packages/market`, `packages/value-network`, Business Studio, dossiers de commande; définir des contrats d'intégration mais ne pas éditer les propriétaires sans autorisation bornée et caractérisation.

- Stockage local durable `IndexedDB`, objet commande/devis/receipts et outbox locale **séparée fonctionnellement**. Vérifier l'usage actuel de `packages/offline` et adapter, ne pas casser IndexedDB historique ni le service worker.
- Chaque commande = `dealId` client généré une seule fois, chaque opération = `eventId` unique; `idempotencyKey` stable lors de retries; `parentVersion` et `expectedVersion` pour empêcher l'écrasement silencieux.
- Journal d'évènements append-only; les deux appareils peuvent apporter des preuves, sans « last write wins » sur les montants, bénéficiaires, consentements ou statuts de paiement.
- File d'attente persistée **avant** d'afficher « accord enregistré localement », tentative sync uniquement sur événement réel (retour en ligne, focus, écran rouvert, action utilisateur et Background Sync si supporté); backoff plafonné, pas de polling D1 continu.
- On ne marque `SYNCED` qu'après ACK serveur sur même événement/version. Si aucun ACK, pas d'effacement de l'outbox, pas de double débit ou de nouvelle requête payante par hasard.
- Ancienne fiche d'offre modifiée par un vendeur offline : sur relecture distant, signaler conflit de stock/prix avant de confirmer; aucune réservation globale de stock offline garantie.
- Export papier/JSON/QR local des bons et reçu, procédure de récupération si appareil perdu; IndexedDB peut être effacé par utilisateur/système. Ne jamais présenter le navigateur comme coffre-fort bancaire.
- Groupes et tontines : `moneyGroup` et `moneyMarketplace` doivent rester séparés; aucun transfert de fonds groupes à marketplace, aucune déduction automatique d'une commission Eco.

## 6 — Pourquoi ce modèle protège la rémunération Eco

Le coût du paiement marchand **pour Eco sur le panier principal** est évité puisqu'Eco ne collecte jamais le prix, mais les frais que le vendeur paie à son opérateur subsistent. La vente peut se négocier sur Eco ou ailleurs; le tarif Eco repose sur un service réellement rendu et tarifé en amont (abonnement pro, lead vérifié, dépôt d'un dossier RFQ, mise en avant sponsorisée, accompagnement, SAV), pas un pourcentage non vérifiable d'une vente hors plateforme.

**Exemple illustratif :** 100 achats × 100 000 F = 10 M F de ventes vendeur; encaissement de 10 M par Eco à 1 % hypothétique = 100 000 F sur collecte seule, avant frais de reversement. Eco Direct : 10 M payés directement aux vendeurs, **zéro collecte Eco sur ces 10 M**, mais revenus Eco de services séparés (et leurs frais propres). Ce n'est pas une garantie « zéro frais » sur les transactions vendeur ni zéro frais d'exploitation.

**Orange Money** affiche achat marchand gratuit côté acheteur ; l'offre commerçants OM ASSO et la grille de retrait vendeur dépendent du contrat. Des paiements marchand→marchand évitent parfois de sortir en cash, mais frais potentiels pour le destinataire et périmètre même réseau. **MTN Collections** indique des frais autour de 1 %, négociables, lorsqu'un partenaire encaisse via Collections; ne pas assimiler ce modèle à tous transferts P2P.

## 7 — UX écran vendeur et acheteur

**ACHETEUR :**
- `Proposer mon prix` → `Voir le prix final accepté` → `Choisir payer vendeur` → montrer payee/nom exact/frais prévisibles → `J'ai effectué le paiement` → confirmation `En attente de vérification vendeur`.
- Hors réseau : `Préparé hors connexion`, `Payer en espèces au vendeur` ; si USSD possible, instructions sans PIN dans Eco; référence visible, copie montant et identifiant.

**VENDEUR :**
- `Accepter / Contre-proposer` → `Mon moyen de paiement` → `Vérifier mon compte` → `J'ai reçu les espèces` ou `J'ai constaté mon paiement` → `Remettre la marchandise` → `Litige ou remboursement`.
- Pour paiement externe, vendeur seul peut attester réception; capt. écran de l'acheteur = allégation, ne suffit pas. Le vendeur peut maintenir `NON CONFIRMÉ` si solde et historique ne concordent pas.

**ASSOCIATION :**
- achats au nom du groupe exclusivement via mandat/RI et approbations existants ; ne détourner ni contourner une double validation. Facture fournisseur indépendante du Ledger groupe jusqu'à rapprochement autorisé.

## 8 — Fraude, conflits et non-régression : scénarios obligatoires

1. QR copié/réutilisé → refuser événement déjà consommé, journal d'alerte.
2. Appareil A a devis v2 et B a v3 → refuser transaction auto sur vieux montant; redemander accord bilatéral.
3. Acheteur montre capture MoMo truquée → statut `BUYER_REPORTED`, vendeur vérifie sur son propre canal.
4. Vendeur modifie payee après accord → accord caduc, nouvelle acceptation visible.
5. Connexion coupée après requête serveur → réessayer **même** idempotencyKey, pas débiter deux fois.
6. Paiement réellement réussi, événement Eco perdu → rattrapage de statut seulement avec preuve PSP ou attestation vendeur, jamais « FAILED donc payer encore » automatique.
7. Vendeur confirme espèces offline, ouvre autre appareil → déduplication, suivi de provenance.
8. Livraison partielle, retour, annulation, acompte/solde → évènements séparés, montants dû/payé/livré non confondus.
9. Téléphone Android 6/PWA ancienne, Opera/Chrome/Firefox, iOS Safari, absence camera, absence localStorage persistant → mode texte/papier et warning de sauvegarde.
10. 2G, refus de QR, Android service worker arrêté, Safari Background Sync absent → aucune perte de commande locale, déclenchement manuel.
11. Perte téléphone et cache, storage quota, maj PWA → protection par export/récupération et simulation de perte; aucune garantie sans copie distante/locale de secours.
12. Hubs, sociétés et groupes distincts → permission stricte multi-tenant et absence de leak de données/membres.
13. Services commerciaux Eco annoncés comme payants avant engagement; faux leads et remboursements de crédits contractuels.

**Tests d'acceptation :** 20 commandes synthétiques avec négociations, 2 appareils, 3 méthodes de paiement, 6 coupures, retour réseau, duplicate order, désaccord, stockage restitué, absence de polling, aucun compte réel débité. Test réel client/vendeur volontaire uniquement après qualification, contrats, consentement et autorisation distincte.

## 9 — Déploiement par petits lots, sans forfait global

- **D0 (ce cahier)** : document et protocole uniquement. Aucun coût infra supplémentaire et pas de déploiement.
- **D1 prototype isolé** : annonces, devis, bon offline, reçu d'espèces déclaratif, QR Eco, export. Zéro API MoMo, zéro monnaie.
- **D2 transaction directe pratique** : tutoriels opérateur et deeplink seulement s'ils existent/autorisation, vérification manuelle vendeur, notifications Eco différées, résilience 2G.
- **D3 pilote volontaire** : petit groupe de vendeurs/acheteurs, métriques coût, taux de litige, transaction et fraude. Ne pas facturer un service non fourni.
- **D4** : APIs partenaires ou reçus signés PSP et confirmations automatisées si accord, sandbox et épreuves. Aucun portage de fonds par Eco.
- **D5** : options EcoClearing/EcoPass distinctes, sans casser Eco Direct.

### Références publiques vérifiées le 19 octobre 2026
- Orange Money Cameroun, paiement marchand QR/code/USSD : https://orangemoney.orange.cm/fr/om-paiement/flash-pay.html
- Orange Money Cameroun, grille tarifaire et marchand : https://orangemoney.orange.cm/fr/tarification-orange-money.html
- Orange, paiement entre marchands : https://orangemoney.orange.cm/fr/paiements-entre-marchands.html
- MTN MoMo API, Collection/status : https://momoapi.mtn.com/content/html_widgets/90azl.html
- MTN MoMo Collections Cameroun : https://momoapi.mtn.com/Cameroon_Collection_productDetails
- web.dev : IndexedDB PWA https://web.dev/learn/pwa/offline-data
- MDN : Background Sync limité https://developer.mozilla.org/en-US/docs/Web/API/Background_Synchronization_API

**RÈGLE D'OR :** « Le marchand reçoit l'argent, Eco reçoit la preuve — jamais l'inverse. » Une preuve locale atteste un accord ou une déclaration; la réception monétaire n'est confirmée qu'au niveau capable de la constater. **Pas de preuve, pas de statut définitivement payé.**
