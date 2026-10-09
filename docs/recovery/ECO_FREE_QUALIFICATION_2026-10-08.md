## Reprise sans Ubuntu local — 9 octobre 2026

Le fondateur confirme : **« continuons si possible sans Ubuntu »**. Cette préférence fait autorité : la gestion du projet reste sous Windows, Ubuntu sur son PC est facultatif. L'activation native de VirtualMachinePlatform a terminé à **100 % / opération réussie** ; le dernier `wsl --list --verbose` indique **aucune distribution installée**. Aucune distribution Ubuntu n'est installée par cette reprise.

Un travail Cloud a été créé avec les instructions exactes : conversation **6ac8c4bf-9a24-83ea-b166-c176d065fba7**, exécuteur **01a12040-ce4c-73b1-8bbe-6e42bfeab048** (host durable). Ses sorties réelles confirment Linux, Node **24.19.0**, lecture du dépôt privé et PR72 ; **Git direct manque d'authentification et le checkout exact est en cours de récupération**. Les binaires Chromium/WebKit Playwright 1.56.1 ont été téléchargés dans le Cloud ; leurs bibliothèques système et leur démarrage réel restent à vérifier. Une archive de source antérieure (artifact 11567969551, source 3f7ea034) a été récupérée pour faciliter la reconstruction ; elle ne qualifie pas le source actuel. Aucun résultat de qualification Cloud PASS ni nouvelle archive qualifiée ne sont encore acquis. GitHub Actions run 37874304697 reste sans runner ni étape ; aucun achat.

Le lanceur existant `scripts/diagnose-live-sync-locally.mjs` reçoit un mode **--scope=sovereign-chromium** et **--output-root**. Il sélectionne les **six scénarios souverains existants et inchangés** sur Chromium déjà installé, sur SQLite synthétique isolée : QR/cache/rechargement, vrai DataChannel Local Room, callbacks A01 et override Recap. Sélection de 6 tests, exécution de 6 tests et zéro skip sont obligatoires. Le mode Live par défaut conserve son scénario unique et ses délais. Tout diagnostic garde qualified=false ; il n'archive ni ne publie et **ne remplace pas WebKit 6/6**.

Dernière preuve produit réelle : **9bad483 : 657 Node, Chromium 8/8 PASS ; WebKit Windows 4 PASS/2 FAIL ; total FAIL**, avant/après dépenses : 3 échecs attendus puis 3 PASS. Les nouveaux changements ne sont pas encore qualifiés ; seule leur syntaxe JavaScript a été examinée. Maintenir HOLD, PR72 draft, FIELD_ACCEPTED=NOT_ACCEPTED, realMoneyEnabled=false et dernière production attestée 1.5.2.14. Les états antérieurs ci-dessous sont historiques.

ÉTAT DU PROJET APRÈS ÉTAPE : continuation Windows décidée, exécuteur Cloud actif avec accès de lecture confirmé, diagnostic Chromium souverain préparé ; qualification exacte complète et livraison restent à produire.

---

## Reprise environnement — WSL avance, redémarrage CBS en attente, 9 octobre 2026

La base WSL 3.0.1 est installée. L'activation native de VirtualMachinePlatform a avancé de 37,8 % à 60,4 % (relevé du fondateur), puis **61,0 % observé dans le terminal**. Elle n'est pas encore confirmée terminée. Le diagnostic Windows du 9 octobre à 03:10:56 indique **redemarrage_CBS=true**, redemarrage_Windows_Update=false, BITS/TrustedInstaller/wuauserv tous Running ; l'événement Setup/Servicing 7 est Information et décrit le début d'activation VirtualMachinePlatform. Le dossier CBS est absent ; aucune erreur fatale n'est fournie. Le marqueur CBS ne désigne pas à lui seul la transaction ni la fin de l'activation.

**Suite :** laisser l'opération native qui progresse se terminer ; après message final/retour au prompt, sauvegarder les travaux puis faire un redémarrage Windows normal pour les changements de composants en attente. Après ce redémarrage, vérifier les distributions avec `wsl --list --verbose`, puis seulement préparer l'environnement Linux compatible. Aucune interruption forcée, réparation d'image, modification de service ou exécution Linux n'a été réalisée par l'agent.

La qualification produit reste celle du source **9bad4832f2b53c3fd89c3765b0e24a5318167d7d : Node 657/657, Chromium 8/8, WebKit Windows 4 PASS / 2 FAIL ; total FAIL**. Ni ce diagnostic système ni le redémarrage ne qualifient le produit. Maintenir tous les six scénarios WebKit réels, l'archive après les gates exacts, HOLD, PR72 draft, FIELD_ACCEPTED=NOT_ACCEPTED et realMoneyEnabled=false. Le helper terminal Codex et le quota gratuit Actions restent indisponibles ; aucune minute achetée ni crédit de réinitialisation utilisé.

