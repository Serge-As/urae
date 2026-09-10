# ECO-SYSTEM — Doctrine des règles vivantes 1.0.0

Date : 2026-09-10
Statut : doctrine métier obligatoire pour l'application, l'IA, les assistants et les futurs développements.

## Mot d'ordre fondateur

> « Voilà comment un groupe peut décrire la manière dont sa collation fonctionne. »

Eco-System ne doit pas imposer une définition rigide de la collation, de l'aide locale, de la main levée, du secours, de l'assistance, de l'épargne, du prêt, de la tontine ou de toute autre rubrique. Le système doit permettre au groupe de décrire comment **lui** pense, décide et exécute chaque rubrique.

## Trois vérités à conserver séparément

Pour chaque règle ou rubrique, Eco-System doit pouvoir conserver et comparer :

1. **la règle écrite** : statuts, règlement intérieur, procès-verbal, résolution, paramétrage officiel ;
2. **la pratique observée** : ce que le groupe réalise effectivement au fil des séances ;
3. **la règle opérationnelle validée** : celle qu'une autorité habilitée confirme comme applicable maintenant.

Une divergence entre texte et pratique n'est ni effacée ni automatiquement qualifiée de faute. Elle est signalée, expliquée et soumise à la gouvernance du groupe.

## Invariant versus politique locale

Eco-System distingue :
- les invariants de sécurité, intégrité, confidentialité et cohérence comptable ;
- les politiques configurables propres à un groupe ;
- les exceptions gouvernées et régularisations ;
- les usages observés qui doivent encore être confirmés.

Une règle locale ne devient jamais universelle simplement parce qu'elle convient à un groupe pilote.

## Refus avec porte de sortie

Lorsqu'une action n'est pas autorisée, l'interface doit, lorsque c'est raisonnablement possible, expliquer pourquoi et proposer la voie gouvernée disponible : demander une autorisation, obtenir N validations, solliciter un rôle habilité, documenter une exception, corriger ou régulariser. Un refus de sécurité véritable peut rester absolu.

## Clôture de séance

La clôture est un checkpoint versionné et idempotent : répéter la même commande ne crée pas une seconde clôture. Elle n'interdit pas universellement toute opération ultérieure. Une cotisation tardive, correction ou décision postérieure peut être permise si la politique du groupe le prévoit, avec motif, heure réelle, auteur et approbations nécessaires. Les versions successives restent traçables.

## Montants, manquants et solidarité

Un comptage physique XAF ne peut pas être négatif ou fractionnaire. En revanche, une position métier peut représenter un manquant ou une dette, par exemple `-2 000`, tandis qu'une couverture solidaire distincte peut être `+2 000`.

Eco-System conserve séparément au minimum : attendu, collecté auprès des membres, manquant/dette, couverture solidaire, disponible pour le bénéficiaire, décaissement, solde restant et dette après couverture.

Exemple : 20 membres × 2 000 = 40 000 attendus ; 38 000 réellement collectés ; 2 000 manquants ; 2 000 couverts par solidarité ; 40 000 disponibles et décaissés au bénéficiaire ; rubrique à 0 ; dette du membre de 2 000 conservée si les règles le prévoient.

## Autorisations par capacités

« Créateur » n'est pas synonyme d'autorité universelle. Les droits de simuler, modifier, convertir, valider, inviter, administrer ou accorder des accès sont des capacités configurables et délégables selon les règles du groupe. Les actions sensibles restent auditées.

## IA : comprendre, proposer, ne pas légiférer seule

L'IA peut lire RI, statuts, PV et autres textes, repérer des règles probables, comparer le texte aux pratiques et suggérer une configuration. Une interprétation sensible ne devient pas automatiquement active : une personne ou instance habilitée doit la confirmer, la corriger ou la rejeter.

## Extension infinie sans explosion de cas spéciaux

Les pratiques possibles sont nombreuses, mixtes et évolutives. L'architecture doit donc privilégier des politiques composables, capacités, conditions, seuils, approbations et extensions, plutôt qu'une multiplication de `if` spécifiques à chaque association. Une activité métier possède toujours une autorité canonique et les autres interfaces la réutilisent.

## Sécurité actuelle

Cette doctrine n'autorise ni argent réel automatique, ni suppression de traçabilité, ni contournement de l'authentification ou des contrôles multi-tenant. `realMoneyEnabled=false` demeure obligatoire jusqu'à décision séparée et qualification adéquate.
