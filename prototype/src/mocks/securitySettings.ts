import { ref } from 'vue'

export type DataRetentionPeriod =
  | '7d'
  | '14d'
  | '1m'
  | '2m'
  | '3m'
  | '6m'
  | '12m'

export type IdleSessionTimeout = '15m' | '30m' | '60m' | '2h' | 'none'

export interface SecuritySettingsState {
  dataRetention: DataRetentionPeriod
  idleSessionTimeout: IdleSessionTimeout
}

export const securitySettings = ref<SecuritySettingsState>({
  dataRetention: '1m',
  idleSessionTimeout: 'none'
})

export const DATA_RETENTION_OPTIONS: DataRetentionPeriod[] = [
  '7d',
  '14d',
  '1m',
  '2m',
  '3m',
  '6m',
  '12m'
]

export const IDLE_SESSION_TIMEOUT_OPTIONS: IdleSessionTimeout[] = [
  '15m',
  '30m',
  '60m',
  '2h',
  'none'
]
