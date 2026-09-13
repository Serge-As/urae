# ECO-SYSTEM — État vérifié le 12 septembre 2026

Version locale : `1.1.2-qualified-local`. Socle serveur restauré depuis la sauvegarde `1.0.0-complete-app` du 11 septembre ; interface publique 1.1 récupérée puis corrigée. Ce travail ne constitue pas une récupération certifiée du serveur 1.1 distant.

## État distant et accès

- Le GET public de `https://eco-system.sergemimf.workers.dev/health` a répondu 200, version `1.1.0-cahier-app`, `realMoneyEnabled=false` ; racine HTML et catalogue de 139 capacités accessibles.
- Worker historique `eco-system`, D1 historique `eco-system-db`. Identifiants de runs, PR et empreintes 1.0 conservés dans HISTORICAL_TRUTH_2026-09-11.md : assertions importées, non revérifiées par accès authentifié dans cette session.
- Les secrets `CLOUDFLARE_ACCOUNT_ID` et `CLOUDFLARE_API_TOKEN` sont documentés dans les preuves historiques. Aucun secret lu, recréé ou publié ici.
- Accès GitHub authentifié désormais vérifié ; la publication du correctif est suivie dans le dossier de livraison. Production inchangée à ce checkpoint.

## Changements locaux

Sessions serveur, mots de passe dérivés, cookies HttpOnly, vérification d’origine, limitation de tentatives ; identité et rôles issus de la base. Registre financier atomique, idempotence avec comparaison de l’intention, contrepassations, relevés individuels, export CSV, matrice d’encaissements nets. Outbox sauvegardée avant envoi ; notes réellement conservées ; protection des files appartenant à d’autres comptes. D1 : recherche d’une publication par groupe corrigée, dernière projection de confidentialité privilégiée. Interface 1.1 conservée et textes dynamiques échappés.

Les principes Living Rules restent applicables : écrit / observé / validé distincts ; clôture comme checkpoint gouverné. Une liste d’identifiants ne vaut pas approbation de plusieurs personnes. Le workflow complet de quorum signé reste à développer.

## Qualification et limites

Voir QUALIFICATION.md et les journaux livrés. Compilation TypeScript et tests exécutés localement avec Node 24 et SQLite ; ce n’est pas une certification du runtime distant Cloudflare. L’authentification scrypt nécessite une qualification du budget CPU Workers avant déploiement. Ne pas activer en production sans rapprochement contrôlé entre les comptes et les anciens groupes.

La plateforme entière demandée n’est pas terminée : prêts/épargne complets, distributions rotatives, imports Excel/papier, signature/quorum, paiements fournisseurs, messagerie communautaire, marché transactionnel, IA opérationnelle, traduction intégrale, cache de travail hors ligne après redémarrage et récupération de compte restent notamment à traiter. Le catalogue et les dossiers persistants ne prouvent pas ces moteurs.


## Reprise 1.1.2 — 13 septembre 2026
Rubriques créées avant les paramètres financiers de l’association ; simulation indépendante ; noms personnalisés ; membres, parts et pots distincts ; programmation facultative des parts ; conservation SQL et édition après création ; reprise de conversion sans doublons ; cache des scripts cohérent avec le HTML. Les noms prévisionnels ne créent ni compte ni adhésion et aucun pot n’est décaissé automatiquement.
Accès GitHub authentifié vérifié pour Delor85. Branche source next/1.1.0-cahier-app, commit f7c203e919c644466289c587669ef817b74130af. Les 162 blobs de cette branche ont été récupérés par copie identique de 124 fichiers et téléchargement avec vérification SHA de 38 fichiers. Le serveur distant ne diffère du serveur source 1.0 que par les deux numéros de version : les défauts locaux corrigés concernent donc aussi ce code de branche. Aucune exploitation en production n’est revendiquée.
La plateforme complète reste ouverte selon l’audit : moteurs de distributions, prêts/épargne, quorum complet, import historique, communauté/marché et exploitation distante notamment. La création de rubriques et la programmation ne certifient pas ces moteurs.
Le déploiement doit encore qualifier l’authentification dans Workers et le rapprochement des identités historiques. Ne pas activer la nouvelle connexion en production au prix de bloquer les propriétaires des groupes anciens.

Qualification finale du 13 septembre : npm run ci exit 0 ; 65 tests sur 65. Preuves : docs/testing/QUALIFICATION_1.1.2.md.
