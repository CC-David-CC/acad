import {callObserver, Emitter} from './emitter';

const pending = new WeakMap();

// Installations are synchronous. Reentrant delivery is coalesced per stream
// and yields to the event loop so a feedback loop cannot starve browser input.
export function notifyStateRevision(stream, value, revision, valid = () => true) {
  const current = () => valid() && stream.revision === revision;
  if (!current()) return;
  if (stream.state === 1) {
    const scheduled = pending.has(stream);
    pending.set(stream, {value, revision, valid});
    if (!scheduled) setTimeout(() => {
      const latest = pending.get(stream);
      pending.delete(stream);
      if (latest) notifyStateRevision(stream, latest.value, latest.revision, latest.valid);
    }, 0);
  } else {
    Emitter.prototype.nextGuarded.call(stream, value, current);
  }
}

export class StateStream extends Emitter {

  constructor(initialValue) {
    super();
    this._value = initialValue;
    this._revision = 0;
  }
  
  get value() {
    return this._value;
  }

  set value(v) {
    this.next(v);
  }

  next(v) {
    this.assignValue(v);
    notifyStateRevision(this, v, this._revision);
  }

  get revision() {
    return this._revision;
  }

  // Internal synchronous installation. Only the batch publisher should use
  // this without immediately notifying observers.
  assignValue(v) {
    if (this._revision >= Number.MAX_SAFE_INTEGER) throw new Error('State revision exhausted');
    this._revision++;
    this._value = v;
  }

  update(updater) {
    this.value = updater(this._value);
  }

  mutate(mutator) {
    mutator(this._value);
    this.next(this._value);
  }

  attach(observer) {
    const detach = super.attach(observer);
    callObserver(observer, this._value);
    return detach;
  }
}

export class DistinctStateStream extends StateStream {

  next(v) {
    if (this._value === v) {
      return;
    }
    super.next(v);
  }
}
