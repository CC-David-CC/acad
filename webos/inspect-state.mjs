// Read-only inspection mirrors the host's serialized saved envelope.
export function inspectedProjectIsDirty(project, baseline, getManufacturing) {
  const prior = JSON.parse(baseline);
  const wrapped = prior?.format === 'codi-jsketcher-manufacturing';
  if (wrapped && typeof getManufacturing !== 'function') throw Error('Manufacturing state is unavailable.');
  const manufacturing = typeof getManufacturing === 'function' ? getManufacturing() : null;
  if (wrapped && !manufacturing) throw Error('Manufacturing state is unavailable.');
  const inspected = manufacturing ? {format:'codi-jsketcher-manufacturing',version:1,project,manufacturing} : project;
  return JSON.stringify(inspected) !== baseline;
}
