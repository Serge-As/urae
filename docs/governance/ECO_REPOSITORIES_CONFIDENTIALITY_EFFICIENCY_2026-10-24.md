# ECO-REPO-001 — confidentialité et efficacité des dépôts

Date : 24 octobre 2026. Instruction du fondateur, applicable aux chats, IA, développeurs et scripts qui travaillent sur Eco. Cette consigne complète les deux conventions fondatrices et le pacte de non-régression ; elle n'autorise aucune réduction des acquis.

## 1. Décision obligatoire

`Serge-As/urae` est le dépôt privé canonique de l'application réelle et de son historique. `Serge-As/utrae` est un dépôt public auxiliaire, avec historique indépendant. **Les éléments sensibles et confidentiels sont interdits dans UTRAE.** Ils restent dans l'environnement privé autorisé ; lorsqu'une conservation dans Git est appropriée, seul URAE est admissible.

Les secrets et données personnelles/financières réelles ne vont toutefois dans **aucun** Git : ni public, ni privé. Employer les coffres de secrets, D1/R2 privés et sauvegardes privées déjà autorisés, selon leurs droits. Une URL signée, un export de base ou un jeton n'est pas un document de travail à committer.

Privilégier UTRAE autant que possible pour tout ce qui est réellement publiable. Cela ne permet pas d'y faire exécuter les tests privés de l'application en lui donnant accès aux sources privées. Une CI publique verte n'est pas une preuve de fonctionnement du produit privé.

## 2. Répartition concrète

| Élément | Destination et règle |
| --- | --- |
| Code réel, moteurs financiers, droits, schémas internes, cahiers privés, historique du produit | URAE privé ; travail local de confiance en premier |
| Documents de gouvernance génériques revus et sans information interne | UTRAE, copie explicitement publique |
| Tests génériques, démonstrations et jeux de données entièrement fictifs | UTRAE après revue des sources et des sorties |
| Données de membres, montants réels, CNI, litiges, pièces, sessions, outbox, profils | Stockages privés applicatifs autorisés ; jamais de copie publique ni de fixture réelle |
| Clés, mots de passe, cookies, jetons, URLs signées, fichiers d'environnement réels | Coffres privés, hors Git et hors sorties de commande |
| Logs, captures et reçus de qualification du produit | Privés par défaut ; seule une synthèse réellement revue et dépourvue de contenu interne peut être publique |
| Sauvegardes D1/R2 et archives de sources privées | Stockages privés ; aucune archive, source map, base64 ou lien de téléchargement dans UTRAE |
| Déploiement, migration et preuve du runtime réel | Parcours privé existant ; UTRAE ne déploie pas le produit |

Un hash, un pseudonyme ou une suppression de nom ne suffit pas à rendre une donnée publique. Relire aussi les métadonnées, noms de fichiers, captures, chemins, descriptions, propriétés des documents et sorties des tests. En cas de classification incertaine, garder le contenu privé et poursuivre les travaux indépendants.

## 3. Procédure de travail économe

1. **Reprendre localement.** Lire les consignes et la vérité de reprise. Vérifier la branche et les changements locaux, exploiter les preuves déjà présentes. Aucun audit global récurrent de tout GitHub.
2. **Lire une seule fois ce qui manque.** Au début d'un lot, vérifier le HEAD distant et les runs pertinents si nécessaire. Conserver localement dépôt, branche, SHA, run, résultat, heure et périmètre. Une ressource immuable connue par SHA ne se télécharge pas de nouveau sans raison.
3. **Préparer le lot hors réseau.** Chercher avec `rg`, lire des extraits utiles, regrouper les lectures indépendantes. Réutiliser dépendances et compilation valides. Ne pas refaire `npm ci`, `npm audit`, une suite entière ou une extraction d'archive à chaque petit ajustement.
4. **Qualifier selon l'impact.** Tests ciblés pendant les corrections, puis contrôles obligatoires sur la source finale. Fixtures fictives et services locaux. Ne pas utiliser D1 de production comme banc d'essai ou relancer un test qui écrit à distance pour vérifier un simple libellé.
5. **Faire des checkpoints locaux.** Plusieurs commits locaux peuvent être regroupés dans une publication cohérente. La sûreté anti-interruption n'exige pas un appel GitHub ni une CI à chaque commit.
6. **Publier en une opération groupée.** Préférer un push Git contrôlé ou un arbre Git groupé à un appel par fichier. Vérifier juste avant la publication que la base distante attendue n'a pas changé. Pas de force-push. Si l'API est utilisée : une lecture du HEAD, un arbre groupé, un commit et une mise à jour non forcée constituent un objectif de quatre appels, hors contrôle de concurrence nécessaire et réponse ambiguë.
7. **Suivre sans boucle inutile.** Consulter un résumé du run, continuer du travail local indépendant, revenir à un jalon attendu. Espacer les contrôles inchangés ; ne pas redemander les mêmes jobs et logs. Préférer les notifications/attentes sur changement lorsqu'elles existent. Ne pas supprimer les contrôles bloquants pour économiser des minutes.
8. **Diagnostiquer avant de relancer.** Lire le résumé puis le seul job en échec. Télécharger le seul artefact nécessaire, une fois, et vérifier son empreinte. Une erreur de droits ne se résout pas en répétant la même requête ; une nouvelle relance exige une cause traitée ou une preuve d'incident transitoire.
9. **Clore sur preuve exacte.** Source, tests, sauvegarde, runtime déployé et recette terrain restent des états distincts. Conserver les reçus privés. Réutiliser les preuves identiques tant que source, dépendances et environnement qualifié n'ont pas changé ; sinon refaire le périmètre nécessaire.

