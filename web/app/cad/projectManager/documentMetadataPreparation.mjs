// Private app-module transport capability. Public services never accept these
// tokens or caller-supplied charges. PM additionally authenticates its actual
// document/owner participant before Craft may install anything.
const prepared = new WeakMap();
export function bindManufacturingWorkerPreparation(data) {
  const token = Object.freeze({});
  prepared.set(token, Object.freeze(data));
  return token;
}
export function readManufacturingWorkerPreparation(token) {
  const data = token && typeof token === 'object' ? prepared.get(token) : null;
  if (!data) throw Object.assign(Error('Unknown manufacturing preparation capability.'), {code:'INVALID_PREPARATION'});
  return data;
}
