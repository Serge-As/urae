# Mobile Shell — Capacitor lane

Le cœur métier ne dépend pas de cette couche.

Objectifs :
- Android/iOS enrichis lorsque les APIs navigateur ne suffisent pas ;
- Bluetooth/Wi-Fi Direct, tâches de fond et stockage sécurisé via plugins/adapters ;
- même bundle web et mêmes contrats de domaine ;
- aucune seconde logique financière dans le shell natif.

La génération initiale n'installe pas Capacitor car le registre npm n'était pas accessible. Codex devra ajouter le shell après validation des versions supportées et tester la Compatibility Lane Android ancien séparément.
