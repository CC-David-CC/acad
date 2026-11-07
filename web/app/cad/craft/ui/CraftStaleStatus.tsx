import React from 'react';
import {useStream} from 'ui/effects';

// Cleanup failure is distinct from stale authored geometry.
export function CraftStaleStatus() {
  const failure=useStream(ctx=>ctx.craftService.pipelineFailure$);
  const cleanup=useStream(ctx=>ctx.craftService.engineCleanupFailure$);
  if(!failure&&!cleanup)return null;
  return <div role='alert' style={{position:'absolute',top:4,left:'50%',transform:'translateX(-50%)',zIndex:1000,padding:'8px 12px',background:'#713b00',color:'white',maxWidth:'min(90%, 700px)'}}>
    {failure && <div>{failure.retainedLastComplete
      ? 'Model regeneration failed. The displayed model is the last accepted result and is out of date.'
      : 'Model regeneration failed. No current model is available.'}{failure.userMessage && <span> {failure.userMessage}</span>}</div>}
    {cleanup && <div>Engine cleanup failed. Further model evaluation is unavailable. Close and reopen this CAD window.</div>}
  </div>;
}
