// Explicit user choices belong in the new workflow; no financial assertion is relaxed.
export async function settleWorkDialog(page, reason){
  for(let i=0;i<40;i++){
    if(reason && await page.locator('.eco-financial-reason').isVisible()){
      const review=page.locator('.eco-financial-reason');
      await review.getByRole('textbox').fill(reason);
      await review.getByRole('button',{name:'Confirmer',exact:true}).click();
      return;
    }
    const dialog=page.locator('.eco-work-dialog');
    if(await dialog.isVisible()){
      const mode=dialog.getByRole('button',{name:'En réunion',exact:true});
      if(await mode.isVisible()){await mode.click();if(!reason)return;continue;}
      const review=dialog.getByRole('button',{name:'Valider la synthèse et continuer',exact:true});
      if(await review.isVisible()){await review.click();if(!reason)return;continue;}
    }
    if(!await page.locator('.matrix-cell-entry[data-submitting="1"]').count())return;
    await page.waitForTimeout(50);
  }
}
