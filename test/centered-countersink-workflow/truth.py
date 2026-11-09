"""Independent Decimal100 finite countersink truth, not production mathematics.
Angles are the actual represented canonical Number, not an assumed nice angle.
Nominal degree expectations are retained separately by the driver/source oracle.
"""
import math
from decimal import Decimal,localcontext
PI=Decimal('3.14159265358979323846264338327950288419716939937510582097494459230781640628620899862803482534211706798214808651')
def need(v,m):
 if not v:raise ValueError(m)
def exact(v):return Decimal.from_float(v) if isinstance(v,float) else Decimal(v)
def tangent(x):
 with localcontext() as c:
  c.prec=110;need(0<x<PI/2,'finite supported half-angle');sin=term=x;cos=cterm=Decimal(1)
  for n in range(1,256):
   term*=-(x*x)/Decimal((2*n)*(2*n+1));cterm*=-(x*x)/Decimal((2*n-1)*(2*n));sin+=term;cos+=cterm
   if abs(term)<Decimal('1e-105') and abs(cterm)<Decimal('1e-105'):break
  else:raise ValueError('independent trigonometric resource limit')
  need(cos>0,'positive finite independent cosine');return +(sin/cos)
def facts(e):
 with localcontext() as c:
  c.prec=100;need(all(type(e[key]) in (int,float) and math.isfinite(e[key]) for key in ('width','height','thickness','throughDiameter','entryDiameter','includedAngleRadians')),'finite represented source dimensions');T=exact(e['thickness']);d=exact(e['throughDiameter']);D=exact(e['entryDiameter']);alpha=exact(e['includedAngleRadians']);r=d/2;R=D/2;need(0<r<R and 0<alpha<exact(math.pi),'actual original diameter/full-angle domain');k=tangent(alpha/2);h=(R-r)/k;s=T-h;need(0<s<T and 0<h<T,'genuine interior cone, not floor/through substitution');removed=PI*r*r*T+PI*h*(R-r)*(R+2*r)/3;return {key:+value for key,value in {'r':r,'R':R,'alpha':alpha,'k':k,'h':h,'s':s,'T':T,'removed':removed,'volume':exact(e['width'])*exact(e['height'])*T-removed,'cx':exact(e['width'])/2,'cy':exact(e['height'])/2}.items()}
def point_class(point,e,tolerance=Decimal('1e-7')):
 with localcontext() as c:
  c.prec=100;q=facts(e);x,y,z=map(exact,point);w,h=exact(e['width']),exact(e['height']);T=q['T']
  if x < -tolerance or y < -tolerance or z < -tolerance or x>w+tolerance or y>h+tolerance or z>T+tolerance:return 'outside'
  rho=((x-q['cx'])**2+(y-q['cy'])**2).sqrt();limit=q['r'] if z<=q['s'] else q['r']+q['k']*(z-q['s'])
  if rho<limit-tolerance:return 'outside'
  if abs(rho-limit)<=tolerance:return 'boundary'
  return 'boundary' if min(abs(x),abs(y),abs(z),abs(x-w),abs(y-h),abs(z-T))<=tolerance else 'inside'
