# DELOR85 — PLAYBOOK UNIVERSEL DE PILOTAGE PROJET, MÉMOIRE, GARDE-FOUS ET NON-RÉGRESSION

**Version : 1.1.0 — 5 septembre 2026**  
**Statut : règle transversale réutilisable — projet-neutre**  
**But : permettre à tout projet du fondateur de progresser sans perdre ses acquis, sans confondre idée et réalité, sans créer de moteurs parallèles inutiles, et sans sacrifier l'ensemble au profit d'une amélioration locale.**

> Ce document est volontairement **projet-neutre**. Les règles propres à Eco-System, B.I.R./BlueAuto ou à un autre projet restent dans leurs constitutions respectives. Ce playbook fournit le système d'exploitation commun de développement et de reprise.

---

# 0. DOCTRINE FONDATRICE

## 0.1 Ne jamais repartir de zéro

Un nouveau chat, un nouvel agent, une nouvelle machine ou une nouvelle branche ne constitue jamais un nouveau projet.

Avant toute mutation substantielle, l'agent doit retrouver :

1. la dernière vérité versionnée du projet ;
2. le dernier code réellement qualifié ;
3. les déploiements réellement vérifiés ;
4. les idées historiques, dormantes, superseded ou rejetées avec raison ;
5. les dépendances et services canoniques concernés ;
6. les tests de caractérisation et de non-régression ;
7. les limites de preuve et inconnues.

Une absence dans le contexte courant ne signifie jamais suppression.

## 0.2 Vérité > récit

Une phrase ancienne, un bouton visible, un nom de branche, un mock, une maquette ou un endpoint dans le code ne suffisent pas à prouver une capacité opérationnelle.

La preuve doit être proportionnée au statut revendiqué :

- **DISCOVERED / HISTORICAL / MEMORY_ONLY** : retrouvé dans une source ;
- **VALIDATED / ACTIVE_REQUIREMENT** : exigence active et arbitrée ;
- **IMPLEMENTED_UNVERIFIED** : code présent ;
- **VERIFIED_LOCAL** : code + tests locaux pertinents ;
- **VERIFIED_REMOTE / DEPLOYED** : état distant directement observé ;
- **PILOT_VALIDATED** : recette pilote documentée ;
- **PRODUCTION_APPROVED** : autorisation explicite + qualification adaptée au risque ;
- **DORMANT** : non utilisé aujourd'hui, conservé pour résurrection ;
- **SUPERSEDED** : remplacé, conservé avec filiation ;
- **ABANDONED_WITH_REASON / REJECTED_WITH_REASON** : non retenu, raison conservée ;
- **TO_VERIFY** : affirmation ou ressource plausible mais non prouvée.

Les statuts ne montent jamais automatiquement. Une preuve nouvelle les fait évoluer.

## 0.3 Évolution additive et anti-RSIA

**RSIA = Régression Systémique Induite par Amélioration.**

Une amélioration locale n'est pas une amélioration produit si elle :
- retire silencieusement un acquis ;
- contourne une autorité canonique ;
- duplique une vérité ;
- augmente fortement coût/latence/batterie sans valeur proportionnée ;
- affaiblit sécurité, confidentialité, audit ou offline ;
- casse une autre plateforme/appareil/tenant ;
- rend impossible la reprise ou le rollback.

Avant fusion, toute évolution substantielle doit répondre : *qu'est-ce qui s'améliore, qu'est-ce qui peut régresser, qui dépend de ceci, quelles preuves de parité existent, comment revenir en arrière ?*

---

# 1. ORDRE UNIVERSEL DES SOURCES DE VÉRITÉ

L'ordre exact peut être adapté au projet, mais la logique est stable :

1. invariants critiques de sécurité, légalité, intégrité et confidentialité ;
2. décision métier explicite et active du propriétaire/fondateur ;
3. code versionné réellement présent ;
4. CI/tests/artefacts attachés au commit exact ;
5. production/staging réellement observés ;
6. vérité opérationnelle versionnée : Project Truth Ledger / Current Truth ;
7. cahier maître et ADR/CIR actifs ;
8. Feature/Capability Registry ;
9. archives historiques et anciennes conversations.

