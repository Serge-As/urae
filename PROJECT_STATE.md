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

# ECO-SYSTEM — PROJECT STATE


## NOUVELLE CANDIDATE 1.5.2.11 — cache PWA isolé, Live événementiel, quota D1 (2026-10-05)

Branche `fix/field-regressions-recovery-20261005`, PR brouillon #66. **Dernière production effectivement livrée** : 1.5.2.10 SHA `393f80df88076072317f08adee81fe14d54d06c5` (delivery GitHub `37130397965` SUCCESS le 3 octobre). La candidate 1.5.2.11 n'est **ni fusionnée, ni déployée, ni acceptée terrain**.

Protection nouvelle : `eco-system-v15211-field-recovery-20261005`, rollback `eco-system-v15210-offline-conflicts-loans-20261003`, scripts `?v=15211`, contrat `docs/release/CURRENT_RELEASE_CONTRACT.json` et Worker version/build synchronisés. Installation du nouveau SW dans un cache séparé, destruction du seul cache candidat en cas d'erreur, aucune suppression des outbox, IndexedDB, brouillons ni Ledger. Les lectures facultatives d'identité/Concierge/Observatoire n'ont plus lieu en arrière-plan de la saisie ; Live WebSocket conservé sans polling ; réseau et quotas traités par événements.

Les tests Chromium/WebKit + unitaires doivent encore prouver ce **SHA final** avant toute promotion. La revue des vieux caches installés sur les véritables appareils (Android 6, iOS, Firefox/Opera/Chrome), des deux gestionnaires et des conflits contradictoires reste une condition **FIELD_ACCEPTED** indépendante de la CI. Pas de migration D1, argent réel OFF, aucun état de compte Cloudflare consultable via cette session. Détails : `docs/recovery/ECO_FIELD_13_POINTS_2026-10-05.md`, `NEXT_RUN.md`.

---

## CANDIDATE ONLY — ECO 1.5.2.10 field recovery / Cloudflare Live (2026-10-05)

Le chantier n'est **pas** une nouvelle version de production. PR brouillon [#66](https://github.com/SergeDelor/tontine-platform/pull/66), base SHA `393f80df88076072317f08adee81fe14d54d06c5`. Sur la branche candidate, le Live est événementiel WebSocket (frappe, brouillon par cellule/acteur, date/auteur, validation), sans polling D1 à la seconde ; réduction des écritures d'identité D1 sur requêtes redondantes ; quota signalé explicitement, Outbox récupérée au retour réseau/quota. Les corrections de dette, politiques de prêt/épargne et historique tabulaire restent sous essais. CI sur `9c3ce510f3c2791cbd5c9de81b1e8a77f451b052` : **590/590 tests**, `browser-critical` SUCCESS, run `37317103271`. **FIELD_ACCEPTED=false**, **deployed=false** pour cette branche ; voir `docs/recovery/ECO_FIELD_13_POINTS_2026-10-05.md`. Requête utilisateur : éviter toute évolution non autorisée et ne jamais mélanger le cache SW v15210 avec du code nouveau avant versionnement complet et recettes.

---

## CURRENT OVERRIDE — 1.5.2.9 SOVEREIGN OFFLINE + BROADCAST QR + iOS — PRODUCTION VERIFIED (2026-09-28)

Production publique : `1.5.2.9-sovereign-offline`, SHA exact `faa23c6b279197b267dd1981529e39b5bd994d62`, Worker Version ID `0902744e-3293-448f-ad4c-5f6af2dd4804`, PWA cache `eco-system-v1529-sovereign-offline-20260928`.

PR #34 fusionnée : cycle offline souverain, journal local chaîné, Eco Vault, cycle d'exercice multi-années, Tontines/pots, prêts/remboursements, épargne/custody/solidarité local-first, calculs d'intérêts et reports sur appareil, Eco NumPad sans IA, capsules privées membres, Eco Broadcast QR ciblé, Eco Pack, Eco Local Room WebRTC/DataChannel, confrontation de journaux gestionnaires.

Preuves de qualification fusion : souverain+iOS `36377291009 SUCCESS`, WebKit smoke `36377291065 SUCCESS`, financier P0 `36377290960 SUCCESS`. Livraison Cloudflare : `36380950649 SUCCESS`. Le workflow a imposé CI complet, Chromium, WebKit/iOS, résolution D1/R2 existants, backup pré, migrations additives, déploiement, smoke SHA/version/build/cache/catalogue, backup post et restauration SQLite.

Récupération : backup pré artifact `10952617232`, backup post artifact `10952876681`, `PRAGMA integrity_check=ok`. D1 `eco-system-db` réutilisée, aucune migration, R2 `eco-system-backups` actif, catalogue 164, real money OFF.

