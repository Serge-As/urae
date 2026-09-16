# ECO-SYSTEM — Cahier des Charges Maître Exhaustif 3.2.0

Date : 2026-09-16  
Statut documentaire : **CANDIDAT 3.2.0 — branche 1.3.3 qualifiée, production 1.3.2 tant que le smoke 1.3.3 n'est pas prouvé**  
Branche : `next/1.3.3-interest-lab-adops-ui-20260916`  
Production stable au début de cette édition : `1.3.2-savings-control-forum-live`  
D1 canonique : `eco-system-db`  
R2 privé : `eco-system-backups`  
Argent réel : **désactivé**

> ## RÈGLE DE CONTINUITÉ CONSTITUTIONNELLE
> La 3.2.0 **n'abrège pas** la sauvegarde exhaustive 2.3.4. La 2.3.4 reste le socle constitutionnel intégral : mémoire, taxonomie, rubriques, terrain, architecture organique, garde-fous, Service Solidarity Protocol, Discovery, Forum, Marketplace, AdManager, ONG, Academy, IA, offline, reporting et idées historiques.  
> La présente édition ajoute et précise les décisions, preuves et implémentations intervenues après la 2.3.4. Toute exigence 2.3.4 non explicitement marquée `SUPERSEDED` demeure active. **Absence dans ce delta ≠ suppression.**

> ## DETAIL-FIRST / EXPLICITNESS RULE
> Toute fonctionnalité, service, moteur, innovation ou décision importante doit être décrite avec : contexte, objet, utilisateurs, parcours, données, règles, paramètres, états, droits, exemples, formules lorsqu'elles existent, cas limites, erreurs, dépendances, risques, garde-fous, coûts, tests, statut réel et évolutions. Un simple nom de module n'est pas une spécification.

> ## RÈGLE DE VÉRITÉ
> `VALIDÉ MÉTIER`, `CODÉ`, `TESTÉ`, `CI VERTE`, `DÉPLOYÉ` et `RECETTÉ TERRAIN` sont des états différents. Une maquette ou un bouton ne prouve jamais qu'un service fonctionne en production.

---

# 0. Objet, vision et principes

Eco-System est une plateforme PWA FR/EN destinée aux tontines, associations et communautés, conçue pour le Cameroun et les contextes à faible connectivité sans s'y limiter. Elle remplace progressivement le mélange papier + Excel/VBA + WhatsApp/Telegram + calculs manuels, sans forcer tous les groupes à adopter la même logique.

La plateforme doit :
- comprendre la réalité du groupe avant de la normaliser ;
- conserver les règles locales, les pratiques observées et les exceptions ;
- proposer des améliorations sans braquer le groupe ;
- rendre les calculs explicables et contestables ;
- fonctionner sur desktop et smartphone, y compris anciens appareils et 2G ;
- rester honnête en offline : une action en attente n'est pas un succès ;
- préserver une seule vérité financière canonique ;
- permettre une évolution vers communauté, économie locale, partenaires/ONG, publicité responsable et services professionnels.

## 0.1 Living Rules
Quatre objets sont distincts :
1. **règle écrite** : RI/statuts/PV ;
2. **pratique observée** : ce que le groupe fait réellement ;
3. **règle opérationnelle validée** : ce que l'application applique ;
4. **exception** : décision ponctuelle, datée, justifiée et auditée.

L'IA peut extraire, comparer et suggérer. Elle ne transforme jamais automatiquement une phrase du RI en mouvement d'argent ou sanction.

## 0.2 Autorités canoniques
- Finance : Ledger/D1 append-only.
- Adhésion : Membership Gateway.
- Rubriques : RubricDefinition + politiques.
- Forum : Community + projection temps réel.
- Live : Durable Object = coordination/projection, jamais second solde.
- Publicité : AdManager unique.
- Partenaires/ONG : External Programs + agrégats gouvernés.
- Contrôle plateforme : Founder Control Center.
- Mémoire : Current Truth + Project Truth Ledger + Feature Registry + Cahier + recalls.

---

# 1. Architecture de référence

## 1.1 Composants
- **Cloudflare Workers** : API, authentification, orchestration.
- **D1** : groupes, membres, règles, Ledger, Control Center, états métier.
- **Durable Objects** : Premium Live, séquences, diffusion temps réel.
- **R2 privé** : sauvegardes BIR+, RI/documents, médias, photos et pièces.
- **Workers AI** : conversion/analyse de documents et rédaction assistée, avec fallback déterministe.
- **AI Gateway** : cache, rate limit, observabilité des appels IA.
- **PWA** : desktop/mobile/offline/2G.
- **Web Push** : cible notifications fines.
- **RealtimeKit/WebRTC** : cible réunions et appels audio/vidéo.
- **Queues / événements R2** : cible pipeline média asynchrone.

