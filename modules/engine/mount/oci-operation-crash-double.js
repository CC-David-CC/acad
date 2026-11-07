// Deliberately crashes only after a request; never used as an engine.
self.onmessage = event => { if (event.data?.kind === 'init') self.postMessage({kind:'ready'}); else throw Error('intentional operation failure'); };
