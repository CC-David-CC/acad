// Test double for controller failures only; performs no verification or CAD.
self.onmessage = event => { if (event.data?.kind === 'init') self.postMessage({kind:'ready'}); };