## 1.2 Interdictions
- Pas de deuxième Ledger.
- Pas de nouvelle base créée si `eco-system-db` existe.
- Pas de migration destructive sans procédure distincte.
- Pas de secret/PIN/token dans Git.
- Pas d'argent réel par simple présence d'un bouton.
- Pas de force-push de `main` pour simplifier une reprise.
- `UNKNOWN != SUCCEEDED`.

---

# 2. Parcours de création / intégration — contrat immuable en 10 étapes

La création reste un **studio guidé de 10 étapes**, jamais réduite à un formulaire minimal.

1. **Origine** : nouveau, groupe historique, transformation d'un groupe Eco-System existant.
2. **Famille** : association ou tontine rotative ; les variantes viennent ensuite.
3. **Gouvernance** : fondateur, communautaire, déléguée, professionnelle, ONG, hybride.
4. **Exercice & calendrier** : début, fréquence, séances, jours, cycle, clôture.
5. **Membres** : anciens/nouveaux, import, rôles, ancienneté, parts, liste d'attente.
6. **Rubriques** : rubriques multiples, contexte, politiques, participants.
7. **Faisabilité** : scénarios, coûts, charges, volumes ; aucune cotisation nominale globale imposée.
8. **Communication** : in-app, print, adaptateurs email/SMS/WhatsApp/Telegram.
9. **Accessibilité** : Ultra Simple, oral, grands contrôles, FR/EN, 2G, vieux appareils.
10. **Prévisualisation & création** : résumé, risques, règles, confirmation et création réelle.

## 2.1 Correction 1.3.3 — création non bloquante
Le bouton final ne doit pas dépendre d'un `projectId` invisible produit par une simulation antérieure. Si la pré-simulation n'existe plus, l'action finale :
1. relit les 10 étapes ;
2. exécute la vérification de faisabilité manquante ;
3. crée le projet intermédiaire ;
4. crée/intègre/transforme le groupe ;
5. renvoie un statut explicite.

## 2.2 Anti-régression
Sont intouchables sans décision explicite :
- les 10 étapes ;
- **Collation** (et non Collection) ;
- plusieurs tontines dans un même groupe ;
- participation différente par membre et par tontine ;
- rubriques en argent, nature ou mixte ;
- retour à une étape sans destruction des suivantes.

---

# 3. Étape 6 — RI, IA et téléversement multi-documents

## 3.1 Entrées acceptées
Le gestionnaire peut :
- copier/coller du texte ;
- dicter oralement ;
- téléverser **PDF** ;
- téléverser **DOCX** ;
- téléverser **ODT** ;
- téléverser texte/Markdown ;
- téléverser **plusieurs photos/images**.

Le vieux `.doc` peut être archivé mais son extraction automatique n'est pas garantie : l'UI doit le signaler.

## 3.2 Photos
Pour un RI photographié, l'application demande :
- toutes les pages utiles ;
- image de face ;
- netteté suffisante ;
- pas de reflet ;
- bords visibles ;
- plusieurs photos si le document comporte plusieurs pages.

Une seule photo déclenche un avertissement : « Vérifiez que toutes les pages du RI ont été fournies ».

## 3.3 Pipeline documentaire
`upload → R2 privé → SHA-256 → conversion texte/Markdown → extraction de propositions → provenance/extrait → validation humaine`.

Chaque suggestion conserve :
- fichier source ;
- empreinte ;
- page/segment lorsque disponible ;
- extrait de preuve ;
- confiance ;
- statut : proposé / validé / rejeté / différé.

L'original reste la preuve. Le texte IA est une interprétation.

---

# 4. Validation de 20–40 rubriques sans va-et-vient

L'UX cible est séquentielle :
`rubrique détectée → Configurer ici → mini-éditeur local → Valider et suivante → prochaine rubrique`.

## 4.1 Règles UX
- l'éditeur s'ouvre **dans la carte de la rubrique** ;
- la validation sauvegarde le brouillon ;
- la carte passe à `VALIDATED` ou `DEFERRED` ;
- la prochaine carte non traitée s'ouvre ;
- compteur : `17 / 40 validées` ;
- filtres : À traiter / Validées / Différées / Rejetées ;
- raccourci « revenir à la précédente » ;
- la configuration avancée reste accessible sans supprimer le flux rapide.

