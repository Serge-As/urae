# ECO-SYSTEM — Refonte visuelle et cockpits média (lot 1)
Date : 11 octobre 2026. Statut : IMPLEMENTED_PARTIAL / NOT_CI_QUALIFIED / NOT_DEPLOYED.
Base code : a7c333699dad0d70cf0de8e2f8a841a00396d0d7 ; branche privée feat/visual-refonte-smartgrid-media-20261011.

## Sources, priorité et non-régression
1. L'application et ses owners canoniques réels ; 2. Vision stratégique 8 et 9 octobre 2026 ; 3. Blueprint exécutable 5.0.0 ; 4. Cahier exhaustif 2.3.4 et son modèle économique 3.2.0 ; 5. Cartographie historique des 155 FOUNDATION_ACTIVE ; 6. dossier originel et archives en complément. Les anciennes propositions ne remplacent pas les parcours acquis.
Ne pas modifier Ledger, règles métier, Recap, rôles/permissions, toutes les 10 étapes de création, réserve/confrontation, appariement, offline/outbox, fournisseurs, adhésion ou APIs financières. Ne pas publier sur UTRAE ; ne pas déployer ni toucher à D1/R2 prod tant que HOLD n'est pas levé.

## Lot déjà codé
- Helper purement visuel splitFinancialRubrics() dans apps/web/src/smart-grid-view.js.
- Boutons Vue intégrale / 2 parties / 5 parties dans le renderer financier canonique de main.js.
- Les cellules visibles continuent de passer par makeFinancialEntryCell, avec exactement le même owner, les mêmes permissions et l'éditeur ✓ ; toutes les colonnes sont conservées dans la projection intégrale et tous les totaux globaux utilisent les rubriques complètes.
- Mémorisation locale éphémère du choix par mode (meeting / individual), sans transaction ni migration.
- Styles isolés, responsive, utilisant exclusivement les tokens visuels existants.
- Test des partitions et de la conservation des totaux ajouté au dépôt. Exécution ciblée locale du helper avec 3/3 PASS avant commit ; la qualification CI de la branche complète reste À FAIRE.

## Cockpits médias / annonces — décisions de raccordement impératives
### Canon existant
- AdManager propriétaire unique des campagnes, placements et modération ; le formulaire existant crée des campagnes texte sandbox sans débit réel.
- Les profils de groupe, de membre et de responsable ont leurs autorités existantes ; ne pas accrocher un stockage publicitaire au Ledger.
- Le stockage binaire existant R2 ArtifactStore sert déjà aux pièces de séance et au lancement des documents ; ne jamais réutiliser un endpoint de preuve pour afficher des portraits publics.

### Capacité exigée (pas encore codée dans ce lot)
- Studio propriétaire central dans Control Center : bibliothèque de médias substituables, emplacement de la bannière d'accueil, couvertures pour Market, Forum, groupe, association, portraits consentis ; bouton télécharger/prévisualiser/remplacer/retirer ; langue FR/EN ; version mobile/desktop ; alternative faible-data ; limite poids, extension, recadrage, attribution/droits, modération.
- Un acteur autorisé peut importer une photo de profil personnelle ou une image de son propre groupe; les partenaires et annonceurs ont un cockpit média limité à leurs biens, campagnes et mandats, jamais celui d'un tiers.
- Implémenter route(s) dédiées upload/lecture de l'image, authentification et autorisation vérifiées côté API; isoler tenant et groupId, restreindre MIME réel, rejeter SVG actif, limites taille, défense CSRF et quotas, métadonnées audit, remplacement versionné, suppression gouvernée, droits de distribution publique explicites; objet privé par défaut dans R2 existant.
- Les créations AdManager référencent un mediaId opaque validé et jamais une URL arbitraire ni une clé R2 exposée. Validation et rendu autorisés distincts; fallback image par défaut si aucune image, révocation de diffusion si refus; aucun débit réel.
- Rendre la galerie effectivement utilisable depuis les interfaces. Ne jamais présenter un upload fictif ou un bouton inerte comme fonctionnel.
- Table des dépendances obligatoire : group-identity, member-profile, ads, market, community, R2, offline, PWA cache, i18n, privacy, auth; qualification croisée avant livraison.

## Gates futurs
1. Memory Recall et CIR du lot média complet ; 2. tests TypeScript, Node, UI et API upload/lecture/refus/tenant ; 3. vraie recette mobile 320/360/390, WebKit 6/6 et Chromium, réseau dégradé, ancien Android ; 4. tests financiers historiques et Récap ; 5. backup BIR+ ; 6. deployment explicitement autorisé et smoke SHA exact ; 7. recette terrain.
HOLD actuel de la candidate 1.5.2.15 reste en place et est indépendant de ce chantier.
