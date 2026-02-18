import { GateResult } from './types';
interface ReviewThread {
    isResolved: boolean;
}
export declare function evaluateThreads(threads: ReviewThread[]): GateResult;
export {};
