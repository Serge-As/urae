# Eco-System — Procédure obligatoire de sauvegarde, preuve et reprise

Date : 2026-09-13

## 1. Principe
Aucune livraison Eco-System n'est considérée clôturée sans : qualification, preuve distante, Truth Ledger à jour, sauvegarde BIR+ reconstructible, vérification de l'archive et point de reprise explicite.

## 2. Avant toute modification
Lire, dans cet ordre :
1. `AGENTS.md` ;
2. `docs/memory/CURRENT_TRUTH.md` ;
3. `docs/memory/PROJECT_TRUTH_LEDGER.json` ;
4. `PROJECT_STATE.md` ;
5. le Cahier Maître réellement accessible et vérifié ;
6. `FEATURE_REGISTRY.yaml` ;
7. les Recall/CIR pertinents.

Puis exécuter `npm run memory:recall -- "<chantier>" --write` et `npm run ci`.

## 3. Garde-fous permanents
- Ne jamais force-push `main`.
- Ne pas supprimer les checkpoints Recovery/Alpha/0.6/1.0 existants.
- Réutiliser exclusivement `eco-system-db` tant qu'une décision d'architecture n'autorise pas autre chose.
- Migrations D1 additives uniquement.
- Ne jamais stocker de valeur de Secret, token, PIN ou clé privée dans les sauvegardes.
- `realMoneyEnabled=false` jusqu'à autorisation explicite séparée.
- Ne pas présenter une capacité `STRUCTURAL_V1` comme finalisée.
- Une pratique propre à un groupe ne devient jamais automatiquement une règle universelle.
- Toute opération offline financière reste une intention jusqu'à confirmation serveur.

## 4. Qualification obligatoire avant déploiement
1. `npm run ci` ;
2. TypeScript strict ;
3. Architecture Fitness ;
4. Shared Governance ;
5. Service Solidarity ;
6. Truth/Memory/Constitution/Source Coverage gates ;
7. tests fonctionnels ;
8. build PWA ;
9. vérification que le shell visible correspond au Master Cockpit et non à l'ancienne Alpha.

## 5. Déploiement Cloudflare
1. utiliser les Secrets GitHub Actions existants ;
2. résoudre `eco-system-db` ;
3. refuser de créer silencieusement une base de remplacement ;
4. appliquer uniquement les migrations additives ;
5. déployer le Worker `eco-system` et les assets PWA ;
6. vérifier `/`, `/health`, `/api/v1/product/capabilities` et le marqueur de release ;
7. refuser le succès si `realMoneyEnabled` est différent de `false` ;
8. enregistrer run ID, Worker Version ID, branche, commit et résultats dans le Truth Ledger.

## 6. BIR+ obligatoire
Après une livraison qualifiée :
1. produire une archive source depuis le HEAD qualifié ;
2. produire `MANIFEST.txt` avec version, branche, HEAD, URL et `realMoneyEnabled=false` ;
3. produire `SHA256SUMS.txt` portable ;
4. exécuter `sha256sum --check SHA256SUMS.txt` dans le dossier de l'archive ;
5. publier l'artifact GitHub Actions avec une rétention définie ;
6. télécharger l'artifact ;
7. comparer le digest ZIP téléchargé au digest GitHub ;
8. extraire/list-er l'archive source et vérifier sa lisibilité ;
9. sauvegarder une copie persistante dans `/Eco-System/` ;
10. enregistrer artifact ID, digest ZIP, SHA source, HEAD et chemin Library dans le Truth Ledger et Current Truth.

## 7. Clôture obligatoire
Le message de clôture doit contenir : Version ; Branche ; Commit ; PR ; CI ; Cloudflare ; D1 ; migrations ; URL ; santé ; catalogue ; problème traité ; cause ; correction ; fichiers modifiés ; tests ; résultats ; acquis ; reste à faire ; éléments à ne pas modifier ; point de reprise ; risques de régression ; BIR+ ; prompt de reprise.

## 8. Reprise dans un nouveau chat ou Codex
Le nouvel agent ne repart jamais de zéro. Il lit les fichiers de vérité, vérifie le HEAD et les runs distants, puis reprend seulement les tâches non acquises. Toute divergence entre documentation et runtime doit être signalée avant modification.

Cycle canonique :
`INGEST → FINGERPRINT → DEEP DIGEST → MAP → TRUTH LEDGER → RECALL → CIR/ADR → IMPLEMENT → TEST → REMOTE VERIFY → UPDATE TRUTH → ARCHIVE`.
