import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const families = [
  ['CONTRIBUTION', 'Collation', 'ORDINAIRE'], ['SAVINGS', 'Épargne', 'EPARGNE'],
  ['SOLIDARITY', 'Secours', 'SECOURS'], ['TONTINE', 'Tontine', 'TONTINE'],
  ['REPAYMENT', 'Remboursement', 'REMBOURSEMENT'], ['LOAN', 'Prêt', 'EMPRUNT'],
  ['LEVY', 'Main levée', 'MAIN_LEVEE']
];

async function seedMeeting(page) {
  await page.goto('http://127.0.0.1:4173/');
  await expect.poll(() => page.evaluate(() => sessionStorage.getItem('eco.window.session.v1'))).toBeTruthy();
  const language = page.locator('#authLanguageSelect');
  await language.selectOption('en');
  await expect(page.locator('label[for="ecoAmbiance"]')).toHaveText('Colour theme');
  await language.selectOption('fr');
  await expect(page.locator('label[for="ecoAmbiance"]')).toHaveText('Ambiance');
  await page.evaluate(async families => {
    let groupId;
    async function post(url, data) {
      const headers = { 'content-type': 'application/json', 'x-eco-window-id': sessionStorage.getItem('eco.window.session.v1') };
      if (groupId) headers['x-active-group-id'] = groupId;
      const response = await fetch('/api/v1/' + url, { method: 'POST', headers, body: JSON.stringify(data) });
      if (!response.ok) throw Error(url + ' ' + response.status + ' ' + await response.text());
      return response.json();
    }
    await post('auth/register', { username: 'graph_' + Date.now(), password: 'Synthetic-Table-2026!', displayName: 'Camille' });
    const project = await post('group-projects', { name: 'Association des Jardins', kind: 'association',
      governanceModel: 'founder_managed', memberCount: 1, sessions: 3, nominalContribution: 0, currency: 'XAF' });
    groupId = (await post('group-projects/' + project.id + '/convert', {})).id;
    for (const [key, label] of families) {
      for (const suffix of [' A', ' B']) {
        await post('groups/' + groupId + '/rubrics', { name: label + suffix, source: 'GROUP_CUSTOM',
          facets: { custom: { systemKey: key }, direction: key === 'LOAN' ? 'OUTFLOW' : 'INFLOW', obligation: 'CUSTOM',
            medium: 'CASH', refundability: 'CONDITIONAL', replenishment: 'CUSTOM', interestMode: 'NONE', eligibilityMode: 'RULE_BASED' },
          operatingModel: { ruleRealityStatus: 'ALIGNED', targetMode: 'OPEN', mandatoryForAbsentees: false,
            shortfallHandling: 'LEAVE_SHORT', payoutMode: 'COLLECTED_ONLY', immediateFullPayout: false } });
      }
    }
    await post('groups/' + groupId + '/meetings', { title: 'Séance de novembre', scheduledAt: new Date().toISOString() });
    localStorage.setItem('tontine.activeGroupId', groupId);
  }, families);
  await page.reload();
}
test('real meeting sheets retain fitted parts, gestures, editable amounts and accessible palettes', async ({ page, browserName }) => {
  test.setTimeout(180000);
  await mkdir('artifacts/tableaux-v45', { recursive: true });
  await page.setViewportSize({ width: 1280, height: 850 });
  await seedMeeting(page);
  await page.setViewportSize({width:680,height:740});
  await page.locator('#sessionsNavBtn').click();
  const picker=page.locator('.session-picker-row');
  await expect(picker).toBeVisible();
  const geometry=await picker.evaluate(el=>{
    const select=el.querySelector('select').getBoundingClientRect();
    const detail=el.querySelector('button').getBoundingClientRect();
    const create=document.querySelector('#sessionsCreateBtn').getBoundingClientRect();
    return {header:document.querySelector('.topbar').getBoundingClientRect().height,
      sameRow:Math.abs(detail.bottom-select.bottom)<5, detail:detail.width, create:create.width, row:el.clientWidth};
  });
  expect(geometry.header).toBeLessThan(132);
  expect(geometry.sameRow).toBe(true);
  expect(Math.max(geometry.detail,geometry.create)).toBeLessThan(geometry.row*.65);
  console.log('SESSION_CONTROLS_680',JSON.stringify(geometry));
  await page.setViewportSize({width:1280,height:850});
  const theme = page.locator('#ecoAmbiance');
  await expect(theme).toHaveValue('');
  // Reach the preference via the real dashboard panel.
  const selectTheme = async value => {
    await page.locator('#mainNav [data-view="dashboard"]').first().click();
    await page.locator('#cockpit-tab-services').click();
    await theme.selectOption(value);
    await page.locator('#mainNav [data-view="operations"]').first().click();
  };
  await page.locator('#mainNav [data-view="operations"]').first().click();
  const sheet = page.locator('#meetingMatrix');
  const wrap = sheet.locator('.canonical-financial-wrap');
  const table = wrap.locator('table');
  await expect(table).toBeVisible();
  const choose = sheet.locator('.eco-smartgrid-navigation select');
  await expect(choose).toBeVisible();
  for (const [from,to,index] of [[190,90,'1'],[90,190,'0']]) {
    await table.locator('thead th').first().evaluate((el, [from,to]) => {
      const point = x => ({ clientX:x, clientY:25 });
      const emit = (type,touches,changedTouches) => {
        const event = new Event(type,{bubbles:true});
        Object.assign(event,{touches,changedTouches}); el.dispatchEvent(event);
      };
      emit('touchstart',[point(from)],[]); emit('touchend',[],[point(to)]);
    },[from,to]);
    await expect(choose).toHaveValue(index);
  }
  await sheet.getByRole('button',{name:'Vue intégrale',exact:true}).click();
  const rail = sheet.locator('.eco-family-rail');
  for (const [, , family] of families) await expect(table.locator('thead [data-rubric-family="'+family+'"]').first()).toBeVisible();
  await expect(rail.locator('button')).toHaveCount(7);
  await rail.locator('[data-rubric-family="EMPRUNT"]').click();
  await expect.poll(()=>wrap.evaluate(el=>el.scrollLeft)).toBeGreaterThan(0);
  await rail.locator('[data-rubric-family="ORDINAIRE"]').click();
  const firstEntry = table.locator('.matrix-cell-entry').first();
  const edit = firstEntry.locator('input');
  await edit.click();
  await edit.fill('2500');
  await firstEntry.locator('.cell-validate').click();
  await page.getByRole('button', {name:'En réunion', exact:true}).click();
  await expect(firstEntry.locator('.cell-current')).toHaveText(/2\s?500/);
  for (const themeValue of ['', 'grand-livre', 'nuit-doree']) {
    if (themeValue) await selectTheme(themeValue);
    await expect(table).toBeVisible();
    await wrap.evaluate(el=>el.scrollLeft=0);
    await expect(rail.locator('[aria-pressed="true"]')).toHaveAttribute('data-rubric-family', 'ORDINAIRE');
    await wrap.evaluate(el=>el.scrollIntoView({block:'center'}));
    await wrap.screenshot({path:'artifacts/tableaux-v45/'+browserName+'-'+(themeValue||'officiel')+'-1280.png'});
  }
  await page.reload();
  await expect(page.locator('body')).toHaveAttribute('data-eco-ambiance','nuit-doree');
  await selectTheme('');
  await page.setViewportSize({width:360,height:800});
  await expect(table).toBeVisible();
  const cell = table.locator('.matrix-cell-entry').first();
  const input = cell.locator('input');
  await wrap.evaluate(el=>{ el.scrollLeft=28; });
  await input.click();
  await expect(input).toBeFocused();
  await input.fill('12345678');
  await expect(input).toHaveValue('12345678');
  const sizes = await cell.evaluate(el=>{
    const input=el.querySelector('input'), button=el.querySelector('.cell-validate');
    const style=getComputedStyle(input), ctx=document.createElement('canvas').getContext('2d');
    ctx.font=style.fontWeight+' '+style.fontSize+' '+style.fontFamily;
    const inner=input.clientWidth-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight);
    const identity=el.closest('tr').querySelector('th:last-of-type').getBoundingClientRect();
    const bounds=input.getBoundingClientRect();
    return {height:el.closest('td').getBoundingClientRect().height, target:button.getBoundingClientRect().width,
      text:ctx.measureText(input.value).width, inner, exposed:bounds.left>=identity.right-1};
  });
  expect(sizes.height).toBeLessThan(95);
  expect(sizes.target).toBeGreaterThanOrEqual(44);
  expect(sizes.text+1).toBeLessThanOrEqual(sizes.inner);
  expect(sizes.exposed).toBe(true);
  await wrap.evaluate(el=>el.scrollIntoView({block:'center',inline:'nearest'}));
  await wrap.screenshot({path:'artifacts/tableaux-v45/'+browserName+'-officiel-360.png'});
  const total=table.locator('.table-grand-total');
  await expect(total).toBeVisible();
  expect(await total.evaluate(el=>getComputedStyle(el).whiteSpace)).toBe('nowrap');
});
