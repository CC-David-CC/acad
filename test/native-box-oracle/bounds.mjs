import {cellOracle,truth} from './cells.mjs';
export function boundedOracle(expr){
 const oracle=cellOracle(expr),p=oracle.planes,min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
 for(let x=0;x<p[0].length-1;x++)for(let y=0;y<p[1].length-1;y++)for(let z=0;z<p[2].length-1;z++){
  const index=[x,y,z],mid=index.map((n,i)=>(p[i][n]+p[i][n+1])/2);
  if(truth(expr,mid))for(let i=0;i<3;i++){min[i]=Math.min(min[i],p[i][index[i]]);max[i]=Math.max(max[i],p[i][index[i]+1]);}
 }
 return {...oracle,bounds:oracle.volume?{min,max}:null};
}
