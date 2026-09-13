# Eco-System — vingt innovations et instructions d’implémentation

Date : 13 septembre 2026. Document de reprise pour Codex, Sol, Terra ou un autre développeur. Ce document décrit des propositions à réaliser ; il ne les présente pas comme vingt fonctionnalités déjà livrées. Certaines prolongent des exigences des cahiers : elles ne remplacent pas les fonctions obligatoires encore ouvertes.

## 1. Partir de la bonne application

La reprise contient le socle local 1.1.2 : comptes et sessions, groupes, rubriques personnalisées, simulation par rubrique, programmation prévisionnelle des parts d’une tontine, cotisations cash manuelles, reçus, contrepassations, relevés, matrice et file d’intentions. Le nom d’une rubrique ne détermine jamais implicitement ses règles.

Décision explicite du fondateur : une association contient d’abord des rubriques personnalisables. Chaque rubrique a sa nature, son nom et ses caractéristiques. Pour une tontine, les membres, les parts et les pots sont distincts. Chaque part donne droit à un pot ; quatre parts d’un membre peuvent bénéficier au même tour ou à plusieurs tours. Le nombre de pots est le nombre de passages bénéficiaires permis par tour, pas le multiplicateur des cotisations. La programmation livrée est une prévision ; elle n’exécute pas encore les décaissements ni les remplacements de titulaires.

Le dépôt est `Delor85/tontine-platform`. La branche produit récupérée est `next/1.1.0-cahier-app`, commit `f7c203e919c644466289c587669ef817b74130af`. La branche `main`, observée au commit `c105f7304ec0b792cfc62d4bd6ddbe1c79121695`, n’est pas la base du code applicatif. Toujours lire la tête réellement publiée et le dossier de livraison avant de reprendre ; ces empreintes sont des checkpoints, pas une promesse que les branches ne changeront jamais.

## 2. Ce qui doit précéder les innovations

| Lot obligatoire | Résultat attendu avant de déclarer le domaine terminé |
|---|---|
| Identité historique | Rapprocher une fiche ancienne et un compte vérifié, avec preuve et trace ; récupération de compte ; aucun transfert de propriété sur simple égalité de noms. |
| Tontine opérationnelle | Parts liées aux adhésions, cycle validé/versionné, attribution des passages, remplacement gouverné, décaissement atomique, reçu et annulation cohérents. |
| Attendus et échéances | Règles validées → obligations datées → encaissé net → écart expliqué ; aucune dette créée seulement parce qu’une cellule est vide. |
| Comptabilité complète | Soldes d’ouverture, sorties, détenteurs/contenants, dates effectives, justification et rapprochement, rapports à une date donnée. |
| Prêts et épargne | Contrats, versions de taux, échéanciers, remboursements, intérêts et frais séparés, garants et approbations ; cas métier validés. |
| Gouvernance | Décision versionnée, signatures de comptes indépendants, quorum, expiration des mandats, recours et régularisation. |
| Import historique | Aperçu, correspondances, provenance cellule/page, anomalies, validation, idempotence, restauration ; jamais un import financier aveugle. |
| Communauté et marché | Publications et droits, modération, commandes, stocks, achats groupés, litiges ; les dossiers génériques ne suffisent pas. |
| Exploitation | Qualification du runtime cible, sauvegarde et restauration des données, budget de ressources mesuré, déploiement et tests distants. |

L’index `docs/memory/MASTER_CAPABILITY_INDEX.json`, les cahiers fingerprintés et l’audit détaillé restent la liste de référence. Ce tableau est une organisation du travail, pas une suppression des autres exigences.

## 3. Procédure commune à chaque innovation

