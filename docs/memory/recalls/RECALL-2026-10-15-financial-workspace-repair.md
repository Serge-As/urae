# Recall — régression signalée sur 1.5.2.17

Point de départ distant : 4c7e70244e816cf33d71fc8221011c4a5848ee24 ; production runtime : af08c4bc26a5f7511b9092cc5a9bf6c0927a5766. Branche de réparation : codex/repair-financial-workspace-20261015.

Lire CIR-2026-10-15-financial-workspace-repair avant toute reprise. Les captures du fondateur invalident une acceptation globale de la refonte. Ne pas confondre tests passés, catalogue de capacités, santé publique et recette des parcours réels. Les sources synchronisées restent en lecture seule. Aucune navigation protégée bloquée ne doit être contournée. Qualifier sur données synthétiques isolées ; déployer uniquement par la procédure de sauvegarde et de qualification existante.

## Reprise après livraison vérifiée

Production courante : 1.5.2.18-workspace-repair, source 70e376d9524b4646b1756482f7d7bf2713e3925d, run 38812599315 SUCCESS ; native732, Chromium15, WebKit6 PASS. Sauvegarde restaurée/R2 vérifiée. Dix lectures publiques indépendantes concordent à22:06:31UTC le15octobre. Lire docs/release/DELIVERY-2026-10-15-WORKSPACE-REPAIR.md et CONFORMANCE avant toute nouvelle modification. La course des ACK a été reproduite puis corrigée ; aucun test ni garde-fou retiré. FIELD_ACCEPTED=NOT_ACCEPTED ; ne pas transformer ces preuves en acceptation du compte Delor ou de toute la vision. Ne pas réécrire les données ni purger l’outbox pour cacher un état en attente.


## Contrôle complémentaire de continuité après bilan

Le run documentaire 38815229373 a révélé une mesure intermittente de défilement à zéro sur un wrapper remplacé pendant le rafraîchissement (la synchronisation financière du scénario avait passé ses contrôles). Le test utilise maintenant une résolution du wrapper courant et sa mesure dans le même tour navigateur ; il vérifie aussi explicitement une position horizontale non nulle après rechargement complet. Aucun seuil de convergence ni contrôle existant n'a été réduit.

Source de test 3b31c5b011b2809fd80e2ccedad0ff74c4a1f3d2 : [qualification 38816739897](https://github.com/Serge-As/urae/actions/runs/38816739897) SUCCESS, 732 tests applicatifs, Chromium 11/11 et WebKit 6/6 du workflow secondaire. La comparaison avec le SHA publié confirme que seuls les documents et ce test ont changé : code applicatif déployé inchangé. Les 15 scénarios Chromium du workflow de livraison restent attestés sur le SHA publié. L'échec initial est conservé, pas effacé par une relance aveugle.