En cas de divergence, on ne choisit jamais le document “le plus récent” mécaniquement. On identifie la nature de la divergence :
- besoin métier ;
- état d'implémentation ;
- état de production ;
- choix architectural ;
- ancien contexte.

La source ayant autorité sur **ce type de vérité** prévaut, et la divergence est documentée.

---

# 2. MÉMOIRE INSTITUTIONNELLE OBLIGATOIRE

## 2.1 Memory Before Code

Avant d'implémenter ou modifier une capacité :

1. lancer un Recall ciblé sur le chantier ;
2. consulter les exigences modernes ;
3. consulter les archives historiques liées ;
4. retrouver les idées dormantes/rejetées/superseded ;
5. retrouver les décisions/ADR/CIR ;
6. inspecter l'implémentation actuelle ;
7. cartographier consommateurs/dépendances ;
8. relire tests et incidents terrain associés.

L'objectif n'est pas de recopier tout le passé : il est d'obtenir **la meilleure synthèse actuelle de toute la mémoire disponible**.

## 2.2 Aucune idée ne disparaît

Une idée ancienne peut redevenir excellente lorsque le contexte change.

Interdiction :
- suppression silencieuse d'une idée parce qu'elle n'est pas MVP ;
- déduction “non mentionné = abandonné” ;
- écrasement des variantes historiques.

Préférer :
- `DORMANT` ;
- `SUPERSEDED` avec lien vers le successeur ;
- `REJECTED_WITH_REASON` ;
- `CONFLICTING / NEEDS_ARBITRATION`.

## 2.3 Ingestion profonde des sources

Une source importante est considérée correctement ingérée lorsqu'elle possède, selon sa nature :

- identifiant stable ;
- provenance ;
- empreinte SHA-256 si fichier ;
- structure inventoriée ;
- concepts/règles/scénarios extraits ;
- secrets et données personnelles exclus des artefacts publics ;
- liens vers capacités ;
- contradictions et variantes recensées ;
- niveau de confiance ;
- statut de couverture ;
- méthode pour revenir à la source brute en cas d'audit.

Une archive privée peut nourrir la mémoire fonctionnelle sans être publiée.

## 2.4 Current Truth + Truth Ledger

Chaque projet durable doit disposer d'une vérité de reprise courte et d'un registre machine-lisible contenant notamment :

- version ;
- branche ;
- HEAD ;
- PR ;
- CI ;
- déploiement ;
- DB/migrations ;
- artefacts ;
- secrets **par nom/existence seulement**, jamais par valeur ;
- fonctionnalités acquises ;
- chantiers ;
- inconnues ;
- éléments superseded/abandonnés ;
- prochaine preuve attendue.

Un agent doit lire ce registre **avant de demander au propriétaire de recréer une ressource**.

---

# 3. PROTOCOLE DE SOLIDARITÉ DES SERVICES — « LES DOIGTS D'UNE MÊME MAIN »

## 3.1 Principe

Les services/modules ne sont ni des royaumes indépendants ni des copies les uns des autres. Ils forment une équipe.

Chaque service doit connaître :
- **ce qu'il possède** ;
- **ce qu'il sait faire** ;
- **ce qu'il ne doit pas faire** ;
- **ce qu'il consomme chez les autres** ;
- **les risques qu'il porte** ;
- **son comportement lorsqu'une dépendance est indisponible**.

## 3.2 Une capacité = une autorité canonique

Pour toute activité métier significative, un seul service est l'autorité canonique.

Exemples génériques :
- identité → service identité ;
- règles/policy → Policy ;
- workflow → Workflow ;
- preuve → Evidence ;
- ledger → Ledger ;
- notifications → Notification ;
- dossiers/litiges → Case ;
- configuration → Configuration.

Si un autre module a besoin de cette capacité, il **délègue** au propriétaire au lieu de recopier la logique.

## 3.3 Reuse Before Build

Avant de créer un nouveau service/moteur :

1. chercher une capacité existante ;
2. chercher un service proche ;
3. vérifier si l'extension de ce service respecte sa responsabilité ;
4. vérifier si un contrat/adapter suffit ;
5. ne créer un nouveau service que si la responsabilité est réellement distincte.

