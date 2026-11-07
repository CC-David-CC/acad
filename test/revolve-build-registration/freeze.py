"""After native/full-array assertions pass, archive then summarize display arrays."""
import pathlib,json,hashlib,struct,shutil,sys
p=pathlib.Path(sys.argv[1]);archive=pathlib.Path(sys.argv[2]);archive.parent.mkdir(parents=True,exist_ok=True)
assert not archive.exists();raw=p.read_bytes();data=json.loads(raw);assert data['status']=='PASS';shutil.copyfile(p,archive);removed=[]
def visit(x,path=''):
 if isinstance(x,dict):
  for key,value in list(x.items()):
   if key=='coordinates'and isinstance(value,list):
    h=hashlib.sha256()
    for n in value:h.update(struct.pack('<d',n))
    x[key]={'omittedDisplayArray':True,'elements':len(value),'encoding':'IEEE754-binary64-little-endian','sha256':h.hexdigest()};removed.append(path+'/'+key)
   else:visit(value,path+'/'+key)
 elif isinstance(x,list):
  for i,value in enumerate(x):visit(value,path+'/'+str(i))
visit(data);data['evidenceCompaction']={'scope':'Display arrays only AFTER original full-array assertions passed','rawSHA256':hashlib.sha256(raw).hexdigest(),'rawBytes':len(raw),'rawArchive':str(archive),'arrays':removed};p.write_text(json.dumps(data,separators=(',',':'))+'\n')
