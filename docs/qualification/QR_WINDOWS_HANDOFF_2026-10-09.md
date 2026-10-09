# Reprise du diagnostic QR Windows — 9 octobre 2026

La source testée reste `a7c333699dad0d70cf0de8e2f8a841a00396d0d7`. Cette branche de preuves ajoute des fichiers documentaires ; son HEAD ne devient pas une source qualifiée.

Le résultat Windows transmis par le fondateur est conservé dans `WINDOWS_SOVEREIGN_CHROMIUM_2026-10-09.json` : 6 scénarios réellement exécutés, 5 réussites, 1 délai QR dépassé, aucun saut. Le vrai DataChannel Eco Local Room et les callbacks A01 réussissent sans distribution Ubuntu locale.

Le Cloud a examiné les fichiers exacts par le connecteur GitHub. Son nouvel exécuteur s'est déconnecté avant de créer un processus : `environment_offline`. Il n'a exécuté ni le QR ciblé ni une comparaison Worker. Cette indisponibilité ne change pas les résultats antérieurs : 657 tests Node et 8 Chromium réussis, WebKit 4 réussis / 2 échecs réels dus à l'absence de candidats ICE dans cet environnement.

`qr-passive-windows-diagnostic.mjs` reprend le diagnostic préparé par le Cloud et revu par le parent. Il doit être copié par Git dans `work/` du checkout Windows a7 déjà construit, puis contrôlé avec `node --check` avant tout lancement. Le parent ne peut pas exécuter Node actuellement. Une analyse syntaxique du corps JavaScript a réussi ; elle ne remplace pas le contrôle ESM par Node.

Le script observe deux fenêtres de 30 secondes : le vrai chemin automatique du SDK, puis son vrai Worker embarqué avec l'option existante `qrEngine`. Il enregistre les imports, le chargement SVG, la création du moteur et les appels natifs sans remplacer leurs résultats. Le rapport reste `qualified=false`. Aucun délai du test original, code produit, dépendance ou moteur financier n'est modifié.

Le rapport est écrit directement dans le dossier outputs demandé ; aucune copie récursive des longs chemins navigateur n'est nécessaire. Aucun téléchargement de navigateur ni achat. L'origine locale, le processus serveur et la SQLite synthétique sont propres au diagnostic. La publication reste HOLD.
