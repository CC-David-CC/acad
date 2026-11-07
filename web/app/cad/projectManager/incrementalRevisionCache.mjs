// Research-only Merkle cache. A trusted transactional document service MUST
// supply item versions and global generations. Never use caller-controlled file
// metadata or cross-account cache entries as proof of unchanged content.
const encode = new TextEncoder();
const sha = async value => 'sha256-' + Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', encode.encode(value))), n => n.toString(16).padStart(2,'0')).join('');
const hex = /^sha256-[0-9a-f]{64}$/;
export function createRevisionCache() {
  let entries = new Map();
  let epoch = 0;
  return {
    invalidate() { entries = new Map(); epoch++; },
    async prepare({subject, projectId, fileVersion, generation, items, isCurrent, hashItem}) {
      if (![subject,projectId,fileVersion].every(v => typeof v === 'string' && v.length > 0) ||
          !Number.isSafeInteger(generation) || generation < 0 || !Array.isArray(items) || items.length > 100000 ||
          typeof isCurrent !== 'function' || typeof hashItem !== 'function') throw new Error('Invalid revision transaction');
      const startEpoch = epoch, staged = new Map(), seen = new Set(), leaves = [];
      for (const item of items) {
        if (!item || typeof item.path !== 'string' || !item.path || item.path.length > 1024 || seen.has(item.path) ||
            !Number.isSafeInteger(item.version) || item.version < 0) throw new Error('Invalid revision item');
        seen.add(item.path);
        // Conservative: replacement/file-version changes never inherit cache
        // entries until an authoritative lineage protocol exists.
        const key = JSON.stringify([subject,projectId,fileVersion,item.path]);
        const old = entries.get(key);
        let contentHash;
        if (old && old.version === item.version) contentHash = old.contentHash;
        else contentHash = await hashItem(item);
        if (!hex.test(contentHash)) throw new Error('Invalid item digest');
        staged.set(key, {version:item.version,contentHash});
        leaves.push([item.path,contentHash]);
      }
      // This flat root is a Merkle node over per-item digests. Logical path and
      // order are bound; item hashing must itself be domain-separated/chunked.
      const root = await sha(JSON.stringify(['codi-model-merkle-v1', leaves]));
      if (epoch !== startEpoch || !isCurrent({subject,projectId,fileVersion,generation})) throw new Error('Revision became stale');
      let finished = false;
      return {scheme:'codi-model-merkle-v1', root,
        commit() {
          if (finished) throw new Error('Revision transaction already finished');
          finished = true;
          if (epoch !== startEpoch || !isCurrent({subject,projectId,fileVersion,generation})) throw new Error('Revision became stale');
          // Atomic publication in this process. The file transaction itself
          // must separately enforce expected account and file version.
          entries = staged; epoch++;
        },
        discard() { finished = true; }
      };
    }
  };
}
