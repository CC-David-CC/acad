const assert=require('node:assert/strict'),{test}=require('node:test');
const {Polynomial,Param,FreeFunction,ToThePowerFunction,POW_0_FN,POW_1_FN,POW_2_FN,POW_3_FN,POW_4_FN,COS_FN,SIN_FN,CosineOfSum,SineOfSum,LengthRelationDefinition}=require('./actualCore.cjs');
const scales=[0,1,-1,2,.5],values=[-3,-1.5,-.5,0,.25,1,2,3],powers=[POW_0_FN,POW_1_FN,POW_2_FN,POW_3_FN,POW_4_FN];
const close=(a,b,message)=>assert.ok(Math.abs(a-b)<=Math.max(1e-11,Math.abs(b)*1e-12),message+': '+a+' != '+b);
const equivalent=(factory,k,b)=>{const x=new Param(0),y=new Param(0),original=factory(x),derived=factory(x),identity=derived,transaction=derived.linearSubstitution(x,y,k,b);assert.ok(transaction);transaction();assert.equal(derived,identity);for(const value of values){y.set(value);x.set(k*value+b);close(derived.value(),original.value(),JSON.stringify({k,b,value}));}};
test('current powers preserve values at k=0,+/-1,2,fractional',()=>{for(const fn of powers)for(const k of scales)equivalent(x=>new Polynomial(-7).monomial(3).term(x,fn),k,0);});
test('affine powers use binomial expansion for nonzero offsets',()=>{for(const fn of powers)for(const k of scales)for(const b of[-3,.5])equivalent(x=>new Polynomial(2).monomial(-.25).term(x,fn),k,b);});
test('mixed/repeated powers expand as products, not stale array indices',()=>{for(const k of scales)for(const b of[0,2])equivalent(x=>new Polynomial(4).monomial(3).term(x,POW_2_FN).term(x,POW_3_FN).monomial(-2).term(x,POW_1_FN).term(x,POW_2_FN),k,b);});
test('trig singleton/composed functions preserve argument and derivative',()=>{
 for(const fn of[COS_FN,SIN_FN,new CosineOfSum(2,.3),new SineOfSum(-.5,2)])for(const k of scales)for(const b of[0,.7])equivalent(x=>new Polynomial(4).monomial(3).term(x,fn).term(x,POW_2_FN),k,b);
 const x=new Param(.4),y=new Param(.3),p=new Polynomial().monomial(1).term(x,COS_FN).term(x,SIN_FN);assert.equal(p.substitute(x,y,2),true);const gradient=p.monomials.reduce((s,m)=>s+m.differentiate(y),0);close(gradient,2*Math.cos(4*y.get()),'chain rule');
});
test('identity renaming preserves singleton identity and opaque functions',()=>{
 const x=new Param(2),y=new Param(3),opaque=new FreeFunction(v=>Math.exp(v),v=>Math.exp(v),'opaque'),p=new Polynomial().monomial(3).term(x,opaque).term(x,COS_FN);assert.equal(p.substitute(x,y,1),true);assert.ok(p.monomials[0].terms.some(t=>t.fn===opaque));assert.ok(p.monomials[0].terms.some(t=>t.fn===COS_FN));close(p.value(),3*Math.exp(3)*Math.cos(3),'opaque identity');
});
test('unsupported composition refuses atomically after a supported factor',()=>{
 const x=new Param(2),y=new Param(3),opaque=new FreeFunction(v=>Math.exp(v),v=>Math.exp(v),'opaque'),p=new Polynomial(4).monomial(3).term(x,POW_2_FN).term(x,opaque),before=p.toString(),rows=p.monomials,terms=rows[0].terms;assert.equal(p.substitute(x,y,2),false);assert.equal(p.toString(),before);assert.equal(p.monomials,rows);assert.equal(p.monomials[0].terms,terms);assert.equal(p.usedApproximateReduction,false);assert.equal(p.substitute(x,y,0),true);close(p.value(),4,'zero scale');
});
test('custom expansion composes exactly; nonfinite composition refuses',()=>{
 const custom=new FreeFunction(v=>v*v+2*v+3,v=>2*v+2,'supported',(k,x,b)=>new Polynomial(b*b+2*b+3).monomial(k*k).term(x,POW_2_FN).monomial(2*k*(b+1)).term(x,POW_1_FN));for(const k of scales)for(const b of[0,2])equivalent(x=>new Polynomial().monomial(2).term(x,custom),k,b);
 const x=new Param(1),y=new Param(2),invalid=new FreeFunction(()=>NaN,()=>NaN,'invalid'),p=new Polynomial().monomial(1).term(x,invalid),before=p.toString();assert.equal(p.substitute(x,y,0),false);assert.equal(p.toString(),before);
});
test('chained substitutions retain original values and row origin',()=>{
 const x=new Param(0),y=new Param(0),z=new Param(0),factory=()=>new Polynomial(7).monomial(2).term(x,POW_3_FN).monomial(-3).term(x,SIN_FN),original=factory(),p=factory(),origin=new Map([[p,'authored-row']]);assert.equal(p.substitute(x,y,2),true);const tx=p.linearSubstitution(y,z,-.5,1);assert.ok(tx);tx();assert.equal(origin.get(p),'authored-row');for(const v of values){z.set(v);x.set(2*(-.5*v+1));close(p.value(),original.value(),'chain');}
});
test('provenance marks only touched descendants; underflow is not exact',()=>{
 const x=new Param(2),y=new Param(3),z=new Param(1),affected=new Polynomial().monomial(1).term(x,POW_2_FN),unrelated=new Polynomial().monomial(1).term(z,POW_1_FN);affected.linearSubstitution(x,y,2,0,true)();unrelated.linearSubstitution(x,y,2,0,true)();assert.equal(affected.usedApproximateReduction,true);assert.equal(unrelated.usedApproximateReduction,false);const small=new Polynomial().monomial(1).term(x,POW_2_FN);small.linearSubstitution(x,y,1e-200,0)();assert.equal(small.usedApproximateReduction,true);
});
test('residual40 baseline: corrected equation rejects the old false root',()=>{
 const t=new Param(10),x=new Param(2),y=new Param(1),p=new Polynomial().monomial(1).term(t,POW_1_FN).term(x,POW_2_FN).monomial(-4).term(t,POW_1_FN);assert.equal(p.value(),0);assert.equal(p.substitute(x,y,2),true);assert.equal(p.value(),0);assert.equal(p.cancelCommonNonzeroFactors(new Set([t])),1);y.set(Math.SQRT2);close(t.get()*p.value(),40,'original wrong-root residual');
});
test('excessive expansion keeps the numerical equation without partial mutation',()=>{
 const x=new Param(1),y=new Param(2),p=new Polynomial(1).monomial(1).term(x,ToThePowerFunction.get(32)).term(x,ToThePowerFunction.get(32)),rows=p.monomials;assert.equal(p.linearSubstitution(x,y,2,1),null);assert.equal(p.monomials,rows);assert.equal(p.value(),2);
});

test('actual physical-length magnitude relation preserves negative polar branches',()=>{
 const a=new Param(-7),b=new Param(-2),q=new Param(2),original=[],derived=[];LengthRelationDefinition.collectPolynomials(original,[a,b],{factor:2,offset:3});LengthRelationDefinition.collectPolynomials(derived,[a,b],{factor:2,offset:3});assert.equal(original[0].value(),0);assert.equal(derived[0].substitute(b,q,-1),true);assert.equal(derived[0].value(),0);
 for(const value of values){q.set(value);b.set(-value);close(derived[0].value(),original[0].value(),'signed physical magnitude');}
 const r=new Param(1),before=derived[0].toString();assert.equal(derived[0].substitute(q,r,2),false);assert.equal(derived[0].toString(),before);
});
