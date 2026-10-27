// Preview-only adapter. The production UI remains unchanged without ?prd=.
const pageId=new URLSearchParams(location.search).get('prd')
if(pageId&&window.parent!==window){
 const scene=new URLSearchParams(location.search).get('scene')||''
 const pageRoutes:Record<string,string>={'/business-rules/master-data':'master-data','/business-rules/api-management':'api-settings','/business-rules/model-settings':'model-settings','/business-rules/doc-types':'doctype-rules','/tasks/ocr-extraction/TASK-OCR-001':'ocr-confirmation'}
 let lastPath=location.pathname
 const notifyRoute=()=>{if(location.pathname===lastPath)return;lastPath=location.pathname;window.parent.postMessage({type:'interaction-prd:navigate',pageId:pageRoutes[lastPath]||null},location.origin)}
 for(const method of ['pushState','replaceState'] as const){const original=history[method];history[method]=function(...args:Parameters<History[typeof method]>){original.apply(this,args);notifyRoute()}}
 addEventListener('popstate',notifyRoute)


 let initialized=false,scheduled=false
 const refresh=()=>{if(scheduled)return;scheduled=true;setTimeout(()=>{scheduled=false;window.dispatchEvent(new Event('scroll'));if(initialized)return
 const click=(selector:string)=>{const el=document.querySelector<HTMLElement>(selector);if(!el)return false;el.click();return true}
 if(scene==='columns')initialized=click('.v-master-data__toolbar-left>.el-button')
 else if(scene==='sync'){initialized=click('.p3-sync-more');if(initialized)setTimeout(()=>{Array.from(document.querySelectorAll<HTMLElement>('.el-dropdown-menu__item')).find(e=>e.textContent?.trim()==='設定')?.click()},100)}
 else if(scene==='history'){initialized=click('.p3-sync-more');if(initialized)setTimeout(()=>{Array.from(document.querySelectorAll<HTMLElement>('.el-dropdown-menu__item')).find(e=>e.textContent?.trim()==='更新履歴')?.click()},100)}
 else if(scene==='external'){const tab=Array.from(document.querySelectorAll<HTMLElement>('[role=tab]')).find(e=>e.textContent?.includes('外部データ連携'));if(tab){tab.click();initialized=true}}
 else if(scene==='ocr'){const tab=Array.from(document.querySelectorAll<HTMLElement>('[role=tab]')).find(e=>e.textContent?.includes('診断書'));if(tab){tab.click();initialized=true}}
 else if(scene==='assignment'){const tab=Array.from(document.querySelectorAll<HTMLElement>('[role=tab]')).find(e=>e.textContent?.includes('用途割当'));if(tab){tab.click();initialized=true}}
 else if(scene==='rule'){const steps=document.querySelectorAll<HTMLElement>('.v-doc-types__step-btn');if(steps[2]){steps[2].click();initialized=true;void import('@/mocks/docTypeSettings').then(({docTypeDefinitions})=>{const rule=docTypeDefinitions.value[0]?.processRules.textFields[0];if(rule){rule.ruleType='qrcode';rule.qrMode='split';rule.qrDelimiter='_';rule.qrIndex=1}})}}
 else if(scene==='review'){const steps=document.querySelectorAll<HTMLElement>('.v-doc-types__step-btn');if(steps[1]){steps[1].click();initialized=true;setTimeout(()=>click('[title="人工確認ルール設定"]'),300)}}
 else initialized=Boolean(document.querySelector('.v-master-data__main,.v-ocr-fields'))
 },150)}
 new MutationObserver(refresh).observe(document.documentElement,{childList:true,subtree:true})
 addEventListener('resize',refresh);setTimeout(refresh,200);setTimeout(refresh,1000)
}
export {}
