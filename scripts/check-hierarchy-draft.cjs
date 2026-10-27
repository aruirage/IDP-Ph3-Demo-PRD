const {chromium,browserLaunchOptions}=require('./browser-test-runtime.cjs');
(async()=>{const b=await chromium.launch(browserLaunchOptions);try{
 const p=await b.newPage({viewport:{width:1600,height:1100}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('http://127.0.0.1:5174/business-rules/master-data');await p.getByRole('tab',{name:'階層関係',exact:true}).click();
 const formal=()=>p.evaluate(async()=>{const url=performance.getEntriesByType('resource').map(r=>r.name).find(n=>n.includes('/src/mocks/phase3.ts'));const m=await import(url);return JSON.stringify(m.hierarchyBindings('master-disease'))});
 if(await p.locator('.v-master-data__footer').getByRole('button',{name:'保存',exact:true}).count())throw Error('Footer save remains');
 if(await p.locator('.p3-hierarchy-toolbar .el-select').count())throw Error('Mapping still in toolbar');
 const before=await formal();await p.locator('.p3-node-action').first().click();if(await formal()===before)throw Error('Detach did not persist');
 await p.locator('.el-segmented__item').filter({hasText:'未分類'}).click();
 if(await p.locator('.p3-unclassified .el-table__body-wrapper .el-table__row').count()>10)throw Error('Missing list over page limit');
 if(await p.locator('.p3-unclassified .el-tag').count())throw Error('Origin column remains');
 await p.locator('.p3-unclassified .el-table__row').first().getByRole('button',{name:'階層を設定',exact:true}).click();await p.locator('.p3-unclassified .p3-inline-assignment .el-select').waitFor();if(await p.getByRole('dialog',{name:'階層を設定',exact:true}).count())throw Error('Assignment popup remains');await p.locator('.p3-unclassified .p3-inline-assignment').getByRole('button',{name:'キャンセル',exact:true}).click();
 await p.locator('.p3-unclassified .el-table__row .el-checkbox').first().click();await p.locator('.p3-hierarchy-view-switch').getByRole('button',{name:'階層を一括設定',exact:true}).click();
 let d=p.locator('.p3-hierarchy-view-switch .p3-inline-assignment');await d.locator('.el-select').click();await p.locator('.el-select-dropdown:visible .el-select-dropdown__item').first().click();const detached=await formal();await d.getByRole('button',{name:'OK',exact:true}).click();if(await formal()===detached)throw Error('Assignment did not persist');
 await p.locator('.p3-hierarchy-toolbar button').nth(1).click();d=p.getByRole('dialog',{name:'階層テンプレート',exact:true});await d.waitFor();if(await d.locator('.el-select').count()!==2)throw Error('Upload mappings missing');
 await d.locator('.el-select').nth(1).click();await p.locator('.el-select-dropdown:visible .el-select-dropdown__item.is-disabled').first().waitFor();await p.keyboard.press('Escape');await d.getByRole('button',{name:'キャンセル',exact:true}).click();
 await p.locator('.p3-hierarchy-toolbar button').nth(1).click();d=p.getByRole('dialog',{name:'階層テンプレート',exact:true});await d.locator('input[type=file]').setInputFiles({name:'test.csv',mimeType:'text/csv',buffer:Buffer.from('\ufeff階層,code,名称\n1,C69,Test\n2,C693,Child\n')});await d.getByRole('button',{name:'OK',exact:true}).click();await d.waitFor({state:'hidden'});if(!(await formal()).includes('test.csv'))throw Error('Upload not persisted');
 await p.getByRole('tab',{name:'マスタデータ',exact:true}).click();if(errors.length)throw Error(errors.join('\n'));console.log('PASS no footer save, modal mappings, duplicate exclusion, immediate detach/assignment/upload, unclassified pagination');
}finally{await b.close()}})().catch(e=>{console.error(e);process.exit(1)});
