// The desktop owns file permissions and dialogs. These messages are only
// requests; the embedding host must verify the origin and frame source.
export const desktopFileMode = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('webos') === '1';

export function requestDesktopFileAction(action, faceId) {
  if (!desktopFileMode || window.parent === window) {
    throw new Error('The desktop file service is unavailable.');
  }
  if (!['open', 'save', 'save-as', 'export-3mf', 'export-dxf', 'export-step'].includes(action)) throw new Error('Unknown desktop file action.');
  if(action==='export-dxf'&&(typeof faceId!=='string'||!faceId||faceId.length>1024))throw new Error('Select a current sketch face.');
  window.parent.postMessage({codiJSketcher: {type: 'file-action', action, ...(action==='export-dxf'?{faceId}:{})}}, window.location.origin);
}
