"""Independent AFTER-WHOLE admission/command/next-ID joins; no product imports."""
def require(v,msg):
    if not v:raise ValueError(msg)
def check_box_build_admission(rows, commands, unstaged_revision):
    expected=[('empty','unregistered explicit box build','ENGINE_REVISION_MISMATCH'),('empty','registered unstaged explicit box build','ENGINE_BUILD_UNAVAILABLE'),('empty','unstaged declared default box build','ENGINE_BUILD_UNAVAILABLE'),('continuation','unregistered explicit box build','ENGINE_REVISION_MISMATCH'),('continuation','registered unstaged explicit box build','ENGINE_REVISION_MISMATCH')]
    require([(r['phase'],r['label'],r['error']['code']) for r in rows]==expected,'exact five-case admission roster')
    for r in rows:
        args,before,after,error=r['args'],r['before'],r['after'],r['error']
        require(error['name']=='Error' and before==after and not error['committed'] and not error['possiblyCommitted'],'exact full pre-candidate state/counters/tokens')
        revision=unstaged_revision if r['label'].startswith('registered ') else 'sha256:'+64*'0'+':'+64*'0'
        want={'revision':before['capture']['solids']['revision'],'version':1,'unit':'millimeter','engine':'occ','origin':[0,0,0],'dimensions':[2,3,4]}
        if r['label']!='unstaged declared default box build':want['engineRevision']=revision
        require(args==want,'actual public request/current revision')
        matches=[c for c in commands if c.get('command')==r['command'] and c.get('args')==args and isinstance(c.get('error'),dict) and all(c['error'].get(k)==v for k,v in error.items())]
        require(len(matches)==1,'unique actual rejected command/error')
        solids=before['capture']['solids'];engine=[x for x in solids['engines'] if x['id']=='occ'];require(len(engine)==1,'actual OCC discovery')
        engine=engine[0];require(engine['revision']==unstaged_revision and engine['defaultAvailable'] is False and engine['defaultReason']['code']=='ENGINE_BUILD_UNAVAILABLE' and all(x['engineRevision']!=unstaged_revision for x in engine['availableBuilds']),'declared unavailable default, no fallback/false availability')
        binding=[x for x in solids['boxEngineBindings'] if x['engine']=='occ'];require(len(binding)==1,'actual continuation binding')
        if r['phase']=='empty':require(not before['capture']['native']['history'] and not solids['outputs'] and binding[0]=={'engine':'occ','engineRevision':None,'compatible':False,'reason':'ENGINE_BUILD_UNAVAILABLE'},'empty actual default unavailable')
        else:require(binding[0]['compatible'] is True and solids['outputs'] and all('sha256:'+x['metrics']['runtime']['jsSha256']+':'+x['metrics']['runtime']['wasmSha256']==binding[0]['engineRevision']!=unstaged_revision for x in solids['outputs']),'actual existing part keeps its own supported runtime')
    empty=rows[2]['after'];continued=rows[4]['after']
    creates=[c for c in commands if c.get('command')=='create-worker-solid-box' and 'result' in c]
    require(len(creates)>=2 and creates[0]['result']['featureId']==empty['capture']['native']['counters']['featureId']+1,'first healthy box uses immediately next ID')
    booleans=[c for c in commands if c.get('command')=='create-worker-solid-boolean' and 'result' in c]
    require(booleans and booleans[0]['result']['featureId']==continued['capture']['native']['counters']['featureId']+1,'healthy actual Boolean immediately continues with no hidden allocation')
    return {'cases':5,'noFallback':True,'preCandidateState':'exact'}
