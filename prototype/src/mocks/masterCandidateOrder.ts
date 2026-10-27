import type { OcrMasterMatchCandidate } from './ocrExtractionTask'
// Equal-score display order only. Automatic adoption requires a unique highest score.
export function compareSimilarityCandidates(a:OcrMasterMatchCandidate,b:OcrMasterMatchCandidate){
 const score=(b.similarityScore??0)-(a.similarityScore??0)
 if(score)return score
 if(a.sourceRecordId&&b.sourceRecordId)return a.sourceRecordId<b.sourceRecordId?-1:a.sourceRecordId>b.sourceRecordId?1:0
 return 0
}

export function compareMasterCandidateSources(a:OcrMasterMatchCandidate,b:OcrMasterMatchCandidate){
 const rank=(item:OcrMasterMatchCandidate)=>item.strategy==='code'?0:item.strategy==='parent'?2:item.strategy==='ocr'?3:1
 return rank(a)-rank(b)||(rank(a)===1?compareSimilarityCandidates(a,b):0)
}
