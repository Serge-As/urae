# Reprise des six lots de l’audit

Le fondateur autorise l’implémentation complète et demande sobriété des crédits. Réutiliser v43 et ses moteurs, ne pas refaire l’audit des archives. Voir CIR-2026-11-01-SIX-LOTS.md et ARCHITECTURE_COMPACTE.md. Les chiffres de performance de l’audit sont des objectifs à mesurer. Chaque lot garde ses critères de non-régression. État initial IN_PROGRESS ; aucune nouvelle livraison attestée.

Sources des six lots implémentées ; 33 tests ciblés réussis. Ne pas redemander GitHub : GCM acquis. Prochaine étape : qualification exacte puis sauvegarde/index/déploiement/publication des reçus.

## Checkpoint de qualification du 1 novembre

La réponse et le record de correction conservent désormais un booléen de revue défini (repli conservateur pour les notices historiques). Le marqueur vérifie le mode à deux index autorisés, sauvegarde privée restaurée et relue requise. TypeScript corrigé réussi localement. Le run 41299482396 a refusé le checkpoint précédent faute de note CIR/Recall dans sa différence immédiate ; ces notes sont consolidées ici sans réduire le contrôle. Aucun déploiement de cette candidate ; les preuves finales doivent concerner le nouveau SHA complet.

Qualification complète native du checkpoint 6f79dfad : 1084/1086 réussis, aucun ignoré ; deux attentes textuelles historiques étaient devenues obsolètes (libellé de saisie personnelle et nom du marqueur sans migration). Les tests conservent leurs parcours et droits ; les attentes sont mises à jour pour le libellé approuvé et renforcées sur le délai non bloquant, le marqueur de version, la liste SQL stricte et l’ordre sauvegarde restaurée → index → Worker. Aucun scénario acquis supprimé ni désactivé.

Régression de présentation reproduite sous WebKit (run 41299755731) : les priorités au-dessus des chiffres plaçaient la caisse à 1009 px sur téléphone, au-delà du contrat acquis de 900 px. La liste complète des alertes est désormais placée juste après les repères financiers dans leur carte. Aucune alerte critique, action, montant ou destination retiré ; le seuil historique reste inchangé. Les 20 tests des deux contrats textuels corrigés passent localement.
