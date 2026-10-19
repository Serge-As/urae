# ECO-LOCK-001 — Complément : intégrité globale, enrichissement cumulatif et dépendances vivantes

**Décision exprimée par le fondateur le 19 octobre 2026.** Complément à ECO-LOCK-001 du 18 octobre 2026, à la Charte commune des 28 lots du 19 octobre et au Pacte zéro régression du 18 octobre. **Il ne remplace ni ne réduit leurs exigences.** Cette consignation documentaire sur une branche privée dédiée n'installe pas de vérifications CI, ne change pas les droits GitHub et ne vaut ni autorisation générale de modifier le produit ni autorisation de déployer. Les mécanismes d'application devront être intégrés et qualifiés séparément.

## Règle normative supplémentaire

> **Améliorer A5 oblige à préserver ET vérifier A1, A2, A3, A4, les autres capacités préexistantes et leurs relations avec A5, même lorsque le demandeur n'a parlé que d'A5.** Il est interdit d'effacer, de masquer, de rendre inaccessible, de neutraliser, de dégrader ou de débrancher une capacité ou une dépendance au motif qu'elle n'était pas citée. Si A5 change de contrat, ses producteurs et consommateurs réels sont identifiés ; les liaisons sont maintenues par compatibilité ou adaptées explicitement, sous les autorisations des propriétaires concernés. Une relation qui marchait avant doit encore marcher après, ou mieux selon des critères vérifiés. Une régression observée ou une absence de preuve requise empêche de déclarer le changement qualifié.
>
> **ECO-LOCK protège les acquis sans fossiliser le produit.** Lorsqu'un écran ou module comporte dix éléments, demander d'améliorer les éléments 4 et 5 et d'ajouter les éléments 11 à 25 n'autorise pas à faire disparaître les éléments 1 à 3 ou 6 à 10. Les deux éléments visés doivent effectivement être améliorés et les quinze nouveaux éléments doivent être ajoutés avec leurs parcours utiles, non seulement leurs libellés. À la fin, l'inventaire attendu contient les anciens éléments conservés, les éléments améliorés et les nouvelles capacités effectivement qualifiées. Une nouvelle fonction n'est pas tenue pour acquise tant qu'elle n'est pas testée sur son propriétaire réel et ses dépendances.
>
> **Cette règle est bidirectionnelle et cumulative :** préserver l'existant, améliorer le ciblé, ajouter le nouveau, garder les liens entrants et sortants, protéger les autres lots, et améliorer le fonctionnement d'ensemble sans retirer un bénéfice ailleurs pour afficher un progrès local.

## 1. Inventaire obligatoire, composant par composant

Avant l'édition, réaliser un inventaire **sur la référence technique exacte et sur les parcours terrain connus**, pas sur une liste supposée exhaustive :

- Identifiant stable de capacité/élément ; nom fonctionnel, emplacement, rôles et publics autorisés ; propriétaire canonique ; version et preuve ; état `PRESENT_ET_VERIFIE`, `PRESENT_NON_VERIFIE`, `MANQUANT`, `DEFAILLANT` ou `INCONNU`.
- Fonctions visibles et cachées, menus, liens, boutons, états vides et erreurs, écrans secondaires, préférences, modes compact/sénior/assisté, accessibilité, voix et retours à la page exacte.
- Entrées/sorties et liens : événements, appels API, lectures, écritures, stockage, identité, droits, notifications, persistance, cache/PWA, synchronisation, consommateurs d'autres lots, quota et coût.
- Décision `CONSERVER`, `CORRIGER/AMELIORER`, `AJOUTER`, `REMPLACER AVEC COMPATIBILITE` ou `RETIRER SUR AUTORISATION EXPRESSE`. **Une absence de mention n'est jamais une décision de retrait.**
- État attendu et observé avant/après. Un défaut ancien connu n'est pas présenté comme une réussite ; il est enregistré sans autoriser la dégradation des fonctionnalités voisines.