## 4.2 RubricDefinition + politiques
Une rubrique porte un noyau commun et des politiques spécialisées :
- obligation ;
- calendrier ;
- participation ;
- montant fixe/variable/grille ;
- caisse/custody ;
- remboursement ;
- éligibilité ;
- bénéficiaire ;
- prêts/intérêts ;
- nature/quantité ;
- règles d'exception ;
- provenance documentaire.

---

# 5. Assistance Rulebook

Une Assistance n'est pas un simple montant annuel.

## 5.1 Exemples d'événements
- maladie ;
- hospitalisation ;
- décès/deuil ;
- mariage ;
- baptême ;
- naissance ;
- accident ;
- sinistre ;
- soutien exceptionnel.

## 5.2 Modes de financement
Pour chaque événement :
- décaissement Fonds Secours ;
- main levée ;
- combinaison ;
- cadeau/nature ;
- montant fixe ;
- formule selon catégorie ;
- décision séance tenante.

## 5.3 Création différée
Si le RI contient de nombreuses modalités, l'étape 6 crée un **brouillon Assistance Rulebook** et permet de terminer la création du groupe. La validation détaillée se fait dans un menu dédié.

L'éditeur contient : événement, condition, montant bénéficiaire, contribution par membre, éligibilité, représentation/délégation, cadeau, exceptions, extrait RI, date d'effet, validateur.

Enregistrer une règle Assistance ne crée jamais un décaissement.

---

# 6. Politique d'inscription / réinscription

Le montant unique n'est pas obligatoire.

Modes :
- `FLAT` : même prix ;
- `FREE` : gratuit ;
- `RETURNING_VS_NEW` : ancien vs nouveau ;
- `MULTI_CRITERIA` : ancienneté, réintégration, statut, rôle ou décision autorisée.

Exemples :
- ancien 500 F / nouveau 1 000 F ;
- ancien gratuit / nouveau 2 000 F ;
- tous gratuits ;
- palier 0–1 an, 2–5 ans, >5 ans.

Le calcul doit expliquer la règle qui a produit le montant.

---

# 7. Feuille mensuelle / Meeting Command Center

Le classeur historique confirme que la séance est le point central :
membres × rubriques + caisse + prêts + remboursements + bénéficiaires + sorties + rapprochement.

Deux vues du même moteur :
1. cartes smartphone ;
2. matrice type Excel pour tablette/desktop.

Une cellule n'écrit pas « directement dans le tableau » : elle déclenche une intention métier vers le service canonique, puis Ledger/obligation/audit.

## 7.1 RECAP de séance obligatoire
Après chaque séance :
`caisse début + entrées - sorties = caisse théorique fin`.

Afficher par rubrique :
- ouverture ;
- entrées ;
- sorties ;
- solde/reliquat ;
- montant libérable ;
- montant reconduit ;
- bénéficiaire lorsqu'il existe ;
- preuve attendue ;
- écart contre caisse physique.

Les rubriques qui entrent et sortent le même jour (Collation, Tontines, certaines Assistances) doivent être rapprochées comme telles.

---

# 8. RECAP, Cassation et clôture annuelle

## 8.1 RECAP financier
Vues :
- membre × rubrique ;
- rubrique × période ;
- situation membre ;
- caisse/solde ;
- dettes/avoirs ;
- prêts/remboursements ;
- intérêts ;
- fonds structurés.

Correction manuelle = **valeur automatique + ajustement + motif + auteur + date**, jamais destruction silencieuse de la source.

## 8.2 Fonds Secours par membre
Le fonds collectif ne suffit pas. Conserver pour chaque membre :
`solde d'ouverture + contributions + ajustements entrants - remboursements/retraits autorisés - déchéances = position retenue`.

Exemple :
- M001 : ouverture 12 000 + contributions 6 000 - remboursement 3 000 = **15 000 F** ;
- M002 : contributions 24 000 = **24 000 F**.

Le total des positions et le solde physique sont liés mais ne sont pas interchangeables.

## 8.3 Carryover N+1
À la clôture, les fonds structurés peuvent être reconduits :
- Secours ;
- Projet ;
- réserve ;
- autres caisses décidées.

Le premier solde de N+1 peut donc être composé de plusieurs caisses identifiées. Le système interdit de promettre plus de fonds reconduits que la caisse physique réellement disponible.

---

# 9. Moteur de répartition des intérêts — vérité du dossier étendu

Données de référence :
- intérêts bruts collectés : **708 500 F CFA** ;
- Épargne classique : **14 935 199 F** ;
- Épargne scolaire : **1 081 000 F** ;
- clé d'exemple Bureau : 70 % classique = **495 950 F**, 10 % scolaire = **70 850 F**, 20 % Bureau = **141 700 F** ;
- pool épargnants : **566 800 F**.

