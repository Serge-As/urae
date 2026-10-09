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

## Production vérifiée — Eco-System 1.5.2.14, 8 octobre 2026

Version publique : `1.5.2.14-live-sync`. Source servie : `d027f09a1382cd29054b33e274f3fd3bf9f8d9f3`. Branche de livraison : `fix/1.5.2.10-offline-conflicts-loans-20261003`. Worker Version ID : `98d720dd-6364-436e-9a00-38809e4a3925`. PR #70 fusionnée.

Qualification sur le même SHA : run `37765653443 SUCCESS`, **646/646 tests**. Livraison code-only : run `37765653486 SUCCESS`, Chromium **7/7**, WebKit **6/6**, /health exact version/build/cache/SHA, catalogue **164**. Vérification publique indépendante du 8 octobre à 10:52 UTC : même SHA, schéma `d1-additive-20260923`, politique `live-finance-policy-20261007-event-push-repayment`, R2 actif, shell HTML et garde de récupération v15211 présents. `realMoneyEnabled=false`.

Outbox durable, reprise automatique sans navigation forcée, Live entre comptes et appareils, totaux de cellule cohérents, confrontation persistante par cellule/séance et idempotence sont corrigés. Parcours métier, moteurs, politiques et tableaux existants conservés. Présentation des dettes réparée, quatre critères simultanés, ajustement des colonnes fixes sur téléphone.

Le véritable prédécesseur observé en public était la 1.5.2.11, SHA `c0dcb82e24687bb3473b46ccd4c0c77b9e561310`. Son cache est conservé à l’activation avec les références v15213 et v15210 ; ne pas confondre lignée de code et version réellement installée. Aucun export D1, migration, création D1/R2, changement de schéma ou réécriture de données dans cette livraison.

**FIELD_ACCEPTED = NOT_ACCEPTED** : la CI et le smoke ne prouvent pas une recette physique Android 6, anciens Chrome/Opera, iOS ou 2G, ni celle des 25 groupes réels. La suite de travail est une recette ciblée, pas un nouveau déploiement par défaut. Les blocs antérieurs ci-dessous sont historiques.

---

# CURRENT AUTHORITY — RELEASE CONTRACT (2026-09-28)


## Addendum 2026-10-05 — candidate 1.5.2.11, ne pas confondre avec la production

Dernier code en production prouvé par GitHub Actions : **1.5.2.10** SHA `393f80df88076072317f08adee81fe14d54d06c5`, livraison `37130397965` SUCCESS le 3 octobre. La PR #66 ajoute une reprise terrain avec push WebSocket sans polling D1, signaux de saisie/brouillons, anti-conflit et Outbox, un contrôle de quota explicite et réduction des lectures facultatives. L'identité de **candidate 1.5.2.11** est cohérente Worker/build/cache/query/contrat, mais **aucun déploiement ni FIELD_ACCEPTED n'est attesté**. Ne pas modifier les fonds ni vider les caches des anciens utilisateurs. Voir `PROJECT_STATE.md`, `NEXT_RUN.md` et `docs/recovery/ECO_FIELD_13_POINTS_2026-10-05.md` pour tests non couverts.

---

La vérité d'identité courante est désormais machine-lisible dans `docs/release/CURRENT_RELEASE_CONTRACT.json`. Les blocs « CURRENT OVERRIDE » ci-dessous sont conservés comme historique de livraisons et ne doivent plus être interprétés, par leur seule position, comme le SHA actuellement servi.

Le SHA de production est autoritatif uniquement lorsque **le workflow de livraison du même SHA est SUCCESS** et que `/health.commitSha` répond exactement ce SHA avec la version, le build, le schéma, la politique et le cache du contrat. `FIELD_ACCEPTED` reste **NOT_ACCEPTED** tant qu'une recette physique séparée n'a pas été constatée sur les appareils ciblés.

---

## CURRENT OVERRIDE — 1.5.2.9 SOVEREIGN OFFLINE + BROADCAST QR + iOS — PRODUCTION VERIFIED (2026-09-28)

Production publique : `1.5.2.9-sovereign-offline`, SHA exact `faa23c6b279197b267dd1981529e39b5bd994d62`, Worker Version ID `0902744e-3293-448f-ad4c-5f6af2dd4804`, PWA cache `eco-system-v1529-sovereign-offline-20260928`.

PR #34 fusionnée : cycle offline souverain, journal local chaîné, Eco Vault, cycle d'exercice multi-années, Tontines/pots, prêts/remboursements, épargne/custody/solidarité local-first, calculs d'intérêts et reports sur appareil, Eco NumPad sans IA, capsules privées membres, Eco Broadcast QR ciblé, Eco Pack, Eco Local Room WebRTC/DataChannel, confrontation de journaux gestionnaires.

Preuves de qualification fusion : souverain+iOS `36377291009 SUCCESS`, WebKit smoke `36377291065 SUCCESS`, financier P0 `36377290960 SUCCESS`. Livraison Cloudflare : `36380950649 SUCCESS`. Le workflow a imposé CI complet, Chromium, WebKit/iOS, résolution D1/R2 existants, backup pré, migrations additives, déploiement, smoke SHA/version/build/cache/catalogue, backup post et restauration SQLite.

Récupération : backup pré artifact `10952617232`, backup post artifact `10952876681`, `PRAGMA integrity_check=ok`. D1 `eco-system-db` réutilisée, aucune migration, R2 `eco-system-backups` actif, catalogue 164, real money OFF.

iOS/WebKit : décodeur QR embarqué sans BarcodeDetector, assets Sovereign/Relay/Local Room/NumPad cachés pour mode avion, test WebKit offline cache vert, offre/réponse Eco Local Room + RTCDataChannel + paquet échangé sous WebKit, `playsinline`, arrêt caméra au background, fallback plein écran CSS, fichier via Web Share si disponible sinon téléchargement. Limite terrain : certains iPhone/iPad peuvent encore subir un bug WebKit `getUserMedia` en PWA standalone ; Safari et Eco Pack sont les fallbacks prévus. FIELD_ACCEPTED caméra réelle reste à constater sur appareils physiques.

Eco Broadcast : appairage membre individuel puis diffusion collective de trames `ECOB2` ciblées ; chaque téléphone ignore les 79/119 autres membres avant stockage et ne reconstruit que sa capsule. Garde-fou applicatif : maximum 120 membres par broadcast. Pour grands groupes, la durée optique dépend du volume réel de chaque capsule et du nombre de trames ; ne pas promettre une diffusion « instantanée ».

---

## CURRENT OVERRIDE — N° MEMBRES + FINANCE OFFLINE ÉTENDUE — PRODUCTION VERIFIED (2026-09-28)

La production publique sert le SHA exact `8e8a927ea0f968ce474473f3103cbddc0341a880`, Worker `53eca7cc-ca2e-459a-b472-4741dfb9dc61`, toujours sous `1.5.2.8-geo-directory`.

La PR **#33** a complété la numérotation déjà existante : le N° correspond désormais au classement explicite du responsable, est persistant et audité, peut être enregistré hors connexion, apparaît dans une colonne **N°** distincte avant le nom dans la feuille financière, et alimente les alias vocaux `membre numéro N`. Le moteur de mention vocale a aussi été corrigé pour les noms avec tiret.

La finance offline couvre désormais les cotisations, corrections de cellule, dépenses/sorties, prêts et remboursements. `FINANCIAL_SHEET_ENTRY_V1` est durable dans IndexedDB, restauré après reload offline et rejoué idempotemment à la reconnexion. Le scénario navigateur réel contribution + dépense -700 → reload offline → reconnexion → persistance serveur unique est vert.

Preuves : PR CI **36365129048 SUCCESS** ; post-fusion **36365206808 SUCCESS** ; E2E financier **36365206898 SUCCESS** ; WebKit/iOS **36365206944 SUCCESS** ; livraison/recovery **36365348227 SUCCESS** ; E2E SHA livraison **36365348179 SUCCESS** ; WebKit SHA livraison **36365348226 SUCCESS**. Backup pré **10947511514**, post **10947645903**, restauration `integrity_check=ok`. D1 existante, aucune migration, R2 actif, catalogue 164, argent réel OFF.

Limite à préserver : la persistance et validation financière sont offline, mais la transcription audio Workers AI/Whisper reste une dépendance réseau et ne doit pas être déclarée offline.

---

## CURRENT OVERRIDE — 1.5.2.8 GPS + DICTÉE FINANCIÈRE POST-STOP — PRODUCTION VERIFIED, FIELD ACCEPTANCE PENDING (2026-09-28)

La production publique sert `1.5.2.8-geo-directory` depuis le SHA exact `4ae39be95d0b3faa16e2d86a95b2d47368eb0945` (Worker `4e92501a-430d-463f-876e-784366a54b38`). Le workflow **36362622399** a réussi qualification complète, tests navigateur, sauvegarde D1 pré, réutilisation D1/R2 existants, déploiement, smoke exact, sauvegarde post et restauration SQLite `integrity_check=ok`.

Catalogue : **164 capacités = 155 FOUNDATION_ACTIVE, 4 STRUCTURAL_V1, 5 PLANNED_DOMAIN**. `GEO.DIRECTORY` est actif avec consentement explicite, rayon, fallback localité et projection publique grossière/révocable. Les quatre structurelles restantes sont les fournisseurs externes SMS, WhatsApp provider, Telegram et Email.

Le défaut terrain de dictée financière « Eco/écho répété entre les mots » est corrigé architecturalement : le chemin principal enregistre d'abord l'audio en mémoire, n'écrit rien pendant la parole, transcrit après Arrêter via Whisper Large V3 Turbo, nettoie les répétitions de wake-word, résout les vrais membres/rubriques/séances puis impose la prévisualisation avant toute mutation canonique. Le fallback navigateur est final-only et ne redémarre plus automatiquement.