iOS/WebKit : décodeur QR embarqué sans BarcodeDetector, assets Sovereign/Relay/Local Room/NumPad cachés pour mode avion, test WebKit offline cache vert, offre/réponse Eco Local Room + RTCDataChannel + paquet échangé sous WebKit, `playsinline`, arrêt caméra au background, fallback plein écran CSS, fichier via Web Share si disponible sinon téléchargement. Limite terrain : certains iPhone/iPad peuvent encore subir un bug WebKit `getUserMedia` en PWA standalone ; Safari et Eco Pack sont les fallbacks prévus. FIELD_ACCEPTED caméra réelle reste à constater sur appareils physiques.

Eco Broadcast : appairage membre individuel puis diffusion collective de trames `ECOB2` ciblées ; chaque téléphone ignore les 79/119 autres membres avant stockage et ne reconstruit que sa capsule. Garde-fou applicatif : maximum 120 membres par broadcast. Pour grands groupes, la durée optique dépend du volume réel de chaque capsule et du nombre de trames ; ne pas promettre une diffusion « instantanée ».

---

## CURRENT STATE — PRODUCTION 1.5.2.8 · N° MEMBRES + FINANCE OFFLINE ÉTENDUE (2026-09-28)

**Statut technique : DEPLOYED + SMOKE_VERIFIED + RECOVERY_VERIFIED. FIELD_ACCEPTED reste en attente de recette physique.**

- PR : **#33** — classement N° membres + finance offline étendue
- source déployée : `8e8a927ea0f968ce474473f3103cbddc0341a880`
- version : `1.5.2.8-geo-directory`
- build : `eco-system-1.5.2.8-20260928`
- cache PWA : `eco-system-v1528-geo-directory-20260928`
- Worker Version ID : `53eca7cc-ca2e-459a-b472-4741dfb9dc61`
- qualification PR après correction moteur vocal : **36365129048 SUCCESS**
- qualification post-fusion : **36365206808 SUCCESS**
- E2E financier Chromium post-fusion : **36365206898 SUCCESS**
- smoke WebKit/iOS post-fusion : **36365206944 SUCCESS**
- livraison : **36365348227 SUCCESS**
- E2E financier SHA de livraison : **36365348179 SUCCESS**
- WebKit/iOS SHA de livraison : **36365348226 SUCCESS**
- qualification terrain automatisée SHA livraison : **36365348250 SUCCESS**
- D1 : `eco-system-db` réutilisée ; **No migrations to apply**
- R2 : `eco-system-backups` actif
- sauvegarde pré-déploiement : artifact **10947511514**
- sauvegarde post-déploiement : artifact **10947645903**
- restauration post : **PRAGMA integrity_check=ok**
- catalogue : **164 capacités**
- argent réel : **OFF**

### N° de membre et classement responsable
- la feuille générale de séance possède une colonne **N°** distincte immédiatement avant **Membre** ;
- le responsable peut définir le classement 1…N, soit en saisissant les numéros, soit en appliquant l'ordre affiché ;
- les numéros doivent être uniques et continus ; ils sont persistés sur le Membership canonique, pas dans une table parallèle ;
- le classement peut être enregistré localement hors connexion puis rejoué via l'outbox ;
- les lignes financières suivent ce classement ;
- la dictée accepte les alias `membre numéro N`, `membre N`, `member number N`, etc. Le N° pointe vers le même membership canonique ;
- le moteur vocal accepte aussi les noms composés avec tiret (ex. Jean-Pierre).

### Finance hors connexion
Le parcours financier canonique conserve maintenant hors connexion :
- première cotisation / entrée positive ;
- correction/remplacement exact d'une cellule ;
- sortie/dépense ;
- prêt ;
- remboursement principal ou intérêt ;
- validation par ✓ ou Entrée.

Les intentions sont persistées dans IndexedDB avant synchronisation. Les opérations spécialisées utilisent `FINANCIAL_SHEET_ENTRY_V1`; leur projection est restaurée après rechargement toujours hors ligne. Le replay serveur est idempotent ; un prêt partiellement synchronisé est repris via `sheetEntryKey` au lieu de recréer un second prêt.

Preuve navigateur ajoutée : contribution + dépense `-700` saisies hors ligne, page rechargée hors ligne, valeurs encore visibles avec état local, puis reconnexion et persistance canonique serveur sans doublon.

### Limite honnête de la dictée sans réseau
La **validation/persistance financière** ne dépend plus du réseau. En revanche, l'enregistrement audio envoyé à Workers AI/Whisper pour produire une nouvelle transcription reste un service réseau. Une transcription déjà obtenue ou une instruction saisie en texte peut être interprétée ; ne pas présenter la reconnaissance audio cloud comme garantie offline.

---

## CURRENT STATE — PRODUCTION 1.5.2.8 GPS + DICTÉE FINANCIÈRE FINALISÉE (2026-09-28)

**Statut technique : DEPLOYED + SMOKE_VERIFIED + RECOVERY_VERIFIED. FIELD_ACCEPTED reste en attente de recette physique.**