Détail de reprise : docs/memory/checkpoints/CHECKPOINT-2026-10-09-WSL-REBOOT-PENDING.md. Documentation : https://learn.microsoft.com/en-us/windows/wsl/install et https://learn.microsoft.com/en-us/powershell/dsc/reference/resources/microsoft/windows/rebootpending/ .

ÉTAT DU PROJET APRÈS ÉTAPE : diagnostic système acquis, activation toujours en cours, redémarrage composants signalé, Linux utilisable non confirmé, qualification complète et livraison toujours en attente.

---

## Résultat réel — finances et Chromium validés, WebKit Windows partiel, 9 octobre 2026

Source **9bad4832f2b53c3fd89c3765b0e24a5318167d7d**, qualification native terminée **2026-10-09T01:02:49.841Z** (02:02 à Douala), rapport outputs/eco-qualification-2026-10-09T00-52-01-749Z/qualification-report.json dans le chat. **Résultat global FAIL** : aucune archive qualifiée ni publication.

- Dépendances verrouillées et CI gouvernée PASS ; **657/657 Node**, fail/cancelled/skipped/todo=0, 82 131,4998 ms.
- Preuve réelle du composant TypeScript/Node : ancien d9bc8d9 **3 échecs des assertions attendues**, correctif **3 PASS**, zéro skip/cancel, vérificateur PASS.
- **Chromium 8/8 PASS (4,3 min)** : shell/offline/mobile, prêts/politiques, remboursement 2 500, deux gestionnaires, confrontation 4 000/5 000 et panne API bornée.
- Live : 1 000 / 2 001 / 2 002 reçus sur l'autre écran en **1 486 / 2 040 / 1 862 ms**, limites cinq secondes inchangées. **19 requêtes sur les endpoints instrumentés** (pas toutes les requêtes réseau), dont cinq lectures dépenses pendant le parcours et **zéro lecture dépenses pendant la fenêtre idle** ; Outbox toutes CONFIRMED et canonical=2002/version3.
- **WebKit 4 PASS / 2 FAIL (1,4 min)**. QR decoder, assets offline, rechargement origine arrêtée et override Recap passent. DataChannel échoue avec ECO_LOCAL_ROOM_WEBRTC_UNAVAILABLE ; callback A01 s'arrête sur Partager le signal désactivé. Le guard ecoLocalRoomSupported retourne false uniquement quand RTCPeerConnection est absent. Ce résultat expose une API manquante dans le WebKit Windows utilisé ; il ne prouve aucun échec financier ni ne permet de déclarer la suite WebKit complète PASS.

Playwright documente que les fonctionnalités de WebKit diffèrent selon l'OS : https://playwright.dev/docs/browsers#webkit . Ne pas généraliser le WebKit Windows à Safari/iOS ; ne pas supprimer, simuler ou ignorer les deux scénarios réels pour rendre artificiellement la suite verte. La suite **6/6 avec connexion réelle** reste requise sur un environnement WebKit compatible. Lecture native de la liste WSL demandée au fondateur ; le terminal montre ensuite la mise en place de **WSL 3.0.1**, comportement de premier lancement non prévu dans l'annonce de lecture seule. **Distribution Linux utilisable et résultat final encore inconnus** ; cette installation de base ne qualifie aucun test. Aucun nouveau travail Cloud, achat ni déploiement de la plateforme. Le terminal helper Codex et le quota Actions restent indisponibles ; le connector GitHub Fetch refuse les endpoints user/codespaces, donc aucun accès Codespaces ni quota gratuit n'est présumé.

Source métier inchangé après cette exécution ; le prochain checkpoint ajoute uniquement la vérité de reprise. HOLD, PR72 draft, FIELD_ACCEPTED=NOT_ACCEPTED et realMoneyEnabled=false maintenus. Production dernière attestée 1.5.2.14-live-sync. L'absence d'API RTC n'autorise pas une nouvelle autorité financière ni la suppression de Local Room, des deux feuilles ou des autres capacités.

ÉTAT DU PROJET APRÈS ÉTAPE : boucle de dépenses corrigée et prouvée avant/après en Node réel + navigateur ; finances 657 Node/8 Chromium PASS ; compatibilité WebKit complète non acquise ; qualification totale FAIL ; livraison en attente du gate compatible, archive et smoke exact.

---

## Reprise courante — diagnostic Live réussi, boucle de dépenses corrigée sous qualification, 9 octobre 2026

**Dernier diagnostic réellement exécuté : d9bc8d9de22156f7ab798ef75470fc5ecf3019a3, Chromium 1/1 PASS (1,6 min)**. Les assertions de convergence à cinq secondes n'ont pas été assouplies. Les fragments d'horodatage transmis par le fondateur mesurent, depuis la validation jusqu'à l'affichage Live chez l'autre gestionnaire : 1 000 = **2 733 ms**, 2 001 = **2 162 ms**, 2 002 = **1 830 ms**. Les intentions Outbox correspondantes sont CONFIRMED, attempts=1, APPLIED, versions 1/2/3. Ce diagnostic unique ne remplace pas la qualification complète ; l'échec antérieur e083a6a Chromium 7/8 reste conservé et sa cause exacte n'est pas prouvée par ce PASS.

