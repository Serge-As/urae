# ECO-SYSTEM — DOCTRINE DE FLEXIBILITÉ MÉTIER ET D'EXCEPTIONS GOUVERNÉES

Date: 2026-09-10
Statut: décision produit du fondateur, à intégrer avant de poursuivre le durcissement métier.

## 1. Principe cardinal
Eco-System ne doit pas transformer les pratiques d'un groupe en règles universelles pour tous les autres groupes.

Une interdiction absolue n'est justifiée que par un invariant technique, comptable, de sécurité ou de confidentialité (par exemple: absence de fuite inter-tenant, absence de mutation non autorisée, traçabilité des corrections sensibles, intégrité du type de donnée, pas de fausse finalité offline, pas d'argent réel tant que `realMoneyEnabled=false`).

Pour le reste, le moteur doit privilégier des politiques composables propres au groupe: règle normale + exceptions autorisées + personnes/rôles habilités + quorum/approbations éventuelles + période/conditions + justification + preuve + notification + piste d'audit + recours/régularisation.

Lorsqu'une action sensible n'est pas permise ou que la règle est inconnue, l'interface ne doit pas se réduire à une impasse. Elle doit, lorsque cela est juridiquement et techniquement acceptable, proposer une voie gouvernée: demander une autorisation, solliciter les responsables compétents, enregistrer une demande d'exception, ou expliquer comment régulariser.

## 2. Simulation d'un projet de groupe
La restriction actuellement déployée « seul le créateur peut simuler » est trop étroite comme doctrine universelle. L'intention de sécurité était d'empêcher un acteur non autorisé de modifier ou d'engager le projet d'autrui.

La règle cible doit être fondée sur les capacités et non sur l'identité de créateur uniquement. À distinguer au minimum:
- consulter/simuler sans effet irréversible;
- modifier les paramètres du projet;
- valider une simulation comme référence;
- convertir le projet en groupe réel.

Le créateur peut avoir ces droits par défaut, mais il doit pouvoir déléguer selon la gouvernance du projet à un cofondateur, conseiller, trésorier, secrétaire, comité ou autre acteur autorisé. Une simulation purement exploratoire peut être plus ouverte qu'une validation ou une conversion.

Formulation canonique: « une personne non autorisée ne peut pas engager ou altérer le projet », et non « toute autre personne que le créateur est interdite ».

## 3. Clôture de séance: checkpoint, pas tombeau
La clôture idempotente signifie uniquement qu'un double clic, une répétition réseau ou une requête rejouée ne doit pas créer deux clôtures contradictoires ni doubler des écritures. Une intention logique de clôture produit un seul résultat logique.

Idempotent ne signifie pas irréversible.

Une séance clôturée doit devenir un checkpoint versionné. Si les règles du groupe le permettent, des opérations tardives peuvent ensuite être enregistrées: cotisation d'un retardataire le même soir, paiement reçu le lendemain, membre bénéficiaire qui décide finalement de reverser/cotiser une partie, correction documentée, etc.

Le groupe doit pouvoir configurer les conditions de post-clôture, sans liste fermée universelle: autorisé/interdit; fenêtre de temps; rubriques concernées; responsables habilités; approbation d'une personne, de deux personnes, de tous les responsables financiers, du président, du fondateur ou d'un quorum configurable; motif; pièces justificatives; notifications; éventuelle nouvelle clôture.

Modèle recommandé: `Clôture V1 -> ajustement tardif tracé -> clôture V2`, sans effacer l'état historique V1.

## 4. Montants négatifs: distinguer caisse physique et signification métier
Un montant de caisse physique comptée en XAF ne peut pas représenter un nombre négatif de billets/pièces. Cet invariant reste utile dans un champ de comptage physique.

Mais la notation historique `-2 000` utilisée par le fondateur exprime une réalité métier importante: manquant d'un membre, obligation non honorée, dette/recevable, ou déficit individuel à couvrir. Elle ne doit pas être supprimée de l'expérience utilisateur.

Eco-System doit donc séparer la sémantique du signe de la réalité de trésorerie. L'interface peut afficher clairement, par exemple:
- `-2 000 XAF` — manquant/dette du membre;
- `+2 000 XAF` — couverture/avance de solidarité provenant d'une caisse autorisée.

Le registre canonique conserve des flux distincts afin de rester comptablement cohérent.

## 5. Exemple de cagnotte obligatoire fixe avec solidarité
Exemple fondateur: 20 membres x 2 000 XAF = objectif obligatoire de 40 000 XAF pour une rubrique telle que collation.

Si un membre absent ne verse pas ses 2 000 XAF et que la règle du groupe impose au collectif de garantir le montant complet au bénéficiaire:
- attendu/obligatoire: 40 000;
- réellement versé par les membres: 38 000;
- manquant/dette du membre: 2 000;
- couverture de solidarité depuis la caisse autorisée: 2 000;
- montant disponible pour la rubrique: 40 000;
- montant remis/décaissé au bénéficiaire: 40 000;
- la dette ou obligation de régularisation de 2 000 reste suivie séparément, sauf remise, sanction, compensation ou autre règle du groupe.

Si un autre groupe refuse la solidarité, il peut remettre seulement ce qui a réellement été collecté. Un autre peut couvrir partiellement, appliquer un plafond, conditionner la couverture à l'état des cotisations du membre, utiliser plusieurs caisses dans un ordre défini, sanctionner, reporter, exonérer ou combiner plusieurs mécanismes.

Aucune de ces variantes ne doit devenir la règle universelle.

## 6. Rubriques concernées et extensibilité
Cette logique peut concerner notamment collation, aide locale, mains levées, assistances, secours et d'autres rubriques présentes ou futures. La liste ne doit pas être fermée.

Une rubrique doit pouvoir définir, de façon composable:
- base/objectif attendu (fixe, par membre, variable, autre formule);
- caractère obligatoire ou conditionnel;
- traitement des absences/manquants;
- éventuelle solidarité et source(s) de financement;
- conditions d'éligibilité du membre à cette solidarité;
- dette/régularisation/sanction/exonération;
- montant à remettre au bénéficiaire (objectif garanti, collecté réel, formule mixte, autre politique);
- décaissement immédiat, différé ou partiel;
- acteurs et validations requis;
- exceptions et procédure de régularisation.

Ces axes ne constituent pas une liste exhaustive: le système doit rester extensible pour accueillir des règles mixtes propres à chaque groupe.

## 7. Statuts, RI et autres textes du groupe
Eco-System doit exploiter les statuts, RI, procès-verbaux, décisions et autres textes pour proposer les règles applicables au groupe.

Toutefois, une interprétation IA ne doit jamais activer silencieusement une règle sensible. Le système doit produire une proposition vérifiable avec source/clause, signaler les ambiguïtés et demander validation à l'autorité du groupe avant activation.

Le texte du groupe est une source de vérité gouvernée; l'IA est un lecteur/assistant, pas le législateur du groupe.

## 8. Conséquence sur le runtime actuellement déployé
Les garde-fous actuellement déployés « créateur seul pour simulation » et « aucune cotisation sur séance clôturée » doivent être considérés comme des restrictions provisoires de sécurité à raffiner, pas comme doctrine métier définitive.

Le contrôle `XAF physical cashbox >= 0, entier` reste pertinent pour le comptage physique, mais il ne doit jamais empêcher la représentation d'un manquant/dette négatif dans la couche métier ni sa couverture positive par solidarité.

Avant de modifier le runtime, implémenter ces raffinements via le moteur canonique de politiques/capacités afin d'éviter une succession de cas spéciaux et de nouveaux moteurs parallèles.
