# RECALL — Reprise terrain Eco-System, sources historiques et intégrité financière

**Date : 2026-09-19**  
**Branche : `next/1.4.1-field-integrity-guardrails-20260919`**  
**Parent vérifié au démarrage : `e40d7df3dd466f91c54afe2d17d659d462cfe782`**  
**Nature : Memory Before Code — aucune réécriture globale autorisée**

## 1. Mandat fondateur
Le fondateur demande une reprise ciblée de l'implémentation : ne pas repartir de zéro ; ne modifier que les points réellement concernés par les retours terrain ; préserver tout acquis fonctionnel ; réintégrer les exigences historiques utiles oubliées ; maintenir uniquement la partie non nuisible d'une idée ancienne lorsqu'elle entre en conflit avec la réalité actuelle ; progresser par petites corrections vérifiables.

## 2. Sources relues / auditées
Sources historiques fournies le 19 septembre 2026 : ancien cahier des charges 2025 ; conversation de lancement Eco-System ; cadre minimal Accueil / Séances ; captures et PDF de l'application terrain ; archive des anciens classeurs Excel/VBA, notamment Feuille mensuelle, RECAP, Fiches membre, Caisses, Épargne, Tontines, Emprunts et Remboursements ; trois modèles papier/Excel de fiche mensuelle, classement/calendrier et reconnaissance/décharge.

Sources projet courantes : AGENTS.md ; Current Truth / Project State / Truth Ledger / NEXT_RUN ; Cahier Maître ; Feature Registry ; branche et HEAD distants ; tests et code des feuilles, Ledger, contrôle membre, offline, dictée, rubriques et prêts.

## 3. Règles historiques encore pertinentes retrouvées

### 3.1 Feuille mensuelle / séance comme point d'entrée opérationnel
Le modèle historique présente membres en lignes, rubriques en colonnes, séance/période contextualisée, totaux recettes/dépenses/caisse et alimentation des fiches individuelles, rubriques et RECAP.

**Adaptation actuelle :** préserver les deux vues modernes — feuille de séance et fiches individuelles — comme deux projections du même moteur canonique, jamais comme deux comptabilités.

### 3.2 Toute modification financière doit rester traçable
La mémoire historique impose qu'une modification ne puisse pas devenir une vérité silencieuse. Une autre personne habilitée doit pouvoir la contrôler avant que la correction ne soit considérée comme institutionnellement validée.

**Adaptation actuelle :** Ledger append-only ; ancienne écriture conservée ; contrepassation ; nouvelle écriture ; ancienne/nouvelle valeur affichées ; motif ; auteur ; revue indépendante ; réserve membre séparée de la vérité comptable.

### 3.3 Offline
Exigence historique : consultation de la dernière situation connue et certaines actions/simulations sans connexion, avec synchronisation ultérieure honnête.

**État courant audité :** Service Worker + cache de shell présents ; outbox durable/idempotente présente ; écriture financière offline = intention en attente, pas faux succès ; le stockage MeetingSnapshotStore existe mais n'est pas encore relié de manière suffisante aux parcours de lecture ; les API sont volontairement network-only dans le Service Worker.

**Conclusion :** offline existe structurellement mais n'est pas encore une expérience terrain complète. L'installation PWA ne doit pas être une condition absolue du fonctionnement offline après une première visite contrôlée.

### 3.4 Dictée financière
La dictée actuelle repose sur Web Speech du navigateur. Elle dispose de prévisualisation avant écriture et de saisie focalisée, mais aucune preuve terrain ne permet d'affirmer une robustesse au bruit.

**Règle :** ne jamais promettre “fonctionne dans le bruit” tant qu'un test réel ne l'a pas prouvé. Renforcer d'abord confirmation, confiance, répétition, correction et fallback texte ; envisager ensuite un adapter STT spécialisé derrière feature flag.

### 3.5 Rubrique
Le besoin historique et terrain demande, en cliquant une rubrique : tableau récapitulatif ; lignes = membres ; colonnes = séances/périodes ; configuration au même endroit ; accès global réservé aux responsables.

**État courant : déjà implémenté dans detail-ui.js. Ne pas refaire.**

### 3.6 Dossier membre
Le membre remplit son propre dossier. Le Bureau habilité le consulte. Les informations techniques brutes ne doivent pas devenir l'interface normale du membre.

### 3.7 Prêts
Préserver séparation capital/intérêts, interdiction intérêt sur intérêt du modèle actuel, possibilité de modifier les hypothèses de simulation et de saisir depuis les feuilles canoniques.

### 3.8 Timbre
Le starter utile est “Timbre de prêt”. Le générique “Timbre” ne doit pas être recréé automatiquement s'il s'agit d'un doublon historique. Les données historiques restent conservées.

### 3.9 Labo financier / anti-Ponzi
Les cahiers historiques contiennent alertes arnaques, escroqueries et systèmes de Ponzi, “Labo financier et contre les systèmes Ponzi” et “Labo des bons systèmes financiers et de la prospérité”.

**Statut : exigence historique active à réintégrer dans le registre/cahier, mais pas à déclarer opérationnelle sans spécification, tests et preuve terrain.**

## 4. Retours terrain 2026-09-19 et statut réel

| Retour | État courant | Action |
|---|---|---|
| Offline non utile | PARTIEL | câbler snapshots de lecture + tests terrain |
| Dictée faible/bruit | PARTIEL | fiabiliser UX/confiance/fallback avant STT avancé |
| Saisie financière disparue/loin | DÉJÀ CORRIGÉE EN SOURCE | préserver deux feuilles en haut |
| Clic rubrique → récap | DÉJÀ CORRIGÉ | préserver |
| 2 000 → 5 000 sans trace visible | DÉJÀ PARTIELLEMENT CORRIGÉ | renforcer revue indépendante pour toute correction |
| nom séance/user technique | DÉJÀ CORRIGÉ | préserver “Réunion du <date>” + noms humains |
| dossier membre | PARTIEL | vérifier self-edit/Bureau-read et masquer debug |
| popup prêt/simulation | PARTIEL/DÉJÀ ÉTENDU | recette terrain seniors puis correction ciblée |
| Timbre vs Timbre de prêt | DÉJÀ CORRIGÉ EN CRÉATION | préserver historique sans réinjecter doublon |
| Menu Séances | MANQUANT NOM DE NAV | renommer Réunion → Séances puis construire page structurée par lots |
| Accueil groupe complet | PARTIEL | ajouter projections canoniques sans dupliquer finance |

## 5. Invariants anti-régression
Ledger unique ; corrections par reversal/compensation, jamais mutation silencieuse ; deux feuilles = même vérité ; rubriques non archivées visibles sur les deux feuilles ; rôles/permissions conservés ; simple membre ne voit pas les fiches globales des autres ; realMoneyEnabled=false ; D1 existante non recréée ; migrations additives ; UNKNOWN != SUCCEEDED ; offline ne fabrique aucun succès ; pas de nouveau moteur si le propriétaire canonique peut être réutilisé/étendu.

## 6. Ordre de reprise
1. conventions universelles ;
2. intégrité des corrections financières ;
3. vérité offline de lecture ;
4. dictée financière sûre ;
5. Accueil Groupe + menu/page Séances ;
6. dossier membre/visibilité ;
7. prêt UX seniors ;
8. réintégration documentée des capacités historiques manquantes, dont labo anti-Ponzi ;
9. seulement ensuite nouvelles expansions économiques.
