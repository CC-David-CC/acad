import {createCadAgent} from './cad-agent.mjs';

// Same registered commands and one document-pinned agent. This recipe holds
// metadata only: source bytes and the candidate model remain private to Craft.
export function createSourceDimensionRegionExample(options={}){
 const agent=createCadAgent(options);
 return Object.freeze({
  windowId:agent.windowId,
  async inspect({featureId,constraintId,value}){
   const history=await agent.execute('inspect-selected-profile-history'),sources=await agent.execute('inspect-closed-sketches');
   const rows=history.features.filter(f=>f.featureId===featureId);
   if(rows.length!==1)throw Error('Choose one actual inspected selected-extrusion feature.');
   const feature=rows[0];
   return agent.execute('inspect-selected-profile-source-dimension-regions',{revision:history.revision,sourceRevision:sources.revision,index:feature.index,featureId,constraintId,value});
  },
  async commit(proposal,regionId){
   if(!proposal?.regions?.some(r=>r.regionId===regionId&&r.support==='supported'))throw Error('Choose an explicit supported region from this actual proposal.');
   const {revision,sourceRevision,index,featureId,constraintId,value,candidateSourceDigest}=proposal;
   return agent.execute('edit-selected-profile-source-dimension-region',{revision,sourceRevision,index,featureId,constraintId,value,regionId,candidateSourceDigest});
  }
 });
}
