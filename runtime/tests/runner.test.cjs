'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { spawnSync } = require('node:child_process');
const P = require('../proposal.cjs');
const M = require('../meta-contract.cjs');
const F = require('../fixtures.cjs');
const R = require('../run-once.cjs');
const base = path.resolve(__dirname, '../.test-work');
fs.mkdirSync(base, { recursive: true });
const fresh = () => fs.mkdtempSync(path.join(base, 'case-'));
const KEY = 'FAKE-KEY-NO-NETWORK';
function fakeGrant(overrides = {}) {
  return { status: 'explicitly-authorized', id: 'offline-test-grant-not-user-authorization', maxRequests: 1, noRetries: true, maxSpendUsd: 0.1, requestSha256: P.proposal().requestSha256, pricing: { checkedAtUtc: new Date().toISOString(), inputUsdPerMillion: 1.25, outputUsdPerMillion: 4.25 }, ...overrides };
}


test('Default runner stays disabled and consumes no attempt', async () => {
  const dir = fresh(); let calls = 0;
  await assert.rejects(R.runOnce({ resultDirectory: dir, apiKey: KEY, fetchImpl: async () => { calls++; } }), /not authorized/);
  assert.equal(calls, 0); assert.equal(fs.existsSync(path.join(dir, 'ONE-ATTEMPT.lock')), false);
});

test('Invalid approval, changed request, insufficient budget and stale pricing cannot send', async () => {
  for (const grant of [
    fakeGrant({ id: null }), fakeGrant({ id: '' }), fakeGrant({ id: 'invalid grant' }), fakeGrant({ requestSha256: 'old-request' }),
    fakeGrant({ maxSpendUsd: 0.01 }), fakeGrant({ pricing: { checkedAtUtc: '2000-01-01T00:00:00Z', inputUsdPerMillion: 1.25, outputUsdPerMillion: 4.25 } }),
    fakeGrant({ maxRequests: 2 }), fakeGrant({ noRetries: false })
  ]) {
    const dir = fresh(); let calls = 0;
    await assert.rejects(R.runOnce({ authorization: grant, apiKey: KEY, resultDirectory: dir, fetchImpl: async () => { calls++; } }));
    assert.equal(calls, 0); assert.equal(fs.existsSync(path.join(dir, 'ONE-ATTEMPT.lock')), false);
  }
});

test('Consumed IDs are rejected by fingerprint before key validation, writes or transport', async () => {
  const original = P.proposal;
  const ids = ['synthetic-consumed-grant-one', 'synthetic-consumed-grant-two'];
  const fingerprints = ids.map(id => createHash('sha256').update(id, 'utf8').digest('hex'));
  try {
    P.proposal = () => ({ ...original(), consumedAuthorizationIdSha256: fingerprints });
    for (const id of ids) {
      let calls = 0;
      const dir = path.join(fresh(), 'must-not-be-created');
      // Deliberately omit a key: consumed-ID rejection must happen first.
      await assert.rejects(R.runOnce({ authorization: fakeGrant({ id }), resultDirectory: dir, fetchImpl: async () => { calls++; } }), /invalid or consumed/);
      assert.equal(calls, 0); assert.equal(fs.existsSync(dir), false);
    }
    assert.ok(R.validateAuthorization(fakeGrant()).plannedCostUsd > 0);
  } finally { P.proposal = original; }
});

test('Missing or malformed consumed-ID fingerprints fail closed before any attempt', async () => {
  const original = P.proposal;
  const valid = original().consumedAuthorizationIdSha256;
  assert.equal(valid.length, 2);
  try {
    for (const change of [
      { consumedAuthorizationIdSha256: undefined }, { consumedAuthorizationIdSha256: [] },
      { consumedAuthorizationIdSha256: valid.slice(0, 1) },
      { consumedAuthorizationIdSha256: [...valid, valid[0]] },
      { consumedAuthorizationIdSha256: [valid[0], 'invalid'] },
      { consumedAuthorizationIdSha256: Object.assign(new Array(2), { 0: valid[0] }) },
      { consumedAuthorizationIdSha256: [valid[0], valid[0]] },
      { priorAuthorizationConsumed: false }
    ]) {
      P.proposal = () => ({ ...original(), ...change });
      let calls = 0;
      const dir = path.join(fresh(), 'must-not-be-created');
      await assert.rejects(R.runOnce({ authorization: fakeGrant(), apiKey: KEY, resultDirectory: dir, fetchImpl: async () => { calls++; } }), /denylist is invalid/);
      assert.equal(calls, 0); assert.equal(fs.existsSync(dir), false);
    }
  } finally { P.proposal = original; }
});