- source déployée : `4ae39be95d0b3faa16e2d86a95b2d47368eb0945`
- intégration GPS : PR **#30** ; correction dictée financière : PR **#31**
- version : `1.5.2.8-geo-directory`
- build : `eco-system-1.5.2.8-20260928`
- cache PWA : `eco-system-v1528-geo-directory-20260928`
- Worker Version ID : `4e92501a-430d-463f-876e-784366a54b38`
- qualification branche voix/GPS : **36362304494 SUCCESS**
- qualification PR #31 : **36362426602 SUCCESS**
- qualification post-fusion : **36362508633 SUCCESS**
- E2E financier navigateur post-fusion : **36362508651 SUCCESS**
- déploiement / smoke / recovery : **36362622399 SUCCESS**
- D1 : `eco-system-db` réutilisée ; **No migrations to apply**
- R2 : `eco-system-backups` actif
- sauvegarde pré-déploiement : artifact **10946680088**
- sauvegarde post-déploiement : artifact **10945783708**
- restauration SQLite post-déploiement : **PRAGMA integrity_check=ok**
- catalogue : **164 = 155 FOUNDATION_ACTIVE + 4 STRUCTURAL_V1 + 5 PLANNED_DOMAIN**
- argent réel : **OFF**

### GEO.DIRECTORY acquis
- géolocalisation déclenchée uniquement par action explicite de l'utilisateur ;
- recherche par rayon avec fallback localité manuelle ;
- publication GPS facultative et révocable ;
- projection publique volontairement grossière/arrondie ; aucune position précise copiée dans l'audit ;
- `GEO.DIRECTORY` est maintenant `FOUNDATION_ACTIVE`.
Les 4 `STRUCTURAL_V1` restants sont uniquement les adaptateurs externes SMS, WhatsApp provider, Telegram et Email.

### Dictée financière P0 corrigée
- plus d'écriture streaming pendant la parole ;
- chemin principal : enregistrement audio en mémoire → Arrêter → transcription finale Workers AI Whisper → nettoyage → interprétation ;
- paramètres anti-boucle : VAD + `condition_on_previous_text=false` ; répétitions parasites Eco/echo/écho nettoyées ;
- fallback navigateur : résultats finaux seulement, sans redémarrage automatique ;
- résolution contre les membres, rubriques et séances réels du groupe ;
- plusieurs couples rubrique/montant peuvent être compris même sans ponctuation artificielle ;
- aucune mutation financière directe : la prévisualisation membre + séance + rubrique + sens + montant reste obligatoire avant validation ;
- l'audio n'est pas conservé par ce parcours.

### Recette terrain encore obligatoire
Vérifier sur appareils réels : permission GPS, recherche par rayon, refus/révocation GPS, microphone réel, transcription après Arrêter sans répétition « écho », bruit ambiant, bonne résolution membre/rubrique/séance, Android ancien/fallback, Chrome/Opera, offline/reconnexion. Ne déclarer `FIELD_ACCEPTED` qu'après constat physique.

---

## CURRENT STATE — 1.5.2.7 LIVE COMPLETION — RELEASE CANDIDATE QUALIFIÉE (2026-09-27)

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



## Production actuellement certaine
La dernière production déjà documentée avant cette candidate reste la lignée 1.5.2.x précédente. La candidate 1.5.2.7 ne devient vérité de production qu’après le workflow Cloudflare qualifié et son smoke exact.

# ECO-SYSTEM — PROJECT STATE

## CURRENT OVERRIDE — Production 1.4.5 Offline/Gouvernance (2026-09-22)

### Production vérifiée
- version : **1.4.5-final-mega-offline-governance**
- URL : `https://eco-system.sergemimf.workers.dev/`
- Worker : `eco-system`
- Worker Version ID : `29c8f0e2-1cb1-4361-8481-27b514906fcf`
- source déployée : `463035adab2303874878c8e72f1965475ac0b209`
- branche : `next/1.4.5-final-mega-offline-governance-20260921`
- PR : **#12**, gardée ouverte pour recette terrain
- qualification du SHA déployé : runs **35713621161 SUCCESS** (push) et **35713626133 SUCCESS** (PR)
- workflow qualification + build + BIR+ pré/post + déploiement + smoke : **35713621388 SUCCESS**
- tests : **298/298 PASS**
- D1 : `eco-system-db` réutilisée ; **No migrations to apply**
- R2 : `eco-system-backups`
- BIR+ pré : artifact **10688266480** + miroir R2 PASS
- BIR+ post : artifact **10688236533** + miroir R2 PASS
- préfixes R2 : `birplus/1.4.5/463035adab2303874878c8e72f1965475ac0b209/predeploy/` et `.../postdeploy/`
- Premium Live : **ACTIF**
- Founder Control / Community Realtime / R2 : **BOUND / PASS**
- argent réel : **DÉSACTIVÉ**

