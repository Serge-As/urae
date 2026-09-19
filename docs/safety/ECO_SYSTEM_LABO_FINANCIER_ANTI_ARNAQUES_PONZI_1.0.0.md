# ECO-SYSTEM — LABO FINANCIER, ANTI-ARNAQUES ET SYSTÈMES PONZI

**Version de spécification : 1.0.0 — 19 septembre 2026**  
**Owner canonique : `SAFETY.ANTISCAM`**  
**Statut produit actuel : STRUCTURAL_V1 — NON RECETTÉ TERRAIN**  
**Principe : extension du Centre anti-arnaque existant ; aucun second moteur parallèle**

## 1. Origine et finalité

Cette capacité vient des cahiers historiques Eco-System : éducation financière/sociale, alertes contre les arnaques, escroqueries et systèmes de Ponzi, et idée d'un « labo financier » permettant de comprendre les mécanismes sains ou dangereux.

Elle est conservée parce qu'elle reste cohérente avec la mission de confiance d'Eco-System, mais elle est modernisée afin de ne pas devenir :
- un conseiller en investissement autonome ;
- un tribunal déclarant publiquement qu'une entreprise est frauduleuse ;
- un moteur de réputation opaque ;
- une source d'accusations non vérifiées.

## 2. Positionnement

Le module doit aider l'utilisateur à :
1. **comprendre** un montage financier ;
2. **décrire d'où vient l'argent promis** ;
3. **simuler** les flux annoncés ;
4. **repérer des signaux de risque** ;
5. **comparer** promesse et capacité économique ;
6. **poser les bonnes questions** ;
7. **conserver les preuves/sources** ;
8. **signaler un cas** au circuit de modération/risque lorsqu'il existe.

Il ne décide jamais seul qu'un système est illégal.

## 3. Sous-espaces du même owner

### 3.1 Labo « Comment ce système gagne-t-il réellement de l'argent ? »
Entrées :
- mise initiale ;
- rendement annoncé ;
- fréquence ;
- durée ;
- frais ;
- mécanisme économique déclaré ;
- recours au recrutement/parrainage ;
- conditions de retrait ;
- garanties annoncées ;
- sources/documents.

Sorties :
- flux entrants/sortants simulés ;
- montant nécessaire pour honorer les promesses ;
- hypothèses explicites ;
- dépendance éventuelle à de nouveaux entrants ;
- besoin de liquidité ;
- scénario de ralentissement des entrées ;
- scénario de retraits accélérés.

### 3.2 Détecteur pédagogique de signaux d'alerte
Exemples de signaux — jamais verdicts automatiques :
- rendement exceptionnel présenté comme certain ;
- origine des revenus peu claire ;
- rémunération dominée par recrutement ;
- pression temporelle ;
- retrait difficile/non documenté ;
- promesse de capital garanti sans preuve vérifiable ;
- forte asymétrie entre collecte et activité économique démontrable ;
- documentation incohérente ;
- identité ou autorisation de l'opérateur invérifiable.

Chaque signal affiche **pourquoi il mérite une vérification**.

### 3.3 Labo des systèmes financiers sains
Ne pas construire uniquement un outil anxiogène.
Permettre de simuler/comprendre :
- épargne ;
- prêt ;
- intérêt simple/composé selon contexte pédagogique ;
- fonds collectif ;
- tontine ;
- investissement productif documenté ;
- trésorerie ;
- marge ;
- risque ;
- diversification au sens pédagogique.

### 3.4 Comparateur de scénarios
Comparer plusieurs hypothèses sans recommander automatiquement « le meilleur » :
- scénario annoncé ;
- scénario prudent ;
- scénario stress ;
- scénario sans nouveaux entrants ;
- scénario avec retraits élevés.

## 4. Exemple pédagogique Ponzi

Si un système promet 20 % par mois mais ne documente aucune activité produisant ces revenus, le labo peut calculer le montant à générer pour payer les participants.

Il peut afficher :
> « La promesse exige X de ressources supplémentaires dans ce scénario. L'origine de ces ressources n'est pas démontrée dans les informations fournies. Vérifiez le modèle économique, les autorisations et les preuves. »

Il ne doit pas afficher :
> « Cette entreprise est un Ponzi »

sans base factuelle/autorité compétente.

## 5. Données et preuves

Chaque analyse conserve, selon consentement :
- données saisies par l'utilisateur ;
- URLs/documents fournis ;
- date ;
- hypothèses ;
- calculs ;
- niveau de preuve ;
- version du modèle de règles.

Les documents suspects ne deviennent pas automatiquement publics.

## 6. IA

L'IA peut :
- expliquer ;
- extraire des promesses d'un document ;
- reformuler ;
- identifier les informations manquantes ;
- proposer des questions de vérification.

L'IA ne peut pas :
- inventer une licence/autorisation ;
- affirmer un crime ;
- promettre un rendement ;
- faire une transaction ;
- transformer une suspicion en badge public.

## 7. Offline

Le contenu éducatif et les simulations déterministes peuvent être disponibles offline.

Toute vérification externe, statut réglementaire, signalement serveur ou source récente reste explicitement **non vérifiée hors ligne**.

## 8. Architecture

Réutiliser :
- `SAFETY.ANTISCAM` — owner ;
- Knowledge Bank / Academy pour l'éducation ;
- KERNEL.EVIDENCE pour les pièces ;
- KERNEL.CASES pour les signalements/cas ;
- KERNEL.AUDIT pour les actions importantes ;
- AI.ASSISTANT uniquement comme aide explicative.

Ne pas créer :
- second moteur d'identité ;
- second système de cas ;
- second moteur de réputation ;
- second ledger.

## 9. États proposés

`DRAFT → ANALYZED → NEEDS_EVIDENCE → EDUCATIONAL_RESULT`

Optionnel, si signalement :
`REPORT_DRAFT → SUBMITTED → TRIAGED → UNDER_REVIEW → RESOLVED`

Un résultat pédagogique n'est pas un jugement légal.

## 10. Critères avant statut FUNCTIONAL_BETA

- moteur de simulation déterministe testé ;
- règles d'alerte explicables et versionnées ;
- sources/preuves attachables ;
- aucune accusation publique automatique ;
- UI FR/EN ;
- mode senior/explications simples ;
- tests offline des simulations ;
- tests confidentialité ;
- audit ;
- au moins 10 cas synthétiques : sain, ambigu, pyramidal/recrutement dominant, rendement non démontré, liquidité insuffisante, etc.

## 11. Critères avant ACQUIS

- CI ;
- déploiement qualifié ;
- smoke ;
- recette terrain avec utilisateurs non experts ;
- revue des faux positifs/faux négatifs ;
- contenu pédagogique relu ;
- statut produit et limites affichés clairement.

## 12. Non-régression

Cette capacité complète Eco-System. Elle ne remplace ni les moteurs financiers du groupe, ni Fairness Lab, ni les outils d'épargne/prêts, ni le Centre de risque. Elle doit les expliquer ou les observer sans devenir leur autorité.
