export async function handleWorkDialogs(page){
  await page.addLocatorHandler(page.locator('.eco-work-dialog'),async()=>{
    const mode=page.getByRole('button',{name:'En réunion',exact:true});
    if(await mode.isVisible()){await mode.click();return;}
    const review=page.getByRole('button',{name:'Valider la synthèse et continuer',exact:true});
    if(await review.isVisible())await review.click();
  });
}
