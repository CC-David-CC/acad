// Bound Canvas text work independently of the complete authored label. This is
// a view-only preview; Label.write(), editing and native persistence use text.
export const MAX_LABEL_PREVIEW = 512;
const marker = '… [long label preview]';
export function labelPreview(text) {
  if (typeof text !== 'string' || text.length <= MAX_LABEL_PREVIEW) return text;
  let prefix = text.slice(0, MAX_LABEL_PREVIEW - marker.length);
  const last = prefix.charCodeAt(prefix.length - 1);
  if (last >= 0xd800 && last <= 0xdbff) prefix = prefix.slice(0, -1);
  return prefix + marker;
}
