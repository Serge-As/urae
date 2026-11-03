# Recall — rafraîchissement, hors ligne et retour réseau

Le 3 novembre 2026, le fondateur demande une correction ciblée des rafraîchissements PC/téléphone et une reprise automatique sobre. Continuer les propriétaires existants, sans purger les données ni contourner l'isolation des fenêtres ou les quotas.

La proposition jointe décrit la version 43 et promet 0,08 seconde, exactement deux requêtes et une division par vingt sans mesure. Le diagnostic courant confirme le lien fragile window.name/sessionStorage, les lectures secondaires nombreuses, et ajoute le délai HTTP qui ne couvrait pas le corps JSON. Le blocage D1 exige déjà un signal explicite : une erreur 503 ordinaire n'entraîne pas à elle seule ce verrou durable.

Ne pas adopter session:last comme secours entre fenêtres, ni fusionner les intentions financières, ni considérer une révision de cache comme une preuve d'autorisation. Ne pas déclarer quatre fichiers suffisants quand le graphe des imports en exige davantage. La fermeture du graphe et les empreintes restent obligatoires.

Tests de comportement ajoutés : restauration locale sans HTTP, identité effacée/dupliquée, provenance de session, JSON bloqué/invalide, quota conservé, compte local non finalisé, réveils regroupés, installation PWA interrompue et corruption ; parcours PC/360 px avec F5 hors ligne, validation financière et reprise automatique. Les traces négatives de préparation Windows restent locales. Qualification Linux complète et production doivent encore être prouvées pour le nouveau SHA.

Références : `docs/change-impact/CIR-2026-11-03-REFRESH-OFFLINE.md`, `docs/implementation/REFRESH_OFFLINE_2026_11_03.md`. Argent réel désactivé, acceptation terrain distincte.

Suivi : le premier test de panne réelle a déclenché F5 à la peinture optimiste, avant la confirmation durable ; la recette attend maintenant QUEUED_OFFLINE pour exiger une intention restaurée, et vérifie par ailleurs le brouillon. La file n'est pas effacée. Les projections locales en attente sont installées avant les cellules membres/séances. Les 1 138 tests natifs et les trois nouveaux parcours Windows Chromium ont passé sans relance de test. Les délais d'attente d'affichage ne sont pas des promesses de performance.

L'émulation Playwright/WebKit de coupure ne convient pas aux navigations SW ; utiliser le relais de panne réelle déjà limité au serveur synthétique. Préserver les échecs 41645484193/41645484300 et 41660119895. Ce dernier arrêt vient de l'absence du CIR/Recall dans le commit de suivi ; ne pas contourner le garde de mémoire. Relancer et prouver le dernier SHA avant de déclarer la livraison.
