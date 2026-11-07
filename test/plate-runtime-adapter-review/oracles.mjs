// Independent mathematical expectations only. No model or native operation.
const cases=[];
for(const [width,height,depth]of [[100,50,20],[100,50,12],[150,30,20]]){
 const base=width*height*depth,five=base-41*Math.PI*depth;
 cases.push({unit:'millimeter',width,height,depth,centerDiameter:10,cornerDiameter:4,offsetX:10,offsetY:10,
 volumesMm3:{rectangle:base,centered:base-25*Math.PI*depth,fiveHoles:five,fiveHolesAndFourVerticalFilletsR2:five-16*(1-Math.PI/4)*depth,fiveHolesAndFourVerticalChamfers1:five-2*depth},
 bounds:{min:[0,0,0],max:[width,height,depth]},centers:[[width/2,height/2],[10,10],[width-10,10],[width-10,height-10],[10,height-10]]});
}
console.log(JSON.stringify({status:'ANALYTIC_EXPECTATIONS_ONLY_UNEXECUTED',volumeToleranceMm3:'max(1e-6,1e-9*abs(expected))',boundsToleranceMm:1e-7,pointClassificationToleranceMm:1e-7,rectangleConstraintResidualMm:1e-8,cases,scope:'Four convex outer vertical edges; fillet/chamfer in separate genuine parts. Full original-rectangle seven-hole/pattern test remains required.'},null,2));
