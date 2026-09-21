# ECO-SYSTEM — MEGA LOT 1+2+3+4+7+8+9+13 — CURRENT TRUTH

Date: 2026-09-21  
Branche candidate: `next/1.4.4-offline-ios-safe-20260921`  
Base protégée: `next/1.4.3-blueprint-5-0-0-finalization-20260921`  
PR: #11  
Production: inchangée  
Argent réel: OFF

## Règle
Ce lot est additif. Il ne réécrit pas le produit, ne remplace pas le Ledger canonique et ne porte pas Eco Relay/Eco Local/Marketplace expansion. Les mutations offline sont rejouées dans les services métier canoniques via `/api/v1/outbox/apply`.

## Lot 1 — Offline-first + iOS
- Tous les GET API peuvent utiliser les snapshots actor-scoped IndexedDB.
- Le shell PWA et le catalogue ont un fallback offline.
- iPhone/iPad: métadonnées Home Screen, mode standalone, guide d'installation Safari, persistance stockage opportuniste.
- Groupes: simulation et création locale avec identifiants déterministes.
- Membres: ajout local.
- Rubriques: création, activité, modèle opérationnel et politiques en local.
- Séances: création, contexte, présence, bénéficiaire, preuve sans upload binaire, clôture en local.
- Caisse: rapprochement local.
- Cotisation cash: Outbox durable + projection locale PENDING.
- Synchronisation: 5 essais automatiques maximum; récupération manuelle explicite.
- Limite volontaire: une pièce PHOTO/PDF nouvelle ne peut pas être téléversée vers R2 sans réseau; la saisie textuelle/confirmation peut rester locale. Le fichier n'est jamais prétendu envoyé avant le réseau.
- Limite d'identité: un appareil doit avoir déjà ouvert une session au moins une fois pour réutiliser la session snapshot hors ligne. La création d'un premier compte entièrement hors ligne n'est pas présentée comme terminée.

## Lot 2 — Séances + feuille récapitulative
- Onglet `Feuille récapitulative` immédiatement après `Feuille de séance`.
- Projection membre × rubrique depuis le Ledger canonique.
- Cumuls d'exercice/cycle + séances intégrées.
- Aucun second moteur financier.

## Lot 3 — Navigation
Retour app/navigateur mémorise:
- vue,
- position verticale,
- onglet Séances,
- séance sélectionnée,
- détails ouverts,
- focus.
Les secrets/PIN/mots de passe ne sont pas sérialisés.

## Lot 4 — Multi-gestionnaires
- propositions indépendantes par cellule,
- couleur stable par acteur,
- divergence,
- vote,
- unanimité/majorité,
- réserve dissidente non bloquante,
- stockage `MEETING.LIVE_CONSENSUS`,
- aucune écriture monétaire directe depuis le moteur de consensus.

## Lot 7 — Contrôle membre
Préservé et relié au Live:
- Valider transaction,
- Émettre une réserve,
- revue responsable,
- approbation après revue ou maintien de réserve,
- événements `MEMBER_PROJECTION_UPDATED` et rafraîchissement local.

## Lot 8 — Finance/Tontines/Prêts/Épargne/Secours
Les moteurs 1.4.3 sont conservés. Le lot verrouille leur coexistence avec l'offline, la feuille récapitulative et le consensus:
- Ledger canonique append-only,
- tontines multi-rubriques,
- prêts/remboursements,
- simulations sans intérêt sur intérêt,
- épargne et variantes d'allocation de rendement,
- RECAP financier,
- corrections par contrepassation/compensation.
Aucun moteur financier parallèle n'est ajouté.

## Lot 9 — RI/Documents/Assistance
Préservé:
- documents multiples,
- image/PDF/DOCX/ODT et signalement du Word legacy,
- empreintes de sources,
- analyse assistée sans activation financière automatique,
- Living Rules et Assistance Rulebook.
Le téléversement binaire reste intrinsèquement online tant que le fichier n'a pas été stocké localement dans un futur coffre de blobs.

## Lot 13 — Hardening
- plafond d'essais Outbox,
- bouton de reprise volontaire,
- tests multi-lots,
- cache PWA versionné,
- production non modifiée,
- aucun argent réel.
Avant production: CI verte + recette terrain iPhone/iPad + Android ancien/récent + scénario plusieurs jours offline/reconnexion + BIR+.

## Critères NO-GO
Ne pas promouvoir si:
1. une saisie cash peut être postée deux fois;
2. une erreur d'un module optionnel bloque Group Core;
3. le retour perd la séance active;
4. le consensus écrit directement dans le Ledger;
5. la feuille récapitulative maintient sa propre comptabilité;
6. iOS ne peut pas relancer l'app installée offline après une première utilisation online;
7. la file locale est perdue après fermeture/rechargement;
8. une pièce est affichée comme téléversée alors qu'elle ne l'est pas.

## Prochaine reprise
1. Lire ce fichier.
2. Vérifier HEAD PR #11 et CI.
3. Corriger uniquement les erreurs du mega-lot.
4. Lancer la qualification complète.
5. Ne pas déployer en production sans validation explicite de la candidate terrain.
