# ECO-SYSTEM — FIELD AUDIT 1.3.3 → 1.3.4

Date : 2026-09-17
Branche : `next/1.3.4-field-hardening-20260917`
Base : `1c15fcc0d85b5a88495558be7ad43e44f0ef024f`
Production observée au début de l'audit : `1.3.3-fairness-adops-doctor-launch`

## Règle de travail
Ce document transforme les preuves terrain du fondateur en défauts reproductibles. Les anciennes consignes restent des garde-fous constitutionnels : elles ne sont jamais une autorisation à régresser. Toute correction doit conserver les acquis 1.3.3, le Ledger D1 canonique, les 10 étapes, Collation, multi-tontines, Premium Live, Forum v2, Control Center, R2/BIR+ et `realMoneyEnabled=false`.

## A. Bloquants terrain immédiats

### A1 — Upload RI / documents — CONFIRMÉ / CAUSE TROUVÉE
Preuve terrain : `Action non terminée : JSON_REQUIRED` après sélection PDF/Word/image.
Cause : la route `/api/v1/assistant/group-launch/analyze-files` attend `multipart/form-data`, mais `authenticatedApi` rejetait toute écriture qui n'était pas `application/json` avant d'atteindre la route.
Correction 1.3.4 : multipart autorisé uniquement pour cette route, limite dédiée ~26 MiB, JSON reste obligatoire ailleurs.
Test permanent : session authentifiée + multipart texte → analyse 200 ; `text/plain` sur une route JSON → 415 `JSON_REQUIRED`.

### A2 — Dictée s'arrête après quelques mots — CONFIRMÉ
Cause UI : une instance SpeechRecognition non continue, un seul résultat, aucune relance automatique.
Correction cible : dictée continue/toggle démarrer-arrêter, accumulation des résultats finaux, relance automatique contrôlée si le navigateur coupe l'écoute, statut clair et fallback texte.

### A3 — Éditeur rubriques mobile inutilisable — CONFIRMÉ
Preuve : champs réduits à quelques caractères alors que l'écran conserve des zones vides.
Correction cible : éditeur mobile plein écran/pleine largeur, une seule colonne sous seuil, suppression des contraintes de grille imbriquées, barre d'actions collante, densité desktop mieux utilisée.

### A4 — « Autres » bloque malgré saisie — CONFIRMÉ
État actuel : un lot sélectionné échoue si l'une des lignes cochées reste à 0 ; le message ne dit pas laquelle. Les starters ne savent pas exprimer la politique Inscription ancien/nouveau ni une grille d'amendes.
Correction cible : validation ligne par ligne avec libellé, politique Inscription liée à la rubrique créée, grille d'amendes multi-règles, aucune obligation de remplir les lignes non sélectionnées.

### A5 — Tontine opérationnelle — CONFIRMÉ
Problèmes : montant du pot ambigu, ajout d'une part peut produire `COMPLETION_RECORD_NOT_FOUND`, absence de guidage si aucun cycle n'est choisi, confusion historique entre rubriques Tontine et « Autres ».
Correction cible : filtrage TONTINE uniquement, montant total du pot explicite et prérempli depuis la configuration, validation avant soumission, message « créez/sélectionnez d'abord un cycle », lien direct rubrique → cycle → parts → classement → pot.

### A6 — Simulation de prêt — RÉGRESSION CONFIRMÉE
État 1.3.3 : simulateur amortissable basé sur un taux annuel. Cela ne représente pas la pratique demandée à 5 % par période/mois avec intérêt calculé uniquement sur le capital restant et intérêt impayé non taxable.
Correction cible : moteur de simulation par période, modes CAPITAL_FIRST / INTEREST_FIRST, intérêts impayés séparés, aucun intérêt sur intérêt, remboursements partiels simulables mois par mois, prêts spéciaux et sanctions après durée maximale configurables. La page Finance devient configuration/simulation ; l'enregistrement réel se fait depuis la séance ou la fiche membre.

## B. Saisie séance et fiche individuelle

### B1 — Deux surfaces liées
Remplacer le langage `Cartes / Matrice` par deux outils métier :
- `Votre feuille de séance` : membres en lignes, rubriques en colonnes, cellules réellement éditables ;
- `Vos fiches individuelles` : un membre, toutes les séances de l'exercice en lignes, rubriques en colonnes, synthèse/cockpit.
Une saisie alimente le même service canonique et se reflète immédiatement dans l'autre vue.

### B2 — Navigation
Le nom du membre est le lien vers la fiche individuelle ; le titre séance/mois ramène à la feuille de séance. Les zéros/montants ne sont pas des liens de navigation. Chaque sous-écran a Retour/Fil d'Ariane.

### B3 — Fiche individuelle — modèle historique à préserver
Le classeur `Fiche Membre.xlsm` est la référence métier de départ : identité, année/statut d'adhésion, téléphone(s), adresse, photo, soldes d'ouverture, séances/mois, Secours, Transport, Épargne, Épargne scolaire, intérêts, Tontines multiples, Collation, Mains levées, Remboursements, intérêts de prêts, prêts spéciaux, Autres +/-, totaux, nature, observations et restes/carryover.
L'application l'enrichit avec : prêts/dettes, échéances, prochains pots, amendes, inscription/timbres, obligations, réserves, preuves, simulations et notifications.

### B4 — Multi-bureau temps réel
La couleur proposée par le fondateur est conservée comme provenance visuelle, mais elle n'est pas une autorisation. Modèle cible : saisie/draft par acteur + couleur/initiales + timestamp + version de base ; conflit visible si deux acteurs divergent ; validation/quorum selon la politique ; écriture canonique append-only seulement après validation requise. Accessibilité : couleur + icône/initiales, jamais couleur seule.

