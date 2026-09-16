# ECO-SYSTEM — Cahier des Charges Maître Exhaustif 3.1.0

Date : 2026-09-16  
Production : **Eco-System 1.3.2 déployé et smoke-testé**  
Branche de reprise : `next/1.3.2-savings-control-forum-live-20260916`  
Worker : `eco-system`  
D1 : `eco-system-db`  
R2 privé : `eco-system-backups`  
Worker Version ID : `f6e8b41f-8093-4ca9-9feb-202a4037c7b9`  
Argent réel : **désactivé**

> Ce document complète et supersède la version 3.0.0 pour la ligne courante. L'historique précédent reste conservé. La version Word détaillée 3.1.0 est également livrée au fondateur.

## 1. Doctrine

Eco-System remplace progressivement les cahiers papier, classeurs Excel interdépendants, groupes de messagerie dispersés et traitements manuels utilisés par les tontines et associations. La plateforme doit numériser la réalité du groupe sans imposer une règle unique.

Living Rules reste la doctrine : règle écrite, pratique observée, règle opérationnelle validée et exception restent distinctes. L'IA peut analyser et proposer ; elle n'active pas silencieusement une gouvernance.

La vérité financière est le Ledger canonique D1. Live, notifications, rapports, RECAP et partenaires sont des projections. UNKNOWN n'est jamais SUCCEEDED.

## 2. Architecture

- Workers : API/auth/orchestration.
- D1 : groupes, membres, règles, Ledger, états et Control Center.
- Durable Objects : coordination Live ; pas de solde financier autonome.
- R2 : sauvegardes BIR+, imports, futurs médias/photos/pièces.
- PWA : desktop/mobile/offline/2G.
- Web Push : notifications à compléter.
- RealtimeKit/WebRTC : cible future pour réunions audio/vidéo.

## 3. Parcours groupe — contrat 10 étapes

1. Origine : nouveau/historique/transformation.
2. Famille : association/tontine/hybride.
3. Gouvernance.
4. Exercice/calendrier.
5. Membres.
6. Rubriques multiples, chacune avec contexte/participants propres.
7. Finance/faisabilité ; aucune cotisation nominale globale imposée.
8. Communication.
9. Accessibilité/Ultra Simple/2G/FR-EN.
10. Prévisualisation/confirmation puis création.

Multi-tontines, Collation, argent/nature/mixte et participants propres sont des acquis anti-régression.

## 4. Réunion et Feuille mensuelle

La Feuille mensuelle reste un modèle conceptuel important : membres × rubriques, avec interface smartphone adaptée. Chaque séance doit rapprocher les rubriques puis la caisse globale :

`caisse début + entrées - sorties = caisse théorique fin`

L'écart avec la caisse physique est explicité, jamais effacé.

## 5. Épargne à intérêts — audit du classeur réel

Sources : `Feuille mensuelle.xlsx` et `Rubriques Epargne à intérêts.xlsx`.

Le moteur historique réel suit :
`EPARGNE → Principal → Intérêts provisoires → Intérêts Finaux`
et la chaîne parallèle Épargne scolaire.

Données vérifiées :
- intérêts encaissés : **18 500 F** ;
- classique : **12 950 F (70 %)** ;
- scolaire : **1 850 F (10 %)** ;
- Bureau : **3 700 F (20 %)** ;
- principal classique : **14 935 199 F** ;
- principal scolaire : **1 081 000 F**.

Coefficients classique : 9,8,7,6,5,4,3,2,1,0.5,0,0.  
Coefficients scolaire : 7,6,5,4,3,2,1,0,0,0,0,0.

### Moteur 1 — reproduction historique

Eco-System reproduit les étapes intermédiaires et la normalisation finale. La confrontation avec les cellules finales cachées du classeur donne un écart maximal ≈ **9×10^-13 F**, c.-à-d. le bruit flottant uniquement.

Exemples :
- Pauline avril : 421.098053 F dans les deux moteurs ;
- Marie avril : 5 323.605806 F ;
- Paul avril : 5 316.026041 F ;
- Nicaise janvier : 1 208.479825 F ;
- scolaire René janvier : 1 719.559155 F.

Le taux général, la division par le coefficient maximal et le ratio de normalisation sont des facteurs communs du chemin linéaire. Après normalisation, la part relative finale est proportionnelle à `montant × coefficient de période`.

### Moteur 2 — capital réellement productif

Il suit les montants effectivement prêtés. Option `noLoanNoYield=true` : une épargne idle ne gagne aucun poids.

Preuves du classeur actuel :
- prêt ordinaire : 50 050 F en janvier ;
- SPECIAL PRÊT : 50 000 F ;
- remboursements principal : 75 500 F.

Le fichier ne prouve pas encore la chaîne complète prêt → caisse/source → remboursement → réemploi. Le moteur refuse d'inventer ces liens.

Simulation conservatrice sur le pool classique 12 950 F :
- Nicaise ≈ 9 216 F ;
- Martin ≈ 963 F ;
- Florence ≈ 949 F ;
- Marie ≈ 55 F ;
- Paul = 0 F.

Ce résultat n'est pas déclaré « universellement meilleur » : il est plus causal sous la politique « pas de prêt = pas d'intérêt ». Eco-System doit afficher les deux méthodes côte à côte et expliquer les divergences.

Pour l'Épargne scolaire, aucune rémunération productive ne doit être inventée tant que la règle « caisse mutualisée avec l'Épargne classique » ou « caisse séparée » n'est pas explicitée.

