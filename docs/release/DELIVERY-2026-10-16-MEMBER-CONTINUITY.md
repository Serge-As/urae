# BIR+ — Continuité financière membre, 16 octobre 2026

Statut : candidate1.5.2.19-member-continuity. Pas encore de preuve de livraison19. Production attestée18/70e376d conservée.

## Demande et propriétaires

Le clic sur toute cellule d'un autre membre doit ouvrir immédiatement la synthèse précédente, avant la saisie suivante. FinancialWork UI orchestre la décision ; Application/outbox rend validations et clôture durables. L'approbation indépendante appartient à MeetingLiveConsensus, la projection à MemberEnvelope. Completion et Ledger restent les propriétaires du prêt et du cash ; Receivables porte les obligations dues et leurs allocations. Rubrics et TONTINE_SHARE portent participation et parts. Aucun second moteur financier, aucune migration, aucune activation d'argent réel.

## Changements et garanties

- Dialogue immédiat sur clic et focus clavier ; attente des soumissions précédentes, retour sans effacement, continuation après persistance. Les nouveaux montants ne sont pas absorbés par le dialogue du membre précédent.
- Alerte d'approbation restaurée après rechargement, approbation pour montant/version exacts, nouvelle modification de nouveau signalée. Une réserve reste visible. La confrontation critique reste accessible ; aucune lecture de snapshot n'est ajoutée au fil Live au repos.
- Limite de remboursement égale au capital restant, intérêts dus et obligations légitimes exigibles. Les intérêts futurs sont exclus ; aucun encaissement après apurement, aucun écrêtage silencieux d'un surplus. Une intention stable est répartie par les moteurs canoniques et rejouée avec ses clés stables.
- Tontine association : nonparticipant refusé ; groupe rotatif pur : participation par défaut sauf déclaration explicite. Deux parts100 donnent200 par séance ; séance7 total1400, quatre séances payées800 donnent600 à rattraper. Paiements partiels et avances explicites sont distingués. Une avance déjà encaissée ne crée aucun nouveau cash à la séance couverte.
- Mes tontines rotatives utilise la liste autorisée existante. Le portefeuille de prêts peut afficher deux parties, identité conservée et actions inchangées. Les colonnes ont des largeurs minimales lisibles et les actions sont alignées horizontalement.

## Qualification en cours

3293643 : compilation réussie ;13/17 Chromium. 4c88506 :734/738 tests natifs et16/17 Chromium. Les nouveaux essais de synthèse et revue persistante passent ; trois défauts de priorité/lecture d'alertes corrigés. Cause du remboursement : fallback de taux annuel optionnel évalué sans valeur ; correction préparée. Trois anciens tests structurels sont adaptés aux délégations vers l'unique moteur, avec garanties conservées et tests de remboursement réels ajoutés. Aucun délai financier n'est allongé, aucun test retiré.

Qualification finale, reçu de sauvegarde et preuve publique seront enregistrés après exécution. Les scénarios utilisent des comptes synthétiques sur serveur isolé ; aucune attestation du compte Delor, de son groupe manquant ou d'absence absolue de défaut. FIELD_ACCEPTED=NOT_ACCEPTED. Coût exact de crédits non disponible.

## ÉTAT DU PROJET APRÈS ÉTAPE

Implémentation19 candidate ; qualification et publication en cours ; production18 reste dernière preuve. Ne pas redémarrer la refonte, ne pas recréer de groupe ni purger l'outbox. Continuer la qualification puis la livraison sauvegardée sur le même SHA.
