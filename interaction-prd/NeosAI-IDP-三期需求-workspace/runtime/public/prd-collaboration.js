export function createReviewCollaboration({api,state,toast}){
 let currentHash='',latestVersion=0,checking=false,stale=false;
 const node=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n};
 const banner=node('div');banner.className='prd-stale-banner';banner.hidden=true;banner.setAttribute('role','status');const message=node('span','内容已更新，你正在查看旧版。');const refresh=node('button','刷新到最新');refresh.className='button';banner.append(message,refresh);document.querySelector('.view-tabs').after(banner);
 refresh.onclick=()=>{if(state.editorDirty){toast('请先保存或取消当前编辑，再刷新到最新');return}location.reload()};
 return {async markCurrent(){try{const h=await api('/api/prd-history');currentHash=h.currentHash;latestVersion=h.latestVersion;banner.hidden=true;stale=false}catch{}},async checkLatest(){if(checking)return stale;checking=true;try{const h=await api('/api/prd-history');if(currentHash&&(h.currentHash!==currentHash||h.latestVersion!==latestVersion)){stale=true;banner.hidden=false;message.textContent=h.latestVersion!==latestVersion?`已有新发布版本 V${h.latestVersion}，当前页面尚未刷新。`:'内容已更新，你正在查看旧版。'}return stale}catch{return stale}finally{checking=false}}};
}
