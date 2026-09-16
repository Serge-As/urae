# ECO-SYSTEM — Modèle Économique, AdManager & AdOps Approfondi 3.2.0

Date : 2026-09-16  
Statut : **hypothèses commerciales et architecture économique à tester ; aucun prix définitif ni débit réel activé**  
Complément constitutionnel : Cahier Maître 3.2.0  
Principe : financer durablement le cœur gratuit sans vendre la vie privée ni rendre la gestion financière essentielle payante.

---

# 1. Objet

Eco-System ne doit pas dépendre d'un seul revenu. Le produit se situe à l'intersection de :
- gestion d'associations/tontines ;
- communauté ;
- économie locale ;
- achats groupés ;
- publicité contextuelle ;
- programmes ONG/partenaires ;
- formation ;
- services professionnels.

Le modèle doit supporter des groupes modestes, des utilisateurs seniors, beaucoup de cash et des transactions conclues hors plateforme. Une commission calculée uniquement sur des ventes que le commerçant déclare lui-même serait fragile. Les rails doivent donc privilégier les **valeurs qu'Eco-System sait mesurer ou fournir directement**.

---

# 2. Doctrine économique

## 2.1 Ce qui doit rester gratuit
- créer/rejoindre un groupe de base ;
- consulter sa situation ;
- voir les preuves et historiques essentiels ;
- signaler une erreur/réserve ;
- protections sécurité ;
- correction d'une erreur financière ;
- export minimal de ses données ;
- fonctionnalités minimales d'accessibilité.

## 2.2 Ce qui peut financer la plateforme
- automatisations avancées ;
- multi-groupes/fédérations ;
- stockage/médias à coût variable ;
- formation ;
- support expert ;
- programmes ONG ;
- marketplace/achats groupés ;
- leads consentis ;
- AdManager ;
- rapports/insights agrégés ;
- outils professionnels de pilotage ;
- Live/vidéo avancé quand il génère un coût réel.

## 2.3 Règle de marge
Une fonctionnalité à coût variable n'est pas « Premium » parce qu'elle semble moderne : elle le devient si :
`prix net - coût variable - support - fraude - paiement > marge cible`.

Le Control Center doit afficher le coût par service avant qu'une fonction gratuite à forte consommation ne devienne un risque.

---

# 3. Segments

## Membre
Valeur : transparence, communication, preuves, communauté.  
Monétisation directe : faible priorité.

## Groupe / Bureau
Valeur : gain de temps, contrôle, rapports, automatisation.  
Offres : Community, Plus, Pro.

## Gestionnaire multi-groupes / fédération
Valeur : supervision, délégation, consolidation, support.  
Offres : Multi-Group Ops.

## Fournisseur / commerçant
Valeur : demande agrégée, leads, commandes, sponsoring.  
Offres : Seller Pro, Deals, Demand Exchange, AdManager.

## ONG / bailleur / partenaire
Valeur : programme, formation, suivi, reporting agrégé.  
Offres : Program-in-a-Box, Partner Console, Insights.

## Annonceur / agence
Valeur : inventaire local/contextuel mesurable.  
Offres : campagnes CPM/CPC/CPA/forfait, sponsoring.

---

# 4. Architecture des revenus

1. **Groupe Plus / Pro**
2. **Multi-groupes**
3. **AdManager / sponsoring**
4. **Demand Exchange / Marketplace**
5. **Verified Leads**
6. **ONG / Programmes**
7. **Insights agrégés**
8. **Academy / formation**
9. **Migration papier/Excel**
10. **Storage/Media Plus**
11. **Live/vidéo avancé**
12. **Documents/impression**
13. **Support expert**
14. **API/white-label léger**, plus tard.

La plateforme ne dépend pas d'un rail unique.

---

# 5. Hypothèses tarifaires de test — Cameroun

Ce sont des **fourchettes d'expérimentation**, pas des prix décidés.

| Offre | Hypothèse |
|---|---:|
| Community | 0 F |
| Groupe Plus | 1 000–2 500 F/mois |
| Groupe Pro | 2 500–7 500 F/mois |
| Multi-groupes | 10 000–50 000 F/mois |
| Formation Bureau | 5 000–50 000 F/session |
| Migration papier/Excel | forfait selon volume |
| Programme ONG | 50 000–500 000+ F/mois |
| Campagne locale | à partir de 5 000–10 000 F |
| Lead vérifié | 100–2 000 F selon valeur |
| Marketplace | 1–5 % seulement si la transaction est réellement capturée/attribuable |

