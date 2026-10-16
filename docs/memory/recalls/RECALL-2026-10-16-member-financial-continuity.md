# Recall — continuité financière membre, 16 octobre 2026

Reprendre la branche `codex/member-financial-continuity-20261016`, PR96. Base distante4512bdeb ; production attestée encore1.5.2.18/70e376d tant qu'une livraison19 et une lecture publique ne prouvent pas sa publication. CIR associé : `docs/change-impact/CIR-2026-10-16-member-financial-continuity.md`.

Le fondateur confirme saisie/Visuel compact, puis exige une synthèse du membre précédent **dès le clic sur une cellule d'un autre membre, avant toute nouvelle saisie**. Le dialogue s'ouvre synchroniquement et attend les validations locales en cours avant d'afficher les montants. Annuler conserve le passage ; confirmer persiste sa clôture avant de laisser entrer chez le suivant. Les validations ne dépendent pas de la clôture pour devenir durables.

Réutilisation : FinancialWork UI/Application/outbox pour passages ; MeetingLiveConsensus pour décision exacte/versionnée et MemberEnvelope pour projection ; Completion/Ledger/Receivables pour remboursement et dettes dues ; Rubrics participation et TONTINE_SHARE pour parts. Aucun nouveau propriétaire de solde, aucune migration, aucune purge de saisie ni recréation de groupe. Les avances déjà encaissées ne créent pas de nouvel encaissement lorsqu'elles couvrent une séance.

Premier checkpointc509 : erreur TypeScript de spread corrigée. Secondb430 : type de projection Rubrics à discriminer, corrigé. Troisième329364 : compilation et 13/17 Chromium passent, dont les deux nouveaux scénarios de changement de membre et de revue persistante ; quatre écarts restent à traiter : remboursement offline, GET de snapshot après événement Live, confrontation masquée par la revue, ancien scénario de fermeture d'alerte devenu incompatible avec la revue obligatoire. Gate mémoire demande ce Recall. Aucun échec ne vaut qualification ni autorisation de passer outre les contrôles.

Reste : qualification native et navigateurs complète, version cohérente, sauvegarde D1 en lecture seule restaurée et R2 relu/hashé, publication par workflow existant puis lecture publique indépendante. Ne pas contourner le navigateur de recette bloqué ; ne pas prétendre avoir retrouvé le groupe rotatif du compte Delor sans lecture autorisée réelle. FIELD_ACCEPTED reste NOT_ACCEPTED.
# Checkpoint9cb8377 — suite native entièrement verte

738/738 tests natifs passent ;16/17 Chromium. Le remboursement2500 synchronise en moins de5secondes, conserve le cumul4000, le rejeu et le contexte au rechargement ; la vue de prêts en deux parties est exercée. L'échec restant découvre le répertoire personnel bloqué par `authenticatedApi`, qui prend `mine` pour un identifiant de groupe. La route est corrigée avant le routeur dynamique en réutilisant les droits `allowedGroups`, avec tests d'authentification, tiers/usurpation et adhésion intertenant. La fixture de prêt antérieur conserve le champ obligatoire `ledgerEntryId`. Qualification complète de ce dernier correctif encore à passer ; production19 non attestée.