Deux prêts à causalité forte expliquent **690 000 F** d'intérêts bruts ; **18 500 F** restent non attribués avec certitude.

## 9.1 Principe général
Eco-System ne possède pas « la formule universelle ». Il possède un **moteur de politiques**. Le Bureau choisit une politique, la simule sur l'historique, voit les écarts membre par membre, puis la valide selon sa gouvernance.

## 9.2 Politique A — historique à coefficients
Pour chaque dépôt `d` :
`poids(d) = montant(d) × coefficient(période(d))`.

Puis :
`gain(d) = pool_caisse × poids(d) / Σ poids`.

Le pipeline historique détaillé `EPARGNE → Principal → Intérêts provisoires → Intérêts finaux` est conservé en mode Audit, mais la formule simplifiée donne le même résultat normalisé.

Coefficients historiques classiques de l'exemple :
`9, 8, 7, 6, 5, 4, 3, 2, 1, 0.5, 0, 0`.

Scolaire :
`7, 6, 5, 4, 3, 2, 1, 0, 0, 0, 0, 0`.

**Quand l'utiliser ?** Reproduire une pratique historique acceptée.

## 9.3 Politique B — Capital × Temps linéaire
`score(d) = montant(d)^β × durée_éligible(d)^α`, défaut `α=1, β=1`.

Avec le défaut :
`score = montant × temps`.

Avantage : explicable sans table arbitraire de douze coefficients. Deux dépôts identiques : le plus ancien pèse plus. Deux dépôts au même moment : 200 000 F pèse deux fois 100 000 F.

## 9.4 Politique C — Capital × Temps avec bonus de précocité
Même formule, `α>1`, par exemple `1.5`.
La précocité est volontairement accentuée.

`β<1` n'est utilisé que si le groupe veut réduire la domination des très gros dépôts. Ce n'est jamais activé silencieusement.

## 9.5 Politique D — Capital réellement productif attribué
Question : **quel capital a réellement produit l'intérêt encaissé ?**

Chaîne recherchée :
`dépôt → caisse → prêt financé → principal remboursé → capital redevenu disponible → nouveau prêt → intérêt encaissé`.

Règle optionnelle :
`noLoanNoYield=true` : une épargne restée inutilisée ne reçoit pas d'exposition productive.

Sur le dossier de référence, la causalité documentée permet d'attribuer la part épargnants correspondant à 690 000 F bruts et laisse **14 800 F** de part épargnants non attribuée. Le moteur doit afficher ce résidu plutôt que l'inventer.

## 9.6 Politique E — Hybride productif + temps
- partie prouvée → moteur productif ;
- résidu non prouvé → Capital × Temps.

Approprié pour historiques anciens incomplets : le système utilise la causalité quand elle existe et une règle explicable pour le reste.

## 9.7 Fonds classique et scolaire
Politique :
- `SEGREGATED` : deux caisses séparées ;
- `POOLED` : mutualisées ;
- `CUSTOM_MATRIX` : chaque prêt précise quelles caisses peuvent le financer.

Question obligatoire :
> « Pour cet exercice, l'Épargne classique et l'Épargne scolaire ont-elles financé les mêmes prêts ? »

## 9.8 Pas d'intérêt sur intérêt de dette
Un intérêt **impayé** n'entre pas automatiquement dans le principal de la dette.

Des intérêts **encaissés par la caisse** peuvent, si le groupe l'autorise, être réemployés comme capital collectif ; ils ne deviennent pas pour autant le principal individuel d'un épargnant.

---

# 10. Interest Fairness Lab

Le Fairness Lab compare les politiques **sur les mêmes données**.

## 10.1 Paramètres
- pool brut ;
- part Bureau ;
- répartition classique/scolaire ;
- période éligible ;
- coefficients historiques ;
- α / β ;
- politique de mutualisation des caisses ;
- no-loan-no-yield ;
- traitement du résidu.

## 10.2 Résultats
- gain par dépôt ;
- gain par membre ;
- classement sans notion de « gagnant politique » ;
- écart absolu et relatif entre méthodes ;
- pool distribué ;
- résidu ;
- explication ligne par ligne.

## 10.3 Shadow Simulation
Avant adoption, le Bureau applique une politique aux 1–3 derniers exercices et voit qui aurait gagné/perdu, sans modifier le Ledger.

---

# 11. Group Doctor

Objectif : aider un groupe à structurer sa logique sans lui dire qu'il est « mauvais ».

