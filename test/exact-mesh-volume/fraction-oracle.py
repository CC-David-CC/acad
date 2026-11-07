"""Independent exact Fraction determinant and Python correctly-rounded float."""
import json,struct,sys
from fractions import Fraction as F
from pathlib import Path
path=Path(sys.argv[1]);cases=json.loads(path.read_text());rows=[]
for case in cases:
    p=case['positions'];total=F(0)
    for i in range(0,len(p),9):
        a,b,c,d,e,f,g,h,j=(F.from_float(float(n)) for n in p[i:i+9])
        total+=a*(e*j-f*h)-b*(d*j-f*g)+c*(d*h-e*g)
    value=total/6
    try:
        result=float(value)
        if value and result==0: raise ArithmeticError('underflow')
        bits=struct.pack('>d',result).hex()
        row={'id':case['id'],'status':'value','bits':bits,'nearestBinary64':result}
    except (OverflowError,ArithmeticError):
        row={'id':case['id'],'status':'range-refusal'}
    row.update({'exactNumerator':str(value.numerator),'exactDenominator':str(value.denominator)})
    rows.append(row)
Path(sys.argv[2]).write_text(json.dumps({'status':'PASS','scope':'Independent Python Fraction represented-coordinate determinant oracle only','input':path.name,'rows':rows},indent=2)+'\n')
print('Fraction oracle:',len(rows),'cases')
