'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const M = require('../meta-contract.cjs');
const I = require('../integration.cjs');
const F = require('../fixtures.cjs');
const { createMetaTransport } = require('../meta-transport.cjs');
const KEY = 'TEST-ONLY-NOT-A-REAL-API-KEY';
const response = pack => new Response(JSON.stringify(F.responseFor(pack)), { headers: { 'content-type': 'application/json' } });

test('Default transport rejects before touching HTTP or credentials', async () => {
  let calls = 0;
  const t = createMetaTransport({ fetchImpl: async () => { calls++; } });
  await assert.rejects(t.send(F.semanticPack()), /disabled/);
  assert.equal(calls, 0); assert.equal(t.requestsAttempted(), 0);
});

test('Enabled transport without a key or with unsafe key characters never sends', async () => {
  for (const apiKey of [undefined, '', 'secret\r\nX-Injected: yes']) {
    let calls = 0;
    const t = createMetaTransport({ enabled: true, apiKey, fetchImpl: async () => { calls++; } });
    await assert.rejects(t.send(F.semanticPack()), /server-side API key/);
    assert.equal(calls, 0); assert.equal(t.requestsAttempted(), 0);
  }
});

test('Stub transport sees exactly the fixed Meta request; credentials do not enter preview or packet', async () => {
  const p = F.semanticPack(); let calls = 0;
  const t = createMetaTransport({ enabled: true, apiKey: KEY, fetchImpl: async (url, options) => {
    calls++; assert.equal(url, M.ENDPOINT); assert.equal(options.redirect, 'error');
    assert.equal(options.headers.Authorization, 'Bearer ' + KEY);
    assert.deepEqual(JSON.parse(options.body), M.prepareRequest(p).body);
    return response(p);
  } });
  const a = await I.runPreparedAudit(p, t);
  assert.equal(calls, 1); assert.equal(a.integration.modelStatus, 'completed');
  assert.equal(a.integration.modelRequestsAttempted, 1);
  assert.ok(!JSON.stringify(I.makePacket(p, a)).includes(KEY));
  assert.ok(!JSON.stringify(M.prepareRequest(p)).includes(KEY));
  await assert.rejects(t.send(p), /budget/); assert.equal(calls, 1);
});

test('Concurrent sends cannot exceed one request', async () => {
  const p = F.semanticPack(); let calls = 0;
  const t = createMetaTransport({ enabled: true, apiKey: KEY, fetchImpl: async () => { calls++; return response(p); } });
  const results = await Promise.allSettled([t.send(p), t.send(p)]);
  assert.equal(calls, 1); assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
});

test('Rate limit and provider failure do not retry or leak error bodies', async () => {
  for (const status of [401, 429, 500, 503]) {
    let calls = 0;
    const t = createMetaTransport({ enabled: true, apiKey: KEY, fetchImpl: async () => { calls++; return new Response(KEY, { status }); } });
    const p = F.semanticPack(), a = await I.runPreparedAudit(p, t);
    assert.equal(calls, 1); assert.equal(a.integration.modelStatus, 'failed');
    assert.equal(I.makePacket(p, a).reviewStatus, 'draft');
    assert.ok(!JSON.stringify(a).includes(KEY));
    await assert.rejects(t.send(p), /budget/);
  }
});

test('Timeout aborts and remains a visible failed audit without retry', async () => {
  let capturedSignal;
  const t = createMetaTransport({ enabled: true, apiKey: KEY, timeoutMs: 15, fetchImpl: async (_url, opts) => { capturedSignal = opts.signal; return new Promise(() => {}); } });
  const p = F.semanticPack(), a = await I.runPreparedAudit(p, t);
  assert.equal(capturedSignal.aborted, true); assert.equal(t.requestsAttempted(), 1);
  assert.equal(a.integration.modelStatus, 'failed');
});

test('Redirect failure and low-level errors are redacted', async () => {
  const t = createMetaTransport({ enabled: true, apiKey: KEY, fetchImpl: async (_url, opts) => { assert.equal(opts.redirect, 'error'); throw new Error(KEY); } });
  await assert.rejects(t.send(F.semanticPack()), error => !error.message.includes(KEY) && error.message.includes('No automatic retry'));
});

test('Oversized streamed data, wrong media and invalid JSON fail closed', async () => {
  const replies = [
    () => new Response('x'.repeat(M.MAX_RESPONSE_BYTES + 1), { headers: { 'content-type': 'application/json' } }),
    () => new Response('{}', { headers: { 'content-type': 'application/json', 'content-length': String(M.MAX_RESPONSE_BYTES + 1) } }),
    () => new Response('{}', { headers: { 'content-type': 'text/html' } }),
    () => new Response('{', { headers: { 'content-type': 'application/json' } })
  ];
  for (const reply of replies) {
    const t = createMetaTransport({ enabled: true, apiKey: KEY, fetchImpl: async () => reply() });
    await assert.rejects(t.send(F.semanticPack()), /failed or exceeded/);
    assert.equal(t.requestsAttempted(), 1);
  }
});

test('Oversized input consumes no request budget', async () => {
  const p = F.semanticPack(); p.evidence[0].text = '界'.repeat(9000);
  let calls = 0;
  const t = createMetaTransport({ enabled: true, apiKey: KEY, fetchImpl: async () => { calls++; } });
  await assert.rejects(t.send(p), /24,000/);
  assert.equal(calls, 0); assert.equal(t.requestsAttempted(), 0);
});

test('Asynchronous input mutation cannot produce a packet for the wrong snapshot', async () => {
  const p = F.semanticPack();
  const t = createMetaTransport({ enabled: true, apiKey: KEY, fetchImpl: async (_url, opts) => {
    const frozen = JSON.parse(JSON.parse(opts.body).input).evidencePack;
    p.evidence[0].text += ' Changed while pending.';
    return response(frozen);
  } });
  const a = await I.runPreparedAudit(p, t);
  assert.equal(a.integration.modelStatus, 'completed');
  assert.throws(() => I.makePacket(p, a), /changed/);
});

test('Rehearsal refuses live-mode arguments even with enabling environment variables', () => {
  const root = path.resolve(__dirname, '..');
  const run = spawnSync(process.execPath, ['--require', './tests/no-network.cjs', 'rehearse.cjs', '--live'], { cwd: root, env: { ...process.env, META_ALLOW_MODEL_CALLS: 'true', MODEL_API_KEY: KEY }, encoding: 'utf8' });
  assert.notEqual(run.status, 0); assert.ok(run.stderr.includes('offline rehearsal only'));
  assert.ok(!run.stderr.includes(KEY));
});
