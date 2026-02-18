export type GateStatus = 'pass' | 'fail' | 'pending';
export interface GateResult {
    status: GateStatus;
    detail: string;
}
