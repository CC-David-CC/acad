"""After-whole finite controlled-3MF box geometry/material oracle, no CAD imports."""
import io,zipfile,json,math,collections
from xml.etree import ElementTree as E
NS={'m':'http://schemas.microsoft.com/3dmanufacturing/core/2015/02'}
def need(v,s):
    if not v:raise ValueError(s)
def near(a,b,t=1e-6):need(math.isfinite(a) and abs(a-b)<=t,f'{a} != {b}')
def sub(a,b):return tuple(x-y for x,y in zip(a,b))
def cross(a,b):return(a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0])
def dot(a,b):return math.fsum(x*y for x,y in zip(a,b))
def identity(node):
    if 'transform' in node.attrib:need([float(x) for x in node.attrib['transform'].split()]==[1,0,0,0,1,0,0,0,1,0,0,0],'actual identity placement')
def inspect_mesh(raw,plate,build,metadata):
    with zipfile.ZipFile(io.BytesIO(raw)) as z:
        need(len(z.namelist())==len(set(z.namelist()))==5 and z.testzip() is None,'exact CRC-clean ZIP');need(set(z.namelist())=={'[Content_Types].xml','_rels/','_rels/.rels','3D/','3D/3dmodel.model'} and sum(i.file_size for i in z.infolist())<=64*1024*1024,'closed bounded core3MF structure');xml=z.read('3D/3dmodel.model');need(b'<!DOCTYPE' not in xml and b'<!ENTITY' not in xml,'no external XML authority');root=E.fromstring(xml)
    need(root.tag=='{'+NS['m']+'}model' and root.attrib['unit']=='millimeter','actual mm model');md={n.attrib['name']:n.text for n in root.findall('m:metadata',NS)};need(md['codi:SourceRevision']==metadata['revision'][7:],'actual CURRENT manufacturing revision');provenance=json.loads(md['codi:ManufacturingBindings']);need(provenance['revision']==md['codi:SourceRevision'] and provenance['version']==1 and len(provenance['parts'])==len(provenance['materialPairs'])==1,'one actual bound part/material pair')
    part=provenance['parts'][0];need(part['id']=='projection-plate' and part['name']=='Independent projection replay plate' and len(part['regions'])==1,'exact independent printable part');r=part['regions'][0];need(r['id']=='main' and r['bodyId']==plate['profile']['outputId'] and r['featureId']==plate['profile']['featureId'] and r['engine']=='occ' and r['engineRevision']==build and r['materialId']=='pla' and r['appearanceId']=='blue','actual geometry/material association')
    resources=root.find('m:resources',NS);objects={int(o.attrib['id']):o for o in resources.findall('m:object',NS)};need(len(objects)==3 and len(resources)==4,'exact output objects');pair=provenance['materialPairs'][0];mats=resources.findall('m:basematerials',NS);need(len(mats)==1 and int(mats[0].attrib['id'])==pair['resourceId']==r['materialResourceId'] and len(mats[0])==1 and mats[0][0].attrib=={'name':'PLA','displaycolor':'#3366FF'},'real PLA blue material')
    items=root.find('m:build',NS);need(len(items)==1 and int(items[0].attrib['objectid'])==part['buildResourceId'],'one actual build item');identity(items[0]);refs=objects[part['buildResourceId']].find('m:components',NS);need(len(refs)==1 and int(refs[0].attrib['objectid'])==r['componentResourceId'],'actual part component');identity(refs[0]);refs=objects[r['componentResourceId']].find('m:components',NS);need(len(refs)==1 and int(refs[0].attrib['objectid'])==r['meshResourceId'],'actual region component');identity(refs[0]);obj=objects[r['meshResourceId']];need(int(obj.attrib['pid'])==pair['resourceId'] and int(obj.attrib['pindex'])==0,'actual per-object material binding')
    mesh=obj.find('m:mesh',NS);v=[tuple(float(n.attrib[k]) for k in ('x','y','z')) for n in mesh.find('m:vertices',NS)];t=[tuple(int(n.attrib[k]) for k in ('v1','v2','v3')) for n in mesh.find('m:triangles',NS)];need(8<=len(v)<=150000 and 12<=len(t)<=100000 and len(set(v))==len(v) and all(all(math.isfinite(n) for n in p) for p in v),'bounded distinct actual mesh vertices')
    size=(100,50,20);areas=collections.defaultdict(list);edges=collections.defaultdict(list);links=collections.defaultdict(list);seen=set();adj=[set() for _ in t];vol=[]
    for i,q in enumerate(t):
        need(len(set(q))==3 and all(0<=n<len(v) for n in q) and tuple(sorted(q)) not in seen,'actual distinct finite triangle');seen.add(tuple(sorted(q)));ps=[v[n] for n in q];need(all(-1e-6<=p[j]<=size[j]+1e-6 for p in ps for j in range(3)),'every finite triangle inside analytic box limits');normal=cross(sub(ps[1],ps[0]),sub(ps[2],ps[0]));need(math.hypot(*normal)>0,'nondegenerate actual triangle');supports=[(axis,sign) for axis in range(3) for sign,level in ((-1,0),(1,size[axis])) if all(abs(p[axis]-level)<=1e-6 for p in ps)];need(len(supports)==1,'EVERY entire triangle assigned to exactly one finite planar box face');axis,sign=supports[0];need(normal[axis]*sign>0 and all(abs(normal[j])<=1e-6 for j in range(3) if j!=axis),'outward triangle on actual support');areas[(axis,sign)].append(math.hypot(*normal)/2);vol.append(dot(ps[0],cross(ps[1],ps[2]))/6)
        for j in range(3):
            a,b=q[j],q[(j+1)%3];edges[tuple(sorted((a,b)))].append((a,b,i));links[a].append((b,q[(j+2)%3]))
    need(len(links)==len(v),'no unused mesh vertices')
    for uses in edges.values():
        need(len(uses)==2 and uses[0][:2]==uses[1][:2][::-1],'closed oppositely oriented actual edge uses');a,b=uses[0][2],uses[1][2];adj[a].add(b);adj[b].add(a)
    for uses in links.values():
        graph=collections.defaultdict(list)
        for a,b in uses:graph[a].append(b);graph[b].append(a)
        need(all(len(a)==2 for a in graph.values()),'closed manifold vertex link');todo=[next(iter(graph))];visited=set()
        while todo:
            a=todo.pop()
            if a not in visited:visited.add(a);todo.extend(graph[a])
        need(len(visited)==len(graph),'single vertex-link cycle')
    todo=[0];visited=set()
    while todo:
        a=todo.pop()
        if a not in visited:visited.add(a);todo.extend(adj[a])
    need(len(visited)==len(t) and len(v)-len(edges)+len(t)==2,'one connected closed genus-zero manifold');need(set(areas)=={(i,s) for i in range(3) for s in (-1,1)},'all six outward supports')
    for (axis,sign),parts in areas.items():near(math.fsum(parts),math.prod(size[j] for j in range(3) if j!=axis))
    for j in range(3):near(min(p[j] for p in v),0);near(max(p[j] for p in v),size[j])
    volume=math.fsum(vol);near(volume,100000)
    return {'quality':'independent-entire-finite-box-mesh','vertices':len(v),'triangles':len(t),'volume':volume,'faceAreas':{str(k):math.fsum(x) for k,x in areas.items()},'allTrianglesAssignedExactlyOnce':True,'materialBinding':r,'sourceRevision':md['codi:SourceRevision']}
