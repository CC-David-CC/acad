export function evaluateWorkerSolid(input:any):Promise<{model:any;resultKind:string;outputId:string;consumed:readonly any[];publicationCheck:()=>void}>;
export function inspectWorkerSolidSelections(model:any):import('./SolidKernel').PrismSelectionsResult['selection']|import('./SolidKernel').SolidSelectionsResult['selection'];
export function inspectWorkerSolidPatternSeeds(model:any):Readonly<{status:'unavailable';reason:string}>|Readonly<{status:'available';sourceFeatureId:number;sourceFaceId:string;sourceRegionId:string;seeds:readonly Readonly<{seedFeatureId:number;kind:'centered-through'}>[]} >;

export function classifyCandidateWorkerSolidPoints(input:any):Promise<readonly Readonly<{point:readonly number[];classification:'inside'|'outside'|'boundary'|'unknown'}>[]>;
export function readCandidateWorkerDrawing(input:any):Promise<Readonly<{observation:import('../mount/ownedDrawingReadProtocol.mjs').DrawingReferenceObservation;views:readonly any[];status:'available'|'unresolved'}>>;
export function readCandidateWorkerPlanarFace(input:any):Promise<import('../mount/ownedPlanarAttachmentProtocol.mjs').PlanarAttachmentObservation>;
export function readCandidateWorkerPlanarFaces(input:any):Promise<readonly any[]>;
export function exportCandidateWorkerSTEP(input:any):Promise<any>;

export interface CandidateManufacturingMeshRead {readonly owner:any;readonly registry:any;readonly engine:'occ';readonly engineRevision:string;readonly body:Readonly<{bodyId:string;featureId:number;expectedMetrics:any}>;readonly controls:Readonly<{linearDeflectionMm:0.01;angularDeflectionRadians:0.1;relative:false;maxVertices:number;maxTriangles:number}>;readonly valid:()=>boolean;}
export function readCandidateWorkerManufacturingMesh(input:CandidateManufacturingMeshRead):Promise<Readonly<{op:'solid.manufacturing.mesh.read';contractVersion:1;unit:'millimeter';body:Readonly<{bodyId:string;featureId:number}>;engine:'occ';engineRevision:string;metadata:import('./SolidKernel').ManufacturingMeshResult['metadata'];buffer:ArrayBuffer;sourceConstruction?:ReturnType<typeof import('./rectilinearConstructionWitness.mjs').captureManufacturingConstruction>}>>;

export function readCandidateWorkerBores(input:any):Promise<Readonly<{observation:import('../mount/ownedBoreReadProtocol.mjs').BoreReferenceObservation;status:'available'|'unresolved'}>>;

export function inspectWorkerMechanicalSource(model:any,sourceFeatureId:number,access:Readonly<{registry:any;history:readonly any[];readSketch:(faceId:string)=>unknown;readFrame:(face:any)=>unknown;readParameterSource:()=>unknown;valid:()=>boolean}>):Readonly<{status:'unavailable';reason:string}>|Readonly<{status:'available';engine:string;engineRevision:string;bodyId:string;featureId:number;sourceFeatureId:number;sourceFaceId:string;sourceRegionId:string;sourceSha256:string;requestSha256:string;source:import('../mount/profileMechanicalSource.mjs').ProfileMechanicalSource}>;

export function readCandidateWorkerDrawingRequirementTargets(input:any):Promise<Readonly<{observation:import('../mount/ownedDrawingReadProtocol.mjs').DrawingRequirementTargetsObservation;status:'available'|'unresolved'}>>;
export function readCandidateWorkerDrawingRequirements(input:any):Promise<Readonly<{observation:import('../mount/ownedDrawingReadProtocol.mjs').DrawingReferenceObservation;status:'available'|'unresolved'}>>;
