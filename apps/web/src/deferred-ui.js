// Presentation controllers load after authentication. They retain their existing owners.
export function deferredMount(loader,exportName,label){
  return options=>{
    let mounted=null,loading=null,revision=0;
    const context=()=>JSON.stringify([options?.app?.currentActor?.(),options?.app?.currentTenant?.(),options?.app?.activeGroup?.()]);
    const load=()=>{if(mounted)return Promise.resolve(mounted);if(loading)return loading;loading=loader().then(module=>{mounted=module[exportName](options)??{};return mounted;}).catch(error=>{loading=null;throw error;});return loading;};
    const showFailure=()=>{
      const old=document.getElementById('eco-module-recovery-'+exportName);if(old)return;
      const host=document.createElement('div');host.id='eco-module-recovery-'+exportName;host.className='eco-module-recovery';host.setAttribute('role','status');const text=document.createElement('span');text.textContent=label+' · '+(document.documentElement.lang==='en'?'Could not load this space.':'Cet espace n’a pas pu être chargé.');const retry=document.createElement('button');retry.type='button';retry.textContent=document.documentElement.lang==='en'?'Retry':'Réessayer';retry.onclick=()=>{host.remove();void load().then(controller=>controller.refresh?.()).catch(showFailure);};host.append(text,retry);(document.getElementById('errorBox')?.parentElement??document.body).append(host);
    };
    window.addEventListener('eco:core-ready',()=>{void load().catch(showFailure);},{once:true});
    return new Proxy({}, {get(_target,key){if(key==='then')return undefined;if(key==='clearForContext')return()=>{revision++;mounted?.clearForContext?.();};return(...args)=>{const scope=context(),at=revision;return load().then(controller=>{if(scope!==context()||at!==revision)return;return controller[key]?.(...args);}).catch(error=>{showFailure();options?.showError?.(error);});};}});
  };
}
