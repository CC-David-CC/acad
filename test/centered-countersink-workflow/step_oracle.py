"""Independent bounded actual STEP21 plane/cylinder/CONE finite subset.
No OCCT/production imports; closed oriented trims, real shared transition rim,
LINE support/whole generatrix and explicit assigned length/angle units.
"""
import collections, math, re

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

from decimal import Decimal,localcontext
from truth import facts,tangent,PI

def inspect_step(raw,expected):
    require(0<len(raw)<=8388608,'8MiB actual public STEP cap');text=raw.decode('ascii');require(text.startswith('ISO-10303-21;') and text.rstrip().endswith('END-ISO-10303-21;') and 'AUTOMOTIVE_DESIGN' in text,'actual AP214/STEP21 framing');data=text.split('DATA;',1)[1].split('ENDSEC;',1)[0];statements=[];start=0;quoted=False;i=0
    while i<len(data):
        if data[i]=="'":
            if quoted and i+1<len(data) and data[i+1]=="'":i+=2;continue
            quoted=not quoted
        if data[i]==';' and not quoted:statements.append(data[start:i].strip());start=i+1
        i+=1
    require(not quoted and not data[start:].strip(),'complete actual STEP statements');records={}
    for statement in statements:
        if not statement:continue
        m=re.fullmatch(r'#([0-9]+)\s*=\s*(.*)',statement,re.S);require(m is not None,'actual STEP assignment');index=int(m[1]);body=m[2].strip();regular=re.fullmatch(r'([A-Z_][A-Z_0-9]*)\s*(\(.*\))',body,re.S);require(index>0 and index not in records,'unique actual STEP entity identity');records[index]=(regular[1],parameters(regular[2])) if regular else ('COMPLEX',body);require(len(records)<=100000,'bounded actual STEP entities')
    def record(ref,kind=None):
        require(isinstance(ref,tuple) and len(ref)==2 and ref[0]=='ref' and ref[1] in records,'actual STEP reference');typ,args=records[ref[1]];require(kind is None or kind==typ,'actual STEP kind '+str(kind));return typ,args
    def xyz(ref):
        p=record(ref,'CARTESIAN_POINT')[1][1];require(len(p)==3 and all(isinstance(x,float) and math.isfinite(x) and abs(x)<=4e6 for x in p),'bounded actual STEP point');return p
    def direction(ref,default=None):
        if ref is None:require(default is not None,'direction default');return default
        p=record(ref,'DIRECTION')[1][1];require(len(p)==3,'actual3D direction');near(math.hypot(*p),1,1e-9);return p
    def placement(ref):
        a=record(ref,'AXIS2_PLACEMENT_3D')[1];return xyz(a[1]),direction(a[2],(0.,0.,1.))
    def vertex(ref):return xyz(record(ref,'VERTEX_POINT')[1][1])
    def sub(a,b):return tuple(x-y for x,y in zip(a,b))
    def dot(a,b):return math.fsum(x*y for x,y in zip(a,b))
    def cross(a,b):return(a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0])
    def curve(ref):
        typ,a=record(ref);visited=set()
        while typ in ('SURFACE_CURVE','SEAM_CURVE'):
            require(ref not in visited and len(visited)<8,'bounded curve support indirection');visited.add(ref);ref=a[1];typ,a=record(ref)
        require(typ in ('LINE','CIRCLE'),'actual exact line/circle trims, no spline approximation')
        if typ=='CIRCLE':o,z=placement(a[1]);require(a[2]>0,'positive actual circle');return {'kind':typ,'center':o,'axis':z,'radius':a[2]}
        _,v=record(a[2],'VECTOR');require(isinstance(v[2],float) and math.isfinite(v[2]) and v[2]>0,'finite actual LINE vector scale');return {'kind':typ,'origin':xyz(a[1]),'direction':direction(v[1]),'scale':v[2]}
    def curve_incidence(c,p,q,sense):
        require(sense in (('enum','T'),('enum','F')),'actual EDGE_CURVE same_sense')
        if c['kind']=='LINE':
            ts=[]
            for v in (p,q):
                d=sub(v,c['origin']);require(math.hypot(*cross(d,c['direction']))<=1e-7,'actual LINE endpoint-support incidence');t=dot(d,c['direction'])/c['scale'];require(math.isfinite(t),'finite actual LINE parameter');vector(tuple(c['origin'][j]+t*c['scale']*c['direction'][j] for j in range(3)),v,1e-7);ts.append(t)
            require(ts[0]!=ts[1] and ((ts[1]>ts[0])==(sense==('enum','T'))),'actual LINE traversal versus actual same_sense')
        else:
            for v in (p,q):d=sub(v,c['center']);require(abs(dot(d,c['axis']))<=1e-7,'actual CIRCLE endpoint plane');near(math.hypot(*d),c['radius'],1e-7)
    solids=[('ref',i) for i,(kind,_) in records.items() if kind=='MANIFOLD_SOLID_BREP'];require(len(solids)==1,'ONE actual manifold solid');solid=solids[0]
    representations=[args for kind,args in records.values() if kind in ('ADVANCED_BREP_SHAPE_REPRESENTATION','MANIFOLD_SURFACE_SHAPE_REPRESENTATION') and solid in args[1]];require(len(representations)==1,'actual solid representation/context binding');context=record(representations[0][2],'COMPLEX')[1];m=re.search(r'GLOBAL_UNIT_ASSIGNED_CONTEXT\s*\(\s*\(\s*(#[0-9]+(?:\s*,\s*#[0-9]+)*)\s*\)\s*\)',context);require(m is not None,'actual solid assigned unit context');units=[('ref',int(x)) for x in re.findall(r'#([0-9]+)',m[1])];require(len(units)==len(set(units))==3,'three actual assigned unit identities');kinds=[]
    for ref in units:
        body=record(ref,'COMPLEX')[1]
        if re.search(r'\bLENGTH_UNIT\s*\(\s*\)',body):require(re.search(r'\bSI_UNIT\s*\(\s*\.MILLI\.\s*,\s*\.METRE\.\s*\)',body),'actual assigned millimeter length');kinds.append('millimeter')
        elif re.search(r'\bPLANE_ANGLE_UNIT\s*\(\s*\)',body):require(re.search(r'\bSI_UNIT\s*\(\s*\$\s*,\s*\.RADIAN\.\s*\)',body),'actual assigned RADIAN plane-angle, not inference from90');kinds.append('radian')
        elif re.search(r'\bSOLID_ANGLE_UNIT\s*\(\s*\)',body):require(re.search(r'\bSI_UNIT\s*\(\s*\$\s*,\s*\.STERADIAN\.\s*\)',body),'actual assigned solid angle');kinds.append('steradian')
        else:raise ValueError('unsupported actual assigned unit')
    require(set(kinds)=={'millimeter','radian','steradian'},'complete actual physical unit context');shell=record(solid,'MANIFOLD_SOLID_BREP')[1][1];faces=record(shell,'CLOSED_SHELL')[1][1];require(0<len(faces)<=256 and len(faces)==len(set(faces)),'bounded actual closed face roster');edge_use=collections.Counter();edge_incidence=collections.defaultdict(list);used_edges=set();used_vertices=set();face_contribution=0;planar=[];cylinders=[];cones=[];f=facts(expected);W,H,T=expected['width'],expected['height'],expected['thickness'];r,R,s,k=(float(f[x]) for x in ('r','R','s','k'));cx,cy=W/2,H/2
    def surface_incidence(loops,typ,origin,axis,radius,semi):
        if typ!='PLANE':near(abs(axis[2]),1,1e-12);near(axis[0],0,1e-12);near(axis[1],0,1e-12);near(origin[0],cx,1e-7);near(origin[1],cy,1e-7)
        slope=None if typ!='CONICAL_SURFACE' else math.copysign(float(tangent(Decimal.from_float(abs(semi)))),semi)*axis[2]
        if slope is not None:near(slope,k,1e-12);near(2*math.atan(abs(slope)),expected['includedAngleRadians'],1e-12)
        for loop in loops:
            for edge in loop:
                c=edge['curve']
                for point in edge['points']:
                    relative=sub(point,origin)
                    if typ=='PLANE':require(abs(dot(relative,axis))<=1e-7,'actual endpoint on plane')
                    else:near(math.hypot(relative[0],relative[1]),radius+(point[2]-origin[2])*slope if slope is not None else radius,1e-7)
                if typ=='PLANE':
                    if c['kind']=='LINE':require(abs(dot(c['direction'],axis))<=1e-12 and abs(dot(sub(c['origin'],origin),axis))<=1e-7,'ENTIRE actual LINE lies on actual plane')
                    else:require(math.hypot(*cross(c['axis'],axis))<=1e-12 and abs(dot(sub(c['center'],origin),axis))<=1e-7,'ENTIRE circle plane matches actual plane')
                elif c['kind']=='CIRCLE':
                    require(math.hypot(*cross(c['axis'],axis))<=1e-12 and math.hypot(c['center'][0]-origin[0],c['center'][1]-origin[1])<=1e-7,'actual coaxial circular rim');near(c['radius'],radius+(c['center'][2]-origin[2])*slope if slope is not None else radius,1e-7)
                elif typ=='CYLINDRICAL_SURFACE':require(math.hypot(*cross(c['direction'],axis))<=1e-12,'ENTIRE cylinder seam LINE follows axis');near(math.hypot(c['origin'][0]-origin[0],c['origin'][1]-origin[1]),radius,1e-7)
                else:
                    # Exact retained terms evaluated at Decimal100: a LINE's
                    # squared conical residual is quadratic in its actual curve
                    # parameter. Endpoints AND any interior extremum bound the
                    # ENTIRE finite generatrix; no coefficient epsilon discard.
                    with localcontext() as ctx:
                        ctx.prec=100;D=Decimal.from_float;K=(tangent(D(abs(semi)))*(-1 if semi<0 else 1))*D(axis[2]);a=[D(c['origin'][j])-D(origin[j]) for j in range(3)];v=[D(x)*D(c['scale']) for x in c['direction']];base=D(radius)+K*a[2];A=v[0]**2+v[1]**2-(K*v[2])**2;B=2*(a[0]*v[0]+a[1]*v[1]-base*K*v[2]);C=a[0]**2+a[1]**2-base**2;ts=[sum((D(p[j])-D(c['origin'][j]))*D(c['direction'][j]) for j in range(3))/D(c['scale']) for p in edge['points']];lo,hi=min(ts),max(ts);values=[lo,hi]
                        if A!=0:
                            extremum=-B/(2*A)
                            if lo<extremum<hi:values.append(extremum)
                        minRadius=min(base+K*v[2]*lo,base+K*v[2]*hi);require(minRadius>0,'finite positive conical branch over ENTIRE trim');error=max(abs(A*t*t+B*t+C) for t in values);require(error<=Decimal('1e-7')*(2*minRadius-Decimal('1e-7')),'ENTIRE actual finite LINE satisfies cone equation within explicit incidence budget')
    for face_ref in faces:
        a=record(face_ref,'ADVANCED_FACE')[1];bounds,surface,sense=a[1:];require(sense in (('enum','T'),('enum','F')),'actual face sense');loops=[];face_contribution+=2-len(bounds)
        for bound in bounds:
            typ,b=record(bound);require(typ in ('FACE_BOUND','FACE_OUTER_BOUND') and len(b)==3 and b[2] in (('enum','T'),('enum','F')),'actual finite face bound');sign=1 if b[2]==('enum','T') else -1;loop=record(b[1],'EDGE_LOOP')[1];edges=[]
            for ref in loop[1]:
                o=record(ref,'ORIENTED_EDGE')[1];e=record(o[3],'EDGE_CURVE')[1];require(o[4] in (('enum','T'),('enum','F')),'actual oriented edge');p,q=vertex(e[1]),vertex(e[2]);c=curve(e[3]);curve_incidence(c,p,q,e[4]);ends=(e[1],e[2]) if o[4]==('enum','T') else(e[2],e[1]);edges.append({'ref':o[3],'vertices':(e[1],e[2]),'points':(p,q),'ends':ends,'curve':c,'sameSense':e[4],'effectiveSign':(1 if o[4]==('enum','T') else -1)*sign,'boundKind':typ});used_vertices.update((e[1],e[2]));used_edges.add(o[3]);edge_use[o[3]]+=1
            require(edges and all(edges[j]['ends'][1]==edges[(j+1)%len(edges)]['ends'][0] for j in range(len(edges))),'underlying actual closed edge loop')
            if sign<0:edges=[{**e,'ends':e['ends'][::-1]} for e in reversed(edges)]
            for e in edges:edge_incidence[e['ref']].append((face_ref,bound,e['effectiveSign']))
            loops.append(edges)
        typ,a=record(surface);require(typ in ('PLANE','CYLINDRICAL_SURFACE','CONICAL_SURFACE'),'finite exact analytic supports, no BSpline stand-in');origin,axis=placement(a[1]);radius=None if typ=='PLANE' else a[2];semi=a[3] if typ=='CONICAL_SURFACE' else None
        if typ!='PLANE':require(math.isfinite(radius) and radius>=0,'actual finite reference radius')
        if semi is not None:require(math.isfinite(semi) and 0<abs(semi)<math.pi/2,'actual signed semiangle, not full angle');
        surface_incidence(loops,typ,origin,axis,radius,semi);row={'ref':face_ref,'origin':origin,'axis':axis,'normal':tuple(x*(1 if sense==('enum','T') else -1) for x in axis),'loops':loops,'sameSense':sense,'radius':radius,'semiAngle':semi}
        if typ=='PLANE':planar.append(row)
        else:require(sense==('enum','F'),'actual inward radial wall orientation');(cones if typ=='CONICAL_SURFACE' else cylinders).append(row)
    require(len(cones)==len(cylinders)==1 and len(planar)==6,'one finite cone/shank and ONLY six outer planes: NO annular floor');require(all(n==2 for n in edge_use.values()) and all(len(u)==2 and u[0][2]==-u[1][2] for u in edge_incidence.values()),'same actual shared edges with opposite effective uses including both seam occurrences');require(len(used_vertices)-len(used_edges)+face_contribution==0,'actual genus-one closed boundary');vertices=[vertex(v) for v in used_vertices];lo=[min(p[i] for p in vertices) for i in range(3)];hi=[max(p[i] for p in vertices) for i in range(3)];vector(lo,[0,0,0]);vector(hi,[W,H,T]);outer=set();capRims={}
    def orientation(loop,normal,outer):
        require(outer or loop[0]['boundKind']!='FACE_OUTER_BOUND','actual inner bound is not declared outer')
        if all(e['curve']['kind']=='LINE' for e in loop):area=tuple(math.fsum(cross(vertex(e['ends'][0]),vertex(e['ends'][1]))[j] for e in loop)/2 for j in range(3));value=dot(area,normal)
        else:
            require(len(loop)==1,'finite full circle bound');e=loop[0];c=e['curve'];require(c['kind']=='CIRCLE' and e['vertices'][0]==e['vertices'][1],'one complete actual circular edge');value=math.pi*c['radius']**2*dot(c['axis'],normal)*e['effectiveSign']*(1 if e['sameSense']==('enum','T') else -1)
        require(value>0 if outer else value<0,'actual planar outer/inner winding versus actual face orientation')
    def circle(edge,z,radius):
        c=edge['curve'];require(c['kind']=='CIRCLE' and edge['vertices'][0]==edge['vertices'][1],'full finite actual circular rim');vector(c['center'],[cx,cy,z],1e-7);near(c['radius'],radius,1e-7);near(abs(c['axis'][2]),1,1e-12);return edge['ref']
    for face in planar:
        axes=[i for i,n in enumerate(face['normal']) if abs(abs(n)-1)<=1e-12];require(len(axes)==1 and all(abs(face['normal'][j])<=1e-12 for j in range(3) if j!=axes[0]),'actual outer source-aligned plane');axis=axes[0];sign=1 if face['normal'][axis]>0 else -1;key=axis,sign;require(key not in outer,'no duplicate/floor planar patch');outer.add(key);near(face['origin'][axis],hi[axis] if sign>0 else lo[axis],1e-7)
        if axis!=2:require(len(face['loops'])==1 and len(face['loops'][0])==4 and all(e['curve']['kind']=='LINE' for e in face['loops'][0]),'untouched finite rectangular side');orientation(face['loops'][0],face['normal'],True);continue
        rect=[q for q in face['loops'] if len(q)==4 and all(e['curve']['kind']=='LINE' for e in q)];require(len(rect)==1,'one full actual rectangular cap');corners=[(x,y,0 if sign<0 else T) for x in(0,W) for y in(0,H)];counts=[0]*4
        for e in rect[0]:
            for p in e['points']:choices=[i for i,q in enumerate(corners) if math.dist(p,q)<=1e-7];require(len(choices)==1,'actual complete source cap corner');counts[choices[0]]+=1
        require(counts==[2]*4,'every source corner exactly twice');orientation(rect[0],face['normal'],True);other=[q for q in face['loops'] if q is not rect[0]];require(len(other)==1 and len(other[0])==1,'one real opening on BOTH caps');edge=other[0][0];capRims[sign]=circle(edge,T if sign>0 else 0,R if sign>0 else r);orientation(other[0],face['normal'],False)
    require(outer=={(i,j) for i in range(3) for j in(-1,1)},'complete original outer boundary')
    def wall(face,zs,rs):
        require(len(face['loops'])==1 and len(face['loops'][0])==4,'finite complete wall trim');circles=[e for e in face['loops'][0] if e['curve']['kind']=='CIRCLE'];lines=[e for e in face['loops'][0] if e['curve']['kind']=='LINE'];require(len(circles)==len(lines)==2 and lines[0]['ref']==lines[1]['ref'],'two full circular rims and ONE repeated actual generatrix seam');ordered=sorted(circles,key=lambda e:e['curve']['center'][2]);refs=[circle(edge,z,rad) for edge,z,rad in zip(ordered,zs,rs)];vector(sorted(p[2] for p in lines[0]['points']),zs,1e-7);byaxis=sorted(circles,key=lambda e:dot(sub(e['curve']['center'],face['origin']),face['axis']));sense=-1
        for edge,want in zip(byaxis,(sense,-sense)):near(dot(edge['curve']['axis'],face['axis'])*edge['effectiveSign']*(1 if edge['sameSense']==('enum','T') else -1),want,1e-12)
        return refs
    shank=wall(cylinders[0],[0,s],[r,r]);cone=wall(cones[0],[s,T],[r,R]);near(cylinders[0]['radius'],r,1e-7);require(shank[0]==capRims[-1] and cone[1]==capRims[1] and shank[1]==cone[0],'SAME actual bottom/transition/top edges shared by exact adjacent faces, not fitted equal circles');transitionUses=edge_incidence[shank[1]];require({u[0] for u in transitionUses}=={cylinders[0]['ref'],cones[0]['ref']},'transition shares ONLY actual cone/shank, NO annular floor');actualS=one_circle_z(records,shank[1]);actualR=cones[0]['radius']+(T-cones[0]['origin'][2])*math.tan(cones[0]['semiAngle'])*cones[0]['axis'][2];actualr=cylinders[0]['radius'];volume=W*H*T-math.pi*actualr*actualr*T-math.pi*(T-actualS)*(actualR-actualr)*(actualR+2*actualr)/3;near(volume,float(f['volume']),1e-6)
    return {'quality':'independent-analytic-STEP21-conical-countersink-subset','solidCount':1,'faces':len(faces),'edges':len(used_edges),'vertices':len(used_vertices),'bounds':{'min':lo,'max':hi},'actualAssignedUnits':kinds,'actualCone':{k:v for k,v in cones[0].items() if k in('origin','axis','radius','semiAngle')},'actualTransitionZ':actualS,'sharedTransitionEdge':'response-local actual STEP identity, not persisted app selector','noAnnularFloor':True,'genus':1,'analyticVolume':volume,'generalInterchangeQualified':False}

def one_circle_z(records,ref):
    curve=records[ref[1]][1][3];seen=set()
    while records[curve[1]][0] in ('SURFACE_CURVE','SEAM_CURVE'):require(curve not in seen,'finite actual curve unwrap');seen.add(curve);curve=records[curve[1]][1][1]
    kind,args=records[curve[1]];require(kind=='CIRCLE','actual transition circle');placement=records[args[1][1]][1];point=records[placement[1][1]][1];return point[1][2]