1. Lire `AGENTS.md`, `PROJECT_STATE.md`, `NEXT_RUN.md`, `CURRENT_TRUTH.md`, le Truth Ledger, les Recall/CIR et la qualification livrée. Faire un rappel ciblé du besoin avec `npm run memory:recall -- "sujet"`.
2. Retrouver les exigences correspondantes dans l’index et les sources. Écrire un CIR avec le comportement avant/après, les autorités concernées et les risques concrets.
3. Évaluer FIT-LAPS : adéquation métier, impact, terrain réel, licence, architecture, protection des données et coût durable. Décider `PILOT`, `ADOPT_NOW`, `REIMPLEMENT_IDEA`, `WATCH` ou `REJECT`. Une idée intéressante peut être réimplémentée avec du code original ; ne pas copier des ressources sans droits.
4. Travailler dans une branche dédiée, sur une base de recette. Ajouter des migrations seulement additives. Ne pas recréer `eco-system-db`, publier des secrets ou remplacer les données utilisateur par des exemples.
5. Ajouter les contrats dans `packages/contracts`, le service dans son autorité métier, la persistance dans `PlatformRepository`, les routes dans `workers/api` et les appels via `ConnectedApplication`. Les chemins nouveaux ci-dessous sont des propositions à créer, pas des fichiers déjà présents.
6. L’API réautorise chaque opération. Une écriture financière utilise l’autorité Ledger, une transaction et une clé d’idempotence. L’UI, l’IA et l’offline ne créent pas leur propre comptabilité.
7. Tester les cas métier significatifs, un autre groupe, un autre compte, une requête rejouée, une interruption et une ancienne donnée. Exécuter `npm.cmd run ci` sous Windows (`npm run ci` sur Linux), puis le parcours navigateur.
8. Ajouter un drapeau désactivable. Déployer d’abord la fonction en recette, vérifier les résultats, puis autoriser l’activation pour les groupes pilotes. Le retour arrière désactive la fonction ; il ne détruit pas les écritures déjà validées.
9. Mettre à jour le registre, les preuves, le journal de version et la sauvegarde. Livrer un manifeste d’empreintes et une consigne de reprise. Signaler les limites et les tests non réalisés.

**Maîtrise du crédit.** Faire un seul lot limité par reprise. Réutiliser les sources et les résultats sauvegardés. Ne pas relire toutes les archives ni lancer une nouvelle refonte à chaque lot. Écrire les tests nécessaires avant de multiplier les captures ou les recherches. Les tailles S/M/L ci-dessous sont relatives ; aucune durée, consommation de crédits ou facture n’est garantie. Les bibliothèques libres ne rendent pas automatiquement gratuits l’hébergement, le stockage, les communications et les modèles.

## 4. Les vingt fiches d’exécution

### INN-01 — Expliquer chaque montant jusqu’à sa preuve

**Utilité :** ouvrir une cellule et comprendre le total, au lieu de devoir croire un chiffre isolé. Priorité P1 ; effort M ; dépend des projections Ledger et des relevés déjà présents.

**Implémentation :** créer une projection `AmountExplanation` contenant le montant net, les références de reçus, les contrepassations, la règle applicable et les preuves accessibles. Ajouter une route en lecture `GET /groups/:g/amount-explanations?...` ; autoriser le membre sur son propre relevé et les responsables sur les données nécessaires à leur mandat. Ajouter un panneau « D’où vient ce montant ? » depuis la matrice. Réutiliser les sommes canoniques, ne pas recalculer un solde côté navigateur.

**Recette :** versement 10 000 puis annulation → total nul avec les deux références ; reçu hors périmètre invisible ; preuve supprimée ou inaccessible signalée sans casser le total. Le panneau n’autorise aucun paiement. **Coût/retour arrière :** pas de modèle IA ; limiter et paginer les preuves ; désactiver le panneau sans modifier Ledger. Drapeau proposé : `amount-explanations`.

### INN-02 — Assistant de programmation des parts

**Utilité :** aider à répartir les passages bénéficiaires sans confondre parts et personnes. Priorité P1 ; effort M ; prolongement du paramétrage livré.

**Implémentation :** ajouter un moteur pur dans `packages/rubrics/src/scheduling.ts`. Entrées : parts, tours, capacité de pots, indisponibilités et contraintes décidées par le groupe. Produire une proposition et les contraintes non satisfaites. Commencer par un algorithme déterministe simple ; une optimisation plus avancée ne doit pas masquer un résultat impossible. Chaque version conserve ses contraintes et sa justification. L’utilisateur peut déplacer une part et comparer deux scénarios avant validation.