Aucune hypothèse n'entre dans le code comme vérité universelle. Utiliser feature flags/catalogue tarifaire versionné.

---

# 6. Packaging produit

## Community — gratuit
- groupe de base ;
- membres ;
- rubriques ;
- séance ;
- situation ;
- forum texte ;
- preuves ;
- exports essentiels ;
- sécurité.

## Plus
- automatisations ;
- rapports avancés ;
- historique enrichi ;
- stockage supplémentaire raisonnable ;
- modèles de documents ;
- Fairness Lab étendu ;
- Academy sélectionnée.

## Pro
- Group Doctor avancé ;
- Meeting Autopilot ;
- contrôles renforcés ;
- reporting étendu ;
- délégations ;
- support prioritaire ;
- personnalisation.

## Multi-Group Ops
- portefeuille de groupes ;
- alertes ;
- permissions déléguées ;
- consolidation ;
- Health Passport ;
- suivi de conformité opérationnelle.

**Garde-fou :** ne pas bloquer une preuve, une contestation ou la correction d'une erreur parce qu'un abonnement a expiré.

---

# 7. AdManager : rôle stratégique

La publicité est un **financement complémentaire**, pas la raison d'être de l'application.

Objectifs :
- financer une partie du gratuit ;
- créer de la valeur pour annonceurs locaux ;
- soutenir Marketplace/Demand Exchange ;
- promouvoir les propres services Eco-System ;
- financer des programmes utiles par sponsors/ONG.

Interdictions :
- publicité agressive plein écran ;
- autoplay lourd ;
- pop-up bloquant une action ;
- ciblage dette/solde/prêt/santé/CNI/téléphone ;
- vente de conversations ;
- profilage cross-site clandestin.

---

# 8. Inventaire publicitaire optimal

## 8.1 Accueil — après les priorités
Position :
`Maintenant → situation → groupe actif → sponsor natif`.

Raison : forte visibilité sans sacrifier les tâches.

Format :
- titre court ;
- 1 visuel facultatif ;
- texte <= 2–3 lignes ;
- CTA ;
- label « Sponsorisé ».

Faible data : texte seul.

## 8.2 Feed natif
Densité initiale : 1 sponsor pour 8–12 éléments.

## 8.3 Forum natif
Densité : environ 1 sponsor pour 10 éléments/listes, mais ne jamais casser un thread court.

## 8.4 Marketplace
Jusqu'à 15 % sponsorisé, clairement étiqueté. L'organique garde un classement propre.

## 8.5 Sponsor de groupe
Opt-in du groupe. Ex. librairie soutenant une association scolaire.

## 8.6 Pied de rapport
Petit footer ou dernière page. Ne jamais couvrir le contenu.

## 8.7 Pied de reçu
Après la preuve : jamais entre montant, bénéficiaire, statut et QR.

## 8.8 Post-action House Ad
Après réussite :
> « Votre séance est clôturée. Voulez-vous comparer vos méthodes d'intérêts ? »

## 8.9 Notification sponsorisée
Uniquement opt-in spécifique, fréquence très basse, désactivation facile.

---

# 9. House Ads — média propriétaire

Quand l'inventaire payé n'a pas de campagne admissible, Eco-System utilise l'espace pour ses services.

Exemples :
- Academy ;
- Paper Bridge ;
- Group Doctor ;
- Interest Fairness Lab ;
- Demand Exchange ;
- Meeting Autopilot ;
- Assistance Rulebook.

Une House Ad :
- n'est jamais du revenu ;
- possède un `source=HOUSE` ;
- sert adoption/rétention ;
- est soumise au frequency cap ;
- peut être masquée.

---

# 10. Contextualisation « 1 000 groupes, 1 000 compositions »

## 10.1 Sélection métier
Déterministe :
- phase de l'exercice ;
- mois avant clôture ;
- famille de rubriques ;
- présence de besoins en nature ;
- historique papier ;
- faible connexion ;
- éléments de gouvernance à valider.

## 10.2 Exemples
**Début exercice** :
Academy + Paper Bridge + Meeting Autopilot.

**3 mois avant clôture + Épargne** :
Interest Fairness Lab.

**Tontine savons/draps** :
Demand Exchange renforcé.

**Pas de tontine en nature** :
Demand Exchange reste une exploration légère ; les utilisateurs peuvent avoir des besoins privés indépendants des rubriques.

**Assistance non finalisée** :
Assistance Rulebook.

