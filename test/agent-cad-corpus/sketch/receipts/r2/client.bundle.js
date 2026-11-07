/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./web/app/sketcher/headless/client.ts":
/*!*********************************************!*\
  !*** ./web/app/sketcher/headless/client.ts ***!
  \*********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "runSketchSolve": () => (/* binding */ runSketchSolve)
/* harmony export */ });
// This lock coordinates cooperating sketch clients on the same origin. It is
// deliberately separate from all Files and storage locks. A module instance
// permits at most two outstanding requests, including pre-dispatch checks.
const SKETCH_LOCK = 'codi-sketch-solve-v1';
const MAX_OUTSTANDING_PER_DOCUMENT = 2;
let outstanding = 0;
async function runSketchSolve(workerUrl, request) {
  let options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

  const cancelled = () => new DOMException('Sketch solve cancelled', 'AbortError');

  const valid = () => {
    var _options$signal;

    return !((_options$signal = options.signal) !== null && _options$signal !== void 0 && _options$signal.aborted) && (!options.valid || options.valid());
  };

  if (typeof options.valid !== 'undefined' && typeof options.valid !== 'function') throw new Error('Invalid solve guard.');
  if (options.signal && (typeof options.signal.addEventListener !== 'function' || typeof options.signal.removeEventListener !== 'function')) throw new Error('Invalid abort signal.');

  try {
    if (!valid()) throw cancelled();
  } catch (_) {
    throw cancelled();
  }

  if (!request || typeof request.revision !== 'string' || !request.revision || request.revision.length > 256) throw new Error('Invalid solve revision.');
  const timeout = options.timeoutMs === undefined ? 30000 : options.timeoutMs;
  if (!Number.isSafeInteger(timeout) || timeout < 1 || timeout > 30000) throw new Error('Invalid solve timeout.');
  const deadlineAt = performance.now() + timeout;
  let url;

  try {
    url = new URL(workerUrl, window.location.href);
  } catch (_) {
    throw new Error('Invalid worker URL.');
  }

  if (url.origin !== window.location.origin || !['http:', 'https:'].includes(url.protocol)) throw new Error('Sketch worker must be same-origin.');
  if (!navigator.locks || typeof navigator.locks.request !== 'function') throw new Error('Sketch solving requires browser Web Locks.');
  if (outstanding >= MAX_OUTSTANDING_PER_DOCUMENT) throw new Error('Too many pending sketch solves in this window.');
  outstanding++;

  try {
    // Limit structured-clone cost before dispatch. Yield between small batches
    // so even validation of an oversized request does not monopolize the UI.
    const todo = [[request, 0]],
          seen = new Set();
    let count = 0,
        characters = 0;

    while (todo.length) {
      const [value, depth] = todo.pop();
      if (++count > 100000 || depth > 64) throw new Error('Sketch solve request exceeds limits.');
      if (typeof value === 'string' && (characters += value.length) > 4 * 1024 * 1024) throw new Error('Sketch solve request exceeds limits.');

      if (value && typeof value === 'object') {
        if (seen.has(value)) throw new Error('Sketch solve request must be a tree.');
        seen.add(value);
        if (Array.isArray(value) && value.length > 10000) throw new Error('Sketch solve request exceeds limits.');
        const entries = Object.entries(value);
        if (entries.length + todo.length + count > 100000) throw new Error('Sketch solve request exceeds limits.');

        for (const [key, child] of entries) {
          if ((characters += key.length) > 4 * 1024 * 1024) throw new Error('Sketch solve request exceeds limits.');
          todo.push([child, depth + 1]);
        }
      }

      if (count % 512 === 0) {
        await new Promise(resolve => setTimeout(resolve, 0));

        try {
          if (!valid()) throw cancelled();
        } catch (_) {
          throw cancelled();
        }

        if (performance.now() >= deadlineAt) throw new Error('Sketch solve timed out.');
      }
    }

    try {
      if (!valid()) throw cancelled();
    } catch (_) {
      throw cancelled();
    }

    const remaining = deadlineAt - performance.now();
    if (remaining <= 0) throw new Error('Sketch solve timed out.'); // Keep the origin-wide lock for the entire lifetime of the dedicated
    // worker. Aborting a queued request does not affect the lock holder.

    const aborter = new AbortController();
    let stopReason = null;

    const stop = reason => {
      if (!stopReason) {
        stopReason = reason;
        aborter.abort();
      }
    };

    const onAbort = () => stop(cancelled());

    const deadline = setTimeout(() => stop(new Error('Sketch solve timed out.')), remaining);
    const poll = setInterval(() => {
      try {
        if (!valid()) onAbort();
      } catch (_) {
        onAbort();
      }
    }, 100);

    try {
      var _options$signal2;

      (_options$signal2 = options.signal) === null || _options$signal2 === void 0 ? void 0 : _options$signal2.addEventListener('abort', onAbort, {
        once: true
      });
      if (!valid()) onAbort();
      return await navigator.locks.request(SKETCH_LOCK, {
        mode: 'exclusive',
        signal: aborter.signal
      }, async () => {
        if (stopReason) throw stopReason;

        try {
          if (!valid()) throw cancelled();
        } catch (_) {
          throw cancelled();
        }

        if (performance.now() >= deadlineAt) throw new Error('Sketch solve timed out.');
        return await new Promise((resolve, reject) => {
          let worker;

          try {
            worker = new Worker(url.href);
          } catch (_) {
            reject(new Error('Sketch worker could not start.'));
            return;
          }

          let done = false;

          const finish = (error, value) => {
            if (done) return;
            done = true;
            aborter.signal.removeEventListener('abort', workerAbort);
            worker.terminate();
            if (error) reject(error);else resolve(value);
          };

          const workerAbort = () => finish(stopReason || cancelled());

          aborter.signal.addEventListener('abort', workerAbort, {
            once: true
          });

          worker.onerror = () => finish(new Error('Sketch worker failed.'));

          worker.onmessageerror = () => finish(new Error('Sketch worker returned invalid data.'));

          worker.onmessage = event => {
            try {
              if (stopReason || !valid()) return finish(stopReason || cancelled());

              if (performance.now() >= deadlineAt) {
                stop(new Error('Sketch solve timed out.'));
                return finish(stopReason);
              }

              const result = event.data;
              const special = request.task === 'typed-sketch-transaction' ? typeof (result === null || result === void 0 ? void 0 : result.serializedSketch) === 'string' && result.serializedSketch.length <= 1048576 : request.task === 'sketch-save-validation' ? (result === null || result === void 0 ? void 0 : result.validated) === true : !!(result !== null && result !== void 0 && result.sketch) && typeof result.sketch === 'object' && Array.isArray(result.evidence);
              if (!result || result.revision !== request.revision || typeof result.ok !== 'boolean' || result.ok && !special || !result.ok && (!result.error || typeof result.error.code !== 'string' || typeof result.error.message !== 'string')) return finish(new Error('Invalid sketch worker result.'));
              finish(null, result);
            } catch (_) {
              finish(cancelled());
            }
          };

          try {
            if (stopReason || !valid()) finish(stopReason || cancelled());else worker.postMessage(request);
          } catch (_) {
            finish(new Error('Sketch solve request could not be sent.'));
          }
        });
      });
    } catch (error) {
      throw stopReason || error;
    } finally {
      var _options$signal3;

      clearTimeout(deadline);
      clearInterval(poll);
      (_options$signal3 = options.signal) === null || _options$signal3 === void 0 ? void 0 : _options$signal3.removeEventListener('abort', onAbort);
    }
  } finally {
    outstanding--;
  }
}

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
/*!******************************************************!*\
  !*** ./test/agent-cad-corpus/sketch/client-entry.ts ***!
  \******************************************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _web_app_sketcher_headless_client__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../../web/app/sketcher/headless/client */ "./web/app/sketcher/headless/client.ts");

window.runSketchCorpusWorker = _web_app_sketcher_headless_client__WEBPACK_IMPORTED_MODULE_0__.runSketchSolve;
})();

/******/ })()
;