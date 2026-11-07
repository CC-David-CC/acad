
let ID_COUNTER = 0;

// Restored IDs can be sparse. Reserve all persisted numeric IDs before any
// reconstruction creates derived spline points or new authored entities.
export function numericSketchIdHighWater(root) {
  const pending = [root], seen = new Set();
  let highest = -1;
  while (pending.length) {
    const value = pending.pop();
    if (!value || typeof value !== 'object' || seen.has(value)) continue;
    seen.add(value);
    if (seen.size > 1000000) throw new Error('Sketch identifier scan exceeds its limit');
    if (typeof value.id === 'string' && /^(0|[1-9][0-9]*)$/.test(value.id)) {
      const id = Number(value.id);
      if (Number.isSafeInteger(id)) highest = Math.max(highest, id);
    }
    for (const child of Object.values(value)) if (child && typeof child === 'object') pending.push(child);
  }
  if (highest >= Number.MAX_SAFE_INTEGER) throw new Error('Sketch identifiers are exhausted');
  return highest;
}

export const Generator = {
  genID : function() {
    if (!Number.isSafeInteger(ID_COUNTER) || ID_COUNTER < 0) throw new Error('Sketch identifiers are exhausted');
    return ID_COUNTER ++;
  },

  resetIDGenerator : function(value = 0) {
    if (!Number.isSafeInteger(value) || value < 0) throw new Error('Invalid sketch identifier counter');
    ID_COUNTER = value;
  },

  reserveThrough : function(value) {
    if (!Number.isSafeInteger(value) || value < -1 || value >= Number.MAX_SAFE_INTEGER) throw new Error('Invalid sketch identifier reservation');
    ID_COUNTER = Math.max(ID_COUNTER, value + 1);
  },

  withReservedIds : function(value, action) {
    const previous = ID_COUNTER;
    try { this.reserveThrough(value); return action(); }
    finally { ID_COUNTER = previous; }
  }
};