## 10.3 Diversité
Le moteur évite d'afficher la même House Ad en boucle :
- cap 7 jours ;
- rotation stable ;
- catégorie exploratoire ;
- préférence utilisateur ;
- feedback négatif.

---

# 11. IA de rédaction publicitaire

## 11.1 Architecture
`règles → candidats → contexte collectif dérivé → Workers AI → variantes bornées → validation/filtrage → diffusion`.

Le modèle ne choisit pas l'éligibilité commerciale.

## 11.2 Données envoyées
Exemple :
```json
{
  "stage":"CLOSING",
  "monthsToExerciseEnd":3.5,
  "rubricFamilies":["SAVINGS","TONTINE"],
  "commerceSignals":["SOAP"],
  "hasSavings":true,
  "lowBandwidth":false
}
```

Ne pas envoyer les noms bruts de membres/rubriques, téléphones, identités ou finances individuelles.

## 11.3 Fallback
Si IA indisponible, quota épuisé ou JSON invalide :
- garder la sélection métier ;
- utiliser texte déterministe ;
- ne jamais bloquer la régie.

## 11.4 Coût
Cache AI Gateway 24 h lorsque pertinent. Réutiliser les variantes au lieu d'appeler le modèle à chaque impression.

---

# 12. Cycle campagne

`DRAFT → PENDING_REVIEW → APPROVED → ACTIVE ↔ PAUSED → COMPLETED`.

Branche `REJECTED`.

Future extension :
`SCHEDULED`, `EXHAUSTED`, `CANCELLED`.

Contrôles :
- annonceur ;
- objectif ;
- créatif ;
- destination ;
- placements ;
- budget sandbox/réel ;
- dates ;
- ciblage ;
- fréquence ;
- conformité ;
- secteur.

---

# 13. Objectifs publicitaires

- Awareness ;
- Community Join ;
- Event RSVP ;
- Deal Open ;
- Group Buy ;
- Lead ;
- Partner Program.

Mesure correspondant à l'objectif, pas seulement CTR.

---

# 14. Ciblage

## Autorisé
- pays/ville/zone grossière ;
- contexte de l'écran ;
- catégorie produit ;
- intérêt commercial déclaré ;
- groupe sponsorisé avec contrat ;
- famille de rubrique agrégée ;
- masse agrégée par bande au niveau groupe, si gouvernée.

## Interdit
- dette individuelle ;
- retard personnel ;
- solde ;
- prêt ;
- CNI ;
- téléphone ;
- biométrie ;
- santé ;
- litige ;
- appartenance politique/religieuse ;
- inférence sensible.

## Règle de minimisation
Quand un signal collectif suffit, ne pas transmettre le détail qui l'a produit.

---

# 15. Créatifs

Formats :
- texte natif ;
- image légère ;
- carrousel plus tard ;
- vidéo uniquement si bénéfice/capacité.

Chaque créatif :
- headline ;
- body ;
- CTA ;
- destination ;
- version low-data ;
- poids ;
- langue ;
- statut modération ;
- version ;
- sponsor visible.

---

# 16. Modération et AntiScam

Avant activation :
- organisation/source ;
- destination ;
- claims ;
- secteur ;
- promesses financières ;
- contenu trompeur ;
- poids média ;
- malware/phishing si lien ;
- restrictions pays/juridiction.

États :
- automatique léger ;
- revue humaine ;
- blocage ;
- appel/révision.

Eco-System n'accuse pas publiquement un annonceur de fraude sans procédure.

---

# 17. Frequency cap et fatigue

Caps :
- campagne/viewer ;
- placement ;
- catégorie ;
- House Ads ;
- notifications.

Exemple de départ :
- 3–4 impressions campagne / 7 jours ;
- notification sponsorisée : beaucoup plus stricte.

Optimiser sur utilité et feedback, pas seulement revenu.

---

# 18. Mesure et attribution

Événements idempotents :
- impression confirmée ;
- open/click ;
- action ;
- lead ;
- conversion interne ;
- feedback négatif.

Attribution :
- fenêtre configurable ;
- source/campaign/creative/placement ;
- déduplication ;
- conversion interne préférée ;
- coupon/QR/deal pour cash/off-platform.

## 18.1 Cash
Si une vente se termine en espèces, utiliser :
- QR/coupon ;
- code promo ;
- réservation ;
- bon ;
- confirmation acheteur ;
- confirmation vendeur ;
- preuve d'avantage.

Ne pas baser tout le revenu sur une auto-déclaration du vendeur.

