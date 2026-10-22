## L06/L07/L08/L09 et I11/I13 publiés et vérifiés — 22 octobre 2026

Production **1.5.2.33-financial-explanations**, source `dc3e285bdeac1c6f0ce5376d457ccf52826945d8`, Worker `9043380f-e8e1-4b14-9d60-a9c7af40c28b`. Livraison [39860843689 SUCCESS](https://github.com/Serge-As/urae/actions/runs/39860843689) : **979 tests natifs, 54 Chromium, 6 WebKit**, sans échec ni ignoré. Les **41 empreintes publiques** concordent avec la compilation de livraison et leur relecture indépendante. Preuve : `docs/release/evidence/FINANCIAL-EXPLANATIONS-PUBLIC-2026-10-22.json`.

Qualification indépendante39860843716 : **SUCCESS, tentative2, même source**. La première tentative avait été interrompue après45minutes ; son état est conservé dans les preuves. La relance est terminée, sans modification applicative ou relâchement des assertions.

Accès : **Finances → Comprendre mes finances · preuves et scénarios**. Rapprochement des mouvements Ledger et chaînes de corrections ; filtres et export de la lecture autorisée. Prêts : politique effective, périodes, capital et intérêts séparés, aperçu refusé si son empreinte est caduque. Épargne : copies de calcul déclarées, reproductibles avec empreinte, provenance et arrondis exacts. Tontines et solidarité : engagements personnels autorisés, preuve Ledger relue et scénario hypothétique de retard/rattrapage. Aucune commande financière supplémentaire.

Limites : mouvements/export par page100 ;20clôtures récentes ; copie de calcul1000dépôts/120coefficients ; prêts1à24périodes ; tontines1à120tours ;XAF seulement. Absence d'entrées historiques signalée sans reconstitution fictive. Une cotisation ne décrit pas tout le patrimoine ; une simulation ne prouve ni accord ni paiement. Aucun nouveau polling, service payant, schéma, migration, effacement d'outbox ou rotation de signature.

Sauvegarde D1 en lecture seule, restauration50tables avec intégrité et clés étrangères ok ; archive privée R2 relueSHA256 `7089ee1b7dbf1c17c5a31bcd425f8a6f2b3cdd7f4bcc8fcf204f9dcb702717c8`. Source exacte récupérée :866empreintes Git et modes vérifiés ; ZIP SHA256 `9b47fb8d7679d7fad1f43bb0b136fa165e6615202f3a033fe199d8cda7cac80f`. Ledger/D1 conserve l'autorité financière ; `realMoneyEnabled=false`, `FIELD_ACCEPTED=NOT_ACCEPTED`.

BIR+ / **ÉTAT DU PROJET APRÈS ÉTAPE** : **19lots publiés dans leurs périmètres documentés**. Restent14,15,16,17,18,19,22,26,27, puis les compléments des propositions des lots acquis. Le rapprochement des92propositions aux28lots est contrôlé ;44références techniques ou modèles ne sont pas44dépendances automatiquement installées. Le groupe14–19 est en travail local, non encore publié. Aucun redémarrage du PC exécuté par ce chantier ; toute commande de redémarrage exige l'autorisation explicite. Consommation exacte de crédits non mesurable.

## Périmètre initial conservé

# CIR — L06/L07/L08/L09 : explication financière et simulations

Autorisation : poursuite explicite du fondateur, lots similaires regroupés, 92 propositions et innovations intégrées au programme. Base publiée v32, source 3661a369620e4c881b1342f826071431af53458a ; HEAD distant 8121698e4874ece94185af3e64eaa38840450076, descendant ne modifiant que le marqueur de livraison. La clôture documentaire locale v32 est conservée.

Propriétaires réutilisés : LedgerService pour les soldes, mouvements et relevés ; CompletionSuite pour les prêts et cycles/parts ; moteur de prêt existant pour les calculs ; moteur SavingsYield pour les répartitions ; clôture d’exercice pour les enveloppes déjà arrêtées. Le nouveau module est une projection autorisée en lecture et un adaptateur de simulation. Il ne possède aucun solde, taux opérationnel, ordre de remboursement ou distribution.

Périmètre : décomposition et filtres de mouvements confirmés, contre-écritures et rapprochement ; frise de prêt et comparaison conditionnelle I11 ; copie de calcul d’épargne exportable avec provenance et vérification ; enveloppes de clôture sans nouvelle distribution ; tours et obligations autorisés, résistance hypothétique I13 sans déplacer les tours. Rattachement exhaustif des 92 propositions aux 28 lots avec critères de recette, sans déclarer tous les outils installés.

Risques indirects : lectures historiques D1, confusion entre sommes en attente et confirmées, exposition de données d’autrui, simulation interprétée comme un paiement, affichage d’un ancien aperçu après changement de règle ou de compte. Réponses : chargement à l’ouverture ou sur action ; aucune boucle ; contrôles de droits côté serveur ; compteur local séparé ; génération de contexte ; empreinte de l’état/politique pour refuser l’aperçu caduc ; provenance explicite des calculs déclarés. Une empreinte de contenu n’est pas une certification de résultat financier.

Les endpoints et commandes financiers acquis, les deux feuilles, outbox, Live, les signatures et propriétaires D1/R2 sont conservés. Aucun nouveau stockage, migration, dépendance, service payant ou argent réel. Un changement de langue ou de groupe doit préserver les saisies du contexte légitime ou effacer les données privées selon le changement ; aucune donnée privée de l’ancien compte ne réapparaît.

Recette : mémoire et SQLite/D1 ; idempotence/annulation acquises ; sommes de contrôle ; droits membre/gestionnaire/tiers ; refus de contexte caduc ; invariance du Ledger et workspace avant/après les simulations ; arrondis exacts et contrôle d’un export altéré ; référence calendrier inchangée après simulation ; navigateur ordinateur/mobile/FR/EN/offline ; mêmes SHA des gates et livraison puis empreintes publiques. Correction ciblée du test Business Studio : attendre sa lecture initiale avant de mesurer zéro requête au repos.

Repli : désactiver les seuls nouveaux panneaux/lectures ; aucun mouvement ni schéma ajouté à reprendre. Ne pas revenir aveuglément en amont de v32, qui protège les retraits fermés et journaux de pilotes. FIELD_ACCEPTED=NOT_ACCEPTED ; crédits exacts non mesurables. Aucun redémarrage du poste sans autorisation explicite.

## Qualification locale finale : ordonnanceur de travail

Les3nouveaux scénarios Chromium ont réussi sur la première compilation. L'essai suivant de Business Studio a perdu le jeton de fenêtre pendant que la compilation finale remplaçait la copie locale `.build` servie au navigateur. La collision de travaux rend cet essai non concluant pour l'application ; son rapport d'échec est conservé. Requalification après fin de compilation, sans modifier les assertions ni les droits de production. Les tests complets, la livraison et les empreintes publiques doivent ensuite porter sur le même SHA. Aucun redémarrage du poste, suppression de données utilisateur ou contournement de contrôle.
