const assert=require('node:assert/strict');
const {chromium,browserLaunchOptions}=require('./browser-test-runtime.cjs');
(async()=>{
 const browser=await chromium.launch(browserLaunchOptions);
 try{
  const page=await browser.newPage({viewport:{width:1600,height:1000}}),errors=[],failed=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('response',response=>{if(response.url().includes('/business-scene/')&&response.status()>=400)failed.push(response.url())});
  await page.goto((process.env.PROTOTYPE_URL||'http://127.0.0.1:4178')+'/business-rules/business-scene');
  await page.frameLocator('iframe').locator('.wf-setup-stepper').waitFor();
  const frame=page.frames().find(frame=>frame.url().includes('/business-scene/index.html'));
  assert.equal(new URL(frame.url()).origin,new URL(page.url()).origin);
  assert.equal(await frame.locator('.global-topbar').isVisible(),false);
  assert.equal(await frame.locator('.global-nav').isVisible(),false);
  await frame.waitForFunction(()=>!!window.__NEOS_PRD_CAPTURE__);
  const content=await frame.locator('body').innerText();
  assert.match(content,/案件集約ルール/);
  assert.match(content,/関連プレビュー/);
  // Exercise the same step transitions as the scene editor, bypassing draft validation.
  for(const [step,label] of [[2,'開始'],[3,'通知ルール追加'],[4,'エクスポート対象']]){
   await frame.evaluate(step=>window.__NEOS_PRD_CAPTURE__.openWorkflowStep(step),step);
   await frame.getByText(label,{exact:true}).first().waitFor();
  }
  await frame.getByRole('button',{name:'保存',exact:true}).click();
  await page.getByText('中文',{exact:true}).click();
  await frame.waitForFunction(()=>document.documentElement.lang==='zh-CN');
  assert.ok((await frame.locator('body').innerText()).includes('导出'));
  // Embedded links must lead to the existing phase 3 editor, never the phase 2 editor.
  await frame.evaluate(()=>window.__NEOS_PRD_CAPTURE__.openFixedDoc('',2));
  await page.waitForURL('**/business-rules/doc-types');
  assert.equal(await page.locator('iframe').count(),0);
  assert.equal(errors.length,0,errors.join('\n'));
  assert.equal(failed.length,0,failed.join('\n'));
  console.log('PASS: same-origin bundled scene, four steps, save, language sync, phase 3 document navigation');
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exit(1)});
