#!/usr/bin/env python3
"""Standalone ZIP/source inspection and own malformed-file preparation.
No production codec/validator is imported; this never extracts paths to disk.
make-bad is used only inside the complete public native Open workflow.
"""
import binascii, hashlib, json, struct, sys, zipfile, zlib
from pathlib import Path
FORMAT='codi-cad-project'
PROFILE='zip32-zipjs224-json6-binary-store-v1'
LIMIT=128*1024*1024
sha=lambda b:hashlib.sha256(b).hexdigest()
def require(ok,text):
    if not ok:raise ValueError(text)
def canonical(v):return json.dumps(v,sort_keys=True,ensure_ascii=False,separators=(',',':')).encode('utf-8')
def pairs(rows):
    result={}
    for key,value in rows:
        require(key not in result,'duplicate JSON key');result[key]=value
    return result
def nonfinite(value):raise ValueError('nonfinite JSON value '+value)
def parse_json(raw):return json.loads(raw.decode('utf-8'),object_pairs_hook=pairs,parse_constant=nonfinite)
def root_record(manifest):return {k:manifest[k] for k in ('format','version','unit','envelopeVersion')}|{'entries':[r for r in manifest['entries'] if r['required']]}
def structure(raw):
    require(22<=len(raw)<=LIMIT,'outer size')
    sig,disk,centraldisk,n0,n,size,start,comment=struct.unpack_from('<I4H2IH',raw,len(raw)-22)
    require((sig,disk,centraldisk,comment)==(0x06054b50,0,0,0) and n0==n and 1<=n<=10032 and size<=8*1024*1024 and start+size==len(raw)-22,'ZIP32 end')
    offset=start;local=0;rows=[];names=set();total=0
    for _ in range(n):
        central=struct.unpack_from('<I6H3I5H2I',raw,offset)
        sig,made,needed,flags,method,time,date,crc,compressed,length,nlen,xlen,clen,disk,internal,external,at=central
        require(sig==0x02014b50 and made==20 and needed==20 and flags==0x0808 and method in (0,8) and time==0 and date==33 and not any((xlen,clen,disk,internal,external)) and 1<=nlen<=128 and at==local,'canonical central entry')
        name=raw[offset+46:offset+46+nlen].decode('ascii');require(name not in names and not name.endswith('/') and name.startswith(('authored/','derived/','manifest.json')),'unique safe paths');names.add(name)
        lsig,lneed,lflags,lmethod,ltime,ldate,lcrc,lcompressed,llength,lnlen,lxlen=struct.unpack_from('<I5H3I2H',raw,at)
        require((lsig,lneed,lflags,lmethod,ltime,ldate,lnlen,lxlen)==(0x04034b50,20,flags,method,0,33,nlen,0),'local header')
        require(raw[at+30:at+30+nlen]==name.encode() and lcrc in (0,crc) and lcompressed in (0,compressed) and llength in (0,length),'local/central agreement')
        begin=at+30+nlen;end=begin+compressed;finish=end+16
        require(finish<=start and struct.unpack_from('<4I',raw,end)==(0x08074b50,crc,compressed,length),'signed descriptor and nonoverlap')
        total+=length;require(total<=LIMIT,'aggregate uncompressed size')
        rows.append({'path':name,'method':method,'crc':crc,'bytes':length,'compressed':raw[begin:end],'local':raw[at:finish]});local=finish;offset+=46+nlen
    require(local==start and offset==start+size and rows[-1]['path']=='manifest.json','complete contiguous closed ZIP roster')
    return rows