### Corrections terrain livrées
1. Android 6/PWA : shell cache-first, aucune recharge forcée lors du changement de Service Worker ; secours `crypto.getRandomValues()` si `randomUUID()` absent ; IndexedDB `openCursor()` si `getAll()` absent ; fallback JSON pour `structuredClone`.
2. Premier compte sans session serveur préalable : compte local `LOCAL_PENDING_REGISTRATION`, mot de passe dérivé PBKDF2 salé, session locale et données actor-scoped ; rapprochement serveur ultérieur + migration snapshots/outbox avant synchronisation.
3. Menus restaurés/visibles : Fiches membres, Rubriques, Prêts, Épargne, Assistances, Recap, Eco Relay, Eco Local, Corbeille, etc.
4. Deux feuilles restaurées : feuille de séance modifiable et fiches individuelles membres.
5. Feuille récapitulative : présente par défaut dans le sélecteur Séances et projetée aussi dans Recap, sans second Ledger.
6. Navigation Retour : historique vue/scroll/séance/onglet/feuille/ancres ; tout lien interne `#...` passe par la navigation gérée.
7. Saisie financière : cellule = **valeur totale cible**, jamais « montant à ajouter ». Test permanent multi-gestionnaires : 1000 → proposition 500 → consensus → total final 500, jamais 1500.
8. Multi-gestionnaires : correction d'une valeur existante ouvre une confrontation ; Ledger reste inchangé tant que la sélection n'est pas résolue ; majorité réelle des responsables.
9. Séance exacte : « Saisir/corriger » transporte l'ID de la séance sélectionnée vers la feuille canonique ; accès Autres séances + Nouvelle séance.
10. Séance clôturée : contexte et données financières restent corrigeables de façon gouvernée ; alertes aux gestionnaires et, pour donnée membre, au membre.
11. Alertes membre : barre verte pendant séance ouverte ; orange/rouge pour correction/après clôture, plus notifications groupe/Live selon disponibilité.
12. CRUD protégé : ajout/modification + mise à la Corbeille des séances, membres et rubriques ; restauration pendant 6 mois ; aucun bouton de suppression définitive ; Ledger/audit jamais effacés.
13. Rubriques : Prêt/Épargne/Assistance peuvent être ajoutées directement au groupe actif, sans recréer de groupe.
14. Eco Relay : paquet chiffré AES-GCM, expiration, nonce aléatoire, anti-rejeu, partage/fichier, auteur original conservé et rôle RELAY_ONLY.
15. Eco Local : transport WebRTC 1:1 après appairage, avec fichier/partage en secours.

### Limites à ne pas maquiller
- La recette terrain Android 6 réelle reste à faire par le fondateur après ce déploiement ; CI/smoke ne remplacent pas le test physique.
- iPhone/iOS : qualification statique/PWA acquise, **pas de recette physique iPhone** faute d'appareil disponible.
- Un téléphone qui n'a jamais eu Internet **et qui n'a jamais reçu les fichiers Eco-System** ne peut pas télécharger un site web sans réseau. Le compte/session n'exige plus Internet, mais le cas « appareil vierge + zéro Internet à vie » nécessite un paquet physique installable (APK/pack offline) à livrer séparément.
- Eco Local WebRTC est actuellement un transport local **1:1** ; ne pas prétendre qu'un fanout offline instantané vers 80 téléphones est déjà acquis.
- La Corbeille expire la capacité de restauration à 6 mois et retire définitivement l'élément des vues opérationnelles ; les preuves/audits financiers restent conservés pour intégrité.
- `realMoneyEnabled=false` reste obligatoire.

### Point de reprise
Faire maintenant la recette terrain sur PC + Android 6 **sans redéployer** : voir le badge 1.4.5, créer/ouvrir un groupe, vérifier les menus, les deux feuilles, la feuille récapitulative, correction 1000→500 à deux gestionnaires, alertes membre, séance clôturée, Retour, Corbeille, puis couper le réseau et créer un compte local sur un appareil disposant déjà du shell 1.4.5. Tout défaut reproductible devient un test avant correction.

---

Date : 2026-09-20

## Production publique — VERIFIED_REMOTE
- version : **1.4.2-operational-center-sessions-blueprint**
- URL : `https://eco-system.sergemimf.workers.dev/`
- Worker : `eco-system`
- Worker Version ID : `6c7b4be2-7daa-4f15-ae11-0861d248f60a`
- source déployée : `a9fe00f94daa7a6787d5a4440a5edc0bc5e4a1c8`
- branche : `next/1.4.2-operational-center-sessions-blueprint-20260920`
- D1 : `eco-system-db`
- R2 : `eco-system-backups`
- Premium Live : actif
- Founder Control Center : bound
- Forum/Community Realtime : bound
- artifacts : R2
- argent réel : **désactivé**
- qualification du SHA déployé : run **35499693852 — SUCCESS**
- qualification + build + pré-BIR+ + déploiement + smoke + post-BIR+ : run **35499693884 — SUCCESS**
- tests du workflow : **265/265 PASS**
- migrations : **No migrations to apply**
- pré-BIR+ et post-BIR+ : restauration SQLite + `PRAGMA integrity_check=ok` + SHA256 + miroir R2 validés.
- artifacts : pré-déploiement **10602035551** ; post-déploiement **10602215385**.
- R2 : `birplus/1.4.2/a9fe00f94daa7a6787d5a4440a5edc0bc5e4a1c8/predeploy/` et `.../postdeploy/` — **PASS**.
- smoke production : version/health + Centre opérationnel + vraie page Séances + mobile lisible + Blueprint exécutable + presets Forum/Communautés + Financial Lab + acquis 1.4.1 **PASS**.
- recette terrain : **EN ATTENTE** ; CI/smoke ne valent pas FIELD_ACCEPTED.

