# Recall — lot 05, répétition de séance

Le fondateur a demandé l'enchaînement des lots achevés selon le classement : L05, L28, L02, L23, L10, L24, L25. L01 est clos et publié en 1.5.2.21 ; source 5c936644, livraison 39406749561 et qualification 39406749566 réussies. Mémoire documentaire suivante dc5ad743. Checkout courant `implementation-lot01-20261020`, branche locale `codex/lot-05-session-rehearsal-20261020`. Le Git local d'import n'est pas un historique distant à pousser.

L05 conserve les propriétaires financiers existants. Acquis à requalifier : couverture des 20/40/100 rubriques, totaux généraux constants, présence et Live, concurrence et exactitude, synthèse avant toute saisie du membre suivant, hors ligne/F5 et idempotence. Enrichissement I02 : exercice local et fictif, sans injection de l'application, sans persistance ni requête métier ; plan de partitions et somme d'affichage réemployés. CIR : `docs/change-impact/CIR-2026-10-20-LOT05-SESSION-REHEARSAL.md`.

Ne pas contourner la session Delor protégée ; utiliser les comptes synthétiques locaux. Ne pas toucher prêts, Ledger, D1/R2, clé de signature, argent réel ou transport. Une qualification isolée ne vaut pas déploiement. Déclarer L05 terminé après qualification complète et vérification des ressources publiques du SHA publié. Ensuite commencer L28. Crédit exact non mesurable ; FIELD_ACCEPTED=NOT_ACCEPTED.


## Lot 05 terminé, publié et vérifié — 20 octobre 2026

Production **1.5.2.22-session-rehearsal**, source `61c939d6c6fe68b23ca2c015fdc269460469e591`, build `eco-system-1.5.2.22-20261020-session-rehearsal`, cache `eco-system-v15222-session-rehearsal-20261020`, Worker `34249960-2dcb-49f7-b200-fa56752d2e23`. Livraison [39411571048 SUCCESS](https://github.com/Serge-As/urae/actions/runs/39411571048), qualification indépendante [39411571191 SUCCESS](https://github.com/Serge-As/urae/actions/runs/39411571191). Même source : **751 tests natifs, 22 Chromium, 6 WebKit** réussis dans la livraison. Reçu public : `docs/release/evidence/LOT05-SESSION-REHEARSAL-PUBLIC-2026-10-20.json` ; douze empreintes, catalogue 164, vérification à 11:05:40.022Z. Santé HTTPS relue indépendamment à 11:06:47.786Z : source/build/cache exacts et realMoneyEnabled=false.

L'exercice local de séance est disponible depuis la barre de la feuille ; il conserve les données et brouillons réels et ne produit aucun POST financier. Les moteurs acquis sont requalifiés, sans réécriture. Sauvegarde D1 exportée en lecture seule puis restaurée avec intégrité SQLite ok ; archive privée R2 relue et SHA-256 `d9ded1006ae4ccebf1200594bc5ac3c16ee71c1de68705644462ad0117847293` vérifié. D1/R2 et clé de signature conservés, aucune migration ni nouvelle dépendance. FIELD_ACCEPTED=NOT_ACCEPTED : les recettes synthétiques ne prétendent pas être une acceptation terrain Delor.

Incident de qualification conservé : a8040ae avait passé 751 natifs et 22 Chromium, mais la dernière inscription WebKit atteignait la limite de comptes de la base de test partagée. Publication bloquée. Correction du dispositif seulement : serveur et SQLite WebKit séparés ; toutes les portes repassées sur 61c939d. Les essais Windows complémentaires du build ont passé les deux nouveaux exercices et le mode/navigation petits écrans, mais trois scénarios antérieurs ont rencontré des délais d'initialisation/rechargement ; les 22 scénarios Linux de la livraison exacte passent. Aucune assertion supprimée ou seuil de sécurité relâché.

Suite par priorité : **L28 en préparation locale**, puis L02, L23, L10, L24, L25. Ne pas recommencer l'audit général. La protection ECO-LOCK de tous les comptes GitHub n'est pas déclarée activée. Coût exact des crédits non mesurable.

