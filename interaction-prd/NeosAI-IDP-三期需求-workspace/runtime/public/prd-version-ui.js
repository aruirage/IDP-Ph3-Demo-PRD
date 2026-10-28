import {renderDiff} from './prd-diff.js';
export function createPrdVersionUi({api,state,getFile,renderDocument,toast}){
 const status=document.createElement('span');status.id='prd-version-status';status.className='save-state';
 const historyButton=document.createElement('button');historyButton.id='prd-history-button';historyButton.className='button';historyButton.textContent='修改历史 / 版本';
 const publishButton=document.createElement('button');publishButton.id='prd-publish-button';publishButton.className='button primary';publishButton.textContent='发布';
 const actions=document.querySelector('.topbar .actions'),editButton=document.querySelector('#edit-button'),exportButton=document.querySelector('#export-button');
 actions.prepend(status);
 historyButton.textContent='版本历史';exportButton.classList.add('primary');exportButton.textContent='下载 PRD';actions.append(historyButton,exportButton);
 const dialog=document.createElement('dialog');dialog.id='prd-history-dialog';dialog.className='prd-version-dialog';dialog.setAttribute('aria-label','PRD 历史与版本');dialog.innerHTML='<div class="prd-version-heading"><strong>PRD 历史与版本</strong><button class="button prd-history-collapse" data-close aria-label="关闭历史">收起 →</button></div><div class="prd-version-tabs"><button class="button" data-kind="publish">发布版本</button><button class="button" data-kind="history">修改历史</button></div><p class="prd-version-note">查看已发布版本、更新说明及与上一版的差异。</p><div class="prd-version-body"><div class="prd-version-list"></div><section class="prd-version-detail"><p>选择记录查看内容，或与当前草稿对比。</p></section></div>';
 const release=document.createElement('dialog');release.id='prd-publish-dialog';release.className='prd-publish-dialog';release.setAttribute('aria-label','发布整份 PRD');release.innerHTML='<div class="prd-version-heading"><strong>发布整份 PRD</strong><button class="icon-button" data-close aria-label="取消发布">×</button></div><p class="prd-release-number"></p><label>版本标题<input class="prd-release-title" maxlength="160" placeholder="例如：主数据层级交互调整"></label><label>更新说明<textarea maxlength="5000" rows="8" placeholder="新增：&#10;- &#10;调整：&#10;- &#10;修复：&#10;- "></textarea></label><p class="prd-version-note">发布当前已保存的完整正文，后续修改不会改变已发布版本。</p><div class="prd-version-footer"><button class="button" data-close>取消</button><button class="button primary" id="prd-confirm-publish">发布</button></div>';
 document.body.append(dialog);
 for(const root of [dialog,release])root.querySelectorAll('[data-close]').forEach(button=>button.addEventListener('click',()=>root.close()));
 let latest,filter='history',selectedId='',request=0,busy=false,releaseHash='',restoreHash='';
 function savedOnly(){if(state.editorDirty){toast('请先保存编辑内容，再执行版本操作');return false}return true}
 async function refresh(){try{latest=await api('/api/prd-history');status.textContent=latest.latestVersion?`已发布 V${latest.latestVersion}${latest.hasUnpublishedChanges?' · 有未发布修改':''}`:'尚未发布';publishButton.disabled=!latest.hasUnpublishedChanges||busy||state.manifest?.deployment?.writable===false;return latest}catch(error){status.textContent='版本记录加载失败';toast(error.message)}}
 const text=(tag,content)=>{const node=document.createElement(tag);node.textContent=content;return node};
 const title=entry=>entry.kind==='publish'?`V${entry.version}`:({edit:'保存修改',restore:'恢复记录',external:'外部文件修改',baseline:'初始内容'}[entry.kind]||entry.kind);
 const date=entry=>new Date(entry.createdAt).toLocaleString('zh-CN',{hour12:false});
 function renderList(){
  dialog.querySelectorAll('[data-kind]').forEach(button=>{button.classList.toggle('primary',button.dataset.kind===filter);button.setAttribute('aria-pressed',String(button.dataset.kind===filter))});
  const list=dialog.querySelector('.prd-version-list'),scrollTop=list.scrollTop;list.replaceChildren();
  const entries=latest.entries.filter(entry=>filter==='publish'?entry.kind==='publish':entry.kind!=='publish');
  if(!entries.length){list.append(text('p',filter==='publish'?'尚无发布版本':'尚无修改历史'));return}
  for(const entry of entries){const button=document.createElement('button');button.className='prd-version-record'+(entry.id===selectedId?' selected':'');button.dataset.entry=entry.id;button.append(text('strong',title(entry)),text('span',date(entry)));if(entry.note)button.append(text('small',entry.note));if(entry.path)button.append(text('small',state.manifest.modules.find(module=>module.prd===entry.path)?.title||entry.path));button.addEventListener('click',()=>showEntry(entry.id));list.append(button)}list.scrollTop=scrollTop;
 }
 async function showEntry(id,mode='default'){
  const currentRequest=++request;selectedId=id;renderList();const detail=dialog.querySelector('.prd-version-detail');detail.replaceChildren(text('p','正在加载…'));
  try{
   const result=await api('/api/prd-history/entry?id='+encodeURIComponent(id));if(currentRequest!==request)return;restoreHash=result.currentHash;
   const published=result.entry.kind==='publish',showReleaseDiff=published&&(mode==='default'||mode==='release'),showDraftDiff=mode==='draft';
   detail.replaceChildren();const actions=document.createElement('div');actions.className='prd-version-detail-actions';actions.append(text('strong',title(result.entry)+' · '+date(result.entry)));
   if(published&&result.entry.note){const notes=text('pre',result.entry.note);notes.className='prd-release-notes';detail.append(notes)}
   if(published){const toggle=text('button',showReleaseDiff?'查看完整正文':'对比上一发布版本');toggle.className='button';toggle.addEventListener('click',()=>showEntry(id,showReleaseDiff?'full':'release'));actions.append(toggle)}
   const compareButton=text('button',showDraftDiff?'查看历史正文':'与当前草稿对比');compareButton.className='button';compareButton.addEventListener('click',()=>showEntry(id,showDraftDiff?'full':'draft'));
   const restoreButton=text('button','恢复到此内容');restoreButton.className='button';restoreButton.id='prd-restore-button';restoreButton.disabled=busy;restoreButton.addEventListener('click',()=>restore(id));actions.append(compareButton,restoreButton);detail.append(actions);
   if(showReleaseDiff){const base=result.diffBase;detail.append(text('p',base?.kind==='publish'?`V${base.version} → V${result.entry.version}`:`初始记录 → V${result.entry.version}`),renderDiff(base?.content||'',result.entry.content))}
   else if(showDraftDiff){detail.append(text('p','历史内容 → 当前草稿'),renderDiff(result.entry.content,result.current))}
   else{detail.append(text('h3','历史内容'),text('pre',result.entry.content))}
  }catch(error){detail.replaceChildren(text('p',error.message))}
 }

 async function restore(id){if(busy||!savedOnly())return;if(!window.confirm('将整份 PRD 恢复到此记录？当前已保存内容会保留在修改历史中；恢复后需重新发布才成为新版本。'))return;busy=true;const button=document.querySelector('#prd-restore-button');if(button)button.disabled=true;try{await api('/api/prd-history/restore',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,expectedHash:restoreHash})});state.snapshots.clear();await renderDocument(await getFile(state.module.prd));await refresh();renderList();await showEntry(id);toast('已恢复为草稿，旧历史与发布版本均保留')}catch(error){toast(error.message)}finally{busy=false;if(button)button.disabled=false;publishButton.disabled=!latest?.hasUnpublishedChanges||state.manifest?.deployment?.writable===false}}
 function selectLatestEntry(){const first=latest.entries.find(entry=>filter==='publish'?entry.kind==='publish':entry.kind!=='publish');if(first)showEntry(first.id);else{selectedId='';renderList();dialog.querySelector('.prd-version-detail').replaceChildren(text('p',filter==='publish'?'暂无发布版本，发布后可在这里查看正文及版本差异。':'暂无修改历史。'))}}
 historyButton.addEventListener('click',async()=>{if(!savedOnly())return;await refresh();if(!latest)return;filter=latest.latestVersion?'publish':'history';selectedId='';renderList();dialog.showModal();selectLatestEntry()});
 dialog.querySelectorAll('[data-kind]').forEach(button=>button.addEventListener('click',()=>{filter=button.dataset.kind;dialog.querySelector('.prd-version-list').scrollTop=0;selectLatestEntry()}));
 publishButton.addEventListener('click',async()=>{if(!savedOnly())return;await refresh();if(!latest?.hasUnpublishedChanges||state.manifest?.deployment?.writable===false)return;release.querySelector('.prd-release-number').textContent=`将生成 V${latest.latestVersion+1}`;release.querySelector('textarea').value='';release.querySelector('.prd-release-title').value='';releaseHash=latest.currentHash;release.showModal()});
 release.querySelector('#prd-confirm-publish').addEventListener('click',async event=>{if(busy)return;busy=true;event.target.disabled=true;try{const result=await api('/api/prd-history/publish',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({note:[release.querySelector('.prd-release-title').value.trim(),release.querySelector('textarea').value.trim()].filter(Boolean).join('\n\n'),expectedHash:releaseHash})});release.close();toast(`已发布 V${result.latestVersion}`);await refresh()}catch(error){toast(error.message)}finally{busy=false;event.target.disabled=false;publishButton.disabled=!latest?.hasUnpublishedChanges||state.manifest?.deployment?.writable===false}});
 return {refresh};
}
