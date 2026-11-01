# Six lots issus de l’audit externe annoté — 1 novembre 2026

Autorisation : le fondateur demande l’implémentation des six lots proposés après lecture de son audit et de ses annotations rouges, sans suppression des capacités acquises. Les huit lots Canopée v43 et les 28 lots / 92 propositions restent la base. Source de départ : 62f3714afdb8f6df0cebf2d9dd96d2ba5526c1c5 ; runtime antérieur qualifié : 76ef095649d0cf85a7d6e26c4927ae7cb9098652.

État de ce document : SOURCE_IMPLÉMENTÉE, QUALIFICATION_ET_LIVRAISON_EN_COURS. Une présence dans ce tableau n’est pas une preuve de déploiement. Le reçu final sera lié au SHA exact.

| Lot | Résultat concret | Propriétaires conservés | Preuves exigées |
| --- | --- | --- | --- |
| 1. Garde-fous sobres | Entrée obligatoire compacte, registre des règles avec propriétaire et raison, contrôle ciblé des preuves. Les maîtres restent normatifs et les anciens tests sont conservés. | AGENTS / constitutions / gates existants | Test négatif du registre ; tous les gates et tests natifs |
| 2. Contrôle personnel 48 h | Saisie personnelle enregistrée normalement ; contrôle indépendant en attente, en retard ou effectué. Délai depuis la réception serveur, sans remise à zéro par une correction. Responsable unique annoncé honnêtement ; obligation antérieure conservée si un collègue quitte. | MemberFinancialControl / Ledger / MeetingLiveConsensus / obligations | SQLite réel, auteurs/bénéficiaires distincts, versions obsolètes, réserve conservée, deux comptes navigateur |
| 3. Accueil à deux profondeurs | Priorités du groupe, toutes les critiques visibles, trois actions normales au maximum et compteur du reste ; cinq repères financiers séparés ; fiches et dettes détaillées repliables ; calendrier et tours de tontines prioritaires ; deux offres réellement publiées au maximum. | GroupHome / Inbox / Ledger / Récap / offres autorisées | Droits, changement de contexte, mobile, montants canoniques et anciennes suites Canopée |
| 4. Démarrage et traduction | Compatibilité Tontine et ordre des scripts inscrits dans les sources ; cœur statique regroupé par esbuild, UI différées conservées ; traduction des ajouts DOM limitée aux nouveaux nœuds, élagage des écrans retirés. | ConnectedApplication / contrôleurs UI / runtime-i18n / PWA | TypeScript, mesures avant/après, parents différés, dictionnaires, froid/F5/offline Chromium+WebKit |
| 5. Lectures D1 | Filtre module exécuté dans SQL, recherche ciblée d’une projection d’annuaire historique ; deux index de lecture partiels sur les seuls types concernés. | D1PlatformRepository | Équivalence des résultats et droits, EXPLAIN, intégrité sur copie restaurée, autorisation SQL stricte, sauvegarde R2 relue et schéma public contrôlé |
| 6. Séance et documents | Matrice de rubrique filtrable par dates/cotisants, totaux et Excel ; exports .xlsx des états autorisés ; extrait PNG partageable ; relecture vocale locale facultative, noms désactivés par défaut ; plan complet de clôture avec payable/payé/report et export. | DetailUI / PrintCenter / Exercise / deux feuilles | Fichier OOXML lisible, absence de formule exécutable, membre isolé, export offline, voix sans validation implicite, conservation générée des pools |

## Critères contractuels transversaux

1. Ledger/D1 possède les montants, les deux feuilles restent les surfaces normales de saisie ; une revue, un export ou une synthèse ne crée pas une seconde comptabilité.
2. La revue lie un auteur habilité distinct de l’auteur et du bénéficiaire à une version contrôlée. Une version nouvelle reste à contrôler. Les réserves des autres ne sont jamais levées par cette approbation.
3. Le délai de 48 h n’empêche ni l’enregistrement ni la poursuite de réunion. Une réception d’intention locale n’est pas un ACK serveur.
4. Un changement de compte/groupe ferme les informations vocales et empêche un export tardif dans l’autre contexte.
5. Les quantités en nature ne deviennent pas des francs CFA. Un mouvement déjà comptabilisé en XAF reste une valorisation monétaire, distincte des quantités physiques.
6. Le total de flux affichés ne devient ni solde de caisse, ni revenu personnel, ni dette.
7. Une copie PNG n’est pas infalsifiable et ne certifie pas un paiement. Les références canoniques restent dans Eco.
8. L’export Excel arrive avant un éventuel import. Aucune promesse de compatibilité intégrale avec 22 classeurs, leurs macros ou leurs règles implicites.
9. Un plan de clôture alloue des enveloppes ; constater un paiement reste une opération du propriétaire financier. Aucune compensation automatique des dettes n’est introduite.
10. Pas de trois nouvelles vues d’épargne ni de remplacement du moteur de calcul ; la pédagogie reste séparée de la vérité calculée.
11. Aucun paiement réel activé, aucune purge de stockage d’appareil, aucun QR de synchronisation improvisé ni suppression massive de branches/workflows.
12. Une réussite automatique ne vaut pas recette réelle : realMoneyEnabled=false ; FIELD_ACCEPTED=NOT_ACCEPTED.

## Choix de construction

esbuild est verrouillé à 0.28.2 avec intégrité npm. Seul le graphe statique de ConnectedApplication est regroupé. Le code splitting n’est pas activé ; les importations différées et leur ordre de montage restent explicites. Le build portable peut conserver le graphe ESM d’origine en l’absence de dépendances ; la livraison qualifiée utilise les dépendances verrouillées. Documentation primaire : https://esbuild.github.io/api/#bundle et https://esbuild.github.io/api/#splitting.

Les index 0020 n’écrivent aucune donnée métier. La procédure refuse toute instruction autre que les deux CREATE INDEX exacts, vérifie l’identité du SHA et de la sauvegarde privée, applique les index sur une copie restaurée, compare les empreintes des INSERT, contrôle intégrité/FK et plan SQL, puis applique et vérifie les noms en production. Un retour du code précédent conserve les index compatibles ; restaurer une ancienne base au-dessus de nouvelles écritures est interdit.

## Vérifications déjà observées

- TypeScript initial : réussi ; la compilation Windows standard a ensuite quitté avec 0xC0000005. Cette erreur de banc est conservée ; aucune assertion produit n’a été assouplie.
- Build portable avec les dépendances verrouillées : 28 modules statiques, 978121 octets compilés séparément, 413645 octets regroupés ; fermeture PWA 74 entrées + 90 transitives, aucun import local absent.
- 33 tests ciblés réussis, zéro échec/ignoré, comprenant 14 nouveaux scénarios natifs. Les mesures finales et le déploiement doivent encore être attestés.

La revue de membre utilise désormais une mise à jour conditionnelle sur la version persistée de l’avis : une réserve concurrente ne peut pas être écrasée par un accord fondé sur une lecture antérieure. Les offres et priorités se chargent sans retarder les chiffres essentiels de l’accueil.

Contrôles complémentaires locaux : build complet portable réussi après renforcement CAS ; 24 tests ciblés réussis (dont les 17 nouveaux cas). Le premier run GitHub 41298875000 a arrêté la candidate avant déploiement sur une propriété de revue optionnelle dans un enregistrement de correction (TS2322) ; la valeur persistée et la réponse utilisent désormais le booléen calculé, avec repli conservateur. Le marqueur de livraison vérifie explicitement le mode à deux index autorisés au lieu de l’ancien mode sans migration. La qualification complète de la source corrigée reste exigée.
