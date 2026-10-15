# CIR — réparation de la livraison visuelle et collaborative du 15 octobre 2026

## Déclencheur et vérité

Le fondateur signale sur la production 1.5.2.17 des saisies en attente, la disparition de la présence de frappe, un mode Réunion sans effet visible, des partitions trop larges, des modes Visuel/Senior peu distincts et des lignes démesurément hautes. Les tests de la livraison précédente ne prouvent pas ces scénarios terrain. FIELD_ACCEPTED reste NOT_ACCEPTED. La santé publique ne prouve pas une mutation D1 ni la convergence des comptes du fondateur.

## Références qui déterminent la réalisation

- AUDIT-ET-PROPOSITION-ECO-2026-10-14 : largeur mesurée, aucune rubrique perdue, identités et totaux stables, brouillon/focus conservés, modes distincts et cockpit compact.
- Réorganisation structure app Eco : accueil d'action, accès aux groupes, commerce, communautés, compétences et menus locaux ; les noms actuels et le Blueprint restent les autorités de vocabulaire.
- Guide Synchronisation/Confrontation : écriture, diffusion et contestation sont trois faits distincts ; Réunion/Hors réunion ne changent pas la valeur canonique ; aucune présence éphémère ne vaut confirmation financière.
- Deux conventions universelles : réutiliser les deux feuilles et le Ledger, jamais un second éditeur, solde ou moteur.

## Périmètre autorisé et propriétaires

Présentation : shell, modes par fenêtre, accueil et projections canoniques. Collaboration : transport RemoteBrowserApplication, coordination identity-live-ui, statut FinancialWork UI. Aucun schéma, migration, remplacement D1/R2, argent réel ou règle métier modifié. Les droits, la confrontation, les horodatages, l'idempotence et l'outbox restent sous leurs propriétaires actuels.

## Hypothèses à vérifier, pas conclusions terrain

Le délai de 2,2 secondes des écritures peut interrompre une réponse sur réseau lent. Le court-circuit réseau peut également retarder un nouveau ticket Live. Une frappe démarrée pendant la connexion du socket n'est pas rejouée ; l'affichage du brouillon peut masquer la présence. Les partitions actuelles équilibrent le nombre de rubriques sans mesurer leur largeur. Le stockage partagé des modes et les règles CSS communes réduisent leur distinction.

## Recette requise avant livraison

1. Deux comptes synthétiques distincts : frappe visible sans publier le montant non validé, validation convergente, reconnexion et rechargement ; Réunion avec état de connexion véridique.
2. Réponse d'écriture retardée au-delà de 2,2 s : aucune fausse panne ni double écriture ; conserver les contrôles métier existants.
3. 20/40/100 rubriques : couverture exacte de toutes les rubriques en parcourant les parties, totaux invariants, seules partitions qui tiennent proposées ; vues petites et grandes.
4. Modes indépendants par fenêtre, caractères/contrôles mesurés réellement différents ; cellule d'édition compacte et actions lisibles.
5. Captures de l'interface rendue, contrôles natifs et navigateurs Chromium/WebKit, garde-fous, sauvegarde vérifiée et déploiement au SHA exact. Une preuve synthétique ne devient pas une recette du compte Delor.

## État

La recette synthétique a reproduit une course : l'outbox prend aussi les commandes ajoutées pendant un envoi, mais la projection d'acquittement du shell ne traitait que son instantané initial. Le propriétaire Application émet désormais un événement interne pour chaque transition financière CONFIRMED après persistance ; la projection réutilise ses fonctions existantes, vérifie compte/groupe/version et refuse de masquer une intention locale plus récente. Aucun nouvel envoi ni seconde autorité. Un test comportemental conserve cette reproduction.

Réparation en cours ; aucune de ces hypothèses n'est déclarée corrigée ou déployée à ce stade. Relier chaque critère à son résultat dans le bilan de livraison.


## Qualification candidate observée — 15 octobre 2026

Source bccb12ca9c22eff866089555c47b6bdef8002bb1 : run 38810746007 SUCCESS, 732 tests natifs PASS, Chromium 15/15 et WebKit 6/6 PASS ; qualification indépendante Q01–Q28 38810745968 SUCCESS. La recette couvre aussi l'acquittement après envoi du mode, une réponse retardée de 3,1 s, toutes les parties 20/40/100, l'indépendance des modes et l'édition mobile. Les mesures de propagation Live normales observées sont 966/969/991 ms, sans polling financier au repos. Captures CI SHA256 5c63f952e18a72b14603fbac5893199dccbd5873ed04697c54bf1c6940604715.

PR 95 fusionnée sous d2f6b9537088794364b15f082e5db9b7ebb2da57. La publication n'est pas encore attestée à ce checkpoint : le marqueur déclenche à nouveau l'intégralité des contrôles, la sauvegarde et la livraison. FIELD_ACCEPTED=NOT_ACCEPTED.


## Livraison observée

Version 1.5.2.18 publiée au SHA 70e376d9524b4646b1756482f7d7bf2713e3925d. Livraison 38812599315 SUCCESS ; 732/15/6 PASS sur la source publiée, sauvegarde vérifiée et dix lectures publiques cohérentes. Voir DELIVERY-2026-10-15-WORKSPACE-REPAIR et le reçu JSON. FIELD_ACCEPTED reste NOT_ACCEPTED ; aucune acceptation du compte réel ni achèvement global de la vision prétendu.


## Contrôle complémentaire de continuité après bilan

Le run documentaire 38815229373 a révélé une mesure intermittente de défilement à zéro sur un wrapper remplacé pendant le rafraîchissement (la synchronisation financière du scénario avait passé ses contrôles). Le test utilise maintenant une résolution du wrapper courant et sa mesure dans le même tour navigateur ; il vérifie aussi explicitement une position horizontale non nulle après rechargement complet. Aucun seuil de convergence ni contrôle existant n'a été réduit.

Source de test 3b31c5b011b2809fd80e2ccedad0ff74c4a1f3d2 : [qualification 38816739897](https://github.com/Serge-As/urae/actions/runs/38816739897) SUCCESS, 732 tests applicatifs, Chromium 11/11 et WebKit 6/6 du workflow secondaire. La comparaison avec le SHA publié confirme que seuls les documents et ce test ont changé : code applicatif déployé inchangé. Les 15 scénarios Chromium du workflow de livraison restent attestés sur le SHA publié. L'échec initial est conservé, pas effacé par une relance aveugle.
