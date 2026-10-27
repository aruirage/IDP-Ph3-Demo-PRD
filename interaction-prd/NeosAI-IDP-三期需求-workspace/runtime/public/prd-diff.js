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
export function renderDiff(before,after){const lines=diffLines(before,after),root=document.createElement('div');root.className='prd-diff';const summary=document.createElement('p');summary.className='prd-diff-summary';summary.textContent=`新增 ${lines.filter(l=>l.kind==='added').length} 行 · 删除 ${lines.filter(l=>l.kind==='removed').length} 行（修改显示为旧行删除与新行新增）`;root.append(summary);let oldLine=0,newLine=0;const body=document.createElement('div');body.className='prd-diff-lines';for(const line of lines){if(line.kind!=='added')oldLine++;if(line.kind!=='removed')newLine++;const row=document.createElement('div');row.className='prd-diff-line '+line.kind;const number=document.createElement('span');number.className='prd-diff-number';number.textContent=`${line.kind==='added'?'':oldLine} / ${line.kind==='removed'?'':newLine}`;const content=document.createElement('span');content.className='prd-diff-text';content.textContent=(line.kind==='added'?'+ ':line.kind==='removed'?'− ':'  ')+line.text;row.append(number,content);body.append(row)}root.append(body);return root}
