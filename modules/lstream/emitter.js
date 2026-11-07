import {StreamBase} from './base';

const READY = 0;
const EMITTING = 1;

export class Emitter extends StreamBase {

  constructor() {
    super();
    this.observers = [];
    this.state = READY;
  }

  attach(observer) {
    this.observers.push(observer);
    return () => this.detach(observer);
  }

  detach(callback) {
    for (let i = this.observers.length - 1; i >= 0 ; i--) {
      if (this.observers[i] === callback) {
        this.observers.splice(i, 1);
      }
    }
  }

  next(value) {
    this.nextGuarded(value, () => true);
  }

  // Publication may be superseded by a synchronous observer (for example a
  // document reset). Do not deliver that old revision to later observers.
  nextGuarded(value, current) {
    if (this.state === EMITTING) {
      console.warn('recursive dispatch');
      return;
    }
    try {
      this.state = EMITTING;
      // New state subscribers already receive the current value from attach.
      // They must not extend this dispatch or receive that value twice.
      for (const observer of this.observers.slice()) {
        if (!current()) break;
        if (this.observers.includes(observer)) callObserver(observer, value);
      }
    } finally {
      this.state = READY;
    }
  }
}

export function callObserver(observer, value) {
  try {
    observer(value);
  } catch (e) {
    console.error('Error while observer call:');
    console.error(observer);
    console.error(e);
  }
}
