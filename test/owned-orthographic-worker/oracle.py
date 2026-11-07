"""Offline independent analytic checks of actual Worker-consumed coefficients.
No producer expected values, meshes or native ordinals supply measurements.
"""
import json,math,hashlib,sys
from pathlib import Path
receipt=json.loads(Path(sys.argv[1]).read_text());root=Path(sys.argv[2]);assert receipt['status']=='PASS';rows={r['label']:r for r in receipt['actual']['views']};actual={}
def close(x,y):assert math.isfinite(x) and abs(x-y)<=1e-7,(x,y)
def curves(r,visibility=None):return[c for g in r['groups'] if visibility is None or g['visibility']==visibility for c in g['curves']]
def extrema(c):
 lo,hi=c['range'];assert hi>lo
 if c['kind']=='line':return[[c['origin'][i]+t*c['direction'][i] for i in range(2)] for t in [lo,hi]]
 assert c['kind']=='projected-conic';times=[lo,hi]
 for i in range(2):
  t=math.atan2(c['b'][i],c['a'][i])
  for base in [t,t+math.pi]:
   for k in range(math.floor((lo-base)/(2*math.pi))-1,math.ceil((hi-base)/(2*math.pi))+2):
    x=base+k*2*math.pi
    if lo<=x<=hi:times.append(x)
 return[[c['center'][i]+c['a'][i]*math.cos(t)+c['b'][i]*math.sin(t) for i in range(2)] for t in times]
def radii(c):
 a,b=c['a'],c['b'];xx=a[0]**2+b[0]**2;yy=a[1]**2+b[1]**2;xy=a[0]*a[1]+b[0]*b[1];d=math.hypot(xx-yy,2*xy);return math.sqrt(max(0,(xx+yy+d)/2)),math.sqrt(max(0,(xx+yy-d)/2))
for label,row in rows.items():
 b=(root/(label+'.json')).read_bytes();assert len(b)==row['consumer']['sink']['bytes'];assert hashlib.sha256(b).hexdigest()==row['consumer']['sink']['sha256'];r=json.loads(b);actual[label]=r;assert r['quality']=='native-brep-orthographic' and not r['persistentIds'] and r['copyTShapesDisjoint'];assert len(r['groups'])==8;assert len(curves(r))==r['fragmentCount'];assert row['preserved'] and row['before']==row['after']
q=math.sqrt(.5);expected={'plate-top':([0,0],[100,50]),'plate-front':([0,0],[100,10]),'plate-right':([0,0],[50,10]),'plate-translated-view':([-7,-11],[93,39]),'plate-oblique-ellipse':([-50*q,-10*q],[100*q,75]),'located-top':([0,0],[100,50]),'located-front':([0,0],[100,10]),'located-right':([0,0],[50,10]),'genuine-multi-chunk':([0,0],[100,50]),'healthy-after-refusals':([0,0],[100,10]),'repeat-top':([0,0],[100,50])}
for label,(low,high) in expected.items():
 ps=[p for c in curves(actual[label]) for p in extrema(c)]
 for i in range(2):close(min(p[i] for p in ps),low[i]);close(max(p[i] for p in ps),high[i])
for label,center in [('plate-top',[50,25]),('repeat-top',[50,25]),('located-top',[50,25]),('plate-translated-view',[43,14])]:assert any(c['kind']=='projected-conic' and all(abs(c['center'][i]-center[i])<=1e-7 for i in range(2)) and all(abs(r-5)<=1e-7 for r in radii(c)) for c in curves(actual[label],'visible')),label
for label,positions in [('plate-front',[45,55]),('plate-right',[20,30]),('located-front',[45,55]),('located-right',[20,30]),('healthy-after-refusals',[45,55])]:
 for x in positions:assert any(c['kind']=='line' and abs(c['start'][0]-x)<=1e-7 and abs(c['end'][0]-x)<=1e-7 and abs(min(c['start'][1],c['end'][1]))<=1e-7 and abs(max(c['start'][1],c['end'][1])-10)<=1e-7 for c in curves(actual[label],'hidden')),(label,x)
 rank1=[c for c in curves(actual[label]) if c['kind']=='projected-conic' and abs(c['a'][1])+abs(c['b'][1])<=1e-7 and abs(c['a'][0]**2+c['b'][0]**2-25)<=1e-7];assert rank1;ps=[p for c in rank1 for p in extrema(c)];close(min(p[0] for p in ps),positions[0]);close(max(p[0] for p in ps),positions[1])
assert any(c['kind']=='projected-conic' and abs(radii(c)[0]-5)<=1e-7 and abs(radii(c)[1]-5*q)<=1e-7 and abs(c['center'][0]-25*q)<=1e-7 and abs(c['center'][1]-(37.5-10*q))<=1e-7 for c in curves(actual['plate-oblique-ellipse'],'visible'))
for i in range(128):
 center=[4+6*(i%16),4+6*(i//16)];assert any(c['kind']=='projected-conic' and all(abs(c['center'][j]-center[j])<=1e-7 for j in range(2)) and all(abs(r-1)<=1e-7 for r in radii(c)) for c in curves(actual['genuine-multi-chunk'],'visible')),center
assert rows['genuine-multi-chunk']['consumer']['sink']['bytes']>65536
assert actual['repeat-top']==actual['plate-top']
print(json.dumps({'status':'PASS','views':len(rows),'holeCenters':128,'absoluteToleranceMm':1e-7,'reconstructedJsonOver64KiB':rows['genuine-multi-chunk']['consumer']['sink']['bytes'],'scope':'actual Worker-derived analytic records offline; no app/dimension/GUI claim'},indent=2))
