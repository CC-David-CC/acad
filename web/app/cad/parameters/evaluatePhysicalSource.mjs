import {evaluatePhysicalDefinitions,QuantityError} from './physicalQuantities.mjs';
import {capturePhysicalConfigurations} from './physicalSource.mjs';
// Call only in a bounded Worker. Validate each configuration's expressions,
// while evaluating geometry only for the selected configuration downstream.
export function evaluatePhysicalSource(request){
 if(request?.version===1)return evaluatePhysicalDefinitions(request);
 if(request?.version!==2||!Array.isArray(request.configurations))throw new QuantityError('UNSUPPORTED_VERSION','Unsupported physical source.');
 request=capturePhysicalConfigurations(request);
 let selected=evaluatePhysicalDefinitions({version:1,definitions:request.definitions});
 for(const config of request.configurations){const changes=new Map(config.overrides.map(o=>[o.name,o.expression])),definitions=request.definitions.map(d=>({name:d.name,dimension:d.dimension,expression:changes.has(d.name)?changes.get(d.name):d.expression}));const result=evaluatePhysicalDefinitions({version:1,definitions});if(request.activeId===config.id)selected=result;}
 return selected;
}