Après trois couches autour de la même responsabilité, revue de consolidation obligatoire.

## 3.4 Contrats plutôt que tables

Un service ne lit/modifie pas sauvagement les tables internes d'un autre domaine.

Ordre préféré :
- contrat/app service ;
- port ;
- événement ;
- projection publique ;
- adapter approuvé.

La base de données est un détail d'implémentation, pas une API inter-domaines.

## 3.5 Orchestration sans confiscation

Un parcours multi-services est coordonné par une couche d'application/orchestration.

L'orchestrateur :
- séquence ;
- collecte les décisions ;
- gère corrélation/idempotence ;
- expose l'état du workflow.

Il ne :
- recode pas les règles métiers de chaque service ;
- prend pas possession des données ;
- crée pas une deuxième comptabilité ;
- contourne pas les politiques du propriétaire.

## 3.6 Service Capability Card

Chaque service important doit déclarer au minimum :

- `serviceId` ;
- responsabilité ;
- capacités possédées ;
- limites/interdictions ;
- dépendances autorisées ;
- autorité de données ;
- niveau de risque ;
- politique offline ;
- politique de panne ;
- événements émis/consommés si pertinent ;
- audit attendu ;
- règles de confidentialité ;
- tests de contrat.

Ces cartes forment le **Service Capability Directory**.

## 3.7 Pas de conflits cachés

Quand deux services semblent vouloir posséder la même capacité :
- stop à la duplication ;
- CIR/impact analysis ;
- déterminer le propriétaire canonique ;
- déplacer/fusionner ou créer un port ;
- caractériser l'ancien comportement ;
- migrer ;
- conserver rollback ;
- supprimer l'ancien moteur seulement après parité.

## 3.8 Défaillance : solidarité graduée

**Faible risque** : dégradation gracieuse.  
Exemple : média absent → texte ; analytics absent → parcours métier continue.

**Risque élevé** : fail closed.  
Exemple : autorisation inconnue, preuve financière ambiguë, conflit d'identité, résultat de paiement `UNKNOWN`.

Une dépendance indisponible ne doit jamais être convertie silencieusement en succès.

## 3.9 `UNKNOWN` est un vrai état

Lorsqu'une action peut avoir eu lieu sans confirmation fiable :
- ne pas recréer automatiquement l'opération ;
- conserver corrélation et preuve disponible ;
- déclencher rapprochement/vérification ;
- exposer honnêtement l'incertitude.

Cette règle est universelle pour argent, opérations externes et autres mutations non idempotentes.

---

# 4. ARCHITECTURE ET DÉPENDANCES

## 4.1 Direction canonique

Par défaut :

`UI / API / Agent → Application / Use Cases → Domain → Ports → Adapters`

Interdit sans ADR :
- UI → DB directe ;
- IA → mutation financière directe ;
- reporting → calcul parallèle de la vérité financière ;
- module A → tables privées de B ;
- offline → fausse finalité serveur ;
- adapter natif → décision métier autonome.

## 4.2 Dépendances explicites

Toute dépendance inter-service substantielle doit être :
- déclarée dans le catalogue ;
- justifiée ;
- testée ;
- acyclique ou explicitement orchestrée ;
- versionnée si contrat externe.

Un graphe de dépendances doit pouvoir répondre : *si je change X, qui peut casser ?*

## 4.3 Événements

Les événements servent à diffuser un fait déjà décidé par son propriétaire.

Ils ne servent pas à :
- cacher une transaction distribuée fragile ;
- contourner un contrat ;
- transformer tous les services en microservices.

Dans un monolithe modulaire, un appel interne clair reste souvent préférable.

## 4.4 Architecture évolutive sans futurisme

Commencer simple :
- monolithe modulaire ;
- interfaces/ports ;
- feature flags ;
- queues uniquement où nécessaires.

Extraire un microservice uniquement lorsque charge, isolation, équipe ou réglementation fournissent une preuve du besoin.

---

# 5. DONNÉES, ARGENT ET INTÉGRITÉ

