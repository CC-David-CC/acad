"""Extract unchanged native records; never constructs geometry or model state."""
import sys,json,hashlib
from pathlib import Path
raw=Path(sys.argv[1]).read_bytes();digest=hashlib.sha256(raw).hexdigest()
assert digest=='7a445e90c397b2e3c54b2b8355f5fab2588aa1afa8c853576da2d7322cda2598'
d=json.loads(raw);assert d['status']=='PASS' and d['finalOwnedNames']==0
names={'A','B','C','plate','circle-tool'};rows={'overlap-0','overlap-1','disjoint-0','same-operand-0','same-operand-1','real-circle-through-cut'}
print(json.dumps({'scope':'Unchanged actual main-WASM V3 construction/Boolean records; fixture caller source names are assigned in tests, not recovered public authored IDs','sourceReceiptSha256':digest,'nativeRuntimePins':d['runtimePins'],'initial':{r['name']:r for r in d['initial'] if r['name'] in names},'rows':{r['name']:r for r in d['rows'] if r['name'] in rows}},indent=2))
