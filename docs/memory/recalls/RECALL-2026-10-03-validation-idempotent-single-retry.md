# RECALL — 2026-10-03 — Réessai idempotent lié à la validation

Le P0 Chromium a montré que la correction 1 000 → 500 pouvait être affichée comme « synchro en attente » après un transport transitoire, laissant le Ledger à 1 000.

Correction : la même action de validation peut effectuer un seul réessai avec la même clé d'idempotence. Il n'existe aucun timer, polling ou boucle. Si le disjoncteur quota D1 est ouvert ou si le navigateur est réellement hors ligne, le réessai est supprimé et la commande reste en Outbox.