L'inventaire est **ouvert** : les numéros 1–25 sont un exemple du fondateur, pas la prétention qu'un cockpit comporte aujourd'hui exactement 10 ou 25 composants. Ne pas déduire qu'un élément existe à partir d'un nom de cahier ou de code.

## 2. Test de continuité des relations et rayon d'impact

Pour chaque changement de A5, dessiner au minimum :

`producteurs en amont → A5 → consommateurs en aval`, ainsi que les liens A5 ↔ A1…A4, autres modules, couches communes et anciens clients.

Pour chaque liaison : ancien contrat/entrée/sortie/version, nouveau contrat, autorisation, règle de compatibilité, adaptation éventuelle, comportement si la dépendance manque, test du **véritable producteur et du véritable consommateur**. Inclure les dépendances directes, indirectes et transitives ; la portée ne s'arrête pas au fichier modifié. Vérifier les deux sens lorsque la liaison est bidirectionnelle.

Les adaptateurs pour contrat absent peuvent être simulés **en tests ou démonstrations identifiées uniquement**. Ils ne peuvent jamais retourner un succès de production fabriqué. Un raccord partagé entre propriétaires de lots est **proposé à l'intégration**, attribué à son propriétaire et approuvé selon sa classe ECO-LOCK ; aucun lot ne modifie secrètement les fichiers ou responsabilités du voisin.

Un changement de contrat doit supporter les anciens producteurs/consommateurs et les anciennes données, ou présenter une migration, une compatibilité ascendante/descendante et une procédure de récupération approuvées. Échec de contrat, retrait de mandat, contexte changé, doublon, erreur réseau, données périmées et décalage de versions font partie de la recette.

## 3. Exemple opposable : cockpit existant de dix éléments

La **numérotation suivante est illustrative**, pas un relevé du logiciel : E01…E10 existent dans l'exemple ; E04 et E05 sont dépassés ; E11…E25 sont souhaités.

| Cible | Opération autorisée envisagée | Preuve obligatoire |
| --- | --- | --- |
| E01–E03 et E06–E10 | Ne pas supprimer, masquer ni dégrader | Inventaire et parcours métier identiques ou meilleurs avant/après |
| E04 et E05 | Moderniser leur valeur d'usage sans casser leurs entrées, sorties ni consommateurs | Démonstration du défaut initial, valeur ajoutée mesurable, compatibilité de leurs liens |
| E11–E25 | Ajouter au bon propriétaire et aux droits appropriés | Action utile jusqu'au résultat réel/persistant, erreurs, reprise, permissions ; jamais 15 cartes factices |
| Cockpit entier | Conserver l'accès aux anciens éléments et raccorder les nouveaux | Tests de navigation, comptes/groupes, affichage mobile/sénior, performance, fraîcheur des données |
| Autres capacités touchées indirectement | Préserver leur contrat et leurs résultats | Tests intermodules sur le **candidat exact**, pas seulement le module amélioré |

Si E04 consulte une séance et E11 affiche une décision de gouvernance, le cockpit **n'invente ni le solde ni le vote** : il consomme les propriétaires de la séance, du Ledger et des décisions, avec droits, versions et fraîcheur. L'absence temporaire de ces services produit un état explicite, pas des chiffres ou confirmations inventés.

## 4. Amélioration cumulative : pas de fausse conservation

La non-régression n'est **pas** seulement « les tests de l'ancien module passent ». Les livrables doivent montrer séparément :

