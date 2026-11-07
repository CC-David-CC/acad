import {sketchMutationEpoch} from '../sketchMutationEpoch.mjs';
const LIMIT=1024*1024;
// Private active-editor capture; the coordinator must separately bind the
// face, document/account/window, expressions, boundary and history lifetime.
export function captureActiveSketchForDiagnostics(viewer){
 const ready=()=>{const pm=viewer?.parametricManager,h=viewer?.historyManager,tm=viewer?.toolManager;if(!viewer?.io||!pm||pm.inTransaction||h?.recoverySnapshot||!Array.isArray(pm.stages)||pm.stages.length>128||pm.stages.some(s=>s?.algNumSystem?.inTransaction||s?.algNumSystem?.transactionBefore)||tm&&tm.tool!==tm.defaultTool)throw Error('The sketch is not ready for diagnostics.');return {pm,h,tm,io:viewer.io,stages:pm.stages,systems:pm.stages.map(s=>s?.solverSystem||s?.algNumSystem)}};
 const initial=ready(),epoch=sketchMutationEpoch(),history=initial.h,historyArray=history?.diffs,historyLength=historyArray?.length,historyPointer=history?.historyPointer,historyCounter=history?._counter,lastCheckpoint=history?.lastCheckpoint;
 const quick=()=>{try{const now=ready();return sketchMutationEpoch()===epoch&&now.pm===initial.pm&&now.h===history&&now.tm===initial.tm&&now.io===initial.io&&now.stages===initial.stages&&now.systems.length===initial.systems.length&&now.systems.every((s,i)=>s===initial.systems[i])&&history?.diffs===historyArray&&historyArray?.length===historyLength&&history?.historyPointer===historyPointer&&history?._counter===historyCounter&&history?.lastCheckpoint===lastCheckpoint}catch{return false}};
 const read=()=>{const source=initial.io.serializeSketch(undefined,{strict:true});if(typeof source!=='string'||source.length>LIMIT||new TextEncoder().encode(source).byteLength>LIMIT)throw Error('Sketch exceeds diagnostic limits.');return source};
 const source=read();if(!quick())throw Error('The sketch changed during diagnostic capture.');
 return Object.freeze({source,quickValid:quick,verify(){if(!quick()||read()!==source||!quick())throw Error('The sketch changed during diagnostics.');return true}});
}
