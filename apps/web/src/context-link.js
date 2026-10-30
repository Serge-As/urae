/** Canonical, identifier-based navigation; display names never become routing keys. */
export function contextLink(label,type,id){
  if(!['member','meeting','rubric','group'].includes(type)||!id)throw Error('INVALID_CONTEXT_LINK');
  const a=document.createElement('a');a.className='eco-context-link';a.textContent=label;a.href='#detail='+encodeURIComponent(type)+':'+encodeURIComponent(id);a.dataset.detailType=type;a.dataset.detailId=id;return a;
}
