"""Independent finite analytic-record decoding and coverage.
Copied unchanged format/math routines from the retained qualified countersink
artifact checker; no production CAD import or expected successful source seed.
"""
import math,re,struct,hashlib
from truth import need,near,vector
sha=lambda b:hashlib.sha256(b).hexdigest()
def record_curves(view,frame):
    meta=view['metadata'];need(view['status']=='available' and view['reason'] is None and meta['version']==1 and meta['layout']=='orthographic-f64le12-u8x4/1' and meta['quality']=='native-brep-orthographic' and meta['scope']=='response-local' and meta['persistentIds'] is False and meta['copyTShapesDisjoint'] is True,'actual response-local orthographic record');need(meta['frame']==frame,'authentic named view basis');count=meta['fragmentCount'];need(type(count) is int and 0<count<=8192 and len(meta['groupCounts'])==8 and sum(meta['groupCounts'])==count,'eight bounded ordered Native groups');buffers=[]
    for key,bytes_per in [('values',96),('tags',4)]:
        row=view[key];raw=bytes(row['bytes']);need(len(raw)==row['byteLength']==meta['valueBytes' if key=='values' else 'tagBytes']==count*bytes_per and sha(raw)==row['sha256'],'actual Native buffer bytes/hash/layout');buffers.append(raw)
    values,tags=buffers;curves=[];index=0
    for group,n in enumerate(meta['groupCounts']):
        need(type(n) is int and n>=0,'group count')
        for _ in range(n):
            numbers=list(struct.unpack_from('<12d',values,index*96));t=list(tags[index*4:index*4+4]);index+=1;need(all(math.isfinite(x) and abs(x)<=4e6 for x in numbers) and numbers[1]>numbers[0] and t[2]<=3,'finite actual analytic parameters');line=t[0]==0;need(t[0] in (0,1) and (t[1]==0 and t[3]==0 and numbers[10:12]==[0,0] if line else t[1] in (1,2) and t[3]==1),'actual analytic curve tags');curve={'range':numbers[:2],'start':numbers[2:4],'end':numbers[4:6],'c':numbers[6:8],'a':numbers[8:10],'b':numbers[10:12],'line':line,'hidden':bool(group%2)}
            for theta,want in zip(curve['range'],[curve['start'],curve['end']]):vector(evaluate(curve,theta),want,max(1e-9,math.hypot(*want)*1e-12))
            curves.append(curve)
    return curves

def evaluate(c,t):return [c['c'][j]+(c['a'][j]*t if c['line'] else c['a'][j]*math.cos(t)+c['b'][j]*math.sin(t)) for j in range(2)]
def extrema(c):
    ts=list(c['range'])
    if not c['line']:
        need(c['range'][1]-c['range'][0]<=2*math.pi+1e-9,'bounded fixture conic trim')
        for axis in (0,1):
            phase=math.atan2(c['b'][axis],c['a'][axis])
            for k in range(math.floor((ts[0]-phase)/math.pi)-1,math.ceil((ts[1]-phase)/math.pi)+2):
                theta=phase+k*math.pi
                if c['range'][0]<=theta<=c['range'][1]:ts.append(theta)
    ps=[evaluate(c,t) for t in ts];return [min(p[0] for p in ps),min(p[1] for p in ps),max(p[0] for p in ps),max(p[1] for p in ps)]
def covered_segment(a,z,curves):
    delta=[z[j]-a[j] for j in range(2)];length=math.hypot(*delta)
    intervals=[]
    for c in curves:
        if not c['line']:continue
        ps=[c['start'],c['end']]
        if any(abs(delta[0]*(p[1]-a[1])-delta[1]*(p[0]-a[0]))/length>1e-6 for p in ps):continue
        ts=sorted(sum((p[j]-a[j])*delta[j] for j in range(2))/length**2 for p in ps)
        if ts[1]>=0 and ts[0]<=1:intervals.append((max(0,ts[0]),min(1,ts[1])))
    end=0
    for lo,hi in sorted(intervals):
        if (lo-end)*length>1e-6:return False
        end=max(end,hi)
    return (1-end)*length<=1e-6

TOKEN=re.compile(r'[ML]|[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][-+]?\d+)?')
def path_points(text):
    need(not TOKEN.sub('',text).replace(',','').strip(),'only emitted M/L SVG syntax');tokens=TOKEN.findall(text);out=[];i=0;command=None
    while i<len(tokens):
        if tokens[i] in ('M','L'):command=tokens[i];i+=1
        need(command is not None and i+1<len(tokens) and tokens[i] not in ('M','L') and tokens[i+1] not in ('M','L'),'actual SVG coordinate pair');out.append([float(tokens[i]),float(tokens[i+1])]);i+=2
    need(len(out)>=2,'nonempty path');return out


def full_circle(curves,cx,cy,radius):
    intervals=[]
    for c in curves:
        if c['line'] or math.dist(c['c'],[cx,cy])>1e-6:continue
        if abs(math.hypot(*c['a'])-radius)>1e-6 or abs(math.hypot(*c['b'])-radius)>1e-6 or abs(sum(x*y for x,y in zip(c['a'],c['b'])))>1e-6:continue
        sign=1 if c['a'][0]*c['b'][1]-c['a'][1]*c['b'][0]>0 else -1;phase=math.atan2(c['a'][1],c['a'][0]);a,b=sorted([phase+sign*t for t in c['range']]);need(0<b-a<=2*math.pi+1e-9,'actual finite circular projection interval')
        for k in range(math.floor(-b/(2*math.pi))-1,math.ceil((2*math.pi-a)/(2*math.pi))+2):
            lo,hi=max(0,a+k*2*math.pi),min(2*math.pi,b+k*2*math.pi)
            if hi>lo:intervals.append((lo,hi))
    end=0
    for lo,hi in sorted(intervals):
        if lo-end>1e-9:return False
        end=max(end,hi)
    return 2*math.pi-end<=1e-9