**Recette :** quatre parts d’un membre en un/deux/quatre tours ; deux demandes incompatibles ; capacité insuffisante ; une part programmée deux fois ; cycle déjà commencé. Une proposition ne déclenche jamais un décaissement. **Coût/retour arrière :** calcul borné, sans IA ; limite d’itérations et résultat partiel explicite ; conserver la programmation manuelle. Drapeau : `schedule-assistant`.

### INN-03 — Laboratoire de scénarios financiers

**Utilité :** comparer des montants, frais et calendriers avant d’engager le groupe. Priorité P1 ; effort M.

**Implémentation :** enregistrer des `Scenario` privés, liés à la version d’un projet, avec hypothèses explicites : parts, fréquence, retard, frais externes et absence de paiement. Utiliser les mêmes fonctions de simulation que le projet. Afficher côte à côte collecte, coût, besoin de trésorerie et hypothèses. Introduire les défauts de paiement comme scénarios choisis, pas comme prédictions sur une personne. La promotion d’un scénario vers une règle crée une nouvelle demande de validation.

**Recette :** scénario original inchangé après comparaison ; frais distincts du capital ; durées différentes non assimilées ; dépassement d’entier sûr rejeté ; droits de lecture par auteur/groupe. **Coût/retour arrière :** calcul local possible, stockage de quelques paramètres ; limiter le nombre de scénarios conservés. Drapeau : `scenario-lab`.

### INN-04 — Import avec comparaison ligne par ligne

**Utilité :** reprendre les classeurs et feuilles historiques en voyant précisément les changements proposés. Priorité P1 ; effort L ; exige les règles d’identité et d’écriture historiques.

**Implémentation :** créer `ImportBatch`, `ImportRow`, `MappingDecision` et `ImportIssue`. Conserver l’empreinte du fichier, la feuille, la cellule et la règle de transformation. Première étape : analyser vers une zone de préparation sans écrire dans Ledger. Deuxième étape : montrer valeurs source, valeurs reconnues et anomalies. Troisième étape : appliquer un lot validé avec une référence stable et un rapport de rapprochement. Lier les personnes par identifiant vérifié, jamais seulement par nom.

**Recette :** fichier importé deux fois ; cellule vide distincte de zéro ; formule sans valeur calculée ; date ambiguë ; devise incohérente ; échec au milieu d’un lot ; reprise ; annulation gouvernée. Les macros ne sont pas exécutées automatiquement. **Coût/retour arrière :** commencer par CSV puis les classeurs réellement fournis ; proposer une contrepassation traçable, pas une suppression comptable. Drapeau : `historical-import-preview`.

### INN-05 — Lecture de papier avec validation visuelle

**Utilité :** photographier une fiche et réduire la ressaisie, tout en gardant le contrôle humain. Priorité P2 ; effort L ; dépend du lot d’import.

