# Livraison vérifiée 1.5.2.18 — réparation visuelle et financière

La livraison 1.5.2.17 avait passé ses contrôles de publication mais le fondateur a ensuite signalé des régressions réelles. Son succès technique ne prouvait pas la conformité des usages aux documents. Ce bilan ne prétend ni accepter son compte réel ni achever toutes les intentions stratégiques.

## Identité de la production

- Application : https://eco-system.sergemimf.workers.dev/
- Version : `1.5.2.18-workspace-repair`.
- Source publiée : `70e376d9524b4646b1756482f7d7bf2713e3925d`.
- Build : `eco-system-1.5.2.18-20261015-workspace-repair`.
- Cache : `eco-system-v15218-workspace-repair-20261015`.
- Version Worker Cloudflare : `6b4240b1-6827-4251-a44a-72e58232cf4e`.
- Publication observée : 15 octobre 2026, 21:54:54 UTC ; contrôle exact de propagation réussi à 21:55:12 UTC.
- Lecture publique indépendante achevée : 15 octobre 2026, 22:06:31 UTC, soit 23:06:31 à Douala.

## Corrections livrées et preuve

| Écart | Correction | Observation de qualification |
| --- | --- | --- |
| Auteur toujours « synchro en attente » après acceptation serveur | Application publie l'acquittement après persistance des commandes financières, même ajoutées pendant l'envoi du contexte Réunion ; le shell respecte compte, groupe, version et corrections ultérieures. | Test natif de course + réponse HTTP retardée de 3,1 s ; un seul envoi, auteur confirmé, autre gestionnaire convergent. |
| Frappe distante absente | Présence éphémère conservée pendant une courte connexion et renouvelée pendant la saisie ; STOP annule la présence en attente. | Deux comptes synthétiques distincts voient la frappe avant validation, puis le montant validé. |
| Réunion sans retour visible ou reconstruction de la feuille | Barre de contexte sur les projections canoniques, connexion réelle et événements de contexte sans rechargement structurel du groupe. | Mode Réunion conservé et visible dans l'onglet Feuille de Séances. |
| Parties trop larges ou rubriques manquantes | Découpage selon la largeur disponible et le mode. Minimum conseillé, choix impossibles retirés, vue intégrale défilante conservée. | Toutes les parties de 20/40/100 rubriques parcourues, couverture exacte sans doublon ni omission, absence de débordement et total général invariant. |
| Visuel/Senior/Assisté peu distincts | Tailles et contrôles différents, choix conservé par fenêtre ; guidage et dictée mis en évidence en Assisté. | Deux fenêtres du même profil : différences mesurées et indépendance ; captures des trois modes et édition mobile. |
| Cellules et actions démesurément hautes | Valeur puis une rangée saisie/dictée/validation ; actions de l'historique disposent d'une largeur dédiée. | Cellules compactes mesurées et captures inspectées ; contrôle de validation ≥ 44 px. |
| Accueil empilé sans organisation locale | Quatre onglets : Vue d'ensemble, Mes groupes, Échanger & entreprendre, Services & confort. Les panneaux et destinations existants sont réutilisés. | Tests de navigation/cockpit/Eco IA, ancres, désactivation de mémoire et téléphone conservés. |

La matrice [de conformité aux documents](CONFORMANCE-2026-10-15-WORKSPACE-REPAIR.md) précise les exigences et leurs propriétaires existants.

## Qualifications observées

Sur la source candidate `bccb12ca9c22eff866089555c47b6bdef8002bb1` :

