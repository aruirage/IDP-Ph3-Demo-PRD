import type { PreprocessDocType } from '@/constants/preprocessDocTypes'
import { PREPROCESS_DOC_TYPES } from '@/constants/preprocessDocTypes'

export interface ExportFieldTemplate {
  id: string
  label: string
  section: string
  demoValue: string
}

const TEMPLATES: Record<PreprocessDocType, ExportFieldTemplate[]> = {
  保険金請求書: [
    { id: 'claim-policy', label: '証券番号', section: '契約情報', demoValue: '02468135-008-002' },
    { id: 'claim-contractor', label: 'ご契約者氏名', section: '契約情報', demoValue: '高橋 誠' },
    { id: 'claim-contractor-kana', label: 'ご契約者氏名（カナ）', section: '契約情報', demoValue: 'タカハシマコト' },
    { id: 'claim-insured', label: '被保険者氏名', section: '被保険者情報', demoValue: '高橋 真由美' },
    { id: 'claim-insured-birth', label: '被保険者生年月日', section: '被保険者情報', demoValue: '1992-07-18' },
    { id: 'claim-type', label: '請求区分', section: '請求内容', demoValue: '入院給付金' },
    { id: 'claim-admit', label: '入院日', section: '請求内容', demoValue: '2025-09-08' },
    { id: 'claim-discharge', label: '退院日', section: '請求内容', demoValue: '2025-09-14' },
    { id: 'claim-days', label: '入院日数', section: '請求内容', demoValue: '7' },
    { id: 'claim-amount', label: '請求金額', section: '請求内容', demoValue: '420,000' },
    { id: 'claim-bank', label: '振込先金融機関名', section: '振込先', demoValue: '三菱UFJ銀行 渋谷支店' },
    { id: 'claim-account', label: '口座番号', section: '振込先', demoValue: '普通 1234567' },
    { id: 'claim-received', label: '受付日', section: '請求内容', demoValue: '2025-09-22' }
  ],
  診断書: [
    { id: 'diag-patient', label: '患者氏名', section: '基本情報', demoValue: '高橋 真由美' },
    { id: 'diag-patient-kana', label: '患者氏名（カナ）', section: '基本情報', demoValue: 'タカハシマユミ' },
    { id: 'diag-birth', label: '生年月日', section: '基本情報', demoValue: '1992-07-18' },
    { id: 'diag-disease', label: '傷病名', section: '診断内容', demoValue: '急性虫垂炎' },
    { id: 'diag-onset', label: '発症日', section: '診断内容', demoValue: '2025-09-07' },
    { id: 'diag-admit', label: '入院日', section: '診断内容', demoValue: '2025-09-08' },
    { id: 'diag-discharge', label: '退院日', section: '診断内容', demoValue: '2025-09-14' },
    { id: 'diag-hospital', label: '医療機関名', section: '基本情報', demoValue: '慶應大学病院' },
    { id: 'diag-dept', label: '診療科', section: '基本情報', demoValue: '外科' },
    { id: 'diag-doctor', label: '担当医師氏名', section: '基本情報', demoValue: '佐藤 健一' },
    { id: 'diag-summary', label: '診断内容摘要', section: '診断内容', demoValue: '腹腔鏡下虫垂切除術を実施。術後経過良好。' },
    { id: 'diag-date', label: '発行日', section: '基本情報', demoValue: '2025-09-20' }
  ],
  '領収書・診療明細書': [
    { id: 'rcpt-patient', label: '患者氏名', section: '基本情報', demoValue: '高橋 真由美' },
    { id: 'rcpt-hospital', label: '医療機関名', section: '基本情報', demoValue: '慶應大学病院' },
    { id: 'rcpt-month', label: '診療年月', section: '明細', demoValue: '2025年9月' },
    { id: 'rcpt-dept', label: '診療科', section: '明細', demoValue: '外科' },
    { id: 'rcpt-visit-date', label: '診療日', section: '明細', demoValue: '2025-09-08' },
    { id: 'rcpt-points-basic', label: '初・再診料点数', section: '明細', demoValue: '288' },
    { id: 'rcpt-points-treatment', label: '医学管理等点数', section: '明細', demoValue: '1,245' },
    { id: 'rcpt-points-surgery', label: '手術点数', section: '明細', demoValue: '8,960' },
    { id: 'rcpt-points-total', label: '合計点数', section: '明細', demoValue: '12,450' },
    { id: 'rcpt-copay-ratio', label: '自己負担割合', section: '明細', demoValue: '30%' },
    { id: 'rcpt-copay', label: '自己負担額', section: '明細', demoValue: '37,350' },
    { id: 'rcpt-meal', label: '食事療養費', section: '明細', demoValue: '14,280' },
    { id: 'rcpt-total-pay', label: '領収金額', section: '明細', demoValue: '51,630' },
    { id: 'rcpt-issue-date', label: '領収日', section: '明細', demoValue: '2025-09-15' }
  ],
  本人確認書類: [
    { id: 'id-type', label: '本人確認書類種別', section: '本人情報', demoValue: '運転免許証' },
    { id: 'id-name', label: '氏名', section: '本人情報', demoValue: '吉田 翔太' },
    { id: 'id-name-kana', label: '氏名（カナ）', section: '本人情報', demoValue: 'ヨシダショウタ' },
    { id: 'id-birth', label: '生年月日', section: '本人情報', demoValue: '1985-11-03' },
    { id: 'id-address', label: '住所', section: '本人情報', demoValue: '神奈川県横浜市西区みなとみらい2-2-1' },
    { id: 'id-number', label: '証明書番号', section: '本人情報', demoValue: '12345-678901-02' },
    { id: 'id-expiry', label: '有効期限', section: '本人情報', demoValue: '2028-11-03' }
  ],
  入院証明書: [
    { id: 'adm-insured', label: '被保険者氏名', section: '基本情報', demoValue: '吉田 美咲' },
    { id: 'adm-insured-kana', label: '被保険者氏名（カナ）', section: '基本情報', demoValue: 'ヨシダミサキ' },
    { id: 'adm-admit', label: '入院日', section: '入院情報', demoValue: '2025-10-02' },
    { id: 'adm-discharge', label: '退院日', section: '入院情報', demoValue: '2025-10-09' },
    { id: 'adm-days', label: '入院日数', section: '入院情報', demoValue: '8' },
    { id: 'adm-hospital', label: '医療機関名', section: '基本情報', demoValue: '横浜市立みなと赤十字病院' },
    { id: 'adm-dept', label: '診療科', section: '基本情報', demoValue: '消化器内科' },
    { id: 'adm-room', label: '病室区分', section: '入院情報', demoValue: '一般病棟' },
    { id: 'adm-disease', label: '主病名', section: '入院情報', demoValue: '急性胃十二指腸潰瘍' },
    { id: 'adm-issue-date', label: '発行日', section: '基本情報', demoValue: '2025-10-10' }
  ],
  その他: [
    { id: 'other-title', label: '書類名', section: '基本情報', demoValue: '手術同意書' },
    { id: 'other-patient', label: '患者氏名', section: '基本情報', demoValue: '高橋 真由美' },
    { id: 'other-date', label: '作成日', section: '基本情報', demoValue: '2025-09-08' },
    { id: 'other-hospital', label: '医療機関名', section: '基本情報', demoValue: '慶應大学病院' },
    { id: 'other-note', label: '摘要', section: '備考', demoValue: '腹腔鏡下虫垂切除術に関する同意' }
  ]
}

export function getFieldTemplatesForDocType(docType: string): ExportFieldTemplate[] {
  if ((PREPROCESS_DOC_TYPES as readonly string[]).includes(docType)) {
    return TEMPLATES[docType as PreprocessDocType]
  }
  return TEMPLATES['その他']
}
