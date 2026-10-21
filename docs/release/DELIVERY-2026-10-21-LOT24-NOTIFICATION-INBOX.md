# L24 — Inbox, notifications et liens privés

Point courant après les runs 39609454413 et 39609454216 : les contrôles ont bloqué la publication sur une course du démarrage de la boutique personnelle. Production v27 préservée. Un quatrième scénario L24 reproduit le clic Marketplace pendant le chargement retenu du catalogue ; il échoue bien sur la compilation précédente avec le panneau resté fermé. Une attente du démarrage dans le contrôleur existant est ajoutée avant la résolution des modules. Nouvelle qualification obligatoire : 868 natifs, 36 Chromium à la livraison, 34 dans la qualification séparée et 6 WebKit. Les résultats ci-dessous sur la source précédente sont historiques, pas une preuve de la nouvelle source.

État : code implémenté, **qualification globale partielle et publication bloquée**. Version préparée `1.5.2.28-notification-inbox`. La production vérifiée demeure `1.5.2.27-personal-commerce`, source `ec6b459f0afebbde1108ed92cdf01a7d9d88c69a`. L'autorisation de livrer existe ; les outils du plugin GitHub installé sont actuellement indisponibles dans ce chat. Aucun contournement, nouvelle clé ou installation n'est nécessaire pour qualifier le code localement.

## Ce qui est implémenté

NotificationService demeure l'unique propriétaire des avis, destinataires, préférences et lectures. La nouvelle Inbox rassemble les avis autorisés de plusieurs groupes sans changer le groupe actif pendant la lecture. Elle propose les filtres Toutes, Non lues et Urgentes, le groupe d'origine, la date et une distinction explicite entre disponibilité dans l'Inbox, lecture et résultat métier. Une lecture ne paie rien, n'approuve rien et ne clôt aucun dossier.

Un événement identifié et sa révision produisent un avis logique. Deux publications concurrentes de la même révision et du même contenu retrouvent le premier enregistrement ; un contenu incompatible pour la même révision est refusé. Une nouvelle révision est distincte. Les clés et identifiants des anciennes synthèses financières sont conservés : un rejeu d'outbox ne doit pas recréer ces avis sous de nouveaux identifiants. FinancialWorkCoordinator conserve les déclenchements et regroupements acquis, notamment le passage d'un membre au suivant.

La publication, la première lecture et les tentatives d'affichage utilisent une insertion sans écrasement dans le dépôt existant. Deux lectures concurrentes ne remplacent pas la première date. Une répétition n'ajoute pas un deuxième audit de publication. Aucun schéma nouveau, nouvelle table, migration ou deuxième moteur financier n'est ajouté.

Chaque lecture, lien, historique et tentative est contrôlé pour le destinataire courant. Un ancien droit ou une ancienne carte chargée ne suffit pas. L'ouverture revérifie les objets liés et leur portée ; elle ne marque pas automatiquement l'avis comme lu. Les liens de corbeille conservent la consultation du dossier archivé par ses lecteurs autorisés, sans restaurer l'objet ni accorder un droit de restauration. Les routes workspace génériques ne peuvent pas fabriquer ou modifier un avis.

La personne choisit les rappels de ce navigateur, des heures silencieuses dans un fuseau explicite, un silence d'une heure et sa reprise. Une préférence OFF explicite reste conservée lors d'une modification partielle. L'autorisation du navigateur n'est demandée qu'après un clic volontaire. Les réglages historiques des autres canaux sont conservés ; les nouveaux contrôles ne promettent pas un service d'envoi inexistant.

Un rappel local utilise un texte neutre, sans titre privé, nom ou montant. Une tentative `BROWSER_REQUESTED` reste une demande d'affichage, jamais une preuve de réception par le terminal. Les états refusé, indisponible, échec et silence restent séparés. Aucun état fournisseur confirmé ne peut être fabriqué par cette API. Courriel, SMS, WhatsApp et Telegram demeurent manuels ou indisponibles sans fournisseur effectivement configuré. Le réglage historique d'un résumé quotidien ne crée pas un ordonnanceur d'envoi.

