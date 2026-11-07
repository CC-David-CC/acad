// Detached unit-contract data only. Actual app tests author through public commands.
export const frame={origin:[0,0,0],x:[1,0,0],y:[0,1,0],z:[0,0,1]};
export function source(){
 const corners=[[0,0],[100,0],[100,50],[0,50]],objects=corners.map((a,i)=>({id:'rect-'+i,type:'Segment',role:null,stage:0,data:{a:{x:a[0],y:a[1]},b:{x:corners[(i+1)%4][0],y:corners[(i+1)%4][1]}}}));
 const constraints=[...corners.map((_,i)=>({typeId:'PCoincident',objects:['rect-'+i+':B','rect-'+((i+1)%4)+':A'],constants:{}})),...corners.map((_,i)=>({typeId:i%2?'Vertical':'Horizontal',objects:['rect-'+i],constants:{angle:String(i*90)}})),{typeId:'LockPoint',objects:['rect-0:A'],constants:{x:'0',y:'0'}},{typeId:'SegmentLength',objects:['rect-0'],constants:{length:'W'}},{typeId:'SegmentLength',objects:['rect-1'],constants:{length:'H'}}];
 return JSON.stringify({version:3,objects,stages:[{constraints,generators:[]}],dimensions:[],labels:[],constants:'',boundary:{lines:[],arcs:[],circles:[],nurbses:[]},metadata:{boundaryFrame:frame}});
}
