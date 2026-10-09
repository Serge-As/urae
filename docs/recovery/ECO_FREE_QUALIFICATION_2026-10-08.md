# Eco-System — qualification privée sans minutes GitHub, 8 octobre 2026

## État exact de la reprise

La livraison reste **HOLD**. Production 1.5.2.15 **NON ATTESTÉE** ; dernière production attestée : **1.5.2.14-live-sync**, source d027f09a1382cd29054b33e274f3fd3bf9f8d9f3. Aucun changement D1/R2 ni transfert d'argent réel.

La branche de travail est **fix/confrontation-clock-recovery-20261008**, PR **#72** vers **fix/1.5.2.10-offline-conflicts-loans-20261003**. La PR #71 contient la reprise transport bornée déjà qualifiée, fusionnée dans la branche de livraison, mais sa publication a été suspendue après un échec fonctionnel.

Le fondateur confirme que les **2 000 minutes gratuites GitHub Actions du mois sont épuisées**. Les nouveaux jobs 37827279968 et 37827591520 échouent avant attribution de runner, sans étapes ni logs. Leur conclusion FAILURE ne constitue aucun résultat de test. Le terminal de la session Codex échoue aussi avant création du processus : helper_unknown_error / setup refresh had errors. Ce dernier problème est distinct du quota GitHub.

## Preuves acquises et ce qui reste à vérifier

| Objet | Preuve | Portée |
|---|---|---|
| Transport borné | 3f7ea0 : 650/650 Node, Chromium 8/8, WebKit 6/6 ; runs 37820287689 et 37820287701 SUCCESS | Source antérieure qualifiée ; aucune preuve de production 1.5.2.15 |
| Horloge de reconfirmation | 0415c94 et 4022ef5 : trois régressions échouent sur l'ancien source Application, passent sur le correctif ; 653/653 Node et gates PASS | Défauts d'ancre ancienne, de réchauffement concurrent et de cache GET prouvés |
| Convergence complète | Run 37826825035, source 4022ef5 : Chromium **7/8**, attente de 4 000 reçoit 5 000 | L'horloge corrigée ne clôt pas à elle seule cet échec |
| Contexte d'échec | Artefact **11571014847**, digest ZIP d9d1d8568ce06c27dc2be3fb182129e43f008841c177b91ec326ec04a8e2950a | Conserver les captures et le contexte ; ne pas effacer cette preuve |
| Dépendances | Job 113481702657 : verrou npm généré Playwright 1.56.1 / ws 8.21.0, audit de 3 high à **0 alerte connue** | Métadonnées et intégrités adoptées ; nouveau verrou intégré encore à qualifier |
| Changement de groupe pendant l'attente | Exécution V8 du vrai corps de résolution : ancien source annule l'original et crée une commande dans un autre groupe ; correctif rejette CONFRONTATION_DECISION_STALE et conserve l'original | Vérification étroite avec doubles de services ; régression complète Node ajoutée, non exécutée |
| Suite finale | **654** tests Node attendus, Chromium **8**, WebKit **6** | Aucun résultat complet revendiqué pour la dernière branche |

La fixture navigateur vérifie désormais que **5 000 est canonique sur le serveur**, puis que le dialogue compare effectivement 4 000 et 5 000 avant la nouvelle décision. Une valeur locale affichée ne suffit pas à établir un ACK serveur. L'assertion finale reste strictement **4 000** ; le délai n'est pas assoupli.

En cas d'échec de cette assertion, le navigateur joint un JSON avec la cellule canonique, les statuts et versions des deux Outbox et les deux montants affichés. Les tickets d'horloge sont exclus. Ces données distinguent l'ordre canonique, une commande refusée ou un écran Live resté ancien. La cause restante n'est pas encore attribuée.

## Exécution locale autonome

Prérequis : Git, Node.js **24 ou plus récent**, accès autorisé au dépôt privé et Internet pour npm / les navigateurs. Un poste Windows, macOS ou Linux peut exécuter le script. Sur Linux, Playwright peut demander les paquets système nécessaires à ses navigateurs. La session Codex actuelle n'a pas pu exécuter ce script ; il est préparé et revu statiquement.

Depuis un terminal fonctionnel :

```text
git clone --branch fix/confrontation-clock-recovery-20261008 --single-branch https://github.com/SergeDelor/tontine-platform.git eco-system-qualification
cd eco-system-qualification
node scripts/qualify-eco-locally.mjs
```

Si les navigateurs de la version verrouillée sont déjà installés, l'option **--skip-browser-install** peut éviter leur téléchargement. Elle ne saute aucun test.

Le lanceur :

1. vérifie la version Node, le SHA et la propreté du source suivi ;
2. installe le verrou exact, lance audit, TypeScript, gouvernance et **toute** la suite Node ;
3. démarre un serveur isolé sur 127.0.0.1:4173 avec sa propre base SQLite sous work/, vérifie version/build/cache/schema/policy et realMoneyEnabled=false ;
4. exécute les mêmes suites Chromium et WebKit que la livraison ;
5. sauvegarde le rapport sous **outputs/eco-local-qualification-.../qualification-report.json** ;
6. en cas de réussite, archive le SHA exact, calcule SHA-256 et vérifie la lecture du tar.