def read_archive(file):
    raw=Path(file).read_bytes();rows=structure(raw)
    with zipfile.ZipFile(file) as archive:
        require(archive.testzip() is None,'independent ZIP CRC')
        require(archive.namelist()==[r['path'] for r in rows],'independent directory ordering')
        data={r['path']:archive.read(r['path']) for r in rows}
    manifest=parse_json(data['manifest.json']);require(set(manifest)=={'format','version','unit','envelopeVersion','designRevision','writerProfile','entries'},'manifest fields')
    require((manifest['format'],manifest['version'],manifest['unit'],manifest['writerProfile'])==(FORMAT,1,'millimeter',PROFILE),'format marker/profile')
    require(manifest['envelopeVersion'] in (2,3) and canonical(manifest)==data['manifest.json'],'manifest canonical bytes')
    require(sha(canonical(root_record(manifest)))==manifest['designRevision'],'authored descriptor root')
    descriptors=manifest['entries'];require(len(descriptors)<=10031,'entry bound');present=set(data)-{'manifest.json'}
    order=sorted(descriptors,key=lambda e:(e['role']!='derived',e['path']));require(order==descriptors,'deterministic authored roster')
    require([e['path'] for e in descriptors if e['path'] in present]==[r['path'] for r in rows[:-1]],'physical/manifest order')
    values={};sketches=[];raw_sketches={};seen=set();spans={};derived=[]
    for descriptor in descriptors:
        require(set(descriptor)=={'path','role','logicalId','bytes','sha256','required','encoding','attribution'},'entry descriptor fields')
        name=descriptor['path'];require(name not in seen,'unique manifest path');seen.add(name)
        if name not in data:require(descriptor['required'] is False,'required entry missing');continue
        body=data[name];row=next(r for r in rows if r['path']==name)
        require(len(body)==descriptor['bytes'] and sha(body)==descriptor['sha256'],'independent entry byte hash')
        spans[name]={'compressedBytes':len(row['compressed']),'compressedSha256':sha(row['compressed']),'localSha256':sha(row['local']),'contentSha256':sha(body)}
        if descriptor['role']=='derived':
            require(descriptor['required'] is False and descriptor['encoding']=='binary-store' and row['method']==0 and name=='derived/'+sha(body)+'.bin','optional binary addressing');derived.append(descriptor);continue
        require(descriptor['required'] is True and descriptor['attribution'] is None and descriptor['encoding']=='json-deflate6' and row['method']==8,'authored encoding')
        value=parse_json(body)
        if descriptor['role']=='sketch':
            identity=descriptor['logicalId'];address=json.dumps(identity,ensure_ascii=False,separators=(',',':')).encode('utf-8')
            require(name=='authored/sketches/'+sha(address)+'.json' and identity not in raw_sketches,'source ID/path, no normalization')
            sketches.append({'id':identity,'data':value});raw_sketches[identity]=body.decode('utf-8')
        else:
            role=descriptor['role'];require(role in ('model','surfacing','manufacturing','presentation','drawings') and name=='authored/'+role+'.json' and descriptor['logicalId']==role and role not in values,'authored role');values[role]=value
    require('model' in values and (manifest['envelopeVersion']==3)==('drawings' in values),'complete native domains')
    # The source store inventory is ordered by original UTF-16 code units.
    sketches.sort(key=lambda s:s['id'].encode('utf-16-be','surrogatepass'))
    project={'model':values['model'],'sketches':sketches}
    if 'surfacing' in values:project['surfacing']=values['surfacing']
    envelope={'format':'codi-jsketcher-project','version':manifest['envelopeVersion'],'unit':'millimeter','project':project}
    for role in ('manufacturing','presentation','drawings'):
        if role in values:envelope[role]=values[role]
    return {'manifest':manifest,'envelope':envelope,'rawSketches':raw_sketches,'spans':spans,'derived':derived,'bytes':len(raw),'sha256':sha(raw)}

def rebuild(rows):
    local=[];directory=[];offset=0
    for row in rows:
        name=row['path'].encode('ascii');data=row['compressed'];crc=row['crc'];size=row['bytes'];method=row['method']
        header=struct.pack('<I5H3I2H',0x04034b50,20,0x0808,method,0,33,0,0,0,len(name),0)+name
        body=header+data+struct.pack('<4I',0x08074b50,crc,len(data),size);local.append(body)
        directory.append(struct.pack('<I6H3I5H2I',0x02014b50,20,20,0x0808,method,0,33,crc,len(data),size,len(name),0,0,0,0,0,offset)+name);offset+=len(body)
    central=b''.join(directory)
    return b''.join(local)+central+struct.pack('<I4H2IH',0x06054b50,0,0,len(rows),len(rows),len(central),offset,0)
def manifest_row(value):
    raw=canonical(value);codec=zlib.compressobj(6,zlib.DEFLATED,-15);compressed=codec.compress(raw)+codec.flush()
    return {'path':'manifest.json','method':8,'crc':binascii.crc32(raw)&0xffffffff,'bytes':len(raw),'compressed':compressed}
def make_bad(source,destination):
    source=Path(source);destination=Path(destination);destination.mkdir(parents=True,exist_ok=False)
    info=read_archive(source);rows=structure(source.read_bytes());output=[]
    for name,code in [('manifest','CAD_ARCHIVE_INVALID'),('version','CAD_ARCHIVE_UNSUPPORTED'),('crc','CAD_ARCHIVE_INTEGRITY'),('hash','CAD_ARCHIVE_INTEGRITY'),('duplicate','CAD_ARCHIVE_INVALID'),('missing','CAD_ARCHIVE_INVALID')]:
        altered=[dict(r) for r in rows];manifest=json.loads(json.dumps(info['manifest']))
        if name=='manifest':manifest['unexpected']=True;altered[-1]=manifest_row(manifest)
        elif name=='version':manifest['version']=99;altered[-1]=manifest_row(manifest)
        elif name=='crc':
            row=next(r for r in altered if r['path']=='authored/model.json');row['crc']^=1
        elif name=='hash':
            next(e for e in manifest['entries'] if e['role']=='model')['sha256']='0'*64;manifest['designRevision']=sha(canonical(root_record(manifest)));altered[-1]=manifest_row(manifest)
        elif name=='duplicate':altered.insert(-1,dict(altered[0]))
        elif name=='missing':altered=[r for r in altered if r['path']!='authored/model.json']
        file=destination/(name+'.cad');file.write_bytes(rebuild(altered));output.append({'name':name,'code':code,'file':str(file.resolve()),'sourceSha256':info['sha256']})
    return output
if __name__=='__main__':
    if len(sys.argv)==4 and sys.argv[1]=='make-bad':print(json.dumps(make_bad(sys.argv[2],sys.argv[3])))
    elif len(sys.argv)==2:print(json.dumps(read_archive(sys.argv[1]),indent=2))
    else:raise SystemExit('archive_oracle.py FILE.cad | make-bad FILE.cad NEW-DIRECTORY')
