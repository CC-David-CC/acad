// Data-only plan. This does not own solver parameters or publish a group.
const LIMIT = 32;
const EPS = 1e-9;
const finite = value => typeof value === 'number' && Number.isFinite(value) && Math.abs(value) <= 1e6;
const identifier = value => typeof value === 'string' && value.length > 0 && value.length <= 1024;

export function planRigidSegments(groupId, segments) {
  if (!identifier(groupId) || !Array.isArray(segments) || segments.length < 2 || segments.length > LIMIT) {
    throw Error('Rigid group requires 2–32 supported segments and a stable ID');
  }
  const ids = new Set([groupId]);
  const points = [];
  const members = [];
  for (const segment of segments) {
    if (!segment || !identifier(segment.id) || ids.has(segment.id) || !segment.a || !segment.b) throw Error('Invalid or duplicate segment');
    ids.add(segment.id);
    for (const point of [segment.a, segment.b]) {
      if (!identifier(point.id) || ids.has(point.id) || !finite(point.x) || !finite(point.y)) throw Error('Invalid or shared endpoint');
      ids.add(point.id);
      points.push({id: point.id, x: point.x, y: point.y});
    }
    if (Math.hypot(segment.b.x - segment.a.x, segment.b.y - segment.a.y) <= EPS) throw Error('Degenerate segment');
    members.push({id: segment.id, a: segment.a.id, b: segment.b.id});
  }
  const origin = points[0], next = points[1];
  const dx = next.x - origin.x, dy = next.y - origin.y, length = Math.hypot(dx, dy);
  if (!points.some(p => Math.abs(dx * (p.y - origin.y) - dy * (p.x - origin.x)) > EPS * length)) {
    throw Error('Rigid group must have a noncollinear profile');
  }
  const cos = dx / length, sin = dy / length;
  const local = points.map(p => Object.freeze({id: p.id, x: cos * (p.x - origin.x) + sin * (p.y - origin.y), y: -sin * (p.x - origin.x) + cos * (p.y - origin.y)}));
  return Object.freeze({version: 1, id: groupId, members: Object.freeze(members.map(Object.freeze)), points: Object.freeze(local), transform: Object.freeze({x: origin.x, y: origin.y, angle: Math.atan2(dy, dx)})});
}

export function mapRigidPoints(plan, transform = plan.transform) {
  if (!transform || !finite(transform.x) || !finite(transform.y) || !finite(transform.angle)) throw Error('Invalid rigid transform');
  const cos = Math.cos(transform.angle), sin = Math.sin(transform.angle);
  return plan.points.map(p => ({id: p.id, x: transform.x + cos * p.x - sin * p.y, y: transform.y + sin * p.x + cos * p.y}));
}

// Validate and detach an authored group record; do not trust decoded project
// objects, mutable callers, duplicate IDs or an unrelated point sequence.
export function readRigidGroupRecord(groupId, record) {
  if (!record || typeof record !== 'object' || Array.isArray(record) ||
      Object.keys(record).sort().join(',') !== 'members,points,transform,version' || record.version !== 1 ||
      !Array.isArray(record.members) || !Array.isArray(record.points) ||
      !record.transform || typeof record.transform !== 'object' || Array.isArray(record.transform) ||
      Object.keys(record.transform).sort().join(',') !== 'angle,x,y') throw Error('Invalid rigid group record');
  const {x, y, angle} = record.transform;
  if (![x,y,angle].every(finite) || record.points.length !== record.members.length * 2) throw Error('Invalid rigid group transform or points');
  const world = mapRigidPoints({points: record.points}, {x,y,angle});
  const segments = record.members.map((member,i) => {
    if (!member || typeof member !== 'object' || Array.isArray(member) || Object.keys(member).sort().join(',') !== 'a,b,id' ||
        !record.points[i*2] || !record.points[i*2+1] || member.a !== record.points[i*2].id || member.b !== record.points[i*2+1].id) throw Error('Invalid rigid member');
    return {id:member.id,a:world[i*2],b:world[i*2+1]};
  });
  for (const point of record.points) {
    if (!point || typeof point !== 'object' || Array.isArray(point) || Object.keys(point).sort().join(',') !== 'id,x,y' || !identifier(point.id) || !finite(point.x) || !finite(point.y)) throw Error('Invalid rigid local point');
  }
  // Reuse the same membership and nondegeneracy checks, while preserving the
  // authored local frame rather than replacing it with a newly derived one.
  planRigidSegments(groupId,segments);
  return Object.freeze({version:1,id:groupId,members:Object.freeze(record.members.map(m=>Object.freeze({...m}))),
    points:Object.freeze(record.points.map(p=>Object.freeze({...p}))),transform:Object.freeze({x,y,angle})});
}
