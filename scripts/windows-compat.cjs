// Some restricted Windows sessions cannot resolve the current account through libuv.
// Use the existing environment only when the native lookup fails. No credentials are read.
const os = require('node:os');
const {syncBuiltinESMExports} = require('node:module');
try { os.userInfo(); } catch {
  os.userInfo = () => ({uid:-1,gid:-1,username:process.env.USERNAME || 'local',homedir:os.homedir(),shell:null});
  syncBuiltinESMExports();
}
