import './vendor/jszip.min.js';
function csv(text){
 const rows=[];let row=[],cell='',quoted=false;
 text=text.replace(/^\uFEFF/,'');
 for(let i=0;i<text.length;i++){
  const c=text[i];
  if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++}else quoted=!quoted}
  else if(c===','&&!quoted){row.push(cell);cell=''}
  else if((c==='\r'||c==='\n')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);rows.push(row);row=[];cell=''}
  else cell+=c;
 }
 if(quoted)throw Error('CSVの引用符が閉じられていません。');
 row.push(cell);rows.push(row);return rows;
}
const nodes=(doc,tag)=>Array.from(doc.getElementsByTagNameNS('*',tag));
function xml(text){const d=new DOMParser().parseFromString(text,'application/xml');if(nodes(d,'parsererror').length)throw Error('ExcelのXMLを読み取れません。');return d}
export async function readMasterFile(file){
 if(/\.csv$/i.test(file.name)){const rows=csv(await file.text());return {sheets:[{name:'CSV',read:async()=>rows}]}}
 if(!/\.xlsx$/i.test(file.name))throw Error('対応形式は.xlsxまたはUTF-8の.csvです。');
 const zip=await globalThis.JSZip.loadAsync(await file.arrayBuffer());
 const read=async path=>{const f=zip.file(path);if(!f)throw Error('Excelの必要なデータがありません。');return f.async('string')};
 const workbook=xml(await read('xl/workbook.xml')),rels=xml(await read('xl/_rels/workbook.xml.rels'));
 const paths=new Map(nodes(rels,'Relationship').map(r=>[r.getAttribute('Id'),new URL(r.getAttribute('Target'),'https://local/xl/').pathname.slice(1)]));
 const shared=zip.file('xl/sharedStrings.xml')?nodes(xml(await read('xl/sharedStrings.xml')),'si').map(si=>nodes(si,'t').map(t=>t.textContent).join('')):[];
 const sheets=nodes(workbook,'sheet').filter(s=>s.getAttribute('state')!=='hidden').map(s=>({name:s.getAttribute('name'),read:async()=>{
  const path=paths.get(s.getAttribute('r:id'));if(!path)throw Error('ワークシートが見つかりません。');
  return nodes(xml(await read(path)),'row').map(row=>{const a=[];for(const c of nodes(row,'c')){
   const ref=c.getAttribute('r')||'A1';let index=0;for(const ch of ref.replace(/[0-9]/g,''))index=index*26+ch.charCodeAt(0)-64;
   const type=c.getAttribute('t'),raw=nodes(c,'v')[0]?.textContent||'';
   a[index-1]=type==='s'?(shared[Number(raw)]||''):type==='inlineStr'?nodes(c,'t').map(t=>t.textContent).join(''):raw;
  }return a})
 }}));
 if(!sheets.length)throw Error('ワークシートがありません。');return {sheets};
}
export function tableFromRows(input){
 const rows=input.filter(r=>r.some(v=>String(v??'').trim()!==''));
 if(!rows.length)throw Error('データがありません。');
 const columns=Array.from(rows[0],v=>String(v??'').trim());
 if(columns.some(v=>!v))throw Error('空の列名があります。先頭行を確認してください。');
 if(new Set(columns).size!==columns.length)throw Error('列名が重複しています。');
 if(rows.slice(1).some(r=>r.length>columns.length))throw Error('列名のないデータ列があります。');
 return {columns,rows:rows.slice(1).map(r=>columns.map((_,i)=>String(r[i]??'')))};
}