- [Qualification principale 38810746007](https://github.com/Serge-As/urae/actions/runs/38810746007) : SUCCESS ; 732 tests applicatifs, Chromium 15/15 et WebKit 6/6.
- [Qualification indépendante 38810745968](https://github.com/Serge-As/urae/actions/runs/38810745968) : SUCCESS.
- [PR 95](https://github.com/Serge-As/urae/pull/95) fusionnée sous `d2f6b9537088794364b15f082e5db9b7ebb2da57`.

Sur le SHA exact publié `70e376d9524b4646b1756482f7d7bf2713e3925d` :

- [Livraison production 38812599315](https://github.com/Serge-As/urae/actions/runs/38812599315) : SUCCESS. Typage, architecture, constitution, gouvernance, vérité/mémoire, compilation, suite 732/732 puis contrôle par fichier, Chromium 15/15, WebKit 6/6, sauvegarde vérifiée et publication.
- [Qualification indépendante production 38812599318](https://github.com/Serge-As/urae/actions/runs/38812599318) : SUCCESS.
- Propagation Live du scénario normal : 958/949/969 ms ; états CONFIRMED des deux auteurs ; aucun polling financier au repos pendant la fenêtre observée. Ces durées ne sont pas une garantie de réseau du compte réel.
- Aucun test de conflit, hors ligne, idempotence, authentification ou scénario existant retiré pour faire passer la livraison. Le montage des nouveaux comptes réutilise la session créée par l'inscription ; les protections d'authentification n'ont pas été modifiées.
- Le contrôle de géométrie a été renforcé pour lire la partie demandée, sa largeur, ses rubriques et son total depuis le même tableau attaché ; un ancien élément détaché lors du redimensionnement ne constitue pas une mesure de la partie.

Les premiers échecs de qualification sont conservés dans l'historique des runs 38779022369, 38781682327 et 38784793511. Ils ont notamment permis de reproduire la course d'acquittement. Le résultat final correspond au code corrigé, pas à une simple relance du code fautif.

## Conservation et récupération

Avant toute publication, la base D1 existante a été exportée en lecture seule, restaurée dans SQLite et contrôlée : `restoredIntegrity=ok`. L'archive a été stockée dans le R2 privé existant, téléchargée et vérifiée par empreinte.

- Preuve : `backupVerified=true`, source `70e376d9524b4646b1756482f7d7bf2713e3925d`.
- Archive SHA256 : `ce7694a349ad2be3b20766446bc0c15960139289abecbd04863d155ce1b79141`.
- Reçu privé : artefact `production-recovery-70e376d9524b4646b1756482f7d7bf2713e3925d` du run de livraison.
- Aucun remplacement D1/R2, aucune migration, aucune réécriture des données, aucune rotation de clé existante, aucun nettoyage de données locales ou de files de saisie. Argent réel toujours désactivé.
- Source exacte archivée et vérifiée avant mutation du Worker. L'ascendance de la production antérieure a été vérifiée.

## Vérification publique indépendante

Le [reçu JSON](evidence/WORKSPACE-REPAIR-PUBLIC-2026-10-15.json) conserve les empreintes et résultats des dix lectures publiques : santé, HTML, service worker, CSS, shell, calcul des parties, mode Réunion, onglets d'accueil, modes de fenêtre et catalogue. Toutes répondent HTTP 200 ; version/source/build/cache et modules correctifs concordent. Le catalogue conserve 164 capacités déclarées. Ce nombre ne prouve pas leur recette complète.

Les captures rendues sont conservées dans l'artefact `cockpit-visual-evidence` du run 38810746007 : SHA256 `5c63f952e18a72b14603fbac5893199dccbd5873ed04697c54bf1c6940604715`. Elles représentent des comptes synthétiques isolés, pas le compte Delor.

## Limites et reprise

FIELD_ACCEPTED=NOT_ACCEPTED. Le navigateur authentifié précédemment bloqué n'a pas été contourné. La santé publique et les essais synthétiques ne prouvent pas toutes les saisies réelles, tous les autres parcours ni tous les dommages potentiels signalés par le fondateur.

Eco IA reste un assistant local déterministe FR/EN, connecté aux espaces actuels. La mémoire locale des destinations reste limitée, cloisonnée et désactivable ; aucune mémoire intégrale interappareils ni intelligence générative externe n'est annoncée. Les orientations de la vision stratégique encore non réalisées ne sont pas déclarées achevées.

Reprendre depuis cette version et ses preuves, conserver l'outbox et les données locales, traiter tout nouvel écart avec reproduction et qualification du propriétaire existant. Une actualisation normale charge la nouvelle version ; ne pas demander d'effacer le stockage pour masquer une saisie en attente.

## BIR+

- Besoin : réparer les régressions signalées et rattacher les corrections aux documents écrits.
- Impact : présentation, transport et projection des confirmations ; aucun nouveau propriétaire financier.
- Réutilisation : Application/Outbox, Ledger, deux feuilles canoniques, Live, FinancialWork UI et panneaux actuels.
- Risque résiduel : contexte réel non accepté ; réseau, données et configurations des comptes du fondateur non couverts intégralement par la recette synthétique.
- Preuve : qualifications au SHA exact, sauvegarde restaurée, archive relue, publication réussie et dix lectures publiques indépendantes.

## ÉTAT DU PROJET APRÈS ÉTAPE

Réparation 1.5.2.18 implémentée, qualifiée et déployée. Version publique et ressources correctives attestées. Données et propriétaires acquis conservés. Acceptation terrain et achèvement intégral de la vision stratégique non déclarés.

La consommation exacte de crédits de ce travail n'est pas fournie par les outils ; aucun montant n'est inventé.
