# ECO-SYSTEM — Implémentation consolidée 1.5.2
## UX unifiée · Finance canonique · PWA cohérente · Blueprint 5.0.0
Date : 23 septembre 2026

## 1. Objet
Cette release reprend en un seul lot le chantier 1.5.1 abandonné et le consolide sans créer de moteurs concurrents. Elle préserve les owners canoniques de la production 1.5.0 et les capacités déjà implémentées (Group Core, Launch/Kit, Business Studio, Marketplace, Value Network, Referral, Knowledge/Academy, Control Center, Community/Blueprint), tout en corrigeant les défauts terrain observés.

Règle : **réutiliser → étendre → adapter → créer seulement si aucun owner canonique ne couvre le besoin**.

## 2. Base et branche
- Base fonctionnelle : `fix/1.5.1-canonical-financial-tables-kit-business-20260923` au SHA `0c29e7a80c40bf8887a901e7439c2ea928d99ce6`.
- Branche de consolidation : `release/1.5.2-unified-ux-blueprint-20260923`.
- Cible d’intégration : `next/1.5.0-audit-complete-platform-20260923`.
- Argent réel : **OFF**.
- D1 canonique : **eco-system-db**, à réutiliser.
- R2 canonique : **eco-system-backups**, à réutiliser.

## 3. Owner financier unique
La feuille de séance et les fiches individuelles utilisent le même renderer `renderCanonicalFinancialTable` dans `apps/web/src/main.js`.
Une cellule :
1. affiche la valeur totale courante ;
2. permet une valeur cible ;
3. valide avec ✓ ;
4. délègue à `Application.setFinancialCellTarget()` ;
5. passe par `/meetings/:meetingId/financial-cells` ;
6. conserve version, idempotence, consensus et revue indépendante ;
7. ne fait jamais une addition implicite lors d'une correction.

Les totaux sont calculés par ligne, par colonne et en total général. Les autres surfaces peuvent demander le renderer via `eco:render-canonical-financial-table`, mais ne recréent pas de moteur de matrice.

## 4. Correctif du retour de l'ancien tableau
Cause identifiée : le Service Worker 1.5.1 conservait l'identité de cache 1.5.0 et pouvait résoudre une URL versionnée via un asset non versionné avec `cache.match(url.pathname)`.

1.5.2 :
- cache : `eco-system-v152-unified-ux-blueprint-20260923` ;
- rollback cohérent : cache 1.5.0 conservé comme précédent ;
- `main.js?v=152`, `ui-modes.js?v=152`, `styles.css?v=152` sont des entrées exactes ;
- une requête avec query/version ne retombe plus sur un fichier non versionné ;
- installation du shell essentiel reste atomique ;
- aucun reload forcé pendant une session active.

## 5. Trois modes d'utilisation — même métier
Le choix est visible tout en haut de l'Accueil et persiste localement sous `eco.uiMode`.

### Visuel
Interface moderne, cartes plus aérées, hiérarchie visuelle et interactions soignées. Aucun changement de règles métier.

### Senior
- typographie agrandie ;
- line-height renforcé ;
- contrôles tactiles >= ~52 px ;
- ✓ financier agrandi ;
- navigation et tableaux plus lisibles ;
- suppression du cassage agressif des mots ;
- scroll horizontal local des grands tableaux ;
- première colonne / en-têtes collants.

### Assisté / Dictée
- gros contrôles ;
- accès prioritaire à la dictée financière existante ;
- textes d'aide plus directs ;
- dictée = proposition/transcription, jamais validation financière silencieuse ;
- même owner financier et mêmes permissions que les deux autres modes.

Aucun mode ne possède son propre Ledger, ses propres rubriques, ses propres calculs ou ses propres routes.

## 6. Authentification et rafraîchissement
Avant 1.5.2, une session serveur pouvait être invalide après 30 minutes d'inactivité alors que son cookie était encore valide plusieurs heures. Au rafraîchissement, l'utilisateur pouvait donc revenir à la connexion.

1.5.2 :
- écran transitoire explicite « Restauration sécurisée de votre session… » ;
- la page de connexion n'apparaît qu'après résolution de l'état de session ;
- session normale : 8 h et fenêtre d'inactivité adaptée ;
- option volontaire « Cet appareil est privé » : session longue durée (30 jours), révocable par déconnexion, avec fenêtre d'inactivité dédiée ;
- aucune permission métier n'est ajoutée par ce choix ;
- le mode local/offline reste séparé de la session serveur.

## 7. Ergonomie
Les règles 1.5.2 corrigent notamment les libellés comprimés dans Membres/navigation :
- `overflow-wrap: normal` pour les labels d'interface ;
- `word-break: normal` ;
- zones tactiles augmentées ;
- actions pouvant revenir à la ligne ;
- tableaux enfermés dans leur propre conteneur de scroll au lieu d'élargir toute la page ;
- design responsive 320/360/390 px à qualifier en recette réelle.

## 8. Kit, Business Studio et Blueprint
Cette release conserve et consolide le chantier 1.5.1 plutôt que de le remplacer :
- Kit prêt à l'emploi / Launch Studio ;
- Business Studio et séparation finance privée/collective ;
- boutique virtuelle via Marketplace ;
- fournisseurs / approvisionnement / crédit ;
- Value Network et matching ;
- Referral et budget ;
- Knowledge / Academy ;
- Control Center ;
- Community/Blueprint 5.0.0.

Leur présence en code n'autorise pas à les marquer `FIELD_ACCEPTED`. Les capacités encore `STRUCTURAL_V1` ou `FUNCTIONAL_BETA` conservent ce statut jusqu'à preuve plus forte. Le présent lot interdit seulement leur duplication et consolide leurs contrats communs.

## 9. Qualification
Gates obligatoires :
- typecheck ;
- architecture fitness ;
- shared governance ;
- constitution ;
- project truth ;
- memory/index/source coverage ;
- build ;
- tests historiques ;
- tests 1.5.2 UX/PWA/session/finance ;
- puis, séparément, BIR+, déploiement du même SHA, smoke et recette terrain.

Tests 1.5.2 ajoutés :
- présence et position des trois modes ;
- persistance stricte des modes ;
- ergonomie Senior ;
- dictée assistée ;
- cache PWA exact ;
- interdiction du fallback asset versionné → asset obsolète ;
- restauration de session ;
- session appareil privé ;
- owner financier unique et revue indépendante.

## 10. Non-régression
À ne pas modifier/supprimer :
- Ledger canonique ;
- MeetingService ;
- Rubrics/Living Rules ;
- consensus financier ;
- historique et contrepassation ;
- multi-tontines ;
- parcours création 10 étapes ;
- RECAP ;
- prêts/intérêts ;
- IndexedDB/outbox ;
- D1/R2 existants ;
- Community/Forum/Live ;
- `realMoneyEnabled=false`.

## 11. Preuve de fin
Cette release devient :
- `CI_QUALIFIED` uniquement après CI verte au HEAD exact ;
- `DEPLOYED` uniquement après déploiement du même SHA ;
- `SMOKE_VERIFIED` après smoke distant ;
- `FIELD_ACCEPTED` uniquement après test réel par le fondateur/appareils cibles.

Aucun de ces états ne doit être déduit d'un bouton ou d'un document.
