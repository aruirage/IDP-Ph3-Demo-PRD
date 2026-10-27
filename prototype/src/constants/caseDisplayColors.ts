/**
 * 案件一覧系画面の状態色
 *
 * ファイルリスト：失敗のみ is-negative（赤）、それ以外はデフォルト黒
 * 案件ステータス等：is-muted / is-attention / is-positive / is-negative
 */
export const CASE_DISPLAY_STATUS_CLASS = {
  muted: 'is-muted',
  attention: 'is-attention',
  positive: 'is-positive',
  negative: 'is-negative'
} as const
