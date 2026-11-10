// Public authoring inputs only: neither a saved source nor a mathematical proof.
const p=(x,y)=>({x,y});
export const segment=(a,b)=>({kind:'Segment',data:{a:p(...a),b:p(...b)}});
export const circle=(c,r)=>({kind:'Circle',data:{c:p(...c),r}});
export const arc=(a,b,c,branch='proper-ccw')=>({kind:'Arc',data:{a:p(...a),b:p(...b),c:p(...c),branch}});
const row=(name,a,b,count,options={})=>({name,curves:[a,b],count,status:'certified',...options});
export const CASES=Object.freeze([
 row('segment-cross',segment([-5,0],[5,0]),segment([0,-5],[0,5]),1,{reverse:true}),
 row('segment-endpoint',segment([-5,0],[5,0]),segment([5,0],[8,3]),1),
 row('finite-exclusion',segment([0,0],[1,0]),segment([2,-1],[2,1]),0),
 row('separated-parallel',segment([0,0],[4,0]),segment([0,1],[4,1]),0),
 row('linear-overlap',segment([0,0],[4,0]),segment([2,0],[6,0]),0,{overlap:'linear-interval'}),
 row('linear-contact',segment([0,0],[2,0]),segment([2,0],[4,0]),0,{overlap:'linear-contact'}),
 row('segment-circle',segment([-6,3],[6,3]),circle([0,0],5),2,{reverse:true}),
 row('segment-circle-tangent',segment([-6,5],[6,5]),circle([0,0],5),1,{multiplicity:2}),
 row('segment-circle-empty',segment([-6,6],[6,6]),circle([0,0],5),0),
 row('circle-circle',circle([0,0],5),circle([6,0],5),2,{reverse:true}),
 row('circle-circle-tangent',circle([0,0],5),circle([10,0],5),1,{multiplicity:2}),
 row('circle-near-inside',circle([0,0],5),circle([10-1e-6,0],5),2,{allowConditioningUncertainty:true}),
 row('circle-near-outside',circle([0,0],5),circle([10+1e-6,0],5),0,{allowConditioningUncertainty:true}),
 row('circle-coincident',circle([0,0],5),circle([0,0],5),0,{overlap:'periodic-full'}),
 row('circle-nested',circle([0,0],5),circle([0,0],3),0),
 row('circle-disjoint',circle([0,0],5),circle([20,0],5),0),
 row('arc-quarter',arc([5,0],[0,5],[0,0]),segment([-6,3],[6,3]),1,{reverse:true}),
 row('arc-major',arc([0,5],[5,0],[0,0]),segment([-6,3],[6,3]),1),
 row('arc-seam',arc([3,-4],[3,4],[0,0]),segment([4,-6],[4,6]),2),
 row('arc-complementary-contact',arc([5,0],[0,5],[0,0]),arc([0,5],[5,0],[0,0]),0,{overlap:'circular-contact',overlapCount:2}),
 row('circle-quarter-overlap',circle([0,0],5),arc([5,0],[0,5],[0,0]),0,{overlap:'circular-interval'}),
 row('native-census-uncertainty',segment([0,0],[1,0]),segment([0,2**-54],[1,2**-53]),0,{status:'uncertain',reason:'NATIVE_ROOT_CENSUS'}),
 row('tiny-proper-positive',arc([1e-7,0],[0,1e-7],[0,0]),segment([-2e-7,0],[2e-7,0]),1),
 row('source-incidence-uncertainty',arc([1,0],[2**-27,1],[0,0]),segment([-2,0],[2,0]),0,{status:'uncertain',reason:'FINITE_CURVE_SOURCE_UNCERTAIN'}),
 row('full-arc-required-open',arc([1,0],[1,0],[0,0],'full-ccw'),segment([-2,0],[2,0]),0,{status:'unsupported',reason:'FINITE_CURVE_SOURCE_UNSUPPORTED_TARGET',requiredOpen:true})
]);
export const REQUIRED_PHASES=Object.freeze(['runtime-start','unrelated-prism','query-roster','trim-travel','ray-both-choices','noop-collapse','fixed-refusal','selection-refusals','consumed-profile','source-stale','save-A','open-A','typed-radius','parameter-stale','save-B','open-B','reopened-reedit','save-C','open-C','healthy-final']);
export const REQUIRED_TRAVELS=Object.freeze(['point-create-undo','point-create-redo','trim-undo','trim-redo','ray-six-undo','ray-four-undo','ray-four-redo','consumed-trim-undo','consumed-trim-redo','restore-right-fix','typed-definition-undo','typed-definition-redo','reopened-edit-undo','reopened-edit-redo']);
