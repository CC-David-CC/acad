#!/usr/bin/env python3
"""Construct two OWN negative inputs from a genuine C09 native .cad Save.
No production encoder/parser, successful model authoring or qualification run.
The complete after-whole oracle separately checks archive integrity/mutations.
"""
import binascii, copy, hashlib, json, sys, zlib
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'native-cad-container'))
from archive_oracle import read_archive, structure, rebuild, manifest_row, canonical, root_record

def require(value,message):
    if not value:raise ValueError(message)
def one(rows,message):require(len(rows)==1,message);return rows[0]
def sha(value):return hashlib.sha256(value).hexdigest()

def make(source,destination):
    source=Path(source);destination=Path(destination);require(source.suffix=='.cad','genuine .cad required');destination.mkdir(parents=True,exist_ok=False)
    original=read_archive(source);raw=source.read_bytes();project=original['envelope']['project']
    candidates=[(s,r) for s in project['sketches'] for r in s['data']['dimensions'] if r['type']=='LinearDimension'];sketch,ruler=one(candidates,'one genuine saved LinearDimension required')
    require(set(ruler)=={'id','type','data'} and set(ruler['data'])=={'a','b','offset'},'genuine canonical ruler required')
    segment=next((o for o in sketch['data']['objects'] if o['type']=='Segment'),None);require(segment is not None,'actual same-sketch saved Segment required');require(segment['id'] not in (ruler['data']['a'],ruler['data']['b']),'Segment is not an existing endpoint reference')
    descriptor=one([e for e in original['manifest']['entries'] if e['role']=='sketch' and e['logicalId']==sketch['id']],'actual source descriptor');output=[]
    for kind in ('unknown-data-field','segment-reference'):
        rows=structure(raw);manifest=copy.deepcopy(original['manifest']);data=copy.deepcopy(sketch['data']);changed=one([r for r in data['dimensions'] if r['id']==ruler['id']],'original ruler identity')
        if kind=='unknown-data-field':
            changed['data']['unsupportedRulerField']=True;mutation={'field':'data.unsupportedRulerField','value':True}
        else:
            changed['data']['a']=segment['id'];mutation={'field':'data.a','from':ruler['data']['a'],'to':segment['id']}
        body=canonical(data);compressor=zlib.compressobj(6,zlib.DEFLATED,-15);compressed=compressor.compress(body)+compressor.flush();entry=one([e for e in manifest['entries'] if e['path']==descriptor['path']],'same descriptor');entry['bytes']=len(body);entry['sha256']=sha(body);manifest['designRevision']=sha(canonical(root_record(manifest)))
        for index,row in enumerate(rows):
            if row['path']==descriptor['path']:rows[index]={'path':row['path'],'method':8,'crc':binascii.crc32(body)&0xffffffff,'bytes':len(body),'compressed':compressed}
        rows[-1]=manifest_row(manifest);encoded=rebuild(rows);file=destination/(kind+'.cad');file.write_bytes(encoded)
        output.append({'kind':kind,'file':str(file.resolve()),'sha256':sha(encoded),'bytes':len(encoded),'sourceSha256':original['sha256'],'sketchId':sketch['id'],'rulerId':ruler['id'],'segmentId':segment['id'],'changedEntryPath':descriptor['path'],'mutation':mutation,'expectedCode':'CAD_ARCHIVE_INVALID'})
    return output

if __name__=='__main__':
    require(len(sys.argv)==3,'malformed_rulers.py GENUINE-SAVE.cad NEW-DIRECTORY');print(json.dumps(make(sys.argv[1],sys.argv[2])))
