"""Small independent test oracle; exact Fraction arithmetic is NOT product code."""
import json,sys
from fractions import Fraction as F
from pathlib import Path
root=Path(__file__).parent
captured=json.loads((root/'actual-native-mesh.json').read_text())
def integral(flat):
    total=F(0)
    for i in range(0,len(flat),9):
        ax,ay,az,bx,by,bz,cx,cy,cz=map(F.from_float,map(float,flat[i:i+9]))
        total+=ax*(by*cz-bz*cy)+ay*(bz*cx-bx*cz)+az*(bx*cy-by*cx)
    return total/6
rows=[]
for row in captured['rows']:
    exact=integral(row['positions']);request=row['request'];origin=request['origin'];dims=request['dimensions']
    represented=F(1)
    for o,d in zip(origin,dims):represented*=F.from_float(float(o+d))-F.from_float(float(o))
    assert exact==represented
    rows.append({'id':row['id'],'exactNumerator':str(exact.numerator),'exactDenominator':str(exact.denominator),'nearestBinary64':float(exact),'representedBoxProductEqual':True})
# TWO SEPARATED ANALYTIC BOXES ONLY: volumes are exact translation-invariant
# sums of represented side spans. No production mesh-component grouping occurs.
a=F(1);b=F(1)
for d in [1e-6,2e-6,3e-6]:
    a*=F.from_float(1e6+d)-F.from_float(1e6)
    b*=F.from_float(-1e6+d)-F.from_float(-1e6)
rows.append({'id':'separated-tiny-boxes-analytic-oracle','exactNumerator':str((a+b).numerator),'exactDenominator':str((a+b).denominator),'nearestBinary64':float(a+b)})
(root/'fraction-oracle.json').write_text(json.dumps({'status':'PASS','scope':'exact Fraction test oracle; no production arbitrary-precision path','rows':rows},indent=2)+'\n')
