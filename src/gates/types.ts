export type GateStatus = 'pass' | 'fail' | 'pending' | 'warn'

export interface GateResult {
  status: GateStatus
  detail: string
}