## Correction 1.4.0 — deux feuilles / toutes rubriques
La vérité métier opérationnelle est désormais :
1. **Votre feuille de séance** et **Vos fiches individuelles** sont les deux surfaces normales de saisie financière des membres.
2. Une rubrique créée et non archivée doit être visible sur les deux feuilles.
3. Le nombre de rubriques n'est jamais fixé à 20. Le test 20 reproduit un cas terrain ; les tests **1 rubrique** et **40 rubriques** passent également. Le validateur de lancement conserve un plafond technique de sécurité de 100 rubriques.
4. Amendes / Inscription / Timbre de prêt sont des rubriques possibles, pas un catalogue qui remplace les rubriques du groupe.
5. Un simple membre voit son groupe et sa propre fiche opérationnelle mais pas les fiches financières des autres.
6. Les menus spécialisés configurent/simulent/pilotent ; ils ne remplacent pas les deux feuilles comme saisie financière normale.

## Prêts + Intérêts — vérité 1.4.0
- les rubriques Prêt, Remboursement et Remboursement intérêts restent reliées aux deux feuilles ;
- le capital restant dû génère un intérêt à chaque nouvelle séance/période mensuelle tant qu'il est supérieur à zéro ;
- tout remboursement partiel du capital réduit immédiatement l'assiette taxable de la période suivante ;
- les intérêts impayés sont reportés séparément et ne génèrent jamais d'intérêt sur intérêt ;
- si le capital tombe à zéro et qu'il reste des intérêts, aucun nouvel intérêt n'est créé ;
- le gestionnaire peut comparer puis valider **CAPITAL_FIRST** ou **INTEREST_FIRST** au niveau de la politique de la rubrique Prêt ;
- la matrice de suivi est horizontale par mois/séance et expose capital initial/début, capital remboursé, capital restant, intérêt exigible, intérêt payé, intérêt restant, paiement, dette après séance, intérêt projeté et total projeté prochaine séance, avec synthèse/totaux ;
- longueur de simulation flexible, valeur par défaut 9 mois ; ce n'est pas une règle métier de 6 lignes ;
- lorsque la politique `blockNewLoanUntilSettled` est active, un nouveau prêt est refusé tant que le capital **ou** les intérêts du prêt précédent restent dus ;
- l'accrual mensuel est idempotent par prêt + séance.

### Exemple fondateur verrouillé
Capital 50 000 XAF, taux 5 %, paiements 0 / 30 000 / 20 000 :
- CAPITAL_FIRST : après le mois 3, capital = 0 ; intérêts dus = 6 000 ; mois 4 n'ajoute aucun intérêt et 6 000 libère la dette.
- INTEREST_FIRST : après le mois 3, capital restant = 6 250 ; mois 4 génère 312,5 XAF théoriques, arrondis actuellement à **313 XAF** dans l'unité entière XAF ; dette du mois 4 = **6 563 XAF**.

## Acquis conservés
10 étapes de création ; Collation ; multi-tontines ; participants distincts par tontine ; Living Rules ; Ledger canonique ; outbox/offline ; RECAP financier et séance ; fonds reconduits ; Tontine Manager ; savings yield ; CNI/phone/name matching protégé ; Forum/communautés ; Marketplace ; AdManager ; Partners/ONG ; Premium Live ; RI multi-documents ; Assistance Rulebook ; RegistrationPolicy ; Fairness Lab ; Group Doctor ; Meeting Autopilot ; AdOps/CRM ; House Ads contextuelles.

## Nuance de vérité
**Déployé + CI + smoke ne signifie pas recette terrain exhaustive.** Les nouveaux parcours 1.4.0 restent FUNCTIONAL_BETA jusqu'à validation terrain du fondateur.

## Documents de décision
- socle constitutionnel : Cahier maître 2.3.4, toujours actif sauf supersession explicite ;
- `docs/constitution/ECO_SYSTEM_Cahier_des_Charges_Maitre_Exhaustif_3.2.0_2026-09-16.md` ;
- `docs/memory/recalls/RECALL-2026-09-17-master-2.3.4-closure.md` ;
- `docs/change-impact/CIR-2026-09-17-master-2.3.4-closure.md`.

## Prochain jalon
Recette terrain ciblée de la production 1.4.0 : groupe à nombre variable de rubriques, présence identique dans les deux feuilles, compte simple membre, saisie Prêt/Remboursement/Intérêts depuis les feuilles, comparaison des deux politiques de remboursement et vérification du circuit réel sur plusieurs séances. Toute anomalie reproductible devient un test permanent avant correction.


