# CHECKPOINT — 2026-10-09 — route gratuite Codespaces préparée

## Autorisation et état constaté
Le fondateur demande de poursuivre rapidement avec les forfaits gratuits, sans Ubuntu sur son PC. GitHub Actions a épuisé ses 2 000 minutes gratuites selon son retour. Le solde Codespaces n'est pas établi : son dernier retour est « ça n'affiche pas exactement ce qu'il y a. Peut-être qu'il y en a encore ou pas ». Cela n'autorise aucune dépense.

La voie préparée utilise un Codespace Linux personnel de deux cœurs avec l'image par défaut, sans prebuild. Ce n'est pas un runner Actions enregistré. Aucune machine n'a été créée ou démarrée, aucun budget ni moyen de paiement n'a été modifié. La création reste conditionnée à la confirmation du calcul/stockage gratuits disponibles et au blocage de toute dépense payante.

## Source et preuves conservées
Source candidate gelée : `a7c333699dad0d70cf0de8e2f8a841a00396d0d7`, arbre `0c75c80833d78c807cc2fbef082b06f9c0c6aa7f`.
- Cloud : 657/657 Node, Chromium 8/8 ; WebKit 4/6, deux échecs WebRTC sans candidats ICE. Qualification globale FAIL.
- Windows : six scénarios souverains exécutés sous Chromium, 5 PASS / 1 FAIL ; Local Room et callbacks A01 réels passent ; QR échoue au délai original de 30 secondes. Cause du QR non prouvée.
- Aucun de ces résultats ne vaut qualification globale de la candidate. Publication HOLD conservée ; aucune nouvelle archive qualifiée.

## Préparation vérifiable et prochaines opérations
Le dossier `docs/qualification/free-codespaces/` contient le contrôleur, son bootstrap et la procédure. Aucun test applicatif n'est modifié. Le contrôleur réutilise le qualificateur canonique existant, vérifie d'abord un véritable échange WebKit puis le QR Chromium, et n'exécute la qualification complète qu'après ces précontrôles. Il conserve les échecs, les délais et le lockfile ; aucune exclusion de test ni simulation d'un DataChannel réussi.

Le contrôleur publie les résultats réels dans une nouvelle branche `evidence/free-linux-...` ; il ne déplace aucune branche produit et ne déploie rien. Le poste ne peut actuellement lancer aucune commande Codex ni navigateur automatique (« setup refresh had errors »). Le texte du contrôleur a été relu et son corps JavaScript analysé dans V8 ; ni `node --check`, ni `bash -n`, ni les nouveaux scripts ne sont exécutés à ce stade. La qualification Linux future ne démontrera pas à elle seule que le QR Windows historique est réparé.

À la reprise : lire ce checkpoint, vérifier visuellement les conditions de gratuité, créer uniquement alors le Codespace personnel de deux cœurs, charger les deux fichiers depuis le commit documentaire exact et effectuer le lancement unique. Arrêter la machine après sauvegarde des résultats. Si les précontrôles échouent, examiner leurs preuves avant toute répétition des 657 tests. Ne pas acheter de minutes Actions, activer de budget payant, ou ouvrir un autre service sans nécessité nouvelle.
