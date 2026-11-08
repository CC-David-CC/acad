export const SUPPRESSIBLE_FEATURE_TYPES:readonly string[];
export const HISTORY_CONTROL_TYPES:readonly string[];
export function featureSuppressed(entry:any):boolean;
export function historyStateVersion(history:any[]):1|undefined;
export function validateModelHistoryState(model:any):1|undefined;
export function requireActiveFeature<T>(entry:T):T;
