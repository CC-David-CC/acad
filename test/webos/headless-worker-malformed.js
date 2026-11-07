self.onmessage = event => self.postMessage({ok:true,revision:event.data.revision});
