#!/usr/bin/env python3
# Independent exact rational clipping by x>=0,y>=0,x+y<=2; synthetic math only.
from fractions import Fraction as F
from itertools import combinations,product
import json
A=[(0,0),(2,0),(0,2)];grid=list(product(range(-1,4),repeat=2));cases=[]
def orient(a,b,c):return(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0])
def clipped(B):
 p=[tuple(map(F,q))for q in B]
 for fn in[lambda q:q[0],lambda q:q[1],lambda q:2-q[0]-q[1]]:
  out=[]
  if not p:return[]
  for i,b in enumerate(p):
   a=p[i-1];fa,fb=fn(a),fn(b)
   if(fa<0)!=(fb<0):
    t=fa/(fa-fb);out.append(tuple(a[k]+t*(b[k]-a[k])for k in[0,1]))
   if fb>=0:out.append(b)
  p=out
 return set(p)
for B in combinations(grid,3):
 if orient(*B)==0:continue
 polygon=clipped(B);matches=[i for i,p in enumerate(B)if p in A]
 for mask in range(1<<len(matches)):
  shared={matches[j]for j in range(len(matches))if mask&(1<<j)};points=[list(p)+[0]for p in A];indices=[];common=[]
  for i,p in enumerate(B):
   if i in shared:indices.append(A.index(p));common.append(tuple(map(F,p)))
   else:indices.append(len(points));points.append(list(p)+[0])
  if len(common)==3:extra=True
  elif not polygon:extra=False
  elif not common:extra=True
  elif len(common)==1:extra=any(p!=common[0]for p in polygon)
  else:
   a,b=common;extra=any(orient(a,b,p)!=0 or any(p[k]<min(a[k],b[k])or p[k]>max(a[k],b[k])for k in[0,1])for p in polygon)
  cases.append({'points':points,'a':[0,1,2],'b':indices,'extra':extra})
print(json.dumps(cases,separators=(',',':')))