Les traces montrent aussi des GET répétés de l'endpoint dépenses sur les deux pages, souvent environ toutes les 120 ms, y compris sans saisie. Les identifiants de timeline ne sont pas un nombre de requêtes. Le total exact n'est pas inventé : le long résultat utilisateur est partiellement tronqué et la copie PowerShell de l'attachement profond est inaccessible. Il reste conservé dans les outputs du chat eco-live-diagnostic-20261009-012738 ; le rapport source se trouve dans outputs/eco-live-sync-diagnostic-2026-10-09T00-24-34-168Z de la copie locale de qualification.

Correction ciblée dans apps/web/src/expense-recap-ui.ts : les MutationObserver ignorent les ajouts/retraits de leurs propres cartes de projection et regroupent les déclenchements simultanés. Les vrais changements du récapitulatif, de la séance, du groupe et de la langue conservent leur lecture du service existant. Aucune nouvelle autorité financière ni base. La simulation JavaScript du code reproduit 20 lectures et une relance pendante en 2,4 s avant correction, puis une seule lecture et aucune relance après ; trois scénarios de simulation avant échouent/après passent. **Cette simulation n'est pas une exécution Node, TypeScript ou Playwright réelle.**

Le source préparé ajoute trois tests de comportement du composant réel (idle, changement canonique/contexte, récapitulatif de séance). scripts/verify-expense-recap-regression.mjs exige leurs trois échecs d'assertion sur le SHA d9bc8d9 puis leurs trois succès sur le checkout courant, sans modifier celui-ci. Le scénario Chromium contrôle désormais aussi les lectures des dépenses/ledger pendant une vraie fenêtre idle après ACK, sur les deux gestionnaires ; toutes les anciennes limites cinq/huit secondes sont conservées. Les traces complètes et leur résumé sont écrits par Node à un chemin peu profond, sans récursion PowerShell.

**Qualification du nouveau correctif : NON EXÉCUTÉE.** Attendu : preuve avant/après, **657/657 Node**, **Chromium 8/8**, **WebKit 6/6**, même SHA propre et archive vérifiée. Le nouveau lanceur reçoit --output-root pour sauvegarder directement les rapports et l'archive dans les outputs du chat ; --skip-browser-install évite uniquement de retélécharger les navigateurs déjà installés. Le quota Actions mensuel épuisé et le helper terminal Codex indisponible restent des limitations d'exécution, pas des échecs métier ; aucun achat ni travail Cloud créé.

**HOLD maintenu, PR72 brouillon, 1.5.2.15 non livrée, FIELD_ACCEPTED=NOT_ACCEPTED et realMoneyEnabled=false.** Dernière production attestée : 1.5.2.14-live-sync. Les trois cartes métier, tous les scénarios et les acquisitions Cloudflare/D1/R2 sont préservés. Un attribut de diagnostic saveState demeure QUEUED_OFFLINE dans le run d9 malgré les Outbox CONFIRMED ; ne pas le confondre avec l'autorité financière canonique. Son alignement reste à examiner séparément si une incohérence visuelle est confirmée.

ÉTAT DU PROJET APRÈS ÉTAPE : diagnostic ciblé réel PASS ; défaut de boucle reproduit en simulation et correction sauvegardée ; tests réels du correctif en attente ; aucune promotion de maturité, fusion ou publication.

---

## Correction du lanceur de diagnostic — 9 octobre 2026

Première tentative réelle sur ad075a733f37326e80a0979bc866158ea74f442f : compilation et closure PWA PASS, puis **No tests found**, aucun scénario navigateur exécuté. Le filtre ancré `^distinct managers` cherchait au début du titre complet Playwright, qui commence par le projet/fichier. L'étiquette Test FAIL du premier rapport décrit donc une erreur de sélection du lanceur, pas une nouvelle preuve d'échec financier. Rapport conservé dans les outputs du chat `eco-live-diagnostic-20261009-011950`.

Correction : filtre non ancré `distinct managers see typing`, préflight `--list` avant compilation exige exactement un test sélectionné, puis résumé exige exactement un test exécuté sans skip. Erreur de sélection/exécution classée DIAGNOSTIC_ERROR / NOT_EXECUTED, jamais qualification. Assertions produit toujours à cinq secondes ; aucune modification métier. Documentation primaire : https://playwright.dev/docs/api/class-testconfig#test-config-grep . Nouvelle exécution nécessaire ; aucun PASS réel présumé.

---

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
git clone --branch fix/confrontation-clock-recovery-20261008 --single-branch https://github.com/SergeDelor/urae.git eco-system-qualification
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