## 5.1 Ledger et finalité

Pour tout projet financier :
- ledger append-only ou équivalent auditable ;
- correction par reversal/compensation, pas modification silencieuse ;
- idempotency key ;
- corrélation ;
- source/origine ;
- acteur ;
- tenant/scope ;
- timestamps ;
- état explicite.

## 5.2 Offline honnête

Offline peut conserver :
- brouillon ;
- intention ;
- événement local ;
- cache ;
- outbox.

Offline ne peut pas inventer :
- paiement confirmé par un serveur/opérateur absent ;
- autorisation devenue inconnue ;
- résultat externe non reçu.

## 5.3 Double clic, retry, concurrence

Toute mutation critique doit être testée au minimum contre :
- double clic ;
- retry réseau ;
- reprise après crash ;
- deux appareils ;
- concurrence ;
- rôle retiré ;
- tenant voisin ;
- donnée ancienne ;
- conflit de version.

## 5.4 Migrations

Préférer `expand → migrate/backfill → verify → contract`.

- migration additive/idempotente par défaut ;
- destructive = autorisation spécifique + backup/rollback + fenêtre contrôlée ;
- migration écrite ≠ migration déployée ;
- déploiement app ≠ déploiement DB.

---

# 6. SÉCURITÉ, SECRETS ET CONFIDENTIALITÉ

## 6.1 Jamais de secret dans la mémoire projet

Interdiction de stocker dans :
- Git ;
- Cahier ;
- Truth Ledger ;
- chat ;
- logs ;
- captures publiques ;

les valeurs de :
- API tokens ;
- mots de passe ;
- PIN ;
- private keys ;
- keystores ;
- secrets d'appairage.

Le registre peut stocker **le nom du secret, son existence et son périmètre**.

## 6.2 Least privilege

Chaque jeton/agent/service reçoit le minimum de droits requis.

Séparer :
- lecture ;
- écriture ;
- migration ;
- déploiement ;
- production ;
- secrets.

## 6.3 Données privées

Une source privée utilisée pour apprendre une règle ne devient pas un artefact public.

Avant commit/publication :
- anonymisation ;
- minimisation ;
- suppression des credentials ;
- suppression des PII inutiles ;
- revue de provenance.

---

# 7. GIT, CI ET PREUVES

## 7.1 Git

- branche isolée ;
- pas de force-push sur branche protégée ;
- commits cohérents ;
- PR pour évolution substantielle ;
- historique conservé ;
- tag/release uniquement après qualification.

## 7.2 CI comme garde-fou vivant

Les règles critiques doivent être transformées en contrôles automatiques lorsque c'est raisonnable :
- architecture fitness ;
- dependency fitness ;
- truth gate ;
- memory gate ;
- secret scan ;
- migration policy ;
- tests de contrat ;
- parité i18n/accessibilité ;
- non-régression fonctionnelle.

Un garde-fou qui ne peut pas être automatisé doit avoir une checklist de revue.

## 7.3 Ne jamais supprimer un test parce qu'il dérange

Si un test bloque une bonne évolution :
1. vérifier la raison du test ;
2. distinguer garde-fou valide et test trop rigide ;
3. améliorer le test ;
4. conserver l'intention protectrice.

Le but est une **souplesse intelligente**, pas une bureaucratie aveugle.

## 7.4 Définition de « complet »

Une fonctionnalité à risque ne peut être dite complète que lorsque, selon pertinence :
- besoin ;
- permissions ;
- UI/API ;
- stockage ;
- erreurs ;
- idempotence ;
- audit ;
- offline ;
- sécurité ;
- tests ;
- migration ;
- observabilité ;
- rollback ;
- recette terrain/pilote ;
- documentation de reprise

sont couverts.

---

# 8. DÉPLOIEMENT ET PRODUCTION

## 8.1 Actions distinctes

Toujours distinguer :
- commit ;
- merge ;
- migration ;
- déploiement ;
- activation feature flag ;
- activation argent réel.

Une livraison UI-only ne doit pas muter implicitement DB/Worker.

## 8.2 Release rings

Préférer :
1. local ;
2. CI ;
3. dev/staging ;
4. alpha ;
5. pilote restreint ;
6. production progressive.

