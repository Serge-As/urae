# ECO-SYSTEM — RECETTE TERRAIN MEGA-LOT 1+2+3+4+7+8+9+13

Version candidate: branche `next/1.4.4-offline-ios-safe-20260921` / PR #11  
Argent réel: OFF pendant toute la recette.

## A. Préparation
Utiliser au minimum:
- 1 iPhone/iPad Safari ajouté à l'écran d'accueil;
- 1 Android ancien ou faible mémoire;
- 1 Android récent;
- 2 comptes responsables distincts;
- 1 compte membre distinct.
Se connecter une première fois avec Internet sur chaque appareil participant, puis attendre le chargement complet du groupe avant les tests hors ligne.

## B. Test installation iOS
1. Ouvrir Eco-System dans Safari.
2. Utiliser le bouton d'installation et suivre Partager → Sur l'écran d'accueil → Ajouter.
3. Fermer Safari.
4. Ouvrir l'icône Eco-System.
5. Vérifier le mode application, les zones sûres et la navigation.
6. Couper Wi-Fi et données mobiles.
7. Fermer puis rouvrir l'application.
Résultat attendu: l'application se relance; Group Core chargé précédemment reste accessible.

## C. Test autonomie offline
Avec le réseau coupé:
1. consulter groupe, membres, rubriques, séances;
2. créer/simuler un projet;
3. convertir le projet en groupe;
4. ajouter des membres;
5. créer une rubrique;
6. modifier son activité, son modèle et ses politiques;
7. créer une séance;
8. modifier lieu/thème/tenue;
9. saisir les présences;
10. déclarer un bénéficiaire;
11. enregistrer une confirmation membre ou un émargement textuel;
12. saisir une cotisation cash;
13. faire le rapprochement de caisse;
14. clôturer la séance.
Résultat attendu: l'interface reste utilisable et chaque opération durable apparaît dans la file locale. Une cotisation locale reste en attente de confirmation serveur.

## D. Test fermeture/redémarrage
Toujours hors ligne:
1. fermer complètement l'application;
2. redémarrer le téléphone;
3. rouvrir Eco-System;
4. vérifier les données locales et la file.
Résultat attendu: aucune saisie durable ne disparaît.

## E. Test feuille récapitulative
1. ouvrir Séances;
2. vérifier l'ordre: Feuille de séance → Feuille récapitulative → Présences;
3. comparer des montants de plusieurs séances.
Résultat attendu: les données correspondent au Ledger/projections; aucune seconde comptabilité n'est créée.

## F. Test Retour exact
Depuis une séance:
1. choisir une séance autre que la dernière;
2. choisir un onglet;
3. descendre dans la page;
4. ouvrir un détail;
5. aller dans une autre vue;
6. utiliser Retour application;
7. refaire avec Retour navigateur puis Avancer navigateur.
Résultat attendu: vue, séance, onglet, position, détails et focus utiles sont restaurés. Aucun mot de passe/PIN/secret n'est mémorisé par cette navigation.

## G. Test multi-gestionnaires
Avec deux responsables:
1. même séance et même membre/rubrique;
2. Responsable A propose 1 000;
3. Responsable B propose 1 500;
4. vérifier DIVERGENT;
5. voter depuis des comptes distincts;
6. vérifier majorité/unanimité selon les votes;
7. maintenir une valeur différente avec motif;
8. vérifier RESERVE_OPEN;
9. vérifier que le Ledger n'a pas été modifié par le vote lui-même.
Résultat attendu: aucune saisie n'écrase silencieusement l'autre.

## H. Test diffusion membres
1. résoudre toutes les divergences COLLECTING/DIVERGENT;
2. cliquer « 2 · Diffuser aux membres »;
3. sur un membre, actualiser la situation.
Résultat attendu: la diffusion est durable; si offline elle reste en attente et part à la reconnexion. Si une divergence non résolue existe, la diffusion est refusée.

## I. Test contrôle membre
Pour une écriture financière:
1. vérifier la notification/situation;
2. Valider la transaction;
3. refaire avec une autre opération et Émettre une réserve;
4. responsable différent effectue la revue;
5. membre approuve après revue ou maintient la réserve.
Résultat attendu: réserve non bloquante, historique conservé, auteur ne valide pas sa propre correction quand la revue indépendante est exigée.

## J. Test finance / tontines / prêts / épargne
Vérifier sans argent réel:
- plusieurs tontines/rubriques indépendantes;
- participation facultative;
- parts et bénéficiaires;
- prêt, remboursement et capital restant;
- absence d'intérêt sur intérêt;
- simulations d'épargne/rendement;
- RECAP;
- correction par contrepassation et non modification silencieuse.
Résultat attendu: moteurs canoniques 1.4.3 inchangés dans leurs invariants.

## K. Test RI/documents
En ligne:
- TXT/MD/CSV/text;
- images;
- PDF;
- DOCX/ODT;
- Word legacy: signalement adapté.
Vérifier plusieurs documents et leurs empreintes. Aucune règle sensible ne doit s'activer automatiquement sans validation autorisée.
Hors ligne: ne jamais afficher une nouvelle pièce binaire comme téléversée R2 si elle n'a pas réellement été envoyée.

## L. Test reconnexion et doublons
Après plusieurs opérations offline:
1. réactiver Internet;
2. laisser l'app synchroniser;
3. presser Synchroniser plusieurs fois;
4. couper/rétablir le réseau pendant une synchronisation;
5. fermer/rouvrir;
6. vérifier Ledger, membres, rubriques, séances et caisse.
Résultat attendu:
- une cotisation = une seule écriture canonique;
- aucun membre/séance/rubrique dupliqué par replay;
- opérations confirmées ne repartent pas;
- après 5 échecs une opération n'est plus retentée automatiquement;
- bouton Réessayer réarme volontairement l'opération.

## M. Critères bloquants NO-GO
NO-GO si:
- double posting financier;
- perte de file après redémarrage;
- application iOS installée ne redémarre pas hors ligne après initialisation online;
- Retour ouvre la mauvaise séance;
- feuille récapitulative diverge du Ledger;
- consensus écrit directement dans le Ledger;
- réserve membre disparaît;
- pièce affichée comme R2 sans upload;
- régression du parcours de création, multi-tontines, Living Rules, RECAP, prêts/épargne ou contrôle membre.

## N. Après PASS
1. figer HEAD exact;
2. exécuter BIR+ pré-déploiement;
3. seulement après validation explicite, promouvoir/déployer;
4. smoke test production;
5. BIR+ post-déploiement;
6. inscrire run IDs, Worker Version ID, résultats iOS/Android et point de reprise.
