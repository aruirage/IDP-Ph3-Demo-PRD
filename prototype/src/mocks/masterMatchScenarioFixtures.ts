import type { OcrExtractionField, OcrMasterMatchCandidate } from './ocrExtractionTask'
import { customerIcdSample } from './customerIcdSample'
const box={top:20,left:30,width:30,height:2}
function field(id:string,label:string,records:number[],scores:number[],extra:Partial<OcrExtractionField>={}):OcrExtractionField{
 return {id,section:'マスタ照合ケース',label,value:'OCR原文 '+id,ocrOriginalValue:'OCR原文 '+id,confidence:97,required:true,bbox:{...box},masterDataId:'master-disease',masterDataColumnId:'col-d-name',masterCodeColumnId:'col-d-code',masterMatchCandidates:records.map((index,i)=>candidate(id,index,'hybrid',scores[i])),...extra}
}
function candidate(id:string,index:number,strategy:OcrMasterMatchCandidate['strategy'],score?:number):OcrMasterMatchCandidate{
 const record=customerIcdSample[index]
 return {sourceRecordId:record[0],value:record[2],strategy,similarityScore:score,linkedValues:{[id]:record[2],[id+'-icd']:record[1]}}
}
function bankGroup(id:string,label:string,score:number):OcrExtractionField[]{
 const bank=field(id,label,[],[],{value:'瀬戸',ocrOriginalValue:'瀬戸',masterDataId:'master-bank-info',masterMatchCodeFieldRefs:[{fieldId:id,label:'金融機関名'},{fieldId:id+'-branch',label:'支店名'}],masterMatchCandidates:[['瀬戸信用金庫','瑞穂通支店'],['大垣共立銀行','瀬戸支店'],['岡崎信用金庫','瑞穂支店']].map(([name,branch],i)=>({value:name+'-'+branch,strategy:'hybrid',similarityScore:[score,85,81][i],linkedValues:{[id]:name,[id+'-branch']:branch}}))})
 return [bank,{id:id+'-branch',section:bank.section,label:'支店名（同一グループ）',value:'瑞穂通',ocrOriginalValue:'瑞穂通',confidence:97,required:true,bbox:{...box},masterMatchLinkedTo:id}]
}
function diseaseGroup(id:string,label:string,records:number[],scores:number[],codes:number[]=[],trusted?:boolean):OcrExtractionField[]{
 const main=field(id,label,records,scores,{phase3ModelTrusted:trusted,masterMatchCodeFieldRefs:[{fieldId:id,label:'傷病名',masterColumnId:'col-d-name'},{fieldId:id+'-icd',label:'ICD10',masterColumnId:'col-d-code'}]})
 main.masterMatchCandidates!.unshift(...codes.map(index=>candidate(id,index,'code')))
 return [main,{id:id+'-icd',section:main.section,label:'ICD10（同一グループ）',value:'OCR code',ocrOriginalValue:'OCR code',confidence:97,required:true,bbox:{...box},masterMatchLinkedTo:id}]
}
export function autoAdoptScenarioFields():OcrExtractionField[]{
 const code1=field('auto-code-check','A1 コード一致：Top 3を参考にモデルが信頼と判定',[0,1,10],[88,85,81],{phase3ModelTrusted:true});code1.masterMatchCandidates!.unshift(candidate(code1.id,0,'code'))
 const code2=field('auto-code-model','A2 コード一致：モデルの信頼判定で採用',[14,15,16],[88,85,81],{phase3ModelTrusted:true});code2.masterMatchCandidates!.unshift(candidate(code2.id,0,'code'))
 const parentCode=field('auto-parent-code','A5 コード複数一致：同一公式コードへ遡及',[1,2,3],[88,85,81]);parentCode.masterMatchCandidates!.unshift(candidate(parentCode.id,1,'code'),candidate(parentCode.id,2,'code'))
 const group=field('auto-parent-group','A8 グループ：父級の名称とコードを一括採用',[1,2,3],[88,85,81],{masterMatchCodeFieldRefs:[{fieldId:'auto-parent-group',label:'傷病名',masterColumnId:'col-d-name'},{fieldId:'auto-parent-group-icd',label:'ICD10',masterColumnId:'col-d-code'}]});group.masterMatchCandidates!.unshift(candidate(group.id,1,'code'),candidate(group.id,2,'code'))
 const both=field('auto-code-and-parent','A9 コード検索・親階層検索が共存',[1,2,3],[88,85,81])
 both.masterMatchCandidates!.unshift(candidate(both.id,1,'code'),candidate(both.id,2,'code'))
 const emptyTop=field('auto-empty-top','A19 コード唯一：Top 3なし、モデルで採用',[],[],{phase3ModelTrusted:true});emptyTop.masterMatchCandidates!.push(candidate(emptyTop.id,0,'code'))
 const flatCode=field('auto-flat-code','A17 階層なし：コード校合で採用',[0,1],[88,85],{masterCodeColumnId:'not-bound',phase3ModelTrusted:true});flatCode.masterMatchCandidates!.unshift(candidate(flatCode.id,0,'code'))
 const cases:OcrExtractionField[] = [
 field('auto-parent-customer-duplicates','A21 父級codeに顧客記録が複数でも公式ノードを採用',[1,2],[88,85]),
 field('auto-multiple-qualified','A11 類似度：複数達標から最高分を採用',[0,1,10],[96,94,91]),
 ...diseaseGroup('auto-group-code','A12 グループ：Top 3を含めモデルが信頼と判定',[0,1,10],[88,85,81],[0],true),
 ...diseaseGroup('auto-group-code-model','A13 グループ：コードのモデル校合で採用',[14,15,16],[88,85,81],[0],true),
 ...diseaseGroup('auto-group-sim-parent','A14 グループ：類似度候補から父級を採用',[1,2,3],[88,85,81]),
 field('auto-flat-sim','A16 階層なし：類似度で採用',[0,1,10],[96,85,81],{masterCodeColumnId:'not-bound'}),flatCode,
 field('auto-single-qualified','A18 類似度：候補1件、閾値で採用',[0],[90]),emptyTop,
 field('auto-perfect','A20 類似度：100%で採用',[0,1],[100,85]),
 both,code1,code2,field('auto-similar','A3 類似度：最高分が閾値を超える',[0,1,10],[96,86,81]),field('auto-boundary','A4 類似度：閾値と同じ90%で採用',[0,1,10],[90,86,81]),parentCode,field('auto-parent-sim','A6 類似度：低い複数候補から共通父級へ遡及',[0,1,2],[88,85,81]),...bankGroup('auto-bank','A7 グループ：組み合わせ類似度で一括採用',96),group,{id:'auto-parent-group-icd',section:group.section,label:'ICD10（A8と同一グループ）',value:'C69',ocrOriginalValue:'C69',confidence:97,required:true,bbox:{...box},masterMatchLinkedTo:group.id}]
 const number=(item:OcrExtractionField)=>Number((item.masterMatchLinkedTo?cases.find(parent=>parent.id===item.masterMatchLinkedTo)?.label:item.label)?.match(/^A(\d+)/)?.[1]||99)
 return cases.sort((a,b)=>number(a)-number(b)||Number(!!a.masterMatchLinkedTo)-Number(!!b.masterMatchLinkedTo))
}
export function manualReviewScenarioFields():OcrExtractionField[]{
 const untrusted=field('review-code','M3 コード唯一一致：モデルが不信頼と判定',[14,15,16],[88,85,81],{phase3ModelTrusted:false});untrusted.masterMatchCandidates!.unshift(candidate(untrusted.id,0,'code'))
 const parentFields=diseaseGroup('review-parent-fields','M8 グループ：公式父級に必要な項目がない',[1,2],[88,85])
 const siteId='review-parent-fields-site'
 parentFields[0].masterMatchCodeFieldRefs!.push({fieldId:siteId,label:'特定部位',masterColumnId:'col-d-site'})
 for(const item of parentFields[0].masterMatchCandidates!){const record=customerIcdSample.find(row=>row[0]===item.sourceRecordId)!;item.linkedValues![siteId]=record[5]}
 parentFields.push({id:siteId,section:parentFields[0].section,label:'特定部位（M8と同一グループ）',value:'OCR部位',ocrOriginalValue:'OCR部位',confidence:97,required:true,bbox:{...box},masterMatchLinkedTo:parentFields[0].id})
 const snapshots=(id:string,label:string,error?:string)=>field(id,label,[0,1],[88,85],{phase3Matched:true,masterMatchConfirmRule:'low-similarity',masterMatchError:error})
 return [field('review-single','M1 類似度：候補1件、閾値未満',[0],[88]),field('review-tie','M2 最高同率でも閾値未満・階層なし',[0,1,10],[88,88,81],{masterCodeColumnId:'not-bound'}),untrusted,field('review-flat','M4 階層ファイルなし：遡及不可',[0,1],[88,85],{masterCodeColumnId:'not-bound'}),field('review-unmapped','M5 候補のコードに公式階層がない',[0,1],[88,85],{masterMatchCandidates:[candidate('review-unmapped',0,'hybrid',88),{value:'階層未設定の傷病名',strategy:'hybrid',similarityScore:85,linkedValues:{'review-unmapped':'階層未設定の傷病名','review-unmapped-icd':'X999'}}]}),field('review-no-parent','M6 最上位まで遡及しても共通父級なし',[0,14],[88,85]),...bankGroup('review-bank','M7 グループ：候補を選んで一括確認',88),...parentFields,field('review-qualified-tie','M13 類似度：最高点が閾値以上でも同率なら確認',[1,0,10],[93,93,81]),...diseaseGroup('review-group-qualified-tie','M14 グループ：最高点が閾値以上でも同率なら確認',[1,0,10],[93,93,81]),snapshots('review-cycle','M9 父子関係の欠落・循環で遡及不可（境界状態）'),snapshots('review-query-error','M10 検索APIの失敗・タイムアウト','検索に失敗しました。時間をおいて再度確認してください。'),snapshots('review-model-error','M11 モデルの検証呼び出し失敗','モデルによる検証に失敗しました。'),field('review-code-multi-flat','M12 コード複数一致・階層なし',[0,1],[88,85],{masterCodeColumnId:'not-bound',masterMatchCandidates:[candidate('review-code-multi-flat',0,'code'),candidate('review-code-multi-flat',1,'code'),candidate('review-code-multi-flat',0,'hybrid',88),candidate('review-code-multi-flat',1,'hybrid',85)]}),field('review-no-candidate','候補なし：OCR原値を保持して確認',[],[],{confidence:97})]
}