---

# 19. Facturation publicitaire — phases

## Sandbox
Budget fictif, aucune dette réelle.

## Réel futur
Après contrats/payment adapter :
- prépaiement ;
- crédit annonceur ;
- facture ;
- rapprochement ;
- remboursement/avoir ;
- audit.

Modèles :
- CPM ;
- CPC ;
- CPA ;
- forfait ;
- sponsoring ;
- abonnement annonceur.

Ne pas facturer une impression offline non synchronisée.

---

# 20. AdOps Control Room

## Cockpit
- revenu sandbox/réel ;
- campagnes actives ;
- inventaire ;
- fill rate ;
- House Ad rate ;
- feedback ;
- incidents ;
- top placements.

## Modération
- files ;
- SLA ;
- motifs ;
- appels.

## Qualité/fraude
- clics impossibles ;
- taux anormaux ;
- répétition ;
- bots ;
- destinations cassées ;
- faux leads.

## Finance
- budgets ;
- crédits ;
- factures ;
- coûts ;
- marge.

---

# 21. CRM annonceurs

Pipeline :
`Repéré → À contacter → Contacté → Qualifié → Proposition → Gagné/Perdu`.

Sources :
- salons/foires ;
- commerçants Marketplace ;
- recommandations ;
- organisations publiques ;
- demandes entrantes ;
- partenaires locaux.

Fiche :
- organisation ;
- secteur ;
- localité ;
- contact public/consenti ;
- budget estimatif ;
- objectif ;
- saisonnalité ;
- historique campagnes ;
- prochaine action.

Le CRM ne contient pas des données membres pour enrichir un annonceur.

---

# 22. Prospection semi-automatique

Le tableau peut :
- détecter une catégorie d'inventaire peu monétisée ;
- suggérer secteurs pertinents ;
- afficher liste de prospects déjà enregistrés ;
- préparer un argumentaire ;
- suivre relances.

Il ne doit pas scraper clandestinement des contacts privés ni envoyer du spam automatique.

---

# 23. Rate Card dynamique

Au lieu d'un prix unique :
- placement ;
- format ;
- période ;
- rareté inventaire ;
- localité ;
- audience agrégée ;
- objectif ;
- engagement historique ;
- coût de service.

Exemple conceptuel :
`prix_plancher = coût_variable + risque + marge_min`.

`prix_proposé = prix_plancher × facteur_inventaire × facteur_saison × facteur_qualité`.

Les facteurs restent inspectables.

---

# 24. Sponsoring

## Sponsor de service
Une ONG paie Academy pour certains groupes.

## Sponsor de groupe
Une entreprise locale soutient un groupe avec opt-in.

## Sponsor d'événement
Réunion/live, sans interférence financière.

## Sponsor de rapport
Petit label discret.

Toujours :
- sponsor identifié ;
- aucune propriété implicite sur les données ;
- durée ;
- périmètre ;
- contrôle fréquence.

---

# 25. Demand Exchange

Valeur :
- concentrer demandes ;
- réduire coût de prospection fournisseur ;
- négocier volume ;
- mesurer conversion.

Revenus :
- abonnement fournisseur ;
- fee de participation ;
- commission transaction si capturée ;
- sponsoring transparent.

Exemple :
15 groupes = 4 500 savons → RFQ → 5 fournisseurs → comparaison **prix rendu** (prix + transport + délai + qualité), pas seulement prix unité.

---

# 26. Reverse Auction

Étapes :
1. demande agrégée ;
2. cahier produit ;
3. fournisseurs qualifiés ;
4. offres ;
5. normalisation ;
6. sélection selon politique ;
7. deal ;
8. preuve livraison ;
9. feedback.

Le sponsor n'obtient pas automatiquement le marché.

---

# 27. Verified Local Leads

Un lead n'est vendu/transmis qu'avec :
- intention explicite ;
- consentement ;
- fournisseur compatible ;
- délai d'expiration.

Paiement :
- forfait ;
- CPA ;
- abonnement.

Le membre peut retirer son consentement.

---

# 28. ONG / Program-in-a-Box

Pack :
- création programme ;
- cohortes ;
- contenus offline ;
- formation ;
- jalons ;
- présence ;
- indicateurs ;
- reporting ;
- réduction progressive des permissions ;
- clôture.

Monétisation :
- setup ;
- forfait mensuel ;
- groupe actif ;
- rapport avancé ;
- formation.

La donnée brute membre n'est pas la marchandise.

---