Entrées :
- RI/statuts ;
- règles validées ;
- pratique observée ;
- RECAP ;
- politiques d'Épargne/prêts ;
- preuves manquantes.

Sorties :
- contradictions ;
- règles ambiguës ;
- caisses mélangées sans politique ;
- intérêts sans origine ;
- coefficients incohérents ;
- preuve de décaissement manquante ;
- proposition de structuration.

Formulation :
- « à vérifier » ;
- « preuve manquante » ;
- « cette règle semble produire… » ;
- « si votre intention est X, voici une configuration plus cohérente ».

Jamais : accusation de vol/détournement/corruption sans procédure humaine appropriée.

---

# 12. Meeting Autopilot

Cible :
1. préparer la séance ;
2. rappeler solde d'ouverture, rubriques, bénéficiaires, preuves ;
3. accepter saisie/voix ;
4. préremplir sans valider à la place du responsable ;
5. rapprocher fin de séance ;
6. signaler écarts ;
7. préparer publication aux membres.

Un écart explicite non résolu de la séance précédente peut bloquer l'ouverture selon la politique du groupe ; une panne IA ne bloque jamais la saisie manuelle.

---

# 13. Forum v2 et communication nouvelle génération

Acquis :
- messages paginés ;
- threads/réponses ;
- réactions ;
- brouillon serveur ;
- dernier message lu ;
- ancre exacte ;
- synchronisation Live multi-appareils ;
- pagination autour de l'ancre.

Cible :
- recherche ;
- signets ;
- messages vocaux ;
- sondages ;
- modération ;
- mentions ;
- événements ;
- appel audio/vidéo ;
- live avec réactions/commentaires ;
- mode faible-data.

Principe Telegram : quitter sur un message précis et revenir au même endroit, même sur un autre appareil. Les brouillons doivent voyager avec le compte.

---

# 14. Premium Live Ledger

Premium Live est une projection temps réel :
- publication d'avis ;
- position membre ;
- réserve ;
- réactions/Forum ;
- état de connexion.

Le Ledger D1 reste l'autorité. Si la diffusion Live échoue **après** un commit financier :
- l'API ne prétend pas que le commit financier a échoué ;
- un outbox/retry garde la projection en attente ;
- le Control Center voit l'incident.

---

# 15. Identité, CNI, téléphone, nom et photo

Rapprochement :
- CNI ;
- téléphone normalisé ;
- nom normalisé ;
- tous indexés via HMAC serveur, jamais en clair dans un index transverse.

Photo :
- téléversement volontaire ;
- R2 privé ;
- miniature contrôlée ;
- consentement ;
- suppression/export ;
- accès minimum.

Reconnaissance faciale future :
- uniquement vérification volontaire **1-à-1** d'une personne revendiquant une fiche ;
- jamais recherche 1-à-N sur toute la population ;
- fallback humain obligatoire.

Passkeys/WebAuthn : cible prioritaire pour simplifier la connexion après enrôlement.

---

# 16. Founder Control Center

Le propriétaire plateforme doit disposer d'un cockpit de contrôle transversal.

## 16.1 Sections
- santé des capacités : UNKNOWN / PASS / DEGRADED / FAIL ;
- incidents ;
- plaintes/support ;
- contenus/textes/articles à écrire, corriger, relire, publier ;
- jobs/queues ;
- D1/R2/DO/AI/Push/Live ;
- coûts et quotas ;
- sauvegardes ;
- sécurité ;
- versions/déploiements ;
- programmes ONG/partenaires ;
- AdOps ;
- marketplace ;
- données de qualité ;
- alertes régression.

## 16.2 Auto-enregistrement
Toute nouvelle capacité canonique supervisable est enregistrée automatiquement par le catalogue. Le fondateur ne doit pas redemander « ajoute ce service au tableau ».

## 16.3 Health Passport
Chaque service possède :
- version ;
- dernière CI ;
- dernier smoke ;
- dernière vérification réelle ;
- incidents ouverts ;
- dépendances ;
- statut ;
- owner ;
- rollback/recovery.

---

# 17. AdManager / AdOps — principes produit

AdManager est la seule régie publicitaire.

## 17.1 Priorité UX
La publicité ne repousse jamais :
- échéance urgente ;
- confirmation financière ;
- anomalie ;
- réserve ;
- action de sécurité ;
- validation de caisse.

## 17.2 Catalogue initial de placements
1. Accueil — après les priorités.
2. Feed natif.
3. Forum natif.
4. Marketplace sponsorisée.
5. Sponsor de groupe opt-in.
6. Pied de rapport.
7. Pied de reçu.
8. House Ad après action réussie.
9. Notification sponsorisée opt-in.

