// Explicit user choices belong in the new workflow; no financial assertion is relaxed.
export async function settleWorkDialog(page){
  for(let i=0;i<40;i++){
    const dialog=page.locator('.eco-work-dialog');
    if(await dialog.isVisible()){
      const mode=dialog.getByRole('button',{name:'En réunion',exact:true});
      if(await mode.isVisible()){await mode.click();return;}
      const review=dialog.getByRole('button',{name:'Valider la synthèse et continuer',exact:true});
      if(await review.isVisible()){await review.click();return;}
    }
    if(!await page.locator('.matrix-cell-entry[data-submitting="1"]').count())return;
    await page.waitForTimeout(50);
  }
}
