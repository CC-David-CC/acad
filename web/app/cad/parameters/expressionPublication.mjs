// Private registration: callers still own worker-result authentication and the
// document/replay lifetime. Nothing is attached to the public service object.
const registrations=new WeakMap();
export function registerExpressionPublication(service,prepare){if(!service||typeof service!=='object'||typeof prepare!=='function'||registrations.has(service))throw Error('Invalid expression publication registration.');registrations.set(service,prepare);}
export function prepareExpressionPublication(service,source,response,revision){const prepare=registrations.get(service);if(!prepare)throw Error('Expression publication unavailable.');return prepare(source,response,revision);}
