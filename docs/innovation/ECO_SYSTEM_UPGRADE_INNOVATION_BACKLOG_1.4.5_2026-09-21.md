# Eco-System — Upgrade & Innovation Backlog 1.4.5+

Date: 2026-09-21. Principe: aucune innovation ne remplace un acquis; rollout additif, feature flags, tests terrain, argent réel OFF jusqu'à acceptation.

## ADOPT_NOW — valeur forte / risque maîtrisable
1. **Offline Autonomy Score**: écran par groupe indiquant shell, identité locale, membres/rubriques, séances, ledger local, pièces et dernière synchro. L'utilisateur sait AVANT de partir en zone blanche si son groupe est prêt.
2. **Mode Réunion**: gros boutons, saisie membres×rubriques, autosave local, couleurs gestionnaires, rapprochement QR, divergences seulement, consensus, réserves, clôture et diffusion privée.
3. **Eco Relay Smart Share**: QR recommandé pour petit delta; proximité/Wi-Fi pour gros volume; feuille de partage OS; fichier universel; téléphone RELAY_ONLY; estimation taille/temps avant transfert.
4. **Retour exact / Reprendre où j'étais**: view + scroll + onglet + sélection + brouillon non sensible. Jamais mot de passe/PIN/token en persistance UI.
5. **Centre de synchronisation**: À envoyer / Confirmé / Conflit / Rejeté / À relayer, dernière synchro, bouton Réessayer, explication humaine.
6. **Mode faible mémoire/faible data**: miniatures, compression images, chargement progressif, quotas locaux, purge sûre des bundles confirmés.
7. **Coffre de pièces offline**: RI/photos/reçus préparés localement, hashés, upload R2 différé, aucune perte si fermeture.
8. **Détection doublon avant argent**: opérationId + idempotency + montant/membre/rubrique/séance; alerte avant création d'un doublon probable.
9. **Journal compréhensible**: “qui a fait quoi, quand, sur quel téléphone, confirmé quand”, avec vue simple et vue audit.
10. **Pré-vol de séance**: batterie, espace local, groupe chargé, membres/rubriques disponibles, horloge, état offline, file en attente, clés Relay prêtes.
11. **Accessibilité seniors**: mode Ultra Simple renforcé, 48px+, contraste, libellés explicites, confirmation vocale optionnelle, éviter gestes cachés.
12. **iOS/Android par capacités**: feature detection; aucune fonction métier centrale dépend exclusivement de Background Sync, Bluetooth, BarcodeDetector ou partage natif.

## PILOT — innovations différenciantes à tester
13. **QR Consensus Circle**: chaque gestionnaire confronte son delta au consensus; l'écran n'affiche que les divergences; validation signée; réserve non bloquante.
14. **QR privé collectif**: un manifeste commun contient des enveloppes destinataire; chaque membre n'ouvre que son scope autorisé.
15. **Sync Mule / téléphone facteur**: un membre connecté transporte les paquets sans devenir auteur ni obtenir les droits métier.
16. **Wi-Fi/hotspot P2P + WebRTC**: appairage par QR, transfert local chiffré des bundles volumineux, fallback fichier.
17. **CRDT limité**: notes de réunion, brouillons, commentaires collaboratifs; interdit pour fusion automatique de montants financiers.
18. **Meeting Autopilot offline**: checklist intelligente basée sur RI/politiques déjà locales; rappelle rubriques manquantes et anomalies sans inventer de décision.
19. **Proof-of-presence optionnel**: QR de séance à durée courte pour attester présence; pas de géolocalisation obligatoire.
20. **Passage de relais président/trésorier**: transfert contrôlé d'un dossier de séance avec accusé et reprise, sans partager tout le compte.
21. **Time Capsule de séance**: snapshot compact signé avant clôture + après clôture pour comparaison/récupération.
22. **Anomaly Radar local**: détecte montant inhabituel, double saisie, membre absent, rubrique incohérente, sans bloquer arbitrairement.
23. **Simulation “Et si ?” locale**: tester une règle, un taux, une répartition sans toucher au Ledger; promotion explicite seulement après décision.
24. **Mode projecteur/réunion**: écran collectif anonymisable montrant progression et divergences, jamais les données privées inutiles.

## WATCH — prometteur mais ne doit pas bloquer le produit
25. Bluetooth/Web Bluetooth direct selon compatibilité réelle.
26. TWA ou coque native légère pour capacités Android avancées; conserver la PWA comme base.
27. Couche native iOS/Android si Nearby/Bluetooth/caméra/partage exige une fiabilité impossible en PWA seule.
28. IA locale/on-device pour OCR/RI quand performances, taille et compatibilité sont acceptables; sinon traitement différé connecté.

## Architecture serveur à faire évoluer sans régression
- Durable Object par partition/groupe pour coordination live; SQLite DO pour état coordonné durable et transactions.
- D1 reste projection/recherche/reporting/récupération; ne pas créer deux autorités financières concurrentes.
- Ledger financier append-only reste canonique; rectification/compensation liées.
- R2/BIR+ pour pièces et sauvegardes; intégrer PITR DO dans procédure de récupération.
- Un `operation_id` traverse local event → outbox → relay → Worker → DO/Ledger → D1 projection → ack.
- Outbox: backoff + max retry + dead-letter/quarantaine visible, jamais suppression silencieuse.

## Innovations “hors du commun” à forte identité Eco-System
- **Association sans réseau pendant plusieurs jours** puis convergence contrôlée.
- **Internet humain**: les téléphones transportent des deltas chiffrés entre zones blanches et zones connectées.
- **Consensus physique-numérique**: rapprochement de plusieurs gestionnaires par QR dans la salle.
- **Confidentialité par enveloppe**: même diffusion physique, contenu différent selon la clé du destinataire.
- **Resilience Drill**: bouton test avant réunion qui simule coupure Internet/reboot et confirme que le groupe est réellement prêt hors ligne.
- **Recovery Map**: montre quelles copies durables existent (appareil, serveur, projection, backup) sans exposer les données.

## Ordre de réalisation
A. finir Local Data Engine + identité offline; B. généraliser mutations/outbox; C. ledger pending + conflits; D. centre sync; E. vrai QR standard + caméra/fichier; F. consensus QR; G. scopes/chiffrement destinataire; H. RELAY_ONLY; I. Wi-Fi/WebRTC; J. tests terrain Android+iOS+anciens appareils; K. seulement ensuite production.
