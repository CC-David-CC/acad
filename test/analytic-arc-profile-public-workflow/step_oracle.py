"""Independent bounded actual STEP21 plane/cylinder analytic-prism subset.
No OCCT/production imports; original closed oriented trims, finite half/full
CIRCLE and LINE supports, shared topology and assigned physical units.
"""
import collections, math, re
from fractions import Fraction as Q

def require(value, message):
    if not value: raise ValueError(message)
def near(a,b,t=1e-6): require(math.isfinite(a) and abs(a-b)<=t, f'{a} != {b}')
def vector(a,b,t=1e-6):
    require(len(a)==len(b),'vector length')
    for x,y in zip(a,b): near(x,y,t)
TOKEN=re.compile(r"'(?:[^']|'')*'|#[0-9]+|[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[EeDd][+-]?\d+)?|\.[A-Z_0-9]+\.|[A-Z_][A-Z_0-9]*|[(),$*]")
def parameters(text):
    tokens=[];end=0
    for match in TOKEN.finditer(text):
        require(not text[end:match.start()].strip(),'Unsupported STEP parameter syntax');tokens.append(match[0]);end=match.end()
    require(not text[end:].strip(),'Unsupported STEP parameter suffix');pos=0
    def value(depth=0):
        nonlocal pos
        require(depth<=16 and pos<len(tokens),'bounded STEP parameters');token=tokens[pos];pos+=1
        if token=='(':
            result=[]
            if pos<len(tokens) and tokens[pos]!=')':
                while True:
                    result.append(value(depth+1));require(pos<len(tokens),'STEP list terminator')
                    if tokens[pos]!=',': break
                    pos+=1
            require(pos<len(tokens) and tokens[pos]==')','STEP list closure');pos+=1;return tuple(result)
        if token.startswith("'"): return token[1:-1].replace("''", "'")
        if token.startswith('#'): return ('ref',int(token[1:]))
        if token.startswith('.') and token.endswith('.'): return ('enum',token[1:-1])
        if token=='$': return None
        if token=='*': return '*'
        # AP214 uncertainty uses a typed scalar rather than a bare number.
        # Keep the wrapper explicit; it is not a geometric measurement or a
        # reason to relax any of the shell/curve/unit checks below.
        if token=='LENGTH_MEASURE':
            args=value(depth+1)
            require(isinstance(args,tuple) and len(args)==1 and isinstance(args[0],float) and math.isfinite(args[0]),'one finite typed length measure')
            return ('typed',token,args)
        try:
            number=float(token.replace('D','E'));require(math.isfinite(number),'finite STEP number');return number
        except ValueError: raise ValueError('Unsupported STEP parameter token: '+token)
    result=value();require(pos==len(tokens),'Unexpected STEP parameter suffix');return result

from truth import facts,profile_patches

