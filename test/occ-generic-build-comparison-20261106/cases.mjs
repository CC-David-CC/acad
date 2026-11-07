const a={origin:[0,0,0],dimensions:[10,10,10]};
const box=(origin,dimensions=[10,10,10])=>({origin,dimensions});
const bounds=(min,max)=>({min,max});
const A=bounds([0,0,0],[10,10,10]);
export const cases=[
 {id:'disjoint',a,b:box([20,0,0]),expect:{union:{volume:2000,bounds:bounds([0,0,0],[30,10,10]),solids:2},subtract:{volume:1000,bounds:A,solids:1},common:{volume:0,bounds:null,solids:0}}},
 {id:'overlap',a,b:box([5,0,0]),expect:{union:{volume:1500,bounds:bounds([0,0,0],[15,10,10]),solids:1},subtract:{volume:500,bounds:bounds([0,0,0],[5,10,10]),solids:1},common:{volume:500,bounds:bounds([5,0,0],[10,10,10]),solids:1}}},
 {id:'contained',a,b:box([2,2,2],[6,6,6]),expect:{union:{volume:1000,bounds:A,solids:1},subtract:{volume:784,bounds:A,solids:1},common:{volume:216,bounds:bounds([2,2,2],[8,8,8]),solids:1}}},
 {id:'coincident',a,b:box([0,0,0]),expect:{union:{volume:1000,bounds:A,solids:1},subtract:{volume:0,bounds:null,solids:0},common:{volume:1000,bounds:A,solids:1}}},
 {id:'face-contact',a,b:box([10,0,0]),expect:{union:{volume:2000,bounds:bounds([0,0,0],[20,10,10]),solids:null},subtract:{volume:1000,bounds:A,solids:1},common:{volume:0,bounds:null,solids:0,mayBeUnsupportedLowerDimension:true}}},
 {id:'edge-contact',a,b:box([10,10,0]),expect:{union:{volume:2000,bounds:bounds([0,0,0],[20,20,10]),solids:2},subtract:{volume:1000,bounds:A,solids:1},common:{volume:0,bounds:null,solids:0,mayBeUnsupportedLowerDimension:true}}},
 {id:'point-contact',a,b:box([10,10,10]),expect:{union:{volume:2000,bounds:bounds([0,0,0],[20,20,20]),solids:2},subtract:{volume:1000,bounds:A,solids:1},common:{volume:0,bounds:null,solids:0,mayBeUnsupportedLowerDimension:true}}}
];
