const box=(origin,dimensions)=>({op:'solid.box.create',version:1,unit:'millimeter',origin,dimensions});
export const cases=[
 {id:'origin-asymmetric',request:box([0,0,0],[100,50,20]),ordinary:true},
 {id:'translated-asymmetric',request:box([-13,7,2],[11,17,23]),ordinary:true},
 {id:'fractional-dyadic',request:box([.125,-.375,1.5],[2.25,3.5,4.75]),ordinary:true},
 {id:'fractional-decimal',request:box([.1,.2,.3],[10.1,20.2,30.3]),ordinary:true},
 {id:'large-origin',request:box([999900,-999999,1000000],[100,200,.125]),ordinary:true},
 {id:'tiny-origin',request:box([0,0,0],[1e-6,2e-6,3e-6])},
 {id:'tiny-large-origin',request:box([1000000,1000000,1000000],[1e-6,2e-6,3e-6])},
 {id:'below-native-tolerance',request:box([0,0,0],[1e-9,2e-9,3e-9])},
 {id:'binary64-extents-collapse',request:box([1000000,1000000,1000000],[Number.MIN_VALUE,Number.MIN_VALUE,Number.MIN_VALUE])},
 {id:'zero-dimension',request:box([0,0,0],[0,2,3]),invalid:true},
 {id:'negative-dimension',request:box([0,0,0],[-1,2,3]),invalid:true},
 {id:'out-of-domain-dimension',request:box([0,0,0],[1000001,2,3]),invalid:true}
];
