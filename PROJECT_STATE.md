# ECO-SYSTEM — PROJECT STATE

Date : 2026-09-16

## Production publique
- ligne qualifiée : `1.2.0-functional-completion`
- URL : `https://eco-system.sergemimf.workers.dev/`
- Worker : `eco-system`
- D1 canonique : `eco-system-db`
- argent réel : désactivé.

## Développement courant
- branche : `next/1.3.1-recovery-recap-services-20260915`
- base 1.3 auditée : `ffee0901720b453167783868c10a59a484c61677`
- ne pas revenir à 1.2 pour continuer le développement.

## Premium Live
Pilote isolé qualifié :
- run : `35018989303` SUCCESS ;
- Worker : `eco-system-live-pilot` ;
- D1 : `eco-system-live-pilot-db` ;
- preuve : écriture Ledger → outbox → avis membre → DO → Live ;
- replay >500 ;
- aucune activation argent réel.

## Fonctionnalités 1.3.1 qualifiées
- 10 étapes création ;
- Collation ;
- multi-tontines ;
- RubricDefinition + policies ;
- assistant RI contradictions/policy drafts ;
- Tontine Manager ;
- pot avec preuve Ledger ;
- savings-yield exact par dépôt ;
- RECAP financier/session/carryover ;
- caisse Secours par membre et fonds Projet reportables ;
- CNI HMAC matching ;
- profil économique groupe/rubrique pseudonymisé ;
- AdManager ;
- demand aggregation/supplier ranking/unit economics ;
- Partners/ONG spécialisés ;
- Forum/communautés et Marketplace antérieurs conservés.

## Documents maîtres
- `docs/constitution/ECO_SYSTEM_Cahier_des_Charges_Maitre_Exhaustif_3.0.0_2026-09-16.md`
- `docs/economics/ECO_SYSTEM_Modele_Economique_AdManager_Intelligence_3.0.0_2026-09-16.md`

## Invariants
- D1 canonique unique ;
- pas de migration destructive ;
- pas de finance individuelle dans AdManager/partenaires ;
- OFF explicite > BETA_OPEN ;
- pas d'intérêt sur intérêt ;
- `realMoneyEnabled=false` ;
- aucun merge/force-push main sans décision séparée.

## Prochain jalon
Consolider UX RECAP/Cassation, Deals/Négociation/Demand Exchange, Analytics/Economic Control Center et tests terrain, puis seulement préparer une livraison publique 1.3.1 avec autorisation explicite.