1. **Conservation** : inventaire des capacités historiques, accessibles et fonctionnelles à leur niveau attendu, avec preuves négatives (aucune suppression, rupture de lien, divulgation ou dégradation non approuvée).
2. **Réparation** : les éléments obsolètes ou défaillants ciblés sont réellement corrigés ou améliorés selon des critères formulés avant l'édition.
3. **Enrichissement** : les nouvelles fonctions demandées sont effectivement présentes et aboutissent à une action utile avec propriétaire, permissions, persistance et reprise lorsque pertinentes.
4. **Cohérence globale** : le nouveau fonctionne avec l'ancien (données, navigation, identité, droits, Live, offline/PWA, notifications, modes d'affichage), sans coût/quota ou latence cachés inacceptables.
5. **Comparaison honnête** : indiquer précisément ce qui reste non construit, non testé, isolé, intégré, publié et accepté sur le terrain.

Un bouton visible mais inactif, une donnée inventée, un mock déclaré intégré ou un test qui ne vérifie que la présence de code **ne valent pas enrichissement réussi**.

## 5. Matrice de recette avant/après et seuil d'arrêt

Pour chaque fonctionnalité affectée, maintenir une ligne : `ID | état baseline | changement prévu | liens entrants | liens sortants | risques | tests baseline | tests candidat SHA | état final | preuve | décision`.

Rejouer au minimum les parcours antérieurs des capacités touchées **et de leurs consommateurs réels**, puis les nouveaux parcours, cas invalides, réouverture, changement de compte/groupe, permission révoquée, interruption, reprise hors ligne et vieille/nouvelle version si applicables. Les montants financiers, ACK, Outbox, Live, prêts, dettes, rapports, confidentialité et déploiement restent soumis aux gardes renforcés d'ECO-LOCK et du Pacte (dont F01–F15, L16–L26, O27–O37, R38–R47, I48–I54 selon le rayon d'impact).

États obligatoires : `PASS`, `FAIL`, `BLOCKED`, `NOT_RUN`. La présence d'un échec préexistant ne dispense pas de le signaler ; seule la comparaison documentée permet de distinguer l'ancien du nouveau. **Un test absent n'est pas une preuve de non-régression.** En cas de perte de fonctionnalité, lien coupé, écriture perdue/doublée, fuite de droits, incompatibilité persistante ou coûts hors seuil convenu : arrêt, sauvegarde des traces, préservation des données et Outbox, récupération contrôlée, pas de déploiement.

Les contrôles sont d'abord ciblés et peu coûteux ; une qualification finale porte sur le **SHA intégré exact**, dans l'environnement et avec les appareils adéquats. Vérifier les coûts Workers/D1, bande passante, taille, CPU et minutes CI : on n'« optimise » pas en supprimant du métier utile.

## 6. Fiche d'impact enrichie (FAI)

Ajouter à la FAI ECO-LOCK, **avant tout changement d'acquis** :

- **Inventaire entier de la zone** : quels éléments fonctionnent, manquent, sont insuffisants ou restent inconnus ? Quelle preuve distingue chacun ?
- **Delta d'intention** : éléments à garder ; éléments à améliorer (ancienne → nouvelle exigence) ; éléments à ajouter ; retrait éventuel **explicitement demandé**.
- **Matrice de dépendances** : fonctions non nommées par le fondateur mais affectées, liens entrants/sortants, interfaces propriétaires, anciens clients, effets transversaux et adaptations envisagées.
- **Recette cumulée** : tests de continuité de tous les éléments conservés affectés, tests d'amélioration ciblée et tests métier de chacune des extensions, plus vérification de l'ensemble.
- **Critères de refus** : disparition, lien brisé, non-réversibilité non approuvée, aggravation du service voisin, charge déplacée sur l'utilisateur ou sur les quotas, fake success.
- **Récupération** : bascule, rollback compatible avec écritures récentes, copie de sécurité, et scénario de restauration démontré ; état des anciennes données/sessions.
- **Validation à demander** : une proposition chiffrée en effort/coûts/risques lorsque possible et une liste des fonctionnalités nouvelles à prioriser, **sans présumer que toutes les suggestions d'un cahier sont approuvées**.