def inspect_step(raw,e):
    require(0<len(raw)<=8388608,'8MiB actual STEP budget');text=raw.decode('ascii')
    require(text.startswith('ISO-10303-21;') and text.rstrip().endswith('END-ISO-10303-21;') and 'AUTOMOTIVE_DESIGN' in text,'actual AP214 framing')
    data=text.split('DATA;',1)[1].split('ENDSEC;',1)[0];statements=[];start=0;quoted=False;i=0
    while i<len(data):
        if data[i]=="'":
            if quoted and i+1<len(data) and data[i+1]=="'":i+=2;continue
            quoted=not quoted
        if data[i]==';' and not quoted:statements.append(data[start:i].strip());start=i+1
        i+=1
    require(not quoted and not data[start:].strip(),'complete actual statements');records={}
    for s in statements:
        if not s:continue
        m=re.fullmatch(r'#([0-9]+)\s*=\s*(.*)',s,re.S);require(m is not None,'actual assignment');n=int(m[1]);body=m[2].strip();v=re.fullmatch(r'([A-Z_][A-Z_0-9]*)\s*(\(.*\))',body,re.S)
        require(n>0 and n not in records,'unique actual entity');records[n]=(v[1],parameters(v[2])) if v else ('COMPLEX',body);require(len(records)<=100000,'entity budget')
    def rec(ref,kind=None):
        require(type(ref)is tuple and len(ref)==2 and ref[0]=='ref' and ref[1] in records,'actual entity reference');t,v=records[ref[1]];require(kind is None or t==kind,'actual entity kind '+str(kind));return t,v
    def xyz(ref):
        v=rec(ref,'CARTESIAN_POINT')[1][1];require(len(v)==3 and all(type(x)is float and math.isfinite(x) for x in v),'actual finite point');return tuple(v)
    def direction(ref,default):
        if ref is None:return default
        v=rec(ref,'DIRECTION')[1][1];require(len(v)==3,'actual 3D direction');near(math.hypot(*v),1,1e-9);return tuple(v)
    def placement(ref):
        v=rec(ref,'AXIS2_PLACEMENT_3D')[1];return xyz(v[1]),direction(v[2],(0,0,1)),direction(v[3],(1,0,0))
    def sub(a,b):return tuple(x-y for x,y in zip(a,b))
    def dot(a,b):return math.fsum(x*y for x,y in zip(a,b))
    def cross(a,b):return(a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0])
    # Complete curve-to-face incidence, using represented binary64 dyadics.
    # The finite artifact domain has cardinal extrusion axes. Refuse an
    # uncertified tilted support instead of treating endpoint samples as a
    # certificate for the intervening analytic curve.
    eps=Q(1e-6)
    def qv(v):return tuple(Q(x)for x in v)
    def qdot(a,b):return sum(x*y for x,y in zip(a,b))
    def parallel(a,b):return cross(qv(a),qv(b))==(0,0,0)
    def plane_point(p,o,n):
        d=sub(qv(p),qv(o));nn=qv(n);return qdot(d,nn)**2<=eps*eps*qdot(nn,nn)
    def radial2(p,o,n):
        d=sub(qv(p),qv(o));nn=qv(n);return qdot(d,d)-qdot(d,nn)**2/qdot(nn,nn)
    def radius_incident(rho2,r):
        r=Q(r);left=rho2+r*r-eps*eps
        return rho2>=0 and(left<=0 or left*left<=4*r*r*rho2)
    def local(p):return sub(p,e.get('origin',[0,0,0]))
    def vertex(ref):return xyz(rec(ref,'VERTEX_POINT')[1][1])
    def sense(v):require(v in (('enum','T'),('enum','F')),'actual literal orientation');return 1 if v==('enum','T') else -1
    def curve(ref):
        seen=set();t,v=rec(ref)
        while t in ('SURFACE_CURVE','SEAM_CURVE'):
            require(ref not in seen and len(seen)<8,'bounded support indirection');seen.add(ref);ref=v[1];t,v=rec(ref)
        require(t in ('LINE','CIRCLE'),'actual analytic LINE/CIRCLE, no flattened spline')
        if t=='CIRCLE':o,z,x=placement(v[1]);require(v[2]>0,'positive circle');return {'kind':t,'o':o,'z':z,'x':x,'r':v[2]}
        w=rec(v[2],'VECTOR')[1];require(type(w[2])is float and w[2]>0,'positive finite LINE scale');return {'kind':t,'o':xyz(v[1]),'d':direction(w[1],None),'s':w[2]}
    solids=[('ref',n)for n,(t,v)in records.items()if t=='MANIFOLD_SOLID_BREP'];solid=one(solids,'actual solid')
    reps=[v for t,v in records.values()if t=='ADVANCED_BREP_SHAPE_REPRESENTATION' and solid in v[1]];context=rec(one(reps,'actual solid representation')[2],'COMPLEX')[1]
    assigned=re.search(r'GLOBAL_UNIT_ASSIGNED_CONTEXT\s*\(\s*\(\s*(#[0-9]+(?:\s*,\s*#[0-9]+)*)\s*\)\s*\)',context);require(assigned is not None,'actual assigned physical units');units=[('ref',int(x))for x in re.findall(r'#([0-9]+)',assigned[1])];require(len(units)==len(set(units))==3,'three actual assigned units')
    for marker,pattern in [('LENGTH_UNIT',r'SI_UNIT\s*\(\s*\.MILLI\.\s*,\s*\.METRE\.\s*\)'),('PLANE_ANGLE_UNIT',r'SI_UNIT\s*\(\s*\$\s*,\s*\.RADIAN\.\s*\)'),('SOLID_ANGLE_UNIT',r'SI_UNIT\s*\(\s*\$\s*,\s*\.STERADIAN\.\s*\)')]:
        body=one([rec(u,'COMPLEX')[1]for u in units if re.search(r'\b'+marker+r'\s*\(\s*\)',rec(u,'COMPLEX')[1])],marker);require(re.search(pattern,body),'actual assigned '+marker)
    faces=rec(rec(solid,'MANIFOLD_SOLID_BREP')[1][1],'CLOSED_SHELL')[1][1];require(0<len(faces)<=256 and len(faces)==len(set(faces)),'complete unique actual closed face roster')
    planes,cylinders=profile_patches(e);T=e['depth'];f=facts(e);uses=collections.defaultdict(list);used_vertices=set();cap_areas={};patches=collections.Counter()
    for face in faces:
        v=rec(face,'ADVANCED_FACE')[1];bounds=v[1];stype,sv=rec(v[2]);fs=sense(v[3]);require(stype in ('PLANE','CYLINDRICAL_SURFACE'),'actual plane/cylinder faces only');o,z,_=placement(sv[1]);ol=local(o);require(len(bounds)==1,'single finite face loop, no invented hole')
        if stype=='CYLINDRICAL_SURFACE':
            require(z[0]==z[1]==0 and abs(z[2])==1,'actual cardinal cylinder axis, no near-axis inference');c=one([c for c in cylinders if abs(ol[0]-c['c'][0])<=1e-6 and abs(ol[1]-c['c'][1])<=1e-6 and abs(sv[2]-c['r'])<=1e-6],'source-authenticated cylinder support');key='wall-'+c['id'];require(fs==c['orientation'],'actual original outward/inward cylinder face sense');patches[key]+=1
        else:
            if abs(z[2])>1-1e-9:
                key='bottom' if abs(ol[2])<=1e-6 else 'top';near(ol[2],0 if key=='bottom' else T);require(z[2]*fs*(-1 if key=='bottom' else 1)>0,'actual outward cap orientation')
            else:
                facepoints=[]
                for bound in bounds:
                    bv=rec(bound)[1]
                    for oe in rec(bv[1],'EDGE_LOOP')[1][1]:
                        ee=rec(rec(oe,'ORIENTED_EDGE')[1][3],'EDGE_CURVE')[1];facepoints.extend((local(vertex(ee[1])),local(vertex(ee[2]))))
                def finite_plane(p):
                    a,b=p['a'],p['b'];d=sub(b,a);l2=dot(d,d);margin=1e-6*math.sqrt(l2)
                    return all(-margin<=dot(sub(v[:2],a),d)<=l2+margin for v in facepoints)
                p=one([p for p in planes if finite_plane(p) and abs(dot(sub((p['a'][0],p['a'][1],0),ol),z))<=1e-6 and abs(dot(sub((p['b'][0],p['b'][1],0),ol),z))<=1e-6],'source Segment support plane');key='plane-'+p['id'];d=sub(p['b'],p['a']);require(dot(z,(d[1],-d[0],0))*fs>0,'actual outward source Segment plane')
            patches[key]+=1
        for bound in bounds:
            bt,bv=rec(bound);require(bt in ('FACE_OUTER_BOUND','FACE_BOUND'),'actual face bound');bs=sense(bv[2]);wire=rec(bv[1],'EDGE_LOOP')[1][1];require(0<len(wire)<=512 and len(set(wire))==len(wire),'bounded original edge loop');directed=[];integral=0;face_curves=[]
            for oriented in wire:
                ev=rec(oriented,'ORIENTED_EDGE')[1];es=sense(ev[4]);edge=ev[3];ee=rec(edge,'EDGE_CURVE')[1];ss=sense(ee[4]);p,q=vertex(ee[1]),vertex(ee[2]);used_vertices.update((ee[1],ee[2]));cgeom=curve(ee[3]);uses[edge].append(es*bs);p,q=(p,q)if es>0 else(q,p);pl,ql=local(p),local(q);directed.append((ee[1]if es>0 else ee[2],ee[2]if es>0 else ee[1]));face_curves.append((cgeom['kind'],edge))
                if stype=='PLANE':
                    require(all(plane_point(v,o,z)for v in(p,q)),'ALL actual face vertices incident on actual support plane')
                    if cgeom['kind']=='LINE':
                        require(qdot(qv(cgeom['d']),qv(z))==0 and plane_point(cgeom['o'],o,z),'ENTIRE LINE support lies in actual face plane')
                    else:
                        require(parallel(cgeom['z'],z)and plane_point(cgeom['o'],o,z),'ENTIRE CIRCLE support plane equals actual face plane')
                        if key in('top','bottom'):require(abs(Q(local(cgeom['o'])[2])-Q(T if key=='top'else 0))<=eps,'ENTIRE cap circle at source finite axial level')
                elif cgeom['kind']=='LINE':
                    require(parallel(cgeom['d'],z)and pl[:2]==ql[:2],'finite cylinder LINE is an actual generator, never a secant between on-cylinder vertices')
                    require(radius_incident(radial2(cgeom['o'],o,z),sv[2])and all(radius_incident(radial2(v,o,z),sv[2])for v in(p,q)),'ENTIRE generator support and actual endpoints on actual cylinder')
                else:
                    require(parallel(cgeom['z'],z),'ENTIRE cylinder CIRCLE plane perpendicular to actual cylinder axis')
                    allowance=eps-abs(Q(cgeom['r'])-Q(sv[2]));require(allowance>=0 and radial2(cgeom['o'],o,z)<=allowance*allowance,'ENTIRE CIRCLE radial support on actual cylinder within one existing incidence budget')
                    require(min(abs(Q(local(cgeom['o'])[2])),abs(Q(local(cgeom['o'])[2])-Q(T)))<=eps,'actual cylinder circular trim belongs to a finite source end')
                for point in (p,q):
                    d=sub(point,cgeom['o'])
                    if cgeom['kind']=='LINE':require(math.hypot(*cross(d,cgeom['d']))<=1e-6,'complete LINE endpoint support')
                    else:near(dot(d,cgeom['z']),0);near(math.hypot(*d),cgeom['r'])
                if cgeom['kind']=='LINE':
                    require(pl!=ql,'nondegenerate actual LINE trim');u=dot(sub(q,p),cgeom['d']);require(u*ss*es>0,'LINE same_sense/traversal consistency');contribution=(pl[0]*ql[1]-ql[0]*pl[1])/2
                else:
                    near(abs(cgeom['z'][2]),1,1e-9);center=local(cgeom['o']);sign=ss*es*(1 if cgeom['z'][2]>0 else -1);start=math.atan2(pl[1]-center[1],pl[0]-center[0]);end=math.atan2(ql[1]-center[1],ql[0]-center[0]);delta=(sign*(end-start))%(2*math.pi)
                    if ee[1]==ee[2]:delta=2*math.pi
                    require(delta>0,'noncollapsed actual circle trim');mid=start+sign*delta/2;sample=(center[0]+cgeom['r']*math.cos(mid),center[1]+cgeom['r']*math.sin(mid));source=one([c for c in cylinders if abs(center[0]-c['c'][0])<=1e-6 and abs(center[1]-c['c'][1])<=1e-6 and abs(cgeom['r']-c['r'])<=1e-6],'authored circle support')
                    if source.get('full'):near(delta,2*math.pi,1e-9)
                    else:
                        near(delta,math.pi,1e-9);require((sample[source['halfAxis']]-source['c'][source['halfAxis']])*source['halfSign']>0,'actual finite trim is original half-sector, not complementary arc')
                    contribution=(cgeom['r']**2*sign*delta+center[0]*(ql[1]-pl[1])-center[1]*(ql[0]-pl[0]))/2
                for pp in (pl,ql):
                    require(-1e-6<=pp[2]<=T+1e-6,'complete finite axial extent')
                    if key in ('top','bottom'):near(pp[2],T if key=='top' else 0)
                    elif stype=='CYLINDRICAL_SURFACE':
                        near(math.hypot(pp[0]-c['c'][0],pp[1]-c['c'][1]),c['r'])
                        if not c.get('full'):require((pp[c['halfAxis']]-c['c'][c['halfAxis']])*c['halfSign']>=-1e-6,'complete finite cylinder endpoint sector')
                integral+=contribution
            require(all(a[1]==b[0]for a,b in zip(directed,directed[1:]+directed[:1])),'actual entity-identity closed wire; no proximity welding')
            if stype=='CYLINDRICAL_SURFACE':
                lines=[edge for kind,edge in face_curves if kind=='LINE'];circles=[edge for kind,edge in face_curves if kind=='CIRCLE'];require(len(face_curves)==4 and len(lines)==len(circles)==2 and len(set(circles))==2 and len(set(lines))==(1 if c.get('full')else 2),'complete finite prism cylinder trim: two end arcs and actual generator uses, no spur/extra revolution')
            elif key in('top','bottom'):require(len(face_curves)==len(planes)+len(cylinders),'complete cap source-curve census')
            else:require(len(face_curves)==4 and all(kind=='LINE'for kind,edge in face_curves),'complete source Segment swept rectangle')
            if key in ('top','bottom'):cap_areas[key]=integral*bs
    require(set(patches)=={'top','bottom'}|{'plane-'+p['id']for p in planes}|{'wall-'+c['id']for c in cylinders} and all(v==1 for v in patches.values()),'every original finite source patch exactly once')
    require(all(len(v)==2 and v[0]==-v[1]for v in uses.values()),'all original BRep edges exactly two opposite face uses')
    require(set(uses)=={('ref',n)for n,(t,v)in records.items()if t=='EDGE_CURVE'} and used_vertices=={('ref',n)for n,(t,v)in records.items()if t=='VERTEX_POINT'},'no orphan/extra actual edge or vertex topology')
    near(cap_areas['top'],float(f['area']));near(cap_areas['bottom'],-float(f['area']));require(len(used_vertices)-len(uses)+len(faces)==2,'actual genus-zero source prism')
    return {'quality':'independent-STEP21-original-plane/cylinder/trim/topology/Green-area','entities':len(records),'faces':len(faces),'edges':len(uses),'vertices':len(used_vertices),'patches':dict(patches),'capAreasMm2':cap_areas,'scope':'finite cardinal source prism; independent parser, not a second kernel'}

def one(xs,label):require(len(xs)==1,'one '+label);return xs[0]

