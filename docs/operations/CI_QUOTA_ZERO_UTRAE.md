# URAE — PROTOCOLE INTERNE DE REPRISE AVEC QUOTA ACTIONS PRIVÉ ÉPUISÉ
**10 octobre 2026 — Diffusion interne via le dépôt privé.**

## 0. Cette procédure s'impose à toutes les tâches Eco
- **Dépôt privé de référence :** `SergeDelor/urae`, anciennement `SergeDelor/tontine-platform`. **Ne jamais publier sa visibilité ni son histoire**.
- **Dépôt public de tests auxiliaires :** `SergeDelor/utrae`. Ce n'est PAS une reconstruction de l'application.
- **Compte Delor85 :** hors périmètre. Aucun transfert ou changement autorisé.
- **Constat communiqué :** allocation mensuelle GitHub-hosted du propriétaire épuisée. Le compteur exact de facturation n'a pas été lu sur le compte par l'outil GitHub; vérifier dans GitHub Billing. L'existence du dépôt public ne réactive pas la quota privé.
- **Branche applicative récente repérée :** `evidence/cloud-qualification-20261009-a7c3336` (PR #74 et #76 fusionnées). `main` est essentiellement documentaire. Qualifier et désigner officiellement une branche de livraison avant d'automatiser quoi que ce soit.
- **Les tests existants ne disparaissent pas :** aucune nouvelle application, aucun nouveau backend, aucune migration D1/R2 automatiquement autorisée.

## 1. Routage des tâches et coût

| Charge | Où elle tourne maintenant | Preuve demandée |
| --- | --- | --- |
| TypeScript et Node de l'application | Windows local ou runner auto-hébergé **attaché UNIQUEMENT à URAE privé** | Code de sortie et SHA |
| Tests critiques finances, rubriques, prêts, Discover, groupes | Windows local ou runner privé avec SQLite fictif | Rapport ciblé + traces sans PII |
| Playwright Chromium/WebKit réel | Machine locale compatible ou runner privé sécurisé | Résultats navigateur et captures protégées |
| Tests de façade publique, interfaces approuvées et contrats synthétiques | Runner GitHub standard public **UTRAE** | Run UTRAE associé au SHA public indépendant |
| Recette téléphone sur application réelle | Cloudflare STAGING isolé ou tunnel HTTPS privé correctement authentifié | URL protégée + recette multi-appareil |
| Déploiement du backend existant | Chaîne privée actuelle, en changement contrôlé | SHA exact + approbation + rollback |

**À ne pas confondre :** un workflow public appelant un composant privé, ou un job dans URAE réutilisant un workflow défini dans UTRAE, **ne convertit pas** les tests de l'application privée en tests publics gratuits.

## 2. Guide concret Windows 10 / Git Bash
1. Ouvrir `"C:\Program Files\Git\git-bash.exe"` via Win+R, plutôt que `git.exe` qui se ferme.
2. Dans le clone local PRIVÉ existant (ne pas en créer un dans le dépôt UTRAE) :

```bash
cd /c/Users/Admin/Desktop/tontine-platform
git status
git remote -v
# Uniquement si origin pointe encore vers l'ancienne adresse :
git remote set-url origin https://github.com/SergeDelor/urae.git
git fetch origin --prune
git branch -a
node --version
```

3. Vérifier la présence de Node >= 24 et une branche applicative propre. **Ne pas forcer un checkout ni perdre les modifications locales.** Créer une branche privée de travail à partir du commit applicatif validé.
4. Tester suivant le changement :

```bash
npm ci
npm run build
npm run typecheck
npm test
# Qualification intégrale si l'environnement et la durée le permettent :
npm run ci
```

5. Si nécessaire, exécuter des tests ciblés : `node --test tests/NOM-DU-TEST.test.mjs`; les vrais tests navigateur nécessitent leur installation/dépendances et un serveur local. Ne jamais pointer les tests destructifs sur D1 de production. Le script `scripts/dev-server.mjs` écoute actuellement `127.0.0.1`; une recette smartphone doit passer par un **tunnel HTTPS authentifié** ou staging et non par l'ouverture non protégée du port.
6. Consigner dans chaque PR privée : SHA, commandes, PASS/FAIL, environnement, résultat des tests hors ligne et financier, déploiement/rollback.

## 3. Runner Windows privé — stratégie d'économies
- Dans **Settings > Actions > Runners** d'URAE privé : inscrire un runner Windows x64 sur la machine de confiance, réservé au dépôt privé, avec un compte local non administrateur si possible.
- Pour un workflow privé explicitement contrôlé, utiliser `runs-on: [self-hosted, Windows, X64]` (vérifier les labels exacts fournis lors de l'inscription), permissions minimales, `timeout-minutes`, `concurrency`, environnements de test fictifs. Aucun secret prod par défaut.
- Une machine auto-hébergée ne consomme pas les minutes de runners GitHub-hosted. Son électricité, son accès Internet, ses licences, son stockage et son entretien restent à notre charge.
- **Ne jamais associer ce runner au dépôt public UTRAE** ni laisser s'y exécuter des PR de contributeurs non fiables. Ne pas donner au runner accès permanent à Cloudflare production ou aux tokens maîtres.
- Faire un pilote smoke du runner avec une tâche sans secrets avant de migrer une seule qualification lourde. Ne jamais activer les 66 workflows en masse.

## 4. Réduction des coûts et non-régression CI
- Le dépôt contient de nombreux workflows versionnés, certains en duplication fonctionnelle. Beaucoup sont limités à des branches/chemins spécifiques et certains aux lancements manuels; **ne pas supprimer à l'aveugle**.
- Audit workflow par workflow : triggers `push`/`pull_request`, `workflow_dispatch`, `paths`, matrices, installation Playwright répétée, dépendances, durée et usage. Distinguer échecs instantanés liés au quota de véritables erreurs du produit.
- Garder la sécurité et les contrôles financiers en tant que gates de livraison, mais les faire exécuter localement/runner privé si le quota hébergé est à zéro. Si un contrôle GitHub obligatoire n'est pas disponible, obtenir un contrôle équivalent démontré et la revue nécessaire; si la règle de protection exige le check GitHub, utiliser le runner privé ou attendre plutôt que contourner.
- Réserver `UTRAE` aux tests **réellement publics et indépendants**. Une CI verte UTRAE n'est pas un PASS des 679 fichiers privés ni des scénarios de remboursement d'Eco.

## 5. Confidentialité maximale
- **Tous les modules non expressément autorisés restent privés**, notamment `packages/application`, `domain`, `rubrics`, `misc-rubrics`, `rubric-exceptions`, `discovery`, `value-discovery`, `finance`, `loan-simulator`, `savings-yield`, `operational-cockpit`, `founder-*`, `auth`, `group-*`, `member-*`, `meeting-*`, le cœur Workers API, les cahiers, archives, diagnostics et prompts.
- Ne PAS cloner le dépôt privé, publier ses builds, copier ses migrations D1, uploader ses artefacts, capturer des écrans à données réelles, ni prêter de tokens privés aux workflows publics.
- Ne PAS donner aux jobs publics accès aux Actions/reusable workflows privés : cela peut exposer logs, chemins et accès. Pas de `repository_dispatch` ni `workflow_run` qui transmet du code privé sous couvert de « tunnel de CI ».
- Les packages JS exécutés dans le navigateur sont lisibles par l'utilisateur. Si une règle métier doit demeurer secrète, évaluer son déplacement effectif dans un Worker serveur avant publication de nouveaux builds. **Ne pas effectuer ce déplacement massif sans plan de compatibilité hors ligne**, idempotence et non-régression.
- Garder les secrets dans les bindings Cloudflare Secrets; ne pas employer des `[vars]` pour les clés. Staging et production dans des domaines/bases distincts, contrôles d'accès. Ne pas contaminer le public avec des dumps/analytiques clients.
- Maintenir intacte la base locale IndexedDB historiquement nommée `tontine-platform` et le mécanisme durable Outbox tant qu'une migration formellement testée n'existe pas.

## 6. Téléphone
- **Application complète** : conserver le frontend/backend déployés actuels et l'API privée; monter un staging de test authentifié en HTTPS. Aucun déploiement automatique sur production et aucune opération financière réelle.
- **UTRAE Pages** : page synthétique uniquement. Une page accessible au téléphone ne prouve pas que la gestion de groupes, prêts, rubriques, intérêts ou Discover fonctionne.
- Recette progressive : login / permissions, groupes, rubriques, calculs financiers, offline, reprise réseau, idempotence, deux appareils, PWA; rapport par SHA.

## 7. Interdiction de publier sans autorisation
Une source publiable doit être **indépendante ou explicitement relue**, y compris tests, bundles, source maps, artefacts, captures, dépendances et historiques. Voir le protocole `security/UTRAE_PUBLIC_RELEASE_POLICY.md` sur la branche applicative et l'issue #75. Préparer des exports à historique neuf. Une publication temporaire est conservable par des tiers même après retour privé.

## 8. Livrables des prochaines PR privées
1. PR d'inventaire/tri de tous les workflows coûteux (pas de suppression aveugle).
2. Workflow smoke Windows auto-hébergé privé + rapport local reproductible (après configuration manuelle du runner).
3. Instrumentation du budget D1/Workers et corrélations avec les tests téléphone.
4. Staging mobile sécurisé du **produit existant**, sans refonte ni fuite.

**Cette note complète, et ne remplace pas, les issues privées #75 et #77. En cas de conflit, sécurité et intégrité financière priment.**
