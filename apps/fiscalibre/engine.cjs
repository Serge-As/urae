/* Fiscalibre 2.0 - simulations & pédagogie comptable SYSCOHADA / Fiscalité Cameroun 2026. Whole XAF, rational rates, no network. */
(function(root){
'use strict';
const MAX=1000000000000;
function money(x,name='Montant'){ if(x===''||x==null)throw Error(name+' manquant'); const n=Number(x);if(!Number.isSafeInteger(n)||Math.abs(n)>MAX)throw Error(name+' : entier XAF requis (maximum 1 000 milliards).');return n; }
function positive(x,name){const n=money(x,name);if(n<0)throw Error((name||'Montant')+' négatif');return n;}
function rate(x,bp){const a=BigInt(money(x)),b=BigInt(money(bp));const v=a*b;return Number(v<0n?-((-v+5000n)/10000n):(v+5000n)/10000n);}
const IGS=[[500000,20000],[1000000,30000],[1500000,40000],[2000000,50000],[2500000,60000],[5000000,150000],[10000000,300000],[20000000,500000],[30000000,1000000],[50000000,2000000]];

/* === RÉFÉRENTIEL PÉDAGOGIQUE COMPLET SYSCOHADA RÉVISÉ === */
const SYSCOHADA_ACCOUNTS={
  '103':{code:'103',label:'Capital personnel (Entreprise individuelle / Établissement)',classe:1,type:'equity',refBilan:'CA',refLabel:'CA · Capital',normalSide:'Crédit (Ressource)',plain:'Fonds propres apportés par le commerçant ou l’entrepreneur individuel (ETS).',why:'On utilise 103 dans un Établissement Individuel (ETS) et 101 dans une société (SA, SARL, SAS, COOP-CA).'},
 '111':{code:'111',label:'Réserve légale',classe:1,type:'equity',refBilan:'CF',refLabel:'CF · Réserves indisponibles',normalSide:'Crédit (Ressource)',plain:'Part du bénéfice annuel (généralement 10 %) obligatoirement mise de côté par la loi pour solidifier la société.',why:'Renforce la garantie des créanciers au Passif (ligne CE), distincte du report à nouveau libre (121).'},
 '139':{code:'139',label:'Résultat net : Perte',classe:1,type:'equity',refBilan:'CJ',refLabel:'CJ · Résultat net de l’exercice',normalSide:'Débit (Diminution des capitaux propres)',plain:'Perte nette de l’exercice lorsque le total des charges dépasse le total des produits.',why:'Inscrit sur la ligne CJ du Passif avec le signe moins (−), venant réduire les capitaux propres.'},
 '191':{code:'191',label:'Provisions pour litiges (à plus d’un an)',classe:1,type:'liability',refBilan:'DC',refLabel:'DC · Provisions pour risques et charges (Ressources stables DD)',normalSide:'Crédit (Passif durable)',plain:'Provision pour un procès ou litige majeur dont l’issue est attendue à plus d’un an.',why:'À plus d’un an, on utilise 191 (par le débit de 6911). À moins d’un an, on utilise 4991 (par le débit de 6591) !'},
 '211':{code:'211',label:'Frais de développement',classe:2,type:'asset',refBilan:'AE',refLabel:'AE (sous AD) · Frais de développement et de prospection',normalSide:'Débit (Emploi durable)',plain:'Investissements de recherche appliquée et développement de nouveaux procédés ou formules.',why:'En SYSCOHADA révisé, 211 loge exclusivement les frais de développement (ligne AE sous AD). Attention : les terrains ne vont jamais en 211 mais en 22 (ligne AJ) !'},
 '274':{code:'274',label:'Titres immobilisés (Bons du Trésor, obligations à long terme)',classe:2,type:'asset',refBilan:'AS',refLabel:'AS (sous AQ) · Autres immobilisations financières',normalSide:'Débit (Actif immobilisé)',plain:'Titres financiers conservés durablement par l’entreprise (obligations, titres de créances).',why:'Attention à la nomenclature SYSCOHADA : 274 loge les titres immobilisés, tandis que les dépôts et cautionnements versés (caution de loyer, ENEO, Camwater) vont en 275 (ligne AS sous AQ) !'},
 '281':{code:'281',label:'Amortissements des immobilisations incorporelles (logiciels)',classe:2,type:'contra_asset',refBilan:'AD',refLabel:'AD · Immobilisations incorporelles (Amort.)',normalSide:'Crédit (Correcteur d’actif)',plain:'Usure annuelle cumulée des logiciels et licences immobilisés (213).',why:'Le 8 en 2e position (281) indique l’amortissement du compte 21 (par le débit de 6812).'},
 '291':{code:'291',label:'Dépréciations des immobilisations',classe:2,type:'contra_asset',refBilan:'AD',refLabel:'AD-AQ · Immobilisations (Dépréc.)',normalSide:'Crédit (Correcteur d’actif)',plain:'Perte de valeur exceptionnelle d’un terrain ou d’un équipement non liée à l’usure normale.',why:'Le 9 en 2e position (29) signale une dépréciation réversible d’immobilisation, distincte de l’amortissement régulier (28).'},
 '311':{code:'311',label:'Marchandises A (Biens achetés pour revente en l’état — Négoce)',classe:3,type:'asset',refBilan:'BB',refLabel:'BB · Stocks et encours',normalSide:'Débit (Actif circulant)',plain:'Stock physique de marchandises destinées à être revendues telles quelles sans transformation.',why:'DISTINCTION SYSCOHADA : 311 est un sous-compte de 31 (Marchandises, négoce). Pour une chocolaterie industrielle qui transforme les fèves, le stock de fèves brutes relève de 32 / 321 (Matières premières) !'},
 '312':{code:'312',label:'Marchandises B (Attention : les produits semi-finis vont en 371 ou 34 !)',classe:3,type:'asset',refBilan:'BB',refLabel:'BB · Stocks et encours',normalSide:'Débit (Actif circulant)',plain:'Deuxième catégorie de marchandises en négoce (à ne pas confondre avec les produits semi-finis industriels).',why:'ALERTE RIGUEUR SYSCOHADA : Dans le plan officiel SYSCOHADA révisé, 312 signifie « Marchandises B » ! Les produits semi-finis (masse de cacao, beurre) relèvent du compte 371 (Produits intermédiaires) ou 34 (Produits en cours).'},
 '313':{code:'313',label:'Subdivision Marchandises (Attention : les produits finis industriels vont en 36 / 361 !)',classe:3,type:'asset',refBilan:'BB',refLabel:'BB · Stocks et encours',normalSide:'Débit (Actif circulant)',plain:'Subdivision de stock de négoce (en industrie, utiliser 36 / 361 Produits finis).',why:'ALERTE RIGUEUR SYSCOHADA : En industrie de transformation, les chocolats et tablettes finis relèvent obligatoirement du compte 36 (ou 361 Produits finis, dépréciés via 396) et non de la racine 31 (Marchandises).'},
 '34':{code:'34',label:'Produits en cours',classe:3,type:'asset',refBilan:'BB',refLabel:'BB · Stocks et encours',normalSide:'Débit (Actif circulant)',plain:'Pâte de chocolat en cours de conchage ou de tempérage dans les cuves au moment de la clôture.',why:'Valorise les lots non encore terminés sur la chaîne de production (contrepartie 734 Variation des produits en cours).'},
 '408':{code:'408',label:'Fournisseurs, factures non parvenues (FNP)',classe:4,type:'liability',refBilan:'DJ',refLabel:'DJ · Fournisseurs d’exploitation',normalSide:'Crédit (Dette d’exploitation)',plain:'Livraison ou prestation reçue en fin d’année (ex. consommation ENEO de décembre) dont la facture papier n’est pas encore arrivée.',why:'Principe de séparation des exercices (cut-off) : on débite la charge (60/62) et on crédite 408 à la clôture.'},
 '421':{code:'421',label:'Personnel, avances et acomptes',classe:4,type:'asset',refBilan:'BJ',refLabel:'BJ · Autres créances',normalSide:'Débit (Créance sur salarié)',plain:'Avance sur salaire ou quinzaine versée à un employé en milieu de mois.',why:'Débité lors du versement de l’avance (par le crédit de 521/571), puis retenu sur le bulletin de paie en fin de mois (crédit 421 par débit 422).'},
 '442':{code:'442',label:'État, autres impôts et taxes (Patente, TDL, Taxe à l’essieu)',classe:4,type:'liability',refBilan:'DK',refLabel:'DK · Dettes fiscales et sociales',normalSide:'Crédit (Dette fiscale)',plain:'Dettes d’impôts locaux et taxes diverses envers l’État et les communes.',why:'Contrepartie au passif (ligne DK) des impôts et taxes d’exploitation constatés en 641.'},
 '4431':{code:'4431',label:'État, TVA facturée sur ventes',classe:4,type:'liability',refBilan:'DK',refLabel:'DK · Dettes fiscales et sociales',normalSide:'Crédit (Dette fiscale)',plain:'TVA à 19,25 % collectée sur les ventes locales de marchandises ou de chocolats finis.',why:'Subdivision précise du compte 443 pour les ventes de biens sur le marché national (ligne DK).'},
 '4451':{code:'4451',label:'État, TVA récupérable sur immobilisations (et achats e-Billing)',classe:4,type:'asset',refBilan:'BJ',refLabel:'BJ · Autres créances',normalSide:'Débit (Créance fiscale)',plain:'TVA déductible à 19,25 % figurant sur une facture conforme (NIU / e-Billing) réglée par voie traçable.',why:'4451/4452 loge la TVA récupérable (ligne BJ). Tout rejet pour facture non conforme ou paiement espèces >= 100 000 XAF fait perdre ce droit.'},
 '471':{code:'471',label:'Comptes d’attente (Opérations à régulariser)',classe:4,type:'asset',refBilan:'BJ',refLabel:'BJ / DM · Compte transitoire à solder',normalSide:'À solder obligatoirement avant le Bilan',plain:'Somme reçue ou payée dont l’origine exacte est temporairement inconnue.',why:'ALERTE AUDIT CAC : Un compte 471 ne doit jamais rester au Bilan de fin d’année ! Il doit être identifié et reclassé avant la DSF.'},
 '481':{code:'481',label:'Fournisseurs d’investissements',classe:4,type:'liability',refBilan:'DH',refLabel:'DH · Dettes sur acquisitions d’immobilisations',normalSide:'Crédit (Dette sur immobilisation)',plain:'Somme due au vendeur d’une machine industrielle (torréfacteur, camion) achetée à crédit.',why:'On utilise 481 (et non 4011) lorsque la dette porte sur un bien durable de Classe 2 !'},
 '4991':{code:'4991',label:'Provisions pour risques à court terme sur opérations d’exploitation',classe:4,type:'liability',refBilan:'DN',refLabel:'DN · Provisions pour risques à court terme (sous Passif circulant DP)',normalSide:'Crédit (Passif circulant)',plain:'Provision pour un risque d’exploitation probable à moins d’un an (contrepartie du débit 6591).',why:'Inscrit au Passif circulant (ligne DP), contrairement aux comptes 39 et 491 qui restent à l’Actif en soustraction.'},
 '552':{code:'552',label:'Monnaie électronique - Téléphone portable (Mobile Money : OM / MoMo)',classe:5,type:'asset',refBilan:'BS',refLabel:'BS · Banques, chèques postaux, caisse et assimilés',normalSide:'Débit (Trésorerie-Actif)',plain:'Fonds disponibles sur les comptes marchands Orange Money ou MTN Mobile Money de l’entreprise.',why:'Le SYSCOHADA révisé a créé le compte 55 (et 552) spécifiquement pour tracer la monnaie électronique séparément de la banque (521) et des espèces (571) !'},
 '561':{code:'561',label:'Crédits de trésorerie et découverts bancaires',classe:5,type:'liability',refBilan:'DR',refLabel:'DR · Banques, crédits de trésorerie et découverts',normalSide:'Crédit (Trésorerie-Passif)',plain:'Découvert bancaire ou crédit de campagne à très court terme accordé par la banque.',why:'Figure en Trésorerie-Passif (ligne DR) et non en emprunt à long terme (162, ligne DA).'},
 '6012':{code:'6012',label:'Achats de marchandises hors région (Import-Export) ou négoce général',classe:6,type:'expense',refBilan:'RA',refLabel:'RA · Achats de marchandises',normalSide:'Débit (Charge d’exploitation)',plain:'Achats de marchandises générales par un grossiste ou importateur (valeur CAF + droits de douane).',why:'Utilisé par le secteur Commerce de Gros & Import-Export (ligne RA). Attention au précompte sur achats/importations (447/441).'},
 '6015':{code:'6015',label:'Frais sur achats de marchandises (fret, douane, commissions sur achats)',classe:6,type:'expense',refBilan:'RA',refLabel:'RA · Achats de marchandises',normalSide:'Débit (Charge d’exploitation)',plain:'Frais accessoires (transport sur achats, commissions, assurances, transit) rattachés aux achats de marchandises.',why:'ALERTE SYSCOHADA RÉVISÉ : 6015 est exclusivement dédié aux « Frais sur achats de marchandises » (et 6025 aux frais sur achats de matières premières). Les carburants stockés vont en 6042 et les carburants non stockables pris à la pompe en 6053 (ligne RE) !'},
 '6054':{code:'6054',label:'Fournitures d’entretien non stockables (et 6053 Autres énergies / Carburants)',classe:6,type:'expense',refBilan:'RE',refLabel:'RE · Autres achats',normalSide:'Débit (Charge d’exploitation)',plain:'Fournitures d’entretien non stockables (6054) et carburants non stockables pris à la pompe (6053).',why:'En SYSCOHADA révisé : 6051 = Eau, 6052 = Électricité, 6053 = Autres énergies (carburants non stockables), 6054 = Fournitures d’entretien non stockables. Règle fiscale CGI art. 144 : la TVA sur les carburants routiers est NON déductible (comptabilisation TTC en charge, ligne RE) !'},
 '613':{code:'613',label:'Transports pour le compte de tiers',classe:6,type:'expense',refBilan:'RG',refLabel:'RG · Transports',normalSide:'Débit (Charge d’exploitation)',plain:'Frais de transport engagés par l’entreprise pour le compte de ses clients ou de tiers.',why:'En SYSCOHADA révisé, toute la classe 61 relève exclusivement des Transports (ligne RG). Ne jamais confondre 613 avec la location d’engins BTP sans chauffeur qui relève du compte 6223 (Locations de matériels et outillages, ligne RH) !'},
 '615':{code:'615',label:'[Attention PCG Français] En SYSCOHADA révisé, utiliser 624 / 6242 pour l’entretien et les réparations !',classe:6,type:'expense',refBilan:'RH',refLabel:'RH · Services extérieurs (via 6242)',normalSide:'Débit (Utiliser 6242 en SYSCOHADA)',plain:'Piège classique : le numéro 615 vient du PCG français ! En SYSCOHADA révisé, la classe 61 est réservée aux Transports et l’entretien/réparation va en 624 (6241 immobilier, 6242 mobilier/camions).',why:'ALERTE RIGUEUR SYSCOHADA : Le compte 615 n’existe pas dans le plan SYSCOHADA révisé. Pour la réparation d’un camion ou d’une machine, utilisez obligatoirement le compte 6242 (Entretien et réparations des biens mobiliers, ligne RH) !'},
 '6221':{code:'6221',label:'Locations de terrains et bâtiments (Baux commerciaux & bureaux)',classe:6,type:'expense',refBilan:'RH',refLabel:'RH · Services extérieurs',normalSide:'Débit (Charge d’exploitation)',plain:'Loyer des bureaux (ex. à Bastos Yaoundé), de la boutique ou du hangar industriel.',why:'Subdivision immobilière du compte 622. Déclenche la retenue à la source sur loyers de 15 % (crédit 447) lorsque le bailleur n’en est pas dispensé.'},
 '6224':{code:'6224',label:'Malis sur emballages (Attention : pour les honoraires et conseils IT, utiliser 6324 / 632 !)',classe:6,type:'expense',refBilan:'RH',refLabel:'RH · Services extérieurs',normalSide:'Débit (Charge d’exploitation)',plain:'En SYSCOHADA officiel, 6224 loge les malis sur emballages (sous 622 Locations), tandis que les honoraires et conseils IT vont en 6324 / 632.',why:'ALERTE RIGUEUR SYSCOHADA : Ne confondez pas 6224 (Malis sur emballages) avec 6324 (Honoraires des professions réglementées et conseils) ! Lorsqu’on paie un consultant étranger (6324), on retient la TSR de 15 % au crédit du compte 447.'},
 '6241':{code:'6241',label:'Entretien et réparations des biens immobiliers',classe:6,type:'expense',refBilan:'RH',refLabel:'RH · Services extérieurs',normalSide:'Débit (Charge d’exploitation)',plain:'Travaux d’entretien et de réparation des bâtiments, toitures, ateliers et magasins de stockage.',why:'Subdivision de 624 dédiée aux biens immobiliers (ligne RH). Pour les machines et véhicules, on utilise 6242 (biens mobiliers) et pour la maintenance 6243. Ne jamais confondre 624 avec le transport (classe 61, ligne RG) !'},
 '6581':{code:'6581',label:'Pénalités et amendes fiscales, douanières ou pénales (ou 647 / 831)',classe:6,type:'expense',refBilan:'RJ',refLabel:'RJ · Autres charges',normalSide:'Débit (Charge non déductible fiscalement)',plain:'Amende payée lors d’un contrôle routier (ex. à Edéa), pénalité de retard DGI ou CNPS.',why:'PIÈGE RECRUTEUR ABSOLU : L’amende est bien une dépense réelle enregistrée en comptabilité (débit 6581/647), MAIS le CGI camerounais interdit formellement de la déduire du bénéfice imposable ! Il faut obligatoirement la RÉINTÉGRER dans le Tableau 22 de la DSF pour le calcul de l’IS.'},
 '6611':{code:'6611',label:'Appointements et salaires du personnel permanent',classe:6,type:'expense',refBilan:'RK',refLabel:'RK · Charges de personnel',normalSide:'Débit (Charge d’exploitation)',plain:'Salaires de base fixes et primes taxables des ouvriers et cadres permanents de l’entreprise.',why:'Subdivision principale du compte 661 servant d’assiette aux cotisations CNPS (4,2 % salarié + 11,2 % à 16,2 % employeur) et à l’IRPP.'},
 '6615':{code:'6615',label:'Indemnités de maladie versées aux travailleurs (et 6634 Indemnités de transport / 668 Panier)',classe:6,type:'expense',refBilan:'RK',refLabel:'RK · Charges de personnel',normalSide:'Débit (Charge d’exploitation)',plain:'Indemnités versées au personnel (6615 maladie ; 6634 transport ; 668 œuvres sociales et panier).',why:'En SYSCOHADA révisé : 6611 = Appointements et salaires, 6612 = Primes et gratifications, 6615 = Indemnités de maladie, 663 = Indemnités forfaitaires (6634 transport), 668 = Autres charges sociales. Permet de séparer le brut cotisable (6611/6612) des remboursements de frais professionnels justifiés.'},
 '7011':{code:'7011',label:'Ventes de marchandises dans la région (Marché local Cameroun / CEMAC)',classe:7,type:'income',refBilan:'TA',refLabel:'TA · Ventes de marchandises',normalSide:'Crédit (Produit d’exploitation)',plain:'Ventes domestiques hors taxes soumises à la TVA locale de 19,25 % (compte 4431).',why:'Subdivision de 701 (ou 7021 pour les produits finis) dédiée au chiffre d’affaires local taxable.'},
 '7012':{code:'7012',label:'Ventes de marchandises hors région (Exportation CEMAC / ZLECAf / International)',classe:7,type:'income',refBilan:'TA',refLabel:'TA / TB · Ventes à l’exportation',normalSide:'Crédit (Produit d’exploitation)',plain:'Chiffre d’affaires réalisé à l’exportation (Gabon, Nigeria, Europe) facturé au Taux Zéro (0 %) de TVA.',why:'Isoler les ventes export (7012 / 7022) est indispensable pour justifier le prorata et les demandes de remboursement de crédits de TVA auprès de la DGI (art. 149 CGI).'},
 '7021':{code:'7021',label:'Ventes de produits finis dans la région (Marché local)',classe:7,type:'income',refBilan:'TB',refLabel:'TB · Ventes de produits fabriqués',normalSide:'Crédit (Produit d’exploitation)',plain:'Ventes sur le marché camerounais des chocolats et produits fabriqués par l’usine.',why:'Subdivision industrielle locale du compte 702 (soumise à TVA 4431 et, pour les chocolats 1806, aux accises 446).'},
 '7022':{code:'7022',label:'Ventes de produits finis hors région (Exportation)',classe:7,type:'income',refBilan:'TB',refLabel:'TB · Ventes de produits fabriqués',normalSide:'Crédit (Produit d’exploitation)',plain:'Exportations des chocolats, beurres et poudres fabriqués par l’usine (TVA Taux 0 %).',why:'Subdivision industrielle export du compte 702 (ligne TB).'},
 '771':{code:'771',label:'Intérêts de prêts et produits financiers',classe:7,type:'income',refBilan:'TK',refLabel:'TK · Revenus financiers et assimilés',normalSide:'Crédit (Produit financier)',plain:'Intérêts reçus sur les placements bancaires ou dépôts à terme (DAT).',why:'Figure dans le résultat financier sur la ligne TK (Revenus financiers et assimilés) face aux frais financiers (671, ligne RM).'},
 '781':{code:'781',label:'Transferts de charges d’exploitation',classe:7,type:'income',refBilan:'TI',refLabel:'TI · Transferts de charges d’exploitation',normalSide:'Crédit (Produit d’exploitation)',plain:'Remboursement d’assurance suite à un sinistre ou refacturation exacte d’une dépense.',why:'Permet d’annuler l’effet d’une charge de classe 6 sans fausser le chiffre d’affaires (70).'},
 '81':{code:'81',label:'Valeurs comptables des cessions d’immobilisations',classe:8,type:'expense',refBilan:'RO',refLabel:'RO · Valeurs comptables des cessions d’immobilisations',normalSide:'Débit (Charge HAO)',plain:'Valeur nette restant à amortir d’une ancienne machine ou d’un camion au moment où l’entreprise le revend.',why:'Chiffre impair en classe 8 (81) = Charge face au produit de cession (82, chiffre pair).'},
 '82':{code:'82',label:'Produits des cessions d’immobilisations',classe:8,type:'income',refBilan:'TN',refLabel:'TN · Produits des cessions d’immobilisations',normalSide:'Crédit (Produit HAO)',plain:'Prix de vente encaissé lorsque l’entreprise revend une ancienne machine ou un vieux véhicule.',why:'La différence (82 − 81) donne la plus-value ou moins-value de cession.'},
 '83':{code:'83',label:'Charges Hors Activités Ordinaires (HAO)',classe:8,type:'expense',refBilan:'RP',refLabel:'RP · Charges HAO',normalSide:'Débit (Charge HAO)',plain:'Pertes liées à un événement exceptionnel et imprévisible (incendie, inondation majeure, restructuration).',why:'Réservé aux événements extraordinaires non récurrents (les pertes courantes sur stocks vont en 6593, pas en 83 !).'},
 '84':{code:'84',label:'Produits Hors Activités Ordinaires (HAO)',classe:8,type:'income',refBilan:'TO',refLabel:'TO · Autres Produits HAO',normalSide:'Crédit (Produit HAO)',plain:'Recettes exceptionnelles non liées à l’activité courante (dons exceptionnels, indemnités d’expropriation).',why:'Miroir pair (84) des charges HAO (83).'},
 '101':{code:'101',label:'Capital social',classe:1,type:'equity',refBilan:'CA',refLabel:'CA · Capital',normalSide:'Crédit (Ressource)',plain:'L’argent ou les biens apportés au départ par les associés ou actionnaires pour créer l’entreprise.',why:'On utilise 101 (Capital social) pour les sociétés (SA, SARL, SAS, COOP-CA) et non 103 (Capital personnel, réservé aux entreprises individuelles) ni 162 (Emprunts bancaires qui doivent être remboursés).'},
 '121':{code:'121',label:'Report à nouveau créditeur',classe:1,type:'equity',refBilan:'CH',refLabel:'CH · Report à nouveau (+ ou -)',normalSide:'Crédit (Ressource)',plain:'Les bénéfices des années précédentes gardés en réserve sans affectation précise.',why:'On utilise 121 quand les exercices passés ont laissé un bénéfice non distribué, et 129 (Report à nouveau débiteur) s’il s’agit de pertes accumulées antérieures.'},
 '129':{code:'129',label:'Report à nouveau débiteur',classe:1,type:'equity',refBilan:'CH',refLabel:'CH · Report à nouveau (+ ou -)',normalSide:'Débit (Diminution des capitaux propres)',plain:'Les pertes des années passées que l’entreprise doit éponger avec ses futurs bénéfices.',why:'Inscrit au passif en soustraction (ligne CF) car il réduit la valeur nette des capitaux propres sans être une dette envers un tiers.'},
 '131':{code:'131',label:'Résultat net : Bénéfice',classe:1,type:'equity',refBilan:'CJ',refLabel:'CJ · Résultat net de l’exercice',normalSide:'Crédit (Ressource)',plain:'Le gain net final de l’année (Total des Produits moins Total des Charges).',why:'Compte de synthèse de fin d’exercice (131 pour un bénéfice, 139 pour une perte). Tant que l’exercice est ouvert, le résultat est calculé automatiquement depuis les classes 6, 7 et 8.'},
 '162':{code:'162',label:'Emprunts et dettes auprès des établissements de crédit',classe:1,type:'liability',refBilan:'DA',refLabel:'DA · Emprunts et dettes financières diverses',normalSide:'Crédit (Ressource durable)',plain:'Les crédits bancaires à moyen ou long terme (ex. prêt pour acheter le torréfacteur ou la concheuse).',why:'On choisit 162 (dettes financières durables, classe 1) et non 4011 (dettes fournisseurs à court terme, classe 4) ni 561 (découverts bancaires de trésorerie immédiate, classe 5).'},
 '213':{code:'213',label:'Logiciels et sites internet',classe:2,type:'asset',refBilan:'AF',refLabel:'AF (sous AD) · Brevets, licences, logiciels et droits similaires',normalSide:'Débit (Emploi durable)',plain:'Les logiciels achetés ou développés durablement pour gérer l’usine ou la comptabilité.',why:'Compte 213 (immobilisation incorporelle amortissable sur plusieurs années) et non 626/632 si le logiciel sert sur plusieurs exercices.'},
 '222':{code:'222',label:'Terrains nus (et 223 Terrains bâtis)',classe:2,type:'asset',refBilan:'AJ',refLabel:'AJ (sous AI) · Terrains',normalSide:'Débit (Emploi durable)',plain:'Le terrain nu (222) ou bâti (223) appartenant à l’entreprise sur lequel l’usine ou l’entrepôt est construit.',why:'En SYSCOHADA révisé, le compte 22 (222 Terrains nus, 223 Terrains bâtis) figure sur la ligne AJ (sous la rubrique AI Immobilisations corporelles), séparé du bâtiment construit dessus (231, ligne AK).'},
 '231':{code:'231',label:'Bâtiments industriels, agricoles, administratifs et commerciaux',classe:2,type:'asset',refBilan:'AK',refLabel:'AK (sous AI) · Bâtiments',normalSide:'Débit (Emploi durable)',plain:'Les murs, hangars de stockage et ateliers de fabrication appartenant à l’entreprise.',why:'Utilisé uniquement si l’entreprise est propriétaire des murs. Si elle est locataire, le loyer mensuel va en charge (compte 6222) et non en classe 2.'},
 '241':{code:'241',label:'Matériel et outillage industriel et commercial',classe:2,type:'asset',refBilan:'AM',refLabel:'AM (sous AI) · Matériel, mobilier et actifs biologiques',normalSide:'Débit (Emploi durable)',plain:'Les grosses machines de production (torréfacteurs, broyeurs, concheuses, tempéreuses, moules industriels).',why:'On utilise 241 car ce sont des équipements qui servent durablement (> 1 an) à fabriquer les produits, contrairement aux petits outils ou pièces consommées dans l’année (6056).'},
 '244':{code:'244',label:'Matériel et mobilier de bureau',classe:2,type:'asset',refBilan:'AM',refLabel:'AM (sous AI) · Matériel, mobilier et actifs biologiques',normalSide:'Débit (Emploi durable)',plain:'Ordinateurs, imprimantes, tables, armoires et chaises des bureaux.',why:'Subdivision 244 pour l’équipement administratif et informatique, distincte de 241 (machines d’usine) et de 245 (véhicules).'},
 '245':{code:'245',label:'Matériel de transport',classe:2,type:'asset',refBilan:'AN',refLabel:'AN (sous AI) · Matériel de transport',normalSide:'Débit (Emploi durable)',plain:'Les camions de collecte en brousse, fourgonnettes de livraison et véhicules de société.',why:'Isolé sur la ligne AN du bilan SYSCOHADA révisé (compte 245, amorti via 2845) car la fiscalité et les règles d’amortissement/TVA des véhicules sont spécifiques.'},
 '275':{code:'275',label:'Dépôts et cautionnements versés (Cautions loyers 2751, ENEO 2752, Eau 2753)',classe:2,type:'asset',refBilan:'AS',refLabel:'AS (sous AQ) · Autres immobilisations financières',normalSide:'Débit (Emploi durable)',plain:'Les cautions bloquées à long terme (garantie de loyer d’entrepôt, caution compteur ENEO ou Camwater).',why:'Ce n’est pas une charge perdue (classe 6) : c’est de l’argent qui appartient toujours à l’entreprise mais qui reste immobilisé chez le bailleur ou ENEO jusqu’à la fin du contrat.'},
 '283':{code:'283',label:'Amortissements des bâtiments',classe:2,type:'contra_asset',refBilan:'AK',refLabel:'AK · Bâtiments (colonne Amort./Dépréc.)',normalSide:'Crédit (Correcteur d’actif)',plain:'Cumul de l’usure annuelle des bâtiments depuis leur mise en service.',why:'Un compte commençant par 28 (un 8 en 2e position) est toujours l’amortissement d’une immobilisation de classe 2. Il vient en colonne soustractive de la ligne AK du bilan.'},
 '284':{code:'284',label:'Amortissements du matériel',classe:2,type:'contra_asset',refBilan:'AM',refLabel:'AM · Matériel, mobilier et actifs biologiques (colonne Amort./Dépréc.)',normalSide:'Crédit (Correcteur d’actif)',plain:'Cumul de l’usure technique des machines industrielles (2841), du matériel de bureau (2844) ou de transport (2845).',why:'Crédité en face du débit 6813 (Dotations aux amortissements). Il réduit la valeur brute du matériel (241/244) pour afficher la valeur nette comptable au bilan.'},
 '31':{code:'31',label:'Marchandises',classe:3,type:'asset',refBilan:'BB',refLabel:'BB · Stocks et encours',normalSide:'Débit (Actif circulant)',plain:'Biens achetés pour être revendus tels quels, sans aucune transformation.',why:'À utiliser pour une boutique de négoce. Pour Choco Serge qui transforme le cacao en chocolat, les fèves vont en 32 (Matières premières) et non en 31 !'},
 '32':{code:'32',label:'Matières premières et fournitures liées',classe:3,type:'asset',refBilan:'BB',refLabel:'BB · Stocks et encours',normalSide:'Débit (Actif circulant)',plain:'Stock physique de fèves de cacao, sucre, lait en poudre, beurre de cacao achetés pour être transformés.',why:'On utilise 32 (Matières premières) car ces ingrédients entrent dans la fabrication des produits finis (36), contrairement à 31 (Marchandises revendues en l’état).'},
 '33':{code:'33',label:'Autres approvisionnements (Emballages, matières consommables)',classe:3,type:'asset',refBilan:'BB',refLabel:'BB · Stocks et encours',normalSide:'Débit (Actif circulant)',plain:'Stock de papier aluminium, étuis cartonnés, étiquettes, sacs de jute et produits de nettoyage.',why:'Le sous-compte 335 (Emballages) loge les emballages en stock avant leur utilisation, regroupés avec tous les stocks sur la ligne BB du bilan.'},
 '36':{code:'36',label:'Produits finis',classe:3,type:'asset',refBilan:'BB',refLabel:'BB · Stocks et encours',normalSide:'Débit (Actif circulant)',plain:'Tablettes de chocolat, poudre et beurre fabriqués par l’usine et prêts à être vendus en magasin ou à l’export.',why:'Distingue ce que l’usine a déjà fabriqué (36) des matières brutes non encore transformées (32) et des produits en cours de fabrication sur les machines (34).'},
 '39':{code:'39',label:'Dépréciations des stocks et encours',classe:3,type:'contra_asset',refBilan:'BB',refLabel:'BB · Stocks et encours (colonne Amort./Dépréc.)',normalSide:'Crédit (Correcteur d’actif)',plain:'Perte de valeur probable d’un stock (ex. fèves humides, tablettes proches de la date d’expiration).',why:'En SYSCOHADA, le chiffre 9 en 2e position (29, 39, 49, 59) indique toujours une dépréciation d’actif ! On crédite 39 (ou 392 pour les matières premières) par le débit de 6593. Il diminue la valeur brute de la ligne BB à l’actif.'},
 '391':{code:'391',label:'Dépréciations des stocks de marchandises',classe:3,type:'contra_asset',refBilan:'BB',refLabel:'BB · Stocks et encours (colonne Amort./Dépréc.)',normalSide:'Crédit (Correcteur d’actif)',plain:'Perte de valeur sur des marchandises achetées pour revente.',why:'Subdivision de 39 spécifique aux marchandises (compte 31). Pour des matières premières (cacao), on préfère 392 (ou le compte racine 39).'},
 '392':{code:'392',label:'Dépréciations des stocks de matières premières',classe:3,type:'contra_asset',refBilan:'BB',refLabel:'BB · Stocks et encours (colonne Amort./Dépréc.)',normalSide:'Crédit (Correcteur d’actif)',plain:'Perte de valeur constatée à l’inventaire sur le stock de fèves de cacao ou d’ingrédients.',why:'392 correspond exactement au compte 32 (le 9 s’insère entre le 3 et le 2 : 32 -> 392). Sa contrepartie en charge est le compte 6593.'},
 '4011':{code:'4011',label:'Fournisseurs',classe:4,type:'liability',refBilan:'DJ',refLabel:'DJ · Fournisseurs d’exploitation',normalSide:'Crédit (Dette d’exploitation)',plain:'Ce que l’entreprise doit à ses fournisseurs courants (coopératives, négociants, imprimeurs, ENEO) pour des achats non encore payés.',why:'On utilise 4011 pour les achats courants d’exploitation (classe 6) et NON 481 (Fournisseurs d’investissements, ligne DH), qui est réservé aux achats d’immobilisations (machines de classe 2).'},
 '4091':{code:'4091',label:'Fournisseurs, avances et acomptes versés',classe:4,type:'asset',refBilan:'BH',refLabel:'BH · Fournisseurs, avances versées',normalSide:'Débit (Créance sur fournisseur)',plain:'Avance d’argent versée à une coopérative ou un fournisseur avant même qu’il ne livre la marchandise.',why:'Bien que commençant par 40, le 9 en 3e position (4091) inverse son sens : c’est une créance inscrite à l’Actif (ligne BH) et non une dette au Passif !'},
 '411':{code:'411',label:'Clients',classe:4,type:'asset',refBilan:'BI',refLabel:'BI · Clients',normalSide:'Débit (Créance client)',plain:'Les sommes que les clients (supermarchés, grossistes, acheteurs export) doivent encore payer à l’entreprise sur les ventes livrées.',why:'Compte d’actif circulant (ligne BI). Lorsqu’un client devient douteux ou litigieux, on transfère sa créance en 416 (Clients douteux) et on constate une dépréciation en 6594 / 491.'},
 '416':{code:'416',label:'Créances clients litigieuses ou douteuses',classe:4,type:'asset',refBilan:'BI',refLabel:'BI · Clients',normalSide:'Débit (Créance douteuse)',plain:'Factures clients dont le recouvrement est menacé par un retard grave ou un litige.',why:'Permet d’isoler les clients à risque du compte 411 ordinaire avant de calculer la dépréciation (débit 6594 / crédit 491).'},
 '422':{code:'422',label:'Personnel, rémunérations dues',classe:4,type:'liability',refBilan:'DK',refLabel:'DK · Dettes fiscales et sociales',normalSide:'Crédit (Dette sociale)',plain:'Les salaires nets du mois calculés sur les bulletins de paie mais pas encore virés aux employés.',why:'Est crédité lors de la comptabilisation de la fiche de paie (face au débit 661) puis soldé au débit dès que la banque (521) ou la caisse (571) paie les employés.'},
 '431':{code:'431',label:'Sécurité sociale (CNPS)',classe:4,type:'liability',refBilan:'DK',refLabel:'DK · Dettes fiscales et sociales',normalSide:'Crédit (Dette sociale)',plain:'Les cotisations sociales (part salariale retenue + part patronale PVID, PF, AT/MP) dues à la CNPS avant le 15 du mois suivant.',why:'Regroupe la dette envers la CNPS (ligne DK du passif). Ne pas confondre la charge patronale (664) avec le compte de tiers CNPS (431).'},
 '441':{code:'441',label:'État, impôt sur les bénéfices (IS)',classe:4,type:'liability',refBilan:'DK',refLabel:'DK · Dettes fiscales et sociales',normalSide:'Crédit (Dette fiscale)',plain:'Le solde d’Impôt sur les Sociétés (ou minimum de perception) dû à la DGI.',why:'441 concerne l’impôt sur le bénéfice (IS), tandis que 443 concerne la TVA facturée, 445 la TVA récupérable et 447 les impôts retenus à la source.'},
 '443':{code:'443',label:'État, TVA facturée',classe:4,type:'liability',refBilan:'DK',refLabel:'DK · Dettes fiscales et sociales',normalSide:'Crédit (Dette fiscale)',plain:'La TVA (19,25 %) collectée sur les ventes aux clients pour le compte de l’État.',why:'La TVA collectée n’est jamais un produit de l’entreprise (elle n’entre pas en classe 7) : c’est une dette envers le Trésor logée en 443.'},
 '4452':{code:'4452',label:'État, TVA récupérable sur achats',classe:4,type:'asset',refBilan:'BJ',refLabel:'BJ · Autres créances',normalSide:'Débit (Créance fiscale)',plain:'La TVA payée sur les factures d’achats régulières (matières, services) que l’entreprise a le droit de déduire de sa TVA collectée.',why:'C’est une créance sur l’État (ligne BJ de l’actif). Si la TVA sur un achat n’est légalement pas récupérable (ex. facture espèces >= 100 000 XAF), on ne l’inscrit PAS en 4452 mais directement dans le coût d’achat TTC.'},
 '446':{code:'446',label:'État, autres taxes sur le chiffre d’affaires (Droits d’accises)',classe:4,type:'liability',refBilan:'DK',refLabel:'DK · Dettes fiscales et sociales',normalSide:'Crédit (Dette fiscale)',plain:'Les droits d’accises (ex. 5 % sur certains chocolats visés à l’art. 142 CGI) facturés et à reverser à la DGI.',why:'Permet de suivre séparément la dette de droits d’accises (446) de la dette de TVA (443), sachant que l’accise entre dans la base de calcul de la TVA.'},
 '447':{code:'447',label:'État, impôts retenus à la source',classe:4,type:'liability',refBilan:'DK',refLabel:'DK · Dettes fiscales et sociales',normalSide:'Crédit (Dette fiscale)',plain:'Tous les impôts prélevés par l’entreprise sur des tiers pour les reverser au fisc : IRPP/CAC/CFC/RAV/TDL sur salaires, retenue 15 % sur loyers, précompte sur achats.',why:'447 loge les retenues faites pour le compte de l’État (l’argent est retenu sur le salarié, le bailleur ou le fournisseur), contrairement à 641 qui loge les impôts supportés par l’entreprise elle-même (FNE, CFC patronal, patente).'},
 '491':{code:'491',label:'Dépréciations des comptes clients',classe:4,type:'contra_asset',refBilan:'BI',refLabel:'BI · Clients (colonne Amort./Dépréc.)',normalSide:'Crédit (Correcteur d’actif)',plain:'Montant estimé de la perte probable sur un client douteux qui risque de ne pas payer sa facture.',why:'Le 9 en 2e position (491) signale la dépréciation du compte client (411/416). Crédité par le débit de 6594 (Charges pour dépréciations sur créances), et non 6593 qui est réservé aux stocks !'},
 '521':{code:'521',label:'Banques locales',classe:5,type:'asset',refBilan:'BS',refLabel:'BS · Banques, chèques postaux, caisse et assimilés',normalSide:'Débit (Trésorerie-Actif)',plain:'L’argent disponible sur les comptes bancaires de l’entreprise (Afriland, BICEC, SCB, Société Générale, etc.).',why:'Attention aux pièges des débutants : en comptabilité d’entreprise, quand l’argent ENTRE en banque on DÉBITE 521 ; quand l’argent SORT de la banque on CRÉDITE 521 (c’est l’inverse du relevé envoyé par votre banquier !).'},
 '571':{code:'571',label:'Caisse siège social',classe:5,type:'asset',refBilan:'BS',refLabel:'BS · Banques, chèques postaux, caisse et assimilés',normalSide:'Débit (Trésorerie-Actif)',plain:'Les espèces (billets et pièces) physiquement présentes dans le coffre de l’entreprise.',why:'Un compte de caisse (571) est débité quand des espèces entrent et crédité quand on paie en cash. Son solde ne peut jamais être créditeur (on ne peut pas sortir plus de billets qu’il n’y en a dans la caisse).'},
 '6011':{code:'6011',label:'Achats de marchandises dans la région OHADA',classe:6,type:'expense',refBilan:'RA',refLabel:'RA · Achats de marchandises',normalSide:'Débit (Charge d’exploitation)',plain:'Achat de produits finis destinés à être revendus tels quels sans transformation.',why:'Pourquoi ne pas utiliser 6011 pour les fèves de cacao de Choco Serge ? Parce que Choco Serge transforme les fèves en chocolat ! 6011 (ligne RA) est réservé au négoce pur ; l’industrie utilise 6021 (ligne RC).'},
 '6021':{code:'6021',label:'Achats de matières premières et fournitures liées dans la région',classe:6,type:'expense',refBilan:'RC',refLabel:'RC · Achats de matières premières et fournitures liées',normalSide:'Débit (Charge d’exploitation)',plain:'Achat des fèves de cacao, du sucre, du lait en poudre et des ingrédients qui seront transformés à l’usine.',why:'Pourquoi 6021 et non 6011 ou 32 ? Lors de la réception de la facture fournisseur en inventaire intermittent, on débite la charge d’achat 6021 (ligne RC du compte de résultat) et non directement le stock 32. Le chiffre 1 final (6021) précise un achat dans la région OHADA.'},
 '6031':{code:'6031',label:'Variations des stocks de marchandises',classe:6,type:'expense',refBilan:'RB',refLabel:'RB · Variation de stocks de marchandises',normalSide:'Débit (si déstockage) / Crédit (si stockage)',plain:'Ajustement de fin de période entre le stock initial et le stock final de marchandises.',why:'Sert à ne compter en charge de l’année que les marchandises réellement vendues (Achats 6011 +/- Variation 6031).'},
 '6032':{code:'6032',label:'Variations des stocks de matières premières et fournitures liées',classe:6,type:'expense',refBilan:'RD',refLabel:'RD · Variation de stocks de matières premières',normalSide:'Débit (si stock initial annulé) / Crédit (si stock final constaté)',plain:'Écriture d’inventaire qui retranche des achats de l’année les matières premières non encore consommées et toujours en stock.',why:'Pourquoi créditer 6032 quand on débite 32 ? Si vous achetez 1 000 000 XAF de cacao (débit 6021) mais qu’il est encore intact au magasin le 30 novembre (débit 32), l’usine n’a encore rien consommé : le crédit de 6032 vient compenser le débit de 6021 sur la ligne RD du compte de résultat !'},
 '604':{code:'604',label:'Achats stockés de matières et fournitures consommables (Emballages 608/604)',classe:6,type:'expense',refBilan:'RE',refLabel:'RE · Autres achats',normalSide:'Débit (Charge d’exploitation)',plain:'Achats de carburants stockés, produits d’entretien, fournitures d’atelier et emballages perdus (papier alu, étuis, cartons).',why:'Regroupé sur la ligne RE (Autres achats) du compte de résultat, distinct des matières premières principales (6021, ligne RC).'},
 '6051':{code:'6051',label:'Fournitures non stockables - Eau (Camwater)',classe:6,type:'expense',refBilan:'RE',refLabel:'RE · Autres achats',normalSide:'Débit (Charge d’exploitation)',plain:'Factures de consommation d’eau pour le nettoyage des cuves et les locaux.',why:'En SYSCOHADA, l’eau (6051) et l’électricité (6052) sont classées dans les « Autres achats non stockables » (605, ligne RE) et non dans les services extérieurs (62/63).'},
 '6052':{code:'6052',label:'Fournitures non stockables - Électricité (ENEO)',classe:6,type:'expense',refBilan:'RE',refLabel:'RE · Autres achats',normalSide:'Débit (Charge d’exploitation)',plain:'Factures d’électricité industrielle (ENEO) pour faire tourner les broyeurs, concheuses et le tempérage du chocolat.',why:'6052 est le sous-compte exact pour l’électricité (ligne RE). Ne pas utiliser 6051 (Eau) ni 624 (Entretien).'},
 '611':{code:'611',label:'Transports sur achats',classe:6,type:'expense',refBilan:'RG',refLabel:'RG · Transports',normalSide:'Débit (Charge d’exploitation)',plain:'Factures des transporteurs pour acheminer les fèves de cacao de la brousse jusqu’à l’usine.',why:'En SYSCOHADA révisé, les frais de transport facturés par un transporteur tiers sur achats peuvent être suivis en 611 (ou rattachés aux sous-comptes d’achats concernés) et figurent en ligne RG.'},
 '612':{code:'612',label:'Transports sur ventes',classe:6,type:'expense',refBilan:'RG',refLabel:'RG · Transports',normalSide:'Débit (Charge d’exploitation)',plain:'Frais de transport et de fret payés pour livrer les palettes de chocolat aux supermarchés ou au port d’exportation.',why:'612 distingue le transport aval de commercialisation (coût de distribution) du transport amont d’approvisionnement (611).'},
 '622':{code:'622',label:'Locations et charges locatives',classe:6,type:'expense',refBilan:'RH',refLabel:'RH · Services extérieurs',normalSide:'Débit (Charge d’exploitation)',plain:'Loyers payés pour l’usine, l’entrepôt de stockage ou la boutique.',why:'Compte de charge locative (ligne RH). Au Cameroun, attention à la retenue à la source sur loyers (15 % au profit du compte 447 selon le statut du bailleur).'},
 '624':{code:'624',label:'Entretien, réparations et maintenance',classe:6,type:'expense',refBilan:'RH',refLabel:'RH · Services extérieurs',normalSide:'Débit (Charge d’exploitation)',plain:'Contrats de maintenance des machines de chocolaterie, des chambres froides et des camions.',why:'Utilisé pour maintenir une machine en bon état de marche. Si une dépense remplace un moteur majeur et prolonge de plusieurs années la vie de la machine, c’est une immobilisation (241) et non du 624.'},
 '625':{code:'625',label:'Primes d’assurances',classe:6,type:'expense',refBilan:'RH',refLabel:'RH · Services extérieurs',normalSide:'Débit (Charge d’exploitation)',plain:'Assurance incendie de l’usine, assurance transport des fèves et chocolats, assurance flotte automobile.',why:'Logé en Services extérieurs (ligne RH). Les cotisations de sécurité sociale légale vont en 664 (CNPS) et non en 625.'},
 '627':{code:'627',label:'Publicité, publications, relations publiques',classe:6,type:'expense',refBilan:'RH',refLabel:'RH · Services extérieurs',normalSide:'Débit (Charge d’exploitation)',plain:'Campagnes marketing « Made in Cameroon », dégustations promotionnelles, supports publicitaires.',why:'Compte dédié aux frais commerciaux et de communication externe (ligne RH).'},
 '632':{code:'632',label:'Rémunérations d’intermédiaires et de conseils (Honoraires)',classe:6,type:'expense',refBilan:'RH',refLabel:'RH · Services extérieurs',normalSide:'Débit (Charge d’exploitation)',plain:'Honoraires de l’expert-comptable, du commissaire aux comptes, de l’avocat ou du transitaire en douane.',why:'On utilise 632 (Services extérieurs) pour des prestataires indépendants externes, et jamais 661 (qui est réservé aux salariés liés par un contrat de travail).'},
 '641':{code:'641',label:'Impôts et taxes directs (Patente, CFC patronal, FNE)',classe:6,type:'expense',refBilan:'RI',refLabel:'RI · Impôts et taxes',normalSide:'Débit (Charge d’exploitation)',plain:'Les impôts et taxes qui sont une vraie charge pour l’entreprise : contribution des patentes, CFC patronal (1,5 %), FNE (1 %).',why:'Pourquoi 641 et non 443 ou 891 ? 641 (ligne RI) enregistre les taxes d’exploitation supportées par l’entreprise. La TVA collectée (443) et l’IRPP retenu sur les salariés (447) ne passent pas en 641 car c’est l’argent des tiers. L’IS sur les bénéfices va en 891 (ligne RQ).'},
 '646':{code:'646',label:'Droits d’enregistrement et de timbre',classe:6,type:'expense',refBilan:'RI',refLabel:'RI · Impôts et taxes',normalSide:'Débit (Charge d’exploitation)',plain:'Frais d’enregistrement des baux commerciaux, marchés, statuts et timbres fiscaux.',why:'Subdivision de la classe 64 pour isoler les droits d’enregistrement et de timbre sur la ligne RI du compte de résultat.'},
 '651':{code:'651',label:'Pertes sur créances clients et autres débiteurs',classe:6,type:'expense',refBilan:'RJ',refLabel:'RJ · Autres charges',normalSide:'Débit (Charge d’exploitation)',plain:'Créance client devenue définitivement et irrémédiablement perdue (faillite clôturée, disparition prouvée).',why:'Différence fondamentale : 651 s’utilise quand la perte est DÉFINITIVE et certaine. Tant que la perte est seulement PROBABLE (client en retard ou en litige), on utilise 6594 (Charges pour dépréciations sur créances) !'},
 '658':{code:'658',label:'Charges diverses',classe:6,type:'expense',refBilan:'RJ',refLabel:'RJ · Autres charges',normalSide:'Débit (Charge d’exploitation)',plain:'Menues charges de gestion courante (jetons de présence, dons courants).',why:'Sert aux autres charges courantes d’exploitation (ligne RJ), hors amendes pénales ou charges HAO (classe 8).'},
 '659':{code:'659',label:'Charges pour dépréciations et provisions pour risques à court terme d’exploitation',classe:6,type:'expense',refBilan:'RJ',refLabel:'RJ · Autres charges (et dépréciations d’actif circulant)',normalSide:'Débit (Charge calculée d’exploitation)',plain:'Compte-père (« chapeau ») regroupant toutes les pertes de valeur probables à court terme sur l’exploitation (stocks, clients, petits risques).',why:'POURQUOI NE PAS SAISIR DIRECTEMENT EN 659 ? Parce que 659 est le compte générique à 3 chiffres ! En comptabilité SYSCOHADA, pour que la DSF et l’audit sachent exactement quel actif circulant a perdu de la valeur, il faut utiliser le sous-compte à 4 chiffres précis : 6591 (risques à court terme -> passif 499), 6593 (stocks -> actif 39), 6594 (créances -> actif 49), ou 6598 (autres).'},
 '6591':{code:'6591',label:'Charges pour provisions pour risques à court terme d’exploitation',classe:6,type:'expense',refBilan:'RJ',refLabel:'RJ · Autres charges',normalSide:'Débit (Charge calculée d’exploitation)',plain:'Provision pour un risque d’exploitation probable à moins d’un an (ex. petit litige commercial imminent).',why:'6591 a pour contrepartie le compte de passif 4991 (Provisions pour risques à court terme, ligne DP), alors que 6593 déprécie un stock (39) et 6594 déprécie une créance (49).'},
 '6593':{code:'6593',label:'Charges pour dépréciations sur stocks',classe:6,type:'expense',refBilan:'RJ',refLabel:'RJ · Autres charges',normalSide:'Débit (Charge calculée d’exploitation)',plain:'Constatation qu’un lot en stock (fèves humides, chocolats abîmés) vaut désormais moins cher que son coût d’achat ou de production.',why:'EXPLICATION CLÉ (659 vs 6593 vs 6594 vs 681) : 1) On choisit 6593 et non 659 car le chiffre « 3 » final de 6593 renvoie directement à la Classe 3 (Stocks) ! 2) On ne prend pas 6594 car le « 4 » renvoie à la Classe 4 (Créances clients). 3) On ne prend pas 681 car 681 concerne les immobilisations durables (Classe 2). L’écriture type est donc Débit 6593 / Crédit 39 (ou 392).'},
 '6594':{code:'6594',label:'Charges pour dépréciations sur créances',classe:6,type:'expense',refBilan:'RJ',refLabel:'RJ · Autres charges',normalSide:'Débit (Charge calculée d’exploitation)',plain:'Constatation qu’un client risque de ne pas payer une partie ou la totalité de sa facture.',why:'Le chiffre « 4 » final de 6594 renvoie à la Classe 4 (Comptes de tiers / créances). On l’utilise par le crédit du compte 491 (Dépréciations des comptes clients). Ne jamais confondre avec 6593 (stocks) ni avec 651 (perte définitive irrécouvrable).'},
 '6598':{code:'6598',label:'Autres charges pour dépréciations et provisions pour risques à court terme',classe:6,type:'expense',refBilan:'RJ',refLabel:'RJ · Autres charges',normalSide:'Débit (Charge calculée d’exploitation)',plain:'Dépréciations d’exploitation à court terme qui ne portent ni sur les stocks (6593), ni sur les créances (6594), ni sur les risques identifiés en 6591.',why:'En SYSCOHADA, la terminaison « 8 » désigne toujours « Autres / divers » à l’intérieur d’une rubrique.'},
 '661':{code:'661',label:'Rémunérations directes versées au personnel national',classe:6,type:'expense',refBilan:'RK',refLabel:'RK · Charges de personnel',normalSide:'Débit (Charge d’exploitation)',plain:'Salaires bruts, primes et indemnités des employés de l’entreprise (ouvriers, commerciaux, comptable, DG).',why:'On enregistre en 661 le salaire BRUT total (avant déduction de l’IRPP et de la CNPS salariale). Les retenues salariales ne sont pas une charge supplémentaire : elles sont prélevées sur ce brut (débit 422 / crédit 431 et 447).'},
 '664':{code:'664',label:'Charges sociales (Cotisations patronales CNPS)',classe:6,type:'expense',refBilan:'RK',refLabel:'RK · Charges de personnel',normalSide:'Débit (Charge d’exploitation)',plain:'La part des cotisations CNPS supportée par l’employeur (Pensions 4,2 % + Prestations familiales 7 % + Accidents du travail 1,75 % à 5 %).',why:'Seule la part PATRONALE va en 664 (ligne RK). La part salariale (4,2 %) est déjà incluse dans le salaire brut (661).'},
 '671':{code:'671',label:'Intérêts des emprunts',classe:6,type:'expense',refBilan:'RM',refLabel:'RM · Frais financiers et charges assimilées',normalSide:'Débit (Charge financière)',plain:'Les intérêts facturés par la banque sur les crédits d’investissement ou de campagne.',why:'Seuls les intérêts vont en charge financière (671, ligne RN). Le remboursement du capital de l’emprunt n’est pas une charge : il diminue directement la dette au bilan (débit 162).'},
 '6813':{code:'6813',label:'Dotations aux amortissements des immobilisations corporelles',classe:6,type:'expense',refBilan:'RL',refLabel:'RL · Dotations aux amortissements et aux provisions',normalSide:'Débit (Charge calculée)',plain:'Le coût annuel d’usure des machines (torréfacteurs, camions, bâtiments) étalé sur leur durée de vie.',why:'On utilise 6813 (ligne RL) pour l’amortissement des biens durables de Classe 2 (par le crédit de 283/284), alors que 6593/6594 (ligne RJ) sert aux dépréciations à court terme des stocks et créances (Classes 3 et 4).'},
 '701':{code:'701',label:'Ventes de marchandises',classe:7,type:'income',refBilan:'TA',refLabel:'TA · Ventes de marchandises',normalSide:'Crédit (Produit d’exploitation)',plain:'Chiffre d’affaires hors taxes réalisé en revendant des marchandises achetées sans transformation.',why:'Ligne TA du compte de résultat (entre dans la Marge commerciale XA). Une chocolaterie industrielle qui vend les tablettes qu’elle a fabriquées utilise 702 (ligne TB) et non 701 !'},
 '702':{code:'702',label:'Ventes de produits finis',classe:7,type:'income',refBilan:'TB',refLabel:'TB · Ventes de produits fabriqués',normalSide:'Crédit (Produit d’exploitation)',plain:'Chiffre d’affaires hors taxes réalisé en vendant les chocolats, le beurre et la poudre fabriqués par l’usine (7021 dans la région, 7022 hors région).',why:'Compte principal de revenus d’une entreprise industrielle (ligne TB). Toujours comptabilisé Hors TVA (la TVA collectée va en 443).'},
 '706':{code:'706',label:'Services vendus',classe:7,type:'income',refBilan:'TC',refLabel:'TC · Travaux, services vendus',normalSide:'Crédit (Produit d’exploitation)',plain:'Prestations de services facturées aux clients (ex. torréfaction ou conditionnement à façon pour un tiers).',why:'Ligne TC du compte de résultat, distincte des ventes de biens physiques (701/702).'},
 '707':{code:'707',label:'Produits accessoires (Ports facturés, locations)',classe:7,type:'income',refBilan:'TD',refLabel:'TD · Produits accessoires',normalSide:'Crédit (Produit d’exploitation)',plain:'Frais de transport ou d’emballage refacturés aux clients en plus du prix des chocolats.',why:'Logé en ligne TD (Produits accessoires), entre dans le Chiffre d’Affaires global XB (TA + TB + TC + TD).'},
 '736':{code:'736',label:'Variations des stocks de produits finis',classe:7,type:'income',refBilan:'TE',refLabel:'TE · Production stockée (ou déstockage)',normalSide:'Crédit (si stockage) / Débit (si déstockage)',plain:'Différence entre le stock final et le stock initial de chocolats fabriqués par l’usine.',why:'Pourquoi la variation des matières premières est en classe 6 (6032, charge) alors que celle des produits finis est en classe 7 (736, produit) ? Parce que les matières premières s’achètent (correction d’achat en classe 6) tandis que les produits finis sont créés par l’usine (production stockée en classe 7, ligne TE) !'},
 '7593':{code:'7593',label:'Reprises de charges pour dépréciations sur stocks',classe:7,type:'income',refBilan:'TJ',refLabel:'TJ · Reprises d’amortissements, provisions et dépréciations',normalSide:'Crédit (Produit calculé)',plain:'Annulation d’une dépréciation de stock devenue sans objet (quand le stock déprécié a été vendu ou a retrouvé sa valeur).',why:'Miroir exact en classe 7 du compte 6593 (on débite 39 / 392 et on crédite 7593 sur la ligne TJ du Compte de résultat).'},
 '7594':{code:'7594',label:'Reprises de charges pour dépréciations sur créances',classe:7,type:'income',refBilan:'TJ',refLabel:'TJ · Reprises d’amortissements, provisions et dépréciations',normalSide:'Crédit (Produit calculé)',plain:'Annulation de la dépréciation d’un client douteux lorsqu’il finit par payer ou lorsque le dossier est clôturé.',why:'Miroir exact en classe 7 du compte 6594 (on débite 491 et on crédite 7594).'},
 '321':{code:'321',label:'Matières premières A (Fèves de cacao brutes, sucre, lait pour transformation)',classe:3,type:'asset',refBilan:'BB',refLabel:'BB · Stocks et encours',normalSide:'Débit (Actif circulant)',plain:'Stock physique de fèves de cacao et matières premières destinées à l’usinage.',why:'Subdivision officielle du compte 32 (Matières premières et fournitures liées, ligne BB), distincte de 311 (Marchandises de négoce).'},
 '361':{code:'361',label:'Produits finis A (Tablettes de chocolat et produits manufacturés prêts à la vente)',classe:3,type:'asset',refBilan:'BB',refLabel:'BB · Stocks et encours',normalSide:'Débit (Actif circulant)',plain:'Stock de tablettes de chocolat finies en chambre froide.',why:'Subdivision officielle du compte 36 (Produits finis, ligne BB), dont la variation passe par le compte 736 (ligne TE).'},
 '371':{code:'371',label:'Produits intermédiaires (Produits semi-finis : masse de cacao, liqueur, beurre)',classe:3,type:'asset',refBilan:'BB',refLabel:'BB · Stocks et encours',normalSide:'Débit (Actif circulant)',plain:'Stock de produits semi-finis (masse, beurre, tourteaux) ayant franchi un premier stade de fabrication et destinés à une transformation ultérieure.',why:'En SYSCOHADA révisé officiel, les produits semi-finis s’enregistrent en 371 (Produits intermédiaires, variation 737 ligne TE) ou 34 (Produits en cours, variation 734), et jamais en 312 (qui désigne les Marchandises B) !'},
 '6022':{code:'6022',label:'Achats de matières premières et fournitures liées hors région OHADA',classe:6,type:'expense',refBilan:'RC',refLabel:'RC · Achats de matières premières et fournitures liées',normalSide:'Débit (Charge d’exploitation)',plain:'Importation d’intrants industriels et matières premières hors espace OHADA.',why:'Subdivision hors région de la famille 602 (ligne RC), distincte de 6012 (Marchandises importées pour revente en l’état, ligne RA).'},
 '6025':{code:'6025',label:'Frais sur achats de matières premières et fournitures liées',classe:6,type:'expense',refBilan:'RC',refLabel:'RC · Achats de matières premières et fournitures liées',normalSide:'Débit (Charge d’exploitation)',plain:'Frais accessoires (transport amont, manutention, transit, commissions) rattachés aux achats de matières premières.',why:'En SYSCOHADA révisé, les frais accessoires sur achats de matières premières se logent en 6025 (ligne RC) ou en 611 (Transports sur achats, ligne RG).'},
 '6033':{code:'6033',label:'Variations des stocks d’autres approvisionnements (emballages, consommables)',classe:6,type:'expense',refBilan:'RF',refLabel:'RF · Variation de stocks d’autres approvisionnements',normalSide:'Débit (déstockage) / Crédit (stockage)',plain:'Ajustement d’inventaire des stocks de matières consommables et d’emballages (compte 33).',why:'Alimente la ligne RF du Compte de résultat SYSCOHADA révisé (distincte de RB pour 6031 et de RD pour 6032).'},
 '6042':{code:'6042',label:'Achats stockés de matières combustibles (Carburants et lubrifiants en cuve)',classe:6,type:'expense',refBilan:'RE',refLabel:'RE · Autres achats',normalSide:'Débit (Charge d’exploitation)',plain:'Achats de gazole, fioul et lubrifiants stockés en cuve pour les groupes électrogènes, chaudières ou la flotte.',why:'En SYSCOHADA révisé, le carburant stocké relève de 6042 (ligne RE) et le carburant non stockable pris à la pompe de 6053 (ligne RE), jamais de 6015 !'},
 '6053':{code:'6053',label:'Fournitures non stockables - Autres énergies (Carburants routiers à la pompe)',classe:6,type:'expense',refBilan:'RE',refLabel:'RE · Autres achats',normalSide:'Débit (Charge d’exploitation)',plain:'Achats de carburant (Super / Gazole) à la station-service non stockés en cuve.',why:'Subdivision officielle du compte 605 pour les énergies autres que l’eau (6051) et l’électricité (6052). Au Cameroun (art. 144 CGI), la TVA sur les carburants routiers est non déductible : on comptabilise le montant TTC en 6053 !'},
 '618':{code:'618',label:'Autres frais de transport (Voyages et déplacements 6181, transport entre sites 6182)',classe:6,type:'expense',refBilan:'RG',refLabel:'RG · Transports',normalSide:'Débit (Charge d’exploitation)',plain:'Billets d’avion, train, bus et frais de transport lors des missions et déplacements professionnels.',why:'Relève de la classe 61 (Transports, ligne RG). Ne jamais confondre avec 624 (Entretien, réparations et maintenance, ligne RH) !'},
 '6222':{code:'6222',label:'Locations de bâtiments (Usine, entrepôt, bureaux, boutique)',classe:6,type:'expense',refBilan:'RH',refLabel:'RH · Services extérieurs',normalSide:'Débit (Charge d’exploitation)',plain:'Loyers mensuels ou trimestriels des locaux professionnels loués par l’entreprise.',why:'En SYSCOHADA révisé, 6221 concerne les terrains et 6222 concerne les bâtiments (ligne RH). Au Cameroun, attention à la retenue à la source de 15 % sur loyers (compte 447).'},
 '6223':{code:'6223',label:'Locations de matériels et outillages (Engins BTP, grues, groupes électrogènes)',classe:6,type:'expense',refBilan:'RH',refLabel:'RH · Services extérieurs',normalSide:'Débit (Charge d’exploitation)',plain:'Location d’engins de chantier BTP, de chariots élévateurs ou de machines.',why:'Logé en Services extérieurs (6223, ligne RH), distinct du transport pour compte de tiers (613, ligne RG).'},
 '6242':{code:'6242',label:'Entretien et réparations des biens mobiliers (Machines d’usine, camions, véhicules)',classe:6,type:'expense',refBilan:'RH',refLabel:'RH · Services extérieurs',normalSide:'Débit (Charge d’exploitation)',plain:'Réparation d’une panne sur un camion de livraison (ex. à Edéa), révision d’un torréfacteur ou remplacement de pièces d’usure.',why:'DISTINCTION FONDAMENTALE SYSCOHADA : L’entretien et la réparation des véhicules et machines vont en 6242 (sous 624 Entretien, réparations et maintenance, ligne RH), jamais en 61 (Transports, ligne RG) ni en 615 (qui est un numéro du PCG français) !'},
 '6243':{code:'6243',label:'Maintenance (Contrats de maintenance industrielle, informatique et équipements)',classe:6,type:'expense',refBilan:'RH',refLabel:'RH · Services extérieurs',normalSide:'Débit (Charge d’exploitation)',plain:'Contrats périodiques de maintenance préventive et curative des installations et logiciels.',why:'Subdivision officielle du compte 624 dédiée à la maintenance (ligne RH).'},
 '6324':{code:'6324',label:'Honoraires des professions réglementées, conseils et prestataires techniques / IT',classe:6,type:'expense',refBilan:'RH',refLabel:'RH · Services extérieurs',normalSide:'Débit (Charge d’exploitation)',plain:'Honoraires de l’expert-comptable, du commissaire aux comptes, de l’avocat ou du consultant IT / développeur.',why:'En SYSCOHADA révisé, les honoraires et prestations de conseils relèvent de 6324 (sous 632, ligne RH) et non de 6224 (qui désigne les malis sur emballages) ! Si le prestataire est non-résident à l’étranger, retenir la TSR de 15 % au crédit de 447.'},
 '6634':{code:'6634',label:'Indemnités de transport versées au personnel',classe:6,type:'expense',refBilan:'RK',refLabel:'RK · Charges de personnel',normalSide:'Débit (Charge d’exploitation)',plain:'Indemnités représentatives de frais de transport versées aux salariés.',why:'Subdivision officielle du compte 663 (Indemnités forfaitaires versées au personnel, ligne RK). Attention CNPS/DGI : seules les indemnités justifiées par des frais professionnels réels échappent à la réintégration dans l’assiette cotisable.'},
 '87':{code:'87',label:'Participation des travailleurs aux bénéfices',classe:8,type:'expense',refBilan:'RQ',refLabel:'RQ · Participation des travailleurs',normalSide:'Débit (Charge classe 8)',plain:'Part contractuelle ou légale du bénéfice attribuée collectivement aux salariés.',why:'Occupe la ligne RQ du Compte de résultat SYSCOHADA révisé, juste avant la ligne RS (Impôts sur le résultat 891).'},
 '891':{code:'891',label:'Impôts sur les bénéfices de l’exercice (IS)',classe:8,type:'expense',refBilan:'RS',refLabel:'RS · Impôts sur le résultat',normalSide:'Débit (Charge d’impôt sur le bénéfice)',plain:'L’Impôt sur les Sociétés (27,5 % PME ou 33 % droit commun du bénéfice fiscal, ou minimum de perception de 2,2 % du CA) dû au titre de l’année.',why:'En SYSCOHADA révisé, l’impôt sur le bénéfice figure tout en bas du compte de résultat en 891 sur la ligne RS (Impôts sur le résultat, juste après RQ Participation des travailleurs 87), et non en 641 (ligne RI).'}
};

function explainAccount(code){
 const s=String(code||'').trim();
 if(SYSCOHADA_ACCOUNTS[s])return SYSCOHADA_ACCOUNTS[s];
 for(let len=s.length-1;len>=2;len--){
  const sub=s.slice(0,len);
  if(SYSCOHADA_ACCOUNTS[sub])return {...SYSCOHADA_ACCOUNTS[sub],code:s,noteSub:`Sous-compte rattaché au compte racine ${sub} (${SYSCOHADA_ACCOUNTS[sub].label}).`};
 }
 const c=s[0];
 const classes={
  '1':{classe:1,type:'equity',refBilan:'CA/DA',refLabel:'Ressources durables (Capitaux propres & Dettes financières)',normalSide:'Crédit',plain:'Compte de financement à long terme (capital, réserves, emprunts).',why:'La classe 1 regroupe les capitaux propres (10 à 15) et les dettes financières durables (16 à 19).'},
  '2':{classe:2,type:'asset',refBilan:'AD-AQ',refLabel:'Actif immobilisé',normalSide:'Débit (sauf 28/29 au Crédit)',plain:'Biens durables appartenant à l’entreprise (terrains, bâtiments, machines, cautions).',why:'La classe 2 regroupe tout ce qui reste durablement dans l’entreprise (> 1 an). Un 8 en 2e position (28..) indique un amortissement ; un 9 (29..) une dépréciation.'},
  '3':{classe:3,type:'asset',refBilan:'BB',refLabel:'BB · Stocks et encours',normalSide:'Débit (sauf 39 au Crédit)',plain:'Stocks de marchandises (31), matières premières (32), emballages (33) ou produits finis (36).',why:'La classe 3 figure à l’actif circulant (ligne BB). Le compte 39 (dépréciation des stocks) vient en diminution.'},
  '4':{classe:4,type:'liability',refBilan:'BH-DP',refLabel:'Comptes de tiers (Créances Actif / Dettes Passif)',normalSide:'Débit (Créances 41) / Crédit (Dettes 40, 42, 43, 44)',plain:'Relations avec les partenaires : fournisseurs (40), clients (41), personnel (42), CNPS (43), État/Impôts (44).',why:'La classe 4 regroupe les créances et dettes à court terme. Un 9 en 2e position (49..) indique une dépréciation de créance.'},
  '5':{classe:5,type:'asset',refBilan:'BQ-BT',refLabel:'Trésorerie (Banques, Caisse, Mobile Money)',normalSide:'Débit (Trésorerie positive)',plain:'Argent disponible en banque (521), chèques, mobile money (55) ou espèces en caisse (571).',why:'La classe 5 mesure la liquidité immédiate. Débit = entrée d’argent ; Crédit = sortie d’argent.'},
  '6':{classe:6,type:'expense',refBilan:'RA-RN',refLabel:'Charges des activités ordinaires',normalSide:'Débit (sauf 603/rabais)',plain:'Toutes les dépenses et consommations de l’année qui appauvrissent l’entreprise (achats, loyers, transport, impôts, salaires, dotations).',why:'La classe 6 va au Compte de résultat (jamais au Bilan, même si elle diminue le résultat net final).'},
  '7':{classe:7,type:'income',refBilan:'TA-TN',refLabel:'Produits des activités ordinaires',normalSide:'Crédit',plain:'Toutes les ventes et recettes d’exploitation ou financières qui enrichissent l’entreprise.',why:'La classe 7 va au Compte de résultat et augmente le bénéfice.'},
  '8':{classe:8,type:'expense',refBilan:'RO-RQ',refLabel:'Autres charges / produits HAO et Impôt sur le résultat',normalSide:'Débit (impaires : 81, 83, 85, 89) / Crédit (paires : 82, 84, 86)',plain:'Opérations exceptionnelles Hors Activités Ordinaires (HAO) et Impôt sur les sociétés (891).',why:'En classe 8, les numéros impairs (81, 83, 85, 87, 89) sont des charges et les numéros pairs (82, 84, 86, 88) sont des produits !'}
 };
 return {code:s,label:'Compte SYSCOHADA '+s, ...(classes[c]||{classe:0,type:'',refBilan:'?',refLabel:'À qualifier',normalSide:'À vérifier',plain:'Compte à rattacher au plan comptable de l’entreprise.',why:'Vérifiez les deux premiers chiffres pour identifier la classe SYSCOHADA.'})};
}

function diagnose(p){
 const ca=positive(p.ca,'CA annuel HT');let warnings=[], regime='À qualifier',igs=null;const limit=p.activity==='liberal'?30000000:50000000;
 if(p.year!=='2026')return {regime:'Prospective uniquement',igs:null,warnings:['Le millésime 2027 n’est pas validé dans cet atelier. Aucune mesure future n’est appliquée.'],accounting:'À déterminer',limit};
 if(['association','coop','snc','scs','gie','other'].includes(p.form)||['special','mixed','services'].includes(p.activity)) warnings.push('Statut, référentiel ou activité à examiner : aucune attribution automatique de l’IGS.');
 else if(p.exception==='yes')regime='Réel / examen sectoriel';
 else if(ca===limit){regime='Seuil exact : revue requise';warnings.push('Article 93 quater : réel à partir du seuil ; article C 39 : formulation « n’excède pas ». Faire confirmer le traitement à la limite.');}
 else if(ca>limit)regime='Réel';
 else if(p.history!=='none'){regime='Historique à examiner';warnings.push('Un CA en baisse ne fait pas sortir immédiatement du réel : maintien sur deux exercices, art. 93 quinquies / C 39.');}
 else {regime='IGS indicatif';const i=IGS.findIndex(a=>ca<a[0]);if(i>=0)igs={classe:i+1,base:IGS[i][1],amount:IGS[i][1]};if(igs&&p.cga&&ca>=10000000)igs.amount/=2;}
 if(p.exception==='unknown')warnings.push('Les exceptions au régime doivent être confirmées avant usage réel.');
 if(p.form==='SA')warnings.push('Prévoir le commissariat aux comptes légal et son indépendance.');
 if(p.activity==='cacao')warnings.push('Qualifier chaque produit et son code tarifaire : les accises ne concernent pas uniformément tous les produits du cacao.');
 let accounting=ca>=60000000?'SYSCOHADA normal à examiner':'Référentiel à confirmer par activité';
 if(p.form==='association')accounting='SYCEBNL à qualifier';
 if(igs&&ca>=10000000)warnings.push('IGS ≥ 10 millions : comptabilité et DSF prévues par art. C 44. Contrôler aussi le référentiel OHADA.');
 return {regime,igs,warnings,accounting,limit};
}
function tax(x){
 const local=positive(x.local),exported=positive(x.export),exciseBase=positive(x.exciseBase);if(exciseBase>local)throw Error('La base d’accises locale ne peut dépasser les ventes locales hors taxes dans ce modèle.');
 if(!['none','5','custom','unknown'].includes(x.excise))throw Error('Accises invalides');
 const ebp=x.excise==='5'?500:x.excise==='custom'?positive(x.exciseBp):0;if(ebp>10000)throw Error('Taux hors plage de simulation');
 const exciseRoundedBase=Math.floor(exciseBase/1000)*1000;
 const da=x.excise==='unknown'?null:rate(exciseRoundedBase,ebp);
 const blocked=da===null||(exported>0&&!x.exportProof);
 const vatRoundedBase=da===null?null:Math.floor((local+da)/1000)*1000;
 const vatLocal=da===null?null:rate(vatRoundedBase,1925);
 const deductible=positive(x.deductible),credit=positive(x.credit),vatWithheld=positive(x.vatWithheld);
 const netVat=blocked?null:vatLocal-deductible-credit-vatWithheld;
 const profit=money(x.profit),add=positive(x.add),deduct=positive(x.deduct),fiscal=Math.floor(Math.max(0,profit+add-deduct)/1000)*1000;
 const turnover=positive(x.annualCa),isBp=turnover<=3000000000?2750:3300;
 const isProfit=rate(fiscal,isBp),minimum=rate(turnover,220),gross=Math.max(isProfit,minimum),advance=positive(x.advance),balance=gross-advance;
 return {da,exciseRoundedBase,vatRoundedBase,vatLocal,netVat,vatDue:netVat===null?null:Math.max(0,netVat),vatCredit:netVat===null?null:Math.max(0,-netVat),fiscal,isBp,isProfit,minimum,gross,advance,balance:Math.max(0,balance),excess:Math.max(0,-balance),blocked};
}
function cnps(rows,pfBp,riskBp){
 if(![700,565,370].includes(Number(pfBp))||![175,250,500].includes(Number(riskBp)))throw Error('Régime PF et groupe de risque CNPS à préciser');
 let pensionEmployee=0,pensionEmployer=0,pf=0,at=0,totalBase=0,count=0;
 const details=rows.map(r=>{const n=positive(r.count,'Effectif'),base=positive(r.base,'Salaire cotisable');if(n>100000)throw Error('Effectif excessif');const capped=Math.min(base,750000);let row={count:n,base,pensionEmployee:rate(capped,420)*n,pensionEmployer:rate(capped,420)*n,pf:rate(capped,Number(pfBp))*n,at:rate(base,Number(riskBp))*n};pensionEmployee+=row.pensionEmployee;pensionEmployer+=row.pensionEmployer;pf+=row.pf;at+=row.at;totalBase+=base*n;count+=n;return row;});
 return {details,count,totalBase,pensionEmployee,pensionEmployer,pf,at,employer:pensionEmployer+pf+at,total:pensionEmployee+pensionEmployer+pf+at};
}

/* === NOUVEAU : CALCULATEUR COMPLET DE PAIE CAMEROUN (IRPP, CAC, CFC, FNE, RAV, TDL, CNPS & ÉCRITURE COMPTABLE) === */
const RAV_BRACKETS=[[50000,0],[100000,750],[200000,1950],[300000,3250],[400000,4550],[500000,5850],[600000,7150],[700000,8450],[800000,9750],[900000,11050],[1000000,12350],[Infinity,13000]];
const TDL_ANNUAL=[[61999,0],[75000,3000],[100000,6000],[125000,9000],[150000,12000],[200000,15000],[250000,18000],[300000,24000],[500000,27000],[Infinity,30000]];
function payroll(p){
 const baseSalary=positive(p.baseSalary,'Salaire de base');
 const taxablePrimes=positive(p.taxablePrimes??0,'Primes taxables');
 const exemptAllowances=positive(p.exemptAllowances??0,'Frais professionnels remboursés sur justificatifs');
 const count=positive(p.count??1,'Effectif');if(count===0||count>10000)throw Error('Effectif entre 1 et 10 000 requis');
 const pfBp=Number(p.pfBp??700),riskBp=Number(p.riskBp??250);
 if(![700,565,370].includes(pfBp)||![175,250,500].includes(riskBp))throw Error('Régime PF et risque AT/MP requis');
 const sbt=baseSalary+taxablePrimes; // Salaire brut taxable & cotisable dans ce modèle pédagogique
 const grossTotal=sbt+exemptAllowances;
 const cappedCnps=Math.min(sbt,750000);
 const pvidSal=rate(cappedCnps,420);
 const pvidPat=rate(cappedCnps,420);
 const pfPat=rate(cappedCnps,pfBp);
 const atPat=rate(sbt,riskBp);
 // IRPP annuel puis ramené au mois selon barème progressif CGI Cameroun (exonéré si SBT < 62 000 XAF)
 let irpp=0,cac=0,sncAnnual=0;
 if(sbt>=62000){
  const annualSbt=sbt*12;
  const profExp=Math.min(rate(annualSbt,3000),4800000); // 30% frais professionnels forfaitaires
  sncAnnual=Math.max(0,annualSbt-profExp-(pvidSal*12)-500000);
  let annualIrpp=0;
  if(sncAnnual>0){
   const b1=Math.min(sncAnnual,2000000);annualIrpp+=rate(b1,1000);
   if(sncAnnual>2000000){const b2=Math.min(sncAnnual-2000000,1000000);annualIrpp+=rate(b2,1500);}
   if(sncAnnual>3000000){const b3=Math.min(sncAnnual-3000000,2000000);annualIrpp+=rate(b3,2500);}
   if(sncAnnual>5000000){const b4=sncAnnual-5000000;annualIrpp+=rate(b4,3500);}
  }
  irpp=Math.round(annualIrpp/12);
  cac=rate(irpp,1000);
 }
 const cfcSal=sbt>=62000?rate(sbt,100):0; // 1% salarié
 const cfcPat=rate(sbt,150); // 1,5% employeur
 const fnePat=rate(sbt,100); // 1% employeur
 const rav=RAV_BRACKETS.find(b=>sbt<=b[0])[1];
 const tdlAnnual=sbt<62000?0:TDL_ANNUAL.find(b=>baseSalary<=b[0])[1];
 const tdl=Math.round(tdlAnnual/12);
 const totalTaxSal=irpp+cac+cfcSal+rav+tdl;
 const totalRetenues=pvidSal+totalTaxSal;
 const netPay=grossTotal-totalRetenues;
 const cnpsPat=pvidPat+pfPat+atPat;
 const taxPat=cfcPat+fnePat;
 const totalCost=grossTotal+cnpsPat+taxPat;
 // Totaux multipliés par l'effectif du groupe
 const G=k=>k*count;
 const journalLines=[
  {account:'661',debit:G(grossTotal),credit:0,why:'Salaire brut total (base + primes + indemnités) supporté par l’entreprise (ligne RK).'},
  {account:'664',debit:G(cnpsPat),credit:0,why:'Cotisations sociales patronales CNPS (PVID 4,2 % + PF + AT/MP) à la charge de l’employeur (ligne RK).'},
  {account:'641',debit:G(taxPat),credit:0,why:'Impôts et taxes sur salaires à la charge de l’employeur : CFC patronal (1,5 %) + FNE (1 %) (ligne RI).'},
  {account:'422',debit:0,credit:G(netPay),why:'Salaire net à verser aux employés (dette envers le personnel, ligne DK).'},
  {account:'431',debit:0,credit:G(pvidSal+cnpsPat),why:'Total à reverser à la CNPS (part salariale retenue 4,2 % + parts patronales, ligne DK).'},
  {account:'447',debit:0,credit:G(totalTaxSal)+G(taxPat),why:'Impôts sur salaires à reverser à la DGI/Communes (IRPP, CAC, CFC salarial & patronal, FNE, RAV, TDL, ligne DK).'}
 ].filter(l=>l.debit>0||l.credit>0);
 return {
  unit:{baseSalary,taxablePrimes,exemptAllowances,sbt,grossTotal,pvidSal,irpp,cac,cfcSal,rav,tdl,totalTaxSal,totalRetenues,netPay,pvidPat,pfPat,atPat,cnpsPat,cfcPat,fnePat,taxPat,totalCost,sncAnnual},
  group:{count,grossTotal:G(grossTotal),netPay:G(netPay),pvidSal:G(pvidSal),cnpsPat:G(cnpsPat),cnpsTotal:G(pvidSal+cnpsPat),taxSal:G(totalTaxSal),taxPat:G(taxPat),taxTotal:G(totalTaxSal+taxPat),totalCost:G(totalCost)},
  journalLines
 };
}

function cost(x){
 let q=positive(x.qty,'Quantité'),price=positive(x.price,'Prix HT'),material=positive(x.material),process=positive(x.process),transport=positive(x.transport),fixed=positive(x.fixed);if(q===0)throw Error('La quantité doit être supérieure à zéro');
 const variable=material+process+transport,ca=q*price;if(!Number.isSafeInteger(ca)||ca>MAX)throw Error('CA calculé hors plage');const contribution=ca-variable;const total=variable+fixed;
 const breakEven=contribution>0?Number((BigInt(fixed)*BigInt(q)+BigInt(contribution)-1n)/BigInt(contribution)):null;
 const mcvUnit=price-(variable/q);
 const txMcv=price>0?(mcvUnit/price)*100:0;
 const breakEvenCa=breakEven!==null?breakEven*price:null;
 return {ca,variable,total,contribution,profit:ca-total,unit:total/q,variableUnit:variable/q,mcvUnit,txMcv,breakEven,breakEvenCa};
}

/* === NOUVEAU : SIMULATEUR COMPARATIF DES 4 SCÉNARIOS CACAO & PLAN DE TRÉSORERIE RELANCE === */
function compareRoutes(p){
 const beansKg=positive(p.beansKg??10000,'Volume fèves (kg)');if(beansKg===0)throw Error('Volume de fèves nul');
 const yieldPct=positive(p.yieldPct??80,'Rendement (%)');if(yieldPct===0||yieldPct>100)throw Error('Rendement entre 1 et 100 % requis');
 const chocKg=Math.floor((beansKg*yieldPct)/100);
 const priceCoop=positive(p.priceCoop??3000,'Prix coopérative/kg');
 const priceNeg=positive(p.priceNeg??3200,'Prix négociant HT/kg');
 const sellLocal=positive(p.sellLocal??6000,'Prix vente local HT/kg');
 const sellExport=positive(p.sellExport??6200,'Prix vente export HT/kg');
 const withholdingBp=positive(p.withholdingBp??0,'Taux précompte/retenue simulé (points de base)');
 const exciseBp=positive(p.exciseBp??500,'Taux accises local (points de base)');
 const otherCosts=positive(p.otherCosts??8000000,'Autres coûts mensuels usine (MOD, ENEO, emballages, fixes)');
 function runScenario(id,title,isNeg,isExport){
  const buyHt=beansKg*(isNeg?priceNeg:priceCoop);
  const vatIn=isNeg?rate(buyHt,1925):0;
  const withholding=!isNeg?rate(buyHt,withholdingBp):0;
  const cashOutBuy=buyHt+vatIn+withholding;
  const salesHt=chocKg*(isExport?sellExport:sellLocal);
  const exciseOut=!isExport?rate(Math.floor(salesHt/1000)*1000,exciseBp):0;
  const vatBaseOut=!isExport?Math.floor((salesHt+exciseOut)/1000)*1000:0;
  const vatOut=!isExport?rate(vatBaseOut,1925):0;
  const cashInSales=salesHt+exciseOut+vatOut;
  const netVat=vatOut-vatIn;
  const vatPayable=Math.max(0,netVat);
  const vatCredit=Math.max(0,-netVat);
  const econMargin=salesHt-buyHt-otherCosts;
  const immediateCashFlow=cashInSales-cashOutBuy-otherCosts-vatPayable-exciseOut;
  return {id,title,isNeg,isExport,beansKg,chocKg,buyHt,vatIn,withholding,cashOutBuy,salesHt,exciseOut,vatOut,cashInSales,vatPayable,vatCredit,econMargin,immediateCashFlow};
 }
 const scenarios=[
  runScenario('A_C','Scénario 1 : Coopératives → Marché Local',false,false),
  runScenario('A_D','Scénario 2 : Coopératives → Export (CEMAC/ZLECAf)',false,true),
  runScenario('B_C','Scénario 3 : Négociants (TVA) → Marché Local',true,false),
  runScenario('B_D','Scénario 4 : Négociants (TVA) → Export (CEMAC/ZLECAf)',true,true)
 ];
 // Modèle hybride paramétrable (ex. 70% Négociant / 30% Coopérative et 60% Local / 40% Export)
 const shareNeg=Math.min(100,positive(p.shareNeg??70,'Part achat négociants (%)'));
 const shareLocal=Math.min(100,positive(p.shareLocal??60,'Part vente locale (%)'));
 const kgNeg=Math.round((beansKg*shareNeg)/100),kgCoop=beansKg-kgNeg;
 const kgLocal=Math.round((chocKg*shareLocal)/100),kgExport=chocKg-kgLocal;
 const buyNegHt=kgNeg*priceNeg,vatIn=rate(buyNegHt,1925);
 const buyCoopHt=kgCoop*priceCoop,withholding=rate(buyCoopHt,withholdingBp);
 const totalBuyCashOut=buyNegHt+vatIn+buyCoopHt+withholding;
 const salesLocalHt=kgLocal*sellLocal,salesExportHt=kgExport*sellExport;
 const exciseOut=rate(Math.floor(salesLocalHt/1000)*1000,exciseBp);
 const vatOut=rate(Math.floor((salesLocalHt+exciseOut)/1000)*1000,1925);
 const totalSalesCashIn=salesLocalHt+exciseOut+vatOut+salesExportHt;
 const netVat=vatOut-vatIn;
 const vatPayable=Math.max(0,netVat),vatCredit=Math.max(0,-netVat);
 const netCashMonth=totalSalesCashIn-totalBuyCashOut-otherCosts-vatPayable-exciseOut;
 const econProfitMonth=(salesLocalHt+salesExportHt)-(buyNegHt+buyCoopHt)-otherCosts;
 return {scenarios,hybrid:{beansKg,chocKg,shareNeg,shareCoop:100-shareNeg,shareLocal,shareExport:100-shareLocal,buyNegHt,vatIn,buyCoopHt,withholding,totalBuyCashOut,salesLocalHt,salesExportHt,exciseOut,vatOut,totalSalesCashIn,vatPayable,vatCredit,otherCosts,netCashMonth,econProfitMonth}};
}

function entry(lines){if(!Array.isArray(lines)||lines.length<2)throw Error('Au moins deux lignes requises');let d=0,c=0;for(const l of lines){if(!/^\d{2,8}$/.test(String(l.account)))throw Error('Compte requis : 2 à 8 chiffres');const ld=positive(l.debit),lc=positive(l.credit);if((ld>0)===(lc>0))throw Error('Chaque ligne doit porter un débit OU un crédit positif');d+=ld;c+=lc;}if(d!==c)throw Error('Écriture déséquilibrée : débit '+d+' / crédit '+c);if(d===0)throw Error('Écriture vide');return {debit:d,credit:c};}
function balance(entries){const m={};for(const e of entries){entry(e.lines);for(const l of e.lines){m[l.account]??={account:l.account,debit:0,credit:0};m[l.account].debit+=Number(l.debit);m[l.account].credit+=Number(l.credit);}}return Object.values(m).sort((a,b)=>a.account.localeCompare(b.account));}
function parseBrief(s){
 const txt=String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();let r={};
 const name=String(s).split(',')[0].trim();if(name)r.name=name.slice(0,100);
 if(/\bsa\b/.test(txt))r.form='SA';if(/\bsarl\b/.test(txt))r.form='SARL';if(/\bsas\b/.test(txt))r.form='SAS';if(/cooper|coop/.test(txt))r.form='coop';if(/individuelle|boutique/.test(txt))r.form='EI';
 if(/cacao|chocolat/.test(txt))r.activity='cacao';else if(/liberal/.test(txt))r.activity='liberal';else if(/commerce|boutique/.test(txt))r.activity='commerce';
 const ca=txt.match(/\bca\s*[:=]?\s*([\d][\d .]*(?:,\d+)?)\s*(millions?|milliards?)?/);if(ca){const n=Number(ca[1].replace(/[ .]/g,'').replace(',','.'))*(ca[2]?.startsWith('milliard')?1e9:ca[2]?1e6:1);if(Number.isSafeInteger(n)&&n<=MAX)r.ca=n;}
 const emp=txt.match(/(\d+)\s*(?:employ|salari)/);if(emp)r.employees=Number(emp[1]);
 if(/export/.test(txt))r.exporting=true;
 return r;
}
function validateImport(x){if(!x||x.schema!=='fiscalibre-demo-1'||!Array.isArray(x.cases)||x.cases.length>100)throw Error('Format de dossier non reconnu');for(const c of x.cases){if(!c.id||typeof c.name!=='string'||c.name.length>100||!Array.isArray(c.entries))throw Error('Dossier invalide');diagnose(c);positive(c.employees,'Effectif');for(const k of ['tax','pay','cost','audit'])if(!c[k]||typeof c[k]!=='object'||Array.isArray(c[k]))throw Error('Données de simulation manquantes : '+k);for(const k of ['local','export','exciseBase','exciseBp','deductible','credit','vatWithheld','add','deduct','annualCa','advance'])positive(c.tax[k],k);money(c.tax.profit);for(const k of ['qty','price','material','process','transport','fixed'])positive(c.cost[k],k);if(c.entries.length>5000)throw Error('Journal trop volumineux');let ids=new Set();for(const e of c.entries){if(typeof e.id!=='string'||!/^[-a-zA-Z0-9.]+$/.test(e.id)||ids.has(e.id)||typeof e.label!=='string'||e.label.length>500||typeof e.date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(e.date))throw Error('Écriture invalide ou dupliquée');ids.add(e.id);entry(e.lines);}}return x;}
function parsePurchase(s){const text=String(s);if(!/achat/i.test(text)||!/cacao/i.test(text))throw Error('Cet assistant pilote reconnaît les achats de cacao. Utilisez le journal pour les autres opérations.');const m=text.match(/[:=]\s*([\d][\d .]*)\s*(?:FCFA|XAF)?/i);if(!m)throw Error('Ajoutez le montant après deux-points, par exemple : 1000000 FCFA.');const amount=positive(m[1].replace(/[ .]/g,''));if(amount===0)throw Error('Le montant doit être positif');const supplier=text.match(/(?:immatriculée?|immatriculee?)\s+([^:]+):/i)?.[1]?.trim()||'Fournisseur à confirmer';return {amount,supplier,unregistered:/non\s+immatricul/i.test(text),raw:text.slice(0,1000)};}
function purchase(x){const amount=positive(x.amount,'Total achat');if(amount===0)throw Error('Achat nul');if(!['none','unknown'].includes(x.vat))throw Error('Le pilote d’achat cacao couvre uniquement le cas sans TVA déductible ; utilisez le journal professionnel pour les autres cas.');const blocked=x.vat==='unknown'||x.withholding!=='none'||!x.proof||!x.date||!x.amountConfirmed;let lines=[{account:'6021',debit:amount,credit:0},{account:'4011',debit:0,credit:amount}];const payment=x.payment==='bank'?[{account:'4011',debit:amount,credit:0},{account:'521',debit:0,credit:amount}]:x.payment==='cash'?[{account:'4011',debit:amount,credit:0},{account:'571',debit:0,credit:amount}]:null;return {amount,lines,payment,blocked,analytical:'Approvisionnement / cacao / fournisseur '+x.supplier,missing:[...(x.vat==='unknown'?['Traitement TVA du produit et du vendeur']:[]),...(x.withholding!=='none'?['Nature et applicabilité de la retenue fiscale']:[]),...(!x.proof?['Pièce et réception']:[]),...(!x.date?['Date']:[]),...(!x.amountConfirmed?['Sens du montant total']:[])]};}

/* === NOUVEAU : TRADUCTEUR D'OPÉRATIONS MULTI-SCÉNARIOS EN LANGAGE COURANT === */
function smartOperation(kind,opts={}){
 const amount=positive(opts.amount??1000000,'Montant');if(amount===0)throw Error('Montant positif requis');
 const partner=String(opts.partner||'Partenaire').trim()||'Partenaire';
 const payAccount=opts.payMode==='cash'?'571':'521';
 const enrich=lines=>lines.map(l=>{const info=explainAccount(l.account);return {...l,label:info.label,refBilan:info.refBilan,refLabel:info.refLabel,plain:info.plain,why:l.why||info.why};});
 switch(kind){
  case 'cacao_coop':
   return {
    title:'Achat de fèves de cacao à une coopérative (sans TVA)',
    summary:`Achat de matières premières (${partner}) pour ${amount.toLocaleString('fr-FR')} XAF.`,
    lines:enrich([
     {account:'6021',debit:amount,credit:0,why:'On débite 6021 (Achats de matières premières, ligne RC) et non 6011 (Marchandises) car les fèves vont être transformées en chocolat à l’usine.'},
     {account:'4011',debit:0,credit:amount,why:`On crédite 4011 (Fournisseurs, ligne DJ) pour constater la dette envers ${partner} avant le paiement.`}
    ]),
    analytic:'Centre Approvisionnement · Lot Fèves Cacao · '+partner,
    taxNote:'Vérifier le statut exact de la coopérative (produits du cru art. 128 CGI vs revente) et le bordereau d’achat.'
   };
  case 'cacao_negociant_tva':{
   const vat=rate(amount,1925),ttc=amount+vat;
   return {
    title:'Achat de fèves ou intrants à un négociant assujetti à la TVA (19,25 %)',
    summary:`Achat HT ${amount.toLocaleString('fr-FR')} XAF + TVA récupérable ${vat.toLocaleString('fr-FR')} XAF = TTC ${ttc.toLocaleString('fr-FR')} XAF.`,
    lines:enrich([
     {account:'6021',debit:amount,credit:0,why:'Seul le montant Hors Taxes (HT) constitue une charge d’achat (ligne RC).'},
     {account:'4452',debit:vat,credit:0,why:'La TVA de 19,25 % sur facture régulière avec NIU (réglée par voie traçable si >= 100 000 XAF, art. 143 CGI) est une créance sur l’État (ligne BJ) et non une charge.'},
     {account:'4011',debit:0,credit:ttc,why:`On doit au fournisseur ${partner} le montant total TTC (ligne DJ).`}
    ]),
    analytic:'Centre Approvisionnement · Intrant taxable · '+partner,
    taxNote:'Attention (art. 143 CGI) : toute facture >= 100 000 XAF payée en espèces perd le droit à déduction de la TVA ! Privilégiez virement, chèque ou mobile money traçable.'
   };
  }
  case 'eneo_elec':{
   const vat=rate(amount,1925),ttc=amount+vat;
   return {
    title:'Facture d’électricité industrielle ENEO (Tempérage & Torréfaction)',
    summary:`Consommation électrique HT ${amount.toLocaleString('fr-FR')} XAF + TVA ${vat.toLocaleString('fr-FR')} XAF.`,
    lines:enrich([
     {account:'6052',debit:amount,credit:0,why:'En SYSCOHADA, l’électricité s’enregistre en 6052 (Fournitures non stockables - Électricité, ligne RE) et non en 62/63.'},
     {account:'4452',debit:vat,credit:0,why:'TVA récupérable sur achat d’énergie industrielle (ligne BJ).'},
     {account:'4011',debit:0,credit:ttc,why:'Dette envers le fournisseur ENEO (ligne DJ).'}
    ]),
    analytic:'Centre Production Usine · Charge variable indirecte (Énergie machines)',
    taxNote:'Conserver la facture normalisée ENEO portant le NIU de l’entreprise.'
   };
  }
  case 'vente_locale_choco':{
   const excise=rate(Math.floor(amount/1000)*1000,500);
   const vatBase=Math.floor((amount+excise)/1000)*1000;
   const vat=rate(vatBase,1925);
   const ttc=amount+excise+vat;
   return {
    title:'Vente locale de chocolats finis (avec Droits d’accises 5 % + TVA 19,25 %)',
    summary:`Vente HT ${amount.toLocaleString('fr-FR')} XAF + Accises (5 %) ${excise.toLocaleString('fr-FR')} XAF + TVA (sur HT + Accises) ${vat.toLocaleString('fr-FR')} XAF = TTC ${ttc.toLocaleString('fr-FR')} XAF.`,
    lines:enrich([
     {account:'411',debit:ttc,credit:0,why:`Le client (${partner}) doit payer le montant total TTC (ligne BI de l’actif).`},
     {account:'702',debit:0,credit:amount,why:'On crédite 702 (Ventes de produits finis, ligne TB) et non 701 (Marchandises) car l’usine a fabriqué les tablettes.'},
     {account:'446',debit:0,credit:excise,why:'Droits d’accises à taux réduit de 5 % (art. 142 CGI pour positions 1806.20 à 180690) collectés pour l’État (ligne DK).'},
     {account:'443',debit:0,credit:vat,why:'TVA collectée à 19,25 % calculée sur (Prix HT + Droits d’accises) conformément à l’art. 136 CGI (ligne DK).'}
    ]),
    analytic:'Centre Commercialisation · Canal Marché Local · '+partner,
    taxNote:'Règle d’or CGI art. 136 : les droits d’accises entrent dans la base de calcul de la TVA locale !'
   };
  }
  case 'vente_export_choco':
   return {
    title:'Vente à l’exportation de chocolats (Zone CEMAC / ZLECAf · TVA Taux Zéro)',
    summary:`Exportation HT ${amount.toLocaleString('fr-FR')} XAF facturée au taux 0 % de TVA.`,
    lines:enrich([
     {account:'411',debit:amount,credit:0,why:`Créance sur le client étranger (${partner}) inscrite à l’actif (ligne BI).`},
     {account:'702',debit:0,credit:amount,why:'Chiffre d’affaires export de produits finis fabriqués par l’entreprise (ligne TB).'}
    ]),
    analytic:'Centre Commercialisation · Canal Export CEMAC/ZLECAf · '+partner,
    taxNote:'Le taux 0 % (art. 142 CGI) conserve le droit à déduction de la TVA amont, mais exige la déclaration douanière de sortie effective et l’attestation de rapatriement des fonds (art. 149 CGI).'
   };
  case 'depreciation_stock':
   return {
    title:'Dépréciation d’un lot de stock (fèves humides ou chocolats abîmés)',
    summary:`Constatation d’une perte de valeur probable de ${amount.toLocaleString('fr-FR')} XAF sur le stock.`,
    lines:enrich([
     {account:'6593',debit:amount,credit:0,why:'POURQUOI 6593 ET NON 659 OU 6594 ? 659 est le compte-père générique ; le « 3 » final de 6593 désigne spécifiquement les STOCKS (Classe 3), tandis que 6594 désigne les créances (Classe 4) et 681 les immobilisations (Classe 2).'},
     {account:'392',debit:0,credit:amount,why:'On crédite 392 (ou 39) : le « 9 » en 2e position indique une dépréciation qui vient en colonne soustractive de la ligne BB (Stocks) à l’Actif du bilan.'}
    ]),
    analytic:'Inventaire & Contrôle Qualité · Dépréciation stock',
    taxNote:'Pour être fiscalement déductible à l’IS, la dépréciation doit être nettement précisée et justifiée par un procès-verbal ou constat contradictoire.'
   };
  case 'depreciation_client':
   return {
    title:'Dépréciation d’une créance client douteuse (risque d’impayé)',
    summary:`Constatation d’un risque d’impayé probable de ${amount.toLocaleString('fr-FR')} XAF chez le client ${partner}.`,
    lines:enrich([
     {account:'6594',debit:amount,credit:0,why:'On utilise 6594 (Charges pour dépréciations sur créances, ligne RJ) car le « 4 » final renvoie aux créances de Classe 4 (et non 6593 réservé aux stocks ni 651 réservé aux pertes définitives).'},
     {account:'491',debit:0,credit:amount,why:'Le compte 491 (9 en 2e position = dépréciation) réduit la valeur nette de la ligne BI (Clients) à l’Actif du bilan.'}
    ]),
    analytic:'Centre Administration & Recouvrement · '+partner,
    taxNote:'La dépréciation doit porter sur une créance individualisée et faire l’objet de relances ou procédures prouvant le risque.'
   };
  case 'amortissement_machine':
   return {
    title:'Dotation annuelle aux amortissements des machines industrielles',
    summary:`Constatation de l’usure annuelle du matériel industriel (${amount.toLocaleString('fr-FR')} XAF).`,
    lines:enrich([
     {account:'6813',debit:amount,credit:0,why:'On utilise 6813 (Dotations aux amortissements des immobilisations corporelles, ligne RL) car il s’agit d’un bien durable de Classe 2 (et non 6593/6594 qui concernent l’actif circulant).'},
     {account:'284',debit:0,credit:amount,why:'Le « 8 » en 2e position (284) indique l’amortissement cumulé du matériel (241/244), inscrit en soustraction sur la ligne AM de l’Actif.'}
    ]),
    analytic:'Centre Production Usine · Coût fixe d’amortissement technique',
    taxNote:'Vérifier que les taux d’amortissement respectent les barèmes admis par le CGI camerounais.'
   };
  case 'achat_machine':{
   const vat=rate(amount,1925),ttc=amount+vat;
   return {
    title:'Acquisition d’une machine industrielle neuve (Torréfacteur / Concheuse)',
    summary:`Investissement HT ${amount.toLocaleString('fr-FR')} XAF + TVA récupérable ${vat.toLocaleString('fr-FR')} XAF.`,
    lines:enrich([
     {account:'241',debit:amount,credit:0,why:'Une machine qui sert plusieurs années n’est pas une charge immédiate (classe 6) : c’est un Actif Immobilisé (compte 241, ligne AM sous AI).'},
     {account:'4452',debit:vat,credit:0,why:'TVA récupérable sur immobilisations (4451/4452, ligne BJ).'},
     {account:payAccount,debit:0,credit:ttc,why:`Décaissement par ${payAccount==='521'?'Banque (521)':'Caisse (571)'} (ou crédit 481 Fournisseur d’investissement si acheté à crédit).`}
    ]),
    analytic:'Investissement Industriel · Ligne Chocolaterie',
    taxNote:'Inscrire immédiatement la machine au registre des immobilisations avec sa date de mise en service.'
   };
  }
  case 'loyer_retenue':{
   const rts=rate(amount,1500),netRent=amount-rts;
   return {
    title:'Paiement du loyer d’entrepôt à un bailleur particulier (avec Retenue 15 %)',
    summary:`Loyer brut ${amount.toLocaleString('fr-FR')} XAF : ${netRent.toLocaleString('fr-FR')} XAF versés au bailleur et ${rts.toLocaleString('fr-FR')} XAF (15 %) retenus pour la DGI.`,
    lines:enrich([
     {account:'622',debit:amount,credit:0,why:'La charge locative de l’entreprise est le loyer brut total (622, ligne RH).'},
     {account:payAccount,debit:0,credit:netRent,why:`Montant net effectivement versé au propriétaire (85 % du loyer) via ${payAccount==='521'?'Banque':'Caisse'}.`},
     {account:'447',debit:0,credit:rts,why:'Retenue à la source de 15 % sur les revenus fonciers prélevée sur le bailleur et à reverser à la DGI (compte 447, ligne DK).'}
    ]),
    analytic:'Centre Structure & Logistique · Loyer fixe entrepôt',
    taxNote:'L’absence de retenue ou de reversement expose le locataire professionnel au rejet de la charge et aux pénalités.'
   };
  }
  default:
   throw Error('Scénario d’opération inconnu');
 }
}

function inventory(openQty,openValue,moves,method){let q=positive(openQty),v=positive(openValue);if(q===0&&v!==0)throw Error('Valeur sans quantité initiale');let physical=q,totalQ=q,totalV=v;for(const m of moves){const z=positive(m.qty);if(!z)throw Error('Quantité nulle');if(m.type==='in'){const val=positive(m.value);physical+=z;totalQ+=z;totalV+=val}else if(m.type==='out'){physical-=z;if(physical<0)throw Error('Stock négatif dans l’ordre des mouvements')}else throw Error('Type entrée/sortie invalide');}let consumed=0;const rows=[];const ratio=(a,b,c)=>Number((BigInt(a)*BigInt(b)*2n+BigInt(c))/(2n*BigInt(c)));for(const m of moves){const z=Number(m.qty);let value;if(m.type==='in'){value=Number(m.value);q+=z;v+=value}else{value=method==='period'?ratio(totalV,z,totalQ):ratio(v,z,q);q-=z;v-=value;consumed+=value;}rows.push({...m,value,qtyEnd:q,valueEnd:v,cmup:q?v/q:0})}if(method==='period'){const ending=totalQ?ratio(totalV,q,totalQ):0;consumed=totalV-ending;v=ending;}return {qty:q,value:v,consumed,availableValue:totalV,availableQty:totalQ,cmup:method==='period'?(totalQ?totalV/totalQ:0):(q?v/q:0),rows};}
function statement(entries,mapping){const rows=balance(entries);let assets=0,liabilities=0,equity=0,income=0,expense=0;const missing=[];for(const r of rows){const type=mapping[r.account],net=r.debit-r.credit;if(!type){missing.push(r.account);continue}if(type==='asset')assets+=net;else if(type==='liability')liabilities-=net;else if(type==='equity')equity-=net;else if(type==='income')income-=net;else if(type==='expense')expense+=net;else throw Error('Affectation inconnue');}const result=income-expense;return {rows,assets,liabilities,equity,income,expense,result,passif:liabilities+equity+result,difference:assets-liabilities-equity-result,missing};}

/* === NOUVEAU : ÉTATS FINANCIERS DÉTAILLÉS SYSCOHADA (BILAN BRUT/AMORT/NET, RÉSULTAT & SIG) === */
const BILAN_ACTIF_LINES=[
 {ref:'AD',label:'Immobilisations incorporelles (AE Frais de dév. 211, AF Brevets & logiciels 213)',section:'Actif immobilisé (Classe 2 · AZ)',plain:'Biens immatériels durables (logiciels 213 sur AF, frais de développement 211 sur AE), amortis via 281.',accounts:['21','281','291']},
 {ref:'AJ',label:'Terrains (sous AI Immobilisations corporelles)',section:'Actif immobilisé (Classe 2 · AZ)',plain:'Terrains nus (222) ou bâtis (223) appartenant à l’entreprise (ligne AJ sous AI).',accounts:['22','282','292']},
 {ref:'AK',label:'Bâtiments (sous AI Immobilisations corporelles)',section:'Actif immobilisé (Classe 2 · AZ)',plain:'Usines, entrepôts et bureaux possédés par l’entreprise (231, amortis via 283).',accounts:['231','232','233','237','2831','2832','2833','2837','283','293']},
 {ref:'AL',label:'Aménagements, agencements et installations (sous AI)',section:'Actif immobilisé (Classe 2 · AZ)',plain:'Installations techniques et agencements des locaux (234, 235, 238).',accounts:['234','235','238','2834','2835','2838']},
 {ref:'AM',label:'Matériel, mobilier et actifs biologiques (sous AI)',section:'Actif immobilisé (Classe 2 · AZ)',plain:'Machines industrielles (torréfacteurs, concheuses 241) et mobilier (244), diminués de leur usure (284 sauf 2845).',accounts:['241','242','243','244','246','247','248','2841','2842','2843','2844','284','294']},
 {ref:'AN',label:'Matériel de transport (sous AI)',section:'Actif immobilisé (Classe 2 · AZ)',plain:'Camions de collecte et véhicules de livraison (245, amortis via 2845).',accounts:['245','2845','2945']},
 {ref:'AP',label:'Avances et acomptes versés sur immobilisations (sous AI)',section:'Actif immobilisé (Classe 2 · AZ)',plain:'Acomptes versés aux fournisseurs d’équipements durables (251, 252).',accounts:['25']},
 {ref:'AQ',label:'Immobilisations financières (AR Titres de participation 26, AS Autres immo. financières 27)',section:'Actif immobilisé (Classe 2 · AZ)',plain:'Titres de participation (26 sur AR), titres immobilisés (274 sur AS) et dépôts & cautionnements versés (275 sur AS : ENEO, Camwater, bailleur).',accounts:['26','27','296','297']},
 {ref:'BA',label:'Actif circulant HAO',section:'Actif circulant (Classes 3 & 4 · BK)',plain:'Créances sur cessions d’immobilisations et actif circulant HAO (485, 488).',accounts:['485','488']},
 {ref:'BB',label:'Stocks et encours',section:'Actif circulant (Classes 3 & 4 · BK)',plain:'Marchandises (31), matières premières (32/321), autres approvisionnements (33), produits en cours (34), produits finis (36/361) et produits intermédiaires (37/371), moins dépréciations (39/391/392).',accounts:['31','32','33','34','35','36','37','38','39']},
 {ref:'BH',label:'Fournisseurs, avances versées (sous BG Créances)',section:'Actif circulant (Classes 3 & 4 · BK)',plain:'Acomptes déjà avancés aux planteurs ou fournisseurs sur commandes non encore livrées (409/4091).',accounts:['409']},
 {ref:'BI',label:'Clients (sous BG Créances)',section:'Actif circulant (Classes 3 & 4 · BK)',plain:'Factures dues par les clients (411, 416), diminuées des dépréciations pour impayés probables (491).',accounts:['411','412','413','414','415','416','418','491']},
 {ref:'BJ',label:'Autres créances (dont TVA récupérable 445, sous BG)',section:'Actif circulant (Classes 3 & 4 · BK)',plain:'Créances sur l’État (TVA déductible 4451/4452, crédits de TVA), avances au personnel (421) et débiteurs divers.',accounts:['421','445','45','46','47']},
 {ref:'BQ',label:'Titres de placement (sous BT Trésorerie-Actif)',section:'Trésorerie-Actif (Classe 5 · BT)',plain:'Titres négociables à court terme (50, dépréciés via 590).',accounts:['50','590']},
 {ref:'BS',label:'Banques, chèques postaux, caisse et assimilés (sous BT)',section:'Trésorerie-Actif (Classe 5 · BT)',plain:'Liquidités disponibles en banque (521), monnaie électronique Mobile Money (552) et caisse (571).',accounts:['51','52','53','54','55','57','58','591']}
];
const BILAN_PASSIF_LINES=[
 {ref:'CA',label:'Capital (et CB Capital non appelé 109)',section:'Capitaux propres (Classe 1 · CP)',plain:'Apports d’origine des actionnaires ou associés (101) ou de l’exploitant individuel (103).',accounts:['10']},
 {ref:'CF',label:'Réserves indisponibles (et CG Réserves libres 118)',section:'Capitaux propres (Classe 1 · CP)',plain:'Réserve légale (111), réserves statutaires (112) et réserves libres (118 sur CG).',accounts:['11']},
 {ref:'CH',label:'Report à nouveau (+ ou -)',section:'Capitaux propres (Classe 1 · CP)',plain:'Bénéfices non distribués (121) ou pertes cumulées (129) des exercices antérieurs.',accounts:['12']},
 {ref:'CJ',label:'Résultat net de l’exercice (+ bénéfice / - perte)',section:'Capitaux propres (Classe 1 · CP)',plain:'Gain (131) ou perte (139) généré par l’activité de l’exercice (égal à la ligne XI du Compte de résultat).',accounts:['13']},
 {ref:'CL',label:'Subventions d’investissement (et CM Provisions réglementées)',section:'Capitaux propres (Classe 1 · CP)',plain:'Subventions d’équipement (14) et provisions réglementées (15).',accounts:['14','15']},
 {ref:'DA',label:'Emprunts et dettes financières diverses (et DB Location-acquisition)',section:'Dettes financières (Classe 1 · DD)',plain:'Crédits bancaires à moyen et long terme (162) et dettes de location-acquisition (17).',accounts:['16','17','18']},
 {ref:'DC',label:'Provisions pour risques et charges (à plus d’un an)',section:'Dettes financières (Classe 1 · DD)',plain:'Provisions financières pour litiges et risques durables à plus d’un an (191).',accounts:['19']},
 {ref:'DH',label:'Dettes circulantes HAO (Fournisseurs d’investissements 481)',section:'Passif circulant (Classe 4 · DP)',plain:'Dettes sur acquisitions d’immobilisations (machines, camions 481).',accounts:['481','482','484']},
 {ref:'DI',label:'Clients, avances reçues',section:'Passif circulant (Classe 4 · DP)',plain:'Avances et acomptes reçus des clients sur commandes en cours (4191).',accounts:['419']},
 {ref:'DJ',label:'Fournisseurs d’exploitation',section:'Passif circulant (Classe 4 · DP)',plain:'Factures d’achats de matières premières, marchandises, emballages ou énergie restant à payer (4011, 408).',accounts:['401','402','408']},
 {ref:'DK',label:'Dettes fiscales et sociales',section:'Passif circulant (Classe 4 · DP)',plain:'Salaires nets à payer (422), cotisations CNPS (431), TVA facturée (443), droits d’accises (446), IS (441) et retenues à la source (447).',accounts:['422','423','424','425','426','427','428','43','441','442','443','444','446','447']},
 {ref:'DM',label:'Autres dettes',section:'Passif circulant (Classe 4 · DP)',plain:'Associés comptes courants créditeurs et créditeurs divers (45, 46, 47).',accounts:['45','46','47']},
 {ref:'DN',label:'Provisions pour risques à court terme (sous DP Passif circulant)',section:'Passif circulant (Classe 4 · DP)',plain:'Risques d’exploitation probables à moins d’un an (4991, par le débit de 6591).',accounts:['499','599']},
 {ref:'DR',label:'Banques, établissements financiers et crédits de trésorerie (sous DT)',section:'Trésorerie-Passif (Classe 5 · DT)',plain:'Découverts bancaires, crédits de campagne et d’escompte (561, 564, 565).',accounts:['56']}
];
const RESULTAT_LINES=[
 {ref:'TA',label:'Ventes de marchandises',kind:'income',sig:'XA',plain:'Revente en l’état de marchandises achetées sans transformation (701 / 7011 / 7012).',accounts:['701']},
 {ref:'RA',label:'Achats de marchandises',kind:'expense',sig:'XA',plain:'Coût d’achat des marchandises destinées à la revente en l’état (famille 601 : 6011, 6012, 6015).',accounts:['601']},
 {ref:'RB',label:'Variation de stocks de marchandises',kind:'expense',sig:'XA',plain:'Correction des achats par la variation du stock de marchandises (6031).',accounts:['6031']},
 {ref:'TB',label:'Ventes de produits fabriqués',kind:'income',sig:'XC',plain:'Ventes de chocolats, beurre et poudre fabriqués par l’usine (702, 703, 704).',accounts:['702','703','704']},
 {ref:'TC',label:'Travaux, services vendus',kind:'income',sig:'XC',plain:'Prestations de services et travaux facturés (705, 706).',accounts:['705','706']},
 {ref:'TD',label:'Produits accessoires',kind:'income',sig:'XC',plain:'Ports, emballages et frais accessoires refacturés aux clients (707).',accounts:['707']},
 {ref:'TE',label:'Production stockée (ou déstockage)',kind:'income',sig:'XC',plain:'Variation des stocks de produits en cours (734), produits finis (736) et produits intermédiaires (737).',accounts:['73']},
 {ref:'TF',label:'Production immobilisée (et TG Subventions d’exploitation)',kind:'income',sig:'XC',plain:'Travaux faits par l’entreprise pour elle-même (72) et subventions d’exploitation (71).',accounts:['71','72']},
 {ref:'TH',label:'Autres produits',kind:'income',sig:'XC',plain:'Produits divers de gestion courante (75, hors reprises 759).',accounts:['751','752','753','754','758']},
 {ref:'TI',label:'Transferts de charges d’exploitation',kind:'income',sig:'XC',plain:'Indemnités d’assurance ou refacturations transférant une charge d’exploitation (781).',accounts:['781']},
 {ref:'RC',label:'Achats de matières premières et fournitures liées',kind:'expense',sig:'XC',plain:'Achats de fèves de cacao, sucre, lait en poudre destinés à la transformation (famille 602 : 6021, 6022, 6025).',accounts:['602']},
 {ref:'RD',label:'Variation de stocks de matières premières et fournitures liées',kind:'expense',sig:'XC',plain:'Retranche le stock final de matières premières non encore consommées (6032).',accounts:['6032']},
 {ref:'RE',label:'Autres achats (matières consommables, emballages, eau, électricité, carburants)',kind:'expense',sig:'XC',plain:'Achats stockés de consommables/carburants (604/6042), emballages (608), eau Camwater (6051), électricité ENEO (6052), carburants non stockables (6053) et entretien non stockable (6054).',accounts:['604','605','608']},
 {ref:'RF',label:'Variation de stocks d’autres approvisionnements',kind:'expense',sig:'XC',plain:'Variation des stocks de matières consommables et d’emballages (6033).',accounts:['6033']},
 {ref:'RG',label:'Transports',kind:'expense',sig:'XC',plain:'Transports sur achats (611), sur ventes (612), pour tiers (613), du personnel (614) et déplacements (618). Exclusivement la classe 61 !',accounts:['611','612','613','614','616','618']},
 {ref:'RH',label:'Services extérieurs',kind:'expense',sig:'XC',plain:'Locations (622), entretien, réparations et maintenance (624 : 6241 immobilier, 6242 mobilier/camions, 6243 maintenance), assurances (625), publicité (627), frais bancaires (631), honoraires et conseils (632/6324).',accounts:['62','63','615']},
 {ref:'RI',label:'Impôts et taxes',kind:'expense',sig:'XC',plain:'Patente (6412), CFC patronal & FNE (6413), droits d’enregistrement et de timbre (646).',accounts:['64']},
 {ref:'RJ',label:'Autres charges (dont charges pour dépréciations à court terme 659)',kind:'expense',sig:'XC',plain:'Pertes sur créances irrécouvrables (651), charges diverses et pénalités (658/6581) et dépréciations d’actif circulant (6591 risques CT, 6593 stocks, 6594 créances).',accounts:['65']},
 {ref:'RK',label:'Charges de personnel',kind:'expense',sig:'XD',plain:'Salaires bruts (661), indemnités (663) et cotisations sociales patronales CNPS (664).',accounts:['66']},
 {ref:'TJ',label:'Reprises d’amortissements, provisions et dépréciations d’exploitation',kind:'income',sig:'XE',plain:'Reprises de dépréciations sur stocks (7593), sur créances (7594) et reprises d’amortissements/provisions (791, 798).',accounts:['759','791','798']},
 {ref:'RL',label:'Dotations aux amortissements, aux provisions et dépréciations',kind:'expense',sig:'XE',plain:'Dotations aux amortissements des immobilisations (6812, 6813) et provisions d’exploitation à long terme (691).',accounts:['681','691']},
 {ref:'TK',label:'Revenus financiers et assimilés (et TL/TM Reprises & transferts financiers)',kind:'income',sig:'XF',plain:'Intérêts de prêts et produits financiers (771), gains de change (776) et reprises financières (797).',accounts:['77','787','797']},
 {ref:'RM',label:'Frais financiers et charges assimilées (et RN Dotations financières)',kind:'expense',sig:'XF',plain:'Intérêts des emprunts bancaires (671), pertes de change (676) et dotations financières (687, 697).',accounts:['67','687','697']},
 {ref:'TN',label:'Produits des cessions d’immobilisations (et TO Autres Produits HAO)',kind:'income',sig:'XH',plain:'Prix de cession des immobilisations (82 sur TN) et autres produits HAO (84, 86, 88 sur TO).',accounts:['82','84','86','88']},
 {ref:'RO',label:'Valeurs comptables des cessions d’immobilisations (et RP Autres Charges HAO)',kind:'expense',sig:'XH',plain:'Valeur nette comptable des immobilisations cédées (81 sur RO) et charges HAO (83, 85 sur RP).',accounts:['81','83','85']},
 {ref:'RQ',label:'Participation des travailleurs (87)',kind:'expense',sig:'XI',plain:'Participation légale ou contractuelle des travailleurs aux bénéfices (87).',accounts:['87']},
 {ref:'RS',label:'Impôts sur le résultat (IS · 891)',kind:'expense',sig:'XI',plain:'Impôt sur les sociétés ou minimum de perception (891, ligne RS).',accounts:['89']}
];

function detailedStatement(entries,mapping){
 const base=statement(entries,mapping);
 if(base.missing.length)return {...base,actifRows:[],passifRows:[],resultatRows:[],sig:{}};
 const isContra=acc=>/^(28|29|39|49[0-8]|59)/.test(acc);
 const matchPrefix=(acc,prefixes)=>prefixes.some(p=>acc.startsWith(p));
 const actifRows=BILAN_ACTIF_LINES.map(lineDef=>{
  let brut=0,amort=0,matched=[];
  for(const r of base.rows){
   if(mapping[r.account]!=='asset')continue;
   if(matchPrefix(r.account,lineDef.accounts)){
    const net=r.debit-r.credit;
    matched.push(r.account);
    if(isContra(r.account)||net<0)amort+=Math.abs(net);
    else brut+=net;
   }
  }
  return {...lineDef,matched,brut,amort,net:brut-amort};
 });
 const capturedActif=new Set(actifRows.flatMap(x=>x.matched));
 for(const r of base.rows){
  if(mapping[r.account]==='asset'&&!capturedActif.has(r.account)){
   const bj=actifRows.find(x=>x.ref==='BJ');
   const net=r.debit-r.credit;
   bj.matched.push(r.account);
   if(isContra(r.account)||net<0)bj.amort+=Math.abs(net);else bj.brut+=net;
   bj.net=bj.brut-bj.amort;
  }
 }
 const passifRows=BILAN_PASSIF_LINES.map(lineDef=>{
  if(lineDef.ref==='CJ')return {...lineDef,matched:['Résultat calculé'],net:base.result};
  let net=0,matched=[];
  for(const r of base.rows){
   const t=mapping[r.account];
   if(t!=='liability'&&t!=='equity')continue;
   if(matchPrefix(r.account,lineDef.accounts)){
    matched.push(r.account);
    net+=(r.credit-r.debit);
   }
  }
  return {...lineDef,matched,net};
 });
 const capturedPassif=new Set(passifRows.flatMap(x=>x.matched));
 for(const r of base.rows){
  const t=mapping[r.account];
  if((t==='liability'||t==='equity')&&!capturedPassif.has(r.account)){
   const target=passifRows.find(x=>x.ref===(t==='equity'?'CH':'DK'));
   target.matched.push(r.account);
   target.net+=(r.credit-r.debit);
  }
 }
 const resMap={};
 const resultatRows=RESULTAT_LINES.map(lineDef=>{
  let amount=0,matched=[];
  for(const r of base.rows){
   const t=mapping[r.account];
   if(t!=='income'&&t!=='expense')continue;
   if(matchPrefix(r.account,lineDef.accounts)){
    matched.push(r.account);
    amount+=lineDef.kind==='income'?(r.credit-r.debit):(r.debit-r.credit);
   }
  }
  resMap[lineDef.ref]=amount;
  return {...lineDef,matched,amount};
 });
 const capturedRes=new Set(resultatRows.flatMap(x=>x.matched));
 for(const r of base.rows){
  const t=mapping[r.account];
  if((t==='income'||t==='expense')&&!capturedRes.has(r.account)){
   const target=resultatRows.find(x=>x.ref===(t==='income'?'TH':'RJ'));
   target.matched.push(r.account);
   const val=t==='income'?(r.credit-r.debit):(r.debit-r.credit);
   target.amount+=val;
   resMap[target.ref]+=val;
  }
 }
 const XA=(resMap.TA||0)-(resMap.RA||0)-(resMap.RB||0); // Marge commerciale
 const XB=(resMap.TA||0)+(resMap.TB||0)+(resMap.TC||0)+(resMap.TD||0); // Chiffre d'affaires
 const XC=XA+(resMap.TB||0)+(resMap.TC||0)+(resMap.TD||0)+(resMap.TE||0)+(resMap.TF||0)+(resMap.TH||0)+(resMap.TI||0)-(resMap.RC||0)-(resMap.RD||0)-(resMap.RE||0)-(resMap.RF||0)-(resMap.RG||0)-(resMap.RH||0)-(resMap.RI||0)-(resMap.RJ||0); // Valeur ajoutée
 const XD=XC-(resMap.RK||0); // EBE
 const XE=XD+(resMap.TJ||0)-(resMap.RL||0); // Résultat d'exploitation
 const XF=(resMap.TK||0)-(resMap.RM||0); // Résultat financier
 const XG=XE+XF; // Résultat des activités ordinaires
 const XH=(resMap.TN||0)-(resMap.RO||0); // Résultat HAO
 const XI=XG+XH-(resMap.RQ||0)-(resMap.RS||0); // Résultat net
 const totalBrutActif=actifRows.reduce((s,x)=>s+x.brut,0);
 const totalAmortActif=actifRows.reduce((s,x)=>s+x.amort,0);
 return {...base,totalBrutActif,totalAmortActif,actifRows,passifRows,resultatRows,sig:{XA,XB,XC,XD,XE,XF,XG,XH,XI}};
}


/* === NOUVEAU V2.1 : MOTEUR D'IA LOCALE (BM25 + SYNONYMES), TRADUCTEUR LANGAGE NATUREL -> JARGON PRO & GESTION BUDGÉTAIRE === */
const JARGON_DICTIONARY=[
 {natural:'Gars de brousse / Planteur sans papiers à Kumba, Obala ou Sangmélima',jargon:'Contribuable non-immatriculé (Retenue de 5 % à la source au titre du précompte sur achats, Compte 447, Absence de TVA sur produit du cru, Bordereau d’achat interne certifié)',accounts:'Débit 6021 (Matières premières pour transformation, Ligne RC) ou 6011 (Marchandises pour revente en l’état, Ligne RA) / Crédit 447 (5 %) & Crédit 571 (95 %)',domain:'Agrobusiness & Fiscalité'},
 {natural:'Grossiste de Douala avec papier des impôts (NIU & e-Billing)',jargon:'Contribuable immatriculé au Régime du Réel (Facturation de la TVA déductible à 19,25 % via plateforme e-Billing, règlement bancaire obligatoire dès 100 000 XAF)',accounts:'Débit 6011 ou 6012 + Débit 4451 (TVA 19,25 %) / Crédit 4011 ou 521',domain:'Commerce & TVA'},
 {natural:'Stock initial 100 kg de produits semi-finis (masse de cacao / beurre)',jargon:'Constatation des stocks de produits intermédiaires (Compte 371 en SYSCOHADA révisé, ou 34 Produits en cours — ne pas confondre avec 312 Marchandises B !) valorisés au CMUP d’atelier',accounts:'Débit 371 (ou 34, Ligne BB) / Crédit 737 ou 734 (Variation de la production stockée, Ligne TE)',domain:'Stocks & Analytique'},
 {natural:'Achat de cacao moisi à moitié prix en brousse (250 kg) sans reçu officiel',jargon:'Acquisition de matières premières dégradées (Famille 602 : 6021, Ligne RC) sous bordereau interne avec précompte de 5 % (447) et constatation d’une dépréciation sur stocks de matières premières motivée par PV (6593 / 392)',accounts:'Débit 6021 (ou 6011 si négoce) / Crédit 447 & 571 puis Débit 6593 / Crédit 392 (ou 391)',domain:'Agrobusiness & Audit'},
 {natural:'J’ai ravitaillé le camion de livraison à la station Total / payé l’essence du groupe électrogène',jargon:'Achat de carburants non stockables pris à la pompe (Compte 6053 en SYSCOHADA révisé, ou 6042 si stocké en cuve — attention : 6015 concerne les frais sur achats !) comptabilisé TTC (TVA non déductible art. 144 CGI)',accounts:'Débit 6053 (ou 6054, Montant TTC, Ligne RE) / Crédit 521 ou 571',domain:'Transport & Énergie'},
 {natural:'On a payé un développeur freelance à Paris ou un consultant ivoirien sur internet pour coder l’app',jargon:'Rémunération d’intermédiaires et de conseils fournie par un non-résident (Compte 6324 / 632 en SYSCOHADA révisé — ne pas confondre avec 6224 Malis sur emballages !) soumise à la retenue TSR de 15 % (Compte 447)',accounts:'Débit 6324 (100 %, Ligne RH) / Crédit 447 (TSR 15 %) & Crédit 521 (85 %)',domain:'Digital & Fiscalité internationale'},
 {natural:'Le camion de livraison a pris une amende au contrôle routier sur l’axe lourd à Edéa',jargon:'Pénalité ou amende administrative/pénale (Compte 6581) constituant une charge comptable réelle mais fiscalement NON déductible (à réintégrer obligatoirement au Tableau 22 de la DSF pour l’IS)',accounts:'Débit 6581 (Ligne RJ) / Crédit 571 (+ Réintégration fiscale DSF)',domain:'Transport & Fiscalité IS'},
 {natural:'Une partie du stock de ciment ou de maïs a pris l’eau pendant les pluies à Douala',jargon:'Charge pour dépréciation d’actifs circulants sur stocks sinistrés (Débit 6593 / Crédit 391), déductible de l’IS uniquement sur présentation d’un procès-verbal de constat ou de destruction',accounts:'Débit 6593 (Ligne RJ) / Crédit 391 (Ligne BB - Dépréc.)',domain:'BTP, Agro & Stocks'},
 {natural:'On a versé la caution pour la location de la nouvelle boutique à Yaoundé (Bastos)',jargon:'Dépôt et cautionnement versé (Compte 275 / 2751 en SYSCOHADA révisé, Ligne AS sous AQ de l’Actif — distinct de 274 Titres immobilisés et de 6222 Loyers) sans impact sur le résultat',accounts:'Débit 275 (Ligne AS/AQ Actif) / Crédit 521',domain:'Immobilier & Bilan'},
 {natural:'L’usine tourne la nuit (courant machine + repas des ouvriers)',jargon:'Charges opérationnelles d’énergie industrielle (Compte 6051 / 6052) couplées aux indemnités de panier de nuit non cotisables à la CNPS (Compte 6615)',accounts:'Débit 6051 & Débit 6615 / Crédit 4011, 422 & 521',domain:'Industrie & Paie'},
 {natural:'Jeunes recrutés en stage ou contrat FNE pour emballer les chocolats',jargon:'Bourses de stage et contrats d’insertion/apprentissage agréés FNE (Compte 6615) bénéficiant d’une exonération des cotisations patronales CNPS pendant la formation',accounts:'Débit 6615 (Ligne RK) / Crédit 422 ou 521',domain:'RH, Paie & CNPS'},
 {natural:'Panne sur le camion à Edéa / contrat de maintenance des machines',jargon:'Entretien, réparations et maintenance des biens mobiliers (Compte 624 / 6242 en SYSCOHADA révisé, Ligne RH — ne jamais confondre avec la classe 61 Transports ni avec 615 du PCG français !)',accounts:'Débit 6242 (Ligne RH) + Débit 4452 (TVA sur véhicule utilitaire) / Crédit 4011 ou 521',domain:'Maintenance & Logistique'},

 {natural:'Achat en brousse sans facture / sans reçu chez un planteur ou coopérative non immatriculée',jargon:'Approvisionnement en produits du cru auprès d’un non-immatriculé sous bordereau d’achat certifié et précompte / retenue à la source (5 %)',accounts:'Débit 6021 (Matières premières si usine, Ligne RC) ou 6011 (Marchandises si négoce, Ligne RA) / Crédit 447 (5 %) & Crédit 521/571 (95 %)',domain:'Comptabilité & Fiscalité'},
 {natural:'Marchandise ou fève de cacao abîmée, humide ou pourrie en magasin',jargon:'Dotation aux charges pour dépréciations sur stocks et encours (Actif circulant)',accounts:'Débit 6593 (Ligne RJ) / Crédit 392 ou 39 (Ligne BB - Amort./Dépréc.)',domain:'Inventaire SYSCOHADA'},
 {natural:'Client (supermarché, grossiste) qui tarde à payer ou risque de faire faillite',jargon:'Reclassement en créances douteuses ou litigieuses et constatation d’une charge pour dépréciation sur créances',accounts:'Débit 416 / Crédit 411 puis Débit 6594 (Ligne RJ) / Crédit 491 (Ligne BI)',domain:'Comptabilité générale'},
 {natural:'Client qui a définitivement disparu sans payer (perte totale)',jargon:'Perte sur créances clients irrécouvrables (charge définitive et non simple dépréciation)',accounts:'Débit 651 (Ligne RJ) / Crédit 411 ou 416',domain:'Comptabilité générale'},
 {natural:'Usure annuelle des machines de l’usine (torréfacteur, broyeur, camion)',jargon:'Dotation aux amortissements des immobilisations corporelles (linéaire ou accéléré/dégressif)',accounts:'Débit 6813 (Ligne RL) / Crédit 2841 ou 2845 (Ligne AL/AM)',domain:'Immobilisations Classe 2'},
 {natural:'Mélanger des stocks achetés à des prix différents pour connaître le vrai coût d’un kilo',jargon:'Valorisation des stocks au Coût Moyen Unitaire Pondéré (CMUP après chaque entrée ou CMUP périodique)',accounts:'Débit 32 (Ligne BB) / Crédit 6032 (Ligne RD)',domain:'Stocks & Analytique'},
 {natural:'Sortir d’abord du magasin les premiers sacs achetés (les plus anciens)',jargon:'Méthode d’épuisement des lots PEPS (Premier Entré, Premier Sorti) ou FIFO (First In, First Out)',accounts:'Comptes 31 / 32 / 36 et variations 6031 / 6032 / 736',domain:'Stocks SYSCOHADA'},
 {natural:'Combien de tablettes il faut vendre au minimum pour ne pas perdre d’argent',jargon:'Seuil de rentabilité (Point Mort) déterminé par le rapport Coûts Fixes / Marge sur Coût Variable (SR = CF / TxMCV)',accounts:'Analyse de gestion (Classes 6 et 7 ventilées en charges variables et fixes)',domain:'Comptabilité analytique'},
 {natural:'Dépenses qui tombent chaque mois même quand l’usine est fermée (loyer, gardien)',jargon:'Charges fixes (ou charges de structure) invariantes au volume de production',accounts:'Comptes 622 (Loyers), 625 (Assurances), 661 (Salaires structure), 6813 (Amortissements)',domain:'Comptabilité analytique'},
 {natural:'Dépenses qui augmentent dès qu’on fabrique plus de chocolat (cacao, alu, courant machine)',jargon:'Charges variables (ou charges opérationnelles) proportionnelles au volume d’activité',accounts:'Comptes 6021 (Matières), 604 (Emballages), 6052 (Électricité ENEO), 612 (Transport sur ventes)',domain:'Comptabilité analytique'},
 {natural:'Différence entre le budget prévu en début de mois et ce qu’on a vraiment dépensé',jargon:'Contrôle budgétaire et analyse des écarts (écart global décomposé en écart sur coût et écart sur volume)',accounts:'Tableau de bord budgétaire & analytique',domain:'Gestion budgétaire'},
 {natural:'Argent coincé dans les stocks au magasin et chez les clients qui n’ont pas encore payé',jargon:'Besoin en Fonds de Roulement d’exploitation (BFR = Stocks + Créances d’exploitation − Dettes fournisseurs)',accounts:'Classes 3 + 41 − 40',domain:'Analyse financière & Trésorerie'},
 {natural:'Transformer une partie du salaire en transport et repas du soir pour réduire les charges CNPS',jargon:'Optimisation de l’assiette sociale par disjonction des indemnités représentatives de frais professionnels justifiés (panier, transport)',accounts:'Compte 661 / 422 / 431',domain:'Paie & Optimisation sociale'},
 {natural:'Payer seulement les mois d’ouverture de l’usine à la mairie après une fermeture',jargon:'Proratisation de la contribution des patentes suite à déclaration de reprise d’activité après mise en sommeil',accounts:'Débit 6412 (Patentes, ligne RI) / Crédit 442 ou 521',domain:'Fiscalité locale'},
 {natural:'Taxe spéciale sur les chocolats vendus au Cameroun en plus de la TVA',jargon:'Droits d’accises ad valorem à taux réduit (5 %, art. 142 CGI) inclus dans l’assiette imposable à la TVA (art. 136 CGI)',accounts:'Crédit 446 (Accises) & Crédit 443 (TVA facturée)',domain:'Fiscalité indirecte'},
 {natural:'Vendre à l’étranger sans facturer la TVA tout en récupérant la TVA payée sur les achats',jargon:'Exportation taxée au taux zéro de TVA (0 %, art. 142 CGI) ouvrant droit à remboursement structurel des crédits de TVA (art. 149 CGI)',accounts:'Débit 411 / Crédit 7022 et créance de crédit de TVA en 445',domain:'Fiscalité export & Douane'},
 {natural:'Retenir 15 % sur le loyer du bailleur de l’entrepôt pour le verser aux impôts',jargon:'Retenue à la source sur les revenus fonciers (15 %) opérée par le locataire personne morale et reversée au Trésor',accounts:'Débit 622 (100 %) / Crédit 521 (85 %) & Crédit 447 (15 %)',domain:'Fiscalité des tiers'},
 {natural:'Papiers officiels qui prouvent que l’entreprise ne doit rien aux impôts ni à la CNPS',jargon:'Attestation de Conformité Fiscale (ACF délivrée sur Harmony DGI) et Attestation de Conformité Sociale (ACS délivrée par la CNPS, remplaçant l’APS)',accounts:'Apurement des comptes 431 (CNPS) et 441 à 447 (État)',domain:'Administration & Conformité'}
];

function buildExpertScenarios(amt){
 const A=positive(amt??1000000,'Montant');
 const r5=rate(A,500),net95=A-r5;
 const r15=rate(A,1500),net85=A-r15;
 const vat1925=rate(A,1925),ttc1925=A+vat1925;
 const exc5=rate(Math.floor(A/1000)*1000,500),vatOnExc=rate(Math.floor((A+exc5)/1000)*1000,1925),ttcChoco=A+exc5+vatOnExc;
 const dep10=rate(A,1000);
 return [
  {
   id:'q1_cacao_brousse',
   keywords:['brousse','cooperative','non immatricul','sans facture','facture normalise','planteur','bordereau','precompte','fèves','feves','cacao','6011','6021','5%','5 %','question 1'],
   question:'Question 1 : « Comment allez-vous comptabiliser l’achat de fèves de cacao en brousse auprès d’une coopérative non immatriculée, sachant qu’il n’y a pas de facture normalisée ? »',
   naturalTerm:`Achat de fèves d’une valeur de ${A.toLocaleString('fr-FR')} XAF en brousse sans facture normalisée`,
   proJargon:'Approvisionnement en matières premières agricoles (Famille 602 : compte 6021 si usine de transformation, ligne RC ; ou Famille 601 : compte 6011 si négoce pur revendant les fèves en l’état, ligne RA), exonéré de TVA (produit du cru, art. 128 CGI), matérialisé par un bordereau d’achat certifié et soumis à la retenue à la source (précompte de 5 % au crédit du compte 447).',
   trap:'Double piège (Fiscal + Nomenclature SYSCOHADA révisée) : 1) Fiscalement, connaître la règle de déductibilité des charges, le bordereau d’achat pour non-immatriculé et la retenue à la source (précompte de 5 %, compte 447) ; 2) Comptablement, ne pas mélanger la famille 602 (Achats de matières premières destinées à être transformées, ex. chocolaterie : compte 6021, ligne RC) et la famille 601 (Achats de marchandises revendues en l’état : compte 6011, ligne RA) !',
   response:'« En l’absence de facture normalisée, j’édite un bordereau d’achat pour non-immatriculé certifié par l’administration fiscale. Le cacao étant un produit du cru exonéré de TVA (art. 128 CGI), j’opère la retenue à la source (précompte) de 5 % au crédit du compte 447. Sur le plan de la nomenclature SYSCOHADA révisée, s’agissant d’une chocolaterie qui transforme les fèves, je débite le compte 6021 (Achats de matières premières dans la région OHADA, ligne RC) — tandis que le compte 6011 (ligne RA) serait réservé à un négociant revendant les fèves en l’état sans transformation. »',
   boardHeader:`Pour un achat de fèves d’une valeur de ${A.toLocaleString('fr-FR')} XAF en brousse :`,
   boardBullets:[
    `Débit : Compte 6021 (Achats de matières premières dans la région OHADA, ligne RC) pour ${A.toLocaleString('fr-FR')} XAF [Ou Compte 6011 Achats de marchandises, ligne RA, uniquement s’il s’agit d’un négociant revendant les fèves en l’état sans transformation — Attention : en SYSCOHADA révisé, les matières premières relèvent de la famille 602 et non 601 !].`,
    `Crédit : Compte 447 (État, impôts et taxes retenus à la source - Précompte 5 %) pour ${r5.toLocaleString('fr-FR')} XAF.`,
    `Crédit : Compte 521/571 (Banque ou Caisse pour le paiement net au planteur) pour ${net95.toLocaleString('fr-FR')} XAF.`
   ],
   lines:[
    {account:'6021',debit:A,credit:0,why:'Nomenclature officielle SYSCOHADA révisée : les achats de matières premières destinées à la transformation relèvent de la famille 602 (6021 dans la région OHADA, ligne RC), et non de la famille 601 (réservée aux marchandises revendues en l’état).'},
    {account:'447',debit:0,credit:r5,why:'Retenue à la source (précompte 5 %) prélevée sur le montant brut et à reverser à la DGI avant le 15 du mois suivant (ligne DK).'},
    {account:'571',debit:0,credit:net95,why:'Décaissement net (95 %) remis au planteur ou à la coopérative sur présentation du bordereau d’achat émargé (ou 521 par banque).'}
   ],
   altLines:[
    {account:'6011',debit:A,credit:0,why:'Variante Négoce pur (uniquement si l’entreprise achète les fèves pour les revendre en l’état sans transformation : 6011 Achats de marchandises, ligne RA).'},
    {account:'447',debit:0,credit:r5,why:'Précompte 5 % retenu à la source (ligne DK).'},
    {account:'521',debit:0,credit:net95,why:'Règlement net par banque/mobile money (ligne BS).'}
   ]
  },
  {
   id:'q2_valorisation_stocks_cmup_peps',
   keywords:['valoris','cmup','peps','fifo','stock','variation','entree','sortie','fluctu','cours','campagne','6032','6031','32','31','inventaire'],
   question:'Question 2 : « Les prix des fèves de cacao fluctuent chaque semaine pendant la campagne. Quelle méthode comptable SYSCOHADA appliquez-vous pour valoriser les stocks et les sorties vers l’usine ? »',
   naturalTerm:`Évaluer un stock final de fèves de ${A.toLocaleString('fr-FR')} XAF acheté à des prix différents`,
   proJargon:'Valorisation des stocks fongibles selon les deux seules méthodes admises par l’Acte uniforme SYSCOHADA révisé : le Coût Moyen Unitaire Pondéré (CMUP après chaque entrée ou de fin de période) ou le PEPS (Premier Entré, Premier Sorti / FIFO), à l’exclusion du LIFO.',
   trap:'Vérifier que vous savez que le SYSCOHADA interdit le LIFO (Dernier Entré, Premier Sorti), que les frais accessoires d’achat (transport amont 611, manutention) s’incorporent au coût d’entrée, et que la variation de stock des matières premières passe par 6032 (ou 6031) en classe 6.',
   response:'« Conformément au SYSCOHADA révisé, j’applique la méthode du Coût Moyen Unitaire Pondéré (CMUP) après chaque entrée pour lisser les variations du prix bord champ de la fève, en y intégrant tous les frais accessoires d’approche (transport de brousse, manutention, sacherie). Pour les produits finis périssables comme les tablettes de chocolat, je couple ce suivi physique avec la règle PEPS (Premier Entré, Premier Sorti) afin qu’aucune tablette ne dépasse sa date limite en magasin. »',
   boardHeader:`Pour la constatation à l’inventaire d’un stock final de fèves valorisé au CMUP à ${A.toLocaleString('fr-FR')} XAF :`,
   boardBullets:[
    `Débit : Compte 32 (Matières premières et fournitures liées, ligne BB de l’Actif) pour ${A.toLocaleString('fr-FR')} XAF.`,
    `Crédit : Compte 6032 (Variations des stocks de matières premières, ligne RD du Compte de résultat) pour ${A.toLocaleString('fr-FR')} XAF.`
   ],
   lines:[
    {account:'32',debit:A,credit:0,why:'Constate la valeur brute du stock physique présent au magasin à la clôture (Actif circulant · Ligne BB).'},
    {account:'6032',debit:0,credit:A,why:'Vient diminuer les achats de la période au Compte de résultat (Ligne RD) pour ne laisser en charge que les matières réellement consommées.'}
   ]
  },
  {
   id:'q3_depreciation_stock_avarie_6593',
   keywords:['6593','659','6594','humide','avarie','abime','pourri','perte','depreciation','provision','stock','39','392','391','moisissure'],
   question:'Question 3 : « Lors de l’inventaire physique de fin de mois, vous découvrez qu’un lot de fèves de cacao a pris l’humidité (perte de valeur estimée à 10 %). Quelle écriture passez-vous et pourquoi utiliser 6593 plutôt que 659 ou 6594 ? »',
   naturalTerm:`Perte de valeur sur stock de fèves humides (10 % sur un lot de ${A.toLocaleString('fr-FR')} XAF, soit ${dep10.toLocaleString('fr-FR')} XAF)`,
   proJargon:'Constatation d’une charge pour dépréciation des stocks (compte 6593) par le crédit du compte correcteur d’actif 392 (Dépréciations des stocks de matières premières), appuyée par un procès-verbal d’inventaire contradictoire.',
   trap:'Le recruteur veut vérifier deux choses : 1) que vous savez distinguer le compte générique 659 de ses sous-comptes précis (6593 pour les stocks de Classe 3 vs 6594 pour les créances de Classe 4 vs 6813 pour les immobilisations de Classe 2) ; 2) sur le plan fiscal camerounais, qu’une simple provision ou perte sans procès-verbal motivé sera réintégrée dans l’IS.',
   response:'« Lorsque la valeur actuelle d’un lot de fèves devient inférieure à son coût moyen pondéré (CMUP) en raison de l’humidité, le principe de prudence SYSCOHADA impose de constater une dépréciation. Je n’utilise pas le compte 659 générique, ni le 6594 réservé aux créances clients : je débite précisément le sous-compte 6593 (Charges pour dépréciations sur stocks, où le 3 final renvoie à la Classe 3) par le crédit du compte 392 (ou 39). Pour sécuriser la déductibilité fiscale à l’IS devant la DGI, je fais dresser un procès-verbal contradictoire motivé. »',
   boardHeader:`Pour une dépréciation de 10 % (${dep10.toLocaleString('fr-FR')} XAF) sur un lot de stock de ${A.toLocaleString('fr-FR')} XAF :`,
   boardBullets:[
    `Débit : Compte 6593 (Charges pour dépréciations sur stocks, ligne RJ du Compte de résultat) pour ${dep10.toLocaleString('fr-FR')} XAF.`,
    `Crédit : Compte 392 (Dépréciations des stocks de matières premières, ligne BB en colonne Amort./Dépréc. de l’Actif) pour ${dep10.toLocaleString('fr-FR')} XAF.`
   ],
   lines:[
    {account:'6593',debit:dep10,credit:0,why:'Charge calculée d’exploitation (ligne RJ) spécifique aux stocks (chiffre 3 final = Classe 3).'},
    {account:'392',debit:0,credit:dep10,why:'Compte correcteur d’actif (chiffre 9 en 2e position = dépréciation) qui réduit la valeur nette des stocks sur la ligne BB du Bilan.'}
   ]
  },
  {
   id:'q4_achat_negociant_tva_especes',
   keywords:['negociant','tva','19,25','19.25','especes','cash','100 000','100000','500 000','deductible','4452','niu','ebilling','facture'],
   question:'Question 4 : « Un négociant immatriculé vous livre des fèves ou des emballages avec une facture mentionnant la TVA à 19,25 %. À quelles conditions cette TVA est-elle récupérable et quel est le piège du règlement en espèces ? »',
   naturalTerm:`Achat auprès d’un négociant formel pour ${A.toLocaleString('fr-FR')} XAF HT + TVA 19,25 % (${vat1925.toLocaleString('fr-FR')} XAF)`,
   proJargon:'Déductibilité de la TVA d’amont (compte 4452) subordonnée à l’assujettissement réel du fournisseur, à la régularité de la facture normalisée (NIU) et au paiement par voie bancaire ou électronique dès que la facture atteint 100 000 FCFA (art. 143 CGI).',
   trap:'Faire croire qu’il suffit d’avoir un NIU ou de payer en espèces jusqu’à 500 000 FCFA : l’article 143(1)d du CGI camerounais exclut le droit à déduction de la TVA pour toute opération taxable d’au moins 100 000 FCFA payée en espèces !',
   response:'« Je vérifie d’abord que le fournisseur relève effectivement du régime du réel l’autorisant à facturer la TVA et que la facture porte toutes les mentions légales et son NIU. Surtout, conformément à l’article 143 du CGI, je bloque tout paiement en espèces dès que la facture atteint 100 000 FCFA : je règle exclusivement par virement bancaire, chèque ou mobile money traçable afin de préserver intégralement notre droit à déduction de la TVA (19,25 %) et la déductibilité de la charge à l’IS. »',
   boardHeader:`Pour un achat taxable de ${A.toLocaleString('fr-FR')} XAF HT auprès d’un négociant réglé par virement bancaire :`,
   boardBullets:[
    `Débit : Compte 6021 (Achats de matières premières, ligne RC) pour ${A.toLocaleString('fr-FR')} XAF.`,
    `Débit : Compte 4452 (État, TVA récupérable sur achats, ligne BJ de l’Actif) pour ${vat1925.toLocaleString('fr-FR')} XAF.`,
    `Crédit : Compte 521 (Banques locales, ou 4011 Fournisseurs avant règlement) pour ${ttc1925.toLocaleString('fr-FR')} XAF.`
   ],
   lines:[
    {account:'6021',debit:A,credit:0,why:'Coût d’achat Hors Taxes inscrit en charge d’exploitation (ligne RC).'},
    {account:'4452',debit:vat1925,credit:0,why:'TVA récupérable (19,25 %) constituant une créance sur le Trésor (ligne BJ) et non une charge.'},
    {account:'521',debit:0,credit:ttc1925,why:'Règlement TTC par voie bancaire traçable (respect du seuil de 100 000 XAF de l’art. 143 CGI).'}
   ]
  },
  {
   id:'q5_vente_locale_accises_tva',
   keywords:['accise','accises','chocolat','vente locale','supermarche','1806','446','443','702','assiette tva','136','142'],
   question:'Question 5 : « Vous vendez des tablettes de chocolat aux supermarchés locaux. Comment articulez-vous les droits d’accises et la TVA sur la facture et dans votre comptabilité ? »',
   naturalTerm:`Vente locale de chocolats finis pour ${A.toLocaleString('fr-FR')} XAF HT`,
   proJargon:'Liquidation en cascade des droits d’accises à taux réduit (5 % pour les positions tarifaires 1806.20 à 180690, art. 142 CGI) et intégration obligatoire des droits d’accises dans la base d’imposition de la TVA à 19,25 % (art. 136 CGI).',
   trap:'Calculer la TVA de 19,25 % uniquement sur le prix HT sans y inclure les droits d’accises ! L’article 136 du CGI stipule que l’assiette de la TVA comprend tous les droits et taxes autres que la TVA elle-même.',
   response:'« Pour nos chocolats relevant des positions 1806.20 à 180690 soumis au taux réduit d’accises de 5 % (article 142 du CGI), j’applique la règle d’assiette de l’article 136 : je calcule d’abord les droits d’accises de 5 % sur le prix HT, puis j’applique la TVA de 19,25 % sur la somme (Prix HT + Droits d’accises). Comptablement, je sépare la vente HT en 702, la dette d’accises en 446 et la dette de TVA en 443. »',
   boardHeader:`Pour une vente locale de chocolats de ${A.toLocaleString('fr-FR')} XAF HT (Accises 5 % = ${exc5.toLocaleString('fr-FR')} XAF ; Base TVA = ${(A+exc5).toLocaleString('fr-FR')} XAF) :`,
   boardBullets:[
    `Débit : Compte 411 (Clients, ligne BI de l’Actif) pour ${ttcChoco.toLocaleString('fr-FR')} XAF.`,
    `Crédit : Compte 702 (Ventes de produits finis, ligne TB du Compte de résultat) pour ${A.toLocaleString('fr-FR')} XAF.`,
    `Crédit : Compte 446 (État, autres taxes sur le CA - Droits d’accises 5 %) pour ${exc5.toLocaleString('fr-FR')} XAF.`,
    `Crédit : Compte 443 (État, TVA facturée 19,25 % sur HT + Accises) pour ${vatOnExc.toLocaleString('fr-FR')} XAF.`
   ],
   lines:[
    {account:'411',debit:ttcChoco,credit:0,why:'Créance TTC sur le distributeur ou supermarché local (ligne BI).'},
    {account:'702',debit:0,credit:A,why:'Chiffre d’affaires industriel Hors Taxes (ligne TB).'},
    {account:'446',debit:0,credit:exc5,why:'Droits d’accises (5 %) collectés pour la DGI (ligne DK).'},
    {account:'443',debit:0,credit:vatOnExc,why:'TVA collectée (19,25 %) calculée sur (HT + Accises) conformément à l’art. 136 CGI (ligne DK).'}
   ]
  },
  {
   id:'q6_export_zlecaf_credit_tva',
   keywords:['export','zlecaf','cemac','taux zero','0%','remboursement','credit de tva','douane','origine','149'],
   question:'Question 6 : « Comment sécurisez-vous la trésorerie et la fiscalité lorsque l’entreprise exporte ses chocolats en zone CEMAC ou ZLECAf ? »',
   naturalTerm:`Vente à l’exportation de chocolats pour ${A.toLocaleString('fr-FR')} XAF`,
   proJargon:'Facturation au taux zéro de TVA (0 %, art. 142 CGI) conservant le droit à déduction de la TVA d’amont, constitution du dossier de remboursement de crédit de TVA d’exportateur (art. 149 CGI) et agrément d’origine préférentielle CEMAC/ZLECAf.',
   trap:'Confondre « exonération de TVA » (qui fait perdre le droit à déduction de la TVA payée sur les intrants) et « taxation au taux zéro » (qui ouvre droit au remboursement de la TVA payée en amont), ou oublier que le taux zéro exige la preuve douanière de sortie effective et l’attestation bancaire de rapatriement des fonds.',
   response:'« Les exportations de nos chocolats bénéficient du taux zéro de TVA (0 %) et non d’une simple exonération, ce qui nous permet de déduire et de demander le remboursement de toute la TVA payée en amont sur nos emballages, l’électricité ENEO et les intrants. Pour éviter tout rejet lors du contrôle DGI (article 149 du CGI), je constitue systématiquement le dossier probant : déclaration d’exportation EX1, preuve d’embarquement, certificat d’origine CEMAC/ZLECAf et attestation bancaire de rapatriement des devises. »',
   boardHeader:`Pour une vente à l’exportation justifiée de ${A.toLocaleString('fr-FR')} XAF HT (TVA au taux 0 %) :`,
   boardBullets:[
    `Débit : Compte 411 (Clients étrangers, ligne BI de l’Actif) pour ${A.toLocaleString('fr-FR')} XAF.`,
    `Crédit : Compte 702 (Ventes de produits finis à l’exportation, ligne TB) pour ${A.toLocaleString('fr-FR')} XAF.`
   ],
   lines:[
    {account:'411',debit:A,credit:0,why:'Créance sur le client export (soutenue par le dossier douanier et bancaire de rapatriement).'},
    {account:'702',debit:0,credit:A,why:'Produit des ventes de chocolats fabriqués exportés au taux 0 % de TVA (ligne TB).'}
   ]
  },
  {
   id:'q7_paie_cnps_optimisation',
   keywords:['cnps','paie','salaire','transport','panier','fne','apprentissage','irpp','cotisation','ouvrier','661','664','422','431'],
   question:'Question 7 : « Comment comptabilisez-vous la paie et comment réduisez-vous légalement le poids des charges sociales (CNPS) et fiscales sur les salaires de l’usine ? »',
   naturalTerm:`Masse salariale brute de ${A.toLocaleString('fr-FR')} XAF et optimisation légale de la fiche de paie`,
   proJargon:'Ventilation de la rémunération entre salaire brut cotisable/taxable et indemnités représentatives de frais professionnels justifiés (panier de nuit, transport réel), recours aux contrats d’apprentissage/insertion agréés (FNE) et prévoyance santé collective documentée.',
   trap:'Dire qu’on va simplement renommer la moitié du salaire en « prime de transport » sans justificatif : lors d’un contrôle CNPS ou DGI, les indemnités forfaitaires disproportionnées ou non justifiées par des frais réels de fonction sont intégralement réintégrées dans l’assiette avec pénalités !',
   response:'« Je structure la paie en respectant strictement la réglementation CNPS et le CGI : je distingue le salaire de base et les primes de rendement (soumis à la PVID de 4,2 % salarié + 4,2 % employeur, aux prestations familiales de 7 % plafonnées à 750 000 XAF par salarié, et aux accidents du travail déplafonnés) des remboursements de frais professionnels réellement engagés et justifiés (prime de panier pour les équipes de nuit de torréfaction, indemnités liées au déplacement effectif). En parallèle, j’utilise les programmes formels d’insertion et d’apprentissage avec le FNE et je veille au versement avant le 15 du mois pour maintenir notre ACS (Attestation de Conformité Sociale) active. »',
   boardHeader:`Pour la comptabilisation d’une paie mensuelle de base ${A.toLocaleString('fr-FR')} XAF (calcul exact généré par le moteur de paie) :`,
   boardBullets:(()=>{
    const p=payroll({baseSalary:A,taxablePrimes:0,exemptAllowances:0,count:1,pfBp:700,riskBp:250});
    return [
     `Débit : Compte 661 (Rémunérations directes versées au personnel, ligne RK) pour ${p.group.grossTotal.toLocaleString('fr-FR')} XAF.`,
     `Débit : Compte 664 (Charges sociales patronales CNPS, ligne RK) pour ${p.group.cnpsPat.toLocaleString('fr-FR')} XAF.`,
     `Débit : Compte 641 (Impôts et taxes sur salaires : CFC patronal 1,5 % + FNE 1 %, ligne RI) pour ${p.group.taxPat.toLocaleString('fr-FR')} XAF.`,
     `Crédit : Compte 422 (Personnel, rémunérations nettes dues, ligne DK) pour ${p.group.netPay.toLocaleString('fr-FR')} XAF.`,
     `Crédit : Compte 431 (Sécurité sociale CNPS : part salariale + patronale, ligne DK) pour ${p.group.cnpsTotal.toLocaleString('fr-FR')} XAF.`,
     `Crédit : Compte 447 (État, impôts retenus à la source et taxes salariales, ligne DK) pour ${p.group.taxTotal.toLocaleString('fr-FR')} XAF.`
    ];
   })(),
   lines:payroll({baseSalary:A,taxablePrimes:0,exemptAllowances:0,count:1,pfBp:700,riskBp:250}).journalLines
  },
  {
   id:'q8_point_mort_analytique_couts',
   keywords:['point mort','seuil de rentabilite','cout variable','cout fixe','marge','tablette','analytique','cout de revient','dg','rentabilite'],
   question:'Question 8 : « Comment expliquez-vous au Directeur Général le calcul du coût de revient d’une tablette et le Seuil de Rentabilité (Point Mort) de l’usine ? »',
   naturalTerm:'Calculer combien coûte chaque tablette de chocolat et à partir de quelle quantité l’usine gagne de l’argent',
   proJargon:'Segmentation analytique en coûts complets hiérarchisés (Coût d’achat → Coût de production → Coût de distribution → Coût de revient) et modèle du Direct Costing (Marge sur Coût Variable Unitaire MCVu = Prix HT − CVu ; Seuil de Rentabilité SR = Charges Fixes / Taux de MCV).',
   trap:'Confondre la Marge sur Coût Variable avec le Bénéfice Net, ou croire qu’atteindre le Point Mort comptable garantit immédiatement une trésorerie positive (alors que les délais clients et les stocks consomment du BFR).',
   response:'« Je découpe l’usine en trois stades analytiques : 1) le Coût d’achat des fèves rendues usine (prix bord champ + transport amont + manutention + précompte non récupérable) ; 2) le Coût de production (fèves consommées au CMUP + sucre/lait + emballages + main-d’œuvre directe + électricité ENEO du tempérage + amortissement machine) ; 3) le Coût de distribution. Ensuite, j’isole les charges variables (ex. 400 XAF par tablette vendue 1 000 XAF HT, soit une Marge sur Coût Variable de 600 XAF ou 60 %) des charges fixes mensuelles (ex. 6 000 000 XAF). Le Point Mort est de 6 000 000 ÷ 600 = 10 000 tablettes par mois (10 millions XAF de CA HT) : dès la 10 001e tablette, l’usine dégage un bénéfice d’exploitation de 600 XAF par tablette supplémentaire ! »',
   boardHeader:'Formules mathématiques et écriture de vente de 10 000 tablettes à 1 000 XAF HT (Point Mort = 10 000 000 XAF) :',
   boardBullets:[
    'Marge sur Coût Variable Unitaire (MCVu) = Prix de vente HT (1 000 XAF) − Coût Variable Unitaire (400 XAF) = 600 XAF (soit TxMCV = 60 %).',
    'Seuil de Rentabilité en valeur (SR) = Coûts Fixes (6 000 000 XAF) ÷ 0,60 = 10 000 000 XAF HT.',
    'Seuil de Rentabilité en volume (Point Mort) = 6 000 000 ÷ 600 = 10 000 tablettes vendues par mois.',
    `Écriture de chiffre d’affaires correspondant au Point Mort : Débit 411 Clients (${(10000000).toLocaleString('fr-FR')} XAF) / Crédit 702 Ventes de produits finis (${(10000000).toLocaleString('fr-FR')} XAF).`
   ],
   lines:[
    {account:'411',debit:10000000,credit:0,why:'Créance client correspondant au chiffre d’affaires mensuel du seuil de rentabilité (ligne BI).'},
    {account:'702',debit:0,credit:10000000,why:'Ventes de produits fabriqués (10 000 tablettes × 1 000 XAF HT, ligne TB).'}
   ]
  },
  {
   id:'q9_loyer_retenue_15_bail',
   keywords:['loyer','bail','entrepot','proprietaire','particulier','15%','15 %','622','retenue loyer','foncier'],
   question:'Question 9 : « L’entreprise loue un entrepôt de stockage de fèves à un propriétaire particulier. Comment comptabilisez-vous et sécurisez-vous fiscalement le paiement du loyer ? »',
   naturalTerm:`Paiement d’un loyer d’entrepôt de ${A.toLocaleString('fr-FR')} XAF à un bailleur particulier`,
   proJargon:'Comptabilisation de la charge locative brute en 622 (Services extérieurs - Locations) et opéré obligatoire de la retenue à la source de 15 % sur les revenus fonciers au crédit du compte 447 (État, impôts retenus à la source).',
   trap:'Verser 100 % du loyer au propriétaire particulier sans retenir les 15 % : en cas de contrôle fiscal, la DGI réclame les 15 % non retenus à l’entreprise locataire assortis de pénalités et rejette la déductibilité de la charge locative à l’IS !',
   response:'« Avant tout paiement, j’enregistre le contrat de bail commercial et je vérifie le régime fiscal du bailleur. S’agissant d’un particulier (ou d’une entité non dispensée de retenue), j’applique obligatoirement la retenue à la source de 15 % sur les loyers bruts : je verse 85 % du montant au bailleur par virement bancaire et je reverse les 15 % retenus à la DGI avant le 15 du mois suivant en délivrant une attestation de retenue au propriétaire. »',
   boardHeader:`Pour un loyer mensuel d’entrepôt de ${A.toLocaleString('fr-FR')} XAF :`,
   boardBullets:[
    `Débit : Compte 622 (Locations et charges locatives, ligne RH du Compte de résultat) pour ${A.toLocaleString('fr-FR')} XAF.`,
    `Crédit : Compte 447 (État, impôts retenus à la source - Retenue sur loyers 15 %, ligne DK) pour ${r15.toLocaleString('fr-FR')} XAF.`,
    `Crédit : Compte 521 (Banques locales - paiement net de 85 % au bailleur, ligne BS) pour ${net85.toLocaleString('fr-FR')} XAF.`
   ],
   lines:[
    {account:'622',debit:A,credit:0,why:'Charge locative brute de l’entreprise (Services extérieurs · Ligne RH).'},
    {account:'447',debit:0,credit:r15,why:'Retenue à la source de 15 % sur revenus fonciers à reverser à la DGI (Ligne DK).'},
    {account:'521',debit:0,credit:net85,why:'Montant net (85 %) viré au propriétaire de l’entrepôt (Ligne BS).'}
   ]
  },
  {
   id:'q10_amortissement_machines_is_124a',
   keywords:['amortissement','machine','torrefacteur','concheuse','241','6813','284','is','impot sur les societes','124 a','124a','transformation locale','abattement'],
   question:'Question 10 : « Comment traitez-vous l’achat et l’amortissement des machines industrielles (torréfacteurs, concheuses) et quels leviers fiscaux légaux réduisent l’IS d’un transformateur de cacao ? »',
   naturalTerm:`Amortissement annuel d’un équipement industriel de ${A.toLocaleString('fr-FR')} XAF et optimisation de l’IS`,
   proJargon:'Immobilisation corporelle en 241, dotation aux amortissements en 6813 / 2841 selon les taux admis par le CGI, et instruction du dossier d’abattement de 50 % sur l’acompte et l’IS au titre de la transformation locale de matières premières agricoles (art. 124 A du CGI).',
   trap:'Passer l’achat d’une machine directement en charge (classe 6) ou appliquer d’office un abattement de 50 % sur l’IS sans avoir obtenu la validation préalable de l’administration fiscale exigée par l’article 124 A du CGI.',
   response:'« L’acquisition d’un torréfacteur ou d’une concheuse s’inscrit à l’actif immobilisé au débit du compte 241. À chaque clôture, je constate son usure technique par le débit du compte 6813 (Dotations aux amortissements) et le crédit du compte 2841, ce qui réduit légalement le résultat imposable à l’IS sans sortie de trésorerie. De plus, comme l’entreprise transforme sur le territoire national une matière première agricole locale (le cacao), je monte immédiatement le dossier de validation préalable auprès de la DGI au titre de l’article 124 A du CGI (ou des incitations à l’investissement de l’ordonnance 2025/002 en cas d’extension éligible) pour solliciter l’abattement légal sur l’acompte mensuel et l’IS. »',
   boardHeader:`Pour une dotation annuelle aux amortissements de ${A.toLocaleString('fr-FR')} XAF sur le matériel industriel :`,
   boardBullets:[
    `Débit : Compte 6813 (Dotations aux amortissements des immobilisations corporelles, ligne RL) pour ${A.toLocaleString('fr-FR')} XAF.`,
    `Crédit : Compte 284 (Amortissements du matériel industriel, ligne AL en colonne Amort./Dépréc. de l’Actif) pour ${A.toLocaleString('fr-FR')} XAF.`
   ],
   lines:[
    {account:'6813',debit:A,credit:0,why:'Charge calculée d’exploitation (ligne RL) constatant l’usure annuelle des machines.'},
    {account:'284',debit:0,credit:A,why:'Amortissement cumulé (8 en 2e position) venant diminuer la valeur brute du matériel sur la ligne AL du Bilan.'}
   ]
  },
  {
   id:'q11_bilan_reprise_patente_mairie',
   keywords:['reprise','ouverture','bilan de reprise','sommeil','patente','mairie','commune','niu','acf','acs','100 jours'],
   question:'Question 11 : « L’usine était en arrêt et reprend ses activités à la mi-novembre. Quelles sont vos premières décisions comptables, fiscales et administratives (Bilan de reprise, NIU, Patente, ACF/ACS) ? »',
   naturalTerm:`Bilan d’ouverture / reprise d’activité avec ${A.toLocaleString('fr-FR')} XAF de trésorerie et négociation de la patente`,
   proJargon:'Arrêté contradictoire du bilan d’ouverture (à-nouveaux des classes 1 à 5), levée de mise en sommeil auprès du centre des impôts de rattachement (CIME/DGE), instruction du prorata ou de l’exonération de patente (art. 102 CGI) et sécurisation de l’ACF et de l’ACS.',
   trap:'Croire qu’après un arrêt d’activité les compteurs sont remis à zéro : les immobilisations, cautions (ENEO 275), créances clients anciennes, emprunts (162) et arriérés fiscaux/CNPS subsistent au bilan de reprise et doivent être inventoriés et rapprochés.',
   response:'« Dès le jour 1, je réalise un inventaire physique contradictoire des machines (classe 2) et des stocks résiduels (classe 3), puis je réconcilie les comptes bancaires (521), les créances clients et les dettes fiscales et sociales (431, 44) pour figer le bilan d’ouverture. Administrativement, je notifie la reprise d’activité au centre des impôts pour sécuriser le NIU et l’ACF, je régularise le dossier CNPS pour obtenir l’ACS (qui remplace l’APS), et je soumets à la mairie le dossier de contribution des patentes en faisant valoir la période effective d’activité et les dispositions légales applicables. »',
   boardHeader:`Exemple d’écriture d’apport ou de réinjection de trésorerie de reprise de ${A.toLocaleString('fr-FR')} XAF :`,
   boardBullets:[
    `Débit : Compte 521 (Banques locales, ligne BS de la Trésorerie-Actif) pour ${A.toLocaleString('fr-FR')} XAF.`,
    `Crédit : Compte 101 (Capital social, ou 46 Associés comptes courants, Passif du Bilan) pour ${A.toLocaleString('fr-FR')} XAF.`
   ],
   lines:[
    {account:'521',debit:A,credit:0,why:'Disponibilités bancaires prêtes à financer la campagne cacaoyère de mi-novembre (ligne BS).'},
    {account:'101',debit:0,credit:A,why:'Ressource de financement propre inscrite au Passif du Bilan (ligne CA).'}
   ]
  },
  {
   id:'q13_stock_initial_semi_finis_312',
   keywords:['stock initial','semi-finis','semi finis','masse de cacao','beurre','371','34','312','100 kg','en-cours','encours','torrefaction','broyage'],
   question:'Cas Pratique Court : « Stock initial 100 kg de produits semi-finis (masse de cacao / beurre) »',
   naturalTerm:`Stock initial (ou d’inventaire) de 100 kg de produits semi-finis valorisé à ${A.toLocaleString('fr-FR')} XAF`,
   proJargon:'Constatation à l’actif circulant (ligne BB) du stock de produits intermédiaires / semi-finis (Compte 371 en SYSCOHADA révisé, ou 34 Produits en cours) ayant franchi les stades de torréfaction et broyage, par le crédit de la variation de production stockée (Compte 737 ou 734, ligne TE).',
   trap:'Double piège : 1) Oublier de valoriser les produits semi-finis entre la fève brute (32/321) et la tablette finie (36/361) ; 2) Utiliser par erreur le compte 312 (qui désigne « Marchandises B » en SYSCOHADA révisé) ou 6032 (réservé aux matières premières) au lieu de 371 (Produits intermédiaires) et 737 (Variation des stocks de produits intermédiaires, ligne TE) !',
   response:'« En comptabilité industrielle SYSCOHADA révisée, je distingue quatre familles de stocks : les marchandises de négoce (31/311/312), les matières premières brutes comme les fèves de cacao (32/321, variation 6032), les produits intermédiaires ou semi-finis issus du broyage comme la masse et le beurre de cacao (371 ou en-cours 34, variation 737/734 sur la ligne TE), et les produits finis prêts à la vente (36/361, variation 736). Pour 100 kg de produits semi-finis valorisés au CMUP d’atelier, je débite le compte 371 (ligne BB du Bilan) par le crédit du compte 737 (ligne TE du Compte de résultat). »',
   boardHeader:`Pour 100 kg de produits semi-finis (intermédiaires) valorisés à ${A.toLocaleString('fr-FR')} XAF :`,
   boardBullets:[
    `Débit : Compte 371 (Produits intermédiaires - Masse de cacao / Beurre, ligne BB de l’Actif — attention : en SYSCOHADA révisé, 312 désigne les Marchandises B et non les semi-finis !) pour ${A.toLocaleString('fr-FR')} XAF.`,
    `Crédit : Compte 737 (ou 734/736 Variations des stocks de produits intermédiaires / en-cours, ligne TE du Compte de résultat) pour ${A.toLocaleString('fr-FR')} XAF.`
   ],
   lines:[
    {account:'371',debit:A,credit:0,why:'Compte officiel SYSCOHADA révisé pour les produits intermédiaires / semi-finis (masse et beurre de cacao, Ligne BB de l’Actif).'},
    {account:'736',debit:0,credit:A,why:'Variation de la production stockée (737/736, Ligne TE en classe 7 car les semi-finis sont produits par l’usine et non achetés).'}
   ]
  },
  {
   id:'q14_cacao_moisi_brousse_375k',
   keywords:['moisi','moitie prix','250 kg','375 000','375000','sans recu','sans reçu','avari','pv de commissaire'],
   question:'Cas Pratique Terrain : « Achat de cacao moisi à moitié prix en brousse (250 kg) sans reçu officiel pour 375 000 XAF »',
   naturalTerm:`Achat de cacao partiellement moisi en brousse pour ${A.toLocaleString('fr-FR')} XAF sans facture officielle`,
   proJargon:'Émission d’un bordereau interne d’achat non-immatriculé avec retenue du précompte de 5 % (compte 447), comptabilisé en 6021 (Achats de matières premières, ligne RC) s’il s’agit d’une usine (ou 6011 si négoce), suivi d’une dépréciation sur stock (6593 / 392) motivée par procès-verbal.',
   trap:'Le fisc refuse les charges sans pièces valides (d’où l’obligation du bordereau interne + précompte de 5 %), rejette les dépréciations sans procès-verbal contradictoire, et l’auditeur vérifie que vous utilisez 6021 / 392 pour des matières premières industrielles (et non 6011 / 391 réservés aux marchandises).',
   response:'« Je sécurise l’opération en deux étapes : 1) pour rendre l’achat opposable au fisc malgré l’absence de reçu du planteur, j’émets un bordereau d’achat certifié en débitant le compte 6021 (Achats de matières premières, ligne RC) et je retiens le précompte légal de 5 % au crédit du compte 447 ; 2) dès la réception au magasin, pour la fraction impropre au conchage, je fais dresser un PV contradictoire et je constate une dépréciation au débit du compte 6593 par le crédit du compte 392 (Dépréciations des stocks de matières premières). »',
   boardHeader:`Pour un achat de cacao dégradé en brousse de ${A.toLocaleString('fr-FR')} XAF :`,
   boardBullets:[
    `Débit : Compte 6021 (Achats de matières premières dans la région, ligne RC — ou 6011 si négoce pur, ligne RA) pour ${A.toLocaleString('fr-FR')} XAF.`,
    `Crédit : Compte 447 (État, Précompte sur achat 5 %, ligne DK) pour ${r5.toLocaleString('fr-FR')} XAF.`,
    `Crédit : Compte 571 (Caisse - Paiement net en brousse, ligne BS) pour ${net95.toLocaleString('fr-FR')} XAF.`
   ],
   lines:[
    {account:'6021',debit:A,credit:0,why:'Enregistrement du prix d’achat brut en matières premières (famille 602, ligne RC) figurant sur le bordereau interne.'},
    {account:'447',debit:0,credit:r5,why:'Précompte de 5 % retenu à la source sur vendeur non-immatriculé (Ligne DK).'},
    {account:'571',debit:0,credit:net95,why:'Décaissement net (95 %) en espèces contre émargement du bordereau (Ligne BS).'}
   ]
  },
  {
   id:'q15_carburant_transport_ttc_6054',
   keywords:['carburant','essence','gazole','pompe','station','total douala','transporteur','lubrifiant','6053','6054','6042','6015','ravitaill'],
   question:'Cas Logistique & Transport : « Achat de carburant à la pompe chez Total Douala par un transporteur pour 500 000 XAF TTC »',
   naturalTerm:`Achat de carburant et lubrifiants à la station pour ${A.toLocaleString('fr-FR')} XAF TTC`,
   proJargon:'Comptabilisation intégrale Toutes Taxes Comprises (TTC) au débit du compte 6053 (Fournitures non stockables - Autres énergies, ou 6042 si stocké en cuve, ligne RE) en raison de l’exclusion légale du droit à déduction de la TVA sur les carburants routiers (art. 144 CGI).',
   trap:'Double piège : 1) Fiscalement, isoler 19,25 % de TVA récupérable (4452) sur du carburant routier alors que l’art. 144 CGI l’exclut du droit à déduction ; 2) Comptablement, utiliser 6015 (qui désigne les « Frais sur achats de marchandises » en SYSCOHADA révisé) au lieu de 6053 (carburant non stocké à la pompe) ou 6042 (carburant stocké en cuve) !',
   response:'« Bien que la facture de la station-service mentionne la TVA à 19,25 %, l’article 144 du CGI exclut les carburants routiers du droit à déduction de la TVA. Toute TVA non récupérable s’incorpore légalement au coût d’achat : j’enregistre donc la totalité du montant TTC directement en charge sur la ligne RE au débit du compte 6053 (Fournitures non stockables - Autres énergies, ou 6042 si stocké en cuve, et non 6015 qui concerne les frais sur achats de marchandises), sans mouvementer le compte 4452. »',
   boardHeader:`Pour un achat de carburant de ${A.toLocaleString('fr-FR')} XAF TTC réglé par banque :`,
   boardBullets:[
    `Débit : Compte 6053 (Fournitures non stockables - Autres énergies / Carburants TTC, ou 6042 si stocké en cuve, ligne RE) pour ${A.toLocaleString('fr-FR')} XAF.`,
    `Crédit : Compte 521 (Banque - Règlement e-Billing / carte pétrolière, ligne BS) pour ${A.toLocaleString('fr-FR')} XAF.`
   ],
   lines:[
    {account:'6053',debit:A,credit:0,why:'Sous-compte officiel SYSCOHADA révisé (6053 Autres énergies non stockables, ligne RE) comptabilisé TTC (art. 144 CGI).'},
    {account:'521',debit:0,credit:A,why:'Règlement bancaire au distributeur agréé (Ligne BS).'}
   ]
  },
  {
   id:'q16_consultant_etranger_tsr_15',
   keywords:['consultant','freelance','paris','france','ivoirien','abidjan','etranger','non-resident','non resident','tsr','coder','6324','6224','digital','plateforme web'],
   question:'Cas Digital & International : « On a payé un consultant freelance à Paris / Abidjan sur internet pour coder l’app »',
   naturalTerm:`Paiement d’un prestataire étranger (hors Cameroun) de ${A.toLocaleString('fr-FR')} XAF`,
   proJargon:'Rémunération d’intermédiaires et de conseils fournie par un non-résident (Compte 6324 / 632 en SYSCOHADA révisé, ligne RH — ne pas confondre avec 6224 qui désigne les « Malis sur emballages » !) soumise à la retenue à la source de la Taxe Spéciale sur les Revenus (TSR de 15 %, crédit 447).',
   trap:'Double piège : 1) Virer 100 % de la facture à l’étranger sans retenir la TSR de 15 % (compte 447) ; 2) Utiliser par erreur le compte 6224 (qui correspond aux « Malis sur emballages » sous 622 Locations en SYSCOHADA révisé) au lieu du compte 6324 (Honoraires et conseils, sous 632) !',
   response:'« Lorsqu’une entreprise camerounaise rémunère un prestataire non-résident pour du développement logiciel ou du conseil, l’opération est soumise à la Taxe Spéciale sur les Revenus (TSR, taux de droit commun de 15 % sous réserve des conventions fiscales). En nomenclature SYSCOHADA révisée, je débite le compte 6324 (Honoraires et conseils, ligne RH — et non 6224 qui concerne les malis sur emballages), je retiens 15 % de TSR au crédit du compte 447, et je vire les 85 % nets au prestataire étranger. »',
   boardHeader:`Pour une prestation internationale de ${A.toLocaleString('fr-FR')} XAF soumise à la TSR de 15 % :`,
   boardBullets:[
    `Débit : Compte 6324 (Rémunérations d’intermédiaires et de conseils - Honoraires IT, ligne RH) pour ${A.toLocaleString('fr-FR')} XAF.`,
    `Crédit : Compte 447 (État, Retenue TSR 15 % prestataire non-résident, ligne DK) pour ${r15.toLocaleString('fr-FR')} XAF.`,
    `Crédit : Compte 521 (Banque - Virement international net 85 %, ligne BS) pour ${net85.toLocaleString('fr-FR')} XAF.`
   ],
   lines:[
    {account:'6324',debit:A,credit:0,why:'Compte officiel SYSCOHADA révisé pour les honoraires et conseils (6324, Ligne RH — distinct de 6224 Malis sur emballages).'},
    {account:'447',debit:0,credit:r15,why:'Retenue à la source TSR (15 %) due au Trésor camerounais sur rémunération versée à l’étranger (Ligne DK).'},
    {account:'521',debit:0,credit:net85,why:'Montant net (85 %) transféré par la banque au consultant non-résident (Ligne BS).'}
   ]
  },
  {
   id:'q17_amende_routiere_edea_6581',
   keywords:['amende','penalite','pénalité','controle routier','edea','édéa','axe lourd','contravention','6581','non deductible','reintegration'],
   question:'Cas Transport & Fiscalité IS : « Le camion de livraison a pris une amende au contrôle routier sur l’axe lourd à Edéa »',
   naturalTerm:`Paiement d’une amende routière ou pénalité fiscale de ${A.toLocaleString('fr-FR')} XAF`,
   proJargon:'Enregistrement comptable de la sanction pécuniaire au débit du compte 6581 / 647 (Pénalités et amendes) par le crédit de la trésorerie, suivi d’une réintégration extra-comptable obligatoire au Tableau 22 de la DSF (charge non déductible de l’IS, art. 7 CGI).',
   trap:'Croire que parce qu’on ne peut pas déduire une amende des impôts, il ne faut pas l’enregistrer en comptabilité ! En comptabilité, toute sortie d’argent réelle DOIT être enregistrée (en 6581/647) pour que la caisse soit juste ; c’est en fin d’année, sur la DSF, qu’on la réintègre au bénéfice fiscal.',
   response:'« Je distingue toujours la règle comptable de la règle fiscale : sur le plan comptable SYSCOHADA, l’argent est réellement sorti de la caisse, donc je débite le compte 6581 (ou 647 Pénalités et amendes fiscales) par le crédit du compte 571. En revanche, sur le plan fiscal camerounais (art. 7 CGI), les amendes et pénalités sont strictement exclues des charges déductibles : je les réintègre obligatoirement au Tableau 22 de la DSF pour le calcul de l’IS. »',
   boardHeader:`Pour une amende ou pénalité de ${A.toLocaleString('fr-FR')} XAF payée en espèces :`,
   boardBullets:[
    `Débit : Compte 6581 (Pénalités et amendes fiscales ou pénales, ligne RJ) pour ${A.toLocaleString('fr-FR')} XAF.`,
    `Crédit : Compte 571 (Caisse siège / fonds de route, ligne BS) pour ${A.toLocaleString('fr-FR')} XAF.`,
    `Action DSF obligatoire : Réintégration extra-comptable de + ${A.toLocaleString('fr-FR')} XAF dans l’assiette de l’IS (Tableau 22 DSF).`
   ],
   lines:[
    {account:'6581',debit:A,credit:0,why:'Constate la charge comptable réelle (Ligne RJ), mais marquée « Non déductible fiscalement » pour réintégration à l’IS.'},
    {account:'571',debit:0,credit:A,why:'Sortie d’espèces justifiée par la quittance officielle de paiement de l’amende (Ligne BS).'}
   ]
  },
  {
   id:'q18_caution_boutique_yaounde_274',
   keywords:['caution','cautionnement','depot de garantie','dépôt de garantie','boutique','bastos','yaounde','275','274','eneo','camwater'],
   question:'Cas Immobilier & Bilan : « On a versé la caution pour la location de la nouvelle boutique à Yaoundé (Bastos) »',
   naturalTerm:`Versement d’un dépôt de garantie / caution de ${A.toLocaleString('fr-FR')} XAF pour un local commercial`,
   proJargon:'Inscription à l’Actif immobilisé au débit du compte 275 (Dépôts et cautionnements versés — 2751 Dépôts pour loyers d’avance, ligne AS sous AQ du Bilan) sans passage par les comptes de charges (classe 6).',
   trap:'Double piège : 1) Comptabiliser les mois de caution en « loyer » (compte 6222), ce qui gonfle faussement les charges ; 2) Confondre le compte 275 (Dépôts et cautionnements versés) avec le compte 274 (qui désigne les « Titres immobilisés » en SYSCOHADA révisé) !',
   response:'« Un dépôt de garantie versé au bailleur à la signature du bail (ou à ENEO/Camwater) n’appauvrit pas l’entreprise puisqu’il est récupérable en fin de contrat. Il est interdit de le passer en charge locative (6222) : en nomenclature SYSCOHADA révisée, je l’enregistre en immobilisation financière au débit du compte 275 (Dépôts et cautionnements versés, ligne AS sous AQ de l’Actif — et non 274 qui concerne les titres immobilisés) par le crédit de la banque 521. »',
   boardHeader:`Pour le versement d’une caution de garantie de ${A.toLocaleString('fr-FR')} XAF par chèque ou virement :`,
   boardBullets:[
    `Débit : Compte 275 (Dépôts et cautionnements versés - 2751 Loyers d’avance, ligne AS sous AQ de l’Actif immobilisé) pour ${A.toLocaleString('fr-FR')} XAF.`,
    `Crédit : Compte 521 (Banques locales, ligne BS de la Trésorerie-Actif) pour ${A.toLocaleString('fr-FR')} XAF.`
   ],
   lines:[
    {account:'275',debit:A,credit:0,why:'Compte officiel SYSCOHADA révisé pour les dépôts et cautionnements versés (275, Ligne AS sous AQ — distinct de 274 Titres immobilisés).'},
    {account:'521',debit:0,credit:A,why:'Sortie de trésorerie bancaire remise au bailleur contre quittance de cautionnement (Ligne BS).'}
   ]
  },
  {
   id:'q19_entretien_624_vs_transport_61',
   keywords:['624','6241','6242','6243','615','61','611','612','maintenance','entretien','reparation','réparation','panne','camion','transport'],
   question:'Question 13 (Rigueur SYSCOHADA) : « Comment distinguez-vous le compte 624 (Maintenance & Entretien) de la classe 61 (Transports), par exemple lors d’une panne de camion à Edéa vs une facture de transporteur ? »',
   naturalTerm:`Réparation et maintenance d’un camion ou d’une machine pour ${A.toLocaleString('fr-FR')} XAF HT (6242 vs 611/612)`,
   proJargon:'Distinction stricte de la nomenclature SYSCOHADA révisée entre la classe 61 (Transports : 611 sur achats, 612 sur ventes, 613 pour tiers, 618 déplacements, ligne RG) et le compte 624 (Entretien, réparations, remise en état et maintenance : 6241 biens immobiliers, 6242 biens mobiliers/véhicules, 6243 maintenance, ligne RH).',
   trap:'Utiliser le compte 615 (« Entretien et réparations » dans le PCG français, qui n’existe PAS en SYSCOHADA révisé) ou mélanger le compte 624 (Maintenance et réparations, ligne RH) avec les frais de transport (classe 61, ligne RG) !',
   response:'« En nomenclature SYSCOHADA révisée, la frontière est absolue : la classe 61 (ligne RG) est exclusivement réservée au transport de biens ou de personnes facturé par un tiers (611 sur achats, 612 sur ventes, 618 voyages). Dès qu’il s’agit d’entretenir, de réparer ou d’assurer la maintenance d’un bien (réparation d’un camion en panne à Edéa, contrat de maintenance du torréfacteur ou de la toiture), on utilise obligatoirement le compte 624 (6241 biens immobiliers, 6242 biens mobiliers et matériel de transport, 6243 maintenance) sur la ligne RH (Services extérieurs). Le compte 615 du plan français n’existe pas en SYSCOHADA. »',
   boardHeader:`Pour une facture de maintenance / réparation d’un camion utilitaire ou d’une machine de ${A.toLocaleString('fr-FR')} XAF HT :`,
   boardBullets:[
    `Débit : Compte 6242 (Entretien et réparations des biens mobiliers, sous 624, ligne RH Services extérieurs) pour ${A.toLocaleString('fr-FR')} XAF.`,
    `Débit : Compte 4452 (État, TVA récupérable sur services 19,25 %, ligne BJ) pour ${vat1925.toLocaleString('fr-FR')} XAF.`,
    `Crédit : Compte 521 (Banques locales, ou 4011 Fournisseurs) pour ${ttc1925.toLocaleString('fr-FR')} XAF.`
   ],
   lines:[
    {account:'6242',debit:A,credit:0,why:'Sous-compte officiel SYSCOHADA révisé pour l’entretien et la réparation des équipements et véhicules (sous 624, ligne RH — jamais en 61 ni en 615 !).'},
    {account:'4452',debit:vat1925,credit:0,why:'TVA déductible à 19,25 % (admise sur les camions utilitaires et machines industrielles, exclue sur les véhicules de tourisme).'},
    {account:'521',debit:0,credit:ttc1925,why:'Règlement bancaire traçable au garage ou prestataire de maintenance (ligne BS).'}
   ]
  }
,
  {
   id:'q12_gestion_budgetaire_ecarts_bfr',
   keywords:['budget','budgetaire','ecart','controle de gestion','bfr','fonds de roulement','tresorerie','prevision'],
   question:'Question 12 : « Comment organisez-vous la gestion budgétaire, le suivi des écarts et la maîtrise du Besoin en Fonds de Roulement (BFR) pendant la campagne ? »',
   naturalTerm:`Contrôler pourquoi on a dépensé plus que le budget prévu (${A.toLocaleString('fr-FR')} XAF) et éviter la panne de cash`,
   proJargon:'Pilotage par budget flexible et analyse des écarts (décomposition de l’écart total en Écart sur Coût Unitaire et Écart sur Volume/Rendement), couplé à un plan de trésorerie glissant sur 13 semaines et au suivi du BFR d’exploitation.',
   trap:'Se contenter de constater en fin d’année qu’on a dépassé le budget, sans séparer ce qui vient de la hausse du prix du cacao (écart sur prix) de ce qui vient d’un gaspillage ou mauvais rendement à l’usine (écart sur quantité).',
   response:'« Je mets en place un contrôle budgétaire mensuel qui compare le budget prévisionnel au réalisé en décomposant chaque écart en deux causes : l’écart sur prix d’achat (ex. hausse du cours bord champ de la fève) et l’écart sur quantité ou rendement technique (ex. perte anormale au torréfacteur). En parallèle, comme la collecte du cacao exige du cash immédiat alors que les supermarchés et le remboursement des crédits de TVA export prennent du temps, je pilote le Besoin en Fonds de Roulement (BFR = Stocks + Créances − Dettes fournisseurs) avec un budget de trésorerie hebdomadaire sur 13 semaines. »',
   boardHeader:`Formules clés du contrôle budgétaire et écriture d’achat d’électricité industrielle (${A.toLocaleString('fr-FR')} XAF HT) :`,
   boardBullets:[
    'Écart Total = Coût Réel (Qté réelle × Prix réel) − Coût Budgété (Qté prévue × Prix prévu).',
    'Écart sur Prix (Coût) = (Prix réel − Prix prévu) × Quantité réelle ; Écart sur Volume (Quantité) = (Quantité réelle − Quantité prévue) × Prix prévu.',
    `Débit : Compte 6052 (Fournitures non stockables - Électricité ENEO, ligne RE) pour ${A.toLocaleString('fr-FR')} XAF.`,
    `Débit : Compte 4452 (TVA récupérable 19,25 %, ligne BJ) pour ${vat1925.toLocaleString('fr-FR')} XAF / Crédit 4011 Fournisseurs pour ${ttc1925.toLocaleString('fr-FR')} XAF.`
   ],
   lines:[
    {account:'6052',debit:A,credit:0,why:'Consommation d’énergie industrielle suivie dans le budget flexible de production (ligne RE).'},
    {account:'4452',debit:vat1925,credit:0,why:'TVA déductible sur facture ENEO (ligne BJ).'},
    {account:'4011',debit:0,credit:ttc1925,why:'Dette fournisseur d’exploitation entrant dans le calcul du BFR (ligne DJ).'}
   ]
  }
 ];
}

function askExpert(query,customAmount){
 const raw=String(query||'').trim();
 const norm=raw.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 // Extract amount from text if present, unless customAmount explicitly passed
 let amount=1000000;
 if(customAmount!==undefined&&customAmount!==null&&customAmount!==''){
  amount=positive(customAmount,'Montant');
 }else{
  const m=norm.match(/([\d][\d .]*)\s*(millions?|milliards?|fcfa|xaf|f\b)/i)||norm.match(/\b(\d{5,12})\b/);
  if(m){
   const baseNum=Number(m[1].replace(/[ .]/g,''));
   const mult=m[2]?.startsWith('milliard')?1e9:m[2]?.startsWith('million')?1e6:1;
   if(Number.isSafeInteger(baseNum*mult)&&baseNum*mult>0&&baseNum*mult<=MAX)amount=baseNum*mult;
  }else{
   const qm=norm.match(/(\d+)\s*(kg|tonnes?|sacs?|tablettes?)/i);
   if(qm){
    const qty=Number(qm[1]);
    const unitVal=qm[2].toLowerCase().startsWith('tonne')?3000000:qm[2].toLowerCase().startsWith('sac')?180000:qm[2].toLowerCase().startsWith('tablette')?1000:3500;
    if(qty>0&&qty*unitVal<=MAX)amount=qty*unitVal;
   }
  }
 }
 const scenarios=buildExpertScenarios(amount);
 // Score each scenario using keyword hits + token overlap
 let best=scenarios[0],bestScore=-1;
 const words=norm.split(/[^a-z0-9%]+/).filter(w=>w.length>=2);
 for(const sc of scenarios){
  let score=0;
  for(const kw of sc.keywords){
   const kwNorm=kw.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
   if(norm.includes(kwNorm))score+=10;
  }
  const hay=(sc.question+' '+sc.naturalTerm+' '+sc.proJargon+' '+sc.trap+' '+sc.response).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  for(const w of words){
   if(hay.includes(w))score+=2;
  }
  if(score>bestScore){bestScore=score;best=sc;}
 }
 // Also match relevant jargon dictionary entries
 const jargonMatches=JARGON_DICTIONARY.filter(j=>{
  const h=(j.natural+' '+j.jargon+' '+j.accounts+' '+j.domain).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  return words.some(w=>w.length>=3&&h.includes(w));
 }).slice(0,5);
 return {query:raw,amount,scenario:best,allScenarios:scenarios,jargonMatches:jargonMatches.length?jargonMatches:JARGON_DICTIONARY.slice(0,4)};
}

/* === NOUVEAU V2.1 : CALCULATEUR DE GESTION BUDGÉTAIRE & ANALYSE DES ÉCARTS (PRÉVU VS RÉALISÉ) === */
function budgetVariance(rows){
 if(!Array.isArray(rows)||!rows.length)throw Error('Aucune ligne budgétaire');
 let totalBudget=0,totalActual=0;
 const details=rows.map(r=>{
  const name=String(r.name||'Poste').trim();
  const qPrev=positive(r.qPrev,'Quantité prévue'),pPrev=positive(r.pPrev,'Coût unitaire prévu');
  const qReal=positive(r.qReal,'Quantité réelle'),pReal=positive(r.pReal,'Coût unitaire réel');
  const budget=qPrev*pPrev,actual=qReal*pReal;
  const totalVar=actual-budget; // >0 = dépassement de coût (défavorable pour une charge)
  const priceVar=(pReal-pPrev)*qReal; // Écart sur prix/coût
  const volVar=(qReal-qPrev)*pPrev; // Écart sur quantité/volume
  totalBudget+=budget;totalActual+=actual;
  return {name,account:r.account||'6021',qPrev,pPrev,qReal,pReal,budget,actual,totalVar,priceVar,volVar,pct:budget>0?((actual-budget)/budget)*100:0};
 });
 return {details,totalBudget,totalActual,totalVariance:totalActual-totalBudget,consumptionPct:totalBudget>0?(totalActual/totalBudget)*100:0};
}


/* === NOUVEAU V2.2 : MATRICE UNIVERSELLE 5 DIMENSIONS & GÉNÉRATEUR DE 10 SCÉNARIOS PAR COMPTE, SOUS-COMPTE ET LIGNE === */
const CAMEROON_CITIES=['Douala (Bonabéri)','Yaoundé (Bastos)','Kumba','Obala','Sangmélima','Foumban','Bafoussam','Kribi (Zone Portuaire)','Edéa (Zone Industrielle)','Garoua','Nkongsamba','Mbalmayo','Bertoua','Limbe','Ngaoundéré','Ebolowa','Bamenda','Maroua','Dschang','Buea'];
const SECTORS_MATRIX={
 Agrobusiness:{label:'1. Agrobusiness & Transformation (Cacao, Café, Palmier, Coton)',mainBuy:'6021',mainStock:'321',mainSale:'7021',exportSale:'7022',item:'fèves de cacao, café, huile de palme et intrants agricoles (6021 transformation / 6011 négoce)',partner:'Coopérative planteurs de Kumba / Obala / Sangmélima',taxRule:'Nomenclature SYSCOHADA : 6021 (ligne RC) et stock 321 pour la transformation industrielle vs 6011 (ligne RA) et stock 311 pour le négoce en l’état. Exonération TVA sur produits du cru (art. 128 CGI), précompte de 5 % sur non-immatriculés (447), abattement 50 % transformation locale (art. 124 A CGI sous validation DGI).'},
 Industrie_Chocolaterie:{label:'2. Industrie Manufacturière, Chocolaterie, Brasserie & Boissons',mainBuy:'6021',mainStock:'371',mainSale:'7021',exportSale:'7022',item:'masse de cacao, beurre, sucre, emballages aluminium et énergie machine',partner:'Usine Zone Industrielle Bonabéri / Bassa / Edéa',taxRule:'Suivi des stocks SYSCOHADA révisé en 3 stades : matières premières (32/321, var. 6032 ligne RD), produits intermédiaires/semi-finis (371 ou en-cours 34, var. 737/734 ligne TE) et produits finis (36/361, var. 736 ligne TE) au CMUP. Droits d’accises 5 % (art. 142 CGI) inclus dans la base TVA (art. 136 CGI).'},
 Transport_Logistique:{label:'3. Transport Routier, Maritime, Aérien & Logistique',mainBuy:'6053',mainStock:'33',mainSale:'706',exportSale:'706',item:'carburants (6053/6042), transports (61) et maintenance de flotte (6242)',partner:'Station Total Douala / Garage Axe Lourd Edéa / Port de Kribi',taxRule:'TVA sur carburants routiers strictement NON déductible (art. 144 CGI, comptabilisation TTC en 6053 ou 6042), entretien et réparations de camions en 6242 (ligne RH, jamais en 61 ni 615 !), taxe à l’essieu (641), amendes routières (6581) non déductibles de l’IS.'},
 Digital_Services:{label:'4. Technologies, Digital, Fintech, Télécoms & SaaS',mainBuy:'6324',mainStock:'213',mainSale:'706',exportSale:'706',item:'développement logiciel, honoraires IT (6324), redevances SaaS (6343) et logiciels (213)',partner:'Développeur freelance Paris / Agence Web Abidjan / Silicon Mountain Buea',taxRule:'Honoraires et conseils IT en 6324 (ligne RH — et non 6224 qui concerne les malis sur emballages !), retenue TSR de 15 % sur prestataires non-résidents (compte 447), immobilisation des logiciels en 213 (ligne AF sous AD, amortis en 2813).'},
 BTP_Immobilier:{label:'5. BTP, Génie Civil, Promotion Immobilière & Marchés Publics',mainBuy:'6052',mainStock:'231',mainSale:'706',exportSale:'706',item:'ciment, fer à béton, location d’engins et décomptes de travaux',partner:'Cimenterie de Bonabéri / Maître d’ouvrage Yaoundé',taxRule:'Retenue de 15 % sur loyers commerciaux (6221/447), retenue de garantie 10 % sur chantiers, retenue à la source TVA (19,25 %) et AIR (2,2 % ou 5,5 %) sur marchés publics, cautions en 274/275.'},
 Commerce_Import_Export:{label:'6. Commerce de Gros, Supermarchés & Import-Export',mainBuy:'6012',mainStock:'31',mainSale:'7011',exportSale:'7012',item:'conteneurs de marchandises générales et biens de grande consommation',partner:'Fournisseur Port Autonome de Kribi / Grossiste Akwa / Supermarché Casino',taxRule:'Valeur en douane CAF + droits de douane + précompte douanier à l’importation, TVA locale 19,25 % (4431), démarque inconnue et dépréciation 6593/391.'},
 Mines_Foret_Energie:{label:'7. Mines, Carrières, Forêt, Bois & Hydrocarbures',mainBuy:'604',mainStock:'32',mainSale:'7021',exportSale:'7022',item:'grumes, bois débités, granulats et équipements d’extraction',partner:'Exploitation forestière Bertoua / Est-Cameroun',taxRule:'Redevance Forestière Annuelle (RFA), taxe d’abattage et taxe d’extraction (641), provisions pour remise en état des sites (198/691).'},
 Banque_Microfinance:{label:'8. Banque, Microfinance (EMF COBAC), Assurance & Mobile Money',mainBuy:'632',mainStock:'552',mainSale:'706',exportSale:'706',item:'opérations de crédit, commissions Mobile Money et garanties financières',partner:'Établissement de Microfinance Yaoundé / Bafoussam',taxRule:'Intérêts et commissions bancaires (671/771), taxe sur les transferts d’argent, provisionnement réglementaire des créances en souffrance (6594/491).'},
 Sante_Education:{label:'9. Santé, Cliniques, Pharmacies & Éducation Privée / Universités',mainBuy:'6011',mainStock:'31',mainSale:'7011',exportSale:'706',item:'médicaments, réactifs de laboratoire et frais de scolarité',partner:'Pharmacie & Clinique de Yaoundé / Institut Universitaire Douala',taxRule:'Exonération de TVA sur les frais de scolarité, actes médicaux et produits pharmaceutiques essentiels (art. 128 CGI), règle du prorata de déduction de TVA pour activités mixtes (art. 147 CGI), CNPS PF à 3,70 % pour l’enseignement privé.'},
 Hotellerie_Restauration:{label:'10. Hôtellerie, Restauration, Tourisme & Événementiel',mainBuy:'6021',mainStock:'32',mainSale:'706',exportSale:'706',item:'denrées alimentaires périssables, boissons et nuitées d’hôtel',partner:'Hôtel & Restaurant Kribi / Limbe / Yaoundé',taxRule:'Taxe de séjour et licence de débit de boissons (641), gestion stricte PEPS/FIFO des denrées périssables, droits d’accises sur boissons.'},
 Professions_Liberales:{label:'11. Professions Libérales, Cabinets (Experts, Avocats, Ingénieurs)',mainBuy:'605',mainStock:'411',mainSale:'706',exportSale:'706',item:'missions d’audit, d’expertise comptable, juridique et d’ingénierie',partner:'Cabinet Conseil Douala / Yaoundé',taxRule:'Seuil du Régime du Réel abaissé à 30 millions FCFA de CA HT (art. 93 quater CGI), retenue à la source de 5,5 % sur honoraires versés par les entreprises, gestion des débours.'},
 ONG_Coop_SYCEBNL:{label:'12. Coopératives (COOP-CA), ONG, Associations & Projets (SYCEBNL)',mainBuy:'6011',mainStock:'311',mainSale:'7011',exportSale:'7012',item:'collecte groupée des membres, subventions et projets communautaires',partner:'COOP-CA Cacao du Sud-Ouest / ONG Développement',taxRule:'Référentiel OHADA SYCEBNL pour les entités à but non lucratif, obligation de retenue à la source sur les salaires (IRPP/CNPS) et sur les loyers (15 %) même pour une ONG ou coopérative.'}
};
function formatAsciiBox(lines){
 const pad=(str,w)=>{const s=String(str);return s.length>=w?s.slice(0,w):s+' '.repeat(w-s.length);};
 const padL=(str,w)=>{const s=String(str);return s.length>=w?s.slice(0,w):' '.repeat(w-s.length)+s;};
 let out='┌────────┬──────────┬──────────────────────────────────────┬──────────────────┐\n';
 for(const l of lines){
  const side=l.debit>0?'Débit ':'Crédit';
  const amt=(l.debit>0?l.debit:l.credit).toLocaleString('fr-FR')+' XAF';
  const lbl=(l.shortLabel||explainAccount(l.account).label).slice(0,36);
  out+=`│ ${pad(side,6)} │ ${pad(l.account,8)} │ ${pad(lbl,36)} │ ${padL(amt,16)} │\n`;
 }
 out+='└────────┴──────────┴──────────────────────────────────────┴──────────────────┘';
 return out;
}

/* Génère 15 scénarios d'école distincts (et au-delà à la demande) pour N'IMPORTE QUEL compte, sous-compte ou ligne du Bilan/Résultat */
function getAccountScenarios(codeOrRef,baseAmount=1000000,opts={}){
 const raw=String(codeOrRef||'6011').trim().toUpperCase();
 let accCode=raw;
 const REF_FALLBACK={
  'AD':'213','AE':'211','AF':'213','AG':'213','AH':'213','AI':'222','AJ':'222','AK':'231','AL':'241','AM':'241','AN':'245','AP':'241','AQ':'275','AR':'274','AS':'275','AZ':'241',
  'BA':'411','BB':'32','BG':'411','BH':'4091','BI':'411','BJ':'4452','BK':'32','BQ':'521','BR':'521','BS':'521','BT':'521','BU':'471','BZ':'521',
  'CA':'101','CB':'101','CD':'101','CE':'111','CF':'111','CG':'111','CH':'121','CJ':'131','CL':'101','CM':'101','CP':'101',
  'DA':'162','DB':'162','DC':'191','DD':'162','DF':'162','DH':'481','DI':'411','DJ':'4011','DK':'447','DM':'471','DN':'4991','DP':'4991','DQ':'561','DR':'561','DT':'561','DV':'471','DZ':'101',
  'TA':'701','RA':'6011','RB':'6031','XA':'701','TB':'702','TC':'706','TD':'707','XB':'702','TE':'736','TF':'702','TG':'702','TH':'781','TI':'781',
  'RC':'6021','RD':'6032','RE':'6052','RF':'6033','RG':'611','RH':'624','RI':'641','RJ':'6593','XC':'702','RK':'661','XD':'702','TJ':'7593','RL':'6813','XE':'702',
  'TK':'771','TL':'771','TM':'771','RM':'671','RN':'671','XF':'771','XG':'702','TN':'82','TO':'84','RO':'81','RP':'83','XH':'82','RQ':'87','RS':'891','XI':'131'
 };
 if(!SYSCOHADA_ACCOUNTS[accCode]){
  const byRef=Object.values(SYSCOHADA_ACCOUNTS).find(a=>a.refBilan===raw);
  if(byRef)accCode=byRef.code;
  else if(REF_FALLBACK[raw])accCode=REF_FALLBACK[raw];
  else if(SYSCOHADA_ACCOUNTS[raw.toLowerCase()])accCode=raw.toLowerCase();
 }
 const info=explainAccount(accCode);
 const A=positive(baseAmount||1000000,'Montant');
 const sectorKey=opts.sector&&SECTORS_MATRIX[opts.sector]?opts.sector:'Agrobusiness';
 const sec=SECTORS_MATRIX[sectorKey];
 const city=opts.city||CAMEROON_CITIES[0];
 const totalCount=Math.max(15,Math.min(50,Number(opts.count||15)));

 const vat=rate(A,1925),ttc=A+vat;
 const r5=rate(A,500),net95=A-r5;
 const r15=rate(A,1500),net85=A-r15;
 const r22=rate(A,220),r55=rate(A,550);
 const half=Math.round(A/2),dep20=rate(A,2000),dep10=rate(A,1000);
 const exc5=rate(Math.floor(A/1000)*1000,500),vatExc=rate(Math.floor((A+exc5)/1000)*1000,1925);

 const isDebitNormal=info.normalSide.startsWith('Débit')||(info.classe===6||info.classe===2||info.classe===3||info.classe===5||accCode.startsWith('41')||accCode.startsWith('409')||accCode.startsWith('421')||accCode.startsWith('445'));

 const makeLines=(variantIdx)=>{
  const vMod=((variantIdx-1)%15)+1;
  const scale=variantIdx>15?Math.round(A*(1+((variantIdx-15)*0.15))):A;
  const sVat=rate(scale,1925),sTtc=scale+sVat,sR5=rate(scale,500),sR15=rate(scale,1500),sHalf=Math.round(scale/2),sDep20=rate(scale,2000),sDep10=rate(scale,1000);

  if(accCode==='6011'||accCode==='6021'||accCode==='6012'||accCode==='604'){
   switch(vMod){
    case 1: return [{account:accCode,debit:scale,credit:0,why:`Achat HT sur facture normalisée e-Billing (${info.label}, ligne ${info.refBilan}).`},{account:'4451',debit:sVat,credit:0,why:'TVA récupérable 19,25 % sur facture conforme avec NIU.'},{account:'521',debit:0,credit:sTtc,why:'Règlement par virement bancaire traçable (art. 143 CGI).'}];
    case 2: return [{account:accCode,debit:scale,credit:0,why:`Achat en brousse (${city}) sous bordereau interne certifié.`},{account:'447',debit:0,credit:sR5,why:'Précompte / retenue à la source de 5 % sur non-immatriculé.'},{account:'571',debit:0,credit:scale-sR5,why:'Paiement net (95 %) en espèces au producteur.'}];
    case 3: return [{account:accCode,debit:sTtc,credit:0,why:'Achat payé en espèces >= 100 000 XAF : la TVA perd son caractère déductible (art. 143 CGI).'},{account:'571',debit:0,credit:sTtc,why:'Sortie de caisse espèces (déclenche une réintégration fiscale au Tableau 22 DSF).'}];
    case 4: return [{account:accCode,debit:sHalf,credit:0,why:'Lot de cacao partiellement moisi acheté à moitié prix en brousse sans reçu officiel.'},{account:'447',debit:0,credit:rate(sHalf,500),why:'Précompte 5 % sur le prix effectif du bordereau.'},{account:'571',debit:0,credit:sHalf-rate(sHalf,500),why:'Paiement net au vendeur après réfaction de prix.'}];
    case 5: return [{account:accCode,debit:scale,credit:0,why:'Valeur CAF + droits de douane incorporés au coût d’achat à l’importation (Port de Kribi/Douala).'},{account:'4451',debit:sVat,credit:0,why:'TVA acquittée au cordon douanier sur quittance SGS/SYDONIA.'},{account:'521',debit:0,credit:sTtc,why:'Règlement bancaire du fournisseur et du transitaire.'}];
    case 6: return [{account:accCode,debit:scale,credit:0,why:'Achat principal de matières / marchandises.'},{account:'611',debit:sDep20,credit:0,why:'Frais de transport amont sur achats facturés pour acheminer le lot à l’usine.'},{account:'4011',debit:0,credit:scale+sDep20,why:'Dette globale envers le groupement fournisseur/transporteur.'}];
    case 7: return [{account:accCode,debit:scale,credit:0,why:'Achat direct auprès d’une COOP-CA / GIC de producteurs locaux (produit du cru exonéré de TVA, art. 128 CGI).'},{account:'552',debit:0,credit:scale,why:'Paiement traçable par compte marchand Mobile Money (552).'}];
    case 8: return [{account:accCode,debit:scale,credit:0,why:'Réception de la livraison finale soldant l’avance versée en début de campagne.'},{account:'4091',debit:0,credit:sHalf,why:'Imputation de l’avance de 50 % déjà versée au fournisseur (4091).'},{account:'521',debit:0,credit:scale-sHalf,why:'Paiement du solde restant par banque (521).'}];
    case 9: return [{account:accCode,debit:scale,credit:0,why:'Constatation à la clôture (cut-off 31/12) d’un lot réceptionné dont la facture papier n’est pas encore parvenue.'},{account:'408',debit:0,credit:scale,why:'Fournisseurs - Factures non parvenues (408, ligne DJ).'}];
    case 10: return [{account:'4011',debit:sDep10,credit:0,why:'Réduction de la dette fournisseur suite à une facture d’avoir pour rabais/ristourne (art. 137 CGI).'},{account:accCode,debit:0,credit:sDep10,why:`Diminution du coût d’achat sur le compte ${accCode}.`}];
    case 11: return [{account:accCode,debit:scale,credit:0,why:'Achat d’intrants pour une activité mixte (ex. pharmacie / agro) avec prorata de TVA déductible à 80 % (art. 147 CGI).'},{account:'4451',debit:rate(sVat,8000),credit:0,why:'Fraction (80 %) de la TVA admise en déduction selon le prorata.'},{account:'521',debit:0,credit:scale+rate(sVat,8000),why:'Décaissement bancaire.'}];
    case 12: return [{account:accCode,debit:scale,credit:0,why:'Achat de matières avec consignation d’emballages récupérables (palettes / fûts).'},{account:'4094',debit:sDep10,credit:0,why:'Créance sur emballages consignés à rendre au fournisseur (4094).'},{account:'4011',debit:0,credit:scale+sDep10,why:'Dette totale envers le fournisseur.'}];
    case 13: return [{account:accCode,debit:scale,credit:0,why:'Achat groupé de campagne financé par un crédit de campagne / découvert bancaire dédié.'},{account:'561',debit:0,credit:scale,why:'Tirage sur ligne de crédit de trésorerie de campagne (561, ligne DR).'}];
    case 14: return [{account:accCode,debit:scale,credit:0,why:'Achat de matières premières locales éligibles au suivi de l’abattement de 50 % sur l’IS (art. 124 A CGI).'},{account:'521',debit:0,credit:scale,why:'Paiement bancaire documenté pour le dossier de validation DGI.'}];
    default: return [{account:'4011',debit:sDep20,credit:0,why:'Contrepassation après contrôle du Commissaire aux comptes d’une facture saisie en double.'},{account:accCode,debit:0,credit:sDep20,why:`Annulation du doublon sur le compte ${accCode}.`}];
   }
  }
  if(accCode==='6593'||accCode==='39'||accCode==='391'||accCode==='392'){
   const stockContra=accCode==='391'?'391':accCode==='39'?'39':'392';
   if(vMod===5||vMod===11)return [{account:stockContra,debit:sDep20,credit:0,why:'Annulation (reprise) de l’ancienne dépréciation sur le stock vendu ou assaini.'},{account:'7593',debit:0,credit:sDep20,why:'Reprise de charges pour dépréciations sur stocks (ligne TJ du Compte de résultat).'}];
   if(vMod===9)return [{account:'6593',debit:sDep20,credit:0,why:'Dépréciation sur stocks (6593, Classe 3).'},{account:'6594',debit:sR5,credit:0,why:'Dépréciation simultanée sur créances clients (6594, Classe 4).'},{account:stockContra,debit:0,credit:sDep20,why:'Correcteur d’actif stock (ligne BB).'},{account:'491',debit:0,credit:sR5,why:'Correcteur d’actif client (ligne BI).'}];
   const val=vMod===2?sHalf:vMod===4?sR15:vMod===6?sR5:vMod===10?scale:sDep20;
   return [{account:'6593',debit:val,credit:0,why:`Dotation aux charges pour dépréciations sur stocks (6593, ligne RJ) — Cas ${vMod}/15.`},{account:stockContra,debit:0,credit:val,why:`Inscription au crédit du compte correcteur ${stockContra} (ligne BB - Amort./Dépréc.).`}];
  }
  const counterBank=vMod===2||vMod===3?'571':vMod===7||vMod===9?'552':vMod===8||vMod===12?'4011':'521';
  const amtUse=vMod===4?sHalf:vMod===6||vMod===10?sDep20:vMod===11?sDep10:scale;
  if(isDebitNormal){
   if(vMod===10||vMod===15)return [{account:counterBank,debit:sDep20,credit:0,why:'Régularisation / contrepassation d’audit ou avoir obtenu.'},{account:accCode,debit:0,credit:sDep20,why:`Diminution ou contrepassation au crédit du compte ${accCode}.`}];
   if(vMod===1&&info.classe===6&&!['6054','641','646','651','658','6581','659','6591','6593','6594','6598','661','6611','6615','664','671','6813','891'].includes(accCode)){
    const v=rate(amtUse,1925);
    return [{account:accCode,debit:amtUse,credit:0,why:`Enregistrement HT au débit du compte ${accCode} (${info.label}, ligne ${info.refBilan}).`},{account:'4451',debit:v,credit:0,why:'TVA récupérable 19,25 % sur facture normalisée e-Billing (ligne BJ).'},{account:'521',debit:0,credit:amtUse+v,why:'Règlement TTC par virement bancaire.'}];
   }
   if((vMod===2||vMod===6)&&info.classe===6){
    const w=(vMod===6||accCode.startsWith('622')||accCode.startsWith('632'))?rate(amtUse,1500):rate(amtUse,500);
    return [{account:accCode,debit:amtUse,credit:0,why:`Charge brute enregistrée au débit de ${accCode} (ligne ${info.refBilan}).`},{account:'447',debit:0,credit:w,why:`Retenue à la source fiscale (${w===rate(amtUse,1500)?'15 % loyer ou TSR non-résident':'5 % précompte informel'}) au profit de la DGI (ligne DK).`},{account:counterBank,debit:0,credit:amtUse-w,why:'Paiement net au bénéficiaire.'}];
   }
   return [{account:accCode,debit:amtUse,credit:0,why:`Mouvement au débit du compte ${accCode} (${info.label}) rattaché à la ligne ${info.refBilan}.`},{account:accCode.startsWith('3')?'6032':accCode.startsWith('68')?'284':counterBank,debit:0,credit:amtUse,why:'Contrepartie équilibrée en partie double.'}];
  }else{
   if(vMod===10||vMod===15)return [{account:accCode,debit:sDep20,credit:0,why:`Diminution, apurement ou contrepassation au débit du compte ${accCode}.`},{account:counterBank,debit:0,credit:sDep20,why:'Sortie de trésorerie ou ajustement de tiers correspondant.'}];
   if(vMod===7&&accCode.startsWith('70')){
    // Marché public camerounais : l'État retient la TVA (19,25%) et l'AIR (2,2%) à la source !
    const v=rate(amtUse,1925),air=rate(amtUse,220),netTr=amtUse-air;
    return [{account:'521',debit:netTr,credit:0,why:'Virement net reçu du Trésor Public (HT moins AIR de 2,2 % retenu à la source, TVA de '+v.toLocaleString('fr-FR')+' XAF retenue à la source).'},{account:'441',debit:air,credit:0,why:'Acompte IS (AIR 2,2 %) retenu à la source par l’État, imputable sur l’IS annuel (ligne DK).'},{account:accCode,debit:0,credit:amtUse,why:`Chiffre d’affaires HT sur marché public (${accCode}, ligne ${info.refBilan}).`}];
   }
   if(vMod===1&&accCode.startsWith('70')&&accCode!=='7012'&&accCode!=='7022'){
    const v=rate(amtUse,1925);
    return [{account:'411',debit:amtUse+v,credit:0,why:'Créance client TTC sur le marché local (ligne BI).'},{account:accCode,debit:0,credit:amtUse,why:`Produit Hors Taxes inscrit au crédit de ${accCode} (ligne ${info.refBilan}).`},{account:'4431',debit:0,credit:v,why:'TVA collectée à 19,25 % à reverser avant le 15 du mois (ligne DK).'}];
   }
   return [{account:accCode.startsWith('28')?'6813':accCode.startsWith('39')?'6593':accCode.startsWith('491')?'6594':accCode.startsWith('7')?'411':'521',debit:amtUse,credit:0,why:'Contrepartie au débit (emploi).'},{account:accCode,debit:0,credit:amtUse,why:`Enregistrement au crédit du compte ${accCode} (${info.label}, ligne ${info.refBilan}).`}];
  }
 };

 const baseArchetypes=[
  {tag:'Régime du Réel · Facture e-Billing Standard',ctx:`Opération standard à ${city} avec un partenaire formel immatriculé (NIU actif)`,trap:`Oublier de vérifier la conformité de la facture e-Billing/NIU ou confondre le compte ${accCode} (${info.label}) avec un compte voisin.`,resp:`« J’impute l’opération sur le compte ${accCode} (${info.label}) qui alimente directement la ligne ${info.refBilan} (${info.refLabel}). Au Régime du Réel, je sécurise la pièce normalisée et le règlement bancaire. »`},
  {tag:'Brousse / Secteur Informel · Retenue à la source',ctx:`Transaction réalisée à ${CAMEROON_CITIES[2]} ou ${CAMEROON_CITIES[3]} avec un intervenant non-immatriculé sans facture normalisée`,trap:'Payer le montant brut sans opérer la retenue à la source légale (précompte de 5 % ou retenue de 15 %) et sans émettre de bordereau interne certifié.',resp:`« Face à un fournisseur ou bailleur non-immatriculé, je matérialise l’opération sur le compte ${accCode} par un bordereau interne certifié et je retiens à la source l’impôt dû au crédit du compte 447. »`},
  {tag:'Piège du Cash ≥ 100 000 XAF (Art. 143 & 7 CGI)',ctx:`Règlement en espèces au guichet caisse (571) d’une opération de ${ttc.toLocaleString('fr-FR')} XAF dépassant le plafond légal de 100 000 FCFA`,trap:'Croire qu’on peut payer en espèces jusqu’à 500 000 FCFA : dès 100 000 FCFA (art. 7 & 143 CGI), le paiement en cash fait perdre la déductibilité de la TVA et de la charge à l’IS !',resp:`« Dès 100 000 FCFA, tout paiement en espèces fait perdre la déduction de la TVA et impose une réintégration fiscale au Tableau 22 de la DSF. J’exige donc un virement (521) ou Mobile Money marchand (552). »`},
  {tag:'Avarie, Humidité, Panne ou Réfaction de Prix',ctx:`Anomalie physique constatée à la réception ou en magasin à ${CAMEROON_CITIES[0]} (lot endommagé ou humide à 50 %)`,trap:'Modifier une écriture validée ou passer une perte sèche sans procès-verbal contradictoire d’huissier ou de commissaire aux avaries.',resp:`« En présence d’une avarie affectant le poste ${accCode} (ligne ${info.refBilan}), j’appuie la réfaction ou la dépréciation (6593/391) sur un procès-verbal contradictoire pour la rendre fiscalement déductible. »`},
  {tag:'Flux International : Import Douane (CAF/SGS) ou Export ZLECAf',ctx:`Opération transfrontalière via le Port de Kribi / Douala ou vers la zone CEMAC / ZLECAf`,trap:'Oublier d’incorporer les droits de douane au coût d’entrée à l’import, ou oublier la déclaration EX1 et l’attestation de rapatriement des devises à l’export.',resp:`« Pour ce flux international rattaché au compte ${accCode}, je réconcilie la comptabilité SYSCOHADA avec la liasse douanière (SYDONIA/SGS) et bancaire (rapatriement des fonds). »`},
  {tag:'Prestation Étrangère & Numérique · Retenue TSR 15 %',ctx:`Règlement d’un prestataire ou éditeur logiciel non-résident (Paris, Abidjan, Dublin) lié au poste ${accCode}`,trap:'Payer un prestataire étranger sans retenir la Taxe Spéciale sur les Revenus (TSR de 15 % au crédit du compte 447).',resp:`« Tout paiement à un prestataire non-résident est soumis à la retenue TSR (15 % sauf convention fiscale) logée au crédit du compte 447 avant transfert bancaire des 85 % nets. »`},
  {tag:'Marché Public & Commande de l’État (Retenue Trésor)',ctx:`Exécution d’un marché public ou bon de commande administratif à Yaoundé impliquant le compte ${accCode}`,trap:'Ignorer que sur un marché public camerounais, l’État retient à la source la TVA (19,25 %) et l’acompte IS (AIR de 2,2 % ou 5,5 %) lors du virement du Trésor.',resp:`« Sur commande publique, je comptabilise le produit ou l’opération et j’impute immédiatement l’attestation de retenue à la source (TVA et AIR) délivrée par le comptable public pour ne pas payer l’impôt deux fois. »`},
  {tag:`Spécificité Sectorielle · ${sec.label}`,ctx:`Application métier dans le secteur ${sec.label} (${sec.item})`,trap:`Ignorer la règle fiscale sectorielle : ${sec.taxRule}`,resp:`« Dans le secteur ${sec.label}, l’usage du compte ${accCode} (ligne ${info.refBilan}) respecte la justification SYSCOHADA (${info.why}) et la règle sectorielle : ${sec.taxRule} »`},
  {tag:'Coopérative (COOP-CA / GIC), PME en IGS ou Adhérent CGA',ctx:`Opération traitée avec une COOP-CA ou par une PME adhérente à un Centre de Gestion Agréé (CGA) réglée par Mobile Money (552)`,trap:'Oublier de tracer les paiements électroniques en 552 ou appliquer d’office un abattement CGA sans vérifier l’adhésion active.',resp:`« Je trace le règlement Mobile Money dans le compte SYSCOHADA 552 et je vérifie les conditions d’abattement CGA (50 % sur l’IGS ou sur le minimum de perception IS). »`},
  {tag:'Avance, Acompte ou Dépôt de Garantie (Cautionnement)',ctx:`Opération avec acompte initial de 50 % (${half.toLocaleString('fr-FR')} XAF) ou dépôt de garantie/cautionnement`,trap:'Passer une caution de loyer (274/275) ou une simple avance (4091/4191) directement en charge ou produit définitif.',resp:`« Je distingue strictement les avances et cautions (comptes de bilan 4091, 4191, 274/275) des charges et produits définitifs rattachés au compte ${accCode}. »`},
  {tag:'Rabais, Remise, Ristourne (RRR) & Facture d’Avoir',ctx:`Obtention ou octroi d’une réduction commerciale de 10 % (${dep10.toLocaleString('fr-FR')} XAF) par facture d’avoir (art. 137 CGI)`,trap:'Rayer la facture initiale au lieu d’émettre ou d’enregistrer une facture d’avoir rectificative régularisant la base HT et la TVA.',resp:`« Conformément à l’article 137 du CGI et au SYSCOHADA, la réduction hors facture initiale est constatée sur facture d’avoir, ajustant proprement le compte ${accCode} et la taxe associée. »`},
  {tag:'Travaux de Clôture, Cut-Off 31/12 & Valorisation CMUP / PEPS',ctx:`Régularisation d’inventaire au 31 décembre sur le poste ${accCode} (ligne ${info.refBilan} de la DSF)`,trap:'Omettre le rattachement des factures non parvenues (408), des charges constatées d’avance (476) ou la valorisation CMUP/PEPS des stocks.',resp:`« À la clôture de l’exercice, j’applique le postulat de spécialisation des exercices pour que le solde du compte ${accCode} sur la ligne ${info.refBilan} de la DSF soit exact au franc près. »`},
  {tag:'Sinistre Majeur, Mise au Rebut ou Destruction devant Agent DGI',ctx:`Destruction officielle ou sortie exceptionnelle affectant le poste ${accCode}`,trap:'Détruire un stock périmé ou mettre au rebut une machine sans convocation d’un huissier et de l’administration fiscale, ce qui entraîne une régularisation de TVA et un rejet d’IS.',resp:`« Toute destruction ou mise au rebut est documentée par procès-verbal officiel afin de préserver la déductibilité de la perte et d’éviter la réintégration de la TVA initialement déduite. »`},
  {tag:'Passage Résultat Comptable → Résultat Fiscal (Tableau 22 DSF)',ctx:`Analyse de la déductibilité fiscale du compte ${accCode} lors de la détermination du bénéfice imposable à l’IS`,trap:'Confondre résultat comptable et résultat fiscal sans opérer les réintégrations (amendes 6581, excédents, cash >= 100k) et déductions (abattement 50 % art. 124 A CGI).',resp:`« Lors de l’établissement du Tableau 22 de la DSF, j’analyse chaque mouvement du compte ${accCode} pour opérer les réintégrations ou déductions extra-comptables requises par le CGI. »`},
  {tag:'Audit du Commissaire aux Comptes (CAC) & Contrepassation',ctx:`Contrôle légal ISA/OHADA du CAC et correction par contrepassation d’un écart de ${dep20.toLocaleString('fr-FR')} XAF sur le compte ${accCode}`,trap:'Altérer rétroactivement une pièce validée au lieu de passer une écriture de contrepassation conservant la traçabilité.',resp:`« Pour garantir l’intangibilité du journal exigée par l’Acte uniforme OHADA, toute correction sur le compte ${accCode} passe par une contrepassation référencée et vérifiable par le Commissaire aux comptes. »`}
 ];

 const results=[];
 for(let i=1;i<=totalCount;i++){
  const arch=baseArchetypes[(i-1)%baseArchetypes.length];
  const cityPick=CAMEROON_CITIES[(i-1)%CAMEROON_CITIES.length];
  const lines=makeLines(i);
  const extraTag=i>15?` · TIRAGE PROCÉDURAL #${i} (${cityPick.toUpperCase()})`:'';
  results.push({
   variation:i,
   totalVariations:totalCount,
   code:accCode,
   accountLabel:info.label,
   refBilan:info.refBilan,
   refLabel:info.refLabel,
   headerTag:`[SCÉNARIO COMPTE ${accCode} (LIGNE ${info.refBilan}) - VARIATION ${i}/${totalCount} · ${arch.tag.toUpperCase()}${extraTag}]`,
   title:`Variation ${i}/${totalCount} : ${arch.tag}${i>15?' ('+cityPick+')':''}`,
   prompt:`${arch.ctx.replace(city,cityPick)} · Montant : ${lines[0].debit||lines[0].credit} XAF`,
   naturalTerm:`${info.plain} (${arch.ctx.replace(city,cityPick)})`,
   proJargon:`Imputation au compte SYSCOHADA ${accCode} (${info.label}) rattaché à la rubrique officielle ${info.refBilan} (${info.refLabel}) — ${arch.tag}.`,
   trap:arch.trap,
   response:arch.resp,
   lines,
   asciiBox:formatAsciiBox(lines)
  });
 }
 return results;
}

/* Générateur procédural 5 Dimensions (12 secteurs × 92 comptes × 15+ variations × 4 régimes × 6 structures × 20 villes = +10 000 000 de combinaisons) */
function generateProceduralScenario(params={}){
 const sector=params.sector&&SECTORS_MATRIX[params.sector]?params.sector:'Agrobusiness';
 const regime=params.regime||'Reel';
 const structure=params.structure||'SA_SARL';
 const accCode=params.account||SECTORS_MATRIX[sector].mainBuy;
 const count=Math.max(15,Number(params.count||15));
 const variation=Math.min(count,Math.max(1,Number(params.variation||1)));
 const city=params.city||CAMEROON_CITIES[(variation-1)%CAMEROON_CITIES.length];
 const amount=positive(params.amount??1200000,'Montant');
 const allScenarios=getAccountScenarios(accCode,amount,{sector,regime,structure,city,count});
 const chosen=allScenarios[variation-1]||allScenarios[0];
 const accIdx=Math.max(1,Object.keys(SYSCOHADA_ACCOUNTS).indexOf(accCode)+1);
 const secIdx=Math.max(1,Object.keys(SECTORS_MATRIX).indexOf(sector)+1);
 const regIdx=regime==='Reel'?1:regime==='Simplifie'?2:3;
 const strIdx=structure==='SA_SARL'?1:structure==='GIC_Cooperative'?2:3;
 const cityIdx=Math.max(1,CAMEROON_CITIES.indexOf(city)+1);
 const caseNumber=((accIdx*131+variation*43+secIdx*19+regIdx*11+strIdx*5+cityIdx)*(amount%997+1))%9999999+1;
 return {
  caseNumber,
  totalCombinatorialSpace:'10 580 000+ scénarios paramétriques uniques (92 comptes & sous-comptes × 15+ variations × 12 secteurs × 4 régimes × 6 structures × 20 villes × montants dynamiques)',
  sector,sectorLabel:SECTORS_MATRIX[sector].label,
  regime,structure,city,amount,
  chosen,
  allTen:allScenarios,
  allScenarios
 };
}
/* Innovation : Tableau de Passage Automatique du Résultat Comptable au Résultat Fiscal (Tableau 22 DSF Cameroun) */
function taxBridge(entries,mapping,opts={}){
 const st=detailedStatement(entries,mapping);
 const accountingResult=st.result;
 const reintegrations=[];
 const deductions=[];
 for(const e of entries){
  for(const l of e.lines){
   if(l.account==='6581'||l.account==='647'){
    reintegrations.push({label:`Amendes et pénalités non déductibles (${e.label})`,account:l.account,amount:l.debit,rule:'Art. 7 CGI : les amendes, confiscations et pénalités de toute nature sont exclues des charges déductibles.'});
   }
  }
  const hasCash571=e.lines.some(l=>l.account==='571'&&l.credit>=100000);
  const expLine=e.lines.find(l=>l.account.startsWith('6')&&l.debit>=100000);
  if(hasCash571&&expLine&&expLine.account!=='6581'&&!expLine.account.startsWith('66')){
   reintegrations.push({label:`Charge >= 100 000 XAF réglée en espèces (${e.label})`,account:expLine.account,amount:expLine.debit,rule:'Art. 7 & 143 CGI : les charges d’un montant >= 100 000 FCFA payées en espèces sont non déductibles.'});
  }
 }
 if(opts.manualAdd>0)reintegrations.push({label:'Autres réintégrations fiscales (provisions non justifiées, excédents)',account:'Divers',amount:positive(opts.manualAdd),rule:'Tableau 22 DSF'});
 if(opts.manualDeduct>0)deductions.push({label:'Déductions fiscales autorisées (reprises de provisions déjà taxées)',account:'Divers',amount:positive(opts.manualDeduct),rule:'Tableau 22 DSF'});
 const totalReint=reintegrations.reduce((s,x)=>s+x.amount,0);
 const totalDed=deductions.reduce((s,x)=>s+x.amount,0);
 const rawFiscalResult=accountingResult+totalReint-totalDed;
 const roundedFiscalBase=Math.floor(Math.max(0,rawFiscalResult)/1000)*1000;
 const abattement124A=opts.apply124A?Math.floor(roundedFiscalBase/2):0;
 const netTaxableProfit=roundedFiscalBase-abattement124A;
 return {accountingResult,reintegrations,deductions,totalReint,totalDed,rawFiscalResult,roundedFiscalBase,abattement124A,netTaxableProfit};
}


/* === NOUVEAU V2.5 : BARÈME OFFICIEL DGI DES 10 CLASSES DE L'IMPÔT GÉNÉRAL SYNTHÉTIQUE (IGS), TABLE DES CONFUSIONS SYSCOHADA & CONNECTEUR HARMONY 2 DGI === */
const IGS_CLASSES_DETAIL=[
 {classe:1, minCa:0, maxCa:499999, rangeLabel:'< 500 000 FCFA', baseTax:20000, cgaTax:20000, quarterly:5000, dsfRequired:false, accounting:'Système Minimal de Trésorerie (SMT) · Livre des recettes/dépenses'},
 {classe:2, minCa:500000, maxCa:999999, rangeLabel:'500 000 – 999 999 FCFA', baseTax:30000, cgaTax:30000, quarterly:7500, dsfRequired:false, accounting:'Système Minimal de Trésorerie (SMT)'},
 {classe:3, minCa:1000000, maxCa:1499999, rangeLabel:'1 000 000 – 1 499 999 FCFA', baseTax:40000, cgaTax:40000, quarterly:10000, dsfRequired:false, accounting:'Système Minimal de Trésorerie (SMT)'},
 {classe:4, minCa:1500000, maxCa:1999999, rangeLabel:'1 500 000 – 1 999 999 FCFA', baseTax:50000, cgaTax:50000, quarterly:12500, dsfRequired:false, accounting:'Système Minimal de Trésorerie (SMT)'},
 {classe:5, minCa:2000000, maxCa:2499999, rangeLabel:'2 000 000 – 2 499 999 FCFA', baseTax:60000, cgaTax:60000, quarterly:15000, dsfRequired:false, accounting:'Système Minimal de Trésorerie (SMT)'},
 {classe:6, minCa:2500000, maxCa:4999999, rangeLabel:'2 500 000 – 4 999 999 FCFA', baseTax:150000, cgaTax:150000, quarterly:37500, dsfRequired:false, accounting:'Système Minimal de Trésorerie (SMT)'},
 {classe:7, minCa:5000000, maxCa:9999999, rangeLabel:'5 000 000 – 9 999 999 FCFA', baseTax:300000, cgaTax:300000, quarterly:75000, dsfRequired:false, accounting:'Système Minimal de Trésorerie (SMT)'},
 {classe:8, minCa:10000000, maxCa:19999999, rangeLabel:'10 000 000 – 19 999 999 FCFA', baseTax:500000, cgaTax:250000, quarterly:125000, dsfRequired:true, accounting:'Comptabilité OHADA & DSF obligatoires (Art. C 44 CGI) · Abattement 50 % si CGA'},
 {classe:9, minCa:20000000, maxCa:29999999, rangeLabel:'20 000 000 – 29 999 999 FCFA', baseTax:1000000, cgaTax:500000, quarterly:250000, dsfRequired:true, accounting:'Comptabilité OHADA & DSF obligatoires (Art. C 44 CGI) · Abattement 50 % si CGA'},
 {classe:10, minCa:30000000, maxCa:49999999, rangeLabel:'30 000 000 – 49 999 999 FCFA', baseTax:2000000, cgaTax:1000000, quarterly:500000, dsfRequired:true, accounting:'Comptabilité OHADA & DSF obligatoires (Art. C 44 CGI) · Abattement 50 % si CGA'}
];

const SYSCOHADA_CONFUSIONS=[
 {
  wrong:'Utiliser 601 / 6011 pour des achats de matières premières (ex. fèves de cacao à transformer en chocolat)',
  right:'Famille 602 (6021 dans la région, 6022 hors région, 6025 frais sur achats) · Ligne RC du Compte de résultat',
  why:'En SYSCOHADA révisé, la famille 601 (ligne RA) est strictement réservée aux MARCHANDISES achetées pour être revendues en l’état (négoce). Dès que le bien est destiné à être transformé à l’usine (fèves, sucre, lait, bois, farine), il relève obligatoirement de la famille 602 (Matières premières et fournitures liées, ligne RC) !'
 },
 {
  wrong:'Mélanger le compte 624 avec les frais de transport ou utiliser le compte 615 (PCG français) pour une réparation de camion',
  right:'Compte 624 (6241 immobilier, 6242 mobilier/véhicules, 6243 maintenance · Ligne RH) vs Classe 61 (Transports · Ligne RG)',
  why:'Le compte 624 concerne exclusivement l’ENTRETIEN, LES RÉPARATIONS ET LA MAINTENANCE (ligne RH Services extérieurs). Le TRANSPORT de biens ou de personnes relève exclusivement de la classe 61 (611 sur achats, 612 sur ventes, 613 pour tiers, 618 voyages · ligne RG). Quant au compte 615 (« Entretien » en France), il n’existe pas en SYSCOHADA révisé !'
 },
 {
  wrong:'Utiliser 6015 pour des achats de carburants et lubrifiants',
  right:'Compte 6042 (Carburants stockés en cuve) ou 6053 (Carburants non stockables pris à la pompe) · Ligne RE',
  why:'Dans le plan SYSCOHADA révisé, 6015 désigne les « Frais sur achats de marchandises » (et 6025 les frais sur achats de matières premières). Le carburant stocké va en 6042 et le carburant pris à la station-service va en 6053 (comptabilisé TTC au Cameroun car la TVA sur carburant routier est non déductible, art. 144 CGI).'
 },
 {
  wrong:'Utiliser 311, 312, 313 pour les matières premières, produits semi-finis et produits finis d’une usine',
  right:'32 / 321 (Matières premières), 371 ou 34 (Produits intermédiaires / semi-finis ou en-cours) et 36 / 361 (Produits finis) · Ligne BB',
  why:'En SYSCOHADA révisé, toute la racine 31 (311, 312) est réservée aux Marchandises de négoce ! En industrie, les matières brutes sont en 32 (var. 6032 ligne RD), les semi-finis comme la masse ou le beurre de cacao sont en 371 (var. 737 ligne TE) et les chocolats finis en 36 (var. 736 ligne TE).'
 },
 {
  wrong:'Utiliser 6224 pour les honoraires d’un développeur IT ou d’un consultant étranger',
  right:'Compte 632 / 6324 (Rémunérations d’intermédiaires et de conseils - Honoraires) · Ligne RH',
  why:'Sous le compte 622 (Locations), la subdivision 6224 désigne les « Malis sur emballages » ! Les honoraires d’experts, d’avocats ou de consultants IT relèvent du compte 6324 (et les redevances logicielles SaaS du compte 6343).'
 },
 {
  wrong:'Utiliser 274 (ou 6222) pour enregistrer une caution de loyer, d’électricité ENEO ou d’eau Camwater',
  right:'Compte 275 (Dépôts et cautionnements versés : 2751 Loyers d’avance, 2752 Électricité, 2753 Eau) · Ligne AS (sous AQ)',
  why:'En SYSCOHADA révisé, 274 loge les « Titres immobilisés » et 6222 les loyers consommés. Les cautions remboursables en fin de contrat s’enregistrent exclusivement au débit du compte 275 (Immobilisation financière, ligne AS sous AQ).'
 },
 {
  wrong:'Saisir une dépréciation dans le compte générique 659 ou confondre 6593, 6594, 651 et 6813',
  right:'6593 (Stocks · Classe 3), 6594 (Créances · Classe 4), 651 (Perte définitive), 6813 (Amortissement immo. · Classe 2)',
  why:'Le dernier chiffre donne la classe : 6593 déprécie la Classe 3 (crédit 391/392), 6594 déprécie la Classe 4 (crédit 491), 651 constate une créance définitivement perdue, et 6813 amortit les immobilisations corporelles de Classe 2 (crédit 283/284).'
 },
 {
  wrong:'Décaler les codes de lignes de l’Actif immobilisé (mettre Terrains en AI, Bâtiments en AJ, Matériel en AL, Transport en AM)',
  right:'AD (Immo. incorporelles : AE 211, AF 213) · AI (Total Immo. corporelles : AJ Terrains 22, AK Bâtiments 231, AL Aménagements 234, AM Matériel 241/244, AN Transport 245) · AQ (Immo. financières : AR 26, AS 275)',
  why:'Dans la liasse DSF Système Normal SYSCOHADA révisé, AI est la ligne de titre/total des immobilisations corporelles : les Terrains commencent donc à AJ, les Bâtiments à AK, les Aménagements à AL, le Matériel à AM et le Matériel de transport à AN !'
 },
 {
  wrong:'Décaler les codes de lignes du Compte de résultat (mettre Reprises en TI, Revenus financiers en RM ou IS en RQ)',
  right:'TI = Transferts de charges (781) · TJ = Reprises d’amort./dépréc. (759/791) · TK = Revenus financiers (77) · RM = Frais financiers (67) · TN/TO = Produits HAO (82/84) · RO/RP = Charges HAO (81/83) · RQ = Participation (87) · RS = Impôts sur le résultat (891)',
  why:'Respecter les codes exacts TA à XI garantit que le fichier généré pour la DSF sur le portail Harmony 2 de la DGI passe tous les contrôles de cohérence sans rejet.'
 },
 {
  wrong:'Parler encore d’« Impôt Libératoire » de 4 catégories (A, B, C, D) ou bloquer les PME < 50 M FCFA',
  right:'Impôt Général Synthétique (IGS) en 10 Classes (Art. 93 ter à octies & C 38 à C 48 CGI 2025/2026)',
  why:'La réforme fiscale camerounaise a institué l’Impôt Général Synthétique (IGS) pour les CA < 50 millions FCFA, structuré en 10 classes (de 20 000 FCFA en Classe 1 à 2 000 000 FCFA en Classe 10), avec obligation de comptabilité et DSF dès 10 millions FCFA (Classe 8 à 10) et réduction de 50 % pour les adhérents CGA.'
 }
];

function validateNiu(niu){
 const raw=String(niu||'').trim().toUpperCase();
 const ok=/^[MP]\d{12}[A-Z0-9]$/.test(raw);
 return {
  niu:raw,
  valid:ok,
  type:raw.startsWith('M')?'Personne Morale (Société / COOP-CA / ONG)':raw.startsWith('P')?'Personne Physique / Entrepreneur Individuel':'Format à corriger',
  message:ok?'NIU conforme au format DGI Cameroun (14 caractères : M/P + 12 chiffres + clé).':'Format attendu : 14 caractères commençant par M (Personne morale) ou P (Personne physique), ex. M112600016077J.'
 };
}

function buildHarmonyStatus(c){
 const ca=positive(c.ca||0,'CA');
 const d=diagnose(c);
 const isIgs=ca<50000000&&!['SA'].includes(c.form);
 const igsRow=IGS_CLASSES_DETAIL.find(r=>ca<=r.maxCa)||IGS_CLASSES_DETAIL[9];
 const niuCheck=validateNiu(c.niu||'M112600016077J');
 const befDeclared=Boolean(c.harmonyBef2025);
 const declarations=[
  {id:'bef_2025', label:`Déclaration BEF exercice ${Number(c.year||2026)-1}`, portal:'https://bef.harmony2.cm/', status:befDeclared?'ok':'missing', actionLabel:befDeclared?'Déclaré (RCBE à jour)':'Déclarer ici', detail:'Registre Central des Bénéficiaires Effectifs (Art. L 8 ter LPF) — Bloquant pour l’ACF si non souscrit !'},
  {id:'igs_is_curr', label:isIgs?`Déclaration IGS ${Number(c.year||2026)-1} (Classe ${igsRow.classe})`:`Déclarations mensuelles TVA & Acomptes IS ${Number(c.year||2026)-1}`, portal:'https://harmony2.impots.cm/', status:'ok', actionLabel:'Quittance OTP vérifiée', detail:isIgs?`Barème IGS Classe ${igsRow.classe} (${igsRow.rangeLabel}) : ${(c.cga&&ca>=10000000?igsRow.cgaTax:igsRow.baseTax).toLocaleString('fr-FR')} FCFA/an`:'Acomptes mensuels IS (2,2 % ou 1,1 % CGA) et TVA (19,25 %) télé-déclarés avant le 15 du mois.'},
  {id:'bef_2024', label:`Déclaration BEF exercice ${Number(c.year||2026)-2}`, portal:'https://bef.harmony2.cm/', status:'ok', actionLabel:'Archivé', detail:'Déclaration annuelle du bénéficiaire effectif validée.'},
  {id:'dsf_2025', label:`Déclaration DSF ${Number(c.year||2026)-1}`, portal:'https://harmony2.impots.cm/', status:'ok', actionLabel:'Exporter XML/JSON DSF', detail:ca>=10000000?'Liasse DSF SYSCOHADA révisé (Bilan AD–DZ, Résultat TA–XI, Tableau 22) obligatoire dès 10 M FCFA de CA.':'Sous le seuil de 10 M FCFA (Classes 1 à 7 IGS), tenue du SMT.'},
  {id:'dsf_2024', label:`Déclaration DSF ${Number(c.year||2026)-2}`, portal:'https://harmony2.impots.cm/', status:'ok', actionLabel:'Archivé', detail:'Liasse statistique et fiscale antérieure déposée.'},
  {id:'niu_state', label:'Etat du NIU', portal:'https://sdc.harmony2.cm/', status:niuCheck.valid?'ok':'missing', actionLabel:niuCheck.valid?'NIU Actif':'Vérifier NIU', detail:niuCheck.message},
  {id:'bef_2023', label:`Déclaration BEF exercice ${Number(c.year||2026)-3}`, portal:'https://bef.harmony2.cm/', status:'ok', actionLabel:'Archivé', detail:'Historique RCBE conforme.'}
 ];
 const allOk=declarations.every(x=>x.status==='ok');
 return {
  niuCheck,
  isIgs,
  igsRow,
  declarations,
  acfDeliverable:allOk,
  acfMessage:allOk?'✅ Toutes vos obligations déclaratives (BEF, DSF, IGS/IS, État du NIU) sont au vert : votre Attestation de Conformité Fiscale (ACF) peut être générée en ligne sur Harmony 2 !':'⚠️ Attention : La « Déclaration BEF » est marquée en rouge (❌). Sur Harmony 2 DGI, une seule déclaration manquante (notamment le Bénéficiaire Effectif BEF) bloque automatiquement la délivrance de votre ACF ! Cliquez sur « Déclarer ici » ci-dessous pour la régulariser.',
  redevances:[
   {label:'Timbre de bail commercial & Enregistrement', status:'Payé via OTP', ref:'Art. 544 & 545 CGI'},
   {label:'Redevance / Quittance Taxe Foncière & Patente', status:'À vérifier selon commune', ref:'Art. C 1 et s. CGI'},
   {label:'Attestation de Conformité Sociale (ACS — CNPS)', status:'Télé-déclaration DIPE avant le 15', ref:'Remplace l’APS depuis 2025 (cnps.cm)'}
  ]
 };
}

/* Correctifs de l'audit du 02/11/2026. Chargés avant la publication de l'API du moteur.
 * Sources et limites : sources.json ; AUDCIF, tableau de correspondance du système normal.
 * Le catalogue est un référentiel documentaire, pas une validation fiscale des opérations. */
const CATALOG_SOURCE='https://plan-comptable-ohada.com/nouvelle-norme-2016/plan-comptable-syscohada-revise.csv';
const LEGAL_SOURCE='https://www.ohada.org/acte-uniforme-relatif-au-droit-comptable-et-a-linformation-financiere-audcif/';
const AUDIT_VERSION='2.6.0-audit-20261102';
const OFFICIAL_CATALOG={"1":"COMPTES DE RESSOURCES DURABLES","2":"COMPTES D'ACTIF IMMOBILISÉ","3":"COMPTES DE STOCKS","4":"COMPTES DE TIERS","5":"COMPTES DE TRÉSORERIE","6":"COMPTES DE CHARGES DES ACTIVITÉS ORDINAIRES","7":"COMPTES DE PRODUITS DES ACTIVITÉS ORDINAIRES","8":"COMPTES DES AUTRES CHARGES ET DES AUTRES PRODUITS","9":"COMPTES DES ENGAGEMENTS HORS BILAN ET COMPTES DE LA COMPTABILITÉ ANALYTIQUE DE GESTION","11":"Réserves","12":"Report à nouveau","13":"Résultat net de l'exercice","14":"Subventions d'investissement","15":"Provisions réglementées et fonds assimilés","16":"Emprunts et dettes assimilées","17":"Dettes de location acquisition","18":"Dettes liées à des participations et comptes de liaison des établissements et sociétés en participation","19":"Provisions pour risques et charges","21":"Immobilisations incorporelles","22":"Terrains","23":"Bâtiments, installations techniques et agencements","24":"Matériel, Mobilier et Actifs biologiques","25":"Avances et acomptes versés sur immobilisations","26":"Titres de participation","27":"Autres immobilisations financières","28":"Amortissements","29":"Dépréciations","31":"Marchandises","32":"Matières premières et fournitures liées","33":"Autres approvisionnements","34":"Produits en cours","35":"Services en cours","36":"Produits finis","37":"Produits intermédiaires et résiduels","38":"Stocks en cours de route, en consignation ou en dépôt","39":"Dépréciations des stocks et encours de production","40":"Fournisseurs et comptes rattachés","41":"Clients et comptes rattachés","42":"Personnel","43":"Organismes sociaux","44":"Etat et Collectivités publiques","45":"Organismes internationaux","46":"Apporteurs, Associés et Groupe","47":"Débiteurs et créditeurs divers","48":"Créances et dettes hors activités ordinaires","49":"Dépréciations et provisions pour risques à court terme (Tiers)","50":"Titres de placement","51":"Valeurs à encaisser","52":"Banques","53":"Etablissements financiers et assimilés","54":"Instrument de trésorerie est crédité par le débit du compte de la classe 6. Cette perte est étalée au prorata de la comptabilisation des produits et charges de l'élément couvert par le biais du compte 476","55":"Instruments de monnaie électronique","56":"Banques, crédits de trésorerie et d'escompte","57":"Caisse","58":"Régies d'avances, accréditifs et virements internes","59":"Dépréciations et provisions pour risques à court terme (Trésorerie)","60":"Achats","61":"Transports","62":"SERVICES EXTÉRIEURS","63":"AUTRES SERVICES EXTÉRIEURS","64":"Impôts et taxes","65":"Autres charges","66":"Charges de personnel","67":"Frais financiers et charges assimilées","68":"Dotations aux amortissements","69":"Dotations aux provisions et aux dépréciations","70":"Ventes","71":"Subventions d'exploitation","72":"Production immobilisée","73":"Variations des stocks de biens et services produits","75":"Autres produits (sauf compte 759)","77":"Revenus financiers et produits assimilés","78":"Transferts de charges","79":"Reprises de provisions, dépréciations et autres","81":"Valeurs comptables des cessions d'immobilisations","82":"Produits des cessions d'immobilisations","83":"Charges hors activités ordinaires","84":"Produits hors activités ordinaires","85":"Dotations hors activités ordinaires","86":"Reprises de charges, provisions et dépréciations HAO","87":"Participation des travailleurs","88":"Subventions d'équilibre","89":"Impôts sur le résultat","92":"COMPTES REFLECHIS","93":"COMPTES DE RECLASSEMENTS","94":"COMPTES DE COÛTS","95":"COMPTES DE STOCKS","96":"COMPTES D'ECARTS SUR COÛTS PREETABLIS","97":"COMPTES DE DIFFERENCES DE TRAITEMENT COMPTABLE","98":"COMPTES DE RESULTATS","99":"COMPTES DE LIAISONS INTERNES","101":"Capital social","102":"Capital par dotation","103":"Capital personnel","104":"Compte de l'exploitant","105":"Primes liées au capital social","106":"Ecarts de réévaluation","109":"Apporteurs, capital souscrit, non appelé","111":"RESERVE LEGALE","112":"RESERVES STATUTAIRES OU CONTRACTUELLES","113":"RESERVES REGLEMENTEES","118":"AUTRES RESERVES","121":"REPORT A NOUVEAU CREDITEUR","129":"REPORT A NOUVEAU DEBITEUR","130":"RESULTAT EN INSTANCE D'AFFECTATION","131":"RESULTAT NET : BENEFICE","132":"MARGE COMMERCIALE (M.C.)","133":"VALEUR AJOUTEE (V.A.)","134":"EXCEDENT BRUT D'EXPLOITATION (E.B.E.)","135":"RESULTAT D'EXPLOITATION (R.E.)","136":"RESULTAT FINANCIER (R.F.)","137":"RESULTAT DES ACTIVITES ORDINAIRES (R.A.O.)","138":"RESULTAT HORS ACTIVITES ORDINAIRES (R.H.A.O.)","139":"RESULTAT NET : PERTE","141":"SUBVENTIONS D'EQUIPEMENT","148":"AUTRES SUBVENTIONS D'INVESTISSEMENT","151":"AMORTISSEMENTS DEROGATOIRES","152":"PLUS-VALUES DE CESSION A REINVESTIR","153":"FONDS REGLEMENTES","154":"PROVISION SPECIALE DE REEVALUATION","155":"PROVISIONS REGLEMENTEES RELATIVES AUX IMMOBILISATIONS","156":"PROVISIONS REGLEMENTEES RELATIVES AUX STOCKS","157":"PROVISIONS POUR INVESTISSEMENT","158":"AUTRES PROVISIONS ET FONDS REGLEMENTES","161":"EMPRUNTS OBLIGATAIRES","162":"EMPRUNTS ET DETTES AUPRES DES ETABLISSEMENTS DE CREDIT","163":"AVANCES REÇUES DE L'ETAT","164":"AVANCES REÇUES ET COMPTES COURANTS BLOQUES","165":"DEPÔTS ET CAUTIONNEMENTS REÇUS","166":"INTERÊTS COURUS","167":"AVANCES ASSORTIES DE CONDITIONS PARTICULIERES","168":"AUTRES EMPRUNTS ET DETTES","172":"DETTES DE LOCATION ACQUISITION/CREDIT- BAIL IMMOBILIER","173":"DETTES DE LOCATION ACQUISITION/ CREDIT- BAIL MOBILIER","174":"DETTES DE LOCATION ACQUISITION /LOCATION VENTE","176":"INTERÊTS COURUS","178":"DETTES D'AUTRES CONTRATS DE LOCATION ACQUISITION","181":"DETTES LIEES A DES PARTICIPATIONS","182":"DETTES LIEES A DES SOCIETES EN PARTICIPATION","183":"INTERÊTS COURUS SUR DETTES LIEES A DES PARTICIPATIONS","184":"COMPTES PERMANENTS BLOQUES DES ETABLISSEMENTS ET SUCCURSALES","185":"COMPTES PERMANENTS NON BLOQUES DES ETABLISSEMENTS ET SUCCURSALES","186":"COMPTES DE LIAISON CHARGES","187":"COMPTES DE LIAISON PRODUITS","188":"COMPTES DE LIAISON DES SOCIETES EN PARTICIPATION","191":"PROVISIONS POUR LITIGES","192":"PROVISIONS POUR GARANTIES DONNEES AUX CLIENTS","193":"PROVISIONS POUR PERTES SUR MARCHES A ACHEVEMENT FUTUR","194":"PROVISIONS POUR PERTES DE CHANGE","195":"PROVISIONS POUR IMPÔTS","196":"PROVISIONS POUR PENSIONS ET OBLIGATIONS SIMILAIRES","197":"PROVISIONS POUR RESTRUCTURATION","198":"AUTRES PROVISIONS POUR RISQUES ET CHARGES","211":"FRAIS DE DEVELOPPEMENT","212":"BREVETS, LICENCES, CONCESSIONS ET DROITS SIMILAIRES","213":"LOGICIELS ET SITES INTERNET","214":"MARQUES","215":"FONDS COMMERCIAL","216":"DROIT AU BAIL","217":"INVESTISSEMENTS DE CREATION","218":"AUTRES DROITS ET VALEURS INCORPORELS","219":"IMMOBILISATIONS INCORPORELLES EN COURS","221":"TERRAINS AGRICOLES ET FORESTIERS","222":"TERRAINS NUS","223":"TERRAINS BÂTIS","224":"TRAVAUX DE MISE EN VALEUR DES TERRAINS","225":"TERRAINS CARRIERES TREFONDS","226":"TERRAINS AMENAGES","227":"TERRAINS MIS EN CONCESSION","228":"AUTRES TERRAINS","229":"AMENAGEMENTS DE TERRAINS EN COURS","231":"BÂTIMENTS INDUSTRIELS, AGRICOLES, ADMINISTRATIFS ET COMMERCIAUX SUR SOL PROPRE","232":"BÂTIMENTS INDUSTRIELS AGRICOLES, ADMINISTRATIFS ET COMMERCIAUX SUR SOL D'AUTRUI","233":"OUVRAGES D'INFRASTRUCTURE","234":"INSTALLATIONS TECHNIQUES","235":"AMENAGEMENTS DE BUREAUX","237":"BÂTIMENTS INDUSTRIELS, AGRICOLES ET COMMERCIAUX MIS EN CONCESSION","238":"AUTRES INSTALLATIONS ET AGENCEMENTS","239":"BÂTIMENTS ET INSTALLATIONS EN COURS","241":"MATERIEL ET OUTILLAGE INDUSTRIEL ET COMMERCIAL","242":"MATERIEL ET OUTILLAGE AGRICOLE","243":"MATERIEL D'EMBALLAGE RECUPERABLE ET IDENTIFIABLE","244":"MATERIEL ET MOBILIER","245":"MATERIEL DE TRANSPORT","246":"ACTIFS BIOLOGIQUES","247":"AGENCEMENTS, AMENAGEMENTS DU MATERIEL ET ACTIFS BIOLOGIQUES","248":"AUTRES MATERIELS ET MOBILIERS","249":"MATERIEL ET ACTIFS BIOLOGIQUES EN COURS","251":"AVANCES ET ACOMPTES VERSÉS SUR IMMOBILISATIONS INCORPORELLES","252":"AVANCES ET ACOMPTES VERSÉS SUR IMMOBILISATIONS CORPORELLES","261":"TITRES DE PARTICIPATION DANS DES SOCIETES SOUS CONTRÔLE EXCLUSIF","262":"TITRES DE PARTICIPATION DANS DES SOCIETES SOUS CONTRÔLE CONJOINT","263":"TITRES DE PARTICIPATION DANS DES SOCIETES CONFERANT UNE INFLUENCE NOTABLE","265":"PARTICIPATIONS DANS DES ORGANISMES PROFESSIONNELS","266":"PARTS DANS DES GROUPEMENTS D'INTERÊT ECONOMIQUE (G.I.E.)","268":"AUTRES TITRES DE PARTICIPATION","271":"PRÊTS ET CREANCES","272":"PRÊTS AU PERSONNEL","273":"CREANCES SUR L'ETAT","274":"TITRES IMMOBILISES","275":"DEPÔTS ET CAUTIONNEMENTS VERSES","276":"INTERÊTS COURUS","277":"CREANCES RATTACHEES A DES PARTICIPATIONS ET AVANCES A DES G.I.E.","278":"IMMOBILISATIONS FINANCIERES DIVERSES","281":"AMORTISSEMENTS DES IMMOBILISATIONS INCORPORELLES","282":"AMORTISSEMENTS DES TERRAINS","283":"AMORTISSEMENTS DES BÂTIMENTS, INSTALLATIONS TECHNIQUES ET AGENCEMENTS","284":"AMORTISSEMENTS DU MATERIEL","291":"DEPRECIATIONS DES IMMOBILISATIONS NCORPORELLES","292":"DEPRECIATIONS DES TERRAINS","293":"DEPRECIATIONS DES BÂTIMENTS, INSTALLATIONS TECHNIQUES ET AGENCEMENTS","294":"DEPRECIATIONS DU MATERIEL, DU MOBILIER ET DE L'ACTIF BIOLOGIQUE","295":"DEPRECIATIONS DES AVANCES ET ACOMPTES VERSES SUR IMMOBILISATIONS","296":"DEPRECIATIONS DES TITRES DE PARTICIPATION","297":"DEPRECIATIONS DES AUTRES IMMOBILISATIONS FINANCIERES","311":"MARCHANDISES A","312":"MARCHANDISES B","318":"MARCHANDISES HORS ACTIVITES ORDINAIRES (H.A.O.)","321":"MATIERES A","322":"MATIERES B","323":"FOURNITURES (A, B)","331":"MATIERES CONSOMMABLES","333":"FOURNITURES DE MAGASIN","334":"FOURNITURES DE BUREAU","335":"EMBALLAGES","338":"AUTRES MATIERES","341":"PRODUITS EN COURS","342":"TRAVAUX EN COURS","343":"PRODUITS INTERMEDIAIRES EN COURS","344":"PRODUITS RESIDUELS EN COURS","351":"ETUDES EN COURS","352":"PRESTATIONS DE SERVICES EN COURS","361":"PRODUITS FINIS A","362":"PRODUITS FINIS B","371":"PRODUITS INTERMEDIAIRES","372":"PRODUITS RESIDUELS","381":"MARCHANDISES EN COURS DE ROUTE","382":"MATIERES PREMIERES ET FOURNITURES LIEES EN COURS DE ROUTE","383":"AUTRES APPROVISIONNEMENTS EN COURS DE ROUTE","386":"PRODUITS FINIS EN COURS DE ROUTE","387":"STOCK EN CONSIGNATION OU EN DEPÔT","388":"STOCK PROVENANT D'IMMOBILISATIONS MISES HORS SERVICE OU AU REBUT","391":"DEPRECIATIONS DES STOCKS DE MARCHANDISES","392":"DEPRECIATIONS DES STOCKS DE MATIERES PREMIERES ET FOURNITURES LIEES","393":"DEPRECIATIONS DES STOCKS D'AUTRES APPROVISIONNEMENTS","394":"DEPRECIATIONS DES PRODUITS EN COURS","395":"DEPRECIATIONS DES SERVICES EN COURS","396":"DEPRECIATIONS DES STOCKS DE PRODUITS FINIS","397":"DEPRECIATIONS DES STOCKS DE PRODUITS INTERMEDIAIRES ET RESIDUELS","398":"DEPRECIATIONS DES STOCKS EN COURS DE ROUTE, EN CONSIGNATION OU EN DEPÔT","401":"FOURNISSEURS, DETTES EN COMPTE","402":"FOURNISSEURS, EFFETS A PAYER","404":"Fournisseurs, acquisitions courantes d'immobilisations","408":"FOURNISSEURS, FACTURES NON PARVENUES","409":"FOURNISSEURS DEBITEURS","411":"CLIENTS","412":"CLIENTS, EFFETS A RECEVOIR EN PORTEFEUILLE","414":"CREANCES SUR CESSIONS COURANTES D'IMMOBILISATIONS","415":"CLIENTS, EFFETS ESCOMPTES NON ECHUS","416":"CREANCES CLIENTS LITIGIEUSES OU DOUTEUSES","418":"CLIENTS, PRODUITS A RECEVOIR","419":"CLIENTS CREDITEURS","421":"PERSONNEL, AVANCES ET ACOMPTES","422":"PERSONNEL, REMUNERATIONS DUES","423":"PERSONNEL, OPPOSITIONS, SAISIES-ARRÊTS","424":"PERSONNEL,ŒUVRES SOCIALES INTERNES","425":"REPRESENTANTS DU PERSONNEL","426":"PERSONNEL, PARTICIPATION AUX BENEFICES ET AU CAPITAL","427":"PERSONNEL-DEPÔTS","428":"PERSONNEL, CHARGES A PAYER ET PRODUITS A RECEVOIR","431":"SECURITE SOCIALE","432":"CAISSES DE RETRAITE COMPLEMENTAIRE","433":"AUTRES ORGANISMES SOCIAUX","438":"ORGANISMES SOCIAUX, CHARGES A PAYER ET PRODUITS A RECEVOIR","441":"ETAT, IMPÔT SUR LES BENEFICES","442":"ETAT, AUTRES IMPÔTS ET TAXES","443":"ETAT, T.V.A. FACTUREE","444":"ETAT, T.V.A. DUE OU CREDIT DE T.V.A.","445":"ETAT, T.V.A. RECUPERABLE","446":"ETAT, AUTRES TAXES SUR LE CHIFFRE D'AFFAIRES","447":"ETAT, IMPÔTS RETENUS A LA SOURCE","448":"ETAT, CHARGES A PAYER ET PRODUITS A RECEVOIR","449":"ETAT, CREANCES ET DETTES DIVERSES","451":"OPERATIONS AVEC LES ORGANISMES AFRICAINS","452":"OPERATIONS AVEC LES AUTRES ORGANISMES INTERNATIONAUX","458":"ORGANISMES INTERNATIONAUX, FONDS DE DOTATION ET SUBVENTIONS A RECEVOIR","461":"APPORTEURS, OPERATIONS SUR LE CAPITAL","462":"ASSOCIES(1), COMPTES COURANTS","463":"ASSOCIES(1), OPERATIONS FAITES EN COMMUN","465":"ASSOCIES(1), DIVIDENDES A PAYER","466":"GROUPE, COMPTES COURANTS","467":"APPORTEURS, RESTANT DÛ SUR CAPITAL APPELE","471":"DEBITEURS ET CREDITEURS DIVERS","472":"VERSEMENTS RESTANT A EFFECTUER SUR TITRES DE PLACEMENT NON LIBERES","473":"INTERMEDIAIRES – OPERATIONS FAITES POUR LE COMPTE DE TIERS","474":"REPARTITION PERIODIQUE DES CHARGES ET DES PRODUITS","475":"COMPTE TRANSITOIRE, AJUSTEMENT SPECIAL LIE A LA REVISION SYSCOHADA","476":"CHARGES CONSTATEES D'AVANCE","477":"PRODUITS CONSTATES D'AVANCE","478":"ECARTS DE CONVERSION-ACTIF","479":"ECARTS DE CONVERSION- PASSIF","481":"FOURNISSEURS D'INVESTISSEMENTS","482":"FOURNISSEURS D'INVESTISSEMENTS EFFETS A PAYER","484":"AUTRES DETTES HORS ACTIVITES ORDINAIRES (H.A.O.)","485":"CREANCES SUR CESSIONS D'IMMOBILISATIONS","488":"AUTRES CREANCES HORS ACTIVITES ORDINAIRES (H.A.O.)","490":"DÉPRÉCIATIONS DES COMPTES FOURNISSEURS","491":"DEPRECIATIONS DES COMPTES CLIENTS","492":"DEPRECIATIONS DES COMPTES PERSONNEL","493":"DEPRECIATIONS DES COMPTES ORGANISMES SOCIAUX","494":"DÉPRÉCIATIONS DES COMPTES ÉTAT ET COLLECTIVITÉS PUBLIQUES","495":"DEPRECIATIONS DES COMPTES ORGANISMES INTERNATIONAUX","496":"DEPRECIATIONS DES COMPTES APPORTEURS ASSOCIES ET GROUPE","497":"DEPRECIATIONS DES COMPTES DEBITEURS DIVERS","498":"DEPRECIATIONS DES COMPTES DE CREANCES H.A.O.","499":"PROVISIONS POUR RISQUES A COURT TERME","501":"TITRES DU TRESOR ET BONS DE CAISSE A COURT TERME","502":"ACTIONS","503":"OBLIGATIONS","504":"BONS DE SOUSCRIPTION","505":"TITRES NEGOCIABLES HORS REGION","506":"INTERÊTS COURUS","508":"AUTRES VALEURS ASSIMILEES","511":"EFFETS A ENCAISSER","512":"EFFETS A L'ENCAISSEMENT","513":"CHEQUES A ENCAISSER","514":"CHEQUES A L'ENCAISSEMENT","515":"CARTES DE CREDIT A ENCAISSER","518":"AUTRES VALEURS A L'ENCAISSEMENT","521":"BANQUES LOCALES","522":"BANQUES AUTRES ETATS REGION","523":"BANQUES AUTRES ETATS ZONE MONETAIRE","524":"BANQUES HORS ZONE MONETAIRE","525":"BANQUES DEPOT A TERME","526":"BANQUES, INTERET COURUS","531":"CHEQUES POSTAUX","532":"TRESOR","533":"SOCIETES DE GESTION ET D'INTERMEDIATION (S.G.I.)","536":"ETABLISSEMENTS FINANCIERS, INTERETS COURUS","538":"AUTRES ORGANISMES FINANCIERS","541":"OPTIONS DE TAUX D'INTERÊT","542":"OPTIONS DE TAUX DE CHANGE","543":"OPTIONS DE TAUX BOURSIERS","544":"INSTRUMENTS DE MARCHES A TERME","545":"AVOIRS D'OR ET AUTRES METAUX PRECIEUX(1)","551":"MONNAIE ELECTRONIQUE- CARTE CARBURANT","552":"MONNAIE ELECTRONIQUE- TELEPHONE PORTABLE","553":"MONNAIE ELECTRONIQUE- CARTE PEAGE","554":"PORTE-MONNAIE ELECTRONIQUE","558":"AUTRES INSTRUMENTS DE MONNAIE ELECTRONIQUE","561":"CREDITS DE TRESORERIE","564":"ESCOMPTE DE CREDITS DE CAMPAGNE","565":"ESCOMPTE DE CREDITS ORDINAIRES","566":"CREDITS DE TRESORERIE, INTERETS COURUS","571":"CAISSE SIEGE SOCIAL","572":"CAISSE SUCCURSALE A","573":"CAISSE SUCCURSALE B","581":"REGIES D'AVANCE","582":"ACCREDITIFS","585":"VIREMENTS DE FONDS","588":"AUTRES VIREMENTS INTERNES","590":"DÉPRÉCIATIONS DES TITRES DE PLACEMENT","591":"DEPRECIATIONS DES TITRES ET VALEURS A ENCAISSER","592":"DEPRECIATIONS DES COMPTES BANQUES","593":"DEPRECIATIONS DES COMPTES ETABLISSEMENTS FINANCIERS ET ASSIMILES","594":"DEPRECIATIONS DES COMPTES D'INSTRUMENTS DE TRESORERIE","599":"PROVISIONS POUR RISRQUES A COURT TERME A CARACTERE FINANCIER","601":"ACHATS DE MARCHANDISES (1)","602":"ACHATS DE MATIERES PREMIERES ET FOURNITURES LIEES (1)","603":"Variations des stocks de biens achetés","604":"ACHATS STOCKES DE MATIERES ET FOURNITURES CONSOMMABLES","605":"AUTRES ACHATS","608":"ACHATS D'EMBALLAGES","612":"TRANSPORTS SUR VENTES","613":"TRANSPORTS POUR LE COMPTE DE TIERS","614":"TRANSPORTS DU PERSONNEL","616":"TRANSPORT DE PLIS","618":"AUTRES FRAIS DE TRANSPORT","621":"SOUS-TRAITANCE GENERALE","622":"LOCATIONS ET CHARGES LOCATIVES","623":"REDEVANCES DE LOCATION ACQUISITION","624":"ENTRETIEN, REPARATIONS ET MAINTENANCE","625":"PRIMES D'ASSURANCE","626":"ETUDES, RECHERCHES ET DOCUMENTATION","627":"PUBLICITE, PUBLICATIONS, RELATIONS PUBLIQUES","628":"FRAIS DE TELECOMMUNICATIONS","631":"FRAIS BANCAIRES","632":"REMUNERATIONS D'INTERMEDIAIRES ET DE CONSEILS","633":"FRAIS DE FORMATION DU PERSONNEL","634":"REDEVANCES POUR BREVETS, LICENCES, MARQUES, LOGICIELS, SITES, CONCESSIONS ET DROITS ET VALEURS SIMILAIRES","635":"COTISATIONS","637":"REMUNERATIONS DE PERSONNEL EXTERIEUR A L'ENTITE","638":"AUTRES CHARGES EXTERNES","641":"IMPÔTS ET TAXES DIRECTS","645":"IMPÔTS ET TAXES INDIRECTS","646":"DROITS D'ENREGISTREMENT","647":"PENALITES ET AMENDES FISCALES","648":"AUTRES IMPÔTS ET TAXES","651":"PERTES SUR CREANCES CLIENTS ET AUTRES DEBITEURS","652":"QUOTE-PART DE RESULTAT SUR OPERATIONS FAITES EN COMMUN","654":"VALEURS COMPTABLES DES CESSIONS COURANTES D'IMMOBILISATIONS","658":"CHARGES DIVERSES","659":"CHARGES POUR DÉPRÉCIATIONS ET PROVISIONS POUR RISQUES A COURT TERME D'EXPLOITATION","661":"REMUNERATIONS DIRECTES VERSEES AU PERSONNEL NATIONAL","662":"REMUNERATIONS DIRECTES VERSEES AU PERSONNEL NON NATIONAL","663":"INDEMNITES FORFAITAIRES VERSEES AU PERSONNEL","664":"CHARGES SOCIALES","666":"RÉMUNÉRATION ET CHARGES SOCIALES DE L'EXPLOITANT INDIVIDUEL","667":"Rémunération transférée de personnel extérieur.","668":"AUTRES CHARGES SOCIALES","671":"INTERÊTS DES EMPRUNTS","672":"INTERÊTS DANS LOYERS DE LOCATION ACQUISITION","673":"ESCOMPTES ACCORDES","674":"AUTRES INTERÊTS","675":"ESCOMPTES DES EFFETS DE COMMERCE","676":"PERTES DE CHANGE","677":"PERTES SUR TITRES DE PLACEMENT","678":"PERTES SUR RISQUES FINANCIERS","679":"CHARGES POUR DEPRECIATIONS ET PROVISIONS POUR RISQUES A COURT TERME FINANCIERES","681":"DOTATIONS AUX AMORTISSEMENTS D'EXPLOITATION","687":"DOTATIONS AUX AMORTISSEMENTS A CARACTERE FINANCIER","691":"DOTATIONS AUX PROVISIONS ET AUX DEPRECIATIONS D'EXPLOITATION","697":"DOTATIONS AUX PROVISIONS ET AUX DEPRECIATIONS FINANCIERES","701":"VENTES DE MARCHANDISES","702":"VENTES DE PRODUITS FINIS","703":"VENTES DE PRODUITS INTERMEDIAIRES","704":"VENTES DE PRODUITS RESIDUELS","705":"TRAVAUX FACTURES","706":"SERVICES VENDUS","707":"PRODUITS ACCESSOIRES","711":"SUR PRODUITS A L'EXPORTATION","712":"SUR PRODUITS A L'IMPORTATION","713":"SUR PRODUITS DE PEREQUATION","718":"AUTRES SUBVENTIONS D'EXPLOITATION","721":"Immobilisations incorporelles","722":"Immobilisations corporelles","724":"Production auto-consommée","726":"Immobilisations financières (1)","734":"VARIATIONS DES STOCKS DE PRODUITS EN COURS","735":"VARIATIONS DES EN-COURS DE SERVICES","736":"VARIATIONS DES STOCKS DE PRODUITS FINIS","737":"VARIATIONS DES STOCKS DE PRODUITS INTERMEDIAIRES ET RESIDUELS","752":"QUOTE-PART DE RESULTAT SUR OPERATIONS FAITES EN COMMUN","754":"PRODUITS DES CESSIONS COURANTES D'IMMOBILISATIONS","758":"PRODUITS DIVERS","759":"REPRISES DE CHARGES POUR DEPRECIATIONS ET PROVISIONS A COURT TERME D'EXPLOITATION","771":"INTERETS DE PRÊTS ET CREANCES DIVERSES","772":"REVENUS DE PARTICIPATIONS ET AUTRES CREANCES IMMOBILISES","773":"ESCOMPTES OBTENUS","774":"REVENUS DE PLACEMENT","775":"INTERETS DANS LOYERS DE LOCATION ACQUISITION","776":"GAINS DE CHANGE","777":"GAINS SUR CESSIONS DE TITRES DE PLACEMENT","778":"GAINS SUR RISQUES FINANCIERS","779":"REPRISES DE CHARGES POUR DÉPRÉCIATIONS ET PROVISIONS POUR RISQUES À COURT TERME FINANCIERES","781":"TRANSFERTS DE CHARGES D'EXPLOITATION","787":"TRANSFERTS DE CHARGES FINANCIERES","791":"REPRISES DE PROVISIONS ET DE DEPRECIATIONS D'EXPLOITATION","797":"Reprises de provisions et de dépréciations financières","798":"REPRISES D'AMORTISSEMENTS (1)","799":"REPRISES DE SUBVENTIONS D'INVESTISSEMENT","811":"IMMOBILISATIONS INCORPORELLES","812":"IMMOBILISATIONS CORPORELLES","816":"IMMOBILISATIONS FINANCIERES","821":"IMMOBILISATIONS INCORPORELLES","822":"IMMOBILISATIONS CORPORELLES","826":"IMMOBILISATIONS FINANCIERES","831":"CHARGES H.A.O. CONSTATEES","833":"CHARGES LIEES AUX OPERATIONS DE RESTRUCTURATION","834":"PERTES SUR CRÉANCES H.A.O.","835":"DONS ET LIBÉRALITÉS ACCORDÉS","836":"Abandons de créances consentis","837":"CHARGES LIEES AUX OPERATIONS DE LIQUIDATION","839":"CHARGES POUR DEPRECIATIONS ET PROVISIONS POUR RISQUES A COURT TERME H.A.O.","841":"PRODUITS H.A.O. CONSTATES","843":"PRODUITS LIES AUX OPERATIONS DE RESTRUCTURATION","845":"DONS ET LIBÉRALITÉS OBTENUS","846":"ABANDONS DE CREANCES OBTENUS","847":"PRODUITS LIES AUX OPERATIONS DE LIQUIDATION","848":"TRANSFERTS DE CHARGES H.A.O.","849":"REPRISES DE CHARGES POUR DEPRECIATIONS ET PROVISIONS POUR RISQUES A COURT TERME H.A.O.","851":"DOTATIONS AUX PROVISIONS REGLEMENTEES","852":"DOTATIONS AUX AMORTISSEMENTS H.A.O.","853":"DOTATIONS AUX DEPRECIATIONS H.A.O.","854":"DOTATIONS AUX PROVISIONS POUR RISQUES ET CHARGES H.A.O.","858":"AUTRES DOTATIONS H.A.O.","861":"REPRISES DE PROVISIONS REGLEMENTEES","862":"REPRISES D'AMORTISSEMENTS H.A.O.","863":"REPRISES DE DEPRECIATIONS H.A.O.","864":"REPRISES DE PROVISIONS POUR RISQUES ET CHARGES H.A.O.","868":"AUTRES REPRISES H.A.O.","871":"PARTICIPATION LÉGALE AUX BÉNÉFICES","872":"PARTICIPATION CONTRACTUELLE AUX BÉNÉFICES","878":"AUTRES PARTICIPATIONS","881":"ETAT","884":"COLLECTIVITÉS PUBLIQUES","886":"GROUPE","888":"AUTRES","891":"IMPÔTS SUR LES BENEFICES DE L'EXERCICE","892":"RAPPELS D'IMPÔTS SUR RESULTATS ANTERIEURS","895":"IMPÔT MINIMUM FORFAITAIRE (I.M.F.)","899":"DÉGREVEMENTS ET ANNULATIONS D'IMPÔTS SUR RÉSULTATS ANTÉRIEURS","914":"Contreparties des comptes 901 à 904","915":"Contreparties des comptes 905 à 908","1011":"Capital souscrit, non appelé","1012":"Capital souscrit, appelé, non versé","1013":"Capital souscrit, appelé, versé, non amorti","1014":"Capital souscrit, appelé, versé, amorti","1018":"Capital souscrit, soumis à des conditions particulières","1021":"Dotation initiale","1022":"Dotations complémentaires","1028":"Autres dotations","1041":"Apports temporaires","1042":"Opérations courantes","1043":"Rémunérations, impôts, et autres charges personnelles","1047":"Prélèvements d'autoconsommation","1048":"Autres prélèvements","1051":"Primes d'émission","1052":"Primes d'apport","1053":"Primes de fusion","1054":"Primes de conversion","1058":"Autres primes","1061":"Ecarts de réévaluation légale","1062":"Ecarts de réévaluation libre","1131":"Réserves de plus-values nettes à long terme","1132":"Réserves d'attribution gratuite d'actions au personnel salarié et aux dirigeants","1133":"Réserves consécutives à l'octroi de subventions d'investissement","1134":"Réserves de valeurs mobilières donnant accès au capital","1138":"Autres réserves réglementées","1181":"Réserves facultatives","1188":"Réserves diverses","1291":"Perte nette à reporter","1292":"Perte-Amortissements réputés différés","1301":"Résultat en instance d'affectation : Bénéfice","1309":"Résultat en instance d'affectation : Perte","1381":"Résultat de fusion,","1382":"Résultat d'apport partiel d'actif","1383":"Résultat de scission","1384":"Résultat de liquidation","1411":"Etat","1412":"Régions","1413":"Départements","1414":"Communes et collectivités publiques décentralisées","1415":"Entités publiques ou mixtes","1416":"Entreprises et organismes privés","1417":"Organismes internationaux","1418":"Autres","1531":"Fonds national","1532":"Prélèvement pour le Budget","1551":"Reconstitution des gisements miniers et pétroliers","1561":"Hausse de prix","1562":"Fluctuation des cours","1611":"Emprunts obligataires ordinaires","1612":"Emprunts obligataires convertibles en actions","1613":"Emprunts obligataires remboursables en actions","1618":"Autres emprunts obligataires","1651":"Dépôts","1652":"Cautionnements","1661":"sur emprunts obligataires","1662":"sur emprunts et dettes auprès des établissements de crédit","1663":"sur avances reçues de l'Etat","1664":"sur avances reçues et comptes courants bloqués","1665":"sur dépôts et cautionnements reçus","1667":"sur avances assorties de conditions particulières","1668":"sur autres emprunts et dettes","1671":"Avances bloquées pour augmentation du capital","1672":"Avances conditionnées par l'Etat","1673":"Avances conditionnées par les autres organismes africains","1674":"Avances conditionnées par les organismes internationaux","1676":"Droits du concédant exigibles en nature","1681":"Rentes viagères capitalisées","1682":"Billets de fonds","1683":"Dettes consécutives à des titres empruntés","1685":"Emprunts participatifs","1686":"Participation des travailleurs aux bénéfices","1762":"sur dettes de location acquisition/crédit-bail immobilier","1763":"sur dettes de location acquisition/crédit-bail mobilier","1764":"sur dettes de location acquisition/location vente","1768":"sur autres dettes de location acquisition","1811":"Dettes liées à des participations (groupe)","1812":"Dettes liées à des participations (hors groupe)","1961":"Provisions pour pensions et obligations similaires – engagement de retraite","1962":"Actif du régime de retraite","1981":"Provisions pour amendes et pénalités","1983":"Provisions de propre assureur","1984":"Provisions pour démantèlement et remise en état","1985":"Provisions de droits à déduction (Chèques cadeau, cartes de fidélité…)","1988":"Autres provisions pour risques et charges","2121":"Brevets","2122":"Licences","2123":"Concessions de service public","2128":"Autres concessions et droits similaires","2131":"Logiciels","2132":"Sites internet","2181":"Frais de prospection et d'évaluation de ressources minérales","2182":"Coûts d'obtention du contrat","2183":"Fichiers clients, notices, titres de journaux et magazines","2188":"Divers droits et valeurs incorporelles","2191":"Frais de développement","2193":"Logiciels","2198":"Autres droits et valeurs incorporels","2211":"Terrains d'exploitation agricole","2212":"Terrains d'exploitation forestière","2218":"Autres terrains","2221":"Terrains à bâtir","2228":"Autres terrains nus","2231":"pour bâtiments industriels et agricoles","2232":"pour bâtiments administratifs et commerciaux","2234":"pour bâtiments affectés aux autres opérations professionnelles","2235":"pour bâtiments affectés aux autres opérations non professionnelles","2238":"Autres terrains bâtis","2241":"Plantations d'arbres et d'arbustes","2245":"Améliorations du fonds","2248":"Autres travaux","2251":"Carrières","2261":"Parkings","2281":"Terrains des immeubles de placement","2285":"Terrains des logements affectés au personnel","2286":"Terrain location-acquisition","2288":"Autres","2291":"Terrains agricoles et forestiers","2292":"Terrains nus","2295":"Terrains de carrières – tréfonds","2298":"Autres terrains","2311":"Bâtiments industriels","2312":"Bâtiments agricoles","2313":"Bâtiments administratifs et commerciaux","2314":"Bâtiments affectés au logement du personnel","2315":"Immeubles de placement","2316":"Bâtiments de location acquisition","2321":"Bâtiments industriels","2322":"Bâtiments agricoles","2323":"Bâtiments administratifs et commerciaux","2324":"Bâtiments affectés au logement du personnel","2325":"Immeubles de placement","2326":"Bâtiment de location-acquisition","2331":"Voies de terre","2332":"Voies de fer","2333":"Voies d'eau","2334":"Barrages, Digues","2335":"Pistes d'aérodrome","2338":"Autres","2341":"Installations complexes spécialisées sur sol propre","2342":"Installations complexes spécialisées sur sol d'autrui","2343":"Installations à caractère spécifique sur sol propre","2344":"Installations à caractère spécifique sur sol d'autrui","2345":"Aménagements et agencements des bâtiments","2351":"Installations générales","2358":"Autres","2391":"Bâtiments en cours","2392":"Installations en cours","2393":"Aménagements et agencements","2411":"Matériel industriel","2412":"Outillage industriel","2413":"Matériel commercial","2414":"Outillage commercial","2416":"Matériel et outillage de location acquisition","2421":"Matériel agricole","2422":"Outillage agricole","2426":"Matériel et outillage agricole de location – acquisition","2441":"Matériel de bureau","2442":"Matériel informatique","2443":"Matériel bureautique","2444":"Mobilier de bureau","2446":"Matériel et mobilier de location- acquisition","2447":"Matériel et mobilier des logements affectés au personnel","2451":"Matériel automobile","2452":"Matériel ferroviaire","2453":"Matériel fluvial, lagunaire","2454":"Matériel naval","2455":"Matériel aérien","2456":"Matériel de transport de location-acquisition","2457":"Matériel hippomobile","2458":"Autres (vélo, mobylette, moto)","2461":"Cheptel, animaux de trait","2462":"Cheptel, animaux reproducteurs","2463":"Animaux de garde","2465":"Plantations agricoles","2468":"Autres","2471":"Agencements et aménagements du matériel","2472":"Agencements et aménagements des actifs biologiques","2481":"Collections et œuvres d'art","2491":"Matériel et outillage industriel et commercial","2492":"Matériel et outillage agricole","2493":"Matériel d'emballage récupérable et identifiable","2494":"Matériel et mobilier de bureau","2495":"Matériel de transport","2496":"Actifs biologiques","2497":"Agencements et aménagements du matériel et des actifs biologiques","2498":"Autres matériels","2711":"Prêts participatifs","2712":"Prêts aux associés","2713":"Billets de fonds","2714":"Créances de location financement","2715":"Titres prêtés","2721":"Prêts immobiliers","2722":"Prêts mobiliers et d'installation","2728":"Autres prêts (frais d'études)","2731":"Retenues de garantie","2733":"Fonds réglementé","2734":"Créances sur le concédant","2738":"Autres","2741":"Titres immobilisés de l'activité de portefeuille (T.I.A.P.)","2742":"Titres participatifs","2743":"Certificats d'investissement","2744":"Parts de fonds commun de placement (F.C.P.)","2745":"Obligations","2746":"Actions ou parts propres","2748":"Autres titres immobilisés","2751":"Dépôts pour loyers d'avance","2752":"Dépôts pour l'électricité","2753":"Dépôts pour l'eau","2754":"Dépôts pour le gaz","2755":"Dépôts pour le téléphone, le télex, la télécopie","2756":"Cautionnements sur marchés publics","2757":"Cautionnements sur autres opérations","2758":"Autres dépôts et cautionnements","2761":"Prêts et créances non commerciales","2762":"Prêts au personnel","2763":"Créances sur l'Etat","2764":"Titres immobilisés","2765":"Dépôts et cautionnements versés","2766":"Créances de location financement","2767":"Créances rattachées à des participations","2768":"Immobilisations financières diverses","2771":"Créances rattachées à des participations (groupe)","2772":"Créances rattachées à des participations (hors groupe)","2773":"Créances rattachées à des sociétés en participation","2774":"Avances à des groupements d'intérêt économique (G.I.E.)","2781":"Créances diverses groupe","2782":"Créances diverses hors groupe","2784":"Banques dépôt à terme","2785":"Or et métaux précieux (1)","2811":"Amortissements des frais de développement","2812":"Amortissements des brevets, licences, concessions et droits similaires","2813":"Amortissements des logiciels et sites internet","2814":"Amortissements des marques","2815":"Amortissements du fonds commercial","2816":"Amortissements du droit au bail","2817":"Amortissements des investissements de création","2818":"Amortissements des autres droits et valeurs incorporels","2821":"Amortissements des terrains agricoles et forestiers","2824":"Amortissements des travaux de mise en valeur des terrains","2825":"Amortissements des terrains de gisement","2831":"Amortissements des bâtiments industriels, agricoles, administratifs et commerciaux sur sol propre","2832":"Amortissements des bâtiments industriels, agricoles, administratifs et commerciaux sur sol d'autrui","2833":"Amortissements des ouvrages d'infrastructure","2834":"Amortissements des aménagements, agencements et installations techniques","2835":"Amortissements des aménagements de bureaux","2837":"Amortissements de bâtiments industriels, agricoles et commerciaux mis en concession","2838":"Amortissements des autres installations et agencements","2841":"Amortissements du matériel et outillage industriel et commercial","2842":"Amortissements du matériel et outillage agricole","2843":"Amortissements du matériel d'emballage récupérable et identifiable","2844":"Amortissements du matériel et mobilier","2845":"Amortissements du matériel de transport","2846":"Amortissements des actifs biologiques","2847":"Amortissements des agencements et aménagements du matériel et des actifs biologiques","2848":"Amortissements des autres matériels","2911":"Dépréciations des frais de développement","2912":"Dépréciations des brevets, licences, marques concessions et droits similaires","2913":"Dépréciations des logiciels et sites internet","2914":"Dépréciations des marques","2915":"Dépréciations du fonds commercial","2916":"Dépréciations du droit au bail","2917":"Dépréciations des investissements de création","2918":"Dépréciations des autres droits et valeurs incorporels","2919":"Dépréciations des immobilisations incorporelles en cours","2921":"Dépréciations des terrains agricoles et forestiers","2922":"Dépréciations des terrains nus","2923":"Dépréciations des terrains bâtis","2924":"Dépréciations des travaux de mise en valeur des terrains","2925":"Dépréciations des terrains de gisement","2926":"Dépréciations des terrains aménagés","2927":"Dépréciations des terrains mis en concession","2928":"Dépréciations des autres terrains","2929":"Dépréciations des aménagements de terrains en cours","2931":"Dépréciations des bâtiments industriels, agricoles, administratifs et commerciaux sur sol propre","2932":"Dépréciations des bâtiments industriels, agricoles, administratifs et commerciaux sur sol d'autrui","2933":"Dépréciations des ouvrages d'infrastructures","2934":"Dépréciations des aménagements, agencements et installations techniques","2935":"Dépréciations des aménagements de bureaux","2937":"Dépréciations des bâtiments industriels, agricoles et commerciaux mis en concession","2938":"Dépréciations des autres installations et agencements","2939":"Dépréciations des bâtiments et installations en cours","2941":"Dépréciations du matériel et outillage industriel et commercial","2942":"Dépréciations du matériel et outillage agricole","2943":"Dépréciations du matériel d'emballage récupérable et identifiable","2944":"Dépréciations du matériel et mobilier","2945":"Dépréciations du matériel de transport","2946":"Dépréciations des actifs biologiques","2947":"Dépréciations des agencements et aménagements du matériel et des actifs biologiques","2948":"Dépréciations des autres matériels","2949":"Dépréciations du matériel en cours","2951":"Dépréciations des avances et acomptes versés sur immobilisations incorporelles","2952":"Dépréciations des avances et acomptes versés sur immobilisations corporelles","2961":"Dépréciations des titres de participation dans des sociétés sous contrôle exclusif","2962":"Dépréciations des titres de participation dans les sociétés sous contrôle conjoint","2963":"Dépréciations des titres de participation dans les sociétés conférant une influence notable","2965":"Dépréciations des participations dans des organismes professionnels","2966":"Dépréciations des parts dans des G.I.E.","2968":"Dépréciations des autres titres de participation","2971":"Dépréciations des prêts et créances","2972":"Dépréciations des prêts au personnel","2973":"Dépréciations des créances sur l'Etat","2974":"Dépréciations des titres immobilisés","2975":"Dépréciations des dépôts et cautionnements versés","2977":"Dépréciations des créances rattachées à des participations et avances à des G.I.E.","2978":"Dépréciations des créances financières diverses","3111":"Marchandises A1","3112":"Marchandises A2","3121":"Marchandises B1","3122":"Marchandises B2","3351":"Emballages perdus","3352":"Emballages récupérables non identifiables","3353":"Emballages à usage mixte","3358":"Autres emballages","3411":"Produits en cours P1","3412":"Produits en cours P2","3421":"Travaux en cours T1","3422":"Travaux en cours T2","3431":"Produits intermédiaires A","3432":"Produits intermédiaires B","3441":"Produits résiduels A","3442":"Produits résiduels B","3511":"Etudes en cours E1","3512":"Etudes en cours E2","3521":"Prestations de services S1","3522":"Prestations de services S2","3711":"Produits intermédiaires A","3712":"Produits intermédiaires B","3721":"Déchets","3722":"Rebuts","3723":"Matières de récupération","3871":"Stock en consignation","3872":"Stock en dépôt","4011":"Fournisseurs","4012":"Fournisseurs-Groupe","4013":"Fournisseurs sous-traitants","4017":"Fournisseurs, retenues de garantie","4021":"Fournisseurs, Effets à payer","4022":"Fournisseurs-Groupe, Effets à payer","4023":"Fournisseurs sous-traitants, Effets à payer","4041":"Fournisseurs dettes en compte, immobilisations incorporelles","4042":"Fournisseurs dettes en compte, immobilisations corporelles","4046":"Fournisseurs effets à payer, immobilisations incorporelles","4047":"Fournisseurs effets à payer, immobilisations corporelles","4081":"Fournisseurs","4082":"Fournisseurs-Groupe","4083":"Fournisseurs sous-traitants","4086":"Fournisseurs, intérêts courus","4091":"Fournisseurs, avances et acomptes versés","4092":"Fournisseurs-Groupe, avances et acomptes versés","4093":"Fournisseurs sous-traitants, avances et acomptes versés","4094":"Fournisseurs, créances pour emballages et matériels à rendre","4098":"Rabais, Remises, Ristournes et autres avoirs à obtenir","4111":"Clients","4112":"Clients-Groupe","4114":"Clients, Etat et collectivités publiques","4115":"Clients, organismes internationaux","4116":"Clients ventes avec réserves de propriété","4117":"Clients, retenues de garantie","4118":"Clients, dégrèvements de Taxes sur la Valeur Ajoutée (T.V.A.)","4121":"Clients, Effets à recevoir","4122":"Clients-Groupe, Effets à recevoir","4124":"Etat et collectivités publiques, Effets à recevoir","4125":"Organismes internationaux, Effets à recevoir","4126":"clients ventes avec réserves de propriété, effets à recevoir","4141":"Créances en compte","4142":"Effets à recevoir","4146":"Effets à recevoir, immobilisations incorporelles","4147":"Effets à recevoir, immobilisations corporelles","4161":"Créances litigieuses","4162":"Créances douteuses","4181":"Clients, factures à établir","4186":"Clients, intérêts courus","4191":"Clients, avances et acomptes reçus","4192":"Clients-Groupe, avances et acomptes reçus","4194":"Clients, dettes pour emballages et matériels consignés","4198":"Rabais, Remises, Ristournes et autres avoirs à accorder","4211":"Personnel, avances","4212":"Personnel, acomptes","4213":"Frais avancés et fournitures au personnel","4231":"Personnel, oppositions","4232":"Personnel, saisies-arrêts","4233":"Personnel, avis à tiers détenteur","4241":"Assistance médicale","4242":"Allocations familiales","4245":"Organismes sociaux rattachés à l'entité","4248":"Autres œuvres sociales internes","4251":"Délégués du personnel","4252":"Syndicats et Comités d'entreprise, d'établissement","4258":"Autres représentants du personnel","4261":"Participation aux bénéfices","4264":"Participation au capital","4281":"Dettes provisionnées pour congés à payer","4286":"Autres charges à payer","4287":"Produits à recevoir","4311":"Prestations familiales","4312":"Accidents du travail","4313":"Caisse de retraite obligatoire","4314":"Caisse de retraite facultative","4318":"Autres cotisations sociales","4331":"Mutuelle","4332":"Assurances retraite","4333":"Assurances et organismes de santé","4381":"Charges sociales sur gratifications à payer","4382":"Charges sociales sur congés à payer","4386":"Autres charges à payer","4387":"Produits à recevoir","4421":"Impôts et taxes d'Etat","4422":"Impôts et taxes pour les collectivités publiques","4423":"Impôts et taxes recouvrables sur des obligataires","4424":"Impôts et taxes recouvrables sur des associés","4426":"Droits de douane","4428":"Autres impôts et taxes","4431":"T.V.A. facturée sur ventes","4432":"T.V.A. facturée sur prestations de services","4433":"T.V.A. facturée sur travaux","4434":"T.V.A. facturée sur production livrée à soi-même","4435":"T.V.A. sur factures à établir","4441":"Etat, T.V.A. due","4449":"Etat, crédit de T.V.A. à reporter","4451":"T.V.A. récupérable sur immobilisations","4452":"T.V.A. récupérable sur achats","4453":"T.V.A. récupérable sur transport","4454":"T.V.A. récupérable sur services extérieurs et autres charges","4455":"T.V.A. récupérable sur factures non parvenues","4456":"T.V.A. transférée par d'autres entités","4471":"Impôt général sur le revenu","4472":"Impôts sur salaires","4473":"Contribution nationale","4474":"Contribution nationale de solidarité","4478":"Autres impôts et contributions","4486":"Charges à payer","4487":"Produits à recevoir","4491":"Etat, obligations cautionnées","4492":"Etat, avances et acomptes versés sur impôts","4493":"Etat, fonds de dotation à recevoir","4494":"Etat, subventions d'équipement à recevoir","4495":"Etat, subventions d'exploitation à recevoir","4496":"Etat, subventions d'équilibre à recevoir","4497":"Etat avances sur subventions","4499":"Etat, fonds réglementé provisionné","4581":"Organismes internationaux, fonds de dotation à recevoir","4582":"Organismes internationaux, subventions à recevoir","4611":"Apporteurs, apports en nature","4612":"Apporteurs, apports en numéraire","4613":"Apporteurs, capital souscrit appelé non versé","4614":"Apporteurs, capital appelé non versé","4615":"Apporteurs, versements reçus sur augmentation de capital","4616":"Apporteurs, versements anticipés","4617":"Apporteurs défaillants","4618":"Apporteurs, autres apports","4619":"Apporteurs, capital à rembourser","4621":"Principal","4626":"Intérêts courus","4711":"Débiteurs divers","4712":"Créditeurs divers","4713":"Obligataires","4714":"Créances sur cessions de titres de placement","4715":"Rémunérations d'administrateurs","4716":"Compte du factor","4717":"Débiteurs divers- retenues de garantie","4718":"Apport, compte de restructuration","4719":"Bons de souscription d'actions et d'obligations","4731":"Mandants","4732":"Mandataires","4733":"Commettants","4734":"Commissionnaires","4746":"Charges","4747":"Produits","4751":"Compte actif","4752":"Compte passif","4781":"Diminution des créances","4782":"Augmentation des dettes","4788":"Différences compensées par couverture de change","4791":"Augmentation des créances","4792":"Diminution des dettes","4798":"Différences compensées par couverture de change","4811":"Immobilisations incorporelles","4812":"Immobilisations corporelles","4813":"Versements restant à effectuer sur titres de participation et titres immobilisés non libérés","4817":"Retenues de garantie","4818":"Factures non parvenues","4851":"en compte","4852":"Effets à recevoir","4857":"Retenues de garantie","4858":"Factures à établir","4911":"Créances litigieuses","4912":"Créances douteuses","4962":"Associés, comptes courants","4963":"Associés, opérations faites en commun","4966":"Groupe, comptes courants","4981":"Créances sur cessions d'immobilisations","4982":"Créances sur cessions de titres de placement","4983":"Autres créances H.A.O.","4991":"sur opérations d'exploitation","4998":"sur opérations H.A.O.","5011":"Titres du Trésor à court terme","5012":"Titres d'organismes financiers","5013":"Bons de caisse à court terme","5016":"Frais d'acquisition des titres du trésor et bons de caisse","5021":"Actions ou parts propres","5022":"Actions cotées","5023":"Actions non cotées","5024":"Actions démembrées (certificats d'investissement ; droits de vote)","5025":"Autres actions","5026":"Frais d'acquisition des actions","5031":"Obligations émises par la société et rachetées par elle","5032":"Obligations cotées","5033":"Obligations non cotées","5035":"Autres obligations","5036":"Frais d'acquisition des obligations","5042":"Bons de souscription d'actions","5043":"Bons de souscription d'obligations","5061":"Titres du Trésor et bons de caisse à court terme","5062":"Actions","5063":"Obligations","5181":"Warrants","5182":"Billets de fonds","5185":"Chèques de voyage","5186":"Coupons échus","5187":"Intérêts échus des obligations","5211":"Banque X","5212":"Banque Y","5361":"Etablissements financiers, intérêts courus, charges à payer","5367":"Etablissements financiers, intérêts courus produits à recevoir","5561":"Banques, intérêts courus, charges à payer","5667":"Banques, intérêts courus, produits à recevoir","5711":"Caisse en monnaie nationale","5712":"en devises","5721":"en monnaie nationale","5722":"en devises","5731":"en monnaie nationale","5732":"en devises","6011":"dans la Région","6012":"hors Région (1)","6013":"aux entités du groupe dans la Région","6014":"aux entités du groupe hors Région","6015":"Frais sur achats (2)","6019":"Rabais, Remises et Ristournes obtenus (non ventilés)","6021":"dans la Région (1)","6022":"hors Région","6023":"aux entités du groupe dans la Région","6024":"aux entités du groupe hors Région","6025":"Frais sur Achats (2)","6029":"Rabais, Remises et Ristournes obtenus (non ventilés)","6031":"Variations des stocks de marchandises","6032":"Variations des stocks de matières premières et fournitures liées","6033":"Variations des stocks d'autres approvisionnements","6041":"Matières consommables","6042":"Matières combustibles","6043":"Produits d'entretien","6044":"Fournitures d'atelier et d'usine","6045":"Frais sur Achats (2)","6046":"Fournitures de magasin","6047":"Fournitures de bureau","6049":"Rabais, Remises et Ristournes obtenus (non ventilés)","6051":"Fournitures non stockables-Eau","6052":"Fournitures non stockables- Electricité","6053":"Fournitures non stockables- Autres énergies","6054":"Fournitures d'entretien non stockables","6055":"Fournitures de bureau non stockables","6056":"Achats de petit matériel et outillage","6057":"Achats d'études et prestations de service","6058":"Achats de travaux, matériels et équipements","6059":"Rabais, Remises et Ristournes obtenus (non ventilés)","6081":"Emballages perdus","6082":"Emballages récupérables non identifiables","6083":"Emballages à usage mixte","6085":"Frais sur achats (2)","6089":"Rabais, Remises et Ristournes obtenus (non ventilés)","6181":"Voyages et déplacements","6182":"Transports entre établissements ou chantiers","6183":"Transports entre établissements ou chantiers","6221":"Locations de terrains","6222":"Locations de bâtiments","6223":"Locations de matériels et outillages","6224":"Malis sur emballages","6225":"Locations d'emballages","6226":"Fermages et loyers du foncier","6228":"Locations et charges locatives diverses","6232":"Crédit-bail immobilier","6233":"Crédit-bail mobilier","6234":"location vente","6235":"Autres contrats de location acquisition","6241":"Entretien et réparations des biens immobiliers","6242":"Entretien et réparations des biens mobiliers","6243":"Maintenance","6248":"Autres entretiens et réparations","6251":"Assurances multirisques","6252":"Assurances matériel de transport","6253":"Assurances risques d'exploitation","6254":"Assurances responsabilité du producteur","6255":"Assurances insolvabilité clients","6257":"Assurances transports sur ventes","6258":"Autres primes d'assurances","6261":"Etudes et recherches","6265":"Documentation générale","6266":"Documentation technique","6271":"Annonces, insertions","6272":"Catalogues, imprimés publicitaires","6273":"Echantillons","6274":"Foires et expositions","6275":"Publications","6276":"Cadeaux à la clientèle","6277":"Frais de colloques, séminaires, conférences","6278":"Autres charges de publicité et relations publiques","6281":"Frais de téléphone","6282":"Frais de télex","6283":"Frais de télécopie","6288":"Autres frais de télécommunications","6311":"Frais sur titres (, vente, garde)","6312":"Frais sur effets","6313":"Location de coffres","6314":"Commissions d' affacturage","6315":"Commissions sur cartes de crédit","6316":"Frais d'émission d'emprunts","6317":"Frais sur instruments monétaires électroniques.","6318":"Autres frais bancaires","6322":"Commissions et courtages sur ventes","6324":"Honoraires des professions règlementées","6325":"Frais d'actes et de contentieux","6327":"Rémunérations des autres prestataires de services","6328":"Divers frais","6342":"Redevances pour brevets, licences","6343":"Redevances pour logiciels","6344":"Redevances pour marques","6345":"Redevances pour sites","6346":"Redevances pour concessions, droits et valeurs similaires","6351":"Cotisations","6358":"Concours divers","6371":"Personnel intérimaire","6372":"Personnel détaché ou prêté à l'entité","6381":"Frais de recrutement du personnel","6382":"Frais de déménagement","6383":"Réceptions","6384":"Missions","6411":"Impôts fonciers et taxes annexes","6412":"Patentes, licences et taxes annexes","6413":"Taxes sur appointements et salaires","6414":"Taxes d'apprentissage","6415":"Formation professionnelle continue","6418":"Autres impôts et taxes directs","6461":"Droits de mutation","6462":"Droits de timbre","6463":"Taxes sur les véhicules de société","6464":"Vignettes","6468":"Autres droits","6471":"Pénalités d'assiette, impôts directs","6472":"Pénalités d'assiette, impôts indirects","6473":"Pénalités de recouvrement, impôts directs","6474":"Pénalités de recouvrement, impôts indirects","6478":"Autres amendes pénales et fiscales","6511":"Clients","6515":"Autres débiteurs","6521":"Quote-part transférée de bénéfices (comptabilité du gérant)","6525":"Pertes imputées par transfert (comptabilité des associés non gérants)","6581":"Indemnités de fonction et autres rémunérations d'administrateurs","6582":"Dons","6583":"Mécénat","6588":"Autres charges diverses","6591":"sur risques à court terme","6593":"Charges pour dépréciations sur stocks","6594":"Charges pour dépréciations sur créances","6598":"Autres charges pour dépréciations et provisions pour risques à court terme","6611":"Appointements, salaires et commissions","6612":"Primes et gratifications","6613":"Congés payés","6614":"Indemnités de préavis, de licenciement et de recherche d'embauche","6615":"Indemnités de maladie versées aux travailleurs","6616":"Supplément familial","6617":"Avantages en nature","6618":"Autres rémunérations directes","6621":"Appointements, salaires et commissions","6622":"Primes et gratifications","6623":"Congés payés","6624":"Indemnités de préavis, de licenciement et de recherche d'embauche","6625":"Indemnités de maladie versées aux travailleurs","6626":"Supplément familial","6627":"Avantages en nature","6628":"Autres rémunérations directes","6631":"Indemnités de logement","6632":"Indemnités de représentation","6633":"Indemnités d'expatriation","6638":"Autres indemnités et avantages divers","6641":"Charges sociales sur rémunération du personnel national","6642":"Charges sociales sur rémunération du personnel non national","6661":"Rémunération du travail de l'exploitant","6662":"Charges sociales","6671":"Personnel intérimaire","6672":"Personnel détaché ou prêté à l'entité","6681":"Versements aux Syndicats et Comités d'entreprise, d'établissement","6682":"Versements aux Comités d'hygiène et de sécurité","6683":"Versements aux autres œuvres sociales","6684":"Médecine du travail et pharmacie","6685":"Assurances et organismes de santé","6686":"Assurances retraite et fonds de pension","6711":"Emprunts obligataires","6712":"Emprunts auprès des établissements de crédit","6713":"Dettes liées à des participations","6714":"Primes de remboursement des obligations","6721":"Intérêts dans loyers de location acquisition / crédit-bail immobilier","6722":"Intérêts dans loyers de location acquisition / crédit-bail mobilier","6723":"Intérêts dans loyers de location acquisition / location vente","6724":"Intérêts dans loyers des autres contrats","6741":"Avances reçues et dépôts créditeurs","6742":"Comptes courants bloqués","6743":"Intérêts sur obligations cautionnées","6744":"Intérêts sur dettes commerciales","6745":"Intérêts bancaires et sur opérations de trésorerie et d'escompte","6748":"Intérêts sur dettes diverses","6771":"Pertes sur cessions de titres de placement","6772":"Malis provenant d'attribution gratuite d'actions au personnel salarié et aux dirigeants","6781":"sur rentes viagères","6782":"sur opérations financières","6784":"sur instruments de trésorerie","6791":"charges pour dépréciation sur risques financiers et le crédit du compte 594 dépréciations des comptes d'instruments financiers.","6795":"sur titres de placement","6798":"Autres charges pour dépréciations et provisions pour risques à court terme financières","6812":"Dotations aux amortissements des immobilisations incorporelles","6813":"Dotations aux amortissements des immobilisations corporelles","6911":"pour risques et charges","6913":"des immobilisations incorporelles","6914":"des immobilisations corporelles","6971":"pour risques et charges","6972":"des immobilisations financières","7011":"dans la Région (1)","7012":"hors Région (1)","7013":"aux entités du groupe dans la Région","7014":"aux entités du groupe hors Région","7015":"sur internet","7021":"dans la Région (1)","7022":"hors Région (1)","7023":"aux entités du groupe dans la Région","7024":"aux entités du groupe hors Région","7025":"sur internet","7031":"dans la Région (1)","7032":"hors Région (1)","7033":"aux entités du groupe dans la Région","7034":"aux entités du groupe hors Région","7035":"sur internet","7041":"dans la Région (1)","7042":"hors Région (1)","7043":"aux entités du groupe dans la Région","7044":"aux entités du groupe hors Région","7045":"sur internet","7051":"dans la Région (1)","7052":"hors Région (1)","7053":"aux entités du groupe dans la Région","7054":"aux entités du groupe hors Région","7055":"sur internet","7061":"dans la Région (1)","7062":"hors Région (1)","7063":"aux entités du groupe dans la Région","7064":"aux entités du groupe hors Région","7065":"sur internet","7071":"Ports, emballages perdus et autres frais facturés","7072":"Commissions et courtages (2)","7073":"Locations (2)","7074":"Bonis sur reprises et cessions d'emballage","7075":"Mise à disposition de personnel (2)","7076":"Redevances pour brevets, logiciels, marques et droits similaires (2)","7077":"Services exploités dans l'intérêt du personnel","7078":"Autres produits accessoires","7181":"Versées par l'Etat et les collectivités publiques","7182":"Versées par les organismes internationaux","7183":"Versées par des tiers","7341":"Produits en cours","7342":"Travaux en cours","7351":"Etudes en cours","7352":"Prestations de services en cours","7371":"Produits intermédiaires","7372":"Produits résiduels","7521":"Quote-part transférée de pertes (comptabilité du gérant)","7525":"Bénéfices attribués par transfert (comptabilité des associés non gérants)","7581":"Indemnités de fonction et autres rémunérations","7582":"Indemnités d'assurances reçues","7588":"Autres produits divers","7591":"sur risques à court terme","7593":"Reprises de charges pour dépréciations sur stocks","7594":"Reprises de charges pour dépréciations sur créances","7598":"sur autres charges pour dépréciations et provisions pour risques à court terme","7712":"Intérêts de prêts","7713":"Intérêts sur créances diverses","7721":"Revenus des titres de participation","7722":"Revenus des autres titres immobilisés","7745":"Revenus des obligations","7746":"Revenus des titres de placement","7781":"sur rentes viagères","7782":"sur opérations financières","7784":"sur instruments de trésorerie","7791":"sur risques financiers","7795":"sur titres de placement","7798":"sur Autres charges pour dépréciations et provisions pour risques à court terme financières","7911":"pour risques et charges","7913":"des immobilisations incorporelles","7914":"des immobilisations corporelles","7971":"pour risques et charges","7972":"des immobilisations financières","8911":"Activités exercées dans l'Etat","8912":"Activités exercées dans les autres Etats de la Région","8913":"Activités exercées hors Région","8991":"Dégrèvements","8994":"Annulations pour pertes rétroactives","9011":"Crédits confirmés obtenus","9012":"Emprunts restant à encaisser","9013":"Facilités de financement renouvelables","9014":"Facilités d'émission","9018":"Autres engagements de financement obtenus","9021":"Avals obtenus","9022":"Cautions, garanties obtenues","9023":"Hypothèques obtenues","9024":"Effets endossés par des tiers","9028":"Autres garanties obtenues","9031":"Achats de marchandises à terme","9032":"Achats à terme de devises","9033":"Commandes fermes des clients","9038":"Autres engagements réciproques","9041":"Abandons de créances conditionnels","9043":"Ventes avec clause de réserve de propriété","9048":"Divers engagements obtenus","9051":"Crédits accordés non décaissés","9058":"Autres engagements de financement accordés","9061":"Avals accordés","9062":"Cautions, garanties accordées","9063":"Hypothèques accordées","9064":"Effets endossés par l'entité","9068":"Autres garanties accordées","9071":"Ventes de marchandises à terme","9072":"Ventes à terme de devises","9073":"Commandes fermes aux fournisseurs","9078":"Autres engagements réciproques","9081":"Annulations conditionnelles de dettes","9083":"Achats avec clause de réserve de propriété","9088":"Divers engagements accordés","9151":"Contrepartie du compte 9051 (crédits accordés non décaissés)","9183":"Contrepartie du compte 9083 (achats avec clause de réserve de propriété)","10":"Capital"};
const makeLines=(rows,kind)=>rows.map(([ref,label,accounts])=>({ref,label,accounts:accounts.split(','),kind,section:kind==='income'||kind==='expense'?'Compte de résultat':'Bilan',plain:label}));
const ACTIF=makeLines([
 ['AE','Frais de développement et de prospection minière','211,2181,2191,2811,2911'],
 ['AF','Brevets, licences, logiciels et droits similaires','212,213,214,2193,2812,2813,2814,2912,2913,2914'],
 ['AG','Fonds commercial et droit au bail','215,216,2815,2816,2915,2916'],
 ['AH','Autres immobilisations incorporelles','217,218,2198,2817,2818,2917,2918'],
 ['AJ','Terrains','22,282,292'],
 ['AK','Bâtiments','231,232,233,237,2391,2831,2832,2833,2837,2931,2932,2933,2937'],
 ['AL','Aménagements, agencements et installations','234,235,238,2392,2393,2834,2835,2838,2934,2935,2938'],
 ['AM','Matériel, mobilier et actifs biologiques','24,284,294'],
 ['AN','Matériel de transport','245,2495,2845,2945'],
 ['AP','Avances et acomptes sur immobilisations','251,252,2951,2952'],
 ['AR','Titres de participation','26,296'],['AS','Autres immobilisations financières','27,297'],
 ['BA','Actif circulant HAO','485,488,498'],['BB','Stocks et encours','3'],
 ['BH','Fournisseurs, avances versées','409,490'],['BI','Clients','41,491'],
 ['BJ','Autres créances','185,42,43,44,45,46,47,492,493,494,495,496,497'],
 ['BQ','Titres de placement','50,590'],['BR','Valeurs à encaisser','51,591'],
 ['BS','Banques, chèques postaux, caisse et assimilés','52,53,54,55,57,581,582,592,593,594'],
 ['BU','Écart de conversion-actif','478']
],'asset');
const PASSIF=makeLines([
 ['CA','Capital','101,102,103,104'],['CB','Apporteurs, capital non appelé (−)','109'],
 ['CD','Primes liées au capital social','105'],['CE','Écarts de réévaluation','106'],
 ['CF','Réserves indisponibles','111,112,113'],['CG','Réserves libres','118'],
 ['CH','Report à nouveau (+ ou −)','12'],['CJ','Résultat net de l’exercice (+ ou −)','13'],
 ['CL','Subventions d’investissement','14'],['CM','Provisions réglementées et fonds assimilés','15'],
 ['DA','Emprunts et dettes financières diverses','16,181,182,183,184'],
 ['DB','Dettes de location-acquisition','17'],['DC','Provisions pour risques et charges','19'],
 ['DH','Dettes circulantes HAO','481,482,484,4998'],['DI','Clients, avances reçues','419'],
 ['DJ','Fournisseurs d’exploitation','40'],['DK','Dettes fiscales et sociales','42,43,44'],
 ['DM','Autres dettes','185,45,46,47'],['DN','Provisions pour risques à court terme','499,599'],
 ['DQ','Banques, crédits d’escompte','564,565'],['DR','Banques, établissements financiers et crédits de trésorerie','52,53,561,566'],
 ['DV','Écart de conversion-passif','479']
],'liability');
const RESULT= [
 ...makeLines([['TA','Ventes de marchandises','701'],['TB','Ventes de produits fabriqués','702,703,704'],['TC','Travaux, services vendus','705,706'],['TD','Produits accessoires','707'],['TE','Production stockée ou déstockage','73'],['TF','Production immobilisée','72'],['TG','Subventions d’exploitation','71'],['TH','Autres produits','75'],['TI','Transferts de charges d’exploitation','781'],['TJ','Reprises d’amortissements, provisions et dépréciations','791,798,799'],['TK','Revenus financiers et assimilés','77'],['TL','Reprises de provisions et dépréciations financières','797'],['TM','Transferts de charges financières','787'],['TN','Produits des cessions d’immobilisations','82'],['TO','Autres produits HAO','84,86,88']],'income'),
 ...makeLines([['RA','Achats de marchandises','601'],['RB','Variation de stocks de marchandises','6031'],['RC','Achats de matières premières et fournitures liées','602'],['RD','Variation de stocks de matières premières et fournitures liées','6032'],['RE','Autres achats','604,605,608'],['RF','Variation de stocks d’autres approvisionnements','6033'],['RG','Transports','61'],['RH','Services extérieurs','62,63'],['RI','Impôts et taxes','64'],['RJ','Autres charges','65'],['RK','Charges de personnel','66'],['RL','Dotations aux amortissements, aux provisions et dépréciations','681,691'],['RM','Frais financiers et charges assimilées','67'],['RN','Dotations aux provisions et dépréciations financières','697'],['RO','Valeurs comptables des cessions d’immobilisations','81'],['RP','Autres charges HAO','83,85'],['RQ','Participation des travailleurs','87'],['RS','Impôts sur le résultat','89']],'expense')
];
BILAN_ACTIF_LINES.splice(0,BILAN_ACTIF_LINES.length,...ACTIF);
BILAN_PASSIF_LINES.splice(0,BILAN_PASSIF_LINES.length,...PASSIF);
RESULTAT_LINES.splice(0,RESULTAT_LINES.length,...RESULT);
const TOTAL_LINES={
 AD:['Immobilisations incorporelles','AE','AF','AG','AH'],AI:['Immobilisations corporelles','AJ','AK','AL','AM','AN'],AQ:['Immobilisations financières','AR','AS'],AZ:['Total actif immobilisé','AD','AI','AP','AQ'],BG:['Créances et emplois assimilés','BH','BI','BJ'],BK:['Total actif circulant','BA','BB','BG'],BT:['Total trésorerie-actif','BQ','BR','BS'],BZ:['Total général actif','AZ','BK','BT','BU'],
 CP:['Total capitaux propres et ressources assimilées','CA','CB','CD','CE','CF','CG','CH','CJ','CL','CM'],DD:['Total dettes financières et ressources assimilées','DA','DB','DC'],DF:['Total ressources stables','CP','DD'],DP:['Total passif circulant','DH','DI','DJ','DK','DM','DN'],DT:['Total trésorerie-passif','DQ','DR'],DZ:['Total général passif','DF','DP','DT','DV']
};
function longestLine(code,defs){let winner=null,len=0;for(const d of defs)for(const p of d.accounts)if(code.startsWith(p)&&p.length>len){winner=d;len=p.length;}return winner;}
function classifyAccount(code,net=1){
 const s=String(code);if(!OFFICIAL_CATALOG[s])return null;
 if(s.length<2||s[0]==='9')return null;
 let line=null;
 if('678'.includes(s[0]))line=longestLine(s,RESULT);
 else if(/^(185|42|43|44|45|46|47|52|53)/.test(s)&&! /^(478|479)/.test(s)){
  line=longestLine(s,net>=0?ACTIF:PASSIF);
 }else if(/^1/.test(s))line=longestLine(s,PASSIF);
 else if(/^(40)/.test(s))line=s.startsWith('409')?longestLine(s,ACTIF):longestLine(s,PASSIF);
 else if(/^41/.test(s))line=s.startsWith('419')?longestLine(s,PASSIF):longestLine(s,ACTIF);
 else if(/^(481|482|484|499|56|599|479)/.test(s))line=longestLine(s,PASSIF);
 else line=longestLine(s,ACTIF);
 // Les « p » de la table officielle demandent de ventiler les subdivisions partagées.
 if(/^(28|29|49|59)$/.test(s)||['281','283','291','293','2949','2919','2939'].includes(s))return null;
 if((s.startsWith('2818')||s.startsWith('2918')||s.startsWith('2919')||s.startsWith('2939')||s.startsWith('2949')))return null;
 return line;
}
const pedagogic={
 '601':'Biens achetés pour être revendus en l’état : marchandises.',
 '602':'Matières destinées à la transformation : fèves de cacao pour fabriquer du chocolat.',
 '6021':'Achat de matières premières dans la région. Le mot « région » est comptable ; il ne détermine pas la TVA ni le régime douanier.',
 '6025':'Frais sur achats de matières premières : transport d’approche et autres frais directement rattachables.',
 '624':'Entretien, réparations et maintenance. Les transports relèvent de 61 ; les frais sur achats peuvent relever de 6015 ou 6025.',
 '647':'Pénalités et amendes fiscales : examen de la non-déductibilité fiscale, distinct de l’enregistrement comptable.',
 '6581':'Indemnités de fonction et autres rémunérations d’administrateurs. Ce compte ne désigne pas les amendes fiscales.',
 '6593':'Charge de dépréciation des stocks : perte de valeur estimée, distincte de l’amortissement des machines et des créances.',
 '6594':'Charge de dépréciation des créances : risque de non-recouvrement ; ne désigne pas les stocks.',
 '7593':'Reprise de charge de dépréciation des stocks. Compte 75 : ligne TH, et non TJ.',
 '4451':'TVA récupérable sur immobilisations. Vérifier l’assujettissement, la facture, le droit à déduction et les exclusions.',
 '4452':'TVA récupérable sur achats. Une facture portant un NIU ne suffit pas à établir le droit à déduction.',
 '471':'Débiteurs et créditeurs divers : analyser la nature de chaque solde, sans imposer artificiellement un solde nul.',
 '552':'Monnaie électronique : téléphone portable. Conserver le rapprochement avec le relevé de l’opérateur.'
};
for(const k of Object.keys(SYSCOHADA_ACCOUNTS))delete SYSCOHADA_ACCOUNTS[k];
for(const [code,label] of Object.entries(OFFICIAL_CATALOG)){
 const d=classifyAccount(code),contra=/^(28|29|39|49[0-8]|59[0-4])/.test(code);
 const type=d?(d.kind==='asset'?(contra?'contra_asset':'asset'):d.kind==='liability'?(Number(code[0])===1&&Number(code.slice(0,2))<=15?'equity':'liability'):d.kind):'';
 SYSCOHADA_ACCOUNTS[code]={code,label,classe:Number(code[0]),type,refBilan:d?.ref||'À ventiler',refLabel:d?`${d.ref} · ${d.label}`:'Affectation détaillée à qualifier',normalSide:contra?'Crédit (correcteur d’actif)':type==='expense'||type==='asset'?'Débit':type?'Crédit':'Selon la nature et le solde',plain:pedagogic[code]||label,why:'Libellé du catalogue SYSCOHADA révisé. L’affectation du bilan dépend aussi du sens du solde et du détail des opérations.',source:CATALOG_SOURCE,catalogued:true};
}
explainAccount=function(code){const s=String(code||'').trim();return SYSCOHADA_ACCOUNTS[s]||{code:s,label:'Compte non répertorié : '+s,classe:Number(s[0])||0,type:'',refBilan:'À qualifier',refLabel:'Subdivision interne ou référence incorrecte',normalSide:'À vérifier',plain:'Vérifier le plan de comptes de l’entreprise et documenter le rattachement avant de produire les états.',why:'Aucun numéro ni libellé officiel n’est déduit automatiquement d’un préfixe.',catalogued:false};};

function safeSum(a,b){const n=a+b;if(!Number.isSafeInteger(n)||Math.abs(n)>MAX)throw Error('Cumul hors plage de calcul exacte');return n;}
function validDate(s){if(typeof s!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;const d=new Date(s+'T00:00:00Z');return !isNaN(d)&&d.toISOString().slice(0,10)===s;}
entry=function(lines){if(!Array.isArray(lines)||lines.length<2||lines.length>1000)throw Error('Écriture : 2 à 1 000 lignes requises');let d=0,c=0;for(const l of lines){if(!l||!/^\d{2,8}$/.test(String(l.account)))throw Error('Compte requis : 2 à 8 chiffres');const ld=positive(l.debit),lc=positive(l.credit);if((ld>0)===(lc>0))throw Error('Chaque ligne doit porter un débit OU un crédit positif');d=safeSum(d,ld);c=safeSum(c,lc);}if(d!==c)throw Error('Écriture déséquilibrée : débit '+d+' / crédit '+c);return {debit:d,credit:c};};
balance=function(entries){if(!Array.isArray(entries)||entries.length>5000)throw Error('Journal invalide ou trop volumineux');const m=Object.create(null);for(const e of entries){entry(e.lines);for(const l of e.lines){const a=String(l.account);m[a]??={account:a,debit:0,credit:0};m[a].debit=safeSum(m[a].debit,Number(l.debit));m[a].credit=safeSum(m[a].credit,Number(l.credit));}}return Object.values(m).sort((a,b)=>a.account.localeCompare(b.account));};

detailedStatement=function(entries,mapping={}){
 const rows=balance(entries),actifRows=ACTIF.map(d=>({...d,matched:[],brut:0,amort:0,net:0})),passifRows=PASSIF.map(d=>({...d,matched:[],net:0})),resultatRows=RESULT.map(d=>({...d,matched:[],amount:0}));
 const missing=[],warnings=[],allocations=[];let income=0,expense=0,equity=0,liabilities=0;
 for(const r of rows){const net=r.debit-r.credit;if(!net)continue;let def=classifyAccount(r.account,net);
  // Un rattachement manuel détaillé est permis, mais reste explicite et traçable.
  const manual=mapping[r.account];if(manual&&typeof manual==='object'&&manual.confirmed&&manual.ref){def=[...ACTIF,...PASSIF,...RESULT].find(d=>d.ref===manual.ref);warnings.push('Affectation manuelle confirmée : '+r.account+' → '+manual.ref);}
  if(!def){missing.push(r.account);continue;}allocations.push({account:r.account,ref:def.ref,net});
  if(def.kind==='asset'){const t=actifRows.find(d=>d.ref===def.ref);t.matched.push(r.account);if(/^(28|29|39|49[0-8]|59)/.test(r.account))t.amort-=net;else t.brut+=net;t.net=t.brut-t.amort;if(net<0&&!/^(28|29|39|49[0-8]|59)/.test(r.account))warnings.push('Solde créditeur à examiner : '+r.account);}
  else if(def.kind==='liability'){const t=passifRows.find(d=>d.ref===def.ref);t.matched.push(r.account);t.net-=net;if(['CA','CB','CD','CE','CF','CG','CH','CJ','CL','CM'].includes(def.ref))equity-=net;else liabilities-=net;}
  else {const t=resultatRows.find(d=>d.ref===def.ref);t.matched.push(r.account);t.amount+=def.kind==='income'?-net:net;if(def.kind==='income')income-=net;else expense+=net;}
 }
 const R=Object.fromEntries(resultatRows.map(d=>[d.ref,d.amount])),sum=refs=>refs.reduce((n,r)=>n+(R[r]||0),0);
 const XA=R.TA-R.RA-R.RB,XB=sum(['TA','TB','TC','TD']),XC=XB-R.RA-R.RB+sum(['TE','TF','TG','TH','TI'])-sum(['RC','RD','RE','RF','RG','RH','RI','RJ']),XD=XC-R.RK,XE=XD+R.TJ-R.RL,XF=R.TK+R.TL+R.TM-R.RM-R.RN,XG=XE+XF,XH=R.TN+R.TO-R.RO-R.RP,XI=XG+XH-R.RQ-R.RS;
 const result=income-expense;passifRows.find(d=>d.ref==='CJ').net+=result;
 if(passifRows.find(d=>d.ref==='CJ').matched.length&&result)warnings.push('Compte 13 et mouvements de résultat présents : contrôler si le journal mélange clôture et opérations non clôturées.');
 const assets=actifRows.reduce((s,d)=>s+d.net,0),passif=passifRows.reduce((s,d)=>s+d.net,0),totals={};
 for(const d of [...actifRows,...passifRows])totals[d.ref]=d.net;
 for(const [r,[label,...parts]] of Object.entries(TOTAL_LINES))totals[r]=parts.reduce((s,p)=>s+(totals[p]||0),0);
 return {rows,assets,liabilities,equity,income,expense,result,passif,difference:assets-passif,missing,warnings,allocations,complete:!missing.length,totalBrutActif:actifRows.reduce((s,d)=>s+d.brut,0),totalAmortActif:actifRows.reduce((s,d)=>s+d.amort,0),actifRows,passifRows,resultatRows,totals,sig:{XA,XB,XC,XD,XE,XF,XG,XH,XI}};
};
statement=function(entries,mapping){return detailedStatement(entries,mapping);};

inventory=function(openQty,openValue,moves,method){
 if(!['moving','period'].includes(method))throw Error('Méthode CMUP inconnue');if(!Array.isArray(moves)||moves.length>10000)throw Error('Mouvements invalides');
 let q=positive(openQty),v=positive(openValue),physical=q,totalQ=q,totalV=v;if(!q&&v)throw Error('Valeur sans quantité initiale');
 for(const m of moves){const n=positive(m.qty);if(!n)throw Error('Quantité nulle');if(m.type==='in'){physical=safeSum(physical,n);totalQ=safeSum(totalQ,n);totalV=safeSum(totalV,positive(m.value));}else if(m.type==='out'){physical-=n;if(physical<0)throw Error('Stock négatif dans l’ordre des mouvements');if(positive(m.value||0)!==0)throw Error('La valeur de sortie est calculée par le CMUP : saisir zéro');}else throw Error('Type entrée/sortie invalide');}
 const ratio=(a,b,c)=>c?Number((BigInt(a)*BigInt(b)*2n+BigInt(c))/(2n*BigInt(c))):0;let consumed=0,outQ=0;const rows=[];
 for(const m of moves){const n=Number(m.qty);let value;if(m.type==='in'){value=Number(m.value);q+=n;if(method==='moving')v+=value;}else {outQ+=n;if(method==='period'){const newConsumed=totalV-ratio(totalV,totalQ-outQ,totalQ);value=newConsumed-consumed;}else value=ratio(v,n,q);q-=n;if(method==='moving')v-=value;consumed+=value;}
  // CMUP périodique : les valeurs intermédiaires sont recalculées au coût de la période.
  if(method==='period')v=ratio(totalV,q,totalQ);
  rows.push({...m,value,qtyEnd:q,valueEnd:v,cmup:method==='period'?(totalQ?totalV/totalQ:0):(q?v/q:0)});
 }
 if(method==='period'){v=totalQ?ratio(totalV,q,totalQ):0;consumed=totalV-v;}
 return {qty:q,value:v,consumed,availableValue:totalV,availableQty:totalQ,cmup:method==='period'?(totalQ?totalV/totalQ:0):(q?v/q:0),rows};
};

const originalDiagnose=diagnose;
diagnose=function(p){const d=originalDiagnose({...p,year:String(p.year)});const ca=positive(p.ca);const threshold=p.activity==='commerce'?60000000:p.activity==='services'||p.activity==='liberal'?30000000:40000000;d.accounting=p.form==='association'?'SYCEBNL à qualifier':ca>=threshold?'Système normal SYSCOHADA (seuil de l’activité à confirmer)':'SMT possible sous conditions ; option pour le système normal';d.warnings.push('Le régime fiscal et le référentiel comptable sont deux qualifications distinctes (AUDCIF art. 13).');if(p.form==='coop')d.warnings.push('Une coopérative n’est pas exonérée de tous les impôts du seul fait de sa forme juridique.');return d;};
const originalTax=tax;
tax=function(x){if(x.excise==='unknown'&&positive(x.exciseBase||0)===0)x={...x,excise:'none'};const r=originalTax(x);const mode=x.vatMode||'taxable';if(!['taxable','exempt','outside','unknown'].includes(mode))throw Error('Traitement TVA à préciser');if(mode==='unknown'){r.blocked=true;r.netVat=r.vatLocal=r.vatDue=r.vatCredit=null;}else if(mode!=='taxable'){r.vatLocal=0;r.vatRoundedBase=0;r.netVat=0;r.vatDue=0;r.vatCredit=0;r.vatNote='Opérations sans TVA collectée : la récupération des achats et les activités mixtes doivent être qualifiées séparément.';}
 const year=String(x.year||'2026');r.incentive124A={applied:false,reason:'Agrément/validation DGI et conditions sectorielles requis.'};if(x.apply124A){if(year!=='2026'||!x.approval124A||!x.conditions124A)throw Error('Art. 124 A : période, validation DGI et conditions à confirmer');r.isProfit=rate(r.isProfit,5000);r.minimum=rate(r.minimum,5000);r.gross=Math.max(r.isProfit,r.minimum);r.balance=Math.max(0,r.gross-r.advance);r.excess=Math.max(0,r.advance-r.gross);r.incentive124A={applied:true,reason:'Réduction simulée de l’impôt et du minimum ; bénéfice imposable inchangé.'};}
 if(x.incomeMode&&x.incomeMode!=='corporate-real'){for(const k of ['isBp','isProfit','minimum','gross','balance','excess'])r[k]=null;r.incomeNote='IS ordinaire non liquidé : vérifier IGS, IRPP/BIC ou régime particulier.';}return r;};
const originalRoutes=compareRoutes;
compareRoutes=function(p){if(positive(p.withholdingBp||0)>10000||positive(p.exciseBp??500)>10000)throw Error('Taux supérieur à 100 %');const r=originalRoutes(p);for(const s of r.scenarios){s.cashOutBuy-=s.withholding;s.supplierNet=s.buyHt+s.vatIn-s.withholding;s.immediateCashFlow+=s.withholding;}r.hybrid.totalBuyCashOut-=r.hybrid.withholding;r.hybrid.netCashMonth+=r.hybrid.withholding;r.assumptions='Scénarios hypothétiques : traitement TVA du vendeur, exportation et retenue à confirmer. Une retenue prise sur le brut répartit le paiement entre fournisseur et fisc ; elle ne majore pas le prix d’achat.';return r;};
taxBridge=function(entries,mapping,opts={}){const st=detailedStatement(entries,mapping);if(st.missing.length)throw Error('Affectations manquantes : '+st.missing.join(', '));const accountingResult=st.result,reintegrations=[],deductions=[],candidates=[];const penalties=st.rows.filter(r=>r.account.startsWith('647')).reduce((s,r)=>s+r.debit-r.credit,0);if(penalties>0)reintegrations.push({label:'Pénalités et amendes fiscales nettes des contrepassations',account:'647',amount:penalties,rule:'CGI art. 7 : contrôler la nature de la pénalité.'});
 for(const e of entries)if(e.lines.some(l=>l.account.startsWith('57')&&l.credit>=100000))candidates.push({entryId:e.id,label:e.label,reason:'Paiement espèces : examiner séparément déductibilité de la charge et de la TVA. Aucune réintégration automatique de toute la dépense.'});
 if(opts.manualAdd>0)reintegrations.push({label:'Réintégrations documentées par l’utilisateur',account:'Divers',amount:positive(opts.manualAdd),rule:'Justificatifs à conserver'});if(opts.manualDeduct>0)deductions.push({label:'Déductions documentées par l’utilisateur',account:'Divers',amount:positive(opts.manualDeduct),rule:'Justificatifs à conserver'});const totalReint=reintegrations.reduce((s,d)=>s+d.amount,0),totalDed=deductions.reduce((s,d)=>s+d.amount,0),rawFiscalResult=accountingResult+totalReint-totalDed,roundedFiscalBase=Math.floor(Math.max(0,rawFiscalResult)/1000)*1000;return {accountingResult,reintegrations,deductions,candidates,totalReint,totalDed,rawFiscalResult,roundedFiscalBase,abattement124A:0,netTaxableProfit:roundedFiscalBase,warnings:['Brouillon de passage fiscal ; déficits reportables, crédits, règles sectorielles et ajustements à compléter.',...(opts.apply124A?['Art. 124 A : réduction de l’impôt sous conditions, jamais division automatique du bénéfice imposable.']:[])]};};
const originalSmart=smartOperation;
smartOperation=function(kind,opts={}){const r=originalSmart(kind,opts);if(kind==='achat_machine')for(const l of r.lines)if(l.account==='4452')l.account='4451';r.simulation=true;r.requiresReview=true;r.taxNote=(r.taxNote||'')+' Exemple pédagogique : confirmer facture, assujettissement, base, taux, retenues et pièce avant comptabilisation.';for(const l of r.lines){const i=explainAccount(l.account);l.label=i.label;l.refBilan=i.refBilan;l.refLabel=i.refLabel;}entry(r.lines.filter(l=>l.debit||l.credit));r.lines=r.lines.filter(l=>l.debit||l.credit);return r;};
const originalValidateImport=validateImport;
validateImport=function(x){const visit=(v,depth=0)=>{if(depth>30)throw Error('Dossier trop imbriqué');if(v&&typeof v==='object'){for(const k of Object.keys(v)){if(['__proto__','constructor','prototype'].includes(k))throw Error('Clé réservée dans le dossier');visit(v[k],depth+1);}}};visit(x);originalValidateImport(x);const ids=new Set();for(const c of x.cases){if(typeof c.id!=='string'||!/^[-a-zA-Z0-9.]{1,100}$/.test(c.id)||ids.has(c.id))throw Error('Identifiant de dossier invalide ou dupliqué');ids.add(c.id);for(const e of c.entries)if(!validDate(e.date))throw Error('Date comptable inexistante : '+e.date);if(c.accountMap&&Object.values(c.accountMap).some(v=>typeof v!=='string'&&typeof v!=='object'))throw Error('Affectations invalides');}return x;};
const originalPurchase=purchase;
purchase=function(x){const r=originalPurchase(x);if(x.date&&!validDate(x.date)){r.blocked=true;r.missing.push('Date réelle au calendrier');}return r;};
validateNiu=function(niu){const raw=String(niu||'').trim().toUpperCase(),valid=/^[MP]\d{12}[A-Z0-9]$/.test(raw);return {niu:raw,valid,type:raw.startsWith('M')?'Personne morale déclarée':raw.startsWith('P')?'Personne physique déclarée':'À renseigner',message:valid?'Format indicatif reconnu ; existence, clé et activité non vérifiées auprès de la DGI.':'Format indicatif attendu : M/P, 12 chiffres, caractère final. Aucun NIU fictif n’est attribué.'};};
buildHarmonyStatus=function(c){const d=diagnose(c);return {niuCheck:validateNiu(c.niu),isIgs:!!d.igs,igsRow:IGS_CLASSES_DETAIL.find(r=>positive(c.ca)>=r.minCa&&positive(c.ca)<=r.maxCa)||null,declarations:['BEF / bénéficiaires effectifs','IGS ou acomptes IS / IRPP','TVA et droits d’accises','DSF annuelle','État administratif du NIU','Cotisations et attestation CNPS'].map((label,i)=>({id:'obligation-'+i,label,portal:i===5?'https://www.cnps.cm/':'https://www.impots.cm/',status:'unverified',actionLabel:'Non vérifié',detail:'Reçu officiel ou consultation autorisée du portail requis. Applicabilité à confirmer.'})),acfDeliverable:null,acfMessage:'Situation officielle inconnue. Fiscalibre ne délivre pas d’ACF ni d’ACS et ne déduit pas leur disponibilité d’une case cochée.',redevances:[],connection:{state:'not-configured',missing:['Activation API DSF dans le compte Harmony autorisé','Documentation technique et schémas de l’exercice','URL officielles et environnement de test confirmés','Authentification API dédiée côté serveur','Règles de validation, reçus, consultation de statut et traitement des doublons']}};};

// Corrige aussi les fiches pédagogiques affichées par les modules conservés.
for(const x of SYSCOHADA_CONFUSIONS){x.right=x.right.replace('759/791','791/798/799').replace('75, hors reprises 759','75, y compris 759');x.why=x.why.replace('611 sur achats','6025 sur achats de matières premières').replace('garantit que le fichier généré pour la DSF sur le portail Harmony 2 de la DGI passe tous les contrôles de cohérence sans rejet','aide à préparer les états ; la validation officielle reste nécessaire');}
for(const x of JARGON_DICTIONARY){if(/5\s*%|TVA déductible|Taux Zéro/i.test(x.jargon||'')){x.jargon='Qualification préalable : '+x.jargon+' — Taux et traitement présentés comme hypothèse, jamais établis par le seul statut du fournisseur.';}}

getAccountScenarios=function(codeOrRef,baseAmount=1000000,opts={}){
 const raw=String(codeOrRef||'6021').trim().toUpperCase();let code=raw;
 if(!SYSCOHADA_ACCOUNTS[code]){const line=[...ACTIF,...PASSIF,...RESULT].find(d=>d.ref===raw);if(line)code=line.accounts.find(a=>SYSCOHADA_ACCOUNTS[a])||raw;}
 const info=TOTAL_LINES[raw]?{code:raw,catalogued:true,label:TOTAL_LINES[raw][0],refBilan:raw,refLabel:raw+' · '+TOTAL_LINES[raw][0],plain:'Total calculé à partir des lignes : '+TOTAL_LINES[raw].slice(1).join(', ')}:explainAccount(code);if(!info.catalogued)throw Error('Compte ou ligne inconnu : '+raw);
 const A=positive(baseAmount);if(!A)throw Error('Montant positif requis');const count=Math.max(15,Math.min(50,positive(opts.count||15)));
 const checks=['Nature économique et pièce','Droit à comptabiliser','Choix du compte et sous-compte','Régime fiscal de l’entreprise','Statut du partenaire','TVA : taxable, exonérée ou hors champ','Retenue : nature, base et taux','Moyen et preuve de règlement','Rattachement à l’exercice','Dimension analytique','Inventaire et évaluation','Justification du solde','Affectation aux états','Passage fiscal documenté','Révision et contrepassation'];
 // Contreparties exclusivement pour quelques cas définis. Les autres comptes demandent une analyse.
 const match=[['602','4011',true,'Achat à crédit de matières premières, sans TVA dans cette hypothèse'],['601','4011',true,'Achat à crédit de marchandises, sans TVA dans cette hypothèse'],['624','4011',true,'Entretien facturé à crédit, TVA non modélisée'],['6593','392',true,'Dépréciation motivée d’un stock de matières premières'],['6594','491',true,'Dépréciation motivée d’une créance client'],['7593','392',false,'Reprise d’une dépréciation de stock antérieure, dans la limite du solde'],['702','411',false,'Vente à crédit de produits finis, taxes à qualifier'],['701','411',false,'Vente à crédit de marchandises, taxes à qualifier'],['101','521',false,'Versement au capital d’une société, actes et libération justifiés']].find(([p])=>code.startsWith(p));
 return Array.from({length:count},(_,i)=>{const value=positive(A+i*1000);const lines=match?[{account:code,debit:match[2]?value:0,credit:match[2]?0:value},{account:match[1],debit:match[2]?0:value,credit:match[2]?value:0}]:[];return {variation:i+1,totalVariations:count,code,accountLabel:info.label,refBilan:info.refBilan,refLabel:info.refLabel,headerTag:`COMPTE ${code} · EXERCICE ${i+1}/${count}`,title:checks[i%checks.length],prompt:`${opts.city||'Cameroun'} · ${value.toLocaleString('fr-FR')} XAF · ${match?match[3]:'Analyse documentaire du compte ; aucune écriture universelle'}`,naturalTerm:info.plain,proJargon:`${code} — ${info.label} ; ${info.refLabel}`,trap:'Une écriture équilibrée ne prouve ni son bien-fondé ni sa conformité fiscale.',response:match?match[3]+' ; confirmer les pièces et les traitements fiscaux avant toute saisie.':'Définir le fait générateur, la contrepartie, le sens du solde et la pièce avant de proposer une écriture.',lines,reviewOnly:true,asciiBox:lines.length?formatAsciiBox(lines):'Aucune écriture automatique : analyse professionnelle requise.'};});
};
const originalGenerate=generateProceduralScenario;
generateProceduralScenario=function(params){const r=originalGenerate(params);r.totalCombinatorialSpace='Exercices paramétriques et questions de révision ; les variantes ne constituent pas des avis fiscaux distincts.';return r;};
const originalAskExpert=askExpert;
askExpert=function(query,customAmount){const r=originalAskExpert(query,customAmount);for(const s of r.allScenarios){s.reviewOnly=true;s.trap='Vérifier la qualification, les pièces, les taux et les retenues applicables ; aucun traitement fiscal ne résulte du seul vocabulaire de la question.';s.response='Exemple à qualifier. '+s.response;s.altLines=[];
  if(s.id==='q1_cacao_brousse'||s.id==='q14_cacao_moisi_brousse_375k'){s.naturalTerm='Achat de matières premières pour transformation';s.proJargon='6021 Achats de matières premières dans la région / 4011 Fournisseurs';s.response='Proposition : débit 6021 et crédit 4011 pour le montant de la facture. Confirmer si le montant est brut, net ou HT/TTC. Sans NIU ne signifie pas automatiquement retenue de 5 % ; la TVA, la retenue, la date et la pièce restent à qualifier. Le pilote AST bloque la comptabilisation tant que ces éléments manquent.';s.lines=[{account:'6021',debit:r.amount,credit:0},{account:'4011',debit:0,credit:r.amount}];}
  for(const l of s.lines||[])if(l.account==='6581')l.account='647';
  s.asciiBox=s.lines?.length?formatAsciiBox(s.lines):'Écriture à définir après qualification.';
 }
 r.jargonMatches=r.jargonMatches.map(j=>({...j,jargon:j.domain+' : qualification et pièces requises ; consulter le référentiel.',accounts:'Voir les comptes et affectations dans l’onglet Référentiel.'}));return r;};

const api={AUDIT_VERSION,OFFICIAL_CATALOG,TOTAL_LINES,validDate,classifyAccount,money,positive,rate,diagnose,tax,cnps,payroll,cost,compareRoutes,budgetVariance,entry,balance,parseBrief,validateImport,parsePurchase,purchase,smartOperation,askExpert,getAccountScenarios,generateProceduralScenario,taxBridge,SECTORS_MATRIX,CAMEROON_CITIES,JARGON_DICTIONARY,inventory,statement,detailedStatement,explainAccount,SYSCOHADA_ACCOUNTS,BILAN_ACTIF_LINES,BILAN_PASSIF_LINES,RESULTAT_LINES,IGS,IGS_CLASSES_DETAIL,SYSCOHADA_CONFUSIONS,validateNiu,buildHarmonyStatus};
root.Fiscal=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
