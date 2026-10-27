const KEY='neosai-prototype-integrations-v1';
export function readIntegrations(){try{const d=JSON.parse(localStorage.getItem(KEY));if(d&&Array.isArray(d.connections)&&d.jobs&&typeof d.jobs==='object'){d.schedule=d.schedule||{frequency:'daily',time:'03:00',weekday:1,month:1,day:1};return d}}catch{}return {connections:[{id:'sfdc-sample',name:'SFDC',url:'',created:'2026-10-22 09:00',creator:'管理者'}],jobs:{},schedule:{frequency:'daily',time:'03:00',weekday:1,month:1,day:1}}}
export function saveIntegrations(data){localStorage.setItem(KEY,JSON.stringify(data))}
