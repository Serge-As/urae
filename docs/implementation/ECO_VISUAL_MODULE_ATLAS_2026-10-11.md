# Eco-System — Atlas des modules préservés par la refonte (11 octobre 2026)
Statut : **SOURCE-GROUNDED / NO-CI-PASS / NOT DEPLOYED**. Owner canonique = moteur actuel ; l'interface est une projection et non une nouvelle autorité.

## Hiérarchie normative
1. Code et capacités de l'app ; 2. visions stratégiques les plus récentes ; 3. Blueprint exécutable 5.0.0 ; 4. cahier précédent ; 5. chat originel comme complément. Raccourcis = navigation seulement, jamais duplication du métier.

## Atlas non exhaustif, d'après les moteurs réels
| Domaine / famille | Point d'entrée réel préservé | Interdits / vérifications |
|---|---|---|
| Association/Tontine, GroupHome | `#groupHomePanel`, `#view-operations`, `#view-sessions` | Ne pas modifier parcours de création, tenue de séance, prêts, participants ni rubriques |
| Finance, Confrontation, Réserves, Recap | `#view-finance`, `#view-recap`, `#meetingMatrix`, `#individualSheetMatrix` | Ledger, rapprochement, validations, synchro, cashbox, historique et totaux intacts |
| Eco NOW | `#valueNetworkOperational`, préréglage `eco:value-network-preset` = NOW | Le preset ne confirme ni stock, ni demande, ni paiement |
| Eco Harvest & Local | Même owner Value Network, preset HARVEST | Pré-récolte ≠ stock réel |
| Eco Deal | `#socialCommercePanel` → `#socialDealTitle`, moteur `MARKETPLACE.ECO_DEALS` | Prix effectifs, paliers, quantité confirmée et validation humaine préservés |
| Flash/Rescue/Liquidation | `#socialFlashForm`, module `MARKETPLACE.FLASH_OFFERS` | Ne pas déguiser une liquidation non prouvée |
| Eco Business | `#businessStudioOperational`, `MANAGER.BUSINESS_STUDIO` | Ledger collectif et activité privée restent séparés, mandats gouvernés |
| Business Agent | Studio existant `#businessStudioOperational` | Recommandations bornées, pas d'action autonome |
| Kit de groupe | `#savedStarterKitPanel` dans le parcours Launch | Reprendre le vrai Kit archivé, pas en simuler un |
| Foras / Forums, communautés, Hubs | `#communityEnginePanel`, `#interestCommunityPanel`, `COMMUNITY.FORUM`, `COMMUNITY.PRO_HUBS` | Aucune deuxième base de messages, droits et modération existants conservés |
| Academy, Knowledge | `#academyOperational`, `#knowledgeOperational` | Certifications ≠ droits financiers |
| Creator/Talent | `#creatorTalentCenter` | Contenu et produits reliés aux owners canoniques |
| Market, achats groupés, fournisseurs | `#marketEnginePanel`, `#groupShopPanel`, stock `MARKETPLACE.CORE` | Stock et prix restent contrôlés par MarketService |
| AdManager, partenaires, micro annonces | `#adManagerPanel`, `#microAdsCenter`, `ADS.MANAGER` | Approbation, preuve de consentement et diffusion réelle à vérifier |
| Anticipation, Doctor, Demand, Trust & Finance Lab | `#blueprintExecutablePanel` et modules déjà instanciés | Ne pas convertir les projections en écritures financières |
| Discovery, accompagnement, Opportunity, programme externe | Vues Discovery et Ecosystem existantes | Éligibilité réelle, consentement, limites des droits |

## Travaux UX du présent lot
- Un ruban de navigation direct affiche Eco NOW, Eco Deals, Eco Business, Foras, Kits, Eco Harvest, Academy, Creator, sans effacer les entrées préexistantes.
- Le routeur existant révèle désormais les parents `<details>` de l'ancre avant son défilement.
- NOW et HARVEST délèguent la sélection d'offre à `eco:value-network-preset` (moteur canonique), sans commande parallèle.
- Traductions FR/EN enregistrées dans le dictionnaire runtime.
- Test `tests/eco-visual-module-navigation-2026-10-11.test.mjs` enregistré, mais pas encore exécuté au HEAD.

## Règle de non-régression
Le fait qu'un bouton ouvre une vue ne prouve pas que le parcours du module est terminé. Les étapes d'écriture, de modération, d'activation et de lecture doivent être qualifiées indépendamment, avec tests d'acteurs, de tenant, d'historique, de reconnexion, de rendement et de connexion aux autres modules. Aucun PASS nouveau sans résultat concret. Ne pas fusionner ni déployer avant les gates de la PR #82.