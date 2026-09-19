# DELOR85 — DEUX CONVENTIONS FONDATRICES UNIVERSELLES

**Version : 1.0.0 — 19 septembre 2026**  
**Statut : OBLIGATOIRE — règle transversale pour tous les projets actuels et futurs du fondateur**  
**Portée : Eco-System, B.I.R./BlueAuto, AS Beauty, Backhaul/Return Load et tout projet créé ultérieurement**  
**Nature : garde-fous d'architecture et de non-régression ; projet-neutres**

> Ces deux conventions ne remplacent pas les constitutions métier propres à chaque projet. Elles imposent la manière dont toute nouvelle capacité doit être intégrée afin d'éviter les moteurs parallèles, les vérités contradictoires et les régressions créées par une amélioration locale.

---

# CONVENTION 1 — UNE CAPACITÉ SIGNIFICATIVE = UNE AUTORITÉ CANONIQUE

## Règle

Pour toute activité métier, donnée ou décision significative, **un seul service, module ou composant est l'autorité canonique**.

Les autres écrans, services, agents, IA, rapports, projections, fonctions offline ou intégrations qui ont besoin de cette capacité doivent l'appeler, consommer un contrat/projection autorisé, ou lui transmettre une intention. Ils ne recréent pas une seconde vérité.

## Pourquoi cette convention existe

Sans propriétaire canonique, un projet finit par produire :
- deux soldes différents ;
- deux règles différentes pour la même opération ;
- une UI qui modifie directement une donnée qu'un autre moteur croit posséder ;
- des rapports qui recalculent la comptabilité avec une autre formule ;
- des agents IA qui prennent des décisions hors du service métier ;
- des fonctions offline qui inventent une finalité serveur ;
- des corrections impossibles à auditer.

## Exemples

### Finance
Le Ledger/D1 canonique possède la vérité financière.  
Une feuille de séance, une fiche individuelle, un RECAP, une notification ou une projection Live ne deviennent jamais un second Ledger.

### Identité
Le service Identité possède la vérité d'identification et de rapprochement. Marketplace, Forum, Business ou Groupe n'implémentent pas chacun leur propre identité.

### Règles
Le moteur de politiques/Living Rules possède la règle opérationnelle validée. L'IA peut expliquer ou proposer ; elle ne crée pas seule une règle active.

### Notifications
Un service Notification est propriétaire du statut d'une notification. Un module métier émet l'événement ou l'intention ; il ne simule pas un envoi externe réussi.

## Contrat obligatoire avant implémentation

Toute capacité substantielle doit pouvoir répondre :
1. Quel est son **canonical owner** ?
2. Quelle donnée/décision possède-t-il ?
3. Qu'est-ce qu'il **ne possède pas** ?
4. Quels services le consomment ?
5. Par quel contrat/port/API/événement/projection ?
6. Que se passe-t-il si le propriétaire est indisponible ?
7. Quel test prouve qu'une seconde vérité n'a pas été créée ?

Si ces réponses sont inconnues, le lot est **BLOCKED_ARCHITECTURE** jusqu'à clarification.

## Exception

Une projection, un cache, un index de recherche ou une copie offline est autorisé si :
- la source canonique est identifiée ;
- la copie est explicitement marquée comme projection/cache ;
- son niveau de fraîcheur est connu ;
- elle ne peut pas produire une nouvelle finalité contradictoire ;
- sa resynchronisation est testée.

---

# CONVENTION 2 — RÉUTILISER / ÉTENDRE / ADAPTER AVANT DE CONSTRUIRE EN PARALLÈLE

## Règle

Avant de créer un nouveau service, moteur, base, workflow ou composant métier important, l'implémenteur doit **chercher d'abord ce qui existe et tenter, dans cet ordre** :

1. **réutiliser** ;
2. **étendre** le propriétaire canonique si cela reste dans sa responsabilité ;
3. créer un **adapter/port/contrat** ;
4. seulement ensuite créer une nouvelle capacité réellement distincte.

Le simple fait qu'un nouveau module semble plus rapide à coder n'est pas une justification.

## Preuve minimale « Reuse Before Build »

Avant un nouveau moteur/service significatif, le CIR/ADR/ticket doit enregistrer :
- capacités existantes inspectées ;
- propriétaire canonique voisin ;
- raisons pour lesquelles la réutilisation seule ne suffit pas ;
- raisons pour lesquelles une extension serait ou non saine ;
- raisons pour lesquelles un adapter serait ou non suffisant ;
- responsabilité réellement nouvelle qui justifie la création ;
- plan de migration si une ancienne capacité est remplacée ;
- test de parité et rollback.

Sans cette preuve, la création d'un moteur parallèle est **BLOCKED_DUPLICATION_RISK**.

## Règle des trois couches

Si trois wrappers, adapters ou sous-moteurs commencent à entourer la même responsabilité, une revue de consolidation devient obligatoire.

## Remplacement d'un moteur existant

Un ancien moteur n'est supprimé qu'après :
1. tests de caractérisation de l'ancien comportement utile ;
2. parité démontrée ;
3. migration ;
4. période de coexistence gouvernée si nécessaire ;
5. rollback disponible ;
6. suppression documentée avec statut SUPERSEDED.

---

# GARDE-FOUS MACHINE-LISIBLES

Ces conventions sont enregistrées dans `SHARED_GUARDRAIL_REGISTRY.json` sans remplacer les identifiants historiques :

- `OWNER.CANONICAL` — convention 1 ;
- `REUSE.BEFORE.BUILD` — convention 2.

Le registre contient également les alias conventionnels afin que les futurs projets puissent les importer sans renommer les garde-fous historiques.

Le lint de gouvernance doit échouer si :
- l'une des deux conventions disparaît ;
- la portée n'inclut plus les projets présents et futurs ;
- le lien avec `OWNER.CANONICAL` ou `REUSE.BEFORE.BUILD` est perdu ;
- le document source conventionnel n'est plus présent.

---

# APPLICATION AUX PROJETS EXISTANTS

L'adoption de ces conventions est **additive** :
- elle n'autorise aucune réécriture massive ;
- elle n'impose pas la création de microservices ;
- elle ne remet pas à zéro les architectures existantes ;
- elle impose une revue au moment où une capacité est modifiée ou ajoutée.

Un défaut historique de duplication est corrigé progressivement, au bon jalon, avec tests et rollback ; il n'est pas utilisé comme prétexte pour casser un service qui fonctionne.

---

# APPLICATION AUX PROJETS FUTURS

Tout nouveau projet doit démarrer avec :
1. ce document ;
2. le Playbook universel ;
3. le registre partagé ;
4. une carte initiale des autorités canoniques ;
5. une règle explicite Reuse Before Build.

Ces documents doivent être copiés/référencés sans données privées d'un autre projet.

---

# TEST DE DÉCISION RAPIDE

Avant d'écrire un nouveau moteur, demander :

> **Qui possède déjà cette vérité ?**

Puis :

> **Puis-je réutiliser, étendre ou adapter ce propriétaire sans casser sa responsabilité ?**

Si la première réponse est « personne », nommer le propriétaire.  
Si la seconde réponse est « oui », ne pas créer un moteur parallèle.  
Si la réponse est « non », documenter pourquoi avant de créer.

---

# RÈGLE FINALE

> **Une seule vérité métier par capacité ; réutiliser cette vérité avant d'en construire une autre.**

Ces deux conventions sont obligatoires, mais restent subordonnées aux contraintes plus fortes de sécurité, légalité, confidentialité, intégrité, preuve et décision explicite du propriétaire du projet.