Exemples de densité :
- accueil : 1 carte native après bloc « Maintenant » ;
- feed : 1 sponsor pour 8–12 contenus ;
- forum : 1 sponsor après 10 éléments environ, jamais au milieu d'un thread court ;
- marketplace : sponsor clairement marqué, <= 15 % des résultats ;
- reçu : petit footer après la preuve, jamais entre montant et validation.

## 17.3 États campagne
`DRAFT → PENDING_REVIEW → APPROVED → ACTIVE ↔ PAUSED → COMPLETED`, avec `REJECTED`.

## 17.4 Métriques
- impressions ;
- ouvertures/clics ;
- actions/conversions ;
- feedback négatif ;
- fréquence ;
- coût ;
- marge ;
- placement ;
- création ;
- annonceur.

Aucune impression offline non synchronisée n'est comptée comme vue serveur facturable.

---

# 18. House Ads contextuelles — « 1 000 groupes, 1 000 compositions »

La sélection **quoi promouvoir** est déterministe et gouvernée. L'IA ne décide que **comment reformuler**.

## 18.1 Signaux autorisés
- phase de l'exercice ;
- mois avant clôture ;
- famille de rubriques ;
- présence Épargne/Assistance/Tontine ;
- catégories de besoin en nature ;
- groupe historique/nouveau ;
- faible connexion ;
- règles Assistance en attente.

## 18.2 Exemples
Début d'exercice :
- Academy ;
- Paper Bridge ;
- Meeting Autopilot ;
- Assistance Rulebook.

Tontine savons/huiles/draps :
- Demand Exchange fortement renforcé.

Groupe sans tontine savon :
- Demand Exchange reste possible en exploration modérée ; un membre peut être intéressé personnellement.

≤ 4 mois avant clôture + Épargne :
- Interest Fairness Lab prioritaire.

Milieu/fin :
- Group Doctor plus pertinent.

## 18.3 Privacy by construction de l'IA House Ads
L'IA de rédaction ne reçoit pas les noms libres des rubriques ni des données individuelles. Elle reçoit uniquement des signaux collectifs dérivés, par exemple :
- `rubricFamilies=[SAVINGS,TONTINE]` ;
- `commerceSignals=[SOAP,TEXTILE]` ;
- `hasSavings=true` ;
- `monthsToExerciseEnd=3.5`.

Interdits :
- CNI ;
- téléphone ;
- nom ;
- dette ;
- solde ;
- prêt individuel ;
- santé ;
- litige ;
- biométrie.

Fallback : si l'IA échoue/malforme sa sortie, la House Ad déterministe reste fonctionnelle.

---

# 19. Régie commerciale / CRM annonceurs

Pipeline :
`DISCOVERED → CONTACT_CANDIDATE → CONTACTED → QUALIFIED → PROPOSAL → WON / LOST`.

Fiche prospect :
- organisation ;
- catégorie ;
- localité ;
- source publique ou volontaire ;
- contact commercial ;
- budget estimatif ;
- besoins ;
- notes ;
- historique ;
- consentement ;
- prochaine action.

Bureaux du dashboard AdOps :
- Cockpit ;
- Inventaire ;
- Campagnes ;
- Créations ;
- Audiences ;
- Prospection ;
- Sponsors ;
- House Ads ;
- Reporting ;
- Facturation ;
- Fraude/Qualité ;
- Paramètres.

---

# 20. Marketplace / Demand Exchange / fournisseurs

Moteur :
`signaux de besoins agrégés → demande → fournisseurs → prix rendu + capacité + délai + qualité → seuil → deal → commande/livraison → confirmation/litige`.

Cas naturels :
- savon ;
- huile ;
- draps ;
- tissus ;
- fournitures scolaires ;
- consommables de réunion ;
- impressions ;
- services locaux.

Reverse auction : les fournisseurs répondent à la demande agrégée.

La publicité sponsorisée n'altère pas le classement organique sans étiquetage.

---

# 21. ONG, partenaires et statistiques agrégées

Les données partenaires doivent être **agrégées et pseudonymisées**.

Exemple acceptable :
> `ECO-GRP-8F21` : 150 000 F de masse annuelle « tontine savons ».

Exemple interdit :
> « Serge a cotisé 73 000 F au Secours ».

Indicateurs possibles :
- masse monétaire par rubrique ;
- nombre de groupes ;
- fréquence ;
- participation ;
- taux de régularisation agrégé ;
- demande en nature ;
- activité économique ;
- évolution de programme.