Preuves : qualification branche **36362304494 SUCCESS**, PR #31 **36362426602 SUCCESS**, post-fusion **36362508633 SUCCESS**, E2E financier **36362508651 SUCCESS**, delivery/recovery **36362622399 SUCCESS**. Backups : pré **10946680088**, post **10945783708**. Argent réel reste **OFF**.

`FIELD_ACCEPTED` n'est pas déclaré : GPS et microphone doivent encore être constatés physiquement sur les appareils du fondateur, notamment bruit réel, Chrome/Opera, Android ancien, permission/refus GPS et exactitude membre-rubrique-séance.

---

## CURRENT OVERRIDE — 1.5.2.7 LIVE COMPLETION — RELEASE CANDIDATE QUALIFIÉE (2026-09-27)

**Repository : `SergeDelor/tontine-platform`.**
**Branche candidate : `finish/live-whatsapp-completion-20260927`.**
**Chaîne d’intégration : PR #29 → `audit/live-completion-20260926`, puis PR #28 → `fix/1.5.2.6-field-persistence-pc-mobile-20260925`.**
**Release candidate : `1.5.2.7-live-completion` · build `eco-system-1.5.2.7-20260927` · cache PWA `eco-system-v1527-live-completion-20260927`.**

### Vérité fonctionnelle
- Live proactif : reconnexion, heartbeat, rattrapage paginé et réinjection des événements durables dans les écrans sans rafraîchissement manuel.
- WhatsApp : partage utilisateur/deep-link opérationnel. Le connecteur fournisseur WhatsApp automatisé reste une dépendance externe et n’est pas déclaré actif.
- Registre : **164 capacités**, dont **155 FOUNDATION_ACTIVE**, **4 STRUCTURAL_V1 externes** (SMS, WhatsApp provider, Telegram, Email) et **5 PLANNED_DOMAIN** (vidéo, rewards, Mobile Money, MFA, fédération de groupes).
- Recherche universelle, calendrier unifié, groupe hybride, Starter Kit, Document Studio, Verification Center, Founder AI, Data Quality, Paper Bridge/Print, mandats, Opportunity Graph, Value Discovery, Market Intelligence, Quiet Watch, appels d’offres, micro-annonces, registres métier, Time Machine non destructif, succession, dashboards par rôle, annuaire local, profil public opt-in, Creator Studio et Talent ont des parcours spécialisés.
- Prépaiements : entrée Ledger une seule fois ; l’affectation future ne recrée aucune recette.
- Reprise après clôture : quorum par comptes authentifiés distincts lorsque la politique l’exige ; nommer un approbateur ne vaut jamais approbation.
- Enveloppes : budgets/classification sans mouvement de caisse. Wallet interne : custody comptabilisée dans le Ledger, distincte de Mobile Money.
- Trust Graph / fiabilité : preuves comportementales contextualisées, explicables et advisory-only ; aucune décision automatique de prêt, admission ou exclusion.
- **Rubriques : Aide locale est une rubrique principale de nature CONTRIBUTION, au même niveau métier que Collation/Ration ; Main levée est une rubrique principale LEVY. Elles ne relèvent jamais du menu « Autres ». « Autres » reste réservé aux petites sous-rubriques (Inscription, Timbre, Amendes, etc.).**
- Les tableaux financiers canoniques, saisie ✓/Entrée, remplacement exact, offline/outbox, prêts/dettes/intérêts et Live existants ne doivent pas être réécrits ni remplacés.
- Argent réel : **OFF**. D1 canonique et R2 existants doivent être réutilisés ; migrations additives uniquement.

### Preuves de non-régression déjà vertes
- #135 : classification rubriques principales vs « Autres » — SUCCESS.
- #136 : invariants prépaiements/reprise/enveloppes/wallet/trust — Full governed CI + build + Live tests SUCCESS.
- #138 : preuves de maturité des six derniers moteurs internes — Full governed CI + build + Live tests SUCCESS.
- Une ancienne assertion PWA 1.5.2.3 a été corrigée pour conserver 1.5.2.6 comme cache précédent cohérent de 1.5.2.7 ; la qualification finale de release doit être verte avant toute fusion.

### Statut de livraison
Ne pas déclarer DEPLOYED ou FIELD_ACCEPTED tant que PR #29 et #28 ne sont pas fusionnées et que le workflow Cloudflare 1.5.2.7 n’a pas réussi sauvegarde pré, déploiement, smoke exact et sauvegarde/restauration post. La recette physique PC/Chrome/Opera, Android 6, offline et deux gestionnaires reste distincte.

---

## CURRENT OVERRIDE — 1.5.2.3 FINANCIAL ENTRY OFFLINE — PRODUCTION VERIFIED, FIELD ACCEPTANCE PENDING (2026-09-25)

**Repository opérationnel : `SergeDelor/tontine-platform`.**
**Production publique : `1.5.2.3-financial-entry-offline`.**
**Statut : CI_QUALIFIED + DEPLOYED + SMOKE_VERIFIED. FIELD_ACCEPTED est volontairement NON déclaré tant que le fondateur n'a pas reproduit les tests ✓ / Entrée / offline sur ses appareils.**

### Pourquoi 1.5.2.3 existe
La recette réelle du fondateur a invalidé l'affirmation 1.5.2.2 selon laquelle la saisie montant + ✓ était acquise : le montant saisi pouvait être durablement placé dans l'outbox tandis que la lecture Ledger suivante renvoyait encore la valeur serveur précédente. L'interface repeignait alors 0 et donnait l'impression que ✓ n'avait rien fait. Ce constat terrain prime sur l'ancien test source/CI.

### Correction livrée
- **✓ et touche Entrée utilisent exactement le même chemin de validation** ; Entrée empêche le submit parasite et déclenche la même commande canonique.
- une première saisie de contribution placée en file locale reste **immédiatement visible dans la matrice**, même si le Ledger distant n'a pas encore confirmé l'écriture ;
- les corrections de cellule déjà persistées dans l'outbox exposent leur **valeur cible locale** et ne reviennent plus visuellement à l'ancienne valeur pendant l'attente réseau ;
- une saisie offline/queue affiche explicitement **« Enregistré hors ligne · synchro en attente »** ;
- les intentions sont persistées dans l'outbox IndexedDB puis synchronisées vers l'owner financier canonique ; aucun second Ledger n'a été créé ;
- les réponses ambiguës / indisponibilités temporaires n'effacent plus visuellement l'intention locale ;
- déduplication par idempotency key : une écriture déjà présente dans la projection serveur/cache n'est pas comptée deux fois ;
- PWA isolée dans un nouveau cache pour empêcher un ancien `main.js` 1.5.2.2 de masquer le correctif.

### Preuves techniques
- branche hotfix : `hotfix/1.5.2.3-financial-entry-offline-20260925`
- qualification hotfix : run **36155504042 — SUCCESS — 365/365 PASS**
- tests spécifiques : projection visible d'une saisie queue alors que le serveur retourne 0 ; déduplication ; correction offline avec cible locale ; ✓ + Entrée + état pending
- workflow production : **36155682018 — SUCCESS**
- commit exact déployé : `655cf0b76e2cb1d8ac2338f855c0b93981a1fef3`
- version runtime : `1.5.2.3-financial-entry-offline`
- build ID : `eco-system-1.5.2.3-20260925`
- PWA cache : `eco-system-v1523-financial-entry-offline-20260925`
- Worker Version ID : `84b9f2ef-9780-4d5b-95f4-e533a5ab3a33`
- catalogue production : **158 capacités**
- argent réel : **false / OFF**
- stockage artefacts : **R2**
- D1 canonique : `eco-system-db` réutilisée ; migrations additives uniquement
- R2 canonique : `eco-system-backups` réutilisé
- sauvegarde pré-déploiement : artifact **10873442195**
- sauvegarde post-déploiement : artifact **10872769858**
- restauration post-déploiement : **PASS**, SQLite + `PRAGMA integrity_check=ok`
- PR d'intégration : **#23 — MERGED**, merge commit `6f013c8b5e3c5d084595be607dc71635ad0bf6b9`

### Blocage fonctionnel volontaire
Le chantier L7–L12 est **mis en pause**. Aucune poursuite ne doit être présentée comme prioritaire avant la recette terrain de cette correction financière.

### Recette terrain obligatoire avant FIELD_ACCEPTED
1. sur la feuille de séance, saisir un montant dans une cellule à 0 puis cliquer ✓ : la valeur doit apparaître immédiatement ;
2. saisir un autre montant et appuyer **Entrée** : résultat identique à ✓ ;
3. modifier une valeur existante : la cible doit être visible sans addition implicite ;
4. couper Internet, saisir/valider : la valeur doit rester visible avec **« Enregistré hors ligne · synchro en attente »** ;
5. rétablir Internet : la file doit se synchroniser sans double comptage ;
6. actualiser la page et vérifier que la valeur confirmée reste présente ;
7. répéter au moins une fois dans une fiche individuelle puisque le même renderer canonique est partagé.

**Point de reprise obligatoire : attendre la recette réelle du fondateur sur 1.5.2.3. Si elle échoue, corriger ce flux uniquement. Si elle réussit, seulement alors reprendre L7–L12 depuis la branche qualifiée prévue, en réintégrant d'abord ce hotfix.**

---

## CURRENT OVERRIDE — 1.5.2.2 GOVERNED FIELD FEEDBACK — PRODUCTION VERIFIED (2026-09-25)

