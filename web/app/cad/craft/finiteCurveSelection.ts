// One private, response-local selection slot per command owner. The coordinator
// must call clear at a new query, actual mutation entry, travel, Open, disposal,
// or an unknown settlement. An equal restored sketch does not restore a slot.
export function createFiniteCurveSelectionSlot(){
 let slot:any=null;
 const unavailable=()=>Object.assign(Error('The curve selection is unavailable.'),{code:'STALE_CURVE_QUERY',selectionDisposition:'unavailable'});
 function clear(){slot=null;}
 function issue(job:any,faceId:string,revision:string,prepared:any,described:any,domain:any){
  clear();job.current();
  if(!Array.isArray(described.selections)||described.selections.length===0)return null;
  const queryId=crypto.randomUUID();
  slot=Object.freeze({queryId,job,faceId,revision,prepared,domain,selections:described.selections});
  return queryId;
 }
 function resolve(queryId:string,eventId:string,faceId:string,revision:string){
  const selected=slot;
  // A foreign ID cannot consume another current selection.
  if(!selected||selected.queryId!==queryId)throw unavailable();
  try{selected.job.current();}catch{
   clear();throw Object.assign(Error('The curve selection is no longer current.'),{code:'STALE_CURVE_QUERY',selectionDisposition:'revoked'});
  }
  if(selected.faceId!==faceId||selected.revision!==revision)throw Object.assign(Error('The selection belongs to another sketch revision.'),{code:'CURVE_QUERY_SELECTION_MISMATCH',selectionDisposition:'retained'});
  const event=selected.selections.find((row:any)=>row.eventId===eventId);
  if(!event)throw Object.assign(Error('Choose an event from this query.'),{code:'CURVE_QUERY_SELECTION_MISMATCH',selectionDisposition:'retained'});
  return Object.freeze({job:selected.job,prepared:selected.prepared,domain:selected.domain,nativeIndex:event.nativeIndex});
 }
 return Object.freeze({issue,resolve,clear});
}