## 6. Fonds Secours

Le système conserve :
- solde collectif de la caisse ;
- contribution/retenue de chaque membre ;
- ouverture, contribution, remboursement au membre, déchéance, ajustements.

Une assistance versée n'efface jamais l'historique de contribution. Une position membre ne devient pas négative silencieusement.

## 7. RECAP / Cassation / clôture

Deux vues :
- RECAP Cockpit courant ;
- RECAP Financier membre × rubrique.

Correction manuelle = valeur automatique + ajustement + raison + auteur + date.

Carryover N+1 : Secours par membre, Projet, réserve et autres fonds structurés, sans promettre plus que la caisse physique.

## 8. Identité

CNI + téléphone + nom normalisé sont rapprochés via HMAC serveur. Les valeurs brutes ne sont pas utilisées comme index public/analytics/publicité.

Photo : futur stockage R2 avec consentement et contrôle d'accès.
Reconnaissance faciale : cible limitée à une vérification volontaire 1-à-1, jamais recherche massive 1-à-N.
Authentification future : privilégier passkeys/WebAuthn.

## 9. Forum v2

Acquis 1.3.2 :
- messages paginés ;
- réponses/threads ;
- réactions ;
- brouillon serveur par compte/Hub ;
- dernier message lu ;
- ancre exacte de reprise ;
- synchronisation Live multi-appareils ;
- pagination autour de l'ancre, sans charger 100 000 messages.

Prochains lots : recherche, signets, voix, sondages, modération, médias.

## 10. Live

Premium Live est maintenant en production mais reste une projection de la vérité D1. Une panne Live ne transforme jamais une écriture D1 commitée en échec financier.

Cible réunion : Cloudflare RealtimeKit / WebRTC, à qualifier séparément.

## 11. Control Center

Fonctions :
- capacités auto-enregistrées depuis le catalogue canonique ;
- santé UNKNOWN/PASS/DEGRADED/FAIL ;
- incidents et résolution ;
- plaintes ouvertes ;
- contenu à écrire/corriger/publier ;
- coûts/limites à intégrer.

Règle : toute nouvelle capacité supervisable est automatiquement ajoutée.

Le propriétaire plateforme initial est persisté en D1. Un simple fondateur de groupe ne devient pas automatiquement administrateur plateforme.

## 12. R2 et BIR+

Le jeton Cloudflare GitHub existant passe désormais D1 et R2. Aucun nouveau token n'est nécessaire.

La production 1.3.2 a créé le bucket privé `eco-system-backups`, sauvegardé source + export D1 + SHA256 et vérifié le miroir R2 avant déploiement.

## 13. Marketplace / économie / partenaires

- Demand Exchange inter-groupes ;
- reverse auction ;
- Deals/Offers ;
- fournisseurs classés par prix rendu/capacité/délai/fiabilité ;
- programmes ONG gouvernés ;
- profils économiques agrégés/pseudonymisés ;
- aucune finance individuelle dans les share packs.

## 14. IA

Rule Architect : analyse les documents et propose des règles sourcées.
Group Doctor (innovation) : détecte contradictions RI/pratique/finance et propose une version mieux structurée sans forcer le groupe.

## 15. Innovations 3.1 → 3.5

- Meeting Autopilot voix ;
- Interest Fairness Lab ;
- Group Doctor ;
- Proof Receipt QR ;
- passkeys ;
- Forum voix/live/sondages/signets ;
- Community streaks utiles, jamais basés sur richesse ;
- Demand Exchange ;
- Health Passport ;
- Recovery Drill ;
- Shadow Simulation ;
- R2 Media Pipeline via Queues ;
- Web Push.

## 16. Roadmap

3.2 : Ledger → moteur productif, Secours UI, RECAP/Cassation complet.  
3.3 : photo R2, passkeys, Push, recherche Forum, voix.  
3.4 : RealtimeKit, sondages/live, Demand Exchange/Deals.  
3.5 : Group Doctor, Cost Control, partenaires avancés, tests 2G/seniors.

## 17. Definition of Done

1. besoin/règle sourcés ;
2. owner/dépendances ;
3. migration additive ;
4. implémentation idempotente/scopée ;
5. tests ;
6. UI mobile/desktop/offline ;
7. Control Center ;
8. docs/registre ;
9. CI verte ;
10. BIR+ ;
11. smoke réel.

## 18. Procédure obligatoire BIR+

1. RECALL : lire AGENTS, CURRENT_TRUTH, PROJECT_STATE, PROJECT_TRUTH_LEDGER, NEXT_RUN, Cahier, modèle économique, registre.
2. Vérifier HEAD/CI/Cloudflare/D1/R2/URL.
3. Modifier par petits lots réversibles.
4. Commit/push chaque sous-lot significatif.
5. Corriger toute CI rouge avant d'empiler.
6. Mettre à jour Current Truth.
7. BIR+ : HEAD exact + export D1 + restauration SQLite + integrity_check + SHA256 + Artifact GitHub.
8. Miroir R2 privé par version/SHA ; vérifier en retéléchargeant les checksums.
9. Nouvelle sauvegarde immédiatement avant production.
10. Migrations additives uniquement.
11. Déploiement contrôlé ; realMoney reste false.
12. Smoke racine + /health + version + bindings.
13. Nouveau chat : reprendre branche/HEAD/runs/Current Truth, jamais depuis zéro.

**Règle anti-interruption : après 3–5 sous-lots significatifs, commit + CI + checkpoint vérité.**
