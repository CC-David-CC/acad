const pi=Math.PI,frame=[0,0,0,1,0,0,0,1,0,0,0,1],axis=[0,0,0,0,1,0];
const polygon=p=>[2,p.length,...p.flat()],face=(loops,f=frame)=>[1,...f,loops.length,...loops.flat()];
const step=face([polygon([[0,0],[10,0],[10,10],[5,10],[5,30],[0,30]])]);
const cases=[
 ['step-full',step,axis,2*pi,1500*pi,[-10,0,-10],[10,30,10],[[[7,5,0],0],[[7,20,0],1],[[3,20,0],0],[[10,5,0],2]]],
 ['step-full-reverse',step,axis,-2*pi,1500*pi,[-10,0,-10],[10,30,10],[[[7,5,0],0],[[7,20,0],1]]],
 ['step-quarter',step,axis,pi/2,375*pi,[0,0,-10],[10,30,0],[[[3,5,-3],0],[[3,5,3],1]]],
 ['step-quarter-reverse',step,axis,-pi/2,375*pi,[0,0,0],[10,30,10],[[[3,5,3],0],[[3,5,-3],1]]],
 ['step-half',step,axis,pi,750*pi,[-10,0,-10],[10,30,0],[[[-3,5,-3],0],[[-3,5,3],1]]],
 ['source-edited',face([polygon([[0,0],[12,0],[12,10],[6,10],[6,35],[0,35]])]),axis,2*pi,2340*pi,[-12,0,-12],[12,35,12],[[[7,20,0],1],[[4,20,0],0]]],
 ['axis-edited',step,[-2,0,0,0,5,0],2*pi,2300*pi,[-14,0,-12],[10,30,12],[[[6,20,0],1],[[3,20,0],0]]],
 ['hollow-shaft',face([polygon([[5,0],[10,0],[10,20],[5,20]])]),axis,2*pi,1500*pi,[-10,0,-10],[10,20,10],[[[7,10,0],0],[[2,10,0],1]]],
 ['circle-torus',face([[1,8,0,2]]),axis,2*pi,64*pi*pi,[-10,-2,-10],[10,2,10],[[[8,0,0],0],[[0,0,0],1],[[8,2,0],2]]],
 ['annular-torus',face([[1,8,0,2],[1,8,0,1]]),axis,2*pi,48*pi*pi,[-10,-2,-10],[10,2,10],[[[9.5,0,0],0],[[8,0,0],1],[[9,0,0],2]]],
 ['oblique-hollow',face([polygon([[5,0],[10,0],[10,20],[5,20]])],[100,200,300,Math.SQRT1_2,Math.SQRT1_2,0,0,0,1,Math.SQRT1_2,-Math.SQRT1_2,0]),[100,200,300,0,0,20],2*pi,1500*pi,[90,190,300],[110,210,320],[[[107,200,310],0],[[102,200,310],1]]],
 ['cone-pole',face([polygon([[0,0],[10,0],[0,20]])]),axis,2*pi,2000*pi/3,[-10,0,-10],[10,20,10],[[[2,10,0],0],[[8,10,0],1],[[0,20,0],2]]]
].map(([name,values,axis,angle,volume,min,max,points])=>({name,values,axis,angle,volume,bounds:{min,max},points}));
const many=Array.from({length:257},(_,i)=>[20+5*Math.cos(2*pi*i/257),5*Math.sin(2*pi*i/257)]);
const refusals=[
 ['zero-angle',step,axis,0,'REVOLVE_INVALID_ANGLE'],['over-angle',step,axis,2*pi+.01,'REVOLVE_INVALID_ANGLE'],
 ['zero-axis',step,[0,0,0,0,0,0],pi,'REVOLVE_INVALID_AXIS'],['off-plane-origin',step,[0,0,1,0,1,0],pi,'REVOLVE_AXIS_NOT_COPLANAR'],
 ['off-plane-direction',step,[0,0,0,0,1,1],pi,'REVOLVE_AXIS_NOT_COPLANAR'],
 ['cross-axis',face([polygon([[-2,0],[2,0],[2,20],[-2,20]])]),axis,pi,'REVOLVE_PROFILE_CROSSES_AXIS'],
 ['circle-cross-axis',face([[1,1,0,2]]),axis,2*pi,'REVOLVE_PROFILE_CROSSES_AXIS'],
 ['bad-version',[2,...step.slice(1)],axis,pi,'REVOLVE_INVALID_REQUEST'],['bad-profile',step.slice(0,-1),axis,pi,'REVOLVE_INVALID_PROFILE'],
 ['native-output-budget',face([polygon(many)]),axis,2*pi,'REVOLVE_RESOURCE_LIMIT']
].map(([name,values,axis,angle,error])=>({name,values,axis,angle,error}));
module.exports={cases,refusals,frame,step,axis};
