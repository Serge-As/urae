# ECO-SYSTEM — CURRENT TRUTH · CORRECTIONS TERRAIN 1.4.5.1

Date : 2026-09-22  
Branche : `fix/1.4.5.1-field-corrections-20260922`  
Base : `next/1.4.5-final-mega-offline-governance-20260921`  
Nature : lot additif, aucune réécriture du Ledger canonique, aucune migration destructive.

## Demandes terrain intégrées

### Feuilles financières
- Le style de saisie directe par cellule est le standard des feuilles éditables : valeur actuelle, champ de nouvelle valeur, bouton ✓.
- Une correction saisit une **nouvelle valeur totale**. Elle ne s'ajoute jamais au montant précédent.
- Exemple verrouillé par test multi-gestionnaires : 1 000 → 500 produit 500, jamais 1 500.
- Une correction d'une valeur existante demande un motif et passe par la confrontation multi-gestionnaires lorsque nécessaire.

### Historiques
- Relevé membre enrichi : séance, rubrique, montant, montant net, nature, date/heure, auteur, corrections et motifs.
- Historique de séance enrichi : membre, rubrique, montant, montant net, nature, date/heure, auteur, motif.
- Les éléments sont regroupés pour éviter une liste illisible de lignes techniques.

### Prêts et situation membre
- Une rubrique Prêt est une position négative / dette, jamais une cotisation positive.
- Les cotisations nettes excluent explicitement les rubriques de prêt, même pour des données historiques enregistrées avant la nomenclature OUTFLOW.
- Le capital de prêt, les intérêts dus et la dette totale sont affichés séparément.
- Un prêt seulement APPROUVÉ n'est pas encore une dette du membre ; la dette commence au décaissement.
- Le moteur d'intérêts conserve les intérêts impayés séparément et ne calcule jamais d'intérêt sur intérêt.
- La fréquence du prêt est explicite via `Périodes / an`; le taux par période est dérivé du taux annuel et conservé dans le prêt.
- À la clôture d'une séance, l'intérêt de la période est calculé sur le capital restant si le prêt est actif.
- Membre et gestionnaire disposent d'une simulation d'évolution : capital, intérêts déjà dus, périodes, taux par période, priorité d'imputation, remboursements prévus, capital restant, intérêts restants et dette totale.
- Pour un prêt canonique, le simulateur affiche aussi l'évolution réelle déjà enregistrée.

### Membres
- Le bouton de corbeille a été retiré de chaque ligne membre.
- Zone de gestion dédiée près de l'ajout membre : classement chronologique / nom / rôle, modification du nom avec motif, suppression vers corbeille.
- La modification du nom est auditée et notifiée.

### Multi-gestionnaires
- Une correction d'une cellule déjà renseignée n'écrase plus silencieusement la vérité canonique lorsqu'une confrontation est requise.
- La notification contient le membre, la rubrique, la séance/date, ancienne valeur, nouvelle valeur, auteur, heure de modification et motif.
- L'action de notification renvoie vers la cellule concernée.
- Ajout/modification/suppression de membres et rubriques continue d'utiliser les notifications de gouvernance.

### Séance sélectionnée
- Depuis le menu Séances, « Saisir / corriger cette séance dans la feuille canonique » transmet explicitement l'identifiant de la séance sélectionnée.
- Boutons voisins : choisir une autre séance et créer une nouvelle séance.

### Alertes membre
- Une saisie financière pendant une séance ouverte peut produire l'alerte visible de niveau ouvert.
- Une correction importante est distinguée.
- Une modification après clôture est de niveau critique et visible comme telle.
- Le membre peut valider la transaction ou émettre une réserve selon le flux de contrôle membre existant.

