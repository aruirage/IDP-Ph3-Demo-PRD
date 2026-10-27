import {pageSpecs,pageKey,pageSpec,readPage,replacePage} from './prd-page-sections.mjs';
export const moduleSections={
 'prd/chapter-06-overview.md':['## 第 6 章','### 6.01'],
 'prd/chapter-01.md':['## 第 1 章','## 第 2 章'],
 'prd/chapter-02.md':['## 第 2 章','## 第 3 章'],
 'prd/chapter-03.md':['## 第 3 章','## 第 4 章'],
 'prd/chapter-04.md':['## 第 4 章','## 第 5 章'],
 'prd/chapter-05.md':['## 第 5 章','## 第 6 章'],
 'prd/chapter-06.md':['## 第 6 章',null],
 'prd/01-product-definition.md':['## 第 1 章','## 第 2 章'],
 'prd/02-users-and-needs.md':['## 第 2 章','## 第 4 章'],
 'prd/03-user-stories-and-journey.md':['## 第 4 章','## 第 6 章'],
 'prd/04-master-menu.md':['### 6.02','### 6.03'],
 'prd/05-api-sync.md':['### 6.01','### 6.02'],
 'prd/06-ocr-confirm.md':['### 6.03','### 6.04'],
 'prd/07-master-capacity.md':['### 6.04','### 6.05'],
 'prd/08-qrcode.md':['### 6.05','### 6.06'],
 'prd/09-models.md':['### 6.06',null]
};
for(const spec of pageSpecs)moduleSections[pageKey(spec.id)]=['### '+spec.title,null];
export function replaceSection(text,key,content){if(pageSpec(key))return replacePage(text,key,content);const [start,end]=sectionRange(text,key);return text.slice(0,start)+content.trimEnd()+'\n\n'+text.slice(end)}
export function sectionRange(text,key){const rule=moduleSections[key];if(!rule)throw Error('Unknown module');const start=text.indexOf(rule[0]),end=rule[1]?text.indexOf(rule[1],start+1):text.length;if(start<0||end<start)throw Error('PRD section not found');return [start,end]}
export function readSection(text,key){if(pageSpec(key))return readPage(text,key);const [start,end]=sectionRange(text,key);return text.slice(start,end).trimEnd()+'\n'}
