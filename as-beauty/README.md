# As Beauty

> **Permettre à une personne de trouver rapidement le bon professionnel, au bon endroit, au bon moment, pour le bon service et à un prix clairement négocié.**

> **Puis, autour de cette expérience client, fournir aux professionnels tous les outils nécessaires pour gérer leur activité, leurs clients, leurs employés, leurs stocks, leurs fournisseurs, leur caisse et leur développement.**

As Beauty est un moteur de recherche, une marketplace et un système d'exploitation pour la beauté, les soins corporels et le bien-être au Cameroun. Le noyau 0.1.0 est une PWA cash-first avec :

- recherche tête-aux-pieds ;
- catalogue services, produits, formations et professionnels ;
- disponibilité immédiate ou planifiée ;
- réservation sans paiement obligatoire ;
- fidélité simple ;
- Beauty Trends photo léger ;
- Mission Sécurisée minimale pour les prestations à domicile ;
- cockpit professionnel initial ;
- API Cloudflare Worker et schéma D1 de départ.

## Limite importante

As Beauty réutilise des **idées fonctionnelles publiques** observées chez Booksy, Fresha, Vagaro, Mindbody, Zenoti, Phorest, SQUIRE, GlossGenius, Treatwell, StyleSeat, Boulevard et Urban Company. Aucun code, logo, texte, écran ou actif propriétaire n'est copié.

La simulation cutanée est une prévisualisation esthétique, jamais une prédiction médicale ou une garantie de résultat. Les promesses du type « traite tous les problèmes de peau », « fait perdre du poids » ou « augmente une partie du corps » exigent une classification et des preuves adaptées ; elles ne sont pas publiées comme faits par défaut.

## Démarrage

```bash
npm test
npm run validate
npm run build
npm run dev
```

Ouvrir ensuite `http://localhost:4173`.

## Structure

- `apps/pwa` : PWA client + professionnel ;
- `workers/api` : API Cloudflare Worker sans dépendance ;
- `db/migrations` : schéma D1 additif ;
- `docs` : Cahier Maître et politiques ;
- `governance` : vérité du projet et garde-fous ;
- `research` : matrice concurrentielle ;
- `backup` : archive reconstructible complète.

## État

Version : `0.1.0-bootstrap`  
Argent réel automatisé : `false`  
Mobile Money : adaptateurs réservés, non activés  
IA générative : non activée