Accès :
- mandat explicite ;
- fenêtre temporelle ;
- finalité ;
- révocation ;
- seuil k-anonymat ;
- export audité.

---

# 22. Modèle économique — doctrine

Le cœur de gestion, la sécurité, la preuve financière et la consultation d'une situation ne doivent pas devenir un péage.

Les acteurs qui capturent une valeur directe financent prioritairement :
- annonceurs ;
- fournisseurs ;
- partenaires ;
- ONG ;
- structures multi-groupes ;
- fonctionnalités professionnelles à coût variable ;
- services de formation/accompagnement ;
- stockage/médias avancés.

Rails :
- Groupe Plus/Pro ;
- multi-groupes ;
- AdManager ;
- Marketplace/Deals ;
- leads vérifiés ;
- programmes ONG ;
- Insights agrégés ;
- Live/média ;
- Academy/support ;
- migration papier/Excel ;
- impression/archives.

Les prix restent des hypothèses tant que 3–5 cohortes réelles ne sont pas observées.

---

# 23. Interface cible rentable, ergonomique et role-based

L'accueil connecté n'est pas une brochure.

## 23.1 Structure membre
1. barre de contexte compacte ;
2. « Maintenant » : 3–5 actions ;
3. situation personnelle ;
4. groupe actif ;
5. avis Live/validations ;
6. activité/communauté ;
7. EcoPulse ;
8. sponsor natif ;
9. découverte services.

## 23.2 Responsable/Bureau
- prochaine séance ;
- caisse ;
- anomalies ;
- membres à régulariser ;
- bénéficiaires ;
- preuves ;
- RECAP ;
- règles à valider ;
- actions rapides.

## 23.3 Fondateur plateforme
- santé globale ;
- incidents ;
- contenus ;
- coûts ;
- AdOps ;
- programmes ;
- régressions ;
- sauvegardes.

## 23.4 Seniors
- boutons larges ;
- textes simples ;
- assistance vocale ;
- peu d'options par écran ;
- confirmation explicite ;
- pas de geste caché obligatoire ;
- mode Ultra Simple.

---

# 24. Publicité de la plateforme elle-même

Quand aucun annonceur admissible n'occupe un inventaire, Eco-System peut promouvoir :
- Academy ;
- Paper Bridge ;
- Group Doctor ;
- Interest Fairness Lab ;
- Meeting Autopilot ;
- Demand Exchange ;
- programmes ONG ;
- nouvelles fonctions.

Une House Ad :
- n'est pas comptée comme revenu ;
- a ses propres métriques adoption/rétention ;
- peut être A/B testée ;
- respecte fréquence/fatigue ;
- est contextualisée au groupe.

---

# 25. PWA, offline, 2G et vieux appareils

- shell caché localement ;
- text-first ;
- médias adaptatifs ;
- outbox idempotente ;
- reprise après réseau ambigu ;
- affichage `EN ATTENTE` plutôt que faux succès ;
- pagination ;
- compression ;
- impression/papier ;
- FR/EN ;
- cache borné ;
- mode faible-data publicitaire.

---

# 26. Paper Bridge

Paper Bridge génère :
- feuille de séance ;
- registre membres ;
- états de caisse ;
- reçus ;
- calendrier tontines ;
- listes de bénéficiaires ;
- RECAP ;
- documents à signer.

Le papier et le numérique partagent la même source ; une réimportation doit détecter doublons et version.

---

# 27. Proof Receipts QR

Un reçu peut porter un QR permettant de vérifier :
- identifiant de preuve ;
- statut ;
- montant/currency si autorisé ;
- groupe pseudonymisé ;
- date ;
- empreinte.

Le QR ne révèle pas les données privées complètes. Toute annulation apparaît comme contrepassation et non suppression.

---

# 28. R2 Media Pipeline

Cible :
`upload → validation type/taille → stockage privé → événement R2 → Queue → miniature → extraction → classification → index → disponibilité`.

Cas :
- RI ;
- photo membre ;
- pièces ;
- médias Forum ;
- rapports ;
- preuves.

Échec d'un traitement dérivé n'efface jamais l'original.

---

# 29. Notifications / Web Push

Événements :
- opération financière ;
- changement de situation ;
- réserve ;
- réponse à réserve ;
- réunion ;
- prêt ;
- brouillon important ;
- message mentionné ;
- incident ;
- rappel gouverné.

Préférences par canal, urgence, groupe et période. Pas de notification sponsorisée sans opt-in spécifique.

---

# 30. Sécurité et confidentialité

