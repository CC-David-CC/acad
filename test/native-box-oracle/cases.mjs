export const SEED=0x5eedc0de;
const box=(id,origin,dimensions)=>({op:'box',id,origin,dimensions}),op=(op,a,b)=>({op,a,b});
const A=box('A',[0,0,0],[10,10,10]),I=box('I',[2,2,2],[6,6,6]),C=box('C',[20,0,0],[10,10,10]);
const H=op('subtract',A,I),D=op('union',H,C),partial=box('P',[2,2,2],[3,6,6]),island=box('S',[3,3,3],[2,2,2]),large=box('L',[1,1,1],[8,8,8]),overlap=box('B',[5,0,0],[10,10,10]);
export function cases(){
 const rows=[],add=(id,expr)=>rows.push({id,expr});
 for(const [name,b]of [['exact',I],['partial',partial],['island',island],['enclosing',large],['disjoint',C]]){add('hollow-'+name,op('union',H,b));add(name+'-hollow',op('union',b,H));}
 add('composite-fill',op('union',D,I));add('fill-composite',op('union',I,D));add('filled-before-disjoint',op('union',op('union',H,I),C));
 add('composite-minus-disjoint',op('subtract',D,C));add('composite-common-outer',op('common',D,A));add('disjoint-common',op('common',A,C));add('identical-subtract',op('subtract',A,A));
 for(const operation of ['union','common','subtract']){add('overlap-'+operation,op(operation,A,overlap));add('overlap-reversed-'+operation,op(operation,overlap,A));}
 for(const [name,origin]of [['face',[10,0,0]],['edge',[10,10,0]],['vertex',[10,10,10]]]){const b=box('T',origin,[10,10,10]);for(const operation of ['union','common']){add('contact-'+name+'-'+operation,op(operation,A,b));add('contact-'+name+'-'+operation+'-reversed',op(operation,b,A));}}
 const transform=(expr,permutation,delta)=>expr.op==='box'?box(expr.id,permutation.map((axis,i)=>expr.origin[axis]+delta[i]),permutation.map(axis=>expr.dimensions[axis])):op(expr.op,transform(expr.a,permutation,delta),transform(expr.b,permutation,delta));
 for(const [name,expr]of [['partial',op('union',H,partial)],['fill',op('union',D,I)],['island',op('union',H,island)]]){
  add('translated-'+name,transform(expr,[0,1,2],[-13,7,29]));add('permuted-'+name,transform(expr,[2,0,1],[0,0,0]));
 }
 let state=SEED;const random=()=>{state^=state<<13;state^=state>>>17;state^=state<<5;return state>>>0;};
 for(let n=0;n<7;n++){
  const b=Array.from({length:3},(_,j)=>box('R'+j,[0,1,2].map(()=>Number(random()%13)-6),[0,1,2].map(()=>2+random()%7)));
  add('seeded-'+n,op(['union','common','subtract'][random()%3],op(['union','common','subtract'][random()%3],b[0],b[1]),b[2]));
 }
 if(rows.length!==48)throw Error('Fixed case budget changed: '+rows.length);return rows;
}