Ces nombres sont des objectifs de sobriété, pas un plafond qui empêcherait une correction nécessaire. Les appels supplémentaires doivent avoir un but concret et ne doivent pas être remplacés par des suppositions de succès. Aucune économie promise ou consommation exacte inventée.

## 4. Usage maximal et sûr d'UTRAE

Faire dans UTRAE les procédures publiques, contrôles de périmètre, outils génériques autorisés, maquettes indépendantes, tests de syntaxe, responsive, accessibilité et scénarios synthétiques publiables. Avant de réutiliser un morceau du produit, vérifier qu'il n'est pas propriétaire ou confidentiel ; sa simple présence dans un navigateur ne vaut pas autorisation de publication.

Utiliser un clone public distinct. Ne pas ajouter de destination publique au clone privé pour y pousser par erreur. Ne jamais faire de miroir, de fork du dépôt privé, de transplantation de son `.git`, d'historique, de bundle Git ou d'archive dans UTRAE. Une sélection par fichiers ne suffit pas si les commits parents sont privés.

UTRAE ne reçoit aucun jeton ayant accès à URAE, aucun compte réel, aucun checkout privé, aucun lien signé ni artefact privé, même pour un test temporaire. Ne pas utiliser un runner privé de confiance pour exécuter du code provenant d'une PR publique non fiable. Les workflows publics ont des permissions minimales, une durée bornée, une concurrence contrôlée et n'exportent aucune donnée du produit.

Les tests réels restent locaux/privés. Les résultats publics ne remplacent jamais les suites financières, droits, synchronisation, offline/outbox, cache PWA et qualification navigateur requises pour le SHA privé final. Ne pas désactiver des workflows privés sans analyse de leurs dépendances et preuve de couverture équivalente.

## 5. Contrôle avant toute publication publique

1. Confirmer la destination exacte `Serge-As/utrae` et la copie de travail publique indépendante.
2. Classer chaque fichier ajouté ou modifié et sa sortie ; seuls les contenus explicitement revus comme publics sont admissibles. Une incertitude exclut le fichier du lot public.
3. Relire le diff et la liste de fichiers **staged**, pas seulement la copie visible. Exclure archives, bases, environnements, captures réelles, artefacts privés et code propriétaire.
4. Exécuter le garde de publication et les tests synthétiques publics. Tout nouveau chemin doit être ajouté intentionnellement à la liste publique après revue ; aucune autorisation par dossier entier ou wildcard.
5. Vérifier que les nouveaux commits n'importent pas l'historique privé. Si un fichier sensible a été ajouté puis supprimé avant publication, sa présence dans un commit intermédiaire reste une fuite : reconstruire le lot public à partir de l'historique public propre.
6. Publier un seul lot sur la base publique attendue, sans force. Conserver SHA, fichiers et résultat des contrôles. Les notes d'incident confidentielles restent privées.

Le garde automatique est une défense supplémentaire. Il ne peut pas reconnaître toute information confidentielle ni remplacer la revue du contenu. Les contrôles CI s'exécutent après l'envoi à GitHub : ils ne peuvent donc pas annuler une fuite déjà publiée. La vérification locale avant push reste obligatoire.

## 6. Si une fuite est soupçonnée

Arrêter les publications concernées et les transferts automatiques. Ne pas recopier le contenu suspect dans une issue publique. Prévenir le propriétaire par un canal privé ; révoquer/remplacer les identifiants exposés et retirer l'accès aux artefacts concernés. Une suppression au dernier commit ne retire ni l'historique, ni les caches, forks ou copies. Toute réécriture d'historique exige la procédure et l'autorisation adaptées ; ne pas la déclencher silencieusement.

## 7. Vérification et reprise

Au 24 octobre, le dépôt UTRAE public conserve déjà un guide de séparation et un contrôle de liste de fichiers. Les renforcer en réutilisant ce contrôle, sans recopier la source réelle. Le produit reste privé dans URAE ; le candidat applicatif en cours ne devient pas déployé du fait de cette modification de gouvernance.

À chaque reprise : lire cette règle, réutiliser le clone/cache local, retrouver la source et les preuves du dernier lot, puis reprendre uniquement le travail restant. L'interdiction de redémarrer le PC sans autorisation reste applicable. Consommation exacte de crédits non mesurable.
