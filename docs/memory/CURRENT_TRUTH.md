# ECO-SYSTEM — CURRENT TRUTH

Date : 2026-09-16

## 1. Production publique — vérité actuelle

- URL : `https://eco-system.sergemimf.workers.dev/`
- version : **1.3.2-savings-control-forum-live**
- Worker : `eco-system`
- Worker Version ID : `f6e8b41f-8093-4ca9-9feb-202a4037c7b9`
- D1 canonique : `eco-system-db`
- R2 privé : `eco-system-backups`
- Premium Live : **ACTIF**
- Control Center : **BOUND / production**
- Forum v2 temps réel : **BOUND / production**
- stockage artifacts : **R2**
- argent réel : **DÉSACTIVÉ**
- workflow de déploiement + smoke : run **35096484915 — SUCCESS**
- qualification du HEAD pré-déploiement : **SUCCESS**
- la ligne 1.2.0 est désormais historique et supersédée.

## 2. Branche et point de reprise

- branche : `next/1.3.2-savings-control-forum-live-20260916`
- reprendre au **HEAD distant le plus récent**, jamais à partir d'un SHA mémorisé sans le revérifier.
- ne pas repartir de 1.2 ou 1.3.1 pour continuer le développement courant.

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

## 4. Épargne — audit réel du classeur

Sources auditées : `Feuille mensuelle.xlsx` et `Rubriques Epargne à intérêts.xlsx`.

Vérités :
- intérêts encaissés : **18 500 F** ;
- pool Épargne classique : **12 950 F (70 %)** ;
- pool Épargne scolaire : **1 850 F (10 %)** ;
- indemnités Bureau : **3 700 F (20 %)** ;
- principal classique annuel : **14 935 199 F** ;
- principal scolaire : **1 081 000 F**.

### Moteur 1 — reproduction historique
Le pipeline `EPARGNE → Principal → Intérêts provisoires → Intérêts Finaux` est reproduit.
Écart maximum moteur Eco-System vs cellules finales cachées du classeur : environ **9×10^-13 F**.
Conclusion : **résultats mathématiquement identiques au classeur sur le jeu réel audité**.

### Moteur 2 — capital réellement productif
Il suit le capital effectivement prêté et peut appliquer `noLoanNoYield=true`.
Sur les preuves disponibles :
- prêt ordinaire enregistré : **50 050 F**, en janvier ;
- SPECIAL PRÊT : **50 000 F** ;
- remboursements principal : **75 500 F** ;
- les fichiers ne permettent pas encore de relier de façon certaine chaque remboursement à un lot de dépôt d'origine.

Le moteur 2 refuse donc d'inventer les liens manquants. Sous l'hypothèse conservatrice testée, les importants dépôts d'avril/octobre ne sont pas rémunérés s'ils n'ont financé aucun prêt prouvé.
L'Épargne scolaire ne reçoit pas artificiellement un rendement productif tant que le groupe n'a pas indiqué si sa caisse est mutualisée ou séparée pour les prêts.

Test fixture réel : commit `7ccbfef6e064431959f2f34d12fcbe2c5ba706e9`, CI **SUCCESS**.

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

- `docs/constitution/ECO_SYSTEM_Cahier_des_Charges_Maitre_Exhaustif_3.1.0_2026-09-16.md`
- `docs/economics/ECO_SYSTEM_Modele_Economique_Detaille_3.1.0_2026-09-16.md`
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
