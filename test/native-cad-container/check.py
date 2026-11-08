#!/usr/bin/env python3
"""Run ONCE after the complete real public workflow, not between source edits.
Independent ZIP/source/STEP/core3MF/SVG checks; no production validator/kernel.
"""
import argparse, hashlib, importlib.util, json, math, sys
from pathlib import Path
from urllib.parse import urlparse, unquote
from archive_oracle import read_archive
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'typed-part-artifacts'))
def require(ok,text):
    if not ok:raise ValueError(text)
def one(rows,text):require(len(rows)==1,text);return rows[0]
sha=lambda b:hashlib.sha256(b).hexdigest()
def load_artifact_oracle():
    file=Path(__file__).resolve().parents[1]/'typed-part-artifacts/check.py'
    spec=importlib.util.spec_from_file_location('typed_artifact_oracle',file);module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module);return module

def main():
    parser=argparse.ArgumentParser();parser.add_argument('evidence',type=Path);parser.add_argument('--desktop-source',type=Path,required=True);args=parser.parse_args();folder=args.evidence.resolve();r=json.loads((folder/'receipt.json').read_text());a=load_artifact_oracle()
    require(r['status']=='PASS' and r['ownedContextClosed'] and r['sharedBrowserDisconnectedOnly'],'complete workflow/cleanup');require(len(r['codecWorkers'])==10 and all(x['destroyed'] and '/native-archive.' in x['url'] for x in r['codecWorkers']),'actual observed owned codec target retirement');require(r['sourcePins']==r['sourcePinsAfter'],'source checkpoint unchanged');require(r['filesUiOpen']['readonlyDefinition'] is True and r['filesUiOpen']['inspection']['dirty'] is False and '.cad' in r['filesUiOpen']['inspection']['nativeProjectExtensions'],'actual Files UI native association and clean adoption');require(r['syntheticGeometry'] is False and r['sourceSeeds'] is False and r['filesystemRace'] is False,'genuine workflow only')
    expected={'initial-source':100,'unchanged-source':100,'edited-source':120,'reedited-source':130};require([row['label'] for row in r['nativeSaves']]==list(expected),'four actual archive saves')
    archives={};native={};costs=[];previous=None
    for row in r['nativeSaves']:
        file=folder/row['savedFile'];value=read_archive(file);require(value['sha256']==row['sha256'] and value['bytes']==row['bytes'],'normal saved/synchronized archive bytes')
        require(value['envelope']==row['acceptedEnvelope'],'actual .cad restores exactly the captured full authored envelope')
        require(value['rawSketches']=={x['id']:x['source'] for x in row['before']['capture']['native']['sketches']},'exact original accepted raw sketch text')
        derived=a.derive(value['envelope'],r['binding'],expected[row['label']],r['engineRevision'],r['definition']);native[row['label']]=derived;archives[row['label']]=value
        receipt=row['result'];codec=receipt['nativeArchive'];require(receipt['committed'] is True and receipt['archiveReuse']=='verified' and receipt['archiveRebaseVerificationBytes']==value['bytes'],'actual committed verified generation rebasing')
        require(codec['designRevision']==value['manifest']['designRevision'] and codec['entryCount']==len(value['manifest']['entries'])+1 and codec['archiveVerificationBytes']==value['bytes'],'issued root/directory/output verification cost')
        reusable=[] if previous is None else [path for path,entry in value['spans'].items() if path in previous['spans'] and entry['contentSha256']==previous['spans'][path]['contentSha256']]
        for path in reusable:require(value['spans'][path]['compressedSha256']==previous['spans'][path]['compressedSha256'] and value['spans'][path]['localSha256']==previous['spans'][path]['localSha256'],'unchanged canonical local/compressed record bytes')
        reused=sum(value['spans'][path]['compressedBytes'] for path in reusable);require(codec['reusedCompressedBytes']==reused,'actual codec-owned compressed reuse byte accounting')
        changed=sum(entry['bytes'] for entry in value['manifest']['entries'] if entry['path'] not in reusable);require(codec['changedEncodedBytes']==changed,'actual UTF-8 changed-entry encoding accounting')
        costs.append({'label':row['label'],'outerBytes':value['bytes'],'changedEntryUtf8Bytes':changed,'reusedCompressedBytes':reused,'preparedOutputHashBytes':codec['archiveVerificationBytes'],'committedRebaseHashBytes':receipt['archiveRebaseVerificationBytes'],'filesOuterIntegrityAndDeltaWork':'retained; not measured as zero by this codec receipt'})
        previous=value
    require(archives['initial-source']['sha256']==archives['unchanged-source']['sha256'] and costs[1]['changedEntryUtf8Bytes']==0 and costs[1]['reusedCompressedBytes']>0,'deterministic unchanged save/private reuse')
    pinrows=[x for x in r['rows'] if x['label']=='Exact frozen composed runtime'];require(len(pinrows)==4,'initial plus three genuine fresh runtime Opens')
    for row in pinrows:require({x['name']:x['sha256'] for x in row['assets']}==r['pins']['files'] and row['outer']['sha256']==r['pins']['outer']['sha256'],'exact served runtime/native/worker assets')
    module=args.desktop_source/'test/agent-cad-corpus/manufacturing-shared/oracle/mesh.py';pin=one([v for k,v in r['sourcePins'].items() if unquote(urlparse(k).path).endswith('/test/agent-cad-corpus/manufacturing-shared/oracle/mesh.py')],'mesh oracle pin');require(sha(module.read_bytes())==pin,'independent mesh source')
    spec=importlib.util.spec_from_file_location('independent_mesh',module);mesh=importlib.util.module_from_spec(spec);spec.loader.exec_module(mesh)
    exports=[];seen=set();export_rows={x['label'].split(': ',1)[1]:x for x in r['rows'] if x['label'].startswith('Real typed artifact files: ')}
    for row in r['artifacts']:
        phase,format=row['phase'],row['format'];require((phase,format) not in seen and phase in a.WIDTHS and format in ('step','3mf','svg'),'unique real export');seen.add((phase,format));raw=(folder/row['savedFile']).read_bytes();require(sha(raw)==row['sha256'] and len(raw)==row['bytes'],'actual artifact byte pins')
        d=native[a.NATIVE[phase]];result=row['result'];require(result['committed'] is True and result['dirty'] is False and result['persistence']=='browser' and result['serverStatus']=='not-verified','truthful ordinary file receipt')
        checked=a.inspect_step(raw,d['truth']) if format=='step' else a.check3mf(raw,d,mesh.inspect) if format=='3mf' else a.check_svg(raw,d,result,export_rows[phase]['before']['drawing'])
        exports.append({'phase':phase,'format':format,'sha256':sha(raw),'bytes':len(raw),'checked':checked})
    require(seen=={(phase,format) for phase in a.WIDTHS for format in ('step','3mf','svg')},'all twelve actual same-part artifact files')
    for row in export_rows.values():require(row['before']==row['after'],'read-only exports preserve complete accepted state')
    bad=r['malformed'];require([x['name'] for x in bad]==['manifest','version','crc','hash','duplicate','missing'],'own malformed native Open roster')
    for row in bad:
        require(sha((folder/row['file']).read_bytes())==row['sha256'] and row['sourceSha256']==archives['reedited-source']['sha256'],'own malformed derivative lineage')
        require(row['failure']['code']==row['code'] and not row['failure']['committed'] and not row['failure']['possiblyCommitted'],'typed refusal before adoption')
    print(json.dumps({'status':'PASS','scope':'Independent complete .cad/source/typed Native/artifact subset; no blanket Gate1/interchange/performance/capacity claim','nativeArchives':[{k:v for k,v in row.items() if k!='filesOuterIntegrityAndDeltaWork'} for row in costs],'costLimits':{'FilesWholeBlobIntegrity':'still required; no zero-total-hash claim','mainThread':'existing ARC23 dirty comparisons and source hydration remain','memory':'not inferred from admitted capacity','derivedCache':'no public automatic producer in this workflow'},'exports':exports,'malformedNativeOpen':len(bad)},indent=2))
if __name__=='__main__':main()
