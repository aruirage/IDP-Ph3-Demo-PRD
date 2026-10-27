import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const children=[];let stopping=false;
function stop(code=0){if(stopping)return;stopping=true;for(const child of children)child.kill('SIGTERM');setTimeout(()=>process.exit(code),300).unref()}
function run(file,args,env={}){const child=spawn(file,args,{cwd:root,stdio:'inherit',env:{...process.env,...env}});children.push(child);child.on('error',error=>{console.error(error.message);stop(1)});child.on('exit',code=>{if(!stopping)stop(code||1)});}
run(process.execPath,['interaction-prd/NeosAI-IDP-三期需求-workspace/runtime/server/server.mjs'],{PORT:'4173'});
run(process.execPath,['prototype/node_modules/vite/bin/vite.js','--host','0.0.0.0','--port','5174','--strictPort'],{});
run(process.execPath,['scripts/serve-interactive-prd.mjs']);
process.on('SIGINT',()=>stop());process.on('SIGTERM',()=>stop());