Les deux portes de consentement restent distinctes : **autorisation d'édition du périmètre** puis **autorisation de publication/activation du candidat exact**. Cet addendum n'accorde aucune autorisation implicite au-delà de sa consignation dans GitHub.

## 7. Usage des documents d'enrichissement joints par le fondateur

Le paquet utilisateur `Enrichir fonctionnalités Eco oct 2026.zip` (octobre 2026) est un **corpus d'idées à comparer à l'existant**, pas une déclaration de fonctionnalités déjà en production ni un ordre de tout installer. Lire les cahiers pertinents lors de la préparation du lot, en plus des autorités de version et de la Bible ; établir `EXISTE / PARTIEL / ABSENT / INCONNU` et `CONSERVER / MODERNISER / AJOUTER / PROPOSER`.

- **Lot 02 — Cockpits** : `Eco-System_Grand_Cockpit_Pilotage_MultiGroupes_2026-10-17.md` ; accueil personnel, multi-groupes, gouvernance/délégations, alertes, pilotage économique, actions et navigation. Les montants sont des projections des propriétaires, jamais une deuxième comptabilité.
- **Lot 03 — Identité, groupes et Kit** : `Eco-System_Kit_Pret_Emploi_3.1_Atlas_RI_Validation_Offline_2026-10-17 (1).md` (ainsi que 3.0) ; parcours en dix étapes, banque offline, provenance/version des modèles, RI, rattachement des membres et interactions autorisées avec Discover. Garder les liens entre création, adhésion, droits et moteur métier.
- **Lot 04 — Gouvernance** : passages de gouvernance du Grand Cockpit 3.0, RI vivant/approbations du Kit 3.1 et Pacte zéro régression ; votes, mandats, preuves de décision et consultations autorisées. Les décisions ne créent pas d'écritures financières par elles-mêmes.
- **Lots 01 et 05** : rester prudents sur navigation, séance, saisies et confrontation déclarées satisfaisantes par le fondateur ; conserver leurs contrats et tester leurs raccords en cas d'impact indirect. Pas d'enrichissement non demandé au seul prétexte que des idées existent dans l'archive.
- **Autres lots** : exploiter les cahiers du paquet seulement selon leur propriétaire, leurs frontières et la priorisation approuvée ; aucune reprise sauvage d'un fichier/moteur voisin.

Pour tout apport envisagé depuis **la bibliothèque personnelle, un autre fichier ou une source externe** non inclus dans ce paquet, présenter d'abord au fondateur les idées concrètes, leur provenance, les éléments conservés/modernisés/ajoutés, les effets sur les autres lots, les coûts et les risques ; **demander son avis avant toute incorporation dans le périmètre fonctionnel**. La simple disponibilité d'une source ou sa consultation ne constitue pas une autorisation.

## 8. Verdict de livraison à écrire sans ambiguïté

Une ligne par capacité, pas uniquement une pastille « lot terminé » :

`REPERTORIE → PROPOSE → AUTORISE_EDIT → DEVELOPPE_ISOLE → TESTE_ISOLE → INTEGRE → QUALIFIE_CANDIDAT → AUTORISE_PUBLI → PUBLIE → VERIFIE_REEL → ACCEPTE_TERRAIN`.

Les états réellement atteints doivent être signalés ; certains peuvent rester `BLOCKED` ou `NOT_RUN`. Ne pas prétendre qu'une capacité existe parce que son nom apparaît dans un plan, ni annoncer le cockpit achevé parce qu'un composant existant a été conservé.

**Portée de la présente intervention du 19 octobre :** rédaction et dépôt documentaire de ce complément dans une branche GitHub privée, **aucune modification du code produit, de D1/R2, des secrets, des workflows, de HOLD ou de `realMoneyEnabled=false` ; aucune fusion ni publication applicative**. L'intégration de la gouvernance au tronc documentaire et sa mise en oeuvre dans l'outillage sont deux décisions distinctes.