Les logs et la base synthétique sont sous work/. Les éventuels diagnostics Playwright restent dans test-results/. Le script arrête seulement le serveur qu'il a lancé. Il ne publie rien et n'ouvre pas la base locale habituelle ni la D1 de production. Le /health local conserve UNBOUND_LOCAL_BUILD : son identité ne doit pas être présentée comme un /health de production ; le SHA qualifié provient du checkout Git propre.

## Reprise de livraison

Lire le rapport complet et, si le scénario 4 000/5 000 échoue, son JSON de diagnostic. Corriger la cause démontrée et refaire les seules qualifications nécessaires au nouveau source. Ne pas rétablir le marqueur code-only avant réussite des contrôles du même SHA.

La livraison actuelle devra ensuite s'exécuter avec un runner disponible (quota rétabli ou runner privé compatible) et conserver ses contrôles exacts avant mutation Worker. Le rapport local n'est pas une permission de sauter ces contrôles. Publier la preuve production : SHA, version, build, cache, Worker version, catalogue 164, realMoneyEnabled=false. FIELD_ACCEPTED reste NOT_ACCEPTED jusqu'à recette physique Android 6/iOS/2G et groupes réels.

## Sources et crédits

Les anciennes conversations et les fichiers de mémoire du dépôt ont été lus ; les cinq captures fournies sont examinées. Les originaux Word/Excel/ZIP de la Bibliothèque ChatGPT ne sont pas accessibles via les outils de cette session. Ils ne sont pas déclarés intégralement lus et leurs versions finales ne sont pas inventées.

Le compteur Codex disponible expose des limites globales de compte, pas un coût exact par chat. Toujours le préciser dans le bilan, même sans nouvelle demande. Ne pas déduire « 0 crédit consommé » d'un solde affiché à 0. Aucun achat de crédits, forfait ou minutes n'a été engagé.

## Qualification locale réellement exécutée et nouveau diagnostic

Source réellement exécutée : **e083a6a38b1ab76e6827e512bb7e900604911a4c**. Qualification locale terminée le 8 octobre à **23:57:48.826 UTC**, soit le 9 octobre à **00:57 à Douala**. Le terminal réel et le rapport du lanceur montrent **654/654 Node PASS, zéro échec/skip**, puis **Chromium 7/8**. Le scénario « distinct managers » échoue après la validation de **2 001 F CFA par Beta** : Alpha affiche encore **1 000** à l'assertion de cinq secondes. La capture d'échec communiquée ensuite montre **2 001**, avec l'auteur Beta ; elle suggère une arrivée tardive et ne mesure pas sa cause ni son délai exact.

La confrontation **4 000 / 5 000** et la panne API bornée passent dans cette exécution. Ce résultat unique conserve les échecs historiques et ne vaut pas qualification complète. **WebKit NON EXÉCUTÉ** : arrêt du lanceur au premier gate navigateur en échec. **Rapport FAIL**, aucune archive qualifiée créée, aucune publication. Le catalogue local compte 164 capacités. Le /health local annonce UNBOUND_LOCAL_BUILD ; sa liaison est le checkout propre + serveur local du lanceur, pas une attestation de production.

Preuve locale utilisateur : `outputs/eco-reprise-20261009-004328/qualification-report.json` dans le chat de reprise ; capture `test-results/tests-browser-sovereign-mu-85770-r-polls-financial-snapshots-chromium/error-context.md`. Les fichiers et bases synthétiques antérieurs sont conservés. La production 1.5.2.14 reste la dernière attestée.

Prochaine action : **scripts/diagnose-live-sync-locally.mjs**, une seule exécution Chromium du scénario concerné, sur nouvelle SQLite synthétique. Le test existant conserve ses assertions de cinq secondes et de zéro polling au repos ; il ajoute uniquement des horaires/ACK/Outbox/changements d'affichage expurgés de tickets. Diagnostic PASS ou FAIL ≠ qualification de livraison. L'instrumentation nouvellement ajoutée reste à exécuter avant toute conclusion de causalité ou correction métier. Le terminal automatique Codex indisponible et le quota Actions épuisé nécessitent toujours un lancement PowerShell par le fondateur. Pas d'installation navigateur répétée ni de minutes achetées.

**HOLD maintenu**, PR #72 brouillon. Après diagnostic/correction : qualification complète **654 Node + Chromium 8 + WebKit 6 du même SHA**, archive vérifiée puis gates de livraison/smoke exact. **realMoneyEnabled=false ; FIELD_ACCEPTED=NOT_ACCEPTED**. Les blocs suivants restent des preuves historiques, jamais des PASS actuels.

---