« Copier le lien privé » vérifie d'abord les droits et ne met aucun titre ou montant dans l'URL. Le lien retrouve l'objet exact après connexion ; il n'accorde aucun droit à une autre personne. Copier n'est ni envoyer, ni recevoir, ni créer une vente ou une attribution commerciale. GrowthReferral et les propriétaires commerciaux restent inchangés.

Le panneau « Qui attend quoi ? » projette les obligations et dossiers encore ouverts du Kernel.Inbox. Une obligation terminée ou un dossier résolu disparaît de cette projection sans réécriture de sa source. Il affiche une date disponible et la partie attendue seulement si elle est connue ; une partie non précisée est présentée comme telle. Il n'invente ni responsable ni échéance et n'envoie aucune relance automatique supplémentaire. Le SAV transversal approfondi reste le lot 25.

La surface hérite des modes visuel, senior et assisté. Elle prend en charge le français et l'anglais, les petits écrans et le changement de contexte. À la déconnexion, le contenu du panneau et ses chargements en cours sont invalidés immédiatement. Hors ligne ou en cas d'échec de vérification, le panneau n'affirme pas avoir un état privé actuel. Les avis affichés sont relus sur le serveur ; aucun polling commercial ou de notifications n'est ajouté.

## Où l'utiliser après publication

1. Ouvrir **À faire**, puis le **Centre d'alertes**.
2. Choisir Toutes, Non lues ou Urgentes. Lire l'origine et la date avant d'ouvrir la cible.
3. Utiliser **Ouvrir avec mes droits actuels** ou le libellé de l'avis. Le contrôle métier final reste sur l'écran du propriétaire concerné.
4. Utiliser **Marquer comme lu** uniquement pour sa propre trace de lecture.
5. Ouvrir **Mes préférences et le silence temporaire** pour les rappels locaux. Autoriser le navigateur uniquement si souhaité.
6. Consulter **Mes traces de lecture et de transport** pour ses 20 dernières tentatives au maximum ; ces traces ne valent pas règlement, livraison commerciale ou approbation.
7. Consulter **Qui attend quoi ?**, puis l'action d'origine. Aucun bouton de cette projection ne solde automatiquement une obligation ou un litige.

## Qualification et publication

Compilation TypeScript normale réussie ; fermeture PWA de 73 ressources initiales et 49 dépendances transitives sans import manquant. **868/868 tests natifs réussis**, aucun échec ni ignoré, dont 33 contrats L24 en mémoire et SQLite/D1. **3/3 scénarios Chromium L24 réussis**, aucun ignoré ni scénario instable : lecture distincte du métier, préférences/permission/silence, lien privé après vraie connexion, refus d’un autre compte, mobile 360 px assisté FR/EN et état hors ligne honnête. Reçu vérifiable : `docs/release/evidence/LOT24-NOTIFICATION-INBOX-LOCAL-2026-10-21.json`. Ces résultats locaux ne remplacent pas la qualification distante obligatoire du même SHA.

Les workflows existants conservent la qualification complète du même SHA, la sauvegarde D1 en lecture seule avec restauration de contrôle, l'archive privée R2 relue et les vérifications publiques. Deux nouveaux fichiers sont ajoutés à la comparaison des empreintes, soit 31 fichiers attendus. Les clés et les ressources acquises sont conservées ; `db_mutation: none`, `realMoneyEnabled=false` et `FIELD_ACCEPTED=NOT_ACCEPTED` restent obligatoires. Aucun abonnement, service payant ou modèle externe n'est introduit.

Retour sûr : conserver les avis, lectures, tentatives et traces métier. Retirer le nouveau panneau si nécessaire et corriger vers l'avant ; ne pas effacer le stockage navigateur, les cookies financiers ou l'outbox. Un serveur ancien ne doit pas être remis en service en supposant qu'il respecte les nouveaux contrôles d'accès et d'immuabilité.

BIR+ / ÉTAT DU PROJET APRÈS ÉTAPE : L10 publié, L24 implémenté, qualification globale partielle et publication bloquée, L25 non commencé. Toutes les innovations des documents ne sont pas annoncées comme réalisées ; leurs identifiants et limites restent dans le registre des propositions. Coût exact des crédits de ce chat non mesurable.

