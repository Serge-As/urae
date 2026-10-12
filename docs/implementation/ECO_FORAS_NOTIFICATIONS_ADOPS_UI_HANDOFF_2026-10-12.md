# Eco-System — Foras personnels, alertes multi-groupes, AdManager et médias
Date: 2026-10-12 · Lot UI incrémental · **IMPLEMENTED_UNVERIFIED, NOT DEPLOYED, NOT FIELD_ACCEPTED**

## Autorités lues avant intervention
AGENTS.md; CURRENT_TRUTH; PROJECT_TRUTH_LEDGER; PROJECT_STATE; cahier maître 3.2.0 + 2.3.4; modèle AdOps 3.2.0; conventions fondatrices; Living Rules; FEATURE_REGISTRY; NEXT_RUN; vision Association/Tontine First et vision stratégique 10/10; Blueprint 5.0.0; passation 12/10.
La référence source est le HEAD de la branche preview `f2c38bc8d51001484b7395d4e4bf903cecf3919f`. PR #82 fusionnée sur candidate, #72 en HOLD. Aucun argent réel, aucun déploiement de production.

## Contrat livré dans ce lot (code soumis seulement)
1. `personal-cockpit-ui.js` : répertoire "Mes Foras" listant les groupes **avec appartenance vérifiée** et les communautés d'intérêt dont l'utilisateur est membre. Le lien change réellement de groupe par le flux standard `selectGroup` + `refreshGroupContext` et ouvre `communityEnginePanel`. Les communautés utilisent `eco:open-interest-community` et l'owner existant. Aucun deuxième magasin de posts.
2. **Protection des espaces personnels** : endpoint API `GET /api/v1/groups/mine` lit les appartenances actives via le dépôt canonique avant de retourner les groupes visibles (créateur ou membre actif). `ConnectedApplication.listMyGroups()` ne réutilise pas le catalogue général de tenant. Si la liste échoue, le cockpit dit « indisponible », jamais « aucun groupe ».
3. `ConnectedApplication.notificationsAcrossGroups()` : lecture explicite à l'ouverture du centre, par lots de trois requêtes simultanées, uniquement sur les groupes retournés par `listGroups()`. GET d'origine `/api/v1/groups/:id/notifications`, autorisations backend inchangées; conserve la provenance, n'altère pas le groupe actif, expose les échecs partiels. `markNotificationReadInGroup()` utilise le groupe indiqué, sans mutation de contexte.
4. `main.js` : Centre d'alertes de tous les groupes ; tri non-lues/criticité/date, état d'accès partiel, marquage de lecture et deep link vers le groupe concerné. **Aucune lecture de tous les groupes au repos** : seulement quand la vue Inbox est ouverte et à l'actualisation.
5. `ad-manager-ui.js` : véritable projection en direct des champs campagne (sans facturation, sans impression), aperçu du créatif et de ses placements; image R2 via `visualMediaBlob` seulement après choix explicite; lien vers studio médias existant; révocation des object URLs et actualisation des choix après upload. `styles.css` responsive.
6. Test Node contractuel + test de service multi-groupes dans `tests/personal-foras-multigroup-inbox-20261012.test.mjs` créé.

## Sources canoniques NON modifiées
- CommunityService / CommunityRealtimeStore; Interest Communities; Membership.
- NotificationService et ses droits/delivery (un message `PROVIDER_PENDING` ne devient jamais distribué sans reçu).
- AdManager, inventory, placements et R2 VisualMedia; pas de créatif activé automatiquement.
- Ledger, prêt, Récap, Outbox, Live, D1/R2 et ses migrations.

## Couverture réelle, sans exagération
- **Groupe / communauté** : le répertoire personnel exploite les espaces déjà accessibles.
- **Forum commun plateforme** : non encore implémenté/recetté. Ne pas détourner un forum privé de groupe ni créer une deuxième identité/tenant. Il faut spécifier et qualifier le forum plateforme avec appartenance, modération et publication publique via owners Community/Interest, séparé des données privées.
- **Notifications de NOW, Deal, Market, Academy, Founder, Forum** : elles ne paraîtront dans le nouveau centre que si le module produit effectivement un événement `NotificationService` accessible. Pas de promesse de couverture complète sans inventaire des émetteurs, préférences, destinataires, quiet hours, déduplication et tests multi-acteurs.
- **AdManager** : aperçu réellement relié au créatif et à la médiathèque du groupe, mais les placements livrés publiquement restent Accueil/Forum/Market tant qu'aucune preuve du reste n'existe. Bibliothèque fondateur / marque est distincte du studio groupe. Les paiements restent sandbox.
- **Médias** : le groupe peut sélectionner des images R2 déjà autorisées; aucune preuve nouvelle de redimensionnement serveur, CDN, scan ou upload R2 terrain par ce lot.

## Gates NON EFFECTUÉS
- `npm run ci`; Playwright desktop/mobile Chromium et WebKit; comparaison SHA du Worker déployé; D1/R2 réel; notifications inter-acteurs; passage de groupe avec foras actifs; iOS/Android6; gestion réseau absent et restauration.
- La vérification syntaxique isolée des trois JS modifiés et du test MJS a réussi, **mais n'est pas un test métier**.

## Reprise impérative
1. Exécuter build/typecheck + le test ciblé, corriger tout FAIL, puis suite complète avant tout déploiement.
2. Test navigateur multi-groupe: membre de G1/G2, non membre G3; clic "Mes Foras" depuis profil -> bon forum après changement; ne jamais exposer G3.
3. Vérifier alertes G1/G2 après reload et marquage lu, absence de polling au repos, pas de doublons.
4. Vérifier AdManager: upload image R2 isolé -> sélectionner le créatif -> aperçu correct -> brouillon -> revue indépendante -> activation sandbox -> présence sur placements réellement supportés -> pause/retrait.
5. Faire accepter le forum commun et les émetteurs notifications des autres capacités **dans le même moteur canonique**. Aucune facturation ou promotion production.
6. Mettre à jour truth ledger/state/feature registry seulement avec des résultats réellement obtenus; BIR+ et autorisation avant production.

**ÉTAT DU PROJET APRÈS ÉTAPE** : un premier lot UI est codé sur branche privée distincte, sans preuve d'exécution sur Cloudflare et sans promotion de maturité. Les demandes transversales intégrales restent ouvertes.
