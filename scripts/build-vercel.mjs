import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const root=fileURLToPath(new URL('../',import.meta.url)),workspace=path.join(root,'interaction-prd/NeosAI-IDP-三期需求-workspace'),output=path.join(root,'dist');
const build=spawnSync(process.execPath,[path.join(root,'prototype/node_modules/vite/bin/vite.js'),'build'],{cwd:path.join(root,'prototype'),stdio:'inherit'});if(build.status!==0)process.exit(build.status||1);
await fs.rm(output,{recursive:true,force:true});await fs.mkdir(output,{recursive:true});
await fs.cp(path.join(root,'prototype/dist'),output,{recursive:true});
await fs.rename(path.join(output,'index.html'),path.join(output,'prototype.html'));
await fs.cp(path.join(workspace,'runtime/public'),output,{recursive:true});
await fs.mkdir(path.join(output,'content'),{recursive:true});await fs.cp(path.join(workspace,'prototypes'),path.join(output,'content/prototypes'),{recursive:true});
await fs.mkdir(path.join(output,'vendor'),{recursive:true});
for(const [from,to] of [['marked/lib/marked.esm.js','marked.js'],['mermaid/dist/mermaid.esm.min.mjs','mermaid.js'],['html2canvas/dist/html2canvas.min.js','html2canvas.umd.js']])await fs.copyFile(path.join(workspace,'node_modules',from),path.join(output,'vendor',to));
await fs.cp(path.join(workspace,'node_modules/mermaid/dist/chunks'),path.join(output,'vendor/chunks'),{recursive:true});
const manifest=JSON.parse(await fs.readFile(path.join(workspace,'interaction-prd.json'),'utf8')),files={};
for(const page of manifest.pages){for(const key of [page.file,page.annotationFile].filter(Boolean))files[key]=await fs.readFile(path.join(workspace,key),'utf8');}
let releaseHistory;try{releaseHistory=JSON.parse(await fs.readFile(path.join(root,'exports/prd-releases/history.json'),'utf8'))}catch(error){if(error.code!=='ENOENT')throw error;}
const seed={history:releaseHistory,canonical:await fs.readFile(path.join(root,'PRD.zh-CN.md'),'utf8'),manifest,files,builtAt:new Date().toISOString()};
await fs.mkdir(path.join(root,'.vercel-data'),{recursive:true});await fs.writeFile(path.join(root,'.vercel-data/seed.json'),JSON.stringify(seed));
console.log('Vercel build: workbench /, standalone prototype /prototype.html, cloud API /api/*');