### Corbeille
- Membres, séances et rubriques : restauration intégrale pendant 6 mois.
- Après expiration, le snapshot opérationnel restaurable est supprimé ; la preuve d'audit reste conservée.
- Aucune commande d'effacement définitif manuel n'est exposée.
- Groupe : même rétention de 6 mois, restauration intégrale, rappel mensuel au fondateur et au gestionnaire ayant placé le groupe dans la corbeille.
- Le rappel mensuel peut être désactivé.
- Les rappels arrivés à échéance sont traités au prochain démarrage en ligne, y compris lorsque le groupe supprimé n'est plus actif.

### Finances avancées
- Le bloc est présenté comme un ensemble d'outils complémentaires et non comme une seconde feuille de saisie :
  - Prêts + Intérêts : capital, intérêts, remboursements, échéances.
  - Impayés / Dettes : obligations attendues non réglées.
  - Épargne : plans et mouvements d'épargne.
  - Caisse : solde d'ouverture et détenteurs/contenants.
  - Assistances : solidarité/secours.
  - Contrôles avancés : rapprochement, anomalies et simulations.
- Les cotisations courantes restent saisies dans les feuilles canoniques.

## Premier compte sans session Internet antérieure
- Le compte initial peut être créé localement sans aucune session serveur antérieure.
- Authentification locale : IndexedDB + vérificateur PBKDF2 salé ; aucun mot de passe en clair.
- État `LOCAL_PENDING_REGISTRATION`, groupes et saisies locales, Outbox durable.
- Quand Internet devient disponible, `claimLocalAccount` rattache l'identité serveur, migre snapshots/outbox puis synchronise.
- Limite physique conservée : un navigateur ne peut pas télécharger l'application depuis `workers.dev` s'il n'a jamais reçu les fichiers de l'application. Pour un téléphone réellement sans Internet depuis l'origine, Eco-System doit donc avoir été préinstallé ou transféré localement (futur paquet Android/offline/Eco Relay). Cette limite n'est plus une dépendance à une ancienne session utilisateur.

## Incident observé sur capture : UI_ELEMENT_NOT_FOUND:#claimLocalAccountBtn
Cause confirmée : désynchronisation de versions PWA. Un ancien HTML (capture affichant 1.3.4) était servi depuis le cache tandis qu'un JavaScript plus récent attendait le bouton `#claimLocalAccountBtn`.

Correction :
- contrôle rendu tolérant à l'absence de l'élément dans un ancien shell ;
- cache isolé `eco-system-v1451-field-corrections-20260922` ;
- navigation en ligne privilégie le shell HTML frais avec timeout court puis fallback offline ;
- paramètres d'assets passés à `v=1451`.
Ainsi un ancien HTML ne doit plus casser le démarrage avec un nouveau JavaScript.

## iPhone / iPad
- Métadonnées Home Screen, mode standalone, stockage persistant opportuniste et tests iOS automatisés présents.
- Aucune recette physique iPhone/iPad n'est déclarée : elle reste à faire dès qu'un appareil est disponible.
- Aucun résultat de test physique iOS ne doit être inventé.

## Garde-fous inchangés
- Ledger canonique unique et append-only.
- Corrections financières par contrepassation/compensation.
- Pas d'intérêt sur intérêt.
- Pas de cotisation nominale globale réintroduite.
- Tontines multi-rubriques et participations indépendantes conservées.
- Parcours création 10 étapes conservé.
- Pas d'argent réel activé.
- Pas de migration destructive.
- Pas de force-push.

## Qualification attendue avant production
1. `npm run ci` vert.
2. PR vers `next/1.4.5-final-mega-offline-governance-20260921`.
3. BIR+ pré-déploiement.
4. Déploiement Worker/PWA 1.4.5.1.
5. Smoke : /health, HTML 1.4.5.1, main v1451, cache 1.4.5.1, modules offline/account/loan.
6. BIR+ post-déploiement.
7. Recette terrain Android ancien/récent ; iOS physique dès appareil disponible.

## Point de reprise
Toujours reprendre le HEAD distant le plus récent de `fix/1.4.5.1-field-corrections-20260922` tant que la PR n'est pas fusionnée. Après fusion/déploiement, reprendre la base promue et le dernier BIR+ post-déploiement.
