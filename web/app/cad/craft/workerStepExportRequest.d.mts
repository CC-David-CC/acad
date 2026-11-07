export interface WorkerSTEPBodySelection {
 readonly bodyId:string;
 readonly featureId:number;
}
export interface WorkerSTEPExportRequest {
 readonly revision:string;
 readonly geometryRevision:string;
 readonly version:1;
 readonly unit:'millimeter';
 readonly engine:'occ';
 readonly engineRevision:string;
 readonly bodies:readonly Readonly<WorkerSTEPBodySelection>[];
}
export function captureWorkerStepExportRequest(input:unknown):Readonly<WorkerSTEPExportRequest>;
