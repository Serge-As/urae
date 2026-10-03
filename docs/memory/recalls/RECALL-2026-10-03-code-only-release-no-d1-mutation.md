# RECALL — 2026-10-03 — Livraison code-only sans mutation D1

Base figée : `fa415a9955ab14c2192246f9ae77f46e71bea7b6`.

## Pourquoi ce lot existe
Le chantier Live gratuit a été qualifié en mode événementiel : aucune lecture financière D1 périodique, aucun heartbeat de brouillon, aucun retry Outbox en boucle. Le dernier obstacle de production est uniquement la publication du code et la rotation cohérente du cache PWA.

Le quota D1 ayant été signalé comme critique, la livraison ne doit pas exécuter d'export D1, de migration D1 ni de reconstruction de données. Le schéma D1 reste inchangé.

## Décision de livraison
- déploiement Worker/PWA **code-only** ;
- résolution du binding D1 existant autorisée, sans lecture métier en boucle ;
- aucun `wrangler d1 export` avant ou après livraison ;
- aucun `wrangler d1 migrations apply` pour ce lot ;
- smoke limité à la racine, `/health` et au catalogue ;
- nouvelle identité PWA : `eco-system-v1529-free-event-push-20261003` ;
- cache précédent conservé : `eco-system-v1529-free-conservation-debt-syncfix2-20261002`.

## Acquis à préserver
- saisie montant + ✓ + Entrée et remplacement exact ;
- position de tableau préservée ;
- Live event-push uniquement sur activité réelle ;
- brouillon/frappe sans montant financier dans les signaux ;
- dettes avec capital, intérêts dus et prochaine échéance ;
- rubrique officielle Remboursements ;
- tableaux membre × séance par rubrique ;
- Épargne + Intérêts issu des données réelles disponibles ;
- offline et Outbox sans faux succès.

## Preuves avant livraison
Le SHA `d72b0493345494c41c33c5d788ab79dc40a6a7d6` a passé après rerun :
- P0 Real Financial Cell Browser E2E ;
- Field Persistence Browser Qualification ;
- WebKit/iOS PWA Smoke ;
- Sovereign Offline + iOS Qualification.

La release ne doit pas être annoncée fonctionnelle terrain au-delà de ces preuves automatisées ; le test inter-navigateurs utilisateur reste l'autorité finale.