**Implémentation :** pilote avec Tesseract.js dans un Web Worker, modèles de langue et versions épinglés. Afficher l’image, la zone reconnue et le champ proposé ; conserver une confiance par champ. L’OCR alimente exclusivement `ImportRow`, jamais directement la comptabilité. Une image PDF doit d’abord être convertie en images par un composant approprié : ne pas supposer que Tesseract.js prend tous les PDF en entrée. [Source officielle Tesseract.js](https://github.com/naptha/tesseract.js).

**Recette :** chiffres 1/7, espaces de milliers, image inclinée, floue, faible lumière, écriture manuscrite ; une erreur sur un montant doit demander correction. Mesurer sur les appareils du terrain. **Coût/retour arrière :** traitement local après téléchargement des ressources ; téléchargement opt-in et taille visible ; saisie manuelle toujours disponible. Drapeau : `paper-ocr-pilot`.

### INN-06 — Compagnon documentaire avec sources

**Utilité :** retrouver l’article du règlement qui répond à une question. Priorité P2 ; effort L.

**Implémentation :** découper les documents autorisés avec références page/article et version ; indexer séparément chaque groupe. Commencer par recherche textuelle. Un pilote Transformers.js peut ajouter des embeddings et de la recherche sémantique dans le navigateur ; sélectionner et qualifier un modèle compatible, sa licence, sa taille et son empreinte. La réponse doit citer les passages et distinguer texte écrit, pratique observée et décision validée. [Documentation officielle Transformers.js](https://huggingface.co/docs/transformers.js/en/index).

**Recette :** question absente des documents → absence de réponse certaine ; document révoqué → résultat retiré ; autre groupe invisible ; instruction malveillante dans une pièce traitée comme contenu ; citation correspondant réellement à l’affirmation. **Coût/retour arrière :** aucun fournisseur distant par défaut, recherche textuelle conservée, budget de stockage explicite. Drapeau : `document-assistant-pilot`.

### INN-07 — Saisie vocale avec confirmation du montant

**Utilité :** faciliter la saisie pendant une réunion ou pour une personne peu à l’aise avec le clavier. Priorité P2 ; effort L.

**Implémentation :** ajouter une capture volontaire, un bouton arrêter et une transcription visible. Séparer transcription, extraction du membre/rubrique/montant et validation. Le texte reconnu prépare un brouillon du formulaire existant. Le choix d’un moteur local ou distant doit être explicite ; ne pas supposer que la reconnaissance intégrée d’un navigateur reste toujours sur l’appareil. Effacer l’audio suivant une durée de conservation choisie.

**Recette :** 15 000/50 000, homonymes, noms locaux, bruit, changement de langue, microphone refusé, interruption. Aucun enregistrement financier sans vérification du membre et du montant. **Coût/retour arrière :** clavier conservé ; téléchargement de modèle ou transmission distante annoncé ; pas de promesse de coût nul. Drapeau : `voice-draft-pilot`.

### INN-08 — Mode réunion préparée sans connexion

**Utilité :** préparer le contexte avant de partir dans une zone mal connectée. Priorité P1 ; effort L.

**Implémentation :** créer un `MeetingSnapshot` versionné, limité au groupe, au rôle et à l’appareil. Le téléchargement volontaire contient les rubriques et les données minimales autorisées. Stocker séparément le snapshot et l’outbox existante. Afficher date du dernier état, opérations locales, confirmées et en conflit. À la reconnexion, réautoriser toutes les intentions et présenter les changements de règles survenus entre-temps.

**Recette :** fermeture complète puis démarrage offline ; compte déconnecté ; changement de rôle ; deux appareils ; stockage saturé ; réponse réseau perdue ; retrait d’une rubrique. Aucune intention locale n’est marquée payée sans confirmation du serveur. **Coût/retour arrière :** snapshots bornés et supprimables, pas de copie globale du tenant. Drapeau : `offline-meeting-snapshot`.

### INN-09 — Centre de résolution des conflits

**Utilité :** éviter qu’une synchronisation écrase silencieusement une modification. Priorité P1 ; effort M ; dépend du versionnement et de l’outbox.

**Implémentation :** ajouter `expectedVersion` aux mutations non financières concernées et retourner un conflit contenant les champs autorisés avant/après. Afficher « ma saisie », « version serveur » et « résolution proposée ». Pour les finances, garder les clés d’idempotence et créer une opération corrective plutôt qu’une fusion de montants. Conserver auteur, motif et version de la résolution.

**Recette :** deux responsables modifient la durée ; intention basée sur un ancien mandat ; résolution rejouée ; permission perdue pendant la résolution. Les informations de l’autre compte sont filtrées par périmètre. **Coût/retour arrière :** aucune IA nécessaire ; paginer les conflits ; conserver le refus explicite si le centre est désactivé. Drapeau : `conflict-center`.

### INN-10 — Paquet de relais chiffré entre appareils

**Utilité :** transporter des intentions dans une zone sans réseau, sans confondre transport et validation. Priorité P3 ; effort L ; dépend du mode offline stabilisé.

**Implémentation :** définir une enveloppe avec identifiant, émetteur, destinataire, expiration, version et empreinte. Utiliser une bibliothèque cryptographique éprouvée ou Web Crypto après revue du protocole ; ne pas inventer un chiffrement. Importer les paquets dans une zone de quarantaine ; le serveur réautorise ensuite chaque intention. Le relais ne reçoit que les données minimales chiffrées. [API Web Crypto documentée](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API).

**Recette :** paquet tronqué, modifié, expiré, rejoué, mauvais destinataire, segments reçus dans le désordre, appareil perdu. **Coût/retour arrière :** commencer par export/import de fichier local ; QR ou proximité seulement après qualification du format. Aucun acquittement financier produit par le relais. Drapeau : `encrypted-relay-pilot`.

### INN-11 — Calendrier personnel portable

**Utilité :** retrouver séances et passages prévus dans son calendrier habituel. Priorité P2 ; effort S/M.

**Implémentation :** produire un export iCalendar à partir des séances et passages validés/explicitement prévisionnels. Utiliser UID stable, date de mise à jour, fuseau, annulation et échappement des textes. Commencer par téléchargement personnel ; un abonnement public à une URL demande ensuite révocation et contrôle d’accès adaptés. Ne pas publier les montants ou coordonnées des autres membres. [Spécification iCalendar, RFC 5545](https://www.rfc-editor.org/rfc/rfc5545).

**Recette :** modification d’horaire met à jour le même événement ; annulation lisible ; fuseau Africa/Douala ; accents et virgules ; passage déplacé ; export limité au membre. **Coût/retour arrière :** fichier généré sans service payant ; l’import dans chaque application de calendrier doit être vérifié. Drapeau : `personal-calendar-export`.

### INN-12 — Rappels regroupés et choisis par le membre

**Utilité :** rappeler l’essentiel sans envoyer dix messages pour une seule séance. Priorité P2 ; effort M.

**Implémentation :** `NotificationPreference`, plages silencieuses, langue, canal, catégories et historique de livraison. Construire un résumé à partir de l’inbox canonique, avec clé de déduplication par destinataire/période. Commencer par l’application ; email/SMS/WhatsApp nécessitent ensuite un fournisseur, un budget et le consentement correspondant. Prévoir désinscription et réessai plafonné.

**Recette :** changement de préférence pendant un envoi ; rappel déjà envoyé ; échéance annulée ; mauvais fuseau ; fournisseur en panne ; aucun solde privé dans un aperçu public. **Coût/retour arrière :** plafonds par groupe et canal ; aucune activation payante implicite ; conserver les actions dans l’inbox si l’envoi échoue. Drapeau : `notification-digests`.

### INN-13 — Comparateur de règles et décisions

**Utilité :** savoir ce qui a changé entre deux règlements et depuis quelle séance cela s’applique. Priorité P1 ; effort M.

**Implémentation :** conserver versions, source, portée, date effective et décision d’adoption. Comparer les champs structurés séparément du texte libre. Montrer les rubriques et échéances touchées sans réécrire le passé. L’assistant peut proposer un rapprochement, mais l’autorité du groupe valide l’application. Réutiliser le service de règles, pas un second moteur de politiques.

**Recette :** règle rétroactive demandée ; texte différent sans changement de montant ; pratique divergente ; décision expirée ; quorum incomplet ; ancien reçu conservant sa version. **Coût/retour arrière :** comparaison déterministe d’abord ; indexation du texte optionnelle. Drapeau : `rule-version-diff`.

### INN-14 — Double vérification guidée des opérations sensibles

**Utilité :** rendre compréhensible la validation à plusieurs personnes. Priorité P1 ; effort L ; dépend du workflow de quorum obligatoire.

**Implémentation :** définir une demande contenant l’empreinte exacte de l’opération, sa version, les rôles attendus, l’expiration et le seuil. Chaque signataire approuve avec sa propre session. Un changement de montant invalide les accords précédents. Présenter clairement ce que chacun signe et ce qui reste à obtenir. Le serveur vérifie à nouveau le quorum dans la transaction finale.

**Recette :** auto-approbation interdite si configurée ; faux identifiant d’approbateur ; mandat expiré ; changement de contenu ; signature rejouée ; deux validations simultanées ; opération exécutée une seule fois. **Coût/retour arrière :** pas de blockchain nécessaire ; conserver les demandes et leur audit si l’interface est désactivée. Drapeau : `approval-cockpit`.

### INN-15 — Radar d’anomalies explicable

**Utilité :** attirer l’attention sur un écart, sans accuser automatiquement un membre. Priorité P2 ; effort M.

**Implémentation :** commencer par règles déterministes : référence répétée, solde incohérent, écart de caisse, annulations inhabituelles, import non rapproché. Chaque signal contient règle, éléments observés, gravité, données manquantes et voie de classement/recours. Utiliser des projections autorisées ; ne pas fabriquer un score de richesse ou de fiabilité universel.

**Recette :** erreur innocente corrigée ; saisonnalité ; annulation légitime ; absence de données ; accès d’un simple membre ; signal déjà traité. Une alerte ne bloque pas arbitrairement une personne et ne déclenche aucun recouvrement. **Coût/retour arrière :** pas de modèle requis au premier lot ; mesures de faux positifs ; signaux désactivables individuellement. Drapeau : `explainable-anomalies`.

### INN-16 — Achats groupés avec seuil et sortie claire

**Utilité :** regrouper une demande pour obtenir une offre adaptée tout en laissant le membre connaître son engagement. Priorité P3 ; effort L ; dépend du moteur marché/commandes obligatoire.

**Implémentation :** `GroupBuyCampaign`, offres versionnées, seuil, date limite, quantités réservées, conditions d’annulation, frais séparés et état de livraison. Commencer par intentions non payantes. Un seuil atteint crée une demande de décision ; il ne passe pas automatiquement une commande payante. Les remboursements et paiements réutilisent les autorités financières.

**Recette :** seuil non atteint, hausse du prix, retrait d’un participant, rupture de stock, livraison partielle, litige, deux confirmations concurrentes. **Coût/retour arrière :** catalogue local et suivi manuel en pilote ; raccordement fournisseur séparé. Drapeau : `group-buy-pilot`.

### INN-17 — Entraide par compétences et disponibilités

**Utilité :** trouver volontairement une aide au sein de la communauté. Priorité P3 ; effort M.

**Implémentation :** profils opt-in de compétences, zones approximatives et créneaux ; demandes avec portée choisie ; rapprochement sur critères explicites. Un contact n’est dévoilé qu’au stade autorisé. L’utilisateur peut corriger ou retirer son profil. Distinguer entraide, offre professionnelle et prestation rémunérée ; ne pas mélanger leur réputation ou leurs conditions.

**Recette :** profil privé, consentement retiré, recherche hors groupe, indisponibilité, spam, signalement et recours. Aucun classement fondé sur attributs sensibles. **Coût/retour arrière :** filtres simples avant IA ; pas de géolocalisation précise obligatoire ; conserver la recherche manuelle. Drapeau : `skills-mutual-help`.

### INN-18 — Mode Ultra Simple réellement testé

**Utilité :** permettre à une personne peu familiarisée avec le numérique d’accomplir une tâche entière. Priorité P1 ; effort M.

**Implémentation :** trois actions principales par rôle, texte court, gros contrôles, une décision à la fois et résumé avant validation. Réutiliser les mêmes appels applicatifs que le mode détaillé. Ajouter navigation clavier, focus visible, intitulés de champs, annonces d’erreurs et contrastes. Automatiser une partie des contrôles avec axe-core, en complément d’essais humains ; l’outil ne remplace pas ces essais. [Projet officiel axe-core](https://github.com/dequelabs/axe-core).

**Recette :** inscription, choix du groupe et consultation d’un reçu sur petit écran ; zoom 200 % ; clavier ; lecteur d’écran ; erreur de saisie ; réseau lent. **Coût/retour arrière :** aucun service externe nécessaire ; préférence individuelle réversible. Drapeau : `ultra-simple-ui`.

### INN-19 — Academy avec exercices sans risque

**Utilité :** apprendre une cotisation, une contrepassation ou une clôture en manipulant de faux montants. Priorité P2 ; effort M.

**Implémentation :** environnement d’exercice séparé, personnages fictifs, scénarios versionnés et objectifs vérifiables. Utiliser les mêmes fonctions pures et contrats métier, avec une persistance de démonstration isolée. Toujours afficher le mode exercice ; aucun mécanisme ne doit copier ses écritures dans un groupe réel. Proposer un exemple adapté au rôle, puis un débrief expliquant le résultat.

**Recette :** tentative d’utiliser l’identifiant d’un vrai groupe ; réinitialisation d’exercice ; interruption ; modification d’une règle réelle après publication du cours ; progression personnelle privée. **Coût/retour arrière :** contenus éditoriaux déterministes d’abord, IA optionnelle après validation ; désactiver les cours sans toucher les données métier. Drapeau : `academy-sandbox`.

### INN-20 — Sauvegarde vérifiée et tableau de santé

**Utilité :** savoir qu’une sauvegarde peut être restaurée et détecter les pannes sans exposer les données. Priorité P1 ; effort L.

**Implémentation :** distinguer archive de code et sauvegarde de données. Ajouter manifestes, empreintes, schéma, date, périmètre, clé de chiffrement gérée séparément et exercice de restauration sur une base de recette. Mesurer erreurs, délais, profondeur d’outbox et âge du dernier backup sans enregistrer mots de passe, corps de requêtes ou dossiers privés. OpenTelemetry peut fournir les instruments de mesure ; choisir l’exporteur et la rétention selon le budget. [Documentation officielle OpenTelemetry JavaScript](https://opentelemetry.io/docs/languages/js/).

**Recette :** fichier altéré, sauvegarde incomplète, ancienne version du schéma, clé indisponible, restauration interrompue et vérification des totaux après restauration. **Coût/retour arrière :** exporter seulement des métriques agrégées ; plafonner rétention et volume ; journaux locaux minimaux si exporteur indisponible. Drapeau : `verified-backup-health`.

## 5. Ordre conseillé pour les reprises

**D’abord :** terminer les lots obligatoires du tableau, en commençant par identité historique, tontine opérationnelle et comptabilité. La disponibilité d’un quota ne vaut pas validation métier ni qualification de production.

**Premier groupe d’améliorations :** INN-01, 02, 03, 09, 13 et 18. Elles réutilisent beaucoup du socle et demandent peu de fournisseurs externes. Leur taille doit malgré tout être limitée par lot.

**Ensuite :** INN-04, 08, 14 et 20, qui demandent des scénarios de reprise et d’intégrité plus approfondis ; INN-11, 12 et 19 pour l’usage courant.

**Pilotes ultérieurs :** INN-05, 06, 07, 10, 15, 16 et 17. Ne pas télécharger tous les modèles ou activer tous les services d’un coup. Pour chaque pilote, mesurer l’utilité réelle, les erreurs, la taille téléchargée, le temps de traitement et le coût, puis décider de l’adoption.

## 6. Prompt prêt à transmettre à un autre agent

> Reprends Eco-System depuis la dernière livraison vérifiée et la branche GitHub produit correspondante. Lis AGENTS, CURRENT_TRUTH, Truth Ledger, PROJECT_STATE, NEXT_RUN, le journal de qualification et les CIR, puis la fiche INN-XX de ce document et les exigences correspondantes des cahiers. Ne recommence pas l’audit entier. Implémente uniquement ce lot avec son service canonique, ses droits et ses migrations additives. Conserve les rubriques personnalisées, la distinction membres/parts/pots, les règles écrites/observées/validées, l’idempotence et les données existantes. Ne déclare pas un dossier générique comme un moteur terminé. Exécute les tests du lot et la CI, vérifie le parcours navigateur, prépare une PR vérifiable et une sauvegarde avec empreintes. Indique ce qui fonctionne, ce qui reste à faire et les limites de déploiement. N’active aucun paiement réel ni service payant implicitement. Termine avec une consigne de reprise et les compteurs d’usage réellement accessibles ; n’invente aucun nombre exact de crédits.

Pour limiter les dépenses, remplacer **INN-XX par un seul numéro**, joindre ce document et la dernière sauvegarde, puis conserver le compte rendu et le commit de ce lot pour la reprise suivante.

## 7. Critère de livraison et vérité des crédits

Une fonction est réalisée quand son parcours métier, sa persistance, ses droits, sa reprise et ses critères d’acceptation sont prouvés. Une fonction est déployée seulement après vérification sur la destination réelle. La présence de sa carte dans le catalogue, un screenshot ou un test de texte ne suffit pas.

Le compteur Codex expose des pourcentages de fenêtres partagées et éventuellement un solde, pas nécessairement une consommation exacte attribuable à une tâche. Conserver les relevés disponibles en les datant ; ne convertir ni un pourcentage arrondi ni une durée de travail en crédits exacts. Aucun achat ni reset de crédits n’est demandé par ce document.
