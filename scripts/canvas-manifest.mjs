// Merge the editable review projection without replacing canonical modules or hidden pages.
export function mergeCanvasManifest(base,incoming){
  const pages=new Map(base.pages.map(p=>[p.id,p]));
  const visible=new Set(incoming.pages?.map(p=>p.id));
  if(!Array.isArray(incoming.pages)||!Array.isArray(incoming.relations))throw Error('画布数据格式无效');
  for(const next of incoming.pages){const page=pages.get(next.id);if(!page)throw Error('原型不存在');if(typeof next.title!=='string'||!next.title.trim())throw Error('原型名称不能为空');if(next.canvas&&(!Number.isFinite(next.canvas.x)||!Number.isFinite(next.canvas.y)||next.canvas.x<0||next.canvas.y<0))throw Error('画布位置无效')}
  const ids=new Set();
  for(const r of incoming.relations){if(typeof r.id!=='string'||!r.id||ids.has(r.id)||!visible.has(r.from)||!visible.has(r.to))throw Error('连线引用或编号无效');ids.add(r.id);if(typeof r.label!=='string')throw Error('连线文字无效');for(const port of [r.fromPort,r.toPort])if(port&&!['left','right','top','bottom'].includes(port))throw Error('连线端点无效');if(r.labelOffset&&(!Number.isFinite(r.labelOffset.x)||!Number.isFinite(r.labelOffset.y)))throw Error('连线文字位置无效')}
  for(const next of incoming.pages){const page=pages.get(next.id);page.title=next.title.trim();if(next.canvas)page.canvas={x:next.canvas.x,y:next.canvas.y}}
  const hidden=base.relations.filter(r=>!visible.has(r.from)||!visible.has(r.to));
  if(hidden.some(r=>ids.has(r.id)))throw Error('连线编号重复');
  base.relations=[...hidden,...incoming.relations.map(r=>({id:r.id,from:r.from,to:r.to,label:r.label,trigger:r.trigger||'',...(r.fromPort?{fromPort:r.fromPort}:{}),...(r.toPort?{toPort:r.toPort}:{}),...(r.labelOffset?{labelOffset:{...r.labelOffset}}:{})}))];
  return base;
}
