"""Independent authored analytic truth. No production/native/solver imports."""
import math
from decimal import Decimal,localcontext
from fractions import Fraction as Q
PI=Decimal('3.14159265358979323846264338327950288419716939937510582097494459230781640628620899862803482534211706798214808651')
FINE=Q(1,20000000);INC=Q(1,1000000);DEFL=Q(1,100)
def need(v,m):
 if not v:raise ValueError(m)
def one(xs,m):need(len(xs)==1,'one '+m);return xs[0]
def number(v):need(type(v) in (float,int) and math.isfinite(v),'finite original Number');return Q(v)
def near(a,b,t=FINE):need(abs(number(a)-number(b))<=t,f'coordinate {a} differs from {b}, budget {t}')
def decimal(v):return Decimal(v.numerator)/Decimal(v.denominator) if isinstance(v,Q) else Decimal(str(v))
def frame(e):return {'origin':e.get('origin',[0,0,0]),'x':[1,0,0],'y':[0,1,0],'z':[0,0,1]}
def world(e,p):
 f=frame(e);return [f['origin'][i]+p[i] for i in range(3)]
def facts(e):
 with localcontext() as c:
  c.prec=100;r=decimal(e.get('radius',5));T=decimal(e['depth']);kind=e['kind']
  if kind=='semicircle':
   area=r*r*PI/2;bounds=[[-r,0,0],[r,r,T]];points=[[0,r/2,T/2],[0,-r/2,T/2],[r+1,0,T/2],[0,r/2,T+1],[0,0,T/2]];classes=['inside','outside','outside','outside','boundary']
  elif kind=='major':
   area=r*r*(3*PI/2+1)/2;bounds=[[-r,-r,0],[r,r,T]];points=[[0,0,T/2],[r*Decimal('.6'),-r*Decimal('.6'),T/2],[r+1,0,T/2],[0,0,T+1]];classes=['inside','outside','outside','outside']
  elif kind=='full':
   area=r*r*PI;bounds=[[-r,-r,0],[r,r,T]];points=[[0,0,T/2],[r+1,0,T/2],[0,0,T+1],[r,0,T/2]];classes=['inside','outside','outside','boundary']
  elif kind=='notch':
   area=Decimal(100)-2*PI;bounds=[[0,0,0],[10,10,T]];points=[[5,5,T/2],[5,9,T/2],[5,11,T/2],[1,9,T/2]];classes=['inside','outside','outside','inside']
  elif kind=='slot':
   a=list(map(decimal,e.get('a',[0,0])));b=list(map(decimal,e.get('b',[20,0])));d=[b[i]-a[i] for i in range(2)];L=(d[0]*d[0]+d[1]*d[1]).sqrt();need(L>0,'nonzero genuine Slot axis');area=2*r*L+PI*r*r;bounds=[[min(a[0],b[0])-r,min(a[1],b[1])-r,0],[max(a[0],b[0])+r,max(a[1],b[1])+r,T]];mid=[(a[i]+b[i])/2 for i in range(2)];n=[-d[1]/L,d[0]/L];points=[mid+[T/2],[mid[i]+n[i]*(r+1) for i in range(2)]+[T/2],mid+[T+1]];classes=['inside','outside','outside']
  else:raise ValueError('unknown frozen analytic family')
  origin=list(map(decimal,e.get('origin',[0,0,0])));return {'area':str(area),'volume':str(area*T),'bounds':{k:[float(v+origin[i]) for i,v in enumerate(p)] for k,p in zip(('min','max'),bounds)},'points':[[float(v+origin[i]) for i,v in enumerate(p)] for p in points],'classes':classes,'frame':frame(e)}
def profile_patches(e):
 """Finite artifact domain: cardinal frames, integer radius/depth/axis."""
 r=e.get('radius',5);T=e['depth'];kind=e['kind'];planes=[];walls=[]
 if kind=='semicircle':
  planes=[{'id':'chord','a':[-r,0],'b':[r,0]}];walls=[{'id':'arc','c':[0,0],'r':r,'halfAxis':1,'halfSign':1,'orientation':1}]
 elif kind=='full':walls=[{'id':'arc','c':[0,0],'r':r,'orientation':1,'full':True}]
 elif kind=='slot':
  a,b=e.get('a',[0,0]),e.get('b',[20,0]);need(a[1]==b[1]==0 and a[0]==0 and b[0]>0,'artifact Slot is the frozen returned axis case, not rotated fitting');L=b[0];planes=[{'id':'bottom','a':[0,-r],'b':[L,-r]},{'id':'top','a':[L,r],'b':[0,r]}];walls=[{'id':'left','c':[0,0],'r':r,'halfAxis':0,'halfSign':-1,'orientation':1},{'id':'right','c':[L,0],'r':r,'halfAxis':0,'halfSign':1,'orientation':1}]
 elif kind=='notch':
  planes=[{'id':str(i),'a':a,'b':b} for i,(a,b) in enumerate([([0,0],[10,0]),([10,0],[10,10]),([10,10],[7,10]),([3,10],[0,10]),([0,10],[0,0])])];walls=[{'id':'notch','c':[5,10],'r':2,'halfAxis':1,'halfSign':-1,'orientation':-1}]
 else:raise ValueError('no artifact qualification for this interim positive domain')
 return planes,walls
