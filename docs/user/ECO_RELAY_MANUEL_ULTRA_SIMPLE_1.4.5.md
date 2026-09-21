# Eco Relay — manuel ultra-simple des 6 moyens de partage

Version de travail 1.4.5 — Android + iPhone/iPad. Règle : l'utilisateur choisit d'abord **Partager** ou **Recevoir** ; Eco-System s'occupe du paquet. Les moyens indisponibles sur l'appareil sont masqués ou signalés sans bloquer les autres.

## 1. QR Code — le plus simple pour les petits échanges
**Quand ?** Deux personnes sont au même endroit : réunion, président/trésorier, gestionnaire/membre, accusé de réception.

**Envoyer :**
1. Ouvrir Eco-System.
2. Appuyer **Partager via QR Code**.
3. Choisir ce qui doit être partagé (séance/consensus/données autorisées) lorsque le sélecteur métier sera branché.
4. Eco-System prépare le paquet et affiche le QR.
5. Si plusieurs QR sont nécessaires, l'écran indique 1/N, 2/N…
6. Garder l'écran face au téléphone qui reçoit jusqu'à confirmation.

**Recevoir :**
1. Appuyer **Recevoir par QR Code**.
2. Appuyer **Scanner avec la caméra**.
3. Autoriser la caméra si iOS/Android le demande.
4. Viser le QR.
5. Eco-System vérifie fragments, checksum, expiration, destinataire et droits avant import métier.
6. Si le scanner Web n'existe pas sur ce navigateur, utiliser le partage natif/fichier ou le collage de secours.

**Internet ?** Non. **À activer dans le téléphone ?** Rien sauf caméra. **Idéal pour :** quelques événements/deltas, confirmations et consensus.

## 2. Partage natif Android/iOS — très facile
**Quand ?** Le paquet est plus gros ou l'utilisateur préfère le menu habituel du téléphone.

**Envoyer :**
1. Dans l'écran Partager, appuyer **Autres moyens de partage**.
2. Android/iPhone ouvre sa feuille de partage si disponible.
3. Choisir une destination proposée par le téléphone.
4. Le système d'exploitation effectue le transport disponible.

**Recevoir :** ouvrir le paquet reçu avec Eco-System/import lorsque l'intégration Share Target/ouvrir-avec est disponible ; sinon enregistrer le fichier puis utiliser Importer.

**Internet ?** Cela dépend de la destination choisie. Le partage local proposé par l'OS peut ne pas nécessiter Internet. **Activation :** aucune dans Eco-System ; le menu est celui du téléphone.

## 3. Fichier Eco Relay — secours universel
**Quand ?** QR trop volumineux, scanner indisponible, vieux téléphone, transfert par câble/clé/stockage local.

**Envoyer :**
1. Partager.
2. Choisir **Exporter un fichier** (le fallback actuel télécharge déjà le paquet lorsque le partage natif manque).
3. Le fichier reste sur le téléphone.
4. Le transférer par le moyen disponible.

**Recevoir :**
1. Recevoir.
2. **Importer un fichier**.
3. Choisir le fichier.
4. Eco-System vérifie intégrité, expiration, identité et droits avant application.

**Internet ?** Non. **Activation :** accès aux fichiers uniquement. **Avantage :** robuste. **Inconvénient :** moins intuitif que QR.

## 4. Wi‑Fi local / hotspot + WebRTC — rapide pour gros paquets
**Quand ?** Plusieurs données, appareils proches, pas d'Internet.

**Principe enfant :** un téléphone crée une petite route Wi‑Fi ; l'autre monte sur cette route ; les deux Eco-System se parlent directement.

**Parcours cible :**
1. A active son point d'accès Wi‑Fi/hotspot si nécessaire.
2. B rejoint ce Wi‑Fi.
3. Eco-System A choisit **Téléphone à proximité**.
4. Appairage par petit QR pour éviter de taper des codes.
5. Le canal local chiffré est établi.
6. Le paquet part directement.
7. B confirme réception.

**Internet ?** Non si la connexion locale peut être établie. **Activation :** Wi‑Fi/hotspot. WebRTC reste PILOT et doit conserver le fallback QR/fichier.

## 5. Bluetooth / proximité — complément
**Quand ?** Deux téléphones proches et l'OS propose un transfert local compatible.

**Parcours :**
1. Activer Bluetooth sur les deux téléphones si le système le demande.
2. Eco-System > Partager > partage/proximité.
3. Choisir l'autre appareil dans les options proposées par Android/iOS ou une future couche native.
4. Accepter sur l'autre téléphone.
5. Eco-System importe et vérifie le paquet.

**Internet ?** Non. **Important :** la PWA ne dépend jamais exclusivement de Web Bluetooth ; les possibilités diffèrent entre Android, iOS et versions de navigateur. Si absent : QR/fichier/Wi‑Fi.

## 6. Téléphone relais connecté — pour atteindre le serveur
Exemple : Président A sans Internet, Paul B avec Internet.

**Aller :**
1. A prépare ses données.
2. A transmet le paquet à B par moyen 1, 2, 3, 4 ou 5.
3. B est marqué RELAY_ONLY : il transporte, il ne devient pas auteur.
4. Quand B a Internet, Eco-System envoie le paquet au serveur.
5. Le serveur vérifie auteur, droits, anti-replay/idempotence et renvoie reçu + deltas autorisés.

**Retour vers A :**
6. B retrouve A.
7. B transmet le reçu/deltas à A, encore par QR, partage natif, fichier, Wi‑Fi local ou Bluetooth/proximité.
8. A importe.
9. Son Eco-System marque les événements confirmés et applique seulement les deltas autorisés.

**Donc “serveur → Paul → Président” n'est pas un moyen unique.** Internet sert seulement entre Paul et le serveur ; entre Paul et le Président, Eco-System choisit l'un des cinq transports locaux.

## Ordre recommandé dans l'interface
1. **QR Code — Recommandé** : simple, visuel, sans réglage.
2. **Téléphone à proximité — Rapide** : Wi‑Fi local/WebRTC lorsque qualifié.
3. **Partage du téléphone** : feuille Android/iOS.
4. **Exporter / importer un fichier** : secours fiable.
5. **Bluetooth/proximité** : quand l'OS/couche native le permet.
6. **Relais Internet** : rôle automatique d'un téléphone transporteur, pas un format de transport local.

## Sécurité / mémoire
- paquet chiffré lorsqu'il contient des données privées ; contrôle d'intégrité obligatoire ;
- identifiant unique/idempotence : retransmettre n'ajoute pas deux fois une cotisation ;
- scope destinataire : un membre ne reçoit/déchiffre que ses données autorisées ;
- RELAY_ONLY ne donne aucun droit métier ;
- paquet relais supprimable après accusé durable ; la transaction originale reste dans l'Outbox/Ledger local ;
- limites de taille et purge du cache Relay ; pièces lourdes non répliquées inutilement ;
- aucun import financier silencieux : contrôle de droits/conflits puis écriture append-only.

## Bouton Retour
Règle UX 1.4.5 : **Retour** doit revenir à l'écran précédent de l'application et restaurer sa position verticale. Les navigations internes alimentent une pile locale ; le bouton navigateur/système est aussi écouté. Sur petit écran, Retour reste flottant et respecte les safe areas iPhone. Les dialogues conservent leur propre bouton Fermer.
