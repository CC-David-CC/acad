// Check the actual A→B branch rather than assuming the sign of polar t.
export function projectedDirectionValid(segment) {
  if(!segment?.a || !segment?.b || !segment.params?.ang || !segment.params?.t)return false;
  const dx=segment.b.x-segment.a.x,dy=segment.b.y-segment.a.y,length=Math.hypot(dx,dy);
  const angle=segment.params.ang.get(),t=segment.params.t.get();
  if(![dx,dy,length,angle,t].every(Number.isFinite)||length<=1e-9||Math.abs(t)<=1e-9)return false;
  const tolerance=Math.max(1e-7,length*1e-8);
  return Math.abs(dx-t*Math.cos(angle))<=tolerance && Math.abs(dy-t*Math.sin(angle))<=tolerance;
}