## Corrections vérifiées pendant la qualification

Une première compilation a précédé un renforcement de corbeille ; elle a été refaite sur les sources finales. Le contrôle d’échec de notification a été raccordé à la nouvelle insertion canonique, en conservant ses assertions financières et en vérifiant que la panne est réellement injectée. La référence du cache essentiel a été alignée sur la version candidate. Les échecs initiaux ne sont pas effacés des journaux.

Le navigateur a révélé un formulaire remplacé par un rafraîchissement concurrent. Le panneau évite désormais les rechargements de fond redondants dans le même contexte et retire les anciens contrôles avant une actualisation explicite. Une modification de compte ou groupe invalide toujours immédiatement les chargements privés. Le lien privé ouvre la carte précise de l’Inbox après vérification, sans exécuter l’action métier liée. Les essais attendent la fin effective de la connexion avant d’évaluer son retour ; la mesure sans polling commence après les lectures explicites, pas pendant une requête encore en cours. Aucune assertion acquise ni porte de livraison n’est retirée.

Sur la compilation finale, les trois nouveaux scénarios L24 passent. Les contrôles acquis ne sont pas tous verts ; leurs résultats détaillés figurent dans le reçu local, sans test ignoré. Le réaffichage de la cellule de remboursement après F5 échoue au délai acquis de5secondes, et deux scénarios WebKit échouent faute de capacité RTC exploitable dans ce moteur local. Le scénario existant à deux comptes reste non vert : un premier essai a échoué sur la position après F5 ; le dernier échoue pendant la connexion Live attendue en10secondes. La cause est non établie. Une contrainte du poste ou du serveur local reste une hypothèse, pas une exonération. Les assertions et seuils sont inchangés. **La qualification globale du lot reste partielle et sa publication bloquée** ; ni cet échec ni le blocage GitHub ne sont masqués par les868natifs réussis. Les35Chromium et6WebKit distants doivent passer sur le SHA exact avant livraison. Les journaux initiaux et finaux sont conservés.

## Limites de charge et preuve de publication

Les cartes affichées sont bornées à 100, les actions en attente à 50 et l’historique présenté à 20 tentatives. Le dépôt lit encore les tentatives du groupe avant filtrage : ces limites d’affichage ne constituent pas une promesse de coût D1 constant ni une pagination serveur achevée. Aucun nouvel intervalle de polling n’est ajouté.

La production a été relue indépendamment dans le reçu local et demeure 1.5.2.27. Le plugin GitHub est installé, activé et autorisé ; ses appels de dépôt répondent toutefois qu’ils ne sont pas disponibles au modèle. Ce message ne prouve pas une déconnexion du compte et n’est pas un refus d’autorisation de publication. Aucune nouvelle publication L24 n’est revendiquée. La reprise commence par le rétablissement de ces outils et la lecture du HEAD distant, puis un ajout exact des contenus sous contrôle du HEAD attendu ; l’historique Git local importé ne doit pas être poussé.

## Contrats HTTP et exemples de reprise

Les routes restent servies par le Worker existant. Le contexte authentifié vient de la session courante, jamais d’un identifiant de personne envoyé pour emprunter ses droits.

| Méthode et route | Usage et limite |
|---|---|
| GET `/api/v1/groups/{g}/notifications` | Avis actuellement autorisés pour cette personne ; lecture seule. |
| POST `/api/v1/groups/{g}/notifications` | Publication par un gestionnaire habilité dans NotificationService. |
| POST `/api/v1/groups/{g}/notifications/{n}/read` | Première lecture du seul destinataire actuel ; aucun paiement ou dossier soldé. |
| GET `/api/v1/groups/{g}/notifications/{n}/action` | Revérification courante du destinataire, du groupe et de la cible. |
| GET `/api/v1/groups/{g}/notifications/{n}/history` | Lecture et tentatives de ce compte ; pas celles d’un autre destinataire. |
| POST `/api/v1/groups/{g}/notifications/{n}/attempts` | Trace idempotente d’un essai local ; aucune preuve fournisseur fabriquée. |
| GET / PUT `/api/v1/notifications/preferences` | Préférences de la personne authentifiée, fusion partielle des canaux, heures silencieuses et pause. |
| GET `/api/v1/inbox` | Projection des obligations et dossiers chez les propriétaires existants. |