# 29. Insights agrégés

Exemples :
- masse monétaire par type de rubrique ;
- saisonnalité ;
- volume demandes en nature ;
- fréquence réunions ;
- adoption numérique.

Conditions :
- k-anonymat ;
- pseudonymisation ;
- fenêtre ;
- finalité ;
- suppression/expiration ;
- contrat.

Pas de « liste des membres les plus endettés » vendue à un partenaire.

---

# 30. Academy

Monétisation :
- sponsor ONG ;
- pack Bureau ;
- certification légère ;
- formation humaine ;
- bibliothèque premium.

Le contenu critique sécurité/anti-arnaque peut rester gratuit.

---

# 31. Group Doctor / Governance Coach

Version gratuite : diagnostic de base.

Pro :
- analyses comparées ;
- simulations ;
- rapports ;
- historique ;
- recommandation contextualisée ;
- revue expert humain.

Jamais :
- sanction automatique ;
- action financière autonome.

---

# 32. Paper Bridge / documents

Revenus possibles :
- pack registre personnalisé ;
- impression physique ;
- cartes membre ;
- archivage longue durée ;
- numérisation/import ;
- pack Statuts/RI/règlement financier.

Un sponsor peut financer l'impression, étiqueté clairement.

---

# 33. Storage Plus / médias

R2 a un coût. Politique :
- quota gratuit raisonnable ;
- compression ;
- expiration des dérivés ;
- conservation des originaux selon valeur ;
- add-on au-delà.

L'utilisateur garde export/suppression.

---

# 34. Live et vidéo

Texte/Live léger peut rester inclus.

Audio/vidéo :
- facturer si coût variable important ;
- pack événement ;
- sponsor ;
- quota mensuel ;
- ONG programme.

Ne pas promettre gratuit illimité lorsque le fournisseur facture le trafic.

---

# 35. Unit economics

Par rail :
`Contribution Margin = Revenue - payment fees - infra variable - AI/media - support variable - fraud/refunds`.

KPI :
- ARPA/ARPG ;
- CAC ;
- LTV ;
- payback ;
- churn ;
- cost/group active ;
- AI cost/1k actions ;
- R2 cost/group ;
- Live cost/minute ;
- ad margin ;
- marketplace take rate ;
- support minutes/group.

---

# 36. Scénarios 12 mois

Les projections doivent être paramétriques, jamais présentées comme prévisions certaines.

Entrées :
- groupes actifs ;
- % Plus/Pro ;
- ARPU ;
- annonceurs ;
- spend moyen ;
- fournisseurs ;
- GMV capturé ;
- ONG ;
- coût infra ;
- support.

Sorties :
- revenu par rail ;
- coûts ;
- marge ;
- runway ;
- seuil de rentabilité.

Construire trois scénarios : prudent / central / expansion.

---

# 37. KPI AdManager

- fill rate ;
- House Ad rate ;
- impressions confirmées ;
- unique reach approximative ;
- CTR/open rate ;
- action rate ;
- CPA ;
- negative feedback ;
- fréquence ;
- revenu / 1k impressions ;
- marge ;
- taux de modération ;
- délai activation ;
- fraude annulée.

---

# 38. KPI produit et économie

Produit :
- activation groupe ;
- séances ;
- rétention ;
- DAU/MAU ;
- nombre de rubriques actives.

Économie :
- revenu/groupe ;
- part B2B vs membre ;
- marge ;
- coût service.

Marketplace :
- demande ;
- offres ;
- conversion ;
- prix rendu économisé ;
- litiges.

ONG :
- groupes couverts ;
- jalons ;
- renouvellement.

---

# 39. Expériences commerciales

Avant prix définitifs :
1. 3–5 cohortes groupes ;
2. 5–10 annonceurs locaux ;
3. 2–3 catégories Demand Exchange ;
4. 1–2 programmes ONG ;
5. tester willingness-to-pay ;
6. mesurer coût/support.

Chaque expérimentation :
- hypothèse ;
- métrique ;
- durée ;
- stop rule ;
- résultat ;
- décision.

---

# 40. UX publicitaire par rôle

Membre :
- publicité limitée ;
- pertinente ;
- masquable.

Responsable :
- House Ads outils de gestion ;
- offres fournisseurs utiles.

Annonceur :
- AdOps dédié.

Fondateur :
- vue inventaire/revenu/qualité/prospection.

Partenaire/ONG :
- sponsor programmes, pas ciblage membre.

---

# 41. Exemple d'accueil rentable

