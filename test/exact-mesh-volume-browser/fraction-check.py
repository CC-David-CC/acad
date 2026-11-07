"""Independent replay of genuine Chromium mesh coordinates; no native execution."""
import json,struct,sys
from fractions import Fraction as F
from pathlib import Path
p=json.loads(Path(sys.argv[1]).read_text());rows=[]
def bits(n):return struct.pack('>d',float(n)).hex()
def integral(flat):
 t=F(0)
 for i in range(0,len(flat),9):
  a,b,c,d,e,f,g,h,j=(F.from_float(float(n)) for n in flat[i:i+9])
  t+=a*(e*j-f*h)-b*(d*j-f*g)+c*(d*h-e*g)
 return t/6
def box(origin,size):
 v=F(1)
 for o,d in zip(origin,size):v*=F.from_float(float(o+d))-F.from_float(float(o))
 return v
for row in p['rows']:
 assert 'error' not in row,row
 exact=integral(row['positions']);expected=4301 if row['id']=='ordinary' else box([0,0,0] if row['id']=='tiny-origin' else [1e6]*3,[1e-6,2e-6,3e-6])
 if row['id']=='tiny-disjoint-union':expected+=box([-1e6]*3,[1e-6,2e-6,3e-6])
 assert exact==expected,(row['engine'],row['id'],'represented analytic box sum differs')
 assert bits(exact)==bits(row['evidence']['signedVolume'])==bits(row['meshEvidence']['signedVolume']),(row['engine'],row['id'])
 native=row['evidence'].get('nativeVolume');rows.append({'engine':row['engine'],'id':row['id'],'exactNumerator':str(exact.numerator),'exactDenominator':str(exact.denominator),'nearestBinary64':float(exact),'nativeVolume':native,'nativeMeasurementAvailable':native is not None,'requestedTinyBoxProduct':6e-18 if row['id']=='tiny-translated' else None})
Path(sys.argv[2]).write_text(json.dumps({'status':'PASS','scope':'Independent Fraction/analytic represented-coordinate check of actual new browser Worker meshes; native validity remains separate','rows':rows},indent=2)+'\n')
print('PASS actual meshes:',len(rows))
