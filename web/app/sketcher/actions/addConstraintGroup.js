// Admit a multi-selection as one edit: a conflicting member must not leave
// earlier members active or disturb previously accepted relationships.
export function addConstraintGroup(pm, constraints, validateExtra, mutate) {
  if (pm.inTransaction) throw new Error('Finish the current sketch operation first.');
  const history = pm.viewer.historyManager;
  const before = Array.isArray(history?.diffs) ? {
    diffs: [...history.diffs], pointer: history.historyPointer,
    last: history.lastCheckpoint, counter: history._counter
  } : null;
  try {
    if (history) history._checkpoint();
    pm.startTransaction();
    if(mutate)mutate(pm);else for (const constraint of constraints) pm._add(constraint);
    pm.finishTransaction(stages => {
      if(validateExtra)validateExtra(stages);
      for (const constraint of constraints) {
        const stage = constraint.stage, system = stage?.algNumSystem;
        if (!stage || !stages.includes(stage) || !system.allConstraints.includes(constraint) ||
            (system.isConflicting(constraint) && !system.redundant.has(constraint))) {
          throw new Error('The selected constraints cannot be applied together.');
        }
      }
      for (const stage of stages) {
        const system = stage.algNumSystem, previous = system.transactionBefore;
        for (const constraint of system.allConstraints) {
          const wasRejected = previous.conflicting.has(constraint) && !previous.redundant.has(constraint);
          const nowRejected = system.conflicting.has(constraint) && !system.redundant.has(constraint);
          if (!wasRejected && nowRejected) throw new Error('The selected constraints would invalidate an existing constraint.');
        }
      }
    }, false);
  } catch (error) {
    if (pm.inTransaction) {
      try { pm.finishTransaction(() => { throw error; }); } catch (_) { /* preserve original failure */ }
    }
    if (before) {
      history.diffs.splice(0, history.diffs.length, ...before.diffs);
      history.historyPointer = before.pointer;
      history.lastCheckpoint = before.last;
      history._counter = before.counter;
    }
    throw error;
  }
  try { pm.refresh(); } catch (error) { console.error('Constraints were accepted, but sketch refresh failed:', error); }
}

