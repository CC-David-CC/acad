import type {FiniteCurveMathematicalCertificate} from 'engine/mount/finiteCurveFiniteCertificate.mjs';
import type {FiniteCurveSourceSuccess} from 'sketcher/headless/finiteCurveSourceEnvelope.mjs';

// Convert a Worker-certified result into bounded presentation rows. The
// returned private index map is not itself document or edit authority: the
// coordinator must bind it to the current job, source and query lifetime.
export function describeFiniteCurveEvents(source:FiniteCurveSourceSuccess,certificate:FiniteCurveMathematicalCertificate){
 if(certificate.status==='uncertain')return Object.freeze({status:'uncertain',reason:Object.freeze({layer:'certificate',code:certificate.reason,message:'The curve intersection could not be certified.'}),support:null,events:Object.freeze([]),overlaps:Object.freeze([]),selections:Object.freeze([])});
 const selected=new Set(certificate.finiteRootIndices),selections:any[]=[];
 const events=certificate.roots.filter(root=>selected.has(root.nativeIndex)).map(root=>{
  const editable=root.distanceEvidence.withinBudget&&root.memberships.some(member=>member.selectedDomain&&source.targets.some(target=>target.id===member.curveId&&target.type==='Segment'));
  const eventId=editable?crypto.randomUUID():null;
  if(eventId)selections.push(Object.freeze({eventId,nativeIndex:root.nativeIndex}));
  return Object.freeze({eventId,point:Object.freeze([...root.candidate]),multiplicity:root.multiplicity,occurrences:Object.freeze(root.memberships.map(member=>Object.freeze({curveId:member.curveId,location:member.location}))),errorSquaredUpper:root.distanceEvidence.squaredUpper,withinBudget:root.distanceEvidence.withinBudget});
 });
 return Object.freeze({status:'certified',reason:null,support:Object.freeze({kind:certificate.support.kind,rootCount:certificate.support.rootCount}),events:Object.freeze(events),overlaps:certificate.intervals,selections:Object.freeze(selections)});
}
