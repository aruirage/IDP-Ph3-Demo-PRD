import {pageSpecs,pageKey} from './prd-page-sections.mjs';
export function reviewManifest(base){
 const pages=base.pages.filter(p=>p.kind==='page'),ids=pages.map(p=>p.id),titles=['文档基础与范围','术语与词汇表','数据结构与状态','用户交互流程','全量功能清单'];
 const bindings=[[],[],[],[],[]];
 const overview=titles.map((title,i)=>({id:'chapter-'+String(i+1).padStart(2,'0'),title:'第'+(i+1)+'章｜'+title,prd:'prd/chapter-'+String(i+1).padStart(2,'0')+'.md',kind:'prd',pages:bindings[i],status:'draft'}));
 const details=pageSpecs.filter(spec=>ids.includes(spec.id)).map((spec,i)=>({id:'detail-'+spec.id,title:spec.title,navNumber:'6.'+String(i+1).padStart(2,'0'),prd:pageKey(spec.id),kind:'prd',group:'details',pages:[spec.id],status:'draft'}));
 return {...base,modules:[...overview,{id:'chapter-06',title:'第6章｜功能详细说明 · 总览',navNumber:'06',prd:'prd/chapter-06-overview.md',kind:'prd',group:'details',pages:[],status:'draft'},...details],pages:pages.map(p=>({...p,moduleId:'detail-'+p.id})),relations:base.relations.filter(r=>ids.includes(r.from)&&ids.includes(r.to))};
}
