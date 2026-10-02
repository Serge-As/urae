# RECALL — 2026-10-02 — Free conservation, dettes et offline

Base figée: `0fb770adcf1e8015b6862c6d448e5ccbc74c4c77`.

## Retour terrain pris en compte
- quota D1 gratuit épuisé en quelques minutes ;
- données pouvant disparaître temporairement après rafraîchissement ;
- rôle gestionnaire pouvant être perdu en projection dégradée ;
- dettes affichées à zéro alors que le moteur Épargne connaissait du capital prêté ;
- rubrique Remboursements historique absente ;
- Live/polling trop coûteux pour le palier gratuit.

## Décision
Le palier gratuit devient explicitement **offline-first / conservation**:
- pas de polling financier automatique ;
- Live WebSocket et présence frappe/brouillon gelés derrière `FREE_CONSERVATION_MODE` ;
- synchronisation ponctuelle/manuelle ;
- code Live conservé pour réactivation future ;
- disjoncteur client après 429/503/504 afin d'éviter de marteler D1 ;
- dernier rôle gestionnaire connu conservé localement ;
- Remboursements rétabli comme rubrique officielle, créable/restaurable offline ;
- dettes reconstruites depuis objets Loan, feuilles historiques et paiements ;
- intérêt NEXT_SESSION_DUE dérivé pour la vue dette lorsque le serveur n'a pas encore matérialisé la période.

## Garde-fous
Aucun déploiement Cloudflare ni test production tant que le quota D1 est épuisé. Les tests du lot doivent utiliser CI locale/GitHub uniquement.