## Correction terrain ciblée 2026-09-18 — candidate de production

- Checkpoint fonctionnel qualifié : `99a7c0c37fd7aa7f69fbce0eeb00342886b2bb2e`.
- CI de qualification : `35330825785 SUCCESS`.
- Deux feuilles visibles et éditables par cellule/pop-up compact.
- « Membres & habilitations » est séparé de Réunion ; Dossier Membre y est déplacé.
- Menu « Back-office » ajouté.
- Tontines reliées aux rubriques TONTINE ; calcul du montant total du pot ; listes Cycle/Membre ; classement bénéficiaires.
- Matrice Prêt modifiable pour la simulation sans altérer les règles financières.
- La production publique reste au checkpoint 1.4 précédent jusqu'au déploiement ciblé et au smoke final.

## Production 1.4.1 — Field Integrity / Accueil / Séances (2026-09-20)

La production publique **1.4.1 est maintenant déployée et smoke-testée** sur le SHA exact `024b9837b6fa577c0c2c39297c2ce672f7d130b3`.

Ligne de production :
- version : `1.4.1-field-integrity-home-sessions` ;
- branche : `next/1.4.1-field-integrity-guardrails-20260919` ;
- `realMoneyEnabled=false` inchangé ;
- D1 canonique à réutiliser : `eco-system-db` ;
- R2 privé à réutiliser : `eco-system-backups`.

Périmètre intégré :
1. Accueil Groupe enrichi sans second moteur comptable : code ECO-GRP, déclaration, mandat, Bureau, cycle, séances, situation Ledger/Récap, créances, classement Tontines.
2. Accueil Membre : propre situation, propres dettes, propres participations/bénéfices et accès aux fiches/simulations selon droits.
3. Séance complète : contexte date/lieu/thème/tenue, temporalité précédente/courante/suivante, finance, caisse, dettes, Back-office, présence, bénéficiaires, preuves et historique.
4. Preuve bénéficiaire : déclaration préalable, confirmation personnelle ou émargement responsable ou photo/PDF R2, preuve KERNEL.EVIDENCE immuable, retry idempotent, code `ECO-RCP-...` non secret.
5. Confidentialité créances : le responsable voit le rapport groupe ; le membre simple obtient uniquement ses obligations.
6. Correction financière : ancienne valeur + contrepassation + nouvelle valeur + motif + audit + revue indépendante ; auteur jamais son propre réviseur.
7. Offline : dernière projection actor-scoped avec horodatage, jamais faux succès serveur.
8. Dictée : garde de confiance, alternatives et preview obligatoire ; robustesse parfaite au bruit non déclarée acquise.
9. Deux conventions obligatoires : Autorité canonique unique + Reuse Before Build.
10. Labo financier anti-arnaques/Ponzi restauré comme `SAFETY.ANTISCAM` STRUCTURAL_V1, non présenté comme fonction terrain déjà qualifiée.

Documents :
- `docs/implementation/ECO_SYSTEM_PLAN_IMPLEMENTATION_REAJUSTEMENT_1.4.1_2026-09-19.md`
- `docs/constitution/ECO_SYSTEM_Additif_Reajustement_Accueil_Seances_Vision_1.4.1_2026-09-19.md`

Déploiement préparé par :
- `.github/workflows/deploy-production-1.4.1.yml`
- `.github/workflows/backup-birplus-1.4.1.yml`

Déploiement qualifié : run `35488899806 SUCCESS` ; Worker Version ID `d4e56867-077c-47cd-bfc9-9aba4735d596`. La recette terrain Bureau/membre/offline/bruit/senior reste distincte du smoke technique.

## Clôture BIR+ 1.4.1 — 2026-09-20
- checkpoint sauvegardé : `4edf2dcb27c54303becce71ac9bd5b7db2c50496`
- qualification du checkpoint : **35489112828 — SUCCESS**
- BIR+ final source + D1 : **35489112862 — SUCCESS**
- Artifact GitHub : **10598209553**
- D1 restaurée : `PRAGMA integrity_check=ok`
- SHA256 : validé
- miroir R2 final : `birplus/1.4.1/4edf2dcb27c54303becce71ac9bd5b7db2c50496/final/` — **PASS**
- ce BIR+ ferme le jalon de livraison ; la recette terrain reste la prochaine étape sans redéploiement préalable.

## Production 1.4.2 — Centre opérationnel / Séances / Blueprint (2026-09-20)

La candidate 1.4.2 a été promue sur la production publique par le workflow gardé **35497930031 SUCCESS**.

