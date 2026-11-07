"""Independent checks for ordinary native construction/provenance fixtures."""
import argparse,hashlib,json,math
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('observations',type=Path);p.add_argument('receipt',type=Path);a=p.parse_args();raw=a.observations.read_bytes();rows=[json.loads(line) for line in raw.splitlines()];data={r['case']:r for r in rows};assert len(data)==len(rows)==6
expected={'shared-rectangle':([4],(12,6,8),2400*7),'shared-concave':([5],(15,7,10),1800*7),'shared-concave-circle-hole-oblique':([5,1],(18,8,12),(1800-9*math.pi)*7),'shared-concave-mixed-holes-oblique':([5,1,4],(30,12,20),(1800-9*math.pi-50)*7),'circle-annulus':([1,1],(6,4,4),91*math.pi*7)}
baseline=data['independent-rectangle'];assert baseline['originalEdgesRetainedByWire']==1 and baseline['wireReturnedEdgesRetained']==4 and baseline['prismUsesOriginalEdges']==1 and baseline['originalEdgesInCopiedOutput']==0 and baseline['provenance'] is None
for name,(counts,result,volume) in expected.items():
 row=data[name];assert row['persistentIndicesSaved'] is False and row['circleSeamAuthored'] is False and abs(row['nativeVolume']-volume)<1e-7
 d=row['provenance'];assert d['version']==1 and d['scope']=='response-local' and d['persistentIds'] is False and d['resultCounts']==dict(zip(('edges','faces','vertices'),result))
 assert set(d)=={'version','scope','persistentIds','caps','sourceLoops','resultCounts'} and len(d['sourceLoops'])==len(counts)
 assert 1<=d['caps']['firstFace']<=result[1] and 1<=d['caps']['lastFace']<=result[1] and d['caps']['firstFace']!=d['caps']['lastFace']
 caps=set();sides=set();connectors=set();vertices=set()
 for i,(loop,count) in enumerate(zip(d['sourceLoops'],counts)):
  assert loop['loop']==i and len(loop['edges'])==count and [x['source'] for x in loop['edges']]==list(range(count))
  assert len(loop['vertices'])==(0 if count==1 else count)
  for edge in loop['edges']:
   for key in ('firstEdge','lastEdge'):
    n=edge[key];assert type(n) is int and 1<=n<=result[0] and n not in caps;caps.add(n)
   n=edge['sweptFace'];assert type(n) is int and 1<=n<=result[1] and n not in sides and n not in d['caps'].values();sides.add(n)
  for j,vertex in enumerate(loop['vertices']):
   assert vertex['source']==j
   for key in ('firstVertex','lastVertex'):
    n=vertex[key];assert type(n) is int and 1<=n<=result[2] and n not in vertices;vertices.add(n)
   n=vertex['sweptEdge'];assert type(n) is int and 1<=n<=result[0] and n not in connectors;connectors.add(n)
 assert not caps.intersection(connectors)
 if name!='circle-annulus':assert row['originalEdgesRetainedByWire']==counts[0] and row['prismUsesOriginalEdges']==counts[0] and row['originalEdgesInCopiedOutput']==0
receipt={'status':'PASS','scope':'Actual standalone C++ compiled WASM in Node; no public/native-history/browser qualification','cases':6,'actualCaptureCases':5,'sameGeometryAbsentNativeEdgeRefusalControls':4,'wireCopyFinding':{'independentOriginalRetained':1,'rectangleEdges':4,'sharedOriginalRetained':4},'sourceOrdinals':'response-only, not persistent','outputIndices':'response-local, not persistent','persistentIdsAssigned':False,'observationsSHA256':hashlib.sha256(raw).hexdigest()}
a.receipt.write_text(json.dumps(receipt,indent=2)+'\n');print(json.dumps(receipt))