test('Incomplete fixture records explicit cause and reasoning count and stays draft without retry', async () => {
  const dir = fresh(); let calls = 0;
  const grant = fakeGrant();
  const response = { id: 'resp-fixture', model: M.MODEL, status: 'incomplete', incomplete_details: { reason: 'max_output_tokens' }, usage: { input_tokens: 537, output_tokens: 8192, total_tokens: 8729, output_tokens_details: { reasoning_tokens: 8192 } }, output: [] };
  const run = () => R.runOnce({ authorization: grant, apiKey: KEY, resultDirectory: dir, fetchImpl: async () => { calls++; return new Response(JSON.stringify(response), { headers: { 'content-type': 'application/json', 'x-request-id': 'fixture-request' } }); } });
  const result = await run();
  assert.equal(result.modelRequestsAttempted, 1); assert.equal(result.modelProcessingStatus, 'failed'); assert.equal(result.packetReviewStatus, 'draft');
  assert.equal(result.diagnostics.incompleteDetails.reason, 'max_output_tokens'); assert.equal(result.diagnostics.usage.reasoningTokens, 8192);
  assert.equal(result.usageCostUsdAtUncachedRates, (537 * 1.25 + 8192 * 4.25) / 1000000);
  assert.ok(result.modelStepError); assert.equal(result.transport.httpStatus, 200);
  await assert.rejects(run(), /reserved or consumed/); assert.equal(calls, 1);
  for (const file of fs.readdirSync(dir)) assert.ok(!fs.readFileSync(path.join(dir, file), 'utf8').includes(KEY));
});

test('Transport error preserves a consumed guard, error classification and unknown usage', async () => {
  const dir = fresh(); let calls = 0;
  const config = { authorization: fakeGrant(), apiKey: KEY, resultDirectory: dir, fetchImpl: async () => { calls++; return new Response(JSON.stringify({ error: { type: 'authentication_error', code: 'invalid_api_key', message: KEY } }), { status: 401, headers: { 'content-type': 'application/json' } }); } };
  const result = await R.runOnce(config);
  assert.equal(result.transport.failureCode, 'http-error'); assert.equal(result.transport.httpStatus, 401);
  assert.equal(result.transport.providerErrorCode, 'invalid_api_key'); assert.equal(result.usageCostUsdAtUncachedRates, null);
  assert.equal(result.diagnostics.classification, 'http-error'); assert.equal(result.packetReviewStatus, 'draft');
  await assert.rejects(R.runOnce(config), /reserved or consumed/); assert.equal(calls, 1);
});

test('Concurrent future invocations retain the one-attempt property', async () => {
  const dir = fresh(); let calls = 0;
  const config = { authorization: fakeGrant(), apiKey: KEY, resultDirectory: dir, fetchImpl: async () => { calls++; return new Response(JSON.stringify(F.responseFor(F.semanticPack(), [F.semanticFinding()])), { headers: { 'content-type': 'application/json' } }); } };
  const results = await Promise.allSettled([R.runOnce(config), R.runOnce(config)]);
  assert.equal(calls, 1); assert.equal(results.filter(x => x.status === 'fulfilled').length, 1);
});

test('Direct CLI cannot enable live use through flags or environment variables', () => {
  const root = path.resolve(__dirname, '..');
  const run = spawnSync(process.execPath, ['--require', './tests/no-network.cjs', 'run-once.cjs', '--live'], { cwd: root, env: { ...process.env, MODEL_API_KEY: KEY, META_ALLOW_MODEL_CALLS: 'true' }, encoding: 'utf8' });
  assert.notEqual(run.status, 0); assert.ok(run.stderr.includes('No live launcher is enabled')); assert.ok(!run.stderr.includes(KEY));
});
