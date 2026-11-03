'use strict';
const M = require('./meta-contract.cjs');
const D = require('./diagnostics.cjs');
const DEFAULT_TIMEOUT_MS = 60000;

function createMetaTransport({ enabled = false, apiKey, fetchImpl = globalThis.fetch, timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > DEFAULT_TIMEOUT_MS) throw new Error('Timeout must be between 1 and 60,000 ms.');
  let requests = 0;
  let record = { requestAttempted: false, httpStatus: null, requestId: null, timeoutMs, elapsedMs: null, responseBytes: 0, failureCode: null, providerErrorCode: null, providerErrorType: null };
  const snapshot = () => D.scrub(record, apiKey);
  return Object.freeze({
    requestsAttempted: () => requests,
    diagnostics: snapshot,
    async send(pack) {
      if (enabled !== true) throw new Error('Live Meta calls are disabled. Separate scoped authorization is required.');
      if (typeof apiKey !== 'string' || !/^[\x21-\x7E]+$/.test(apiKey)) throw new Error('A valid server-side API key is required.');
      if (requests >= 1) throw new Error('The one-request transport budget is exhausted. No retry or fallback is permitted.');
      const prepared = M.prepareRequest(pack);
      if (typeof fetchImpl !== 'function') throw new Error('No HTTP transport is available.');
      const controller = new AbortController();
      let timer, closed = false;
      const started = Date.now();
      requests++;
      record.requestAttempted = true;
      const update = changes => { if (!closed) Object.assign(record, changes); };
      const failure = code => { const error = new Error(code); error.localCode = code; return error; };
      const operation = async () => {
        let response;
        try {
          response = await fetchImpl(M.ENDPOINT, { method: 'POST', redirect: 'error', signal: controller.signal,
            headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(prepared.body) });
        } catch { throw failure(controller.signal.aborted ? 'timeout' : 'network-or-redirect-error'); }
        if (controller.signal.aborted) throw failure('timeout');
        update({ httpStatus: response.status, requestId: D.token(response.headers.get('x-request-id')) });
        const httpFailure = !response.ok;
        if (!response.headers.get('content-type')?.toLowerCase().includes('application/json')) throw failure(httpFailure ? 'http-error' : 'unexpected-content-type');
        const length = Number(response.headers.get('content-length'));
        if (Number.isFinite(length) && length > M.MAX_RESPONSE_BYTES) throw failure('response-too-large');
        if (!response.body) throw failure('missing-response-body');
        const reader = response.body.getReader();
        const chunks = [];
        let size = 0;
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (controller.signal.aborted) throw failure('timeout');
            if (done) break;
            size += value.byteLength;
            update({ responseBytes: size });
            if (size > M.MAX_RESPONSE_BYTES) { controller.abort(); void reader.cancel().catch(() => {}); throw failure('response-too-large'); }
            chunks.push(Buffer.from(value));
          }
        } finally { reader.releaseLock(); }
        let parsed;
        try { parsed = JSON.parse(Buffer.concat(chunks).toString('utf8')); }
        catch { throw failure(httpFailure ? 'http-error' : 'invalid-provider-json'); }
        if (httpFailure) {
          update({ providerErrorCode: D.token(parsed?.error?.code), providerErrorType: D.token(parsed?.error?.type) });
          throw failure('http-error');
        }
        return parsed;
      };
      try {
        const deadline = new Promise((_, reject) => { timer = setTimeout(() => { controller.abort(); reject(failure('timeout')); }, timeoutMs); });
        return await Promise.race([operation(), deadline]);
      } catch (error) {
        update({ failureCode: error.localCode || (controller.signal.aborted ? 'timeout' : 'response-read-error') });
        controller.abort();
        throw new Error('Meta request failed or exceeded its limits. No automatic retry was made.');
      } finally {
        clearTimeout(timer); update({ elapsedMs: Date.now() - started }); closed = true;
      }
    }
  });
}

module.exports = { createMetaTransport, DEFAULT_TIMEOUT_MS };
