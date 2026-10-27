import {
  businessRulesDocTypeJa,
  businessRulesDocTypeZh
} from './businessRulesDocType'
import {
  businessRulesDataMappingJa,
  businessRulesDataMappingZh
} from './businessRulesDataMapping'
import {
  businessRulesVerificationJa,
  businessRulesVerificationZh
} from './businessRulesVerification'
import {
  businessRulesMasterDataJa,
  businessRulesMasterDataZh
} from './businessRulesMasterData'
import {
  businessRulesModelJa,
  businessRulesModelZh
} from './businessRulesModel'
import {
  businessRulesApiJa,
  businessRulesApiZh
} from './businessRulesApi'

export const businessRulesJa = {
  docType: {
    title: '帳票タイプ設定',
    step: {
      classify: '帳票分類設定',
      ocr: '読取項目設定',
      rule: '出力形式設定',
      image: '画像処理設定',
      test: '効果テスト'
    },
    ...businessRulesDocTypeJa
  },
  dataMapping: {
    title: 'データマッピング設定',
    generateSection: 'マッピングルール生成',
    listSection: 'マッピング一覧',
    ...businessRulesDataMappingJa
  },
  verification: {
    title: 'AI検証設定',
    targetDocAll: '対象帳票：全シーン',
    targetDocPrefix: '対象帳票：',
    tabRequiredField: '必須フィールド',
    tabRequiredDoc: '必要書類',
    tabConsistency: '標準データ整合性',
    tabText: 'テキスト検証',
    tabData: 'データ検証',
    tabNaturalLanguage: '自然言語ルール',
    tabSeal: '署名・印鑑検証',
    ...businessRulesVerificationJa
  },
  model: {
    title: 'モデル設定',
    ...businessRulesModelJa
  },
  api: {
    title: 'API設定',
    ...businessRulesApiJa
  },
  masterData: {
    title: 'マスタデータ設定',
    ...businessRulesMasterDataJa
  }
}

export const businessRulesZh = {
  docType: {
    title: '账票类型设置',
    step: {
      classify: 'AI 分类设置',
      ocr: 'AI 读取设置',
      rule: '处理规则设置',
      image: '图像处理设置',
      test: '效果测试'
    },
    ...businessRulesDocTypeZh
  },
  dataMapping: {
    title: '数据映射设置',
    generateSection: '映射规则生成',
    listSection: '映射列表',
    ...businessRulesDataMappingZh
  },
  verification: {
    title: 'AI 检证设置',
    targetDocAll: '对象账票：全部场景',
    targetDocPrefix: '对象账票：',
    tabRequiredField: '必填字段',
    tabRequiredDoc: '必要书类',
    tabConsistency: '标准数据一致性',
    tabText: '文本检证',
    tabData: '数据检证',
    tabNaturalLanguage: '自然语言规则',
    tabSeal: '签名/印章检证',
    ...businessRulesVerificationZh
  },
  model: {
    title: '模型设置',
    ...businessRulesModelZh
  },
  api: {
    title: 'API 管理',
    ...businessRulesApiZh
  },
  masterData: {
    title: '主数据设置',
    ...businessRulesMasterDataZh
  }
}
