'use strict';
// Loaded before all tests/rehearsals. Any accidental Node HTTP/socket use fails locally.
function denied() { throw new Error('Network is disabled in offline qualification.'); }
globalThis.fetch = denied;
for (const moduleName of ['node:http', 'node:https']) {
  const api = require(moduleName); api.request = denied; api.get = denied;
}
const net = require('node:net'); net.connect = denied; net.createConnection = denied; net.Socket.prototype.connect = denied;
const tls = require('node:tls'); tls.connect = denied;
const dgram = require('node:dgram'); dgram.createSocket = denied;
