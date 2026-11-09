"""Offline JS text / WASM section inventory. Never loads or invokes the module."""
from pathlib import Path
import hashlib,json,struct,re
root=Path('/mnt/data10tb/codi-occ-finite-curve-native-build-20261109-r1')
evidence=Path('/mnt/data10tb/codi-occ-finite-curve-native-evidence-20261109-r1')
source=Path('/mnt/data10tb/codi-occ-finite-curve-export-source-20261109')
output=evidence/'abi-static.json'
if output.exists():raise SystemExit('Preserve first static inventory')
def digest(raw):return {'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest()}
class Reader:
 def __init__(self,raw):self.raw=raw;self.at=0
 def byte(self):
  if self.at>=len(self.raw):raise ValueError('Truncated static WASM section')
  n=self.raw[self.at];self.at+=1;return n
 def uint(self):
  result=0
  for i in range(5):
   n=self.byte()
   if i==4 and n>15:raise ValueError('WASM u32 bound')
   result|=(n&127)<<(7*i)
   if not n&128:return result
  raise ValueError('WASM u32 length')
 def take(self,count):
  if count<0 or count>len(self.raw)-self.at:raise ValueError('Truncated static WASM bytes')
  result=self.raw[self.at:self.at+count];self.at+=count;return result
 def name(self):return self.take(self.uint()).decode('utf-8')
 def end(self):
  if self.at!=len(self.raw):raise ValueError('Unexpected remaining static WASM fields')
def limits(r):
 flags=r.uint()
 if flags&~3:raise ValueError('Unsupported static memory/table limit encoding')
 r.uint()
 if flags&1:r.uint()
result={'scope':'static compiled ABI inventory only; no JS/WASM/Native execution','runtimeExecuted':False}
try:
 js=(root/'main.js').read_bytes();wasm=(root/'main.wasm').read_bytes()
 if len(js)>1048576 or len(wasm)>41943040:raise ValueError('Static raw candidate size bound')
 if wasm[:8]!=b'\x00asm\x01\x00\x00\x00':raise ValueError('Not WASM version1')
 types=[];imports=[];functions=[];exports=[];seen=set();r=Reader(wasm[8:])
 while r.at<len(r.raw):
  section=r.byte();data=Reader(r.take(r.uint()))
  if section==0:continue
  if section in seen:raise ValueError('Duplicate static WASM section')
  seen.add(section)
  if section==1:
   for _ in range(data.uint()):
    if data.byte()!=0x60:raise ValueError('Unsupported static function type')
    params=[data.byte() for _ in range(data.uint())];returns=[data.byte() for _ in range(data.uint())]
    types.append((params,returns))
  elif section==2:
   for _ in range(data.uint()):
    module,name,kind=data.name(),data.name(),data.byte()
    if kind==0:imports.append({'module':module,'name':name,'typeIndex':data.uint()})
    elif kind==1:data.byte();limits(data)
    elif kind==2:limits(data)
    elif kind==3:data.byte();data.byte()
    else:raise ValueError('Unsupported static import kind')
  elif section==3:functions=[data.uint() for _ in range(data.uint())]
  elif section==7:
   for _ in range(data.uint()):exports.append({'name':data.name(),'kind':data.byte(),'index':data.uint()})
  else:continue
  data.end()
 scalar={0x7f:'i32',0x7e:'i64',0x7d:'f32',0x7c:'f64',0x7b:'v128',0x70:'funcref',0x6f:'externref'}
 def signature(index):
  t=imports[index]['typeIndex'] if index<len(imports) else functions[index-len(imports)]
  params,returns=types[t]
  return {'parameters':[scalar[n] for n in params],'results':[scalar[n] for n in returns]}
 actual={}
 for export in exports:
  if export['name'] in actual:raise ValueError('Duplicate static export name')
  actual[export['name']]={**export,**(signature(export['index']) if export['kind']==0 else {})}
 inventory=json.loads((source/'shape-io/finite-curve-native-export-v1-inputs.json').read_text())
 expected=inventory['sourceDeclaredKeepaliveExports']+inventory['retainedArchiveSourceKeepaliveExports']
 text=js.decode('utf-8');bindings=[]
 for declaration in expected:
  name=declaration['cName'];moduleName=declaration['emscriptenName']
  pattern=re.compile(r'Module\["'+re.escape(moduleName)+r'"\]=createExportWrapper\("'+re.escape(name)+r'"\)')
  matches=list(pattern.finditer(text))
  if len(matches)!=1 or name not in actual or actual[name]['kind']!=0:raise ValueError('Missing/ambiguous source-declared compiled export: '+name)
  bindings.append({'cName':name,'moduleName':moduleName,'jsSourceExcerpt':matches[0].group(0),'wasm':actual[name]})
 new=actual['ReadFiniteCurveIntersectionsV1']
 if new['parameters']!=['i32','i32'] or new['results']!=[]:raise ValueError('New port compiled signature differs from pointer/int -> void')
 if (root/'main.js').read_bytes()!=js or (root/'main.wasm').read_bytes()!=wasm:raise ValueError('Raw outputs changed during static inventory')
 result.update(status='PASS',meaning='static expected symbol/type declarations found; not functional qualification',rawJS=digest(js),rawWASM=digest(wasm),sourceDeclaredFunctions=len(expected),bindings=bindings,allStaticExports=list(actual.values()))
except Exception as error:
 result.update(status='FAIL',error=repr(error));output.write_text(json.dumps(result,indent=2)+'\n');raise
output.write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps({'status':result['status'],'scope':result['scope'],'sourceDeclaredFunctions':result['sourceDeclaredFunctions'],'newPort':new}))
