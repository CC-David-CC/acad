// Reusable actual registered-command recipe. Opaque IDs are never constructed or parsed.
export function createLoftCreationExample(agent, engineRevision) {
  const call = (id, args = {}) => agent.execute(id, args);
  const one = (rows, label) => { if (rows.length !== 1) throw Error('Expected one ' + label); return rows[0]; };
  const sameIds = (a, b) => JSON.stringify(a.slice().sort()) === JSON.stringify(b.slice().sort());
  function lowerLeft(region, inspection) {
    const minX = Math.min(...inspection.points.map(p => p.x));
    const minY = Math.min(...inspection.points.map(p => p.y));
    return one(region.seams.filter(seam => {
      const p = inspection.points.find(p => p.id === seam.pointId);
      const other = inspection.points.filter(q => q.parentId === seam.curveId && q.id !== seam.pointId);
      return seam.kind === 'vertex' && p?.parentId === seam.curveId && p.x === minX && p.y === minY &&
        other.length === 1 && other[0].y === minY && other[0].x > p.x;
    }), 'actual advertised lower-left bottom-edge endpoint seam');
  }
  async function discover(b) {
    const i = await call('inspect-worker-lofts');
    if (!i.ready || !i.builds.some(r => r.engineRevision === engineRevision && r.canCreate)) throw Error(i.reason || 'Exact loft build is unavailable.');
    const d = await call('inspect-worker-loft-regions', {revision:i.revision, faceIds:b.faceIds, engineRevision});
    if (d.sections.length !== 2) throw Error('Two actual ordered source sections required.');
    return d;
  }
  function request(b, discovery) {
    return {revision:discovery.revision, version:1, unit:'millimeter', engine:'occ', engineRevision,
      sections:b.sections, construction:'ruled-solid', bodyPolicy:'separate'};
  }
  async function widthRequest(b, currentWidth, value) {
    const i = await agent.inspect(b.faceIds[0]);
    const row = one(i.dimensionTargets.filter(r => r.typeId === 'SegmentLength' && r.canEdit &&
      r.objects.length === 1 && r.objects[0] === b.seamCurveIds[0]), 'actual current bottom-edge width target');
    if (!Number.isFinite(row.resolvedValue) || Math.abs(row.resolvedValue-currentWidth)>1e-8) throw Error('Actual bottom-edge width differs from the current source target.');
    return {revision:i.revision, faceId:b.faceIds[0], constraintId:row.constraintId, value};
  }
  async function planeRequest(b, depth) {
    const i = await call('inspect-source-planes');
    const p = one(i.features.filter(r => r.faceId === b.faceIds[1] && r.featureId === b.planes[1].featureId), 'actual current upper independent plane');
    if (!i.ready || !p.canEdit) throw Error(p.reason || i.reason);
    return {revision:i.revision, index:p.index, featureId:p.featureId, faceId:p.faceId, depth};
  }
  return Object.freeze({discover, request, widthRequest, planeRequest,
    async sources() {
      const faceIds = [], creations = [], inspections = [];
      for (const [origin,width,height,depth] of [[[-50,-25],100,50,0],[[-25,-12.5],50,25,30]]) {
        const i = await call('inspect-rectangle-creation'); if (!i.ready) throw Error(i.reason);
        const p = await call('create-rectangle-sketch', {revision:i.revision, unit:'millimeter', origin,width,height,depth});
        creations.push(p); faceIds.push(p.faceId); inspections.push(await agent.inspect(p.faceId));
      }
      const b = {faceIds, curveIds:inspections.map(i => i.objects.map(o => o.id))};
      if (inspections.some(i => i.objects.length !== 4 || i.objects.some(o => o.type !== 'Segment'))) throw Error('Original four-Segment sources required.');
      const d = await discover(b), choices = d.sections.map((s,n) => {
        if (s.faceId !== faceIds[n]) throw Error('Section source ordering changed.');
        const r = one(s.regions.filter(r => r.support === 'supported' && r.sectionKind === 'polygon' && r.edgeCount === 4 &&
          r.descriptor.holeCurveIds.length === 0 && sameIds(r.descriptor.outerCurveIds,b.curveIds[n])), 'actual rectangle region');
        return {region:r, seam:lowerLeft(r,inspections[n])};
      });
      b.sections = choices.map((r,n) => ({faceId:faceIds[n],regionId:r.region.regionId,seam:{kind:'vertex',pointId:r.seam.pointId,reversed:false}}));
      b.seamCurveIds = choices.map(r => r.seam.curveId); b.initialDiscovery = d;
      const p = await call('inspect-source-planes');
      b.planes = faceIds.map((id,n) => {
        const r = one(p.features.filter(r => r.faceId === id && r.featureId === creations[n].featureId), 'actual source plane');
        if (!p.ready || !r.canEdit || r.orientation !== 'XY') throw Error(r.reason || p.reason || 'XY source plane unavailable.');
        return {index:r.index,featureId:r.featureId,faceId:r.faceId,orientation:r.orientation};
      });
      return b;
    },
    async create(b) { const d = await discover(b); const r = await call('create-worker-loft',request(b,d)); return {discovery:d,result:r}; },
    width:(b,current,value) => widthRequest(b,current,value).then(args => call('edit-closed-sketch-dimension',args)),
    plane:(b,depth) => planeRequest(b,depth).then(args => call('edit-source-plane-depth',args)),
    async authored(b) {
      const i = await call('inspect-worker-loft-history'); if (!i.ready) throw Error(i.reason);
      const p = one(i.features.filter(r => r.featureId === b.featureId), 'original authored loft');
      return Object.fromEntries(['version','unit','engine','engineRevision','featureId','sections','construction','bodyPolicy'].map(k => [k,p[k]]));
    }
  });
}
