import type { OcrMasterMatchCandidate } from './ocrExtractionTask'
// Stable source identity resolves equal scores; legacy fixtures retain snapshot order.
export function compareSimilarityCandidates(a:OcrMasterMatchCandidate,b:OcrMasterMatchCandidate){
 const score=(b.similarityScore??0)-(a.similarityScore??0)
 if(score)return score
 if(a.sourceRecordId&&b.sourceRecordId)return a.sourceRecordId<b.sourceRecordId?-1:a.sourceRecordId>b.sourceRecordId?1:0
 return 0
}
