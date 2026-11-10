"""Independent AFTER-WHOLE joins for public-refusals.mjs, no product imports."""
def check_box_build_admission(rows, commands, unstaged_revision):
    expected=[(phase,label,code) for phase in ('empty','continuation') for label,code in (
        ('unregistered explicit box build','ENGINE_REVISION_MISMATCH'),
        ('registered unstaged explicit box build','ENGINE_BUILD_UNAVAILABLE' if phase=='empty' else 'ENGINE_REVISION_MISMATCH'))]
    if [(r['phase'],r['label'],r['error']['code']) for r in rows]!=expected:
        raise ValueError('exact grouped box admission roster')
    for r in rows:
        args=r['args']; before=r['before']; after=r['after']; error=r['error']
        if before!=after or error['committed'] or error['possiblyCommitted']:
            raise ValueError('full exact pre-candidate state/counter/token/resource preservation')
        revision=unstaged_revision if r['label'].startswith('registered ') else 'sha256:'+64*'0'+':'+64*'0'
        if args!={'revision':before['capture']['solids']['revision'],'version':1,'unit':'millimeter','engine':'occ','engineRevision':revision,'origin':[0,0,0],'dimensions':[2,3,4]}:
            raise ValueError('actual public box request and captured current revision')
        matches=[c for c in commands if c.get('command')==r['command'] and c.get('args')==args and isinstance(c.get('error'),dict) and all(c['error'].get(k)==v for k,v in error.items())]
        if len(matches)!=1:
            raise ValueError('unique actual rejected public command/error association')
    return {'cases':4,'scope':'public early build admission; full lifecycle remains separately required'}
