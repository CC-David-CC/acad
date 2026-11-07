import {verifyTransitionCandidate} from './verifyTransitionCandidate';
// Private transport verification, not a second authored operation. Recompute
// against exact captured source in a fresh Worker before opening replay/publication.
// Exact bytes bind free geometry as well as metadata, datum, branch and intent;
// accepting merely valid/re-solvable JSON would not establish this provenance.
export function verifySignedDistanceCandidate(request:any){
 return verifyTransitionCandidate('signed-distance',request);
}
