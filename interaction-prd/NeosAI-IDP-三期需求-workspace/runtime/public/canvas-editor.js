const escape = value => String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ports={left:[0,150,-1,0],right:[440,150,1,0],top:[220,0,0,-1],bottom:[220,300,0,1]};
export function relationGeometry(relation,positions){
 const from=positions.get(relation.from),to=positions.get(relation.to);if(!from||!to)return null;
 const dx=to.x-from.x,dy=to.y-from.y,horizontal=Math.abs(dx)>=Math.abs(dy);
 const fromPort=relation.fromPort||(horizontal?(dx>=0?'right':'left'):(dy>=0?'bottom':'top'));
 const toPort=relation.toPort||(horizontal?(dx>=0?'left':'right'):(dy>=0?'top':'bottom'));
 const a=ports[fromPort],b=ports[toPort],x1=from.x+a[0],y1=from.y+a[1],x2=to.x+b[0],y2=to.y+b[1];
 const bend=Math.max(70,Math.hypot(x2-x1,y2-y1)/2),c1x=x1+a[2]*bend,c1y=y1+a[3]*bend,c2x=x2+b[2]*bend,c2y=y2+b[3]*bend;
 return {x1,y1,x2,y2,path:`M${x1},${y1} C${c1x},${c1y} ${c2x},${c2y} ${x2},${y2}`,labelX:(x1+3*c1x+3*c2x+x2)/8+(relation.labelOffset?.x||0),labelY:(y1+3*c1y+3*c2y+y2)/8-8+(relation.labelOffset?.y||0)};
}
export function createCanvasEditor({state,saveFile,onRename,toast}){
 let pending=Promise.resolve(),saving=0;
 const $=s=>document.querySelector(s);
 async function save(message){saving++;const content=JSON.stringify(state.manifest,null,2)+'\n';pending=pending.catch(()=>{}).then(()=>saveFile('interaction-prd.json',content));try{await pending;toast(message)}catch(error){toast('保存失败：'+error.message);throw error}finally{saving--}}
 function renderRelations(){
  const group=$('#canvas-relations');if(!group)return;
  group.innerHTML=state.manifest.relations.map(r=>{const g=relationGeometry(r,state.canvasPositions);if(!g)return '';return `<g class="canvas-relation"><path d="${g.path}" fill="none" stroke="#666" stroke-width="2" marker-end="url(#arrow)"/><text x="${g.labelX}" y="${g.labelY}" text-anchor="middle" font-size="14" fill="#344054" paint-order="stroke" stroke="#fafafa" stroke-width="6">${escape(r.label)}</text></g>`}).join('');
 }
 function bind(){const canvas=$('#canvas');canvas.onclick=null;canvas.ondblclick=null;canvas.onpointerdown=null}
 function bindCard(card){
  const title=card.querySelector('strong'),page=state.manifest.pages.find(p=>p.id===card.dataset.page);
  function rename(){if(title.isContentEditable)return;const old=page.title;title.contentEditable='true';title.setAttribute('role','textbox');title.focus();document.getSelection()?.selectAllChildren(title);
   let cancelled=false;title.onkeydown=e=>{e.stopPropagation();if(e.key==='Enter'){e.preventDefault();title.blur()}if(e.key==='Escape'){cancelled=true;title.textContent=old;title.blur()}};
   title.onblur=async()=>{const value=title.textContent.trim();title.contentEditable='false';title.removeAttribute('role');if(cancelled||!value){title.textContent=old;if(!value)toast('原型名称不能为空');return}page.title=value;onRename();try{await save('原型名称已保存')}catch{page.title=old;title.textContent=old;onRename()}};
  }
  title.ondblclick=e=>{e.stopPropagation();rename()};card.querySelector('[data-rename-page]').onclick=e=>{e.stopPropagation();rename()};
 }
 return {bind,bindCard,renderRelations,isBusy:()=>saving>0||Boolean(document.querySelector('.canvas-card [contenteditable="true"]'))};
}