Décisions et acquis :
1. `operations` est le **Centre opérationnel** transversal ; son contenu historique utile est conservé.
2. `sessions` est la vraie page **Séances**, organisée autour d'une réunion précise.
3. `MeetingService` est l'unique owner du contexte séance et de la présence ; l'ancien doublon workspace a été supprimé du parcours.
4. La page Séances projette le Ledger et délègue la saisie/correction aux deux feuilles canoniques.
5. La navigation mobile conserve toutes les fonctions avec libellés lisibles, défilement horizontal et recentrage de l'onglet actif.
6. Le Blueprint 5.0.0 est rendu exécutable par des workflows gouvernés : observer/prédire → proposer → validation humaine → exécution par l'owner canonique.
7. Prévision ≠ demande ≠ engagement ≠ transaction ; aucun workflow Blueprint n'active de paiement réel.
8. Group Buy est transmis au moteur `MARKETPLACE.GROUP_BUY` existant ; aucun second moteur commercial n'est créé.
9. Forum et communautés sont enrichis par presets d'action, sans second moteur social.
10. `SAFETY.ANTISCAM` Financial Lab est FUNCTIONAL_BETA déterministe, sans verdict juridique et sans action d'argent.
11. Eco Route / Backhaul / Return Load reste explicitement hors périmètre d'Eco-System.

Preuves :
- source déployée : `61a6d83ac5793bb5fecac7ba77a7bd4149031e27` ;
- qualification : `35497930024 SUCCESS` ;
- déploiement / smoke / BIR+ : `35497930031 SUCCESS` ;
- Worker Version ID : `b54df0a5-2338-4e37-8b4d-a05351b43658` ;
- tests : **264/264 PASS** ;
- D1 existante réutilisée : `eco-system-db`, aucune migration à appliquer ;
- R2 : `eco-system-backups`, miroir BIR+ pré/post validé ;
- `realMoneyEnabled=false`.

Document maître d'implémentation :
`docs/implementation/ECO_SYSTEM_Document_Maitre_Implementation_Blueprint_Executable_1.4.2_2026-09-20.md`

Prochaine étape normale : recette terrain réelle sur téléphone et ordinateur, puis uniquement corrections reproductibles avec test permanent.


## Clôture BIR+ 1.4.2 — 2026-09-20
- checkpoint documentaire sauvegardé : `d1a69bb5c904268d5f16fc2421e2246154000598`
- qualification du checkpoint : **35498239952 — SUCCESS**
- BIR+ final source + D1 : **35498239942 — SUCCESS**
- Artifact GitHub : **10601038586**
- D1 restaurée : `PRAGMA integrity_check=ok`
- SHA256 : validé
- miroir R2 final : `birplus/1.4.2/d1a69bb5c904268d5f16fc2421e2246154000598/final/` — **PASS**
- la prochaine étape normale est la recette terrain 1.4.2 ; aucun nouveau moteur n'est requis avant défaut reproductible ou décision produit explicite.


## Hotfix visibilité PWA 1.4.2 — 2026-09-20

Constat terrain : la production 1.4.2 était bien déployée, mais un navigateur/PWA déjà ouvert pouvait continuer à présenter l'ancien shell 1.4.1. Le mécanisme `ensureCurrentServiceWorker()` existait mais n'était jamais invoqué.

Correction minimale, sans changement de modèle métier :
- appel actif de `ensureCurrentServiceWorker()` avant le démarrage normal de l'application ;
- maintien de l'identité runtime `1.4.2-operational-center-sessions-blueprint` ;
- maintien du cache Service Worker qualifié existant ;
- test permanent ajouté pour empêcher le retour d'un Service Worker défini mais non déclenché ;
- aucun changement Ledger, D1, règle métier, migration ou argent réel.

Preuves finales :
- test permanent / HEAD qualifié : `113ad9fc021edecdb4fdc03696d7288125ca9c81`, run **35499635884 SUCCESS** ;
- SHA de production : `a9fe00f94daa7a6787d5a4440a5edc0bc5e4a1c8` ;
- qualification du SHA de production : **35499693852 SUCCESS** ;
- deploy + smoke + BIR+ pré/post : **35499693884 SUCCESS** ;
- artifact pré : **10602035551** ;
- artifact post : **10602215385** ;
- `realMoneyEnabled=false` inchangé.

La recette terrain reste nécessaire : la première ouverture/actualisation du navigateur doit désormais permettre au shell courant de contrôler et mettre à jour le Service Worker ; CI/smoke ne remplacent pas l'observation réelle sur l'appareil du fondateur.


## Clôture post-hotfix 1.4.2 — d686929
- checkpoint final : `d686929b44bf9f5f61ddee2ddee434e891c39afb`
- qualification finale : **35499946396 — SUCCESS**
- BIR+ final : **35499946216 — SUCCESS**
- artifact : **10600699685**
- R2 : `birplus/1.4.2/d686929b44bf9f5f61ddee2ddee434e891c39afb/final/`
- D1 restore/integrity + SHA256 : **PASS**
- code production inchangé depuis `a9fe00f94daa7a6787d5a4440a5edc0bc5e4a1c8` ; seuls les documents de vérité/fermeture ont évolué après le déploiement.

## Production 1.4.3 — Blueprint exécutable 5.0.0 (2026-09-21)

