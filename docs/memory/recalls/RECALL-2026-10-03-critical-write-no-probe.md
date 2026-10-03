# RECALL — 2026-10-03 — Écriture critique sans probe préalable

Base : `d72b0493345494c41c33c5d788ab79dc40a6a7d6`.

Le contrôle P0 post-fusion a observé un cas où l'interface passait de 1 000 à 500 alors que le Ledger restait à 1 000. Le chemin d'écriture pouvait faire un GET `/auth/session` préalable lorsqu'une lecture précédente avait utilisé une projection locale.

Décision : supprimer ce GET. Une écriture financière en ligne est désormais sa propre sonde de connectivité. Si elle réussit, elle confirme le Ledger ; si elle échoue pour cause réseau/quota, l'Outbox conserve la commande exacte. Aucun polling ni probe D1 supplémentaire n'est ajouté.
