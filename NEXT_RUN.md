## Route gratuite préparée — 9 octobre 2026

Le fondateur demande les forfaits gratuits uniquement et la poursuite sans Ubuntu local. Le dossier Codespaces est sauvegardé au commit documentaire **5f34348717fd52836c2f44a92269c2305ff20e00**, sur `evidence/cloud-qualification-20261009-a7c3336` : [procédure](https://github.com/SergeDelor/tontine-platform/blob/5f34348717fd52836c2f44a92269c2305ff20e00/docs/qualification/free-codespaces/README.md). Aucun Codespace n'a été créé ; le calcul/stockage gratuits restants et le blocage des dépenses payantes sont **non vérifiés**. Ne rien démarrer ni activer de budget sur une supposition de disponibilité.

Le contrôleur préparé réutilise le qualificateur canonique sur la candidate a7 gelée, commence par un véritable échange WebKit et le QR Chromium inchangés, puis lance la qualification complète une seule fois après succès. Il publiera les rapports réels dans une nouvelle branche de preuves. À ce stade, analyse du corps JavaScript dans V8 seulement : pas de `node --check`, `bash -n` ni exécution native. Lire `docs/memory/checkpoints/CHECKPOINT-2026-10-09-FREE-CODESPACES-PREPARED.md`. Les échecs Cloud/Windows ci-dessous et la publication HOLD restent inchangés ; un éventuel QR Linux PASS ne prouvera pas la réparation du QR Windows.

## Résultats réels Cloud et diagnostic QR Windows — 9 octobre 2026

Source figée **a7c333699dad0d70cf0de8e2f8a841a00396d0d7**, tree **0c75c80833d78c807cc2fbef082b06f9c0c6aa7f**, PR72 draft. Le Cloud a terminé sa qualification exacte : **657/657 Node, Chromium 8/8 PASS ; WebKit 4 PASS / 2 FAIL, zéro skip ; total FAIL**. Preuve observateurs : trois échecs attendus sur d9 avant correction, trois succès après. Rapport natif a7 SHA-256 **ee7a9fa5a33937b3fb45b98cd18429753b95b32c686816c4c0d01ddaa5e1f0a0** : hash du rapport, pas d'une archive source. Les API RTC Cloud sont natives mais aucun candidat ICE n'est disponible ; Local Room et A01 restent des échecs réels de ce run. Aucune permission réseau ciblée ne permet de corriger cet environnement ; aucun contournement de sandbox ou WebRTC simulé.

Le fondateur a exécuté les six scénarios souverains inchangés dans Chromium Windows : **5 PASS / 1 FAIL, zéro skip**. Vrai DataChannel/paquet Local Room PASS 8,9 s, callbacks A01 PASS 16,5 s ; cache, rechargement hors connexion et override Recap PASS. Le premier QR dépasse les **30 secondes inchangées**. Rapport utilisateur : outputs/eco-sovereign-chromium-diagnostic-2026-10-09T11-34-04-787Z/diagnostic-report.json. Le parent n'a pas lu ni hashé indépendamment ce fichier natif. Ce diagnostic n'exécute pas WebKit et ne remplace pas ses six scénarios. Ubuntu local absent et non demandé.

Le SDK attend les formats BarcodeDetector et l'image avant son timer de scan de 10 secondes ; **la cause du timeout Windows reste non prouvée**. Le nouvel exécuteur Cloud s'est déconnecté avant de créer un processus (409 environment_offline) : QR ciblé et comparaison Worker non exécutés. Ce blocage n'est pas un nouvel échec produit.

Les reçus et le diagnostic passif revu sont sauvegardés sur **evidence/cloud-qualification-20261009-a7c3336**, commit **e71098c5b6ac5cbbc2f23eadddbd7bef3b2d70b5**. Le script observe le SDK automatique puis son vrai Worker sur le même SVG, deux fenêtres de 30 s, sans modifier les résultats natifs ni le test original. Son corps JavaScript a été analysé syntaxiquement ; **Node --check et exécution Windows en attente**. La commande est transmise au fondateur ; sortie directe dans les outputs du chat, aucune récursion PowerShell.

**HOLD, aucune archive qualifiée ni publication.** Dernière production attestée 1.5.2.14-live-sync, FIELD_ACCEPTED=NOT_ACCEPTED, realMoneyEnabled=false ; D1/R2 existants. Aucun achat ni nouveau runner Actions, aucun crédit de réinitialisation utilisé. Les blocs antérieurs sont historiques. Reprise : docs/memory/checkpoints/CHECKPOINT-2026-10-09-CLOUD-RESULTS-WINDOWS-QR.md.

ÉTAT DU PROJET APRÈS ÉTAPE : correctif dépenses validé Node/Chromium, transfert direct Windows réel validé ; WebKit complet non acquis, cause QR à mesurer, livraison toujours HOLD.

## Reprise Windows/Cloud sans Ubuntu local — 9 octobre 2026

Le fondateur demande : « continuons si possible sans Ubuntu ». VirtualMachinePlatform a terminé à 100 % avec succès ; la dernière liste WSL ne contient aucune distribution. Aucune installation Ubuntu locale n'est requise par cette reprise.

Candidate de travail : **a7c333699dad0d70cf0de8e2f8a841a00396d0d7**, branche fix/confrontation-clock-recovery-20261008, PR72 draft. Dernière qualification produit complète exécutée : **9bad483, total FAIL : 657 Node et Chromium 8/8 PASS ; WebKit Windows 4 PASS/2 FAIL**. Les preuves d'échec restent conservées.

Le travail Cloud autorisé existe : conversation 6ac8c4bf-9a24-83ea-b166-c176d065fba7, exécuteur 01a12040-ce4c-73b1-8bbe-6e42bfeab048. Linux/Node 24.19.0, accès de lecture privé et démarrage réel de Chromium/WebKit Playwright 1.56.1 sont confirmés ; WebKit expose les API RTC natives. La qualification complète a commencé sur 8b6e05b ; le SHA candidate ci-dessus a ensuite été transmis pour contrôle distinct. **Aucun résultat complet PASS du nouveau SHA n'est encore acquis.** Le diagnostic Chromium souverain reste complémentaire, qualified=false ; il ne remplace jamais les six scénarios WebKit réels.

Conserver HOLD et la production dernière attestée 1.5.2.14-live-sync, FIELD_ACCEPTED=NOT_ACCEPTED, realMoneyEnabled=false, D1/R2 existants. Aucun achat ni publication effectués. Les blocs antérieurs ci-dessous sont historiques. Reprise détaillée : docs/memory/checkpoints/CHECKPOINT-2026-10-09-WINDOWS-CLOUD-QUALIFICATION.md.

ÉTAT DU PROJET APRÈS ÉTAPE : continuation sans Ubuntu local décidée et environnement Cloud compatible confirmé ; qualification exacte et livraison en attente des preuves réelles.

## Reprise environnement — WSL avance, redémarrage CBS en attente, 9 octobre 2026

La base WSL 3.0.1 est installée. L'activation native de VirtualMachinePlatform a avancé de 37,8 % à 60,4 % (relevé du fondateur), puis **61,0 % observé dans le terminal**. Elle n'est pas encore confirmée terminée. Le diagnostic Windows du 9 octobre à 03:10:56 indique **redemarrage_CBS=true**, redemarrage_Windows_Update=false, BITS/TrustedInstaller/wuauserv tous Running ; l'événement Setup/Servicing 7 est Information et décrit le début d'activation VirtualMachinePlatform. Le dossier CBS est absent ; aucune erreur fatale n'est fournie. Le marqueur CBS ne désigne pas à lui seul la transaction ni la fin de l'activation.

**Suite :** laisser l'opération native qui progresse se terminer ; après message final/retour au prompt, sauvegarder les travaux puis faire un redémarrage Windows normal pour les changements de composants en attente. Après ce redémarrage, vérifier les distributions avec `wsl --list --verbose`, puis seulement préparer l'environnement Linux compatible. Aucune interruption forcée, réparation d'image, modification de service ou exécution Linux n'a été réalisée par l'agent.

La qualification produit reste celle du source **9bad4832f2b53c3fd89c3765b0e24a5318167d7d : Node 657/657, Chromium 8/8, WebKit Windows 4 PASS / 2 FAIL ; total FAIL**. Ni ce diagnostic système ni le redémarrage ne qualifient le produit. Maintenir tous les six scénarios WebKit réels, l'archive après les gates exacts, HOLD, PR72 draft, FIELD_ACCEPTED=NOT_ACCEPTED et realMoneyEnabled=false. Le helper terminal Codex et le quota gratuit Actions restent indisponibles ; aucune minute achetée ni crédit de réinitialisation utilisé.

Détail de reprise : docs/memory/checkpoints/CHECKPOINT-2026-10-09-WSL-REBOOT-PENDING.md. Documentation : https://learn.microsoft.com/en-us/windows/wsl/install et https://learn.microsoft.com/en-us/powershell/dsc/reference/resources/microsoft/windows/rebootpending/ .

ÉTAT DU PROJET APRÈS ÉTAPE : diagnostic système acquis, activation toujours en cours, redémarrage composants signalé, Linux utilisable non confirmé, qualification complète et livraison toujours en attente.

---

# Dernier checkpoint : 07e097588933494dd84d42ecdb92b7894419ae89 (documentation seule après le run exact 9bad483)

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

# Contrôles Node terminés, navigateurs en cours — 9 octobre 2026

Source exacte **9bad4832f2b53c3fd89c3765b0e24a5318167d7d**, qualification native outputs/eco-qualification-2026-10-09T00-52-01-749Z. Preuve réelle des observateurs : avant 3 échecs des assertions attendues / après 3 PASS. **CI gouvernée PASS, 657/657 Node, fail/cancelled/skipped/todo=0, durée des tests 82 131,4998 ms.** La chaîne npm run ci inclut l'audit, TypeScript, architecture, gouvernance, mémoire et couverture des sources ; l'étape Chromium est atteinte après son code de sortie zéro.

**Chromium en cours ; WebKit non encore exécuté ; qualification totale IN_PROGRESS.** Même source immuable pendant ce run, aucune archive qualifiée ni livraison présumée. HOLD et PR72 draft maintenus.

---

# Preuve réelle en cours de qualification — 9 octobre 2026

Source native **9bad4832f2b53c3fd89c3765b0e24a5318167d7d**. Installation verrouillée npm PASS, zéro vulnérabilité signalée. Le vérificateur Node/TypeScript réel confirme : référence d9bc8d9 **3 tests, 3 échecs des bonnes assertions, zéro skip/cancel** ; source corrigé **3 tests, 3 PASS, zéro échec/skip/cancel** ; résultat du vérificateur **PASS**. Rapport réel : outputs/eco-qualification-2026-10-09T00-52-01-749Z/expense-regression/expense-regression-report.json dans le chat. Le terminal app confirme la commande native et la mise à jour fast-forward du checkout. Aucun source ne change pendant ce lancement.

La suite gouvernée **657 Node**, puis **Chromium 8** et **WebKit 6**, est en cours ; aucun résultat final ni archive qualifiée présumé. HOLD et PR72 draft maintenus. Prochaines observations : résumé de CI, puis limites Live inchangées et lectures zéro au repos sur les deux pages. La preuve avant/après valide le défaut des observateurs ; sa contribution à l'échec historique de latence reste non mesurée.

---

# Source à reprendre — 9bad4832f2b53c3fd89c3765b0e24a5318167d7d

## Reprise courante — diagnostic Live réussi, boucle de dépenses corrigée sous qualification, 9 octobre 2026

**Dernier diagnostic réellement exécuté : d9bc8d9de22156f7ab798ef75470fc5ecf3019a3, Chromium 1/1 PASS (1,6 min)**. Les assertions de convergence à cinq secondes n'ont pas été assouplies. Les fragments d'horodatage transmis par le fondateur mesurent, depuis la validation jusqu'à l'affichage Live chez l'autre gestionnaire : 1 000 = **2 733 ms**, 2 001 = **2 162 ms**, 2 002 = **1 830 ms**. Les intentions Outbox correspondantes sont CONFIRMED, attempts=1, APPLIED, versions 1/2/3. Ce diagnostic unique ne remplace pas la qualification complète ; l'échec antérieur e083a6a Chromium 7/8 reste conservé et sa cause exacte n'est pas prouvée par ce PASS.

Les traces montrent aussi des GET répétés de l'endpoint dépenses sur les deux pages, souvent environ toutes les 120 ms, y compris sans saisie. Les identifiants de timeline ne sont pas un nombre de requêtes. Le total exact n'est pas inventé : le long résultat utilisateur est partiellement tronqué et la copie PowerShell de l'attachement profond est inaccessible. Il reste conservé dans les outputs du chat eco-live-diagnostic-20261009-012738 ; le rapport source se trouve dans outputs/eco-live-sync-diagnostic-2026-10-09T00-24-34-168Z de la copie locale de qualification.

Correction ciblée dans apps/web/src/expense-recap-ui.ts : les MutationObserver ignorent les ajouts/retraits de leurs propres cartes de projection et regroupent les déclenchements simultanés. Les vrais changements du récapitulatif, de la séance, du groupe et de la langue conservent leur lecture du service existant. Aucune nouvelle autorité financière ni base. La simulation JavaScript du code reproduit 20 lectures et une relance pendante en 2,4 s avant correction, puis une seule lecture et aucune relance après ; trois scénarios de simulation avant échouent/après passent. **Cette simulation n'est pas une exécution Node, TypeScript ou Playwright réelle.**

Le source préparé ajoute trois tests de comportement du composant réel (idle, changement canonique/contexte, récapitulatif de séance). scripts/verify-expense-recap-regression.mjs exige leurs trois échecs d'assertion sur le SHA d9bc8d9 puis leurs trois succès sur le checkout courant, sans modifier celui-ci. Le scénario Chromium contrôle désormais aussi les lectures des dépenses/ledger pendant une vraie fenêtre idle après ACK, sur les deux gestionnaires ; toutes les anciennes limites cinq/huit secondes sont conservées. Les traces complètes et leur résumé sont écrits par Node à un chemin peu profond, sans récursion PowerShell.

**Qualification du nouveau correctif : NON EXÉCUTÉE.** Attendu : preuve avant/après, **657/657 Node**, **Chromium 8/8**, **WebKit 6/6**, même SHA propre et archive vérifiée. Le nouveau lanceur reçoit --output-root pour sauvegarder directement les rapports et l'archive dans les outputs du chat ; --skip-browser-install évite uniquement de retélécharger les navigateurs déjà installés. Le quota Actions mensuel épuisé et le helper terminal Codex indisponible restent des limitations d'exécution, pas des échecs métier ; aucun achat ni travail Cloud créé.

**HOLD maintenu, PR72 brouillon, 1.5.2.15 non livrée, FIELD_ACCEPTED=NOT_ACCEPTED et realMoneyEnabled=false.** Dernière production attestée : 1.5.2.14-live-sync. Les trois cartes métier, tous les scénarios et les acquisitions Cloudflare/D1/R2 sont préservés. Un attribut de diagnostic saveState demeure QUEUED_OFFLINE dans le run d9 malgré les Outbox CONFIRMED ; ne pas le confondre avec l'autorité financière canonique. Son alignement reste à examiner séparément si une incohérence visuelle est confirmée.

ÉTAT DU PROJET APRÈS ÉTAPE : diagnostic ciblé réel PASS ; défaut de boucle reproduit en simulation et correction sauvegardée ; tests réels du correctif en attente ; aucune promotion de maturité, fusion ou publication.

---

## Diagnostic corrigé — sélection vérifiée avant lancement, 9 octobre 2026

Première tentative sur **ad075a7** : build et closure PWA PASS, puis **No tests found**, **aucun scénario navigateur exécuté**. Erreur du filtre du lanceur, pas un échec métier supplémentaire. Source actuelle **d9bc8d9de22156f7ab798ef75470fc5ecf3019a3** dans PR #72 : filtre non ancré, préflight `--list` exige exactement un test ; résumé exige exactement un scénario exécuté sans skip. En attente du résultat réel ; cinq secondes et zéro polling au repos conservés. HOLD reste actif. Reprise : même checkpoint ci-dessous, actualisé avec ces faits.

---

## État courant — HOLD, résultat local réel et diagnostic Live, 9 octobre 2026

Source exécutée e083a6a : **654 Node PASS / Chromium 7/8 FAIL sur 2001 Live à cinq secondes / WebKit NON EXÉCUTÉ**. La capture montre ensuite 2001 ; cause précise à mesurer. Confrontation 4000/5000 PASS une fois, pas une qualification complète. Source instrumentée **ad075a733f37326e80a0979bc866158ea74f442f**, PR **#72 brouillon**, diagnostic isolé à exécuter avec `scripts/diagnose-live-sync-locally.mjs`. Aucun code métier modifié par ce commit. **Publication HOLD maintenue**, aucune archive qualifiée/livraison ; realMoney=false, FIELD_ACCEPTED=NOT_ACCEPTED. Reprise exacte : `docs/memory/checkpoints/CHECKPOINT-2026-10-09-HOLD-LIVE-SYNC-DIAGNOSTIC.md` ; les blocs suivants sont historiques.

---

## Qualification validée — 1.5.2.15, avant livraison

Source qualifiée : `3f7ea03457bbd936a87e299270843043e2826a24`, PR **#71 fusionnée** dans la branche de livraison par `754a8cef153b7ebe92b993de3b68f7a2c42d9f2d`. Runs **37820287689 SUCCESS** et **37820287701 SUCCESS** : **650/650 Node**, **Chromium 8/8**, **WebKit 6/6**, dont le scénario API inaccessible/navigator online et convergence de la même intention entre deux gestionnaires.

Le job gouverné du run **37820281608** est SUCCESS ; archive source **11567969551**, **1 775 802 octets**, digest artefact `sha256:53a664ea2da558f188aae304fe8da06d2bea52b8bf286955d6a88bfb556e79bc`, contrôle SHA-256 interne et lecture tar PASS. Son troisième job navigateur reste bloqué à l'installation des navigateurs au moment de ce checkpoint ; il n'est pas compté comme un troisième run réussi. Les deux autres workflows complets exécutent les mêmes suites requises.

**Production 1.5.2.15 : NON ENCORE ATTESTÉE**. La source est qualifiée, la livraison code-only doit encore prouver /health du SHA livré. La production antérieure 1.5.2.14 reste la dernière attestée à ce point. FIELD_ACCEPTED=NOT_ACCEPTED ; realMoneyEnabled=false. Les blocs suivants décrivent les checkpoints précédents.

---

## Reprise active — candidate 1.5.2.15, 8 octobre 2026

Le fondateur autorise aujourd'hui l'audit et l'amélioration directe de sa plateforme. Cette autorisation appartient à cette demande ; les anciennes consignes de staging/interdiction de livraison restent historiques et ne remplacent pas la demande humaine actuelle.

Production attestée à la reprise : **1.5.2.14-live-sync**, SHA `d027f09a1382cd29054b33e274f3fd3bf9f8d9f3`, qualification `37765653443 SUCCESS`, livraison `37765653486 SUCCESS`, Worker `98d720dd-6364-436e-9a00-38809e4a3925`. Ces résultats ont été relus dans GitHub Actions. Le nouvel audit n'a pas obtenu de réponse publique avec son outil Web ; il ne revendique pas une seconde lecture indépendante de /health.

Défaut nouveau et reproduit : la relance `eco:transport-retry-ready` réarme le minuteur et réouvre les tentatives Outbox. À serveur indisponible et navigator.onLine=true, le reproducteur exécutant les méthodes/listener extraits de la source donne **9 envois échoués / 8 réveils en 30 secondes** et un minuteur restant. La candidate limite ce scénario à **2 envois / 1 réveil**, sans minuteur restant. Ceci est une preuve déterministe ciblée, pas encore une preuve Node/Playwright ou terrain.

Source candidate : **1.5.2.15-bounded-recovery**, branche `fix/transport-recovery-bounded-20261008`, cache `eco-system-v15215-bounded-recovery-20261008`, rollback v15214 et protections v15213/v15211/v15210. Qualification et déploiement de cette candidate : **À EXÉCUTER, NON ATTESTÉS** à ce checkpoint. Le contrat décrit le code candidat ; il ne prouve pas la version servie.

Audit complet de reprise et limites : `docs/audits/ECO_SYSTEM_AUDIT_2026-10-08.md`. Inventaire des 164 entrées : `docs/audits/ECO_SYSTEM_CAPABILITY_SNAPSHOT_2026-10-08.json`. Le registre classe 155 fondations opérationnelles, 7 capacités dépendantes d'une qualification externe et 2 planifiées ; un libellé FOUNDATION_ACTIVE ne prouve pas tous les parcours utilisateurs.

Même Ledger/D1 `eco-system-db`, même R2 `eco-system-backups`, schéma/politique inchangés, **realMoneyEnabled=false**, **FIELD_ACCEPTED=NOT_ACCEPTED**. Aucun fonds existant n'est modifié par cette reprise. Les sections suivantes documentent l'état antérieur.

---

## Prochaine exécution concrète

1. Vérifier le HEAD de la branche enfant, lancer la CI gouvernée et les vrais scénarios Chromium/WebKit du même SHA, puis lire les erreurs avant toute promotion.
2. Conserver l'archive source SHA-256 du workflow de qualification. Elle sauvegarde le code et la mémoire ; elle n'est pas une sauvegarde des fonds D1. La livraison reste le workflow existant code-only, sans export D1 ni migration.
3. Si les vérifications sont vertes, intégrer dans la branche de livraison existante par avance normale, déclencher son marqueur et vérifier version/build/cache/SHA/catalogue dans /health depuis le workflow. Ne pas fusionner main ni créer un stockage concurrent.
4. Après livraison attestée, ajouter les vrais identifiants de run, SHA, Worker et artefact dans Current Truth, Truth Ledger, Project State, Feature Registry, CIR/Recall et l'audit. Aucune preuve attendue ne vaut preuve obtenue.
5. Poursuivre la recette physique Android 6, anciens Chrome/Opera, iOS natif, 2G et groupes réels ; FIELD_ACCEPTED reste NOT_ACCEPTED jusque-là.
6. Les fournisseurs SMS/WhatsApp/Telegram/email/visio, MFA, Mobile Money, récompenses et fédérations ne deviennent pas fonctionnels par leur seule inscription au catalogue. Qualifier chaque parcours et son fournisseur avant toute annonce complète.
7. Toujours rendre compte des crédits à l'utilisateur. Si l'outil ne fournit pas un coût exact pour ce chat, indiquer « coût exact non exposé » ; les quotas partagés et le solde ne sont pas le coût de la tâche.

---

## Production vérifiée — Eco-System 1.5.2.14, 8 octobre 2026

Version publique : `1.5.2.14-live-sync`. Source servie : `d027f09a1382cd29054b33e274f3fd3bf9f8d9f3`. Branche de livraison : `fix/1.5.2.10-offline-conflicts-loans-20261003`. Worker Version ID : `98d720dd-6364-436e-9a00-38809e4a3925`. PR #70 fusionnée.

Qualification sur le même SHA : run `37765653443 SUCCESS`, **646/646 tests**. Livraison code-only : run `37765653486 SUCCESS`, Chromium **7/7**, WebKit **6/6**, /health exact version/build/cache/SHA, catalogue **164**. Vérification publique indépendante du 8 octobre à 10:52 UTC : même SHA, schéma `d1-additive-20260923`, politique `live-finance-policy-20261007-event-push-repayment`, R2 actif, shell HTML et garde de récupération v15211 présents. `realMoneyEnabled=false`.

Outbox durable, reprise automatique sans navigation forcée, Live entre comptes et appareils, totaux de cellule cohérents, confrontation persistante par cellule/séance et idempotence sont corrigés. Parcours métier, moteurs, politiques et tableaux existants conservés. Présentation des dettes réparée, quatre critères simultanés, ajustement des colonnes fixes sur téléphone.

Le véritable prédécesseur observé en public était la 1.5.2.11, SHA `c0dcb82e24687bb3473b46ccd4c0c77b9e561310`. Son cache est conservé à l’activation avec les références v15213 et v15210 ; ne pas confondre lignée de code et version réellement installée. Aucun export D1, migration, création D1/R2, changement de schéma ou réécriture de données dans cette livraison.

**FIELD_ACCEPTED = NOT_ACCEPTED** : la CI et le smoke ne prouvent pas une recette physique Android 6, anciens Chrome/Opera, iOS ou 2G, ni celle des 25 groupes réels. La suite de travail est une recette ciblée, pas un nouveau déploiement par défaut. Les blocs antérieurs ci-dessous sont historiques.

## À vérifier maintenant sur le terrain

Source de référence : `d027f09a1382cd29054b33e274f3fd3bf9f8d9f3`, déjà livrée et contrôlée. Conserver tous les acquis et utiliser cette source avant toute nouvelle correction.

1. Deux comptes gestionnaires réels : frappe visible, validation reçue sans F5, montants identiques ; un second appareil du même compte reçoit aussi les modifications.
2. Anciens caches installés : ouvrir une fois en ligne pour recevoir le shell 1.5.2.14, saisir hors ligne, F5 au même écran, réouverture puis retour Wi-Fi/cellulaire sans perdre les intentions.
3. Deux corrections contradictoires hors ligne : cellule rouge, comparaison auteur/date, Conserver ou reconfirmer explicitement, décision durable après fermeture, convergence sans additionner les montants.
4. Téléphone ancien/2G : saisie accessible, défilement des totaux, onglets du récapitulatif accessibles, dettes et épargne actualisées.
5. Prêts/remboursements : priorités capital/intérêts, reliquats, catégories indépendantes et absence de doublon en cas de réponse perdue.

Ne pas transformer un succès CI en FIELD_ACCEPTED. Ne pas redéployer pour compléter cette recette seule ; ne pas toucher les données ni recréer les ressources Cloudflare.

---

# NEXT RUN — ECO-SYSTEM 1.5.2.7


## EXÉCUTION SUIVANTE — ECO 1.5.2.11 — DRAFT #66 (2026-10-05)

Vérifier HEAD de `fix/field-regressions-recovery-20261005`, **CI sur SHA strictement identique**, tests Chromium/WebKit, puis `/health` production actuel. **Ne pas annoncer 1.5.2.11 déployée** tant qu'aucun workflow de livraison réussi et aucun smoke SHA ne le prouve. Production connue et séparée : 1.5.2.10, `393f80df88076072317f08adee81fe14d54d06c5`, livraison `37130397965`.

1. **Recette deux gestionnaires avec leurs vrais droits** : frappe, brouillons distincts, auteur/date au survol, réception de `1000→3000` sans F5, absence de GET à cadence fixe, correction après clôture et conflit contradictoire `1000→2000` en deux ordres.
2. **Véritable reprise utilisateur** : anciens caches v15210 déjà installés (sans effacer IndexedDB/outbox), F5 mode avion à l'écran exact, puis changement Wi-Fi ↔ cellulaire avec actualisation ponctuelle sans boucle. Android 6 Chrome, Firefox/Opera/Chrome Windows et Safari/iOS natif. Aucun échec WebKit simulé ne doit être maquillé.
3. **Comptabilité** : remboursement idempotent même si la réponse réseau est perdue ; validation capital/intérêts, deux politiques d'éligibilité S2/S3, report/reliquats, prime 60/20/10/8/2 en simulation, contraintes de caisse et aucun double comptage.
4. **Quotas** : consulter un véritable journal Cloudflare 429/503 et les compteurs D1 avant de prétendre au quota épuisé. Aucune sonde au repos ; le Live reste indépendant des lectures facultatives.
5. **Livraison sous garde-fou** : sans création D1/R2, sauvegardes BIR+ applicables et pré/post vérifiées, CI du même SHA, release cache/manifest/contract cohérents, sauvegarde des données et smoke `/health` avec SHA exact. Jamais fusion/deploy silencieux avant les préconditions documentées. Le nouveau cache est `eco-system-v15211-field-recovery-20261005`, le rollback est `eco-system-v15210-offline-conflicts-loans-20261003`.

`FIELD_ACCEPTED = NOT_ACCEPTED` tant que la recette physique n'a pas été exécutée ; une suite verte seule n'établit pas une livraison terrain.

---

## REPRISE PRIORITAIRE — ECO PR #66 — CLOUDFARE/LIVE ET RECETTE TERRAIN (2026-10-05)

Référence : `fix/field-regressions-recovery-20261005`, revue `docs/recovery/ECO_FIELD_13_POINTS_2026-10-05.md`; base `393f80df88076072317f08adee81fe14d54d06c5`. Dernière preuve CI pré-checkpoint : `9c3ce510f3c2791cbd5c9de81b1e8a77f451b052`, GitHub Actions `37317103271` SUCCESS (590/590 unitaires et tests navigateurs critiques). Vérifier **CI sur HEAD exact après ce checkpoint**.

**Interdictions :** aucune mise en production depuis cette branche, aucune migration, effacement de cache utilisateur, création D1/R2, activation d'argent réel, changement de rubrique/politique non demandé. Ne pas déclarer le quota D1 épuisé sans preuve de réponse ou dashboard Cloudflare.

**Reste à faire :** tests R01–R15 sur véritables comptes A/B et appareils (vrai mode avion F5 avec vieux cache et retour au même écran, brouillons/typing/ACK auteur/date, push après validation, conflits 1000→3000/2000 en deux ordres, Outbox et remboursement sans doublon), simulations comptables S2/S3, règles prêt financement/report/rewards, audit de la consommation réelle en D1 vs WebSocket au repos, puis nouvelle identité release/SW/manifest/contract, backups BIR+/D1/R2 et smoke SHA/health avant toute mise en production. PR **en brouillon**, production **inchangée**.

---

## REPRISE PRIORITAIRE — RECETTE TERRAIN 1.5.2.9 SOVEREIGN OFFLINE (2026-09-28)

Production : `faa23c6b279197b267dd1981529e39b5bd994d62`, Worker `0902744e-3293-448f-ad4c-5f6af2dd4804`, delivery `36380950649 SUCCESS`.

Recette physique sans nouveau déploiement :
1. iPhone/iPad Safari puis PWA installée : ouvrir Eco Relay, tester caméra QR ; si standalone échoue, confirmer Safari + Eco Pack.
2. Appairer 2–3 membres, préparer Broadcast, recevoir chaque capsule, vérifier qu'un téléphone ne stocke que sa capsule.
3. Mode avion : créer/ouvrir exercice, séance, saisir finances, prêt/remboursement/tontine, fermer/réouvrir app, vérifier persistance.
4. Eco Local Room : deux appareils sur même Wi-Fi/hotspot, échange offre/réponse QR, connexion DataChannel, capsule membre, confrontation gestionnaires.
5. Eco Vault : exporter, copier sur autre support, restaurer sur appareil de test, vérifier journal et outbox.
6. Clôture exercice : intérêts, Fonds Secours/Réserve/Bureau, enveloppes, report, exercice suivant.
7. Ne déclarer FIELD_ACCEPTED que pour les éléments physiquement observés.

---

## REPRISE PRIORITAIRE — N° MEMBRES + FINANCE OFFLINE 1.5.2.8 (2026-09-28)

Production vérifiée :
- SHA : `8e8a927ea0f968ce474473f3103cbddc0341a880`
- Worker : `53eca7cc-ca2e-459a-b472-4741dfb9dc61`
- delivery/recovery : **36365348227 SUCCESS**
- backup pré : **10947511514**
- backup post : **10947645903**
- E2E Chromium : **36365348179 SUCCESS**
- WebKit/iOS : **36365348226 SUCCESS**
- argent réel : **OFF**

Recette terrain à faire sans redéploiement préalable :
1. Membres : choisir un classement différent de l'ordre d'inscription, enregistrer 1…N et vérifier qu'il reste identique après fermeture/réouverture.
2. Feuille séance : vérifier visuellement `N° | Membre | rubriques…`.
3. Dictée : dire « Eco, membre numéro 3, Secours 500, Épargne 1000 » et vérifier que la preview pointe vers le membre classé N°3.
4. Couper totalement Internet. Saisir et valider par ✓ puis Entrée une cotisation et une dépense ; recharger la page toujours hors ligne ; les valeurs doivent rester visibles et marquées synchro en attente.
5. Hors ligne : tester aussi une première saisie Prêt et Remboursement. Revenir en ligne puis vérifier un seul replay canonique sans doublon.
6. Refaire fermeture/réouverture après synchronisation et vérifier les mêmes montants.
7. Ne pas déclarer la dictée audio Workers AI comme offline : seule la persistance/validation financière est garantie hors connexion ; la transcription audio cloud exige le réseau.
8. Tout défaut reproductible devient un test avant correction.

---

## REPRISE PRIORITAIRE — PRODUCTION 1.5.2.8 GPS + VOIX (2026-09-28)

Production vérifiée :
- SHA : `4ae39be95d0b3faa16e2d86a95b2d47368eb0945`
- version : `1.5.2.8-geo-directory`
- Worker : `4e92501a-430d-463f-876e-784366a54b38`
- deploy/smoke/recovery : **36362622399 SUCCESS**
- sauvegarde pré : **10946680088**
- sauvegarde post : **10945783708**
- catalogue : **155 actives / 4 structurelles externes / 5 planifiées**
- argent réel : **OFF**

Prochaine action normale : **recette terrain, sans nouveau redéploiement aveugle**.
1. Actualiser/rouvrir la PWA et confirmer le shell 1.5.2.8.
2. GPS : cliquer volontairement « utiliser ma position », autoriser puis refuser/révoquer ; vérifier rayon et fallback localité.
3. Dictée finance : lancer le micro, parler normalement et vérifier que **rien ne s'écrit pendant l'enregistrement**.
4. Appuyer sur **Arrêter** ; vérifier qu'une seule transcription finale apparaît puis qu'une prévisualisation propose membre, séance, rubriques et montants.
5. Cas de référence : « Eco, chez Serge, Secours 500, Épargne 1000, Remboursement 5000 ». Vérifier l'absence de « écho » parasite entre les mots et corriger toute ambiguïté dans la preview avant validation.
6. Tester bruit réel, Chrome/Opera, mobile et appareil Android ancien. Sur navigateur sans MediaRecorder, le fallback SpeechRecognition doit rester final-only et sans boucle de redémarrage.
7. Vérifier qu'aucune écriture n'est créée tant que la prévisualisation n'est pas confirmée.
8. Tout défaut reproductible devient d'abord un test permanent ; ne pas réécrire Ledger, tableaux, Meeting owner, Discovery ou GPS déjà qualifiés.

Ne pas promouvoir artificiellement SMS / WhatsApp provider / Telegram / Email sans fournisseur réel. Ne pas déclarer FIELD_ACCEPTED à partir du CI/smoke seul.

---

Point de reprise exact : branche `finish/live-whatsapp-completion-20260927`.

1. Exiger une qualification verte sur le HEAD final.
2. Fusionner PR #29 dans `audit/live-completion-20260926`.
3. Vérifier la qualification du nouveau HEAD audit, puis fusionner PR #28 dans `fix/1.5.2.6-field-persistence-pc-mobile-20260925`.
4. Le marqueur `.github/DEPLOY_ECO_SYSTEM_1_5_2_7_LIVE_ONCE` doit déclencher `.github/workflows/deploy-1.5.2.7-live-completion.yml`.
5. Exiger : npm CI + build + tests navigateur, sauvegarde D1 pré, migrations additives seulement, déploiement, /health + catalogue 164, realMoney=false, sauvegarde post + restauration SQLite integrity_check=ok.
6. Après succès, consigner le SHA déployé, run, Worker version et artifacts de sauvegarde dans CURRENT_TRUTH/PROJECT_STATE.
7. Recette terrain ensuite seulement : Chrome/Opera PC, Android 6, offline/outbox, deux gestionnaires Live, WhatsApp Share Out, Aide locale/Collation comme rubriques principales.

Ne pas activer artificiellement les connecteurs externes SMS/WhatsApp provider/Telegram/Email ni les domaines planifiés sans moteur/fournisseur réel.


# ECO-SYSTEM — NEXT RUN

## CURRENT OVERRIDE — 1.5.0 audit implementation (2026-09-23)

Branche : `next/1.5.0-audit-complete-platform-20260923`. Production 1.4.5 reste inchangée.

Reprise obligatoire :
1. lire `docs/implementation/ECO_SYSTEM_1.5.0_FULL_IMPLEMENTATION_SCOPE_2026-09-23.md` ;
2. relever le HEAD distant 1.5.0 et la dernière CI ;
3. corriger toute erreur CI avant nouveau lot ;
4. poursuivre L1 : CAS/version de cellule + concurrence D1 + revue après clôture ;
5. ne pas déployer avant qualification complète + BIR+ pré ;
6. préserver tous les acquis indiqués dans AGENTS/CURRENT_TRUTH et `realMoneyEnabled=false`.

Commits acquis de ce démarrage : correction intérêts après capital nul ; tests runtime prêt ; contrat correction financière atomique ; branchement Worker ; persistance outbox avant transport ; confrontation offline sur baseline ; tests/CI 1.5.0.

---


## CURRENT OVERRIDE — Reprise après production 1.4.5 (2026-09-22)

Production actuelle :
- version `1.4.5-final-mega-offline-governance`
- source `463035adab2303874878c8e72f1965475ac0b209`
- branche `next/1.4.5-final-mega-offline-governance-20260921`
- Worker Version ID `29c8f0e2-1cb1-4361-8481-27b514906fcf`
- qualification push/PR : `35713621161 SUCCESS` / `35713626133 SUCCESS`
- déploiement + smoke + BIR+ : `35713621388 SUCCESS`
- tests : **298/298 PASS**
- D1 `eco-system-db` : aucune migration
- R2 `eco-system-backups` : pré/post miroirs PASS
- artifacts : pré `10688266480`, post `10688236533`
- argent réel : **OFF**

Ordre obligatoire de la prochaine reprise :
1. ne pas redéployer avant la recette terrain ;
2. sur PC, vérifier menus Prêts/Épargne/Assistances/Rubriques/Fiches membres/Corbeille ;
3. vérifier feuille récapitulative par défaut dans Séances + Recap ;
4. vérifier « Saisir/corriger » sur la séance exacte ;
5. avec deux comptes gestionnaires, reproduire 1000 → 500 et vérifier qu'aucun 1500 n'apparaît ;
6. vérifier alertes vertes pendant séance ouverte et orange/rouge après clôture ;
7. modifier une séance clôturée et vérifier l'alerte responsables/membre selon donnée touchée ;
8. tester Retour depuis chaque navigation/hypertexte observé ;
9. tester corbeille séance/membre/rubrique + restauration ;
10. Android 6 : mettre à jour une fois vers le shell 1.4.5, puis couper le réseau et tester navigation/compte local/saisie ;
11. iOS : seulement quand un iPhone réel est disponible ; ne pas déclarer FIELD_ACCEPTED avant ce test ;
12. cas « appareil n'ayant jamais reçu Eco-System et zéro Internet » : livrer/tester un paquet physique installable avant de déclarer ce scénario totalement résolu.

Garde-fous : Ledger unique append-only ; correction par contrepassation ; pas de second Meeting owner ; pas de second moteur Prêt/Épargne/Assistance ; CRDT jamais pour l'argent ; Live n'est pas l'autorité canonique ; suppression définitive manuelle interdite ; real money OFF.

---

## CURRENT OVERRIDE — 1.4.2 PWA visibility hotfix (2026-09-20)

Current production source: `a9fe00f94daa7a6787d5a4440a5edc0bc5e4a1c8` on `next/1.4.2-operational-center-sessions-blueprint-20260920`.

Verified evidence:
- qualification exact production SHA: `35499693852 SUCCESS`;
- deploy + smoke + pre/post BIR+: `35499693884 SUCCESS`;
- pre artifact: `10602035551`;
- post artifact: `10602215385`;
- runtime version remains `1.4.2-operational-center-sessions-blueprint`;
- real money remains OFF.

The hotfix only activates the already-defined Service Worker update path so a previously stale 1.4.1 PWA shell can converge to deployed 1.4.2. Do not change D1, Ledger, business rules, cache identity or release identity to address this issue.

Next normal action:
1. founder field reception on the real phone/browser;
2. confirm visible **Centre opérationnel** + separate **Séances**;
3. exercise the 8 Sessions sections;
4. test Blueprint DRAFT → human validation → ACTIVE with no silent transaction;
5. convert every reproducible defect into a permanent test before a targeted correction.

Do not redeploy merely because this document changed.

---


Date : 2026-09-20

## Lecture obligatoire
1. `AGENTS.md`
2. `docs/memory/CURRENT_TRUTH.md`
3. `PROJECT_STATE.md`
4. `docs/memory/PROJECT_TRUTH_LEDGER.json`
5. socle constitutionnel **2.3.4**
6. `docs/constitution/ECO_SYSTEM_Cahier_des_Charges_Maitre_Exhaustif_3.2.0_2026-09-16.md`
7. `docs/memory/recalls/RECALL-2026-09-17-master-2.3.4-closure.md`
8. `docs/change-impact/CIR-2026-09-17-master-2.3.4-closure.md`
9. `FEATURE_REGISTRY.yaml`
10. derniers runs GitHub et état Cloudflare réel.

## Branche de reprise
`next/1.4.2-operational-center-sessions-blueprint-20260920`

Toujours récupérer le HEAD distant réel avant toute modification.

## Production actuelle
- version : **1.4.2-operational-center-sessions-blueprint**
- source déployée : `61a6d83ac5793bb5fecac7ba77a7bd4149031e27`
- Worker Version ID : `b54df0a5-2338-4e37-8b4d-a05351b43658`
- production + smoke + BIR+ pré/post : **35497930031 SUCCESS**
- qualification du SHA déployé : **35497930024 SUCCESS**
- tests : **264/264 PASS**
- D1 : `eco-system-db` réutilisée ; **No migrations to apply**
- R2 : `eco-system-backups` ; pré/post BIR+ restaurés, checksummés et remirrored
- Premium Live / Founder Control / Community Realtime / R2 : actifs/bound
- `realMoneyEnabled=false`.

## Invariants à ne plus casser
- seules **Votre feuille de séance** et **Vos fiches individuelles** sont les surfaces normales de saisie financière membre ;
- toute rubrique créée et non archivée apparaît dans les deux feuilles ;
- 20 rubriques n'est pas une règle : 1 et 40 sont testées ; le plafond 100 est une limite technique de lancement, pas une décision métier du groupe ;
- Prêt / Remboursement / Remboursement intérêts restent des rubriques des feuilles ;
- le capital restant génère l'intérêt de chaque nouvelle période ; un remboursement partiel réduit l'assiette suivante ;
- intérêts impayés séparés, jamais capitalisés ;
- deux politiques officielles : `CAPITAL_FIRST` et `INTEREST_FIRST` ;
- si la politique le demande, nouveau prêt impossible avant apurement capital + intérêts ;
- un membre simple voit sa propre fiche et ses propres prêts, jamais ceux d'un autre membre ;
- Ledger D1 canonique unique ; Live reste projection/coordination.

## Exemple de contrôle permanent
50 000 XAF à 5 %, paiements 0 / 30 000 / 20 000 :
- Capital d'abord → fin mois 3 : capital 0, intérêts 6 000 ; mois 4 : 6 000 à payer, sans nouvel intérêt.
- Intérêts d'abord → fin mois 3 : capital 6 250 ; mois 4 : intérêt théorique 312,5, arrondi entier XAF actuel 313 ; total 6 563.

## Prochain chantier
**Recette terrain production 1.4.0, puis corrections ciblées uniquement.**
1. créer/tester groupe avec un nombre choisi de rubriques ;
2. vérifier la même liste dans les deux feuilles ;
3. vérifier compte membre simple et confidentialité ;
4. saisir Prêt, remboursement capital, remboursement intérêts depuis les feuilles ;
5. comparer les deux systèmes puis valider la politique du groupe ;
6. faire vivre un prêt sur plusieurs séances et confronter la matrice réelle ;
7. transformer chaque défaut observé en test permanent.

## Anti-interruption
Commit atomique → CI exacte → Truth → BIR+ avant production → smoke → BIR+ post-production. Ne jamais déclarer « terminé » si le site public n'a pas reçu le SHA concerné.


## Point de reprise immédiat — tranche terrain ciblée

Continuer exclusivement depuis `next/1.4.0-master-2.3.4-closure-20260917`.

Ordre obligatoire :
1. conserver le périmètre ciblé de la tranche 6 ;
2. obtenir CI verte sur le HEAD documentaire final ;
3. lancer BIR+ ;
4. déployer la même ligne 1.4.0 ;
5. smoke production : deux feuilles visibles, pop-up cellule, Membres & habilitations, Back-office, Tontines / montant total du pot, matrice Prêt ;
6. BIR+ de fermeture puis mise à jour de la vérité de production.

## Reprise 1.4.1 — 2026-09-20

La branche active et production courante est :
`next/1.4.1-field-integrity-guardrails-20260919`.

Version :
`1.4.1-field-integrity-home-sessions`.

Production vérifiée :
- source : `024b9837b6fa577c0c2c39297c2ce672f7d130b3` ;
- Worker : `d4e56867-077c-47cd-bfc9-9aba4735d596` ;
- qualification : `35488899790 SUCCESS` ;
- déploiement + smoke + BIR+ pré/post : `35488899806 SUCCESS`.

Ordre obligatoire suivant :
1. terminer le BIR+ de fermeture du checkpoint documentaire post-déploiement ;
2. faire la recette terrain Bureau puis membre ;
3. tester correction 2 000 → 5 000 + revue indépendante ;
4. tester présence et bénéficiaire + confirmation/papier/photo ;
5. vérifier qu'un membre simple ne voit que ses propres dettes ;
6. couper le réseau après synchronisation et vérifier la dernière copie connue ;
7. tester la dictée en environnement réellement bruyant ;
8. tester la matrice Prêt avec un utilisateur senior ;
9. transformer tout défaut reproductible en test permanent avant correction.

Ne pas rouvrir les moteurs déjà qualifiés sans défaut reproductible. Le smoke production ne vaut pas recette terrain.

## Checkpoint de fermeture acquis
- checkpoint : `4edf2dcb27c54303becce71ac9bd5b7db2c50496`
- CI : `35489112828 SUCCESS`
- BIR+ fermeture : `35489112862 SUCCESS`
- artifact : `10598209553`
- R2 final : `birplus/1.4.1/4edf2dcb27c54303becce71ac9bd5b7db2c50496/final/`

Reprendre directement par la recette terrain 1.4.1 ; ne relancer ni D1 ni déploiement sans défaut reproductible.

## Reprise 1.4.2 — production vérifiée, recette terrain à faire

Branche :
`next/1.4.2-operational-center-sessions-blueprint-20260920`

Version :
`1.4.2-operational-center-sessions-blueprint`

Preuves production :
- source déployée : `61a6d83ac5793bb5fecac7ba77a7bd4149031e27` ;
- qualification : `35497930024 SUCCESS` ;
- deploy/smoke/BIR+ pré/post : `35497930031 SUCCESS` ;
- Worker Version ID : `b54df0a5-2338-4e37-8b4d-a05351b43658` ;
- 264/264 tests ;
- aucune migration D1 à appliquer ;
- BIR+ pré/post R2 : PASS ;
- argent réel : OFF.

Ordre obligatoire suivant :
1. BIR+ de fermeture 1.4.2 **ACQUIS** : run `35498239942 SUCCESS`, artifact `10601038586`, R2 `birplus/1.4.2/d1a69bb5c904268d5f16fc2421e2246154000598/final/` PASS ;
2. recette terrain sur le téléphone du fondateur : distinguer visuellement **Centre opérationnel** et **Séances** ;
3. parcourir les huit sections Séances : vue d'ensemble, feuille, présence, bénéficiaires/preuves, obligations/impayés, caisse, actions/PV/historique selon les droits ;
4. confirmer la lisibilité des onglets/navigation mobile sans disparition de fonctionnalité ;
5. vérifier qu'une présence saisie depuis les parcours disponibles aboutit toujours à MeetingService ;
6. tester le Blueprint : brouillon → validation humaine → owner canonique, sans création silencieuse de transaction ;
7. tester les presets Forum/Communautés ;
8. tester le Financial Lab sur plusieurs scénarios et vérifier l'absence de verdict automatique ;
9. vérifier que les acquis 1.4.1 restent intacts : deux feuilles, correction indépendante, confidentialité membre, preuves bénéficiaire, offline, prêts/intérêts ;
10. pour chaque défaut reproductible : test permanent → correction ciblée → CI → vérité → sauvegarde.

Ne pas déclarer FIELD_ACCEPTED à partir du smoke seul. Ne pas réintroduire un second Ledger, un second Meeting owner, un second Marketplace/Forum, ni Eco Route/Backhaul dans Eco-System.


## Checkpoint de fermeture 1.4.2 acquis
- checkpoint : `d1a69bb5c904268d5f16fc2421e2246154000598`
- CI : `35498239952 SUCCESS`
- BIR+ fermeture : `35498239942 SUCCESS`
- artifact : `10601038586`
- R2 final : `birplus/1.4.2/d1a69bb5c904268d5f16fc2421e2246154000598/final/`

Reprendre directement par la recette terrain 1.4.2 ; ne redéployer que pour un défaut reproductible et couvert par test permanent.


## Reprise après clôture 1.4.2 post-hotfix
- production : `1.4.2-operational-center-sessions-blueprint`
- source : `a9fe00f94daa7a6787d5a4440a5edc0bc5e4a1c8`
- Worker : `6c7b4be2-7daa-4f15-ae11-0861d248f60a`
- HEAD documentaire final : `d686929b44bf9f5f61ddee2ddee434e891c39afb`
- CI finale : `35499946396 SUCCESS`
- BIR+ final : `35499946216 SUCCESS`
- artifact : `10600699685`
- prochaine action : recette terrain Centre opérationnel + Séances + Blueprint + Communautés sur téléphone/ordinateur ; aucun redéploiement avant défaut reproductible.

## Reprise après production 1.4.3 — 2026-09-21

Production :
- `1.4.3-blueprint-5-0-0-finalized`
- branche : `next/1.4.3-blueprint-5-0-0-finalization-20260921`
- source déployée : `96b8f41467af476b12179b786d7d8f140ef86ce7`
- Worker : `07939344-ceca-4578-bc3b-3d1d589ad7eb`
- deploy/smoke/BIR+ pré-post : `35560714108 SUCCESS`
- 265/265 tests PASS
- D1/R2 historiques conservés
- argent réel OFF.

Reprendre par :
1. recette téléphone : badge 1.4.3, Centre opérationnel, Séances distinctes, barre mobile lisible ;
2. recette Blueprint 5.0.0 ;
3. recette Hubs Business/Formation/Impact/Créateurs et posts contextuels ;
4. test groupe + membre + offline ;
5. consigner tout défaut reproductible et écrire le test avant correction.

Ne pas réintroduire Backhaul/Eco Route dans Eco-System.



## Reprise candidat 1.5.2.7 — 2026-09-27

Point de départ :
- branche : `finish/live-whatsapp-completion-20260927`
- PR #29 : ouverte vers `audit/live-completion-20260926`
- runtime : `1.5.2.7-live-completion`
- qualification de référence : run **#397 / 36353667354 SUCCESS**
- catalogue : **154 FOUNDATION_ACTIVE / 5 STRUCTURAL_V1 / 5 PLANNED_DOMAIN**
- real money : **OFF**

Ordre obligatoire de finalisation :
1. qualifier les commits documentaires de fermeture ;
2. ne fusionner PR #29 que si la CI reste verte ;
3. qualifier PR #28 avec la tête intégrée avant fusion dans `fix/1.5.2.6-field-persistence-pc-mobile-20260925` ;
4. utiliser un workflow de déploiement 1.5.2.7 dont les attentes correspondent exactement à :
   - version `1.5.2.7-live-completion` ;
   - build ID `eco-system-1.5.2.7-20260927` ;
   - PWA cache `eco-system-v1527-live-completion-20260927` ;
   - SHA exact de livraison ;
   - `realMoneyEnabled=false` ;
5. BIR+ pré-déploiement → migrations additives seulement → deploy → smoke root/health/catalog → BIR+ post et restauration/integrity check ;
6. recette terrain : Chrome + Opera PC, mobile, offline, reprise réseau, deux gestionnaires Live sans rafraîchissement, WhatsApp handoff/deep return, saisies financières/Entrée, Aide locale/Collation/Main levée, séances/prêts/dettes ;
7. ne marquer FIELD_ACCEPTED qu'après constat réel.

À ne pas « compléter » artificiellement :
- `GEO.DIRECTORY` tant que la géolocalisation appareil consentie n'est pas implémentée/qualifiée ;
- SMS/WhatsApp provider/Telegram/Email sans fournisseur configuré ;
- vidéo, rewards, Mobile Money, MFA et fédération tant que leurs dépendances réelles ne sont pas présentes.


## Reprise après production 1.5.2.7 — 2026-09-27

Production :
- version : `1.5.2.7-live-completion`
- source déployée : `c0dcbfa4391b46773d1e2c8d6b9733cc5d8b367c`
- Worker : `0c06d6f3-382c-4433-91b4-b071c0573ccd`
- qualification : **36354372028 SUCCESS**
- E2E financier navigateur : **36354371970 SUCCESS**
- deploy/smoke/recovery : **36354371977 SUCCESS**
- pre-recovery : artifact **10943029509**
- post-recovery : artifact **10942949813**
- D1 : aucune migration à appliquer
- R2 : actif
- catalogue : 164
- real money : OFF

Prochaine action normale : **recette terrain**, pas nouveau chantier technique aveugle.
1. Chrome PC puis Opera PC : connexion, navigation, saisies financières, Enter, modifications, totaux, scroll.
2. Mobile : shell 1.5.2.7, installation PWA, navigation senior/novice, saisie et retour.
3. Offline : saisie → validation locale → outbox → retour réseau → confirmation serveur sans doublon.
4. Deux gestionnaires : modification d'une cellule/session sur A → réception proactive sur B sans refresh ; réserve/confrontation si désaccord.
5. WhatsApp : partage volontaire → ouverture deep link → authentification éventuelle → retour sur l'objet exact.
6. Rubriques : confirmer Collation/Ration/Aide locale au même niveau principal ; Main levée dans Assistance/Solidarity ; « Autres » réservé aux petites rubriques correspondantes.
7. Prêts/dettes/intérêts : simulation, décaissement négatif, intérêts après clôture, situation membre.
8. Documenter tout défaut reproductible ; écrire/adapter le test permanent avant correction.

Ne pas activer artificiellement GPS, SMS/WhatsApp provider/Telegram/Email, vidéo, rewards, Mobile Money, MFA ou fédération tant que leurs dépendances réelles ne sont pas présentes.
