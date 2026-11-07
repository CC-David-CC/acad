// Independent analytic oracles: mm and mm^3. No kernel supplies these answers.
const box=(origin,dimensions)=>({origin,dimensions});
const bounds=(min,max)=>({min,max});
export const numericCases=Object.freeze([
 {id:'box',a:box([0,0,0],[10,20,30]),volume:6000,bounds:bounds([0,0,0],[10,20,30])},
 {id:'offset-fractional-box',a:box([-2.5,3,.25],[.5,4,2]),volume:4,bounds:bounds([-2.5,3,.25],[-2,7,2.25])},
 {id:'overlap-common',op:'common',a:box([0,0,0],[10,20,30]),b:box([5,0,0],[10,20,30]),volume:3000,bounds:bounds([5,0,0],[10,20,30])},
 {id:'overlap-union',op:'union',a:box([0,0,0],[10,20,30]),b:box([5,0,0],[10,20,30]),volume:9000,bounds:bounds([0,0,0],[15,20,30])},
 {id:'overlap-subtract',op:'subtract',a:box([0,0,0],[10,20,30]),b:box([5,0,0],[10,20,30]),volume:3000,bounds:bounds([0,0,0],[5,20,30])},
 {id:'touch-union',op:'union',a:box([0,0,0],[10,20,30]),b:box([10,0,0],[10,20,30]),volume:12000,bounds:bounds([0,0,0],[20,20,30])},
 {id:'disjoint-union',op:'union',a:box([0,0,0],[1,1,1]),b:box([3,0,0],[1,1,1]),volume:2,bounds:bounds([0,0,0],[4,1,1])},
 {id:'disjoint-common',op:'common',a:box([0,0,0],[1,1,1]),b:box([3,0,0],[1,1,1]),volume:0,bounds:null},
 {id:'coincident-subtract',op:'subtract',a:box([0,0,0],[1,1,1]),b:box([0,0,0],[1,1,1]),volume:0,bounds:null}
].map(Object.freeze));
export const boxRequest=value=>({op:'solid.box.create',version:1,unit:'millimeter',origin:[...value.origin],dimensions:[...value.dimensions]});
