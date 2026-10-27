export type QrResult={mode:'value';value:string}|{mode:'ocr'}|{mode:'error';reason:string}
export function extractQr(payloads:string[],options:{mode:'full'|'split';delimiter?:string;index?:number}):QrResult{
 if(options.mode==='full')return payloads.length===1?{mode:'value',value:payloads[0]}:payloads.length>1?{mode:'ocr'}:{mode:'error',reason:'qr-empty'}
 const delimiter=options.delimiter||'',index=options.index;if(!delimiter||!Number.isInteger(index)||Number(index)<1)return {mode:'error',reason:'qr-config'}
 const matches=payloads.filter(p=>p.includes(delimiter));if(matches.length>1)return {mode:'ocr'};if(!matches.length)return {mode:'error',reason:'qr-no-source'}
 const parts=matches[0].split(delimiter);if(Number(index)>parts.length)return {mode:'error',reason:'qr-missing-segment'};return {mode:'value',value:parts[Number(index)-1]}
}

// Step2 routes the entire text-field set before any Step3 QR rule is evaluated.
export function extractQrWithPriority(payloads:string[],options:{multipleQrEnabled:boolean;fieldCount:number;postprocess:{mode:'full'|'split';delimiter?:string;index?:number}}):{mode:'multiple-qr';values:string[]}|QrResult{
 if(options.multipleQrEnabled){const data=payloads.filter(p=>p.includes('$')).join('');const values=data.split(/[$^]/);return data&&values.length===options.fieldCount?{mode:'multiple-qr',values}:{mode:'ocr'}}
 return extractQr(payloads,options.postprocess)
}
