# CIR — Windows sans Ubuntu local, diagnostic souverain et qualification Cloud

La préférence du fondateur modifie la voie d'exécution, sans modifier les règles métier. Réutilisation : le lanceur de diagnostic existant et les six scénarios souverains existants ; aucun nouveau moteur, Ledger, stockage métier ou owner. Scope live-sync reste par défaut. Scope sovereign-chromium choisit six scénarios inchangés sur Chromium, refuse sélection/exécution partielle ou skips, utilise le même build et un serveur SQLite synthétique neuf ; output-root rend le rapport accessible sans copie récursive PowerShell. Aucun téléchargement depuis ce diagnostic.

Tests : syntaxe examinée dans V8 seulement, exécution réelle du nouveau mode encore en attente. Le contrôle réel est la suite existante, comprenant handshake DataChannel/packet PING27, import/pairing/packet/Vault A01, PWA et Recap. qualified=false demeure dans tous les rapports ; aucun diagnostic n'écrit une archive qualifiée ou un gate WebKit PASS. scripts/qualify-eco-locally.mjs et les fichiers de tests ne changent pas ; les gates 657/8/6 restent.

Impact : outils de diagnostic et mémoire seulement ; aucun changement de production, D1/R2, argent réel, droits métier ou cache. Rollback : parent 8b6e05b restaure le lanceur précédent ; conserver la production attestée 1.5.2.14. Travail Cloud créé/runtime et lecture privée confirmés ; Git CLI sans auth, checkout exact incomplet, aucun PASS Cloud présumé.

ÉTAT DU PROJET APRÈS ÉTAPE : diagnostic préparé, exécution réelle à produire, qualification complète et livraison sous HOLD.
