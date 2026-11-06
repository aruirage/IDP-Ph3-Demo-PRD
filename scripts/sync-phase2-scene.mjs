import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';

const root=fileURLToPath(new URL('../',import.meta.url));
const source=path.resolve(process.argv[2]||path.join(root,'../../prototypes/workflow-ph2'));
const target=path.join(root,'prototype/public/business-scene');
await fs.mkdir(target,{recursive:true});
for(const file of ['style.css','logo-CWaP-1CB.png','default-workflow-v9.svg'])await fs.copyFile(path.join(source,file),path.join(target,file));
for(const dir of ['vendor','assets'])await fs.cp(path.join(source,dir),path.join(target,dir),{recursive:true,filter:entry=>!entry.includes('prd-screenshots')&&!entry.includes('qr-deck')});
await fs.mkdir(path.join(target,'scripts'),{recursive:true});
for(const file of ['workflow-core.js','mock-data.js','scene-config.js'])await fs.copyFile(path.join(source,'scripts',file),path.join(target,'scripts',file));
const originalMain=await fs.readFile(path.join(source,'main.js'),'utf8');
let main=originalMain.replace("const storedUiLanguage = localStorage.getItem('neosai-idp-ui-language');", "const storedUiLanguage = new URLSearchParams(location.search).get('lang') || localStorage.getItem('neosai-idp-ui-language');");
main=main.replace("const uiLanguage = ref(storedUiLanguage === 'zh' ? 'zh' : 'ja');",`const uiLanguage = ref(storedUiLanguage === 'zh' ? 'zh' : 'ja');
    window.addEventListener('message', event => {
      if(event.origin !== location.origin || event.source !== parent || event.data?.type !== 'neosai:scene-language')return;
      uiLanguage.value = event.data.locale === 'zh-CN' ? 'zh' : 'ja';
    });`);
main=main.replace('function openFixedDocSettings(typeId, stepOverride, options = {}) {',`function openFixedDocSettings(typeId, stepOverride, options = {}) {
      if(window.parent !== window){window.parent.postMessage({type:'neosai:open-doc-types'},location.origin);return;}`);
await fs.writeFile(path.join(target,'main.js'),main);
let html=(await fs.readFile(path.join(source,'index.html'),'utf8')).replace(/ data-page-node-id="[^"]*"/g,'');
const version=createHash('sha256').update(html+main+await fs.readFile(path.join(target,'style.css'),'utf8')).digest('hex').slice(0,12);
html=html.replace(/\?v=\d+/g,'?v='+version).replace('</head>',`<style>
.global-topbar,.global-nav{display:none!important}
.app-shell{height:100vh;min-height:0}
</style></head>`);
await fs.writeFile(path.join(target,'index.html'),html);
await fs.writeFile(path.join(target,'source.json'),JSON.stringify({source:'workflow-ph2',scope:'business-scene',version},null,2)+'\n');
console.log('Synced phase 2 business scene: '+version);
