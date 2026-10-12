# ECO-SYSTEM — LOT UNIQUE DE REFONTE UX ET MÉDIAS (PR #82)
Date : 11 octobre 2026 · Branche : feat/visual-refonte-smartgrid-media-20261011.
**Statut de livraison : DRAFT/HOLD — pas une version production.** Ne pas confondre l'existence d'un contrôle visuel avec son fonctionnement bout en bout.

## Hiérarchie de vérité
Code et capacités réelles > Visions stratégiques 8/9 octobre > Blueprint exécutable 5.0.0 > Cahier en complément > ancien chat originel.
Respecter Association/Tontine First ; conserver rôles, 10 étapes de création, séance, deux feuilles financières canoniques, Récap, Confrontation, historique, réserves, Offline/Outbox, Ledger et validations. Aucun second owner.

## Modifications effectives (fichiers)
- `apps/web/src/smart-grid-view.js`, `apps/web/src/main.js`, `apps/web/styles.css` : découpage 1/2/5 parties à totaux mondiaux inchangés, styles verts responsive, navigation contextualisée, Eco NOW/Harvest presets, autres raccourcis.
- `packages/visual-media/src/index.ts`, `workers/api/src/index.ts`, `packages/application/src/index.ts` : bibliothèque R2 privée de visuels PNG/JPEG/WebP et slots personnels/de groupes/marchandises, règles de groupe, isolation par tenant, contenu lu avec les vrais en-têtes authentifiés.
- `apps/web/src/visual-media-studio.js`, `apps/web/src/visual-media-presenter.js` : gestion média par profil/groupe/accueil/forum/marché, photos effectivement chargées et remplaçables.
- `apps/web/src/community-shop-ui.js` : photos de produits du stock canonique, sans toucher quantité/réservation/prix ni publier le stock POT_RESERVED.
- `packages/ad-manager/src/index.ts`, `apps/web/src/ad-manager-ui.js`, `apps/web/index.html` : création de campagne sandbox avec média gouverné et prévisualisation, catalogues et campagne active.
- `packages/ad-manager/src/partner-proposals.ts`, `apps/web/src/partner-ad-ui.js` : proposition d'annonce par membre/partenaire enregistré, justificatif média propre, examen par autre gestionnaire, import DRAFT AdManager sans facture, activation ou publication implicite.
- `apps/web/src/ad-surfaces-ui.js` : projections d'annonces actuellement actives/House Ads sur Accueil, Forum et Marketplace, sans données de ciblage et jamais dans la feuille financière.
- `apps/web/src/runtime-i18n.ts` : nouvelles traductions explicites FR/EN ; préserver le dictionnaire runtime et les modules bilingues existants.
- `.github/workflows/eco-visual-refonte-qualification.yml` : qualification non déployante avec TypeScript, CI constitution, tests Node, Playwright Chromium/WebKit.
- Tests : `smart-grid-visual-nonregression`, `visual-media-governance`, `visual-ui-contract`, `eco-visual-module-navigation`, `partner-ad-submission`, `governed-ad-surfaces`, `browser/eco-visual-partner-and-ads-20261011.spec.mjs`.

## Table des acteurs
| Acteur | Peut créer | Peut lire | Peut activer |
|---|---|---|---|
| Membre de groupe | Portrait personnel, proposition d'annonce et sa photo, micro annonces existantes | Ses propres propositions, annonces visibles actives, médias autorisés | Ni campagne AdManager ni rôle gestionnaire |
| Gestionnaire habilité | Visuels de groupe, stock, AdManager ; importe une proposition d'un autre acteur | Propositions du groupe, campagnes et médias autorisés | Seulement via transitions de campagne existantes |
| Annonceur externe sans lien au groupe | Non, sauf parcours d'inscription/adhésion existant | Rien de privé | Jamais |
| Fondateur plateforme | Control Center déjà en place, mais **bibliothèque globale des images de marque pas encore livrée** | Selon permissions Control Center | Aucune élévation fondée sur un bouton d'interface |

## Points non réalisés et devant rester explicitement ouverts
1. Banque de visuels de marque *globale* gérée par Founder Control, distincte des visuels par groupe.
2. Publication consentie des photos de profil d'autres membres hors de leur espace personnel, dont preuve de consentement et modération des avatars de tiers.
3. Pièces jointes et albums photo **par publication** dans le moteur Forum canonique ; bannière Forum déjà disponible, mais pas équivalente à la pièce jointe.
4. Cockpit annonceur totalement externe / hors appartenance à un groupe, contractualisation/paiement et attribution réels ; l'API ne crée que des budgets sandbox.
5. Présentation de toutes les créations sur tous les placements du catalogue (actuellement Accueil, Forum et Market) ; suivi d'impressions, engagements antifraude, fréquence et preuves de paiement non intégrés à ce lot.
6. Inventaire exhaustif et optimisation ergonomique de chaque module parmi les 155+ capacités ; la navigation met à disposition Eco NOW, Deals, Business, Kits, Foras, Harvest, Academy, Creator mais ce raccourci ne constitue pas un test opérationnel profond.
7. Recette terrain Android ancien, Cloudflare R2 réel, upload malveillant, menaces multisession, performance réelle et « aucun bug » : aucune garantie possible par des tests CI seuls.

## Preuves et restrictions de livraison
La qualification GitHub : `eco-visual-refonte-qualification.yml`, sur le SHA exact qui a exécuté les tests ; ne compter que les jobs terminés SUCCESS. Après corrections, lire leurs logs : nombre Node PASS, cas Chromium et WebKit. Une réussite de test simulé ne prouve ni l'intégration R2 terrain ni la facturation.
Ne pas fusionner sur release sans levée HOLD de la candidate existante, sauvegarde BIR+ et gouvernance. Ne pas déployer, migrer D1/R2 en production, activer realMoneyEnabled, exposer des données de membres ou publier du code propriétaire vers UTRAE.