**Repository opérationnel : `SergeDelor/tontine-platform`.**
**Production publique : `1.5.2.2-governed-field-feedback`.**
**Statut : DEPLOYED + SMOKE_VERIFIED. FIELD_ACCEPTED reste distinct et requiert la recette réelle fondateur/appareils.**

### Livraison exacte
- branche : `next/1.5.0-audit-complete-platform-20260923`
- commit exact déployé : `8d4bbee39cdf519f7c6c18296f840ef49313df6a`
- workflow production : **36144883224 — SUCCESS**
- GitHub-hosted Actions : **rétabli après transfert du dépôt vers SergeDelor**
- qualification hébergée préalable : **36144754009 — SUCCESS**
- version runtime : `1.5.2.2-governed-field-feedback`
- build ID : `eco-system-1.5.2.2-20260923`
- PWA cache : `eco-system-v1522-governed-field-feedback-20260923`
- catalogue : **158 capacités**
- argent réel : **false / OFF**
- Worker Version ID : `c3f78192-2b09-45e2-abb7-324978a0dd90`
- D1 canonique : `eco-system-db` réutilisée ; **No migrations to apply**
- R2 canonique : `eco-system-backups` réutilisé
- sauvegarde pré-déploiement : artifact **10868773224**, digest `sha256:efaa765f4a3d81b70352da8a9dc094d25608bbe1367466239e2440149c7b725b`
- sauvegarde post-déploiement : artifact **10868703315**, digest `sha256:e1fb14b8022fc67391565552452e217dc682a23533b2b9e9fb30aa120bee0715`
- restauration post-déploiement : **PASS**, SQLite + `PRAGMA integrity_check=ok`

### Corrections terrain désormais déployées
- saisie montant + ✓ réellement prise en compte dans les tableaux financiers canoniques ;
- prêt traité comme sortie/dépense et non comme rubrique positive ;
- dette totale = capital restant + intérêts dus + autres obligations ;
- intérêt calculé à la clôture N et attribué à N+1 sans double comptage ;
- dette visible dans les surfaces groupe/session/membre ;
- scroll souris restauré sur les tableaux ;
- UX Membres corrigée ;
- restauration Corbeille signalée 72 h ;
- Accueil limité à 5 alertes urgentes + Centre d'alertes ;
- mode Visuel renforcé ;
- isolation PWA/cache 1.5.2.2.

### Mapping de propriété GitHub
- Eco-System : `SergeDelor/tontine-platform`
- Beauty : `Delor85/as-beauty` tant qu'il n'est pas transféré
- Blue Magic : `Delor85/BlueAuto` tant qu'il n'est pas transféré
- auteurs historiques, commits, anciennes issues et PR signés `Delor85` : **ne pas réécrire**
- références opérationnelles du dépôt Eco actuel : utiliser `SergeDelor/tontine-platform`