Avec :
- feature flags ;
- kill switch ;
- rollback ciblé ;
- métriques ;
- seuils d'arrêt.

## 8.3 Vérité dynamique

À chaque reprise, revalider les faits dynamiques :
- HEAD ;
- PR ;
- CI ;
- Worker/service live ;
- DB/migrations ;
- artefact réellement distribué ;
- feature flags.

Ne pas recopier aveuglément un ancien état.

---

# 9. COÛT, PERFORMANCE ET ACCESSIBILITÉ

Chaque service doit respecter un budget de ressources :
- CPU ;
- mémoire ;
- stockage ;
- lignes DB ;
- appels API ;
- batterie ;
- data mobile ;
- coût IA ;
- latence.

Un Resource Governor ou équivalent peut arbitrer les modes.

Ordre de priorité en contrainte :
1. sécurité/auth/intégrité ;
2. données métier et offline ;
3. communications essentielles ;
4. confort ;
5. média/analytics ;
6. IA lourde.

Une API avancée absente ne doit pas faire tomber l'ensemble si le cœur peut fonctionner.

---

# 10. IA ET AGENTS

## 10.1 IA conseillère, pas souveraine

Sans règle spécifique validée, une IA ne doit pas décider seule :
- transfert d'argent ;
- sanction ;
- exclusion ;
- accusation ;
- vote ;
- suppression irréversible.

Elle peut :
- expliquer ;
- détecter anomalie ;
- simuler ;
- préparer ;
- suggérer ;
- comparer ;
- générer un brouillon ;
- demander validation.

## 10.2 Multi-agent

Travaux parallèles seulement sur zones indépendantes.

Éviter modifications simultanées non coordonnées sur :
- ledger ;
- auth/policy ;
- migrations ;
- même machine d'état ;
- même contrat critique.

Chaque agent doit produire :
- scope ;
- fichiers touchés ;
- hypothèses ;
- tests ;
- risques ;
- preuve.

---

# 11. INCIDENTS ET RETOURS TERRAIN

Un problème terrain reproductible devient :

`Observation → reproduction → cause → correction au bon organe → test permanent → qualification → mise à jour vérité`.

Ne pas résoudre un symptôme en créant un contournement qui devient une deuxième architecture.

Une anomalie non reproduite reste `TO_VERIFY`, pas “corrigée”.

---

# 12. PROGRESSION SANS BUREAUCRATIE

Les garde-fous servent à accélérer une progression fiable.

Ils doivent être **pondérés par le risque** :

- modification texte/faible risque : contrôle léger ;
- module métier : Recall + tests + CIR ciblé ;
- finance/auth/migration : preuves plus fortes ;
- production/argent réel : autorisation séparée et recette.

Pendant qu'une dépendance externe est bloquée, l'équipe avance sur les chantiers indépendants.

Ne jamais immobiliser tout le projet pour une vérification qui peut être isolée.

---

# 13. FORMAT UNIVERSEL DE REPRISE

Après toute étape substantielle, enregistrer :

- Projet ;
- Version ;
- Branche ;
- Commit/HEAD ;
- PR ;
- CI ;
- Déploiement ;
- DB/migrations ;
- Artefact + SHA si pertinent ;
- Problème traité ;
- Cause ;
- Correction ;
- Fichiers modifiés ;
- Tests exécutés ;
- Résultats ;
- Acquis ;
- En chantier ;
- DORMANT/SUPERSEDED/ABANDONED ;
- Ce qu'il ne faut surtout pas modifier ;
- Limites de preuve ;
- Point de reprise ;
- Régression possible ;
- Autorisation nécessaire.

---

# 14. PROTOCOLE DE MUTUALISATION ENTRE PROJETS

## 14.1 Ce qui peut être partagé

Peuvent être mutualisés :
- méthodes de mémoire ;
- statuts ;
- garde-fous génériques ;
- CI patterns ;
- secret discipline ;
- non-régression ;
- architecture fitness ;
- rollback ;
- source ingestion ;
- dependency graph ;
- service capability cards ;
- incident learning.