## C. Membres, identité et documents

### C1 — Onglet Membres
Dossier membre + rôles/habilitations + fiche individuelle + historique de groupe. Les champs du formulaire CERDAS servent de modèle extensible : identité légale, CNI, domicile/quartier, téléphone(s), profession, année d'adhésion, père/mère, conjoint, enfants, frères/sœurs, parrain/marraine, urgence, pièces et approbations.

### C2 — Formal identity gate
Pour créer/rejoindre Association ou Tontine rotative et pour faire du business : identité légale requise selon la politique plateforme ; pseudo reste nom d'affichage. CNI/numéro/nom doivent utiliser les garde-fous de stockage et rapprochement existants. Un numéro de téléphone est requis ; WhatsApp est une préférence/qualité de contact, pas une vérification inventée.

### C3 — Documents
Onglet `Documents` : RI, statuts, images, pièces, imports, version, empreinte, provenance, état d'analyse, liens aux règles/rubriques. L'upload peut aussi servir à une simple liste de rubriques et non uniquement au RI.

## D. Finance spécialisée

### D1 — Finances = configuration / supervision
Les cotisations réelles quittent la page générique Finance et se font sur feuille de séance ou fiche individuelle. Finance conserve paramétrage, simulation, réconciliation, règles Assistance, Épargne/Intérêts, Prêts/Intérêts et Ledger/audit.

### D2 — Navigation interne
Table des matières collante avec ancres : Vue d'ensemble, Prêts + Intérêts, Épargne + Intérêts, Assistances, Secours/Solidarité, Caisse, Ledger/Audit. Les gros titres sont des liens/ancres.

### D3 — Épargne + Intérêts
Ordre UX : totaux automatiques Épargne classique / scolaire / intérêts recouvrés → montant distribuable modifiable → clé de répartition XAF/% (classique, scolaire, Bureau, réserve) → périodes éligibles → choix de politique → coefficients éditables → tableau membres × séances/mois → comparaison pédagogique.

### D4 — Ledger
Renommer/expliciter pour l'utilisateur : `Journal financier / historique auditable`. `Contrepasser` devient `Annuler/corriger sans effacer l'historique`, avec explication. Le Ledger reste canonique en interne.

## E. Récapitulatif

### E1 — RECAP global définitif
Membres en lignes. Colonnes configurables positives (+) et négatives (-), total calculé. Couleurs métier : + jaune, - rose, total vert si >=0 / rouge si <0. Les données automatiques restent traçables ; une correction autorisée est un ajustement/override avec motif/auteur/date, jamais destruction silencieuse de la source.

### E2 — Colonnes manuelles
2–3 colonnes + et - optionnelles, renommables et supprimables en fin d'exercice.

### E3 — Backoffice/trésorerie
Inclure fonctionnement Bureau, indemnités/prélèvements, frais de gestion Épargne/Secours, projets générateurs de revenus, achats/déplacements/réunions Bureau, autres entrées/sorties. Toutes les rubriques alimentent le Récap ; le Récap ne devient pas un second Ledger.

## F. Navigation conditionnelle et groupes

Menus complexes dédiés : Tontines ; Épargne + Intérêts ; Prêts + Intérêts ; Assistances ; Autres rubriques ; Classements ; Membres ; Documents. Ils s'activent selon les rubriques réellement créées, sauf services de base. Une Tontine rotative ne voit pas Épargne/Prêts/Assistance si elle ne les a pas activés. L'app peut suggérer `Amendes` à la création d'une tontine rotative sans l'imposer.

## G. Liaison obligatoire

Nouvelle règle qualité : si deux objets métier sont annoncés comme liés, le lien est un contrat testable. Exemples : accueil → ma situation ; groupe → rubriques → menus ; séance ↔ fiche membre ; rubrique Tontine → cycle → part → classement → pot ; membre → identité → fiche → relevé → réserves ; documents → règles détectées ; chaque écriture → Récap. Un lien absent ou pointant vers le mauvais objet est un défaut de non-régression.

## H. IA visible

L'Assistant IA doit être visible et contextualisé : création/RI, configuration de rubrique, Group Doctor, Épargne/Fairness Lab, prêts, réunion, Récap, documents. Il suggère/explique/préremplit ; il n'écrit pas d'argent ni ne change une règle active sans validation humaine.

## I. Cockpit gestionnaire / « chambre noire »

À récupérer du Cahier historique sans le réduire : supervision du business du gestionnaire, groupes/cycles/parts, calendrier, capacité, encaissements/frais/marges, incidents, membres, relances, performances, documents, communication, rentabilité, risques et actions. Cette couche n'est visible qu'aux rôles habilités et ne remplace jamais le Ledger canonique ni le Control Center plateforme.

## Ordre de réparation 1.3.4
P0 : upload + voix + mobile + Autres + Tontine + simulation prêt.
P1 : double feuille de saisie + fiche membre + liaison Live + prêt réel depuis fiche/séance.
P1 : menus conditionnels + Membres + Documents + IA visible + identité formelle.
P1 : Épargne/Intérêts pédagogique + Récap global/trésorerie.
P2 : cockpit gestionnaire, classements, approfondissements Forum/Live/AdOps déjà acquis sans régression.

## Definition of Done terrain
Un élément n'est pas `FIELD_ACCEPTED` parce que la CI est verte. Il faut : test automatique + build + parcours desktop + parcours téléphone + absence de régression + preuve de persistance + autorisations correctes + synchronisation si concernée + message compréhensible en cas d'erreur + sauvegarde BIR+ avant production.
