# NEXT RUN — Eco-System après 2.3.3 / Project Truth Ledger

## MEMORY BEFORE CODE
Lire `AGENTS.md`, puis **obligatoirement** :
1. `docs/memory/CURRENT_TRUTH.md` ;
2. `docs/memory/PROJECT_TRUTH_LEDGER.json` ;
3. `PROJECT_STATE.md` ;
4. Cahier Maître 2.3.4 ;
5. Feature Registry ;
6. recalls/CIR pertinents.

Puis lire `docs/governance/ECO_SYSTEM_PROCEDURE_OBLIGATOIRE_SAUVEGARDE_REPRISE_1.0.0.md`.

Puis :
```bash
npm run memory:recall -- "<chantier>" --write
npm run ci
```

## Vérité à ne pas régresser
- Branche locale : `recovery/0.5.1-memory-discovery-rubric-trust`.
- GitHub `main` et `release/0.5.0-eco-system-unified` ont été observés sur le commit initial `3664e4fa...` ; le code récupéré n'est pas encore considéré publié à distance.
- Le token Cloudflare **nommé** `tontine-platform-github-actions-deploy` est déjà créé selon le fondateur.
- `CLOUDFLARE_ACCOUNT_ID` existe déjà dans GitHub Actions Secrets.
- `CLOUDFLARE_API_TOKEN` existe déjà dans GitHub Actions Secrets.
- **Ne jamais demander de recréer ni divulguer ces éléments.**
- `eco-system-db` et le Worker `eco-system` restent `TO_VERIFY` tant que le workflow distant n'a pas fourni de preuve.
- `realMoneyEnabled=false`.
- 2.3.3 est la référence métier ; 2.3.2 reste snapshot immuable.

## Priorité 1 — publier sans casser l'histoire
1. `npm run ci`.
2. Créer une sauvegarde Git bundle `--all` du dépôt récupéré.
3. Importer la branche de récupération sur `Delor85/tontine-platform` sans force-push `main`.
4. Conserver la provenance des anciens SHA dans la mémoire même si l'API GitHub exige un commit de greffe différent du bundle local.
5. Ouvrir une PR vers `main`.
6. Qualifier la CI distante.
7. Mettre à jour `PROJECT_TRUTH_LEDGER.json` avec branche/PR/run réellement observés.

## Priorité 2 — Lot A Cloudflare, sans reconfigurer les Secrets
Workflow préparé : `.github/workflows/deploy-cloudflare-alpha.yml`.

Il doit :
1. lire les deux Secrets GitHub existants ;
2. `d1 list --json` ;
3. réutiliser `eco-system-db` si elle existe, sinon la créer ;
4. relire la liste afin d'obtenir l'UUID sans le committer ;
5. générer `wrangler.ci.toml` temporaire ;
6. appliquer les migrations additives ;
7. déployer Worker `eco-system` ;
8. vérifier `https://eco-system.sergemimf.workers.dev/health` ;
9. refuser le succès si `realMoneyEnabled` n'est pas `false` ;
10. inscrire la preuve distante dans Truth Ledger.

Aucune migration destructive, aucun secret modifié, aucun argent réel.

## Priorité 3 — Discovery/Membership après Cloud
Ne pas repartir d'une simple barre de recherche. Continuer le **Discovery mutuel** déjà spécifié et partiellement codé :
- visibilité/découvrabilité/join/preview séparées ;
- handles/code/QR/deep links ;
- invitations multi-canaux ;
- filtres affinité/localité/calendrier/bande d'engagement ;
- proximité consentie ;
- Group Fit Simulator privé ;
- saved searches/alertes opt-in ;
- groupe cherchant candidats opt-in ;
- recrutement/portfolio/questions/parrainage ;
- group reliability symétrique ;
- anti-enumeration téléphone/email ;
- explications, recours et réhabilitation ;
- richesse/apparence/prestige jamais utilisés comme sérieux.

## Deep source rule
Pour toute ambiguïté historique, consulter d'abord `SOURCE_DEEP_DIGEST_2.3.3.json`. N'ouvrir l'archive brute que si le digest ne suffit pas. Toute nouvelle découverte doit mettre à jour : master → digest → coverage → Feature Registry/Truth si nécessaire → tests/gates.