### Point de reprise
La prochaine tranche est la fermeture fonctionnelle **L7–L12** (issue #21), en partant de cette production 1.5.2.2 prouvée et sans réintroduire de moteur parallèle.

---

# ECO-SYSTEM — CURRENT TRUTH

## CURRENT OVERRIDE — 1.5.2 GOVERNED BLUEPRINT — PRODUCTION VERIFIED (2026-09-23 · FINAL LOT)

**Production publique : `1.5.2-unified-ux-blueprint`.**
**Statut : MERGED + DEPLOYED + SMOKE_VERIFIED. FIELD_ACCEPTED reste distinct et requiert la recette réelle fondateur/appareils.**

### Livraison exacte
- URL : `https://eco-system.sergemimf.workers.dev/`
- PR finale : **#18 — MERGED**
- branche d'intégration : `final/1.5.2-blueprint-governed-20260923`
- merge code qualifié : `021497fd5ab2741c7d91914b0489b5bc15c92e67`
- commit exact déployé : `193dee0d5e5a4298aaf96d098a2fc2e01a522ed1`
- workflow production : **35893002960 — SUCCESS**
- qualification production : **353 / 353 tests PASS**
- workflow qualification générale du commit de déploiement : **35893003001 — SUCCESS**
- Worker Version ID : `3b017204-c848-4731-83eb-681f95ea0ff5`
- version runtime : `1.5.2-unified-ux-blueprint`
- build ID : `eco-system-1.5.2-20260923`
- PWA cache : `eco-system-v152-unified-ux-blueprint-20260923`
- catalogue production : **158 capacités**
- argent réel : **false / OFF**
- stockage artefacts : **R2**
- D1 canonique : `eco-system-db` réutilisée ; aucune recréation
- R2 canonique : `eco-system-backups` réutilisé
- sauvegarde pré-déploiement : artifact **10765009378**
- sauvegarde post-déploiement : artifact **10764894619**
- restauration post-déploiement : **PASS**, SQLite + `PRAGMA integrity_check=ok`

### Acquis fonctionnels consolidés dans ce lot
1. **UX 1.5.2 unique conservée** : choix visible tout en haut de l'Accueil entre **Visuel**, **Senior** et **Assisté / Dictée**. Les trois modes utilisent les mêmes services, mêmes permissions, mêmes règles, même Ledger et mêmes calculs.
2. **Tableaux financiers canoniques préservés** : feuille de séance et fiches individuelles gardent le même owner ; saisie montant + ✓, correction/remplacement exact, totaux et garde-fous de revue indépendante restent acquis.
3. **Auth/PWA conservées** : restauration de session avant écran Connexion, appareil privé optionnel, cache versionné sans retour silencieux vers une ancienne interface.
4. **Matching besoins/offres réellement enrichi** : comparaison explicable sur catégorie, quantité, unités compatibles, spécification, qualité, zone, disponibilité/délai, coût rendu, budget, fraîcheur et preuves. Les coûts inconnus restent inconnus ; le sponsoring ne bonifie pas le score.
5. **Knowledge Bank gouvernée** : identité stable d'une connaissance, versions successives, validité, prochaine revue, sensibilité/portée et revalidation. Une ancienne version supersédée n'est pas réutilisée comme vérité courante.
6. **ONG / Partenaires opérationnels** : mandat d'accompagnement explicitement consenti et borné ; actions d'accompagnement ; preuves de financement ; plan de transfert vers les responsables locaux. Aucun animateur/ONG ne reçoit automatiquement un rôle financier ni un accès aux finances individuelles.
7. **Financement ONG** : une promesse reste une promesse. À partir de l'état « Reçu », une référence Ledger canonique est exigée ; le module programme ne crée pas une seconde vérité financière.
8. **Referral gouverné** : recommandation directe seulement ; structure multi-niveaux / rémunération du recrutement de recruteurs / financement secret par argent des membres sont bloqués ; une conversion signalée ne réserve pas de récompense avant vérification.
9. **Trust / anti-arnaque** : signalement commence comme suspicion non vérifiée ; preuves, triage, investigation, décision et recours sont séparés ; aucun verdict légal automatique et aucune modification automatique d'un score financier.
10. **Financial Lab** : outil pédagogique renforcé pour confronter promesses, ressources documentées et dépendance aux nouveaux dépôts, sans déclarer automatiquement « Ponzi » ou « arnaque ».

### Garde-fous permanents confirmés
- Ledger = vérité financière unique.
- D1 `eco-system-db` jamais recréée ; migrations additives uniquement.
- R2 `eco-system-backups` préservé.
- argent réel **OFF**.
- aucune finance individuelle/CNI/téléphone/biométrie partagée avec partenaires/ONG.
- sponsoring ≠ confiance.
- promesse ≠ argent reçu.
- programme/ONG ≠ rôle financier.
- décision de sécurité ≠ verdict légal automatique.
- dix étapes, multi-tontines, Collation, RECAP, offline/outbox, Community/Forum/Live, Control Center et historique restent des acquis de non-régression.

### Limite vraie / recette terrain
La livraison technique et le smoke distant sont prouvés. **FIELD_ACCEPTED n'est pas déclaré automatiquement.** La prochaine action utilisateur utile est uniquement la recette réelle :
- changer Visuel / Senior / Assisté sur desktop et téléphone ;
- vérifier la feuille de séance > 5 secondes puis après actualisation ;
- vérifier une fiche individuelle ;
- saisir montant + ✓, corriger une valeur et vérifier les totaux ;
- tester session normale / appareil privé ;
- tester dictée puis confirmation humaine ;
- tester création d'un besoin + offre et lire les raisons du matching ;
- tester un programme ONG en brouillon/actif puis un mandat borné.

**Point de reprise obligatoire :** partir de la branche `next/1.5.0-audit-complete-platform-20260923` au HEAD distant, en considérant la production vérifiée au commit `193dee0d5e5a4298aaf96d098a2fc2e01a522ed1`. Ne jamais repartir de la branche divergente fermée de la PR #17.

---


## CURRENT OVERRIDE — 1.5.2 UNIFIED UX / CANONICAL CORE — PRODUCTION QUALIFIED (2026-09-23)

**Production publique : `1.5.2-unified-ux-blueprint`.**
**Statut : DEPLOYED + SMOKE_VERIFIED. FIELD_ACCEPTED reste distinct et exige la recette réelle du fondateur/appareils.**

### Preuves de livraison
- URL : `https://eco-system.sergemimf.workers.dev/`
- source déployée exacte : `c89a8be935f018b5d12de6cdacb7d45b013f7ccf`
- workflow de livraison : **35858671394 — SUCCESS**
- qualification dans le workflow : **337 / 337 tests PASS**
- Architecture fitness : PASS (115 fichiers source)
- Shared Governance : PASS — 23 garde-fous + 2 conventions fondatrices
- Constitution : PASS — 9 capacités requises, 31 enregistrements financiers critiques, 11 domaines mémorisés
- Project Truth : PASS
- Memory Index : PASS — 360 requirement IDs, 1541 titres historiques
- Source Coverage : PASS — 4 sources majeures, 26 entrées RAR profondes, 14 mappings domaines
- Worker Version ID : `8df73d6a-c51b-4e33-a752-e40185c1ec5e`
- version runtime : `1.5.2-unified-ux-blueprint`
- build ID : `eco-system-1.5.2-20260923`
- PWA cache : `eco-system-v152-unified-ux-blueprint-20260923`
- catalogue : **158 capacités**
- argent réel : **false / OFF**
- stockage artefacts : **R2**
- D1 canonique : `eco-system-db`, réutilisée
- R2 canonique : `eco-system-backups`, réutilisé
- migrations : **No migrations to apply**
- sauvegarde pré-déploiement : artifact **10748790771**
- sauvegarde post-déploiement : artifact **10748825795**
- restauration post-déploiement SQLite : **PASS**, `PRAGMA integrity_check=ok`

### Acquis 1.5.2
1. **Un seul owner des tableaux financiers** : feuille de séance + fiches individuelles utilisent le même renderer canonique, montant + ✓, valeur cible et remplacement exact, totaux par ligne/colonne/global, consensus et revue indépendante.
2. **Retour de l'ancien tableau corrigé à la racine** : les assets PWA versionnés ne peuvent plus retomber sur un asset non versionné d'une release précédente. Le cache 1.5.2 est cohérent et conserve 1.5.0 comme rollback.
3. **Rafraîchissement/authentification stabilisés** : restauration de session avant affichage de Connexion ; session normale moins agressive ; option volontaire « appareil privé » pour une session plus durable, sans ajout de droits métier.
4. **Trois modes visibles en haut de l'Accueil** :
   - **Visuel** : présentation moderne et attractive ;
   - **Senior** : typographie/contrôles/cibles tactiles plus grands, navigation lisible ;
   - **Assisté / Dictée** : gros contrôles et accès prioritaire à la dictée, avec validation humaine conservée.
   Ces modes partagent strictement les mêmes services, permissions, Ledger, rubriques et calculs.
5. **Ergonomie** : libellés Membres/navigation moins comprimés, mots non cassés arbitrairement, scroll horizontal local des tableaux, en-têtes et première colonne collants.
6. **Chantier 1.5.1 consolidé** : Kit prêt à l'emploi / Launch Studio, Business Studio, owners Marketplace/Value/Referral/Knowledge/Academy/Control Center/Blueprint préservés et dédupliqués selon leurs contrats existants.
7. **Circuit de livraison renforcé** : CI complète, sauvegarde avant mutation, D1/R2 existants uniquement, migrations additives, smoke exact version/SHA/build/cache, sauvegarde post-déploiement restaurée et vérifiée.

### Incident de livraison résolu
Le premier run 1.5.2 (`35858399976`) avait bien déployé les nouveaux assets et un nouveau Worker, mais son smoke s'arrêtait trop tôt sur un `/health` encore servi par l'ancienne release pendant la propagation. Il a donc échoué honnêtement avec `VERSION_MISMATCH:1.5.0-audit-complete`.
Le smoke a été durci pour attendre **version + SHA + buildId + PWA cache exacts** avant de conclure. La relance idempotente `35858671394` a ensuite réussi entièrement, y compris la preuve post-déploiement.

### Limites / prochaine vérité
- `DEPLOYED` et `SMOKE_VERIFIED` sont prouvés.
- **FIELD_ACCEPTED n'est pas encore déclaré** : il faut tester réellement sur les appareils du fondateur, notamment :
  - changement Visuel / Senior / Assisté ;
  - feuille de séance après > 5 secondes et après actualisation ;
  - fiche individuelle ;
  - saisie montant + ✓ et correction d'une valeur ;
  - totaux ligne/colonne/global ;
  - rafraîchissement avec session normale et « appareil privé » ;
  - lisibilité Membres/navigation sur téléphone ;
  - dictée et confirmation humaine.
- Les capacités encore `STRUCTURAL_V1` ou `FUNCTIONAL_BETA` gardent ce statut jusqu'à leur preuve métier/terrain propre ; la livraison 1.5.2 ne transforme pas leur simple présence en acquisition terrain.

Document d'implémentation :
`docs/implementation/ECO_SYSTEM_1.5.2_UNIFIED_UX_BLUEPRINT_2026-09-23.md`.

**Point de reprise : production 1.5.2 au SHA `c89a8be935f018b5d12de6cdacb7d45b013f7ccf`. Toute correction suivante part de la production prouvée et préserve D1/R2, Ledger unique, dix étapes, multi-tontines, Collation, RECAP, offline/outbox, Community/Forum/Live, Control Center et argent réel OFF.**

---

## CURRENT OVERRIDE — 1.5.2 UNIFIED UX / CANONICAL CORE — CI QUALIFIED (2026-09-23)

**Statut : CI_QUALIFIED sur branche ; PAS ENCORE DÉPLOYÉ ; PAS FIELD_ACCEPTED.**

- Branche : `release/1.5.2-unified-ux-blueprint-20260923`.
- Base reprise : chantier 1.5.1 abandonné au SHA `0c29e7a80c40bf8887a901e7439c2ea928d99ce6`, lui-même au-dessus de la production 1.5.0.
- Qualification verte avant ce checkpoint documentaire : run **35857889951 SUCCESS**, **337/337 tests PASS**.
- Version runtime candidate : `1.5.2-unified-ux-blueprint`.
- Build ID candidat : `eco-system-1.5.2-20260923`.
- PWA cache candidat : `eco-system-v152-unified-ux-blueprint-20260923`.
- D1 à préserver : `eco-system-db`.
- R2 à préserver : `eco-system-backups`.
- Argent réel : **OFF**.

### Acquis consolidés dans 1.5.2
1. **Owner financier unique** : feuille de séance et fiches individuelles passent par le même renderer canonique de `main.js`, saisie montant + ✓, remplacement de valeur cible, totaux ligne/colonne/global, consensus et revue indépendante préservés. Les vues Detail/Voice/Sessions délèguent ; elles ne recréent pas une seconde matrice.
2. **Cause du retour de l'ancien tableau corrigée** : un asset versionné 1.5.2 ne peut plus retomber sur un asset non versionné d'un cache antérieur. Le shell essentiel reste atomique et conserve 1.5.0 comme rollback cohérent.
3. **Authentification au rafraîchissement** : état `auth-restoring` avant affichage de la connexion ; session standard moins agressive ; option volontaire « appareil privé » avec session longue durée. Aucun droit métier supplémentaire.
4. **Trois modes d'utilisation, même métier** en haut de l'Accueil :
   - **Visuel** : interface moderne/attractive ;
   - **Senior** : textes/contrôles plus grands, navigation lisible, grandes cibles tactiles ;
   - **Assisté / Dictée** : gros contrôles et accès prioritaire à la dictée, sans validation financière silencieuse.
   Le choix persiste sous `eco.uiMode`; aucun mode n'a son propre Ledger ou moteur.
5. **Ergonomie mobile** : suppression du cassage agressif des libellés, meilleure hauteur de ligne/cibles tactiles, tableaux à scroll horizontal local, en-têtes/première colonne collants.
6. **Release identity cohérente** : package/build/Worker/health/PWA utilisent la même identité 1.5.2.

### Garde-fous / limites vraies
- La production publique reste **1.5.0-audit-complete** jusqu'à un workflow de déploiement prouvé du SHA exact 1.5.2.
- Un run CI vert ne vaut ni smoke production ni recette terrain.
- Les capacités encore `STRUCTURAL_V1` ou `FUNCTIONAL_BETA` gardent ce statut ; leur présence dans le lot ne les transforme pas en FIELD_ACCEPTED.
- Les owners historiques restent : Ledger, MeetingService, Rubrics/Living Rules, Membership/Identity, Marketplace, Business Studio, Knowledge Bank, Community, Evidence/Trust.
- Aucun moteur parallèle ne doit être réintroduit pour les trois modes UX, le Kit, Business Studio, Marketplace ou les dashboards.
- Les dix étapes, multi-tontines, Collation, RECAP, prêts/intérêts, offline/outbox, Community/Forum/Live, Control Center, D1/R2 et `realMoneyEnabled=false` restent des acquis de non-régression.

Document de transmission 1.5.2 :
`docs/implementation/ECO_SYSTEM_1.5.2_UNIFIED_UX_BLUEPRINT_2026-09-23.md`.

**Point de reprise :** qualifier le HEAD documentaire exact, puis PR unique vers `next/1.5.0-audit-complete-platform-20260923`. Déploiement seulement avec BIR+ pré, même SHA, smoke et BIR+ post. La recette réelle Visuel/Senior/Assisté + Android/desktop reste distincte.

---

## CURRENT OVERRIDE — 1.5.0 AUDIT COMPLETE DEPLOYED (2026-09-23)

Production publique : `https://eco-system.sergemimf.workers.dev/`.
Version runtime : **1.5.0-audit-complete**.
Source déployée : `8283c5383db99d26a14f388a0890d15251b4dd87`.
Build ID : `eco-system-1.5.0-20260923`.
PWA cache : `eco-system-v150-audit-complete-20260923`.
Catalogue production : **158 capacités**.
Stockage artefacts : **R2**.
Argent réel : **DÉSACTIVÉ**.

Preuve production : workflow `35832177188` — **SUCCESS**. Le workflow a exécuté la CI complète avant mutation, résolu la D1 existante et le R2 existant, exporté la D1 avant déploiement, appliqué uniquement les migrations additives, déployé Worker/PWA/cron puis vérifié root + /health + catalogue + SHA exact. Artifact de récupération : `eco-system-pre-1.5.0-8283c5383db99d26a14f388a0890d15251b4dd87`, ID `10738091343`.

Acquis 1.5.0 à préserver : correction financière atomique/versionnée/idempotente ; séance explicite ; consensus multi-gestionnaires ; prêt séparé et intérêts stoppés après extinction du capital ; historique membre paginé ; compte local et migration d’identité reprenable ; shell PWA atomique ; corbeille six mois + maintenance serveur ; pétition/reconstitution 2/3 sans transfert automatique ; Value Network ; Business Studio ; Marketplace stock/fournisseur/crédit ; Referral ; Knowledge/Encyclopédie ; Academy ; Control Center à preuve ; ergonomie senior/mobile.

Décisions fondateur : le groupe successeur décide de ses actions sur actifs/dettes/contestations et peut ouvrir un dossier/plainte ; après six mois la purge vise la disparition des données métier, avec seules traces techniques/statistiques minimales non reconstructives.

Garde-fous : D1 `eco-system-db` jamais recréée ; migrations additives ; Ledger unique ; argent réel OFF ; dix étapes ; Collation ; multi-tontines ; RECAP ; Community/Forum/Live ; historique conservé ; aucune capacité déclarée terrain-acquise sans preuve terrain.

Validation distincte : la CI générale 1.5.0 est verte. Le smoke WebKit automatisé est une preuve navigateur séparée et ne remplace jamais une recette iPhone/iPad physique installée depuis l’écran d’accueil.

Point de reprise : branche `next/1.5.0-audit-complete-platform-20260923`, PR #13. Toujours relire le HEAD distant, cette vérité et la dernière CI avant toute nouvelle modification. La production doit être comparée au SHA déployé ci-dessus, pas supposée égale au HEAD documentaire ultérieur.

---


## CURRENT OVERRIDE — 1.5.0 AUDIT IMPLEMENTATION IN PROGRESS (2026-09-23)

Production reste `1.4.5-final-mega-offline-governance` source `463035adab2303874878c8e72f1965475ac0b209`. Aucun déploiement 1.5.0 n’est encore déclaré.

Branche de travail : `next/1.5.0-audit-complete-platform-20260923`, créée depuis le SHA audité 1.4.5.1 `57b99f5249535cef2edc90a3635b2a26fc7ebf12`.

Autorisation fondateur : implémentation complète de l’audit du 22/09, avec réintégration des contours historiques Chat originel/Conversation originelle et sans régression.

Décisions nouvelles : groupe successeur décide de ses actions sur actifs/dettes/contestations ; purge cible après six mois = suppression des données métier de la plateforme, traces techniques/statistiques minimales non reconstructives seulement, avec non-résurrection par sauvegarde.

P0 déjà engagés sur la branche : bug intérêt INITIAL corrigé et testé ; correction de cellule déplacée vers un plan repository atomique ; commande cible persistée localement avant réseau ; première saisie 0→X n’utilise plus le raccourci direct ; conflit offline compare sa valeur de base.

Document de portée canonique de ce chantier : `docs/implementation/ECO_SYSTEM_1.5.0_FULL_IMPLEMENTATION_SCOPE_2026-09-23.md`.

Prochaine étape : CI 1.5.0, puis CAS/version de cellule et tests D1 de concurrence avant toute production.

---


## CURRENT OVERRIDE — 1.4.5 VERIFIED_REMOTE (2026-09-22)

Production vérifiée : `1.4.5-final-mega-offline-governance` sur `eco-system`, source `463035adab2303874878c8e72f1965475ac0b209`, Worker Version ID `29c8f0e2-1cb1-4361-8481-27b514906fcf`. Run production `35713621388 SUCCESS`, **298/298 tests PASS**, smoke 1.4.5 PASS, D1 existante sans migration, Premium Live/Founder Control/Community Realtime/R2 actifs, argent réel OFF. BIR+ pré `10688266480`, post `10688236533`, restauration SQLite/integrity/SHA256 et miroirs R2 PASS.

Vérité fonctionnelle nouvelle : premier compte local possible sans ancienne session serveur ; PWA Android 6 cache-first sans reload forcé ; deux feuilles financières restaurées ; feuille récapitulative par défaut dans Séances + Recap ; menus spécialisés restaurés ; valeur cellule = valeur cible ; modification existante multi-gestionnaires gouvernée par consensus ; alertes membre/gestionnaires ; séance exacte transportée vers la feuille ; corrections après clôture auditées ; Corbeille 6 mois ; Eco Relay chiffré + Eco Local 1:1.

Limites : recette terrain Android 6 et iPhone distincte du smoke. Un appareil qui n'a jamais reçu les fichiers Eco-System nécessite encore une distribution physique du shell (APK/pack offline) ; le 1.4.5 supprime la dépendance à une **session Internet**, pas les lois physiques du téléchargement. Eco Local 80 appareils offline n'est pas encore déclaré acquis.

---

Date : 2026-09-20

## 1. Production publique — vérité actuelle

- URL : `https://eco-system.sergemimf.workers.dev/`
- version : **1.4.2-operational-center-sessions-blueprint**
- Worker : `eco-system`
- Worker Version ID : `b54df0a5-2338-4e37-8b4d-a05351b43658`
- D1 canonique : `eco-system-db`
- R2 privé : `eco-system-backups`
- Premium Live : **ACTIF**
- Control Center : **BOUND / production**
- Forum v2 temps réel : **BOUND / production**
- stockage artifacts : **R2**
- argent réel : **DÉSACTIVÉ**
- qualification du SHA déployé : **35497930024 — SUCCESS**
- workflow qualification + build + BIR+ pré/post + déploiement + smoke : **35497930031 — SUCCESS**
- source déployée : `61a6d83ac5793bb5fecac7ba77a7bd4149031e27`
- tests dans le workflow : **264/264 PASS**
- D1 : **No migrations to apply**
- BIR+ pré/post : restauration SQLite + `PRAGMA integrity_check=ok` + SHA256 + miroir R2 **PASS**.
- artifacts : pré-déploiement `10601637363` ; post-déploiement `10601512437`.
- smoke : version/health + Centre opérationnel + vraie page Séances + présence MeetingService + bénéficiaires/preuves + mobile + Blueprint exécutable + presets Forum/Communautés + Financial Lab + acquis 1.4.1 **PASS**.
- 1.4.1 et les lignes antérieures deviennent historiques ; elles restent des acquis de non-régression.

## 2. Branche et point de reprise

- branche de développement et de production courante : `next/1.4.2-operational-center-sessions-blueprint-20260920`
- source actuellement déployée : `61a6d83ac5793bb5fecac7ba77a7bd4149031e27`
- reprendre au **HEAD distant le plus récent**, jamais à partir d'un SHA mémorisé sans le revérifier.
- prochaine action normale : **BIR+ de fermeture 1.4.2**, puis recette terrain réelle Centre opérationnel / Séances / mobile / Blueprint / communautés / Financial Lab.
- le smoke production ne remplace pas la validation réelle Bureau/membre/offline/bruit/senior ni la réception terrain des nouveaux parcours 1.4.2.

## 3. R2 / sauvegarde

Le jeton GitHub Cloudflare existant a été retesté après activation R2 :
- `d1=OK`
- `r2=OK`

Aucun nouveau jeton n'est nécessaire pour D1/R2 tant que ces contrôles restent verts.

La production 1.3.2 a :
- créé/réutilisé le bucket privé `eco-system-backups` ;
- exporté `eco-system-db` avant déploiement ;
- vérifié la restauration SQLite et `PRAGMA integrity_check=ok` ;
- archivé les sources ;
- calculé les SHA256 ;
- copié source + export D1 + checksums dans R2 sous le préfixe :
  `birplus/1.3.2/0226b9b145c8aa49eb94ed190dedfd8c544ff80c/predeploy/` ;
- téléchargé les checksums depuis R2 pour vérifier la copie ;
- résultat : **R2 BIR+ mirror PASS**.

Une sauvegarde BIR+ GitHub séparée avant le déploiement a aussi réussi : run **35095940942 — SUCCESS**.

## 4. Épargne — audit étendu du dossier historique

Sources auditées : le nouveau dossier historique, notamment `Feuille mensuelle.xlsx` et `Rubriques Epargne à intérêts.xlsx`.

Vérités corrigées du dossier complet :
- intérêts réellement collectés dans `Principal!F3` : **708 500 F CFA** ;
- principal Épargne classique : **14 935 199 F** ;
- principal Épargne scolaire : **1 081 000 F** ;
- exemple de clé décidée par le Bureau : **70 % Épargne classique = 495 950 F**, **10 % Épargne scolaire = 70 850 F**, **20 % Bureau = 141 700 F** ;
- coefficients historiques classiques : **9, 8, 7, 6, 5, 4, 3, 2, 1, 0,5, 0, 0** ;
- coefficients scolaires : **7, 6, 5, 4, 3, 2, 1, 0, 0, 0, 0, 0**.

### Moteur historique
Le pipeline détaillé du classeur reste reproductible pour explication. Mathématiquement, après normalisation, sa part relative est équivalente à :
`poids dépôt = montant × coefficient de période`, puis
`gain dépôt = pool de la caisse × poids dépôt / somme des poids`.
Eco-System conserve le pipeline historique pour audit, mais peut utiliser cette forme simplifiée pour calculer immédiatement le même résultat.

### Moteur Capital × Temps
Nouvelle politique transparente :
`score = montant^β × durée_éligible^α`.
- défaut : α=1, β=1 ;
- α>1 renforce explicitement la prime aux dépôts précoces ;
- β<1 peut, si le groupe le décide, atténuer la domination de dépôts exceptionnellement élevés ;
- date/session limite d'éligibilité entièrement configurable.

### Moteur productif attribué / hybride
Le nouveau dossier apporte des preuves supplémentaires :
- janvier : prêt ordinaire de **1 000 000 F** à Nicaise, remboursé en mars avec **90 000 F** d'intérêts ;
- avril : prêt ordinaire de **6 000 000 F** à Thierry, remboursé en juin avec **600 000 F** d'intérêts ;
- soit **690 000 F** d'intérêts à causalité forte sur **708 500 F** collectés ;
- **18 500 F** restent résiduels/non attribués avec certitude et ne doivent pas recevoir une causalité inventée.

Le moteur supporte désormais :
- `SEGREGATED` : caisses séparées ;
- `POOLED` : Épargne classique et scolaire mutualisées ;
- `CUSTOM_MATRIX` : matrice explicite des caisses autorisées par prêt ;
- résidu : `TIME_WEIGHTED`, `FIXED_FUND_SPLIT` ou `UNALLOCATED`.

**Règle** : l'application demande explicitement au Bureau si Épargne classique et Épargne scolaire sont mélangées pour les prêts, car cette décision varie selon les groupes.

## 5. Acquis 1.3.2 anti-régression

- parcours création 10 étapes ;
- Collation ;
- rubriques multiples et multi-tontines avec participants propres ;
- Tontine Manager permanent ;
- Ledger D1 canonique ;
- panne Live ≠ rollback d'une finance déjà commitée ;
- Premium Live + Durable Object ;
- moteurs Épargne historique et capital productif ;
- Fonds Secours : détail contribution/retenue par membre ;
- RECAP financier/session/carryover ;
- Forum v2 : messages, threads, réactions, brouillons serveur, curseur/ancre de lecture multi-appareils ;
- Control Center : auto-enregistrement des capacités, incidents, plaintes, contenus ;
- propriétaire initial du Control Center persisté dans D1, distinct du simple rôle fondateur d'un groupe ;
- identité CNI + téléphone + nom normalisé par HMAC serveur ;
- R2 pour imports/médias/sauvegarde ;
- AdManager spécialisé, profil économique agrégé, Demand Exchange, Partners/ONG ;
- PWA/offline/FR-EN ;
- `realMoneyEnabled=false`.

## 6. Secrets production

Les clés `COLLECTIVE_LEARNING_PEPPER` et `IDENTITY_MATCH_PEPPER` ont été créées une seule fois comme **Cloudflare Worker secrets** durant la livraison 1.3.2. Elles ne doivent jamais être copiées dans GitHub ou dans le dépôt.
Les prochains déploiements doivent les **préserver**, pas les régénérer.

`FOUNDER_TEAM_ACTORS` est optionnel : le propriétaire plateforme durable en D1 donne l'accès initial au Control Center ; ce secret pourra servir plus tard à ajouter explicitement des contrôleurs supplémentaires.

## 7. Documents maîtres

- `docs/constitution/ECO_SYSTEM_Cahier_des_Charges_Maitre_Exhaustif_3.2.0_2026-09-16.md` (continuation détaillée ; socle 2.3.4 conservé)
- `docs/economics/ECO_SYSTEM_Modele_Economique_AdManager_Approfondi_3.2.0_2026-09-16.md`
- audit classeur réel livré séparément en XLSX.

## 8. Limites vraies

- moteur productif : besoin d'une preuve prêt → caisse/source → remboursement → remise en prêt pour une allocation causale complète ;
- Épargne scolaire : politique de mutualisation des prêts à préciser ;
- photo R2 + vérification faciale volontaire 1-à-1 : à implémenter ;
- passkeys/WebAuthn : à implémenter ;
- appels audio/vidéo RealtimeKit : à implémenter ;
- Push complet, recherche Forum, voix/sondages/live avancés : à implémenter ;
- argent réel : non autorisé.

## 9. Garde-fous permanents

- ne jamais recréer `eco-system-db` ;
- migrations additives uniquement ;
- pas de second Ledger ;
- pas d'intérêt impayé automatiquement capitalisé ;
- aucune finance/CNI/téléphone/biométrie individuelle dans AdManager ou partage partenaire ;
- OFF explicite > BETA_OPEN ;
- UNKNOWN ≠ SUCCEEDED ;
- sauvegarde BIR+ avant production ;
- tout nouveau service supervisable est automatiquement inscrit au Control Center ;
- pas de force-push / merge main sans décision explicite.

## 10. Prochain point de reprise

Priorités :
1. relier automatiquement le moteur Épargne au Ledger/Feuille mensuelle et aux vraies sources de prêts ;
2. UX Fonds Secours par membre + RECAP/Cassation complète ;
3. photos R2 et pipeline média ;
4. passkeys + Web Push ;
5. Forum recherche/signets/voix/sondages ;
6. RealtimeKit réunions audio/vidéo ;
7. Demand Exchange/Deals + Analytics/Cost Control ;
8. tests terrain 2G/seniors.

Après 3–5 sous-lots : commit + CI + mise à jour de cette vérité + checkpoint BIR+.


## 11. Compatibilité avec les garde-fous historiques

- Infrastructure : **CLOUDFLARE** Workers + D1 + R2 + Durable Objects.
- Lignée de récupération conservée : **1.0.0-complete-app** reste une balise historique du projet et ne désigne pas la version courante.
- Finance réelle : **realMoneyEnabled=false**.
- Doctrine métier : **Living Rules** ; écrit, pratique observée, règle activée et exception restent distincts.


## 12. 1.3.3 — production qualifiée

- version : `1.3.3-fairness-adops-doctor-launch` ;
- branche : `next/1.3.3-interest-lab-adops-ui-20260916` ;
- production 1.3.3 smoke-testée ;
- 181 tests couvrent notamment les cinq politiques d'intérêts, RI multi-document, revue séquentielle, Assistance/Inscription, AdOps, House Ads, Group Doctor et Meeting Autopilot ;
- l'IA House Ads reçoit uniquement des signaux collectifs dérivés (familles et catégories de besoins), jamais les noms libres des rubriques ;
- BIR+ 1.3.3 : run `35138465887` SUCCESS ; déploiement/smoke : run `35138597876` SUCCESS ; Worker Version ID `fdb6c9f3-8e46-49e9-85df-1e238975d257` ; `realMoneyEnabled=false`.

**Point de reprise** : recette terrain 1.3.3 puis corrections ciblées ; toute nouvelle production reste précédée d'un BIR+ et d'un smoke.


## 13. Livraison 1.3.3 — preuves
- BIR+ : `35138465887` SUCCESS (source + export D1 + restauration SQLite + SHA + miroir R2).
- Deploy : `35138597876` SUCCESS.
- D1 : existante réutilisée ; `No migrations to apply`.
- R2 predeploy mirror : PASS.
- Worker Version ID : `fdb6c9f3-8e46-49e9-85df-1e238975d257`.
- Smoke : version 1.3.3, realMoney=false, Premium Live=true, Founder Control=true, Community Realtime=true, artifactStorageMode=R2.
- Les capacités 1.3.3 sont déployées mais restent FUNCTIONAL_BETA là où une recette terrain dédiée manque.


## 14. Checkpoint de clôture 1.3.3
- HEAD checkpoint : `4d7ce535f60fbc4af3317ed157374ec884b3ff2e`.
- qualification : run `35139053318` SUCCESS.
- BIR+ de clôture : run `35139053215` SUCCESS.
- ce checkpoint archive le code/documentation post-déploiement et exporte la D1 déjà en production 1.3.3, avec restauration/integrity, SHA256 et miroir R2.


## 15. 1.4.0 — deux feuilles / toutes rubriques / circuit Prêts + Intérêts — VERIFIED_REMOTE

Production 1.4.0 qualifiée le 2026-09-18.

### Deux feuilles
- **Votre feuille de séance** et **Vos fiches individuelles** sont les deux surfaces normales de saisie financière membre.
- Toute rubrique créée et non archivée apparaît sur les deux.
- Le test à 20 rubriques est uniquement un test de non-régression terrain. Les scénarios **1 rubrique** et **40 rubriques** sont également couverts et passent.
- Le validateur de lancement conserve un plafond technique actuel de 100 rubriques ; ce n'est pas une règle métier « 20 rubriques ».
- Amendes / Inscription / Timbre ne remplacent jamais le catalogue réel du groupe.
- Le simple membre voit sa propre fiche et ses propres prêts, pas ceux des autres membres.

### Prêts
- Le capital restant est l'assiette de l'intérêt de la nouvelle période.
- Après remboursement partiel du capital, la période suivante taxe uniquement le capital restant.
- Les intérêts impayés restent séparés et ne produisent jamais eux-mêmes des intérêts.
- Si capital = 0 mais intérêts > 0, aucun nouvel intérêt n'est produit.
- Le gestionnaire compare puis valide **CAPITAL_FIRST** ou **INTEREST_FIRST** au niveau de la rubrique Prêt.
- Une période réelle de prêt est persistée par prêt + séance (`FINANCE.LOAN_PERIOD`) ; l'accrual est idempotent pour éviter un double intérêt dans la même séance.
- La matrice réelle/simulée est horizontale par séance/mois et contient : capital début, capital remboursé, capital restant, intérêt exigible, intérêt payé, intérêt restant, paiement, dette après séance, intérêt projeté suivant, total projeté suivant, plus synthèse/totaux.
- Si la politique du groupe active le blocage, un nouveau prêt est interdit tant que capital ou intérêts du précédent restent dus.

### Exemple fondateur permanent
50 000 XAF, 5 %, paiements 0 / 30 000 / 20 000 :
- CAPITAL_FIRST : fin mois 3 = capital 0, intérêts 6 000 ; mois 4 = 6 000 sans nouvel intérêt.
- INTEREST_FIRST : fin mois 3 = capital 6 250 ; période suivante = 6 250 + 5 % = 312,5 théoriques, arrondis actuellement à 313 XAF ; total final projeté 6 563 XAF.

### Preuves distantes
- qualification SHA déployé : run `35314965698` SUCCESS ;
- production + smoke : run `35314965700` SUCCESS ;
- tests : 231/231 PASS ;
- Worker Version ID : `182e7992-1bf9-479f-914b-c0f04ab1b85c` ;
- pré-BIR+ : export D1 restauré + integrity_check + SHA256 + miroir R2 PASS ;
- post-BIR+ : export D1 restauré + integrity_check + SHA256 + miroir R2 PASS ;
- migrations : aucune migration à appliquer ;
- production health : `1.4.0-master-2.3.4-closure`, realMoney=false, Premium Live/Founder Control/Community Realtime/R2 actifs.

**Réception terrain :** encore à effectuer. Ne pas confondre CI/smoke avec validation complète par le fondateur.


## 16. Tranche terrain ciblée — qualifiée sur branche, production en attente (2026-09-18)

Checkpoint qualifié : `99a7c0c37fd7aa7f69fbce0eeb00342886b2bb2e` ; CI `35330825785 SUCCESS`.

Périmètre volontairement limité aux critiques terrain :
- deux feuilles visibles : « Votre feuille de séance » et « Vos fiches individuelles » ;
- saisie/correction par cellule avec éditeur compact ancré ; les valeurs environnantes restent visibles ;
- aucun renvoi obligatoire vers Finance pour saisir une cellule ;
- simulation Prêt : capital initial et paiements mensuels modifiables depuis la matrice ; moteurs CAPITAL_FIRST / INTEREST_FIRST inchangés ;
- menu Tontines synchronisé avec les rubriques TONTINE du groupe, création additionnelle possible, montant total du pot calculé, membres/cycles alimentés et classement des bénéficiaires ;
- vue « Membres & habilitations » dédiée ; Dossier Membre déplacé dans cette vue ;
- vue « Back-office » dédiée ;
- Carnet membre présenté en sections métier au lieu d'un dump JSON ;
- le starter métier est « Timbre de prêt » ; aucun starter générique « Timbre » n'est injecté automatiquement.

Statut : `QUALIFIED_BRANCH`. Ne pas déclarer `PRODUCTION_VERIFIED` avant BIR+, déploiement et smoke ciblé.

## 17. Production 1.4.1 — réajustement terrain livré (2026-09-20)

**Production actuelle : `1.4.1-field-integrity-home-sessions`.**  
**Branche : `next/1.4.1-field-integrity-guardrails-20260919`.**  
**Source déployée : `024b9837b6fa577c0c2c39297c2ce672f7d130b3`.**  
**Run production : `35488899806 SUCCESS`.**

Acquis 1.4.1 sur branche :
- Accueil Groupe et Accueil Membre raccordés aux owners canoniques ;
- identité publique ECO-GRP + profil déclaration/mandat ;
- page Séances comme cockpit complet ;
- date/lieu/thème/tenue sur MeetingService ;
- présence gouvernée ;
- bénéficiaire déclaré avant preuve ;
- preuve de réception immuable et idempotente avec code ECO-RCP non secret ;
- photo/PDF de preuve via artifact store/R2 ;
- créances membre filtrées dans ReceivablesService ;
- correction financière avec revue indépendante systématique ;
- offline snapshot explicite, actor-scoped, jamais substitut d'une réussite serveur ;
- dictée à confiance contrôlée ;
- PWA/cache 1.4.1 ;
- workflow de production 1.4.1 avec qualification + BIR+ pré + déploiement + smoke + BIR+ post.

Ne pas confondre :
- CI branche = qualification technique ;
- smoke production = présence fonctionnelle de marqueurs ;
- recette terrain = validation réelle Bureau/membre/offline/bruit/senior.

`realMoneyEnabled=false` reste obligatoire.

## 18. BIR+ de fermeture 1.4.1
- checkpoint : `4edf2dcb27c54303becce71ac9bd5b7db2c50496`
- qualification : `35489112828 SUCCESS`
- backup final : `35489112862 SUCCESS`
- artifact : `10598209553`
- source + D1 exportés ;
- restauration SQLite : `PRAGMA integrity_check=ok` ;
- SHA256 vérifiés ;
- miroir R2 : `birplus/1.4.1/4edf2dcb27c54303becce71ac9bd5b7db2c50496/final/` PASS.

Le prochain travail normal est la recette terrain de la production 1.4.1. Aucun nouveau déploiement n'est nécessaire avant qu'un défaut reproductible le justifie.

## 19. Production 1.4.2 — Centre opérationnel / Séances / Blueprint

**Production actuelle : `1.4.2-operational-center-sessions-blueprint`.**  
**Branche : `next/1.4.2-operational-center-sessions-blueprint-20260920`.**  
**Source déployée : `61a6d83ac5793bb5fecac7ba77a7bd4149031e27`.**  
**Run production : `35497930031 SUCCESS`.**

Décisions d'architecture désormais implémentées :
1. `operations` = **Centre opérationnel**, cockpit transversal préservé.
2. `sessions` = page métier **Séances**, centrée sur une réunion déterminée.
3. `MeetingService` = owner unique du contexte séance et de la présence.
4. Ledger/Receivables/Evidence restent les owners canoniques de leurs vérités ; la nouvelle page ne crée pas de second moteur financier.
5. La saisie/correction membre reste déléguée aux deux feuilles canoniques.
6. Navigation mobile : labels lisibles, scroll horizontal/snap, recentrage de l'onglet actif, aucune fonction supprimée pour gagner de la place.

Blueprint 5.0.0 rendu exécutable :
- Association/Tontine d'abord : Anticipation, Meeting Autopilot, Group Doctor ;
- besoins/opportunités : Opportunity Need, Demand Exchange, Smart Procurement ;
- commerce local : Eco NOW, Harvest & Local Commerce, Fresh Drop, Pickup Network ;
- valeur/activité : Value Discovery, Business Studio, Business Agent, Talent, Creator & Seller Studio ;
- confiance : Trust Graph explicable, Market Intelligence, SAFETY.ANTISCAM ;
- les workflows sont créés en DRAFT, exigent validation humaine avant ACTIVE et ne créent jamais silencieusement une transaction ;
- doctrine : **PRÉDIRE/OBSERVER → PROPOSER → VALIDATION HUMAINE → EXÉCUTER DANS L'OWNER CANONIQUE** ;
- **prévision ≠ demande ≠ engagement ≠ transaction** ;
- Group Buy est transmis au moteur `MARKETPLACE.GROUP_BUY` existant ;
- Forum/Communautés sont enrichis via presets d'action, sans second moteur social ;
- Eco Route / Backhaul / Return Load demeure un projet autonome extérieur à Eco-System.

Financial Lab :
- `SAFETY.ANTISCAM.FINANCIAL_LAB` passe à **FUNCTIONAL_BETA** ;
- analyse déterministe de scénarios/hypothèses ;
- aucun verdict juridique automatique « Ponzi/arnaque » ;
- aucune action d'argent réel.

Preuves production :
- qualification : `35497930024 SUCCESS` ;
- déploiement + smoke + BIR+ pré/post : `35497930031 SUCCESS` ;
- Worker Version ID : `b54df0a5-2338-4e37-8b4d-a05351b43658` ;
- tests : **264/264 PASS** ;
- D1 : `eco-system-db`, aucune migration ;
- R2 : `eco-system-backups`, préfixes pré/post du SHA déployé, miroir PASS ;
- artifacts GitHub : `10601637363` et `10601512437` ;
- `realMoneyEnabled=false`.

**Limite vraie :** ces preuves établissent CI + déploiement + smoke. Les capacités orientées utilisateur restent FUNCTIONAL_BETA jusqu'à la recette terrain du fondateur.

Document maître :
`docs/implementation/ECO_SYSTEM_Document_Maitre_Implementation_Blueprint_Executable_1.4.2_2026-09-20.md`


## 20. BIR+ de fermeture 1.4.2
- checkpoint : `d1a69bb5c904268d5f16fc2421e2246154000598`
- qualification : `35498239952 SUCCESS`
- backup final source + D1 : `35498239942 SUCCESS`
- artifact : `10601038586`
- restauration SQLite : `PRAGMA integrity_check=ok`
- SHA256 : vérifié
- miroir R2 : `birplus/1.4.2/d1a69bb5c904268d5f16fc2421e2246154000598/final/` — PASS

La production 1.4.2 est donc sauvegardée après synchronisation de la vérité projet. Prochaine étape : recette terrain réelle ; ne pas confondre PRODUCTION_QUALIFIED et FIELD_ACCEPTED.


## LATEST — hotfix visibilité PWA 1.4.2 (2026-09-20)

La production fonctionnelle reste **1.4.2-operational-center-sessions-blueprint**, mais sa source déployée est désormais :
`a9fe00f94daa7a6787d5a4440a5edc0bc5e4a1c8`.

Pourquoi ce hotfix :
- le shell 1.4.2 était déployé et smoke-testé ;
- un navigateur/PWA déjà contrôlé par l'ancien shell pouvait cependant rester visuellement sur 1.4.1 ;
- `ensureCurrentServiceWorker()` était défini mais jamais appelé.

Correction :
- invocation active du contrôle/mise à jour du Service Worker avant `start()` ;
- aucun changement de cache canonique, version runtime, Ledger, D1, modèle métier ou argent réel ;
- test anti-régression permanent.

Preuves :
- commit test qualifié : `113ad9fc021edecdb4fdc03696d7288125ca9c81` — **35499635884 SUCCESS** ;
- source de production : `a9fe00f94daa7a6787d5a4440a5edc0bc5e4a1c8` ;
- qualification même SHA : **35499693852 SUCCESS** ;
- déploiement + smoke + BIR+ : **35499693884 SUCCESS** ;
- artifacts : pré **10602035551**, post **10602215385** ;
- D1 `eco-system-db` et R2 `eco-system-backups` réutilisés ;
- `realMoneyEnabled=false`.

Point terrain immédiat : ouvrir/actualiser l'application sur le téléphone et vérifier que le menu affiche **Centre opérationnel** séparé de **Séances**, puis tester les huit sections Séances. Ne pas marquer FIELD_ACCEPTED avant cette vérification réelle.


## 19. Production 1.4.2 post-hotfix — références finales
- source déployée : `a9fe00f94daa7a6787d5a4440a5edc0bc5e4a1c8`
- Worker Version ID : `6c7b4be2-7daa-4f15-ae11-0861d248f60a`
- qualification production : `35499693852 SUCCESS`
- deploy/smoke/BIR+ : `35499693884 SUCCESS`
- tests : `265/265 PASS`
- checkpoint documentaire final : `d686929b44bf9f5f61ddee2ddee434e891c39afb`
- qualification finale : `35499946396 SUCCESS`
- BIR+ final : `35499946216 SUCCESS`
- artifact : `10600699685`
- R2 final : `birplus/1.4.2/d686929b44bf9f5f61ddee2ddee434e891c39afb/final/`
- realMoneyEnabled : `false`.

La production est TECHNIQUEMENT QUALIFIÉE. Les nouveaux parcours restent FIELD_ACCEPTED uniquement après observation réelle du fondateur.

## 19. Production 1.4.3 — Blueprint exécutable 5.0.0 livré (2026-09-21)

- version : `1.4.3-blueprint-5-0-0-finalized`
- source : `96b8f41467af476b12179b786d7d8f140ef86ce7`
- Worker Version ID : `07939344-ceca-4578-bc3b-3d1d589ad7eb`
- workflow production : `35560714108 SUCCESS`
- tests : `265/265 PASS`
- D1 `eco-system-db` : réutilisée ; aucune migration à appliquer
- R2 `eco-system-backups` : réutilisé
- BIR+ pré : artifact `10621409310`, miroir R2 PASS
- BIR+ post : artifact `10621833522`, miroir R2 PASS
- PWA : cache `eco-system-v143-blueprint-5-0-0-finalized-20260921`; scripts/styles network-first no-store.
- Blueprint 5.0.0 : six couches ; Communities/Forums/Partners utilisent les owners canoniques existants.
- realMoneyEnabled : false.

Le smoke distant est qualifié. La visibilité et l’ergonomie sur l’appareil réel du fondateur restent une recette terrain à constater, pas une réussite inventée.



## Candidat 1.5.2.7 — Live Completion gouverné (2026-09-27)

État exact :
- branche candidate : `finish/live-whatsapp-completion-20260927` ;
- PR : **#29**, base `audit/live-completion-20260926` ;
- version runtime/build : `1.5.2.7-live-completion` ;
- cache PWA : `eco-system-v1527-live-completion-20260927` ;
- HEAD qualifié avant mise à jour documentaire : `bd6d541a350f0c86556c12fea000c3d04acb5d16` ;
- qualification gouvernée : **run #397 / 36353667354 — SUCCESS** ;
- catalogue : **164 capacités = 154 FOUNDATION_ACTIVE + 5 STRUCTURAL_V1 + 5 PLANNED_DOMAIN** ;
- argent réel : **OFF** ; aucun nouveau rail de paiement réel n'est activé.

Acquis principaux du candidat :
1. Live proactif : reconnexion, heartbeat, replay/rattrapage paginé et réinjection des événements durables dans les écrans sans rafraîchissement manuel.
2. WhatsApp : `SHARE.WHATSAPP.HANDOFF` opérationnel avec deep link Eco-System ; le provider automatisé `INTEGRATION.WHATSAPP` reste external-gated.
3. Saisies financières canoniques conservées : aucune seconde source de vérité, aucun remplacement du Ledger.
4. Search universelle, calendrier unifié, variantes de groupe/tontine, Starter Kit, Document Studio, Paper Bridge/Print, Data Quality et Time Machine non destructif.
5. Prépaiements « ledger once », autorisations après clôture à comptes indépendants, enveloppes membres, Wallet dérivé du Ledger, Trust Graph explicable/advisory.
6. Business Studio, mandats, Creator/Talent, profil public opt-in, Opportunity Graph, Value Discovery, Market Intelligence, dashboards par rôle, Assistant local, Quiet Watch et Founder AI gouverné.
7. Correction métier verrouillée : **Collation, Ration et Aide locale sont des rubriques principales remboursables simples** ; **Main levée est un vrai domaine/rubrique Assistance/Solidarity**, espèces ou nature selon la pratique. Aucune de ces deux capacités n'est classée dans « Autres ».

Capacités volontairement non déclarées complètes :
- `GEO.DIRECTORY` : recherche par localité existante, mais géolocalisation appareil/GPS consentie complète non encore qualifiée ;
- `INTEGRATION.SMS`, `INTEGRATION.WHATSAPP`, `INTEGRATION.TELEGRAM`, `INTEGRATION.EMAIL` : adaptateurs fournisseurs externes non activés ;
- `COMMUNITY.VIDEO`, `MARKETPLACE.REWARDS`, `INTEGRATION.MOBILE_MONEY`, `SECURITY.MFA`, `FEDERATION.GROUP_NETWORK` : domaines planifiés, à ne pas simuler.

Limites de vérité :
- **PR #29 non fusionnée à cet instant** ;
- **1.5.2.7 non déployée en production à cet instant** ;
- smoke Cloudflare et BIR+ 1.5.2.7 non encore exécutés ;
- recette réelle Chrome/Opera/mobile/offline/deux gestionnaires non encore FIELD_ACCEPTED.
Ces états ne doivent être promus qu'après preuves correspondantes.


## PRODUCTION 1.5.2.7 — Live Completion livrée (2026-09-27)

Production vérifiée :
- version : `1.5.2.7-live-completion` ;
- source déployée : `c0dcbfa4391b46773d1e2c8d6b9733cc5d8b367c` ;
- branche de livraison : `fix/1.5.2.6-field-persistence-pc-mobile-20260925` ;
- Worker Version ID : `0c06d6f3-382c-4433-91b4-b071c0573ccd` ;
- build ID : `eco-system-1.5.2.7-20260927` ;
- PWA cache : `eco-system-v1527-live-completion-20260927` ;
- catalogue production : **164 capacités** ;
- qualification branche : run **#19 / 36354372028 SUCCESS** ;
- E2E financier navigateur : run **#79 / 36354371970 SUCCESS** ;
- deploy + CI + browser + backup + smoke + restore : run **#2 / 36354371977 SUCCESS** ;
- D1 : `eco-system-db` réutilisée, **No migrations to apply** ;
- R2 : `eco-system-backups` utilisé (`artifactStorageMode=R2`) ;
- snapshot pré : artifact **10943029509** ;
- snapshot post : artifact **10942949813** ;
- restauration du snapshot post + `PRAGMA integrity_check` : **PASS** ;
- smoke : version, SHA, buildId, cache PWA et catalogue 164 exacts ;
- `realMoneyEnabled=false`.

Correction E2E importante avant livraison :
- le premier run de livraison s'est arrêté avant production parce que l'ancien test PWA cherchait encore le cache 1.5.2.6 ;
- le test a été rendu release-aware au commit `d7930d16dabeeb9c278872768ed274f968d49d60` ;
- qualification #18 et E2E #78 ont ensuite réussi avant le nouveau déclenchement ;
- aucune régression financière n'a été masquée.

Sémantique métier à préserver :
- **Collation, Ration et Aide locale** : rubriques principales de même famille métier, jamais « Autres » ;
- **Main levée** : domaine/rubrique Assistance/Solidarity, cash ou nature selon la pratique, jamais « Autres » ;
- Wallet interne dérivé du Ledger ≠ Mobile Money ;
- Share WhatsApp utilisateur ≠ provider WhatsApp automatisé ;
- Time Machine reste non destructif ;
- Trust Graph reste explicable/advisory et non décisionnel.

Maturité :
- **154 FOUNDATION_ACTIVE** ;
- **5 STRUCTURAL_V1** : `GEO.DIRECTORY`, `INTEGRATION.SMS`, `INTEGRATION.WHATSAPP`, `INTEGRATION.TELEGRAM`, `INTEGRATION.EMAIL` ;
- **5 PLANNED_DOMAIN** : `COMMUNITY.VIDEO`, `MARKETPLACE.REWARDS`, `INTEGRATION.MOBILE_MONEY`, `SECURITY.MFA`, `FEDERATION.GROUP_NETWORK`.

La production est **TECHNIQUEMENT QUALIFIÉE**. Le statut FIELD_ACCEPTED reste réservé à la recette réelle du fondateur sur Chrome/Opera/mobile/offline/deux gestionnaires ; le smoke distant ne remplace pas cette observation.