- moindre privilège ;
- scopes par groupe ;
- HMAC pour matching ;
- secrets hors Git ;
- rate limit ;
- audit ;
- contrepassation financière ;
- consentement ;
- export/suppression ;
- pseudonymisation analytics ;
- aucune publicité sur caractéristiques sensibles ;
- aucune conversation privée vendue aux annonceurs.

---

# 31. Tests et critères de non-régression 1.3.3

Minimum :
- 10 étapes + Collation ;
- création finale auto-répare simulation absente ;
- RI multi-documents ;
- sequential review ;
- Assistance différée ;
- inscription ancien/nouveau/gratuit ;
- pool intérêts exact ;
- 5 politiques ;
- résidu productif explicite ;
- POOLED/SEGREGATED/CUSTOM_MATRIX ;
- AdManager lifecycle ;
- ciblage sensible bloqué ;
- House Ads contextuelles ;
- payload IA agrégé uniquement + fallback ;
- Forum draft/ancre ;
- Live failure ≠ rollback D1 ;
- Founder Control auto-register ;
- HMAC identité ;
- service worker PWA ;
- FR/EN parity.

---

# 32. Definition of Done

Une fonction est terminée quand :
1. besoin sourcé ;
2. owner ;
3. dépendances ;
4. droits ;
5. schéma/migration additive ;
6. logique idempotente ;
7. erreurs ;
8. offline ;
9. UI desktop/mobile ;
10. accessibilité ;
11. audit ;
12. sécurité ;
13. tests métier ;
14. tests non-régression ;
15. Control Center ;
16. documentation ;
17. Feature Registry ;
18. CI verte ;
19. BIR+ ;
20. smoke si production ;
21. vérité projet mise à jour.

---

# 33. BIR+ et anti-interruption

Cycle :
`RECALL → HEAD/CI → sous-lot → commit → CI → vérité → BIR+ → déploiement → smoke → checkpoint`.

BIR+ avant production :
- archive du HEAD exact ;
- export D1 ;
- restauration SQLite ;
- `PRAGMA integrity_check=ok` ;
- SHA-256 ;
- Artifact GitHub ;
- miroir R2 ;
- retéléchargement des checksums.

Après 3–5 sous-lots significatifs, laisser un checkpoint GitHub. Aucune décision critique ne doit rester uniquement dans un chat.

---

# 34. Statut 1.3.3 au moment de rédaction

**CI qualifiée sur la branche, mais production 1.3.2 demeure la vérité tant que le workflow BIR+/déploiement/smoke 1.3.3 n'a pas réussi.**

Acquis de la branche :
- correctif blocage création ;
- RI multi-fichiers ;
- validation séquentielle rubriques ;
- Assistance Rulebook ;
- RegistrationPolicy ;
- cinq politiques Épargne ;
- Interest Fairness Lab ;
- Group Doctor ;
- Meeting Autopilot ;
- AdOps / CRM ;
- House Ads contextuelles ;
- rédaction Workers AI avec contexte collectif dérivé ;
- fallback sans IA.

---

# 35. Roadmap suivante

## 3.3
- R2 media/photo complet ;
- passkeys ;
- Web Push ;
- recherche/signets/voix Forum ;
- Health Passport détaillé.

## 3.4
- RealtimeKit ;
- sondages/live ;
- Demand Exchange/Deals réel ;
- reverse auction.

## 3.5
- Analytics/Cost Control ;
- programmes ONG avancés ;
- facturation AdOps sandbox→réelle seulement après contrats ;
- Recovery Drill automatisé ;
- tests terrain seniors/2G.

## Au-delà
- fédérations/multi-groupes ;
- API partenaires gouvernée ;
- scoring de fiabilité contextuel non financier ;
- white-label léger ;
- IA locale/edge lorsque pertinente ;
- produits réglementés uniquement via partenaires qualifiés et revue juridique.

---

# 36. Règle finale de reprise

Un futur agent doit commencer par :
1. `AGENTS.md` ;
2. `docs/memory/CURRENT_TRUTH.md` ;
3. `docs/memory/PROJECT_TRUTH_LEDGER.json` ;
4. `PROJECT_STATE.md` ;
5. le présent Cahier 3.2.0 **et le socle 2.3.4** ;
6. modèle économique 3.2.0 ;
7. `FEATURE_REGISTRY.yaml` ;
8. `NEXT_RUN.md` ;
9. derniers runs GitHub ;
10. état Cloudflare réellement observé.

**Eco-System ne repart jamais de zéro. Une absence de contexte n'est jamais une autorisation de supprimer un acquis.**
