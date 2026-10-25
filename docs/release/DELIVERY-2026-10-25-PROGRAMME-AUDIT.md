# Livraison de l’audit 28 lots / 92 propositions

## Audit finalisé et livraison v41 vérifiée — 25 octobre 2026

Production **1.5.2.41-programme-audit**, source `6d3264bd7f345d808fb8cbfcc618d99c274d3891`, arbre `b2fc714baf776d0de9e36d542d1dd654e8aa5eea`, Worker `b426cd0c-af79-4d7b-9dfc-aed6333ad457`. Livraison et qualification indépendante du même SHA : [40235349803 SUCCESS](https://github.com/Serge-As/urae/actions/runs/40235349803) ; [40235349738 SUCCESS](https://github.com/Serge-As/urae/actions/runs/40235349738). **1061/1061 natifs, 82/82 Chromium et 20/20 WebKit**, zéro échec et zéro ignoré. Santé, catalogue de **164 capacités** et 76 empreintes publiques vérifiés lors de la livraison ; **13 fichiers publics relus indépendamment**, dont le correctif `data-quality-ui.js`, CSS et PWA. Pas d’écriture de recette en production.

Les **28 lots, 48 propositions fonctionnelles A/I et 44 références T/M** sont rapprochés des documents d’origine. Les **92 identifiants et critères restent intacts**. Matrice détaillée : `docs/implementation/PROGRAMME_AUDIT_2026-10-25.md` et `.json`. Trois outils sont réellement réutilisés/intégrés dans leur portée (Playwright, PDF.js, Tesseract.js) ; les **41 autres références** restent facultatives et non importées. Aucune ambition stratégique ou promesse de revenu n’est déclarée acquise par ce bilan.

Défauts fermés : référence de preuve inexistante acceptée par le garde ; statuts d’outils/limites historiques contradictoires ; clic de reprise perdu lors d’un déplacement WebKit de **297 px** entre appui et relâchement, puis défilement/focus mobile sous l’en-tête. Test négatif conservé, placement des commandes stabilisé et défilement limité aux paramètres. **Trois régressions natives nouvelles** et **un scénario navigateur permanent dans chaque moteur**, assertions financières conservées. Vérifications locales complémentaires : 21 natifs ciblés et 11 WebKit, dont OCR réel FR/EN, tous réussis. Les échecs initiaux restent dans les artefacts locaux ; aucune relance aveugle du SHA final en CI.

BIR+ avant mutation du Worker : export D1 en lecture seule, restauration sur copie vierge, **50 tables / 48 attendues**, intégrité et clés étrangères valides. Archive privée R2 relue SHA256 `d4425a25da7b48cb8d87a8ce2bb8444962351432d25ef1da01d9b84105ecbfb6`. Portée **D1_AND_EXACT_SOURCE_ONLY** ; pièces R2, données/outbox d’appareil et prestataires exclus. Source exacte récupérable : `Eco-System_1.5.2.41_Source_Verifiee_6d3264bd_2026-10-25.zip`, **962 fichiers Git vérifiés**, SHA256 `db43508bd416a5aa9b862b089350e9e41d30716015858ba55ce984cb121435b4`. Aucune restauration de production ni migration.

Invariants conservés : dix étapes, rubriques et deux feuilles, Ledger/D1 canonique, politiques de prêt, Living Rules, droits, historique, Live et outbox. Aucun reset, force-push, fusion de main, nouveau fournisseur ou redémarrage. `realMoneyEnabled=false`, **`FIELD_ACCEPTED=NOT_ACCEPTED`** : l’acceptation sur vrais groupes, comptes et appareils reste distincte. URAE reste public conformément au choix déjà confirmé du fondateur ; aucune visibilité modifiée.

**ÉTAT DU PROJET APRÈS ÉTAPE** : programme audité, correctifs prouvés, qualifiés et publiés dans leur portée explicite. Aucun reliquat de code identifié dans ce programme borné ; tests terrain et résultats/contrats externes restent à valider. Réutiliser ces preuves du même SHA. Consommation exacte de crédits non mesurable.


## Vérification et transparence

Le runtime qualifié et publié reste `6d3264bd7f345d808fb8cbfcc618d99c274d3891`. Le commit documentaire de clôture qui suit ne modifie ni Worker, ni PWA, ni schéma. Les reçus de qualification, santé/empreintes et sauvegarde/source sont dans `docs/release/evidence/PROGRAMME-AUDIT-*2026-10-25.json`. Les journaux, traces négatives et détails locaux sont conservés hors Git dans `artifacts/audit-28-lots-20261025/`.

Le test déterministe de chargement tardif échouait avant le correctif. La première correction de placement a passé deux tests puis exposé l’interception mobile par l’en-tête ; le raccord de défilement a ensuite fait passer 11 contrôles WebKit locaux. La qualification finale complète porte sur le SHA exact ci-dessus, sans changer les critères ni masquer les échecs initiaux.

## Retour applicatif préparé

1. Conserver la nouvelle source, son SHA, ses reçus BIR+ et l’archive vérifiée ; protéger toute outbox d’appareil avant intervention locale.
2. Sur un **nouveau commit descendant** de la branche de livraison, remettre le placement antérieur de `apps/web/src/data-quality-ui.js` et retirer uniquement le raccord CSS des paramètres si ce correctif provoque un incident nouveau. La source antérieure de référence est `67095d43701c3fcfb51461f8b5e7ac0ca3d4e71f` ; son archive déjà vérifiée est conservée. Ne pas réinitialiser la branche ou forcer l’ancien SHA.
3. Mettre à jour ensemble les identités de version/build/cache et leur prédécesseur, le contrat et le marqueur. Repasser la qualification et le BIR+ du workflow existant, puis vérifier le nouveau SHA de santé et les empreintes publiques. Une restauration D1 n’est ni nécessaire ni autorisée par un incident de présentation.
4. Garder les trois régressions de preuve et les critères d’origine ; ne retirer un test de clic qu’en motivant la nouvelle solution et sa protection permanente. Aucune opération de rollback n’a été exécutée pendant cette livraison.

## Validation restant distincte

Recette réelle multi-gestionnaires, téléphones physiques Android/iOS, plusieurs séances et comptes autorisés : non acceptée par cette CI. Le programme ne prouve ni des revenus, ni des contrats/paiements, ni une prise en charge universelle des prestataires ou incidents réels. Les 41 références d’outils/modèles non importées ne sont pas des installations bloquantes. Le registre conserve leurs critères et leur portée.
