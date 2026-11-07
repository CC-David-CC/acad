const path = require('path');
const config = require('./webpack.concentric.config.cjs');
config.entry = path.join(__dirname, 'multi-constraint-history.test.mjs');
config.output = {path:'/tmp/codi-jsketcher-multi-constraint-history', filename:'test.cjs'};
// The shared fixture supplies window only for sketch feature detection. Node's
// MessageChannel would make React select a browser scheduler and retain a
// MessagePort after every test has finished. Use its ordinary timer fallback
// in this Node-only fixture; no CAD runtime or solver behavior is replaced.
config.plugins.push(new (require('webpack').BannerPlugin)({
  banner:'global.MessageChannel = undefined;', raw:true, entryOnly:true
}));
module.exports = config;
