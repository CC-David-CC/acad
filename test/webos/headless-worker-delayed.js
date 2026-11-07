self.onmessage = event => setTimeout(() => self.postMessage({ok:true,revision:event.data.revision,sketch:{},evidence:[]}), 20);
