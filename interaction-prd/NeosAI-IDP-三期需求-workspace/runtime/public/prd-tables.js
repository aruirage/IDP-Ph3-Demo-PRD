export function layoutPrdTables(container){
 for(const table of container.querySelectorAll('table')){
  const headings=[...table.querySelectorAll('thead th')].map(cell=>cell.textContent.trim());
  if(!headings.length||table.closest('.prd-table-scroll'))continue;
  const widths=headings.map(title=>/^(编号|序号)$/.test(title)?70:/^(必填|配置\/执行|本期详写 Y\/N)$/.test(title)?96:/规则|说明|要求|处理|校验|依赖|定义|约束|范围|条件|结果|之后|点击后|操作后|下游|去向|内容|数据来源/.test(title)?280:/入口|路由|含义|影响|默认|职责|边界/.test(title)?220:140);
  const cols=document.createElement('colgroup');for(const width of widths){const col=document.createElement('col');col.style.width=width+'px';cols.append(col)}table.prepend(cols);table.style.minWidth=widths.reduce((sum,width)=>sum+width,0)+'px';
  table.querySelectorAll('tbody tr').forEach(row=>[...row.children].forEach((cell,index)=>cell.dataset.columnLabel=headings[index]||''));
  const wrapper=document.createElement('div');wrapper.className='prd-table-scroll';wrapper.tabIndex=0;wrapper.setAttribute('role','region');wrapper.setAttribute('aria-label',(headings.slice(0,2).join('、')||'PRD')+'表格，可横向滚动');table.before(wrapper);wrapper.append(table);
 }
}
