const byId=id=>document.getElementById(id);
const t=(fr,en)=>document.documentElement.lang==='en'?en:fr;

const HUBS={
  main:{titleFr:'Forum principal du groupe',titleEn:'Main group forum',aboutFr:'Espace général : vie du groupe, décisions, échanges et sujets transversaux.',aboutEn:'General space for group life, decisions, exchanges and cross-cutting topics.',tags:'groupe, communauté, général'},
  opportunity:{titleFr:'Opportunités du groupe',titleEn:'Group opportunities',aboutFr:'Besoins, opportunités, entraide économique, projets et mises en relation utiles.',aboutEn:'Needs, opportunities, economic support, projects and useful connections.',tags:'opportunités, besoins, projets'},
  market:{titleFr:'Marché & besoins',titleEn:'Market & needs',aboutFr:'Demandes, offres, achats groupés, fournisseurs et besoins concrets des membres.',aboutEn:'Requests, offers, group buying, suppliers and concrete member needs.',tags:'marché, offres, demandes, achats groupés'},
  skills:{titleFr:'Compétences · emploi · services',titleEn:'Skills · jobs · services',aboutFr:'Compétences disponibles, services, formation, emploi et collaborations.',aboutEn:'Available skills, services, training, jobs and collaborations.',tags:'compétences, emploi, services, formation'},
  agri:{titleFr:'Agriculture · production · commerce local',titleEn:'Agriculture · production · local commerce',aboutFr:'Récoltes, disponibilités prochaines, besoins, transformation, stockage, points de retrait et débouchés.',aboutEn:'Harvests, upcoming availability, needs, processing, storage, pickup points and outlets.',tags:'agriculture, récolte, production, commerce local'},
  news:{titleFr:'Actualités sourcées & tendances',titleEn:'Sourced news & trends',aboutFr:'Informations, tendances et buzz avec distinction claire entre source vérifiée, opinion et contenu non vérifié.',aboutEn:'News, trends and buzz with a clear distinction between sourced information, opinion and unverified content.',tags:'actualités, sources, tendances, buzz'}
};

const POSTS={
  need:{kind:'REQUEST',prefix:'[BESOIN] ',bodyFr:'Décrivez le besoin : quoi, quantité, lieu, délai, contraintes. Ne considérez pas cette publication comme une commande payée.',bodyEn:'Describe the need: what, quantity, place, timing and constraints. Do not treat this post as a paid order.'},
  offer:{kind:'OFFER',prefix:'[OFFRE] ',bodyFr:'Décrivez ce que vous pouvez fournir : disponibilité réelle, quantité, lieu, conditions et preuve utile.',bodyEn:'Describe what you can supply: actual availability, quantity, place, conditions and useful evidence.'},
  groupbuy:{kind:'REQUEST',prefix:'[INTENTION ACHAT GROUPÉ] ',bodyFr:'Décrivez le besoin collectif. La campagne d’achat groupé doit ensuite être créée dans le moteur Marketplace canonique.',bodyEn:'Describe the collective need. The group-buy campaign must then be created in the canonical Marketplace engine.'},
  harvest:{kind:'OFFER',prefix:'[RÉCOLTE / ARRIVAGE] ',bodyFr:'Précisez : produit, origine, disponibilité confirmée ou prévisionnelle, quantité/unité normalisée, date, localité, qualité et conditions.',bodyEn:'Specify product, origin, confirmed or forecast availability, standardized quantity/unit, date, locality, quality and conditions.'},
  skill:{kind:'OFFER',prefix:'[COMPÉTENCE / SERVICE] ',bodyFr:'Présentez la compétence ou le service, les preuves, la zone, la disponibilité et les conditions.',bodyEn:'Present the skill or service, evidence, area, availability and conditions.'},
  learn:{kind:'DISCUSSION',prefix:'[FORMATION / SAVOIR] ',bodyFr:'Partagez un besoin ou une offre de formation, savoir-faire ou accompagnement.',bodyEn:'Share a training, know-how or support need/offer.'},
  sourced:{kind:'ANNOUNCEMENT',prefix:'[INFO SOURCÉE] ',bodyFr:'Indiquez le fait, la source, l’auteur/organisme, la date et si possible la preuve ou référence. “Sourcée” ne signifie pas automatiquement “vraie” : les lecteurs doivent pouvoir vérifier.',bodyEn:'State the fact, source, author/organization, date and, where possible, evidence or reference. “Sourced” does not automatically mean “true”: readers must be able to verify it.'},
  buzz:{kind:'DISCUSSION',prefix:'[TENDANCE / BUZZ · NON VÉRIFIÉ SI AUCUNE SOURCE] ',bodyFr:'Décrivez la tendance ou le buzz. Si aucune source fiable n’est disponible, dites-le explicitement. Une tranche horaire ne transforme jamais un contenu en information vérifiée.',bodyEn:'Describe the trend or buzz. If no reliable source is available, say so explicitly. A time slot never turns content into verified information.'}
};

