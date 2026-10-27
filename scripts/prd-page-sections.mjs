// Page views are editable projections of the single canonical PRD.
const block=(chapter,from,to)=>({chapter,from,to});
export const pageSpecs=[
 {id:'master-data',title:'主数据总览与层级关系',parts:[block('6.02'),block('6.04')]},
 {id:'master-columns',title:'主数据列设置',parts:[block('6.02','#### 字段与参数规格'),block('6.02','#### 按钮与启用条件')]},
 {id:'master-sync',title:'API同步配置',parts:[block('6.01','#### 范围说明'),block('6.01','#### 功能点'),block('6.01','#### 外部系统来源绑定与自动执行','| 更新履历 | 规则 |'),block('6.01','#### 每次更新的处理顺序'),block('6.01','#### 异常与边界'),block('6.01','#### 待确认')]},
 {id:'master-history',title:'更新履历',parts:[block('6.01','| 更新履历 | 规则 |','界面文案：')]},
 {id:'api-settings',title:'外部数据连接',parts:[block('6.01','| 连接与字段配置 | 规则 |','| 来源与字段 |'),block('6.01','| 按钮 | 场景 |','| 有効（启用开关） |'),block('6.01','#### SFDC标准接口依据'),block('6.01','#### SFDC认证与连接测试')]},
 {id:'ocr-confirmation',title:'OCR抽出确认',parts:[block('6.03')]},
 {id:'doctype-rules',title:'账票后处理规则',parts:[block('6.05'),block('6.03','#### 按组照合规则')]},
 {id:'doctype-review',title:'账票人工确认规则',parts:[block('6.06','7. 账票类别人工确认规则中','#### 用途指派与OCR模板联动'),block('6.03','#### 三类阈值的边界'),block('6.03','#### 自动采用规则')]},
 {id:'model-settings',title:'模型用途与账票模型设定',parts:[block('6.06','#### 功能点','7. 账票类别人工确认规则中'),block('6.06','#### 用途指派与OCR模板联动'),block('6.06','#### 页面与入口'),block('6.06','#### 按钮与启用条件'),block('6.06','#### 字段与参数规格'),block('6.06','#### 列表展示'),block('6.06','#### 异常与边界')]}
];
export const pageKey=id=>`prd/pages/${id}.md`;
export function pageSpec(key){return pageSpecs.find(spec=>pageKey(spec.id)===key)}
function ranges(text,spec){return spec.parts.map(part=>{const chapterStart=text.indexOf('### '+part.chapter+' ');if(chapterStart<0)throw Error('页面关联章节不存在');const next=text.indexOf('\n### ',chapterStart+1),chapterEnd=next<0?text.length:next+1;const from=part.from==='#### 自动采用规则'&&!text.includes(part.from)?'#### Master人工确认的分类条件':part.from;let start=from?text.indexOf(from,chapterStart):chapterStart;if(start<chapterStart||start>=chapterEnd)throw Error('页面关联段落不存在：'+part.from);let end=chapterEnd;if(part.to){end=text.indexOf(part.to,start+1);if(end<start||end>chapterEnd)throw Error('页面段落边界不存在：'+part.to)}else if(part.from){const nextHeading=text.indexOf('\n#### ',start+1);if(nextHeading>=0&&nextHeading<end)end=nextHeading+1}return [start,end]})}
const marker=index=>`<!-- prd-fragment:${index} -->`;
export function readPage(text,key){const spec=pageSpec(key);return `### ${spec.title}\n\n`+ranges(text,spec).map(([start,end],index)=>`${marker(index)}\n${text.slice(start,end).trimEnd()}\n<!-- /prd-fragment:${index} -->`).join('\n\n')+'\n'}
export function replacePage(text,key,content){const spec=pageSpec(key);if(!content.startsWith(`### ${spec.title}\n`))throw Error('请保留页面标题');const sourceRanges=ranges(text,spec);const replacements=sourceRanges.map(([start,end],index)=>{const open=marker(index)+'\n',close=`\n<!-- /prd-fragment:${index} -->`;const first=content.indexOf(open),last=content.indexOf(close,first+open.length);if(first<0||last<0||content.indexOf(open,first+1)>=0)throw Error('请保留页面段落边界注释');return {start,end,value:content.slice(first+open.length,last).trimEnd()+(text.slice(start,end).match(/\s*$/)?.[0]||'')}}).sort((a,b)=>b.start-a.start);for(let i=1;i<replacements.length;i++)if(replacements[i].end>replacements[i-1].start)throw Error('页面段落重叠');for(const {start,end,value} of replacements)text=text.slice(0,start)+value+text.slice(end);return text}
