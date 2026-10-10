# CIR — financial field completion

## Finalisation financière du 10 octobre 2026

Production observée directement : 1.5.2.14-live-sync, commit d027f09a1382cd29054b33e274f3fd3bf9f8d9f3. Le source 1.5.2.15 reste en qualification; aucune livraison revendiquée avant preuve du workflow et /health.

Deux causes corrigées : cookie HttpOnly partagé entre fenêtres de comptes distincts, et restauration Outbox limitée au tenant personnel avant sélection du groupe. Les cookies serveur, instantanés de session et groupe actif sont désormais scopiés par fenêtre; les intentions des groupes rejoints restent restaurées pour leur auteur. Les brouillons non validés sont privés à la fenêtre; les montants validés restent persistés avant réseau et l'état UI passe à CONFIRMED après ACK.

La navigation F5 enregistre sa dernière position dans history.state; le défilement du menu mobile reste horizontal. Les tableaux de dettes dédupliquent les révisions et omettent les sous-totaux redondants pour un prêt unique, sans fusionner des prêts légitimes. Les dépôts sont regroupés par membre, rubrique et sous-total, avec couleurs conservées.

Réserves Prêt/Remboursement/sorties : lecture du total engagé dans FINANCE.SHEET_EVENT et le propriétaire Expense, vérification montant/version puis revue MEETING.CELL_REVIEW; aucun reversement ni changement de dette. L'accord d'un gestionnaire ferme sa propre réserve uniquement; la réserve d'un autre reste ouverte. Les contrôles Vu, accord, contestation restent distincts.

Accès Chrome : la production répond HTTP200 dans un profil Chromium vierge, sans échec réseau ni erreur JavaScript observée. Une exception CacheStorage de navigation pouvait rejeter respondWith et produire ERR_FAILED; le nouveau worker revient au réseau sans supprimer les intentions financières. Le message du navigateur du fondateur reste à vérifier après actualisation de ce worker.

Preuves locales du lot : tsc/build PASS et 16/16 regressions ciblées PASS, zéro skip; scénario de deux comptes hors connexion/F5/Outbox PASS. Le scénario Live + position F5 reste en qualification complète (un premier lancement s'est arrêté pendant goto/load avant assertion métier). La limite de convergence cinq secondes reste intacte.

Excel original privé vérifié par SHA256 028d8d2d894616dc559c8de9c2350248a50482e8cad3eb5c5c407df6ceb60be8 : 27 membres, 12 séances, 58 dépôts positifs, 648 cellules +54 totaux comparés à des fractions indépendantes; enveloppes exactes 495950 classique, 70850 scolaire, 141700 Bureau. Les 20 tests d'épargne ciblés ont réellement passé. Rapport et noms individuels restent dans les outputs privés du chat, aucune publication Utrae.

GitHub a changé de propriétaire : Urae privé appartient à Serge-As (compte créé le 10 octobre), Utrae est public. L'accès natif Git authentifié Serge-As et les noms des deux secrets Cloudflare ont été vérifiés; leurs valeurs ne sont pas exportées. Aucun moyen de paiement ni budget payant modifié. Utiliser les minutes incluses du nouveau propriétaire pour une qualification privée bornée; aucun code privé ni fixture confidentielle en CI publique.

État : 668 tests Node et 10 Chromium +6 WebKit exigés sur le même SHA propre; mémoire, archive+SHA256, monotonie production et smoke obligatoire avant livraison. FIELD_ACCEPTED=NOT_ACCEPTED, realMoneyEnabled=false. WSL Debian n'a pas démarré (HCS_E_HYPERV_NOT_INSTALLED); aucune dépendance à Ubuntu pour poursuivre.