const INTEREST={
  need:{kind:'REQUEST',category:'besoin',prefix:'[BESOIN] ',bodyFr:POSTS.need.bodyFr,bodyEn:POSTS.need.bodyEn},
  offer:{kind:'OFFER',category:'offre',prefix:'[OFFRE] ',bodyFr:POSTS.offer.bodyFr,bodyEn:POSTS.offer.bodyEn},
  event:{kind:'EVENT',category:'événement',prefix:'[ÉVÉNEMENT] ',bodyFr:'Précisez date, lieu, public, conditions et organisateur.',bodyEn:'Specify date, place, audience, conditions and organizer.'},
  place:{kind:'PLACE',category:'bon coin',prefix:'[LIEU / BON COIN] ',bodyFr:'Décrivez le lieu, la localité, ce qui le rend utile et la source de l’information.',bodyEn:'Describe the place, locality, why it is useful and the source of the information.'},
  harvest:{kind:'OFFER',category:'agriculture / local',prefix:'[RÉCOLTE / LOCAL] ',bodyFr:POSTS.harvest.bodyFr,bodyEn:POSTS.harvest.bodyEn},
  skill:{kind:'OFFER',category:'compétence / service',prefix:'[COMPÉTENCE] ',bodyFr:POSTS.skill.bodyFr,bodyEn:POSTS.skill.bodyEn},
  sourced:{kind:'POST',category:'information sourcée',prefix:'[INFO SOURCÉE] ',bodyFr:POSTS.sourced.bodyFr,bodyEn:POSTS.sourced.bodyEn},
  buzz:{kind:'POST',category:'tendance / buzz',prefix:'[TENDANCE / BUZZ] ',bodyFr:POSTS.buzz.bodyFr,bodyEn:POSTS.buzz.bodyEn}
};

const prepend=(input,prefix)=>{if(!input)return;const current=input.value.trim();if(!current.startsWith(prefix))input.value=prefix+current;};

export function mountCommunityBlueprintPresets(){
  byId('communityHubPresets')?.addEventListener('click',event=>{
    const b=event.target instanceof Element?event.target.closest('[data-hub-preset]'):null;if(!b)return;const preset=HUBS[b.dataset.hubPreset];if(!preset)return;
    const title=byId('communityHubTitle'),about=byId('communityHubAbout'),tags=byId('communityHubTags');if(title)title.value=t(preset.titleFr,preset.titleEn);if(about)about.value=t(preset.aboutFr,preset.aboutEn);if(tags)tags.value=preset.tags;title?.focus();
  });

  byId('communityPostPresets')?.addEventListener('click',event=>{
    const b=event.target instanceof Element?event.target.closest('[data-post-preset]'):null;if(!b)return;const preset=POSTS[b.dataset.postPreset];if(!preset)return;
    const kind=byId('communityPostKind'),title=byId('communityPostTitle'),body=byId('communityPostBody');if(kind)kind.value=preset.kind;prepend(title,preset.prefix);if(body&&!body.value.trim())body.value=t(preset.bodyFr,preset.bodyEn);body?.dispatchEvent(new Event('input',{bubbles:true}));title?.focus();
  });

  byId('interestContentPresets')?.addEventListener('click',event=>{
    const b=event.target instanceof Element?event.target.closest('[data-interest-preset]'):null;if(!b)return;const preset=INTEREST[b.dataset.interestPreset];if(!preset)return;
    const kind=byId('interestContentKind'),category=byId('interestContentCategory'),title=byId('interestContentTitle'),body=byId('interestContentBody');if(kind)kind.value=preset.kind;if(category)category.value=preset.category;prepend(title,preset.prefix);if(body&&!body.value.trim())body.value=t(preset.bodyFr,preset.bodyEn);title?.focus();
  });
}