```
[Contexte groupe]
[Maintenant : 3 tâches]
[Situation / Groupe]
[Live / validations]
[EcoPulse]
[Carte sponsorisée native — 1]
[Communauté]
[Services Eco-System / House Ads]
```

Une bannière géante en haut réduirait l'utilité et donc la rétention ; elle est interdite comme défaut.

---

# 42. Anti-fraude économique

- idempotence ;
- dédup impression/action ;
- vitesse impossible ;
- Turnstile progressif ;
- bot signals ;
- leads expirés ;
- coupon unique ;
- double confirmation lorsque nécessaire ;
- litiges ;
- refund/credit audit.

Pas de score opaque « valeur d'une personne ».

---

# 43. Protection des données

Principe :
**monétiser la valeur créée, pas la donnée brute personnelle**.

Ads/Insights :
- agrégés ;
- finalité ;
- minimisation ;
- rétention limitée ;
- audit.

Aucune donnée financière individuelle dans un export annonceur.

---

# 44. Gouvernance de l'IA commerciale

L'IA peut :
- rédiger variantes ;
- résumer performances ;
- suggérer catégories de prospects ;
- proposer campagne.

Elle ne peut pas :
- cibler un individu vulnérable ;
- modifier budget réel sans autorisation ;
- publier un créatif sans contrôles ;
- promettre un rendement financier ;
- inventer une conversion.

---

# 45. Dashboard économique fondateur

Blocs :
- revenu par rail ;
- coûts ;
- marge ;
- quotas Cloudflare ;
- IA ;
- stockage ;
- Live ;
- AdOps ;
- Marketplace ;
- ONG ;
- abonnements ;
- impayés B2B ;
- incidents ;
- forecast.

Alertes :
- marge négative ;
- quota proche ;
- campagne anormale ;
- fournisseur litigieux ;
- coût IA explosif ;
- R2 croissance ;
- offre sous-pricée.

---

# 46. Roadmap économique

## E0 — maintenant
- cœur gratuit ;
- coûts ;
- AdManager sandbox ;
- House Ads ;
- CRM prospects ;
- Demand Exchange simulation ;
- programmes pilotes.

## E1
- deals ;
- coupons/QR ;
- reverse auction ;
- preuve conversion ;
- premières ventes pub manuelles.

## E2
- partenaires marchands ;
- réservation/acompte via partenaire qualifié ;
- Seller Pro.

## E3
- Partner/NGO SaaS ;
- Insights ;
- billing AdOps réel.

## E4
- marketplace multi-fournisseurs ;
- logistique ;
- produits financiers uniquement avec partenaires/réglementation.

---

# 47. Décisions à conserver

1. Cœur gestion/sécurité gratuit.
2. Monétisation d'abord B2B/B2B2C.
3. AdManager financement complémentaire, pas dépendance.
4. House Ads remplissent l'inventaire inutilisé.
5. Aucun ciblage individuel financier.
6. Prix = hypothèses jusqu'aux cohortes.
7. Mesurer attribution avant commission.
8. Coût variable visible dans Control Center.
9. Vidéo/IA lourde = quotas/packs si nécessaire.
10. Ne jamais transformer Eco-System en broker de données personnelles.

---

# 48. Definition of Done d'un rail économique

- proposition de valeur ;
- payeur ;
- bénéficiaire ;
- coût ;
- prix hypothèse ;
- contrat ;
- permissions ;
- privacy ;
- attribution ;
- facture ;
- remboursement/litige ;
- métriques ;
- anti-fraude ;
- support ;
- tests ;
- Control Center ;
- documentation ;
- sandbox ;
- pilote ;
- autorisation de passage réel.

---

# 49. Procédure de sauvegarde

Toute évolution économique significative :
`Cahier/Modèle → code → tests → Feature Registry → Current Truth → CI → BIR+ → déploiement/smoke si applicable`.

Les prix/stratégies abandonnés restent historisés avec leur raison.

---

# 50. Résumé opérationnel

Le modèle prioritaire est :
**gratuit utile → rétention → demande agrégée → fournisseurs/annonceurs/ONG/pros financent la valeur → utilisateur garde sa confidentialité**.

AdManager doit devenir une vraie régie, mais son avantage n'est pas de montrer le plus de publicités possible : c'est de connaître **le bon contexte collectif au bon moment**, de garder une expérience sobre et d'offrir aux annonceurs une attribution plus crédible grâce aux Deals, QR, réservations, actions internes et Demand Exchange.
