import type { PreprocessDocType } from '@/constants/preprocessDocTypes'
import { PREPROCESS_DOC_TYPES } from '@/constants/preprocessDocTypes'

export interface ExportTableColumnTemplate {
  id: string
  label: string
}

export interface ExportTableTemplate {
  id: string
  label: string
  section: string
  sortOrder: number
  columns: ExportTableColumnTemplate[]
  demoRows: Record<string, string>[]
}

const TABLE_TEMPLATES: Partial<Record<PreprocessDocType, ExportTableTemplate[]>> = {
  '領収書・診療明細書': [
    {
      id: 'rcpt-line-items',
      label: '診療項目明細',
      section: '明細',
      sortOrder: 5,
      columns: [
        { id: 'visit_date', label: '診療日' },
        { id: 'category', label: '区分' },
        { id: 'item_name', label: '項目名' },
        { id: 'points', label: '点数' },
        { id: 'count', label: '回数' },
        { id: 'total_points', label: '合計点数' }
      ],
      demoRows: [
        {
          visit_date: '2025-09-08',
          category: '初・再診',
          item_name: '再診料',
          points: '288',
          count: '1',
          total_points: '288'
        },
        {
          visit_date: '2025-09-08',
          category: '医学管理等',
          item_name: '管理料',
          points: '415',
          count: '3',
          total_points: '1,245'
        },
        {
          visit_date: '2025-09-09',
          category: '手術',
          item_name: '腹腔鏡下虫垂切除術',
          points: '4,480',
          count: '2',
          total_points: '8,960'
        },
        {
          visit_date: '2025-09-10',
          category: '処置',
          item_name: '創傷処置',
          points: '120',
          count: '2',
          total_points: '240'
        },
        {
          visit_date: '2025-09-11',
          category: '検査',
          item_name: '血液検査',
          points: '358',
          count: '1',
          total_points: '358'
        },
        {
          visit_date: '2025-09-12',
          category: '投薬',
          item_name: '抗生剤投与',
          points: '359',
          count: '1',
          total_points: '359'
        }
      ]
    }
  ]
}

export function getTableTemplatesForDocType(docType: string): ExportTableTemplate[] {
  if ((PREPROCESS_DOC_TYPES as readonly string[]).includes(docType)) {
    return TABLE_TEMPLATES[docType as PreprocessDocType] ?? []
  }
  return []
}
