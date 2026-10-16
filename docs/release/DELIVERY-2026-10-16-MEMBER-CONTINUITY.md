# BIR+ — Continuité financière membre, livraison du 16 octobre 2026

**DÉPLOYÉ ET VÉRIFIÉ** : 1.5.2.19-member-continuity, source `5e7044ee2a8c346c0a36f905d74d41a2a2dfab0d`, Worker `0c0c2631-1151-4e1d-bbcd-1b6935d1acbf`. [Livraison 38921072914 SUCCESS](https://github.com/Serge-As/urae/actions/runs/38921072914) et [qualification indépendante 38921072892 SUCCESS](https://github.com/Serge-As/urae/actions/runs/38921072892) sur le même SHA. La [PR96](https://github.com/Serge-As/urae/pull/96) est fusionnée dans la branche de livraison active. La production 18 reste l'historique précédent, pas la version courante.

## Changements demandés et résultat

| Demande | Comportement livré et preuve |
| --- | --- |
| Synthèse dès le clic sur le membre suivant | Capture du clic sur toute cellule éditable, dialogue ouvert immédiatement avant toute attente réseau ; saisie suivante bloquée jusqu'à la décision. Même règle au clavier. Scénario navigateur : tentative 999 bloquée avant dialogue, retour sans mutation, continuation 750 avec une seule écriture conservée après rechargement. |
| Ne plus perdre la première saisie suivante | Le passage attend les validations en cours et la décision avant de libérer la cellule suivante. Les montants validés sont persistés dans l'outbox avant confirmation ; ils ne dépendent pas de la clôture du passage. |
| Revue persistante de l'autre gestionnaire | Version, montant et auteur exacts ; avis retrouvé après rechargement et Actualiser, retiré après accord applicable, rouvert pour une nouvelle version. Les réserves restent signalées. La confrontation critique conserve la priorité. |
| Remboursement cohérent et dette exacte | Même moteur canonique Completion/Ledger/Receivables et propriétaire outbox. Plafond = capital restant + intérêts dus + obligations légitimes exigibles, sans intérêts futurs. Surplus et paiement après solde refusés ; intention durable et rejeu stable. |
| Cotisations, parts et avances | Participation par tontine, deux parts × 100 = 200 par séance. Séance 7 : attendu 1 400 ; 800 payés donnent 400 d'arriérés + 200 courants. Paiements partiels expliqués et avances explicitement déclarées ; leur couverture future ne crée pas de nouvel encaissement. |
| Tontine facultative / groupe rotatif pur | Nonparticipant refusé pour une tontine associative facultative. Participation par défaut pour le groupe rotatif pur, avec respect des déclarations explicites et parts canoniques. |
| Accès personnel et lisibilité | Mes tontines rotatives conditionnel, fondé sur les groupes autorisés du compte. Route /groups/mine corrigée avant /groups/:id : propriétaire et membres admis retrouvent leur répertoire, un tiers ne voit pas les groupes d'autrui. Portefeuille en deux vues complètes, identité conservée, colonnes élargies et actions inchangées. |

FinancialWork UI orchestre le passage, Application/outbox sa durabilité, MeetingLiveConsensus la décision et MemberEnvelope sa projection. Completion/Ledger restent propriétaires du prêt et du cash ; Receivables des obligations et allocations ; Rubrics/TONTINE_SHARE de la participation et des parts. Aucun second moteur financier ni nouvelle autorité de solde.

## Qualification du SHA publié

- Typage, compilation du Worker/PWA et contrôles d'architecture, gouvernance, constitution, vérité, mémoire et couverture : PASS.
- Suite native : **738 réussis,0 échec**, puis chaque fichier rejoué isolément par le workflow de livraison.
- Chromium : **17/17**, incluant synthèse avant saisie, revue persistante, saisie/synchronisation, confrontation, remboursement, navigation personnelle et géométrie du portefeuille.
- WebKit : **6/6**, incluant les scénarios souverains/offline existants.
- Préfusion76689dc : deux chaînes réussies,38918515304 et38918515190. Livraison et qualification indépendante repassent sur `5e7044ee2a8c346c0a36f905d74d41a2a2dfab0d`.
- Les dix étapes de création, multi-tontines, participants distincts, Collation, Living Rules, Ledger, RECAP, fonds reconduits et autres acquis sont conservés ; les tests ne constituent pas une recette exhaustive de chaque scénario réel.

Échecs intermédiaires conservés :3293643 compile mais13/17 Chromium ;4c88506 natif734/738 et 16/17 Chromium ;c231ec5 natif737/738 et 16/17 Chromium ;9cb8377 natif738/738 et 16/17 Chromium. Corrections : attente du dialogue, priorité de confrontation, absence de lecture Live supplémentaire, taux annuel optionnel, assertions structurelles adaptées à la délégation canonique, fixture de prêt antérieur avec ledgerEntryId obligatoire et répertoire personnel authentifié. Aucun délai financier n'est allongé ni scénario retiré pour masquer ces défauts.

## Livraison et sauvegarde réelles

Build `eco-system-1.5.2.19-20261016-member-continuity`, cache `eco-system-v15219-member-continuity-20261016`. Après publication, health et catalogue confirment version/source/build/cache,164 capacités et realMoneyEnabled=false. À15:12:52.788 UTC (16:12:52.788 Douala), **dix ressources publiques** sont comparées par SHA-256 aux fichiers construits : /, styles.css, sw.js, eco-shell-manifest.json, main.js, financial-work-ui.js, completion-ui.js, ui-modes.js, field-hardening.js, runtime-i18n.js. Leur reçu est conservé dans [MEMBER-CONTINUITY-PUBLIC-2026-10-16.json](evidence/MEMBER-CONTINUITY-PUBLIC-2026-10-16.json).

L'export D1 a été restauré avec intégrité ok et l'archive privée R2 relue/hashée avant publication : `83cad4bc46f0d2f5512a765ce2a3677cc48655d1258653fc357a0d0fef796325`. Le reçu public ne contient pas la base exportée. D1/R2 existants conservés, aucune migration ou réécriture de données existantes, aucune purge d'outbox, clé financière préservée. L'ascendance de la production 18/70e376d vers le SHA livré est contrôlée avant déploiement.

## Limites attestées

Les scénarios navigateur utilisent des comptes synthétiques sur serveur isolé. Le navigateur protégé du compte Delor n'a pas été contourné : aucune recette de son compte, ni récupération vérifiée de son groupe de test. Les lectures publiques sont celles du workflow GitHub Actions ; les lectures locales directes n'étaient pas disponibles. Une qualification automatique ne garantit pas l'absence absolue de défaut, tous les cas d'interruption entre propriétaires canoniques, ni tous les historiques de cycles de tontine.

Le cockpit, les modes distincts et Eco IA existants sont conservés. Cette livraison n'atteste pas l'achèvement intégral des documents stratégiques ou une mémoire Eco IA intégrale entre appareils. **FIELD_ACCEPTED=NOT_ACCEPTED** et argent réel désactivé. Coût exact de crédits non disponible ; les quotas partagés ne mesurent pas le coût de ce chat.

## ÉTAT DU PROJET APRÈS ÉTAPE

**1.5.2.19 livrée et vérifiée publiquement ; qualification automatique réussie ; recette terrain non attestée.** Mémoire de reprise, registre et preuves mis à jour. Repartir de ce SHA, préserver les saisies et groupes existants. Un écart réel supplémentaire doit être reproduit chez son propriétaire canonique ; ne pas recommencer silencieusement la refonte.