## 14.2 Ce qui ne doit pas fuiter

Ne jamais mutualiser automatiquement :
- données clients/membres ;
- secrets ;
- identifiants privés ;
- corpus confidentiel ;
- règles métier propres à un projet présentées comme universelles.

## 14.3 Provenance obligatoire

Toute règle importée d'un autre projet indique :
- projet source ;
- nature : invariant générique / retour terrain / règle métier spécifique ;
- adaptation ;
- statut dans le projet cible.

On mutualise **le savoir**, pas les secrets ni les données.

---

# 15. SOURCES FONDATRICES DE CETTE VERSION 1.0.0

Cette version consolide des doctrines déjà éprouvées dans :

- **B.I.R./BlueAuto** : preuve avant statut ACQUIS, séparation commit/merge/migration/déploiement, vérité dynamique revalidée, secrets absents des sauvegardes, idempotence/FIFO/UNKNOWN, reprise documentée ;
- **Eco-System** : Memory Before Code, Caverne d'idées, Feature Registry, Project Truth Ledger, anti-RSIA, architecture organique/Kernel, Resource Governor, multi-tenant, offline honnête ;
- **retours explicites du fondateur** : ne rien perdre, prendre le meilleur de chaque idée, faire coopérer les services “comme les doigts d'une même main”, ne pas ralentir inutilement le progrès.

### Source B.I.R./BlueAuto — réintégration explicite

Le fondateur confirme que la source à mutualiser est **B.I.R./BlueAuto**. La discipline B.I.R. est donc une source active et vérifiée du présent playbook, notamment pour : vérité dynamique, preuve avant statut ACQUIS, secrets exclus des sauvegardes, séparation commit/merge/migration/déploiement/production, qualification d’artefacts, historique non réécrit, état obligatoire de reprise et autorisation distincte des mutations de production.

Eco-System renforce cette discipline avec : Truth Ledger machine-lisible, Memory Recall, Service Capability Directory, Source→Capability Coverage, anti-RSIA, tests restaurabilité et distinction `ACQUIRED / VERIFIED_LOCAL / VERIFIED_REMOTE`.

---

# 16. RÈGLE FINALE

**Mémoire sans progrès est de l'archivage. Progrès sans mémoire est de la régression.**

Le système attendu est donc :

`RECALL → UNDERSTAND → MAP → COOPERATE → IMPLEMENT → TEST → VERIFY → RECORD → CONTINUE`

et, entre services :

`ASK OWNER → USE CONTRACT → SHARE EVIDENCE → FAIL HONESTLY → NEVER DUPLICATE TRUTH`.


# 17. PROCÉDURE UNIVERSELLE DE SAUVEGARDE ET REPRISE — HÉRITAGE B.I.R. RENFORCÉ

La procédure détaillée Eco-System est versionnée dans `ECO_SYSTEM_PROCEDURE_OBLIGATOIRE_SAUVEGARDE_REPRISE_1.0.0.md`. Elle devient le profil de référence pour les projets complexes.

Checkpoint obligatoire :
`Version | Branche | HEAD | PR | CI/run | Déploiement | DB/Migrations | Artefacts/SHA | Problème | Cause | Correction | Fichiers | Tests | Résultats | Acquis | En chantier | Dormant/Superseded | Ne pas modifier | Limites | Reprise | Régression | Autorisation | Rollback`.

Contrôles supplémentaires par rapport à B.I.R. :
- tester la **restaurabilité** de la sauvegarde elle-même ;
- enregistrer la vérité distante dans le Truth Ledger dans le même chantier ;
- conserver un graphe d’impact des services ;
- exiger une preuve spécifique pour chaque montée de statut ;
- sauvegarder avant migration/merge/déploiement à risque ;
- ne jamais demander de recréer une ressource déjà `ACQUIRED` sans vérification préalable ;
- conserver au moins une route de reprise indépendante du chat courant.

Règles absolues : aucune valeur de secret ; vérité dynamique revalidée ; commit ≠ merge ≠ migration ≠ déploiement ≠ production ; historique conservé ; rollback/base saine nommée ; migration destructive seulement avec autorisation et plan renforcé.
