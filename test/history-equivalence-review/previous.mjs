// Exact previous comparator extracted from 2ad57a006^:web/app/sketcher/history.js.
// Test reference only; never imported by the application.
function canonicalSketch(text) {
  function sort(value) {
    if (Array.isArray(value)) return value.map(sort);
    if (value && typeof value === 'object') {
      return Object.fromEntries(Object.keys(value).sort().map(key => [key, sort(value[key])]));
    }
    return value;
  }
  return JSON.stringify(sort(JSON.parse(text)));
}

// Legacy snapshots do not carry admission hints. Allow only newly generated
// hints to be absent from the expected snapshot; preserve exact comparisons for
// all saved hints and every other field. Legacy priority itself is unknowable.
export function previousSameRestoredSketch(expectedText, actualText) {
  const expected = JSON.parse(expectedText), actual = JSON.parse(actualText);
  if (Array.isArray(expected.stages) && Array.isArray(actual.stages)) {
    expected.stages.forEach((stage, i) => {
      const actualStage = actual.stages[i];
      if (!Array.isArray(stage && stage.constraints) || !Array.isArray(actualStage && actualStage.constraints)) return;
      stage.constraints.forEach((constraint, j) => {
        const actualConstraint = actualStage.constraints[j];
        if (constraint && actualConstraint && !Object.prototype.hasOwnProperty.call(constraint, 'admission')) {
          delete actualConstraint.admission;
        }
      });
    });
  }
  return canonicalSketch(JSON.stringify(expected)) === canonicalSketch(JSON.stringify(actual));
}
