# Eco Relay — décision diffusion de masse en réunion

## UX seniors
Conserver **deux actions distinctes**, présentées comme deux étapes numérotées dans un même bloc de fin de séance :
1. **Confronter les données entre gestionnaires** — avant clôture/diffusion; échange uniquement des deltas/empreintes nécessaires, puis divergences.
2. **Diffuser aux membres** — seulement après consensus; produit des projections privées destinées aux membres.
Un seul bouton ambigu risquerait de diffuser avant accord. La proximité visuelle des deux étapes garde néanmoins le parcours simple.

## Sans intervention des deux utilisateurs ?
Une PWA Web pure ne doit pas promettre une découverte/transmission arbitraire silencieuse à un autre téléphone : permissions, découverte et sécurité des OS imposent généralement une action/appairage initial. Après **un appairage volontaire** et pendant une session locale déjà établie, Eco-System peut automatiser les échanges suivants tant que la plateforme laisse le canal actif. Pour une expérience réellement “appareils reconnus qui se synchronisent seuls à proximité”, prévoir une couche native Android+iOS optionnelle et tester les contraintes d'arrière-plan.

## Diffuser à 80 membres
Ne pas faire scanner 80 personnes devant le gestionnaire. Architecture cible par ordre :

### A. Internet disponible — multicast logique serveur
Le gestionnaire appuie une fois **Diffuser aux membres**. Le serveur publie 80 projections/notifications privées; chaque appareil connecté reçoit sa propre donnée. C'est le meilleur équivalent d'Internet.

### B. Pas d'Internet — réseau local de séance
Créer un **Meeting Hub local** : hotspot/Wi-Fi local ou routeur de salle. Les membres rejoignent une fois le réseau/session (QR d'entrée affiché/projeté). Ensuite le gestionnaire appuie une fois Diffuser; les 80 clients déjà appairés récupèrent leur enveloppe privée. La PWA peut utiliser WebRTC DataChannels pour pairs compatibles, mais la signalisation/découverte doit être organisée et la montée à 80 pairs ne doit pas reposer sur 80 connexions directes depuis un seul téléphone.

### C. Optimisation recommandée — hub/relay de salle
Pour 80 personnes, éviter une étoile 1→80 depuis le téléphone du président. Utiliser un **hub local** (petit routeur/hotspot + service local/native relay ou plusieurs relais de confiance) qui distribue les enveloppes. Le président envoie une fois le bundle/manifeste au hub; les membres récupèrent en parallèle. Chaque enveloppe reste scoped/chiffrée pour son membre.

### D. QR collectif
Un QR collectif est excellent pour **rejoindre la session**, obtenir le manifeste/identifiant/clé publique ou une petite information commune. Il est mauvais comme support de 80 relevés privés complets : taille, confidentialité et scan individuel. L'afficher sur écran/projecteur permet néanmoins à plusieurs membres de scanner simultanément, mais chaque membre doit encore scanner.

### E. Bluetooth
Ne pas utiliser Bluetooth PWA comme diffusion principale 1→80. Compatibilité iOS Web Bluetooth insuffisante et gestion de masse complexe. Une future couche native peut exploiter les mécanismes de proximité OS, mais reste PILOT.

## Modèle optimal retenu
- **QR = appairage/entrée de session et secours.**
- **Wi-Fi local = autoroute de salle.**
- **Meeting Hub = facteur local qui évite 80 connexions lourdes au président.**
- **Enveloppes destinataire = confidentialité.**
- **Internet = accélérateur, pas obligation.**
- **Eco Relay Bundle = format commun quel que soit le transport.**

## Sécurité
Le hub n'obtient pas automatiquement les droits métier. Les données privées sont enveloppées par destinataire; bundleId/opérationId anti-rejeu/idempotence; accusés par membre; reprise partielle si 63/80 ont reçu; les 17 autres peuvent récupérer plus tard par hub, QR ciblé, fichier ou Internet. Ne jamais marquer “80 reçus” sans 80 accusés vérifiables.
