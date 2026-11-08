#!/usr/bin/env python3
"""AFTER COMPLETE LOFT WORKFLOW only: independent camera-matrix/bounds review.
No production renderer/math, geometry provider or camera-fit implementation.
"""
import json,math,sys
from pathlib import Path
def require(v,m):
 if not v:raise ValueError(m)
def mul(m,v):return[sum(m[i+4*j]*v[j] for j in range(4))for i in range(4)]
def direction(c):
 v=[x-y for x,y in zip(c['position'],c['target'])];n=math.hypot(*v);require(n>0,'camera direction');return[x/n for x in v]
def check(folder):
 root=Path(folder);r=json.loads((root/'receipt.json').read_text());require(r['status']=='PASS'and r['ownedContextsRetired']and r['sharedBrowserDisconnectedOnly'],'whole real workflow completed/retired')
 fits=r['viewFits'];require(len(fits)==6,'three creation-mode fits and three genuine .cad Opens');require({f['fitted']['mode']for f in fits}=={'PERSPECTIVE','ORTHOGRAPHIC'},'both real projection modes');results=[]
 for f in fits:
  require(f['before']==f['after'],'source/body/history/J/counters/metadata/file tokens/resources exact');a,b=f['prior'],f['fitted'];require(a['mode']==b['mode']and a['up']==b['up'],'preserved camera mode/up');require(all(abs(x-y)<=1e-12 for x,y in zip(direction(a),direction(b))),'preserved orientation');require(b['viewport']['width']>0 and b['viewport']['height']>0,'visible viewport')
  reply=f['result'];require(reply['authoredChanged']is False and reply['boundsSource']=='accepted-native-bounds'and reply['revision']==f['before']['capture']['solids']['revision'],'current camera-only receipt');ids=reply['bodyIds'];require(1<=len(ids)<=32 and len(set(ids))==len(ids),'bounded actual selection');corners=[];worlds=[]
  for id in ids:
   rows=[x for x in f['before']['capture']['solids']['outputs']if x['id']==id];require(len(rows)==1,'actual inspected output');o=rows[0];require(o['displayProjection']['status']=='available'and o['displayProjection']['renderTriangleCount']>0,'genuine display available');bounds=o['metrics']['nativeBounds'];p=o['placement']
   for mask in range(8):
    q=[bounds['max'if mask&(1<<i)else'min'][i]for i in range(3)];w=[sum(p[4*i+j]*q[j]for j in range(3))+p[4*i+3]for i in range(3)];clip=mul(b['projection'],mul(b['worldInverse'],w+[1]));require(all(math.isfinite(x)for x in clip)and clip[3]>0,'finite actual forward camera projection');n=[x/clip[3]for x in clip[:3]];require(all(abs(x)<=1+1e-9 for x in n),'all true Native bound corners visible');corners.append(n);worlds.append(w)
  for i in range(3):require(reply['bounds']['min'][i]==min(p[i]for p in worlds)and reply['bounds']['max'][i]==max(p[i]for p in worlds),'same actual affine bound union')
  span=max(max(p[i]for p in corners)-min(p[i]for p in corners)for i in range(2));require(span>=.7,'ordinary loft occupies at least35% of one viewport dimension');raw=(root/f['screenshot']).read_bytes();require(raw[:8]==b'\x89PNG\r\n\x1a\n','actual retained viewport screenshot');results.append({'label':f['label'],'mode':b['mode'],'viewportNdcSpan':span,'screenshot':f['screenshot']})
 return{'status':'PASS','scope':'complete real loft workflow camera/bounds custody; human image review still required, not Native geometry/50pm display certification','fits':results}
if __name__=='__main__':print(json.dumps(check(sys.argv[1]),indent=2))