Exemple synthétique de publication : un gestionnaire transmet `sourceEvent:{id:"meeting-summary-demo",version:1}`, un titre, un message, les canaux autorisés et l’action existante à ouvrir. Deux répétitions du même contenu retrouvent un avis ; un contenu différent avec la même révision est refusé. La révision2 représente une nouvelle évolution. Les anciennes synthèses conservent leurs clés d’idempotence et identifiants pour ne pas se dupliquer au rejeu d’une outbox.

Exemple de réglage : `channels:{WEB_PUSH:false}` conserve les autres choix sans les réactiver. Une plage `quietHours:{start:"22:00",end:"06:00",timezone:"Africa/Douala"}` couvre la nuit, y compris le passage à minuit. Les deux heures sont requises ensemble. `quietHours:null` retire cette plage ; `snoozedUntil:null` retire une pause. Une pause future est bornée à30jours par le serveur. Le panneau propose une heure, sans ordonnanceur ni fournisseur caché.

Exemple métier : un avis de synthèse de séance peut être disponible, non lu et associé à une opération financière déjà enregistrée. Le lire ne crée pas une deuxième opération. Une contestation encore ouverte reste ouverte après lecture. Pour son traitement, ouvrir l’action d’origine et suivre le workflow de son propriétaire ; le panneau « Qui attend quoi ? » ne remplace ni l’approbation indépendante ni Kernel.Cases. Une partie attendue absente de la source reste « partie non précisée ».

Les identifiants placés dans les segments d’URL sont encodés. La compatibilité des identifiants historiques contenant eux-mêmes une séquence encodée est testée. Les écritures directes via l’éditeur workspace générique sont refusées pour avis/lectures/tentatives ; elles doivent passer par ces routes canoniques.

Bilan chiffré final :868natifs réussis ; Chromium8réussis/2échoué(s) ; WebKit4réussis/2échoué(s), aucun ignoré. La disponibilité WebRTC du moteur nu est consignée séparément, sans charger le code Eco.

Comparatif de la base locale 1.5.2.27 : {"startTime": "2026-10-21T12:59:39.762Z", "duration": 151745.239, "expected": 2, "skipped": 0, "unexpected": 1, "flaky": 0}. Le même scénario de remboursement échoue après F5, mais sur la restauration du défilement horizontal (ligne 274) ; la candidate a échoué plus tôt, sur la visibilité de la cellule (ligne 272). Ces points distincts ne permettent ni d’établir une cause commune ni d’exclure une régression. Rapport conservé ; ce comparatif ne vaut pas qualification complète de la candidate.

## Mise à jour de l’accès et qualification séparée

La qualification séparée conserve les 35 scénarios Chromium de livraison et ajoute, dans une étape obligatoire supplémentaire, les deux scénarios acquis de `window-account-finance-20261010.spec.mjs`. Elle exige donc 37 scénarios Chromium et 6 WebKit avant promotion, sans changement des seuils ni des assertions. Cette étape vise le contrôle à deux comptes non vert sur le poste Windows ; les échecs locaux restent consignés même si la qualification distante réussit.

Accès GitHub rétabli le 21 octobre 2026 : lecture effective du HEAD distant `ec6b459f0afebbde1108ed92cdf01a7d9d88c69a`. La qualification complète est préparée sur la branche séparée `codex/lot-24-notification-inbox-20261021`. Cette branche ne satisfait pas la condition de déploiement du workflow de production. Les échecs locaux restent consignés ; aucune publication en production avant qualification complète du même SHA. Les mentions antérieures d’outils indisponibles décrivent les tentatives précédentes et ne sont plus le blocage actuel. Le déclencheur de qualification ajoute uniquement cette branche candidate ; les assertions et la condition de déploiement restent conservées.
