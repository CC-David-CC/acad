"""Independent finite ASCII DXF geometry/visibility oracle, no product imports."""
import math,re
from fractions import Fraction
B=Fraction(1,20000000)
def require(ok,text):
    if not ok:raise ValueError(text)
def value(rows,code,default=None):
    found=[v for c,v in rows if c==code];require(len(found)<=1,'unique entity group '+str(code));return found[0] if found else default
def number(v):
    require(isinstance(v,str) and re.fullmatch(r'[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?',v.strip()),'finite DXF numeric token');n=float(v);require(math.isfinite(n),'finite DXF number');return Fraction.from_float(n)
def point(rows,x,y,z):
    require(number(value(rows,z,'0'))==0,'XY entity support');return (number(value(rows,x)),number(value(rows,y)))
def near(a,b):require(abs(a-Fraction.from_float(float(b)))<=B,'independent50pm DXF coordinate/radius')
def check(raw,read):
    require(len(raw)<=8*1024*1024 and b'\0' not in raw,'bounded ASCII DXF');lines=raw.decode('ascii').splitlines();require(len(lines)%2==0,'complete group pairs');pairs=[]
    for i in range(0,len(lines),2):
        require(re.fullmatch(r'\s*\d+\s*',lines[i]) is not None,'numeric DXF group code');pairs.append((int(lines[i]),lines[i+1].strip()))
    sections={};i=0;ended=False
    while i<len(pairs):
        if pairs[i]==(0,'EOF'):require(i==len(pairs)-1,'closed EOF');ended=True;break
        require(pairs[i]==(0,'SECTION') and i+1<len(pairs) and pairs[i+1][0]==2,'section opening');name=pairs[i+1][1];require(name not in sections,'unique section');i+=2;body=[]
        while i<len(pairs) and pairs[i]!=(0,'ENDSEC'):body.append(pairs[i]);i+=1
        require(i<len(pairs),'closed section');sections[name]=body;i+=1
    require(ended,'terminal EOF');require(set(sections)<= {'HEADER','CLASSES','TABLES','BLOCKS','ENTITIES','OBJECTS'} and 'HEADER' in sections and 'ENTITIES' in sections,'actual writer section domain')
    header=sections['HEADER'];units=[i for i,v in enumerate(header) if v==(9,'$INSUNITS')];require(len(units)==1 and header[units[0]+1]==(70,'4'),'physical millimeters')
    for i,v in enumerate(header):
        if v==(9,'$INSBASE'):
            j=i+1
            while j<len(header) and header[j][0]!=9:
                if header[j][0] in (10,20,30):require(number(header[j][1])==0,'no drawing insertion translation')
                j+=1
    entities=[]
    for item in sections['ENTITIES']:
        if item[0]==0:require(item[1] in ('LINE','CIRCLE'),'no additional/hidden substituted entity');entities.append({'kind':item[1],'rows':[]})
        else:require(bool(entities),'entity begins with type');entities[-1]['rows'].append(item)
    require(len(entities)==2,'complete actual projected two-curve census')
    # No insert, OCS transform, paper-space, thickness or visibility substitute.
    layers=set()
    for e in entities:
        r=e['rows'];allowed={5,100,330,8,6,62,370,48,60,67,410,210,220,230,10,20,30,39}|({11,21,31} if e['kind']=='LINE' else {40});require(all(c in allowed for c,_ in r),'closed finite visible entity group schema');require(value(r,410,'Model')=='Model','model layout');require(value(r,6,'BYLAYER').upper() in ('BYLAYER','BYBLOCK','CONTINUOUS'),'ordinary continuous geometry');require(number(value(r,48,'1'))>0,'positive entity linetype scale');require(value(r,60,'0')=='0' and value(r,67,'0')=='0','visible modelspace entity');require(number(value(r,39,'0'))==0,'zero thickness');require(tuple(number(value(r,c,d)) for c,d in [(210,'0'),(220,'0'),(230,'1')])==(0,0,1),'world XY OCS');layer=value(r,8);require(isinstance(layer,str) and bool(layer),'actual named layer');layers.add(layer)
        if value(r,62) is not None:require(number(value(r,62))>=0,'visible entity color')
        require(not any(c in (102,310,340,360,390,440) for c,_ in r),'no entity effect/reference overrides')
    tables=sections.get('TABLES',[]);admitted_layers=[]
    for i,v in enumerate(tables):
        if v==(0,'LAYER'):
            j=i+1;r=[]
            while j<len(tables) and tables[j][0]!=0:r.append(tables[j]);j+=1
            if value(r,2) in layers:require(int(value(r,70,'0'))&3==0 and number(value(r,62,'7'))>=0,'all used layers visible/unfrozen');admitted_layers.append(value(r,2))
    require(set(admitted_layers)==layers and len(admitted_layers)==len(layers),'one actual visible layer record per used layer')
    for kind in ('Segment','Circle'):
        expected=[r for r in read['references'] if r['kind']==kind];actual=[e for e in entities if e['kind']==('LINE' if kind=='Segment' else 'CIRCLE')];require(len(actual)==len(expected)==1,'one true '+kind);r=actual[0]['rows'];g=expected[0]['geometry'];p=point(r,10,20,30)
        want=g['a'] if kind=='Segment' else g['c'];near(p[0],want['x']);near(p[1],want['y'])
        if kind=='Segment':q=point(r,11,21,31);near(q[0],g['b']['x']);near(q[1],g['b']['y']);require(p!=q,'noncollapsed finite LINE')
        else:radius=number(value(r,40));near(radius,g['r']);require(radius>0,'genuine positive CIRCLE')
    return {'entities':2,'unit':'millimeter','coordinates':'world-XY'}
