## Mise à jour production — 14 octobre 2026

Le code de refonte et les corrections de saisie/Live sont désormais réellement en production, source `c3b7b589086d4d9439612d6cf6a5e959c8d1080f`, livraison38522445853SUCCESS (723Node/11Chromium/6WebKit). Les quatre libellés de version publics ont été relus à1.5.2.16. Une connexion réelle et la vue Séances ont été observées sans transaction de test ; protection native du navigateur ensuite bloquante, donc pas de nouvelles captures. La qualification automatisée ferme ses scénarios exacts, pas les155preuves visuelles/terrain. La recette exhaustive reste OUVERTE. Les observations du12octobre ci-dessous concernent la préproduction historique et ne sont pas des captures de la production actuelle.

# Eco-System — Registre d’écarts de la prévisualisation réelle
**Audit du 12 octobre 2026 • statut : OUVERT — NON RECETTÉ, version de préproduction isolée.**

Ce document ne prétend pas clôturer les 155 parcours ; il documente les faits observés **dans un navigateur connecté à la vraie prévisualisation Cloudflare**, à distinguer de la CI, des maquettes ou de la production.

## Sources et hiérarchie
1. Code et comportements réels dans `Serge-As/urae`.
2. Vision *Association/Tontine First* 08/10/2026.
3. Vision stratégique intégrale 09/10/2026.
4. Blueprint exécutable 5.0.0, doctrine « Pas de preuve, pas de réalité ».
5. Catalogue des 155 capacités / cinq dimensions (28/09).
6. Cahier maître 2.3.4, puis réorganisation ancienne et dossier originel en complément.
7. Dossier de passation `ECO_SYSTEM_REPRISE_REFONTE_INTEGRALE_2026-10-12.docx`.

## Preuves réellement collectées
- URL : `https://eco-system-refonte-preview.sergemimf.workers.dev/`
- Environnement isolé : Worker `eco-system-refonte-preview`, D1/R2 propres, argent réel désactivé.
- Workflow navigateur : `Eco-System — real deployed screenshots and visual audit`, run **38251898831**.
- Artifact : `eco-system-real-screen-evidence`, **21 captures** desktop (1440×900) et mobile (390×844), plus JSON observant les vues et les erreurs JS.
- Un compte de test fictif enregistré sur chaque facteur de forme, sans utiliser les identifiants personnels du fondateur.
- Preuve FR→EN après rechargement : `auth.englishReload.locale=en`, `control=en`, `stillAuthenticated=true`. **Cela ne garantit pas le contenu bilingue complet.**
- Workflow de création du groupe : `Eco-System — real 10-step group and cockpit acceptance` ; ses sorties doivent être lues par `group-evidence.json` car une ancienne version du script retournait succès Github malgré `result=BLOCKED`.
- Exécution **38251966083** : **ÉCHEC** sur simulation à l'étape 7 avec résultat vide. Ce blocage est un défaut réel, pas une preuve de réussite. Correctifs en préproduction : fieldsets inactifs exclus de la validation native, bouton relié à la commande de simulation canonique. **À requalifier jusqu'au Récap avec groupe actif.**

## Écarts visuels sur écrans réellement servis
| Vue | Observé / preuve | Écart et correction | Réception |
|---|---|---|---|
| Accueil desktop FR | Capture réelle `desktop-dashboard.png`, Actions locales et boutons d'accès affichés | Visuel encore plus dense que la maquette, header encombré. Ancien contraste blanc-sur-vert très clair identifié, désormais corrigé après audit par vert foncé sur fond clair | PARTIEL — visibilité oui, conformité complète non |
| Accueil EN | `desktop-dashboard-in-English.png`, changement de langue persistant après reload | Certains libellés et sous-panneaux étaient encore en français : assistant local, cockpit, Rubriques, mode d'interface, etc. Traductions ciblées ajoutées au dictionnaire, déploiement et preuve EN de l'ensemble à confirmer | PARTIEL |
| Accueil mobile | `mobile-dashboard.png` en 390px | Ancien badge de release non flexible ; corrigé par `overflow-wrap` et responsive. Vérifier aucun débordement horizontal et les actions utilisables au tactile | PARTIEL |
| Authentification FR/EN | `desktop-auth-before-signin.png`, `mobile-auth-before-signin.png` | Nouveaux sélecteurs de langue ; comparer les erreurs authentification en EN | PARTIEL |
| Création Association/Tontine | `desktop-launch.png`, `mobile-launch.png`; dix étapes affichées | Simulation du plan à l'étape 7 bloquée lors de l'essai du 12/10 ; fix ajouté, **aucune création complète encore certifiée** | BLOQUANT |
| Centre opérationnel | `desktop-operations.png`, `mobile-operations.png` avec compte sans groupe | Noyau et actions existants préservés ; aucune capture qualifiée d'un groupe réel après création | NON RECETTÉ |
| Séances et feuille financière 1/2/5 | `desktop-sessions.png`, `mobile-sessions.png` sans groupe | Contenu canonique, édition, totaux, concurrence multi-gestionnaires, gestion d'offline à valider sur **vrai groupe de test** | NON RECETTÉ |
| Finances et prêts | `desktop-finance.png`, `mobile-finance.png`, table des matières désormais stylisée | Saisie/recouvrement/ledger ne sont pas validés sur groupe constitué et R2 réel | NON RECETTÉ |
| Récap et confrontation | `desktop-recap.png`, `mobile-recap.png` sans groupe | Reconduction du ledger et preuves multi-acteurs nécessaires | NON RECETTÉ |
| Eco NOW/Deals/Business, Kits, Foras, Market, Harvest, Academy, Creator/Talent | `desktop-ecosystem.png`, `mobile-ecosystem.png` sans groupe | Accès présents, mais parcours complets et médias persistés non qualifiés | NON RECETTÉ |
| Founder Control | Code présent, mais aucun test avec une identité de fondateur plateforme autorisée | Import/assignation de marque R2 et règles d'accès à éprouver sur comptes habilités | NON RECETTÉ |

## Couverture 001–155
La matrice `Eco_System_Matrice_155_Capacites_Audit_Initial_2026-10-12.xlsx` référence **les 155 capacités** et contient écrans, actions, états, data owners, permissions, tests historiques et champs de preuve. Elle **n'accorde aucune réception de capacité sans test navigateur et état persisted après reload**. Une navigation historique ou un test unitaire ne correspond pas à une validation terrain.

## Gate de clôture (non encore satisfait)
- Captures réelles groupées desktop/mobile des **155 capacités**, roles multiples, erreurs, réseau faible, FR/EN, documentées par lignes de matrice.
- Parcours complet de création/simulation d'association sur la préproduction D1, puis relire après reload, ajouter membres et séances, produire feuille 1/2/5 et Récap, confronter deux gestionnaires.
- Upload et restitution d'images **dans R2 réel** et preuve de consentement; données canoniques et séparation tenant vérifiées.
- Les 155 liens et boutons doivent agir, persister, respecter les mandats et s'afficher après reload, sans simulation factice.
- Comparaison visuelle à la maquette pour Accueil, cockpit Association, feuille de séance, Marketplace, Forum et variantes smartphone.
- CI complète, Chromium/WebKit, smoke du **même SHA**, retour arrière, BIR+, validation d'acceptation avant promotion.
- PR #72 reste en HOLD; aucune fusion `main`, données réelles et activation argent réel autorisée.

**Conclusion : la prévisualisation fonctionne en partie ; la refonte intégrale et les 155 capacités ne sont PAS déclarées terminées.**
