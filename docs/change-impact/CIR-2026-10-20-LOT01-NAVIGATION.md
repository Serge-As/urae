# CIR — Lot 01 : navigation et cohérence visuelle

## Autorisation et référence

Le 20 octobre 2026, le fondateur demande explicitement : « Implémente et déploie le lot 1. Dès que tu termines enchaînes avec la suite jusqu’à ce que le crédit s’épuise ». Cet accord couvre la réalisation et la publication du lot décrit dans le dossier des 92 propositions gratuites. Aucun abonnement, ajout de serveur ou changement de moteur financier n’est nécessaire.

Référence distante observée : branche de livraison fix/1.5.2.10-offline-conflicts-loans-20261003, tête 5cba15abc3e5d61f2ad35d40fefb5d320e3f28d2. Dernière livraison attestée avant travail : 5e7044e / 1.5.2.19. Copie isolée issue de l’archive GitHub de ce SHA, hash vérifié, puis delta documentaire 5cba15a repris. Le commit local d’import sert au diff local ; il ne représente pas un nouveau déploiement.

## Bénéfice, solution et propriétaire

Rendre les fonctions existantes faciles à retrouver sans changer leurs parcours. Nouveau composant de présentation shell-navigation : contexte personnel/groupe/écran, menu complet, recherche FR/EN locale, favoris locaux séparés par compte/groupe, accès clavier et reprise de la feuille quittée. Chaque destination clique le bouton canonique mainNav : pas de deuxième routeur, de commande financière ni de moteur métier.

Fichiers : nouveau composant, raccords bornés dans main.js, styles ciblés, contrat de version/PWA et preuves. Réutilisation du mode UI existant ; aucune nouvelle bibliothèque. Les favoris stockent seulement identifiant de destination et date, maximum huit, expiration trente jours. La reprise de saisie reste en mémoire de fenêtre ; elle ne prétend pas synchroniser les appareils.

## Conséquences indirectes et protection

- Ouverture de dialogue : risque de perte de focus ou de première frappe ; fermer restitue le champ existant, sans reconstruire la feuille. Tester brouillon et présence.
- Droits et changement de groupe : risque de raccourci ancien ; relire les boutons actuels à l’activation, isoler les favoris, supprimer le contexte visible à la déconnexion. Serveur toujours autoritaire.
- Petit écran et zoom : risque de masquer une action ; menu dimensionné au viewport, accès clavier et tests 360/768/1366 pixels. Styles du composant seulement, tokens financiers inchangés.
- Import statique : nouveau fichier nécessaire à la PWA ; fermeture transitive du shell et nouvelle identité de cache obligatoires. Préserver les caches de récupération et les données locales.
- Coûts : pas de lecture réseau à chaque caractère ; index de navigation en mémoire. Aucun polling ni nouvel endpoint.
- Reprise : seules références de navigation sont transmises ; aucun montant ne réside dans le composant. Préserver les brouillons canoniques et vérifier le focus.

## Recette et retour arrière

Tests de recherche multilingue et favoris avec séparation A/B, expiration et stockage refusé. Navigateur synthétique : clavier, favori, compte/groupe, trois densités, largeur et zoom, champs conservés et reprise. Suites financières, conflits, hors ligne et PWA existantes conservées. Qualification du candidat intégré exact avant publication, puis health/catalogue et empreintes des ressources publiques.

Aucune migration D1/R2, purge, activation d’argent réel ou rotation de clé. Retrait du raccord du composant et retour à une livraison cohérente possible ; les anciennes routes et boutons demeurent disponibles. La nouvelle préférence locale n’a pas d’effet comptable. FIELD_ACCEPTED reste NOT_ACCEPTED tant qu’aucune recette terrain n’est attestée.

État initial : implémentation et qualification en cours. Aucun succès applicatif ni déploiement nouveau annoncé à ce stade.