Production vérifiée :
- version : `1.4.3-blueprint-5-0-0-finalized`
- branche : `next/1.4.3-blueprint-5-0-0-finalization-20260921`
- source déployée : `96b8f41467af476b12179b786d7d8f140ef86ce7`
- Worker Version ID : `07939344-ceca-4578-bc3b-3d1d589ad7eb`
- deploy + qualification interne + smoke + BIR+ pré/post : `35560714108 SUCCESS`
- tests : **265/265 PASS**
- D1 : `eco-system-db` réutilisée ; **No migrations to apply**
- R2 : `eco-system-backups` réutilisé ; BIR+ pré/post miroirs PASS
- artifact pré : `10621409310`
- artifact post : `10621833522`
- health : version 1.4.3, argent réel OFF, Premium Live / Founder Control / Community Realtime / R2 validés.

Apports visibles :
1. Centre opérationnel et vrai menu Séances restent séparés.
2. PWA 1.4.3 force scripts/styles en network-first `cache:no-store`, fallback cache seulement hors connexion.
3. Blueprint exécutable **5.0.0** visible et structuré en six couches.
4. Couche Communautés/Forums/Accompagnement ajoutée sans second moteur social.
5. Hubs : Business & fournisseurs, Formation & transmission, ONG/partenaires/impact, Créateurs & vitrines.
6. Publications contextuelles : Activité/vitrine, Partenaire/programme, Création/contenu utile.
7. Handoffs vers Community, Marketplace Group Buy et Partners existants au lieu de doublons.
8. Backhaul/Eco Route reste explicitement hors de ce repo.
9. `realMoneyEnabled=false` inchangé.

Document maître :
`docs/implementation/ECO_SYSTEM_Blueprint_Executable_5.0.0_Implementation_2026-09-21.md`.

La prochaine étape normale est la recette terrain sur téléphone/ordinateur ; tout défaut reproductible doit devenir un test permanent avant correction.



## Candidat 1.5.2.7 — état de clôture technique (2026-09-27)

Branche : `finish/live-whatsapp-completion-20260927`  
PR : **#29 → audit/live-completion-20260926**  
Runtime : `1.5.2.7-live-completion`  
PWA cache : `eco-system-v1527-live-completion-20260927`

Qualification de référence avant fermeture documentaire :
- HEAD : `bd6d541a350f0c86556c12fea000c3d04acb5d16`
- workflow : **Eco-System — Live Completion Qualification**
- run : **#397 / 36353667354 — SUCCESS**
- catalogue : **154 actives / 5 structurelles / 5 planifiées = 164**

Règles de conservation :
- les tableaux financiers et le Ledger canonique restent propriétaires des écritures ;
- Aide locale est au niveau métier Collation/Ration, jamais sous « Autres » ;
- Main levée reste Assistance/Solidarity, cash/nature selon les facettes ;
- WhatsApp handoff ≠ provider WhatsApp automatisé ;
- Wallet interne ≠ Mobile Money ;
- Time Machine n'effectue pas de rollback automatique ;
- Trust Graph n'est pas un score opaque décisionnel ;
- Founder AI/Assistant local/Quiet Watch ne peuvent pas exécuter silencieusement une mutation financière.

Non encore acquis à cet instant :
- fusion PR #29 puis PR #28 ;
- déploiement Cloudflare 1.5.2.7 ;
- smoke exact SHA + BIR+ pré/post ;
- FIELD_ACCEPTED Chrome/Opera/mobile/offline/deux gestionnaires.


## Production 1.5.2.7 — Live Completion (2026-09-27)

Livraison technique acquise :
- source déployée : `c0dcbfa4391b46773d1e2c8d6b9733cc5d8b367c`
- Worker Version ID : `0c06d6f3-382c-4433-91b4-b071c0573ccd`
- version : `1.5.2.7-live-completion`
- build ID : `eco-system-1.5.2.7-20260927`
- PWA cache : `eco-system-v1527-live-completion-20260927`
- qualification : **#19 / 36354372028 SUCCESS**
- E2E financier : **#79 / 36354371970 SUCCESS**
- delivery/smoke/recovery : **#2 / 36354371977 SUCCESS**
- D1 : existante, aucune migration à appliquer
- R2 : actif
- snapshot pré : artifact **10943029509**
- snapshot post : artifact **10942949813**
- restauration/integrity post : PASS
- catalogue : **164**
- argent réel : OFF

Capacités :
- 154 FOUNDATION_ACTIVE
- 5 STRUCTURAL_V1 (GPS/localisation complète + 4 providers de messagerie externes)
- 5 PLANNED_DOMAIN

Les saisies financières canoniques, Enter, offline/outbox, correction de cellule, prêts/dettes et Live ont été conservés. Le test navigateur PWA obsolète 1.5.2.6 a été rendu release-aware avant la livraison, puis le E2E a repassé en vert.

À constater encore sur appareils réels :
Chrome + Opera PC, mobile, offline/reconnexion, deux gestionnaires Live sans refresh, WhatsApp handoff/deep return et ergonomie terrain. Aucun FIELD_ACCEPTED ne doit être inventé avant cette recette.
