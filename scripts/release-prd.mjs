import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {createHash} from 'node:crypto';
import {execFileSync,spawnSync} from 'node:child_process';
const root=process.cwd(),directory=path.join(root,'exports/prd-releases'),file=path.join(directory,'history.json');
const note=process.argv[2];if(!note)throw Error('请填写发布说明');
const hash=text=>createHash('sha256').update(text).digest('hex');
let history;try{history=JSON.parse(await fs.readFile(file,'utf8'))}catch(error){if(error.code!=='ENOENT')throw error;history={schemaVersion:1,entries:[]}}
const current=await fs.readFile(path.join(root,'PRD.zh-CN.md'),'utf8');
const add=(content,note)=>{const version=history.entries.filter(e=>e.kind==='publish').length+1;history.entries.push({id:'repository-v'+version,kind:'publish',version,createdAt:new Date().toISOString(),hash:hash(content),content,note})};
const baseline=process.argv[3];if(!history.entries.length&&baseline)add(execFileSync('git',['show',baseline+':PRD.zh-CN.md'],{encoding:'utf8'}),'从仓库提交 '+baseline+' 建立的历史基线');
const previous=history.entries.at(-1);if(previous?.hash===hash(current)){console.log('PRD正文未变，保留当前发布版本');process.exit(0)}
await fs.mkdir(directory,{recursive:true});
const temp=await fs.mkdtemp(path.join(os.tmpdir(),'prd-release-'));try{await fs.writeFile(path.join(temp,'before.md'),previous?.content||'');await fs.writeFile(path.join(temp,'after.md'),current);const diff=spawnSync('git',['diff','--no-index','--',path.join(temp,'before.md'),path.join(temp,'after.md')],{encoding:'utf8'});if(diff.status>1)throw Error(diff.stderr);add(current,note);await fs.writeFile(path.join(directory,'V'+history.entries.at(-1).version+'.diff'),diff.stdout.replaceAll(path.join(temp,'before.md'),'previous.md').replaceAll(path.join(temp,'after.md'),'current.md'));await fs.writeFile(file,JSON.stringify(history,null,2)+'\n');console.log('已生成版本快照、发布说明及diff')}finally{await fs.rm(temp,{recursive:true,force:true})}
