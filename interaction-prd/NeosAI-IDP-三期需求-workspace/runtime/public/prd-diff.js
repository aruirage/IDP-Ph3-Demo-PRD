// Line comparison; bounded memory for unusually large imported documents.
export function diffLines(before,after){
 const a=before.split('\n'),b=after.split('\n');let prefix=0,suffix=0;
 while(prefix<a.length&&prefix<b.length&&a[prefix]===b[prefix])prefix++;
 while(suffix<a.length-prefix&&suffix<b.length-prefix&&a[a.length-1-suffix]===b[b.length-1-suffix])suffix++;
 const x=a.slice(prefix,a.length-suffix),y=b.slice(prefix,b.length-suffix),rows=[];
 const push=(kind,text)=>rows.push({kind,text});a.slice(0,prefix).forEach(line=>push('same',line));
 if(x.length*y.length<=4000000){const width=y.length+1,dp=new Uint32Array((x.length+1)*width);for(let i=x.length-1;i>=0;i--)for(let j=y.length-1;j>=0;j--)dp[i*width+j]=x[i]===y[j]?dp[(i+1)*width+j+1]+1:Math.max(dp[(i+1)*width+j],dp[i*width+j+1]);let i=0,j=0;while(i<x.length||j<y.length){if(i<x.length&&j<y.length&&x[i]===y[j]){push('same',x[i++]);j++}else if(i<x.length&&(j===y.length||dp[(i+1)*width+j]>=dp[i*width+j+1]))push('removed',x[i++]);else push('added',y[j++])}}
 else{x.forEach(line=>push('removed',line));y.forEach(line=>push('added',line))}
 a.slice(a.length-suffix).forEach(line=>push('same',line));return rows;
}
function readable(text){
 if(/(?:-->|-\.->)|^\s*(?:flowchart|sequenceDiagram|graph) /m.test(text))return '流程图已调整';
 return text.split('\n').filter(line=>!/^\s*```|^\s*\|?\s*:?-{3,}/.test(line)).map(line=>line.replace(/^#{1,6}\s+/,'').replace(/\*\*|`/g,'').replace(/\[([^\]]+)\]\([^)]+\)/g,'$1').replace(/^\s*\|/,'').replace(/\|\s*$/,'').replace(/\s*\|\s*/g,' · ')).join('\n').trim()
}
export function renderDiff(before,after){
 const root=document.createElement('div');root.className='prd-change-review';
 const groups=[];let active=null,heading='';
 for(const line of diffLines(before,after)){
  if(/^#{1,6} /.test(line.text))heading=line.text.replace(/^#+ /,'');
  if(line.kind==='same'){active=null;continue}
  if(!active){active={heading,removed:[],added:[]};groups.push(active)}
  active[line.kind].push(line.text)
 }
 const meaningful=groups.filter(group=>readable(group.removed.join('\n'))||readable(group.added.join('\n')));
 const summary=document.createElement('p');summary.textContent=meaningful.length?`共 ${meaningful.length} 处改动`:'本版正文没有变化';root.append(summary);
 for(const group of meaningful){
  const card=document.createElement('section');card.style.cssText='border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:16px 0';
  if(group.heading){const title=document.createElement('h4');title.textContent=group.heading;card.append(title)}
  for(const [key,label,color] of [['removed','修改前','#fff1f2'],['added','修改后','#f0fdf4']]){
   const value=readable(group[key].join('\n'));if(!value)continue;
   const block=document.createElement('div');block.style.cssText='padding:12px;margin-top:8px;border-radius:6px;background:'+color;
   const caption=document.createElement('strong');caption.textContent=group.removed.length&&group.added.length?label:key==='added'?'新增':'删除';
   const content=document.createElement('div');content.style.cssText='white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.8;margin-top:6px;font-family:inherit';content.textContent=value;block.append(caption,content);card.append(block)
  }
  root.append(card)
 }
 return root
}
