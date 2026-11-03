'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const D = require('../diagnostics.cjs');
const I = require('../integration.cjs');
const M = require('../meta-contract.cjs');
const F = require('../fixtures.cjs');
const { createMetaTransport, DEFAULT_TIMEOUT_MS } = require('../meta-transport.cjs');

test('Provider-confirmed output exhaustion retains the reason and reasoning subset', () => {
  const response = { id: 'resp-fixture', model: M.MODEL, status: 'incomplete', incomplete_details: { reason: 'max_output_tokens' }, usage: { input_tokens: 537, output_tokens: 8192, total_tokens: 8729, output_tokens_details: { reasoning_tokens: 8000 } }, output: [] };
  const d = D.responseDiagnostics(response);
  assert.equal(d.classification, 'provider-confirmed-output-limit'); assert.equal(d.incompleteDetails.reason, 'max_output_tokens');
  assert.equal(d.usage.reasoningTokens, 8000); assert.equal(d.usage.nonReasoningOutputTokens, 192);
  assert.equal(d.outputSummary.visibleTextCharacters, 0);
  const packet = I.makePacket(F.semanticPack(), I.processResponse(F.semanticPack(), response));
  assert.equal(packet.reviewStatus, 'draft'); assert.ok(I.markdown(packet).includes('max_output_tokens'));
  assert.ok(I.markdown(packet).includes('Reported reasoning tokens: 8000'));
});

test('Historical incomplete response cannot acquire invented stop reason or reasoning tokens', () => {
  const d = D.responseDiagnostics({ status: 'incomplete', usage: { input_tokens: 537, output_tokens: 2048, total_tokens: 2585 }, output: [] }, { configuredOutputTokens: 2048 });
  assert.equal(d.incompleteDetails.reason, null); assert.equal(d.usage.reasoningTokens, null); assert.equal(d.usage.nonReasoningOutputTokens, null);
  assert.equal(d.classification, 'output-limit-consistent-but-stop-reason-unknown');
  assert.ok(d.warnings.some(w => w.includes('do not infer')));
});

test('Different provider stop reason remains distinct from output-limit inference', () => {
  const d = D.responseDiagnostics({ status: 'incomplete', incomplete_details: { reason: 'content_filter' }, usage: { output_tokens: 8192 }, output: [] });
  assert.equal(d.classification, 'provider-incomplete'); assert.equal(d.incompleteDetails.reason, 'content_filter');
});

test('Evidence snapshot excludes opaque reasoning, annotations, messages and secret echoes', () => {
  const key = 'FAKE-CREDENTIAL-DO-NOT-SAVE';
  const response = { id: 'resp-fixture', status: 'incomplete', model: M.MODEL,
    incomplete_details: { reason: key, explanation: 'PRIVATE-NOTE' }, error: { code: key, type: 'server_error', message: 'PRIVATE-NOTE' },
    output: [{ type: 'reasoning', encrypted_content: 'OPAQUE-DATA', summary: 'PRIVATE-NOTE' }, { type: 'message', role: 'assistant', status: 'incomplete', content: [{ type: 'output_text', text: 'Partial answer ' + key, annotations: ['PRIVATE-NOTE'] }] }] };
  const evidence = D.responseEvidence(response, { secret: key }), text = JSON.stringify(evidence);
  for (const forbidden of [key, 'OPAQUE-DATA', 'PRIVATE-NOTE', 'encrypted_content', 'annotations']) assert.ok(!text.includes(forbidden));
  assert.ok(text.includes('[REDACTED]')); assert.equal(evidence.diagnostics.outputSummary.itemTypes.reasoning, 1);
  assert.equal(evidence.visibleOutput[0].content[0].type, 'output_text');
});

test('Usage anomalies are flagged rather than inventing corrected token counts', () => {
  const d = D.responseDiagnostics({ status: 'incomplete', usage: { input_tokens: 10, output_tokens: 9000, total_tokens: 3, input_tokens_details: { cached_tokens: 20 }, output_tokens_details: { reasoning_tokens: 10000 } } });
  assert.equal(d.usage.nonReasoningOutputTokens, null); assert.ok(d.warnings.length >= 4);
  assert.equal(D.responseDiagnostics({ usage: { input_tokens: -1, output_tokens: '8192', output_tokens_details: { reasoning_tokens: 1.5 } } }).usage.inputTokens, null);
});

test('Refusal and empty completed response remain distinguishable', () => {
  const r = F.responseFor(F.semanticPack());
  r.output[0].content = [{ type: 'refusal', refusal: 'Cannot answer this fixture.' }];
  assert.equal(D.responseDiagnostics(r).classification, 'provider-refusal');
  r.output = []; assert.equal(D.responseDiagnostics(r).classification, 'completed-without-visible-answer');
});

test('HTTP errors retain safe status, request ID and provider code without raw error text', async () => {
  const key = 'FAKE-SECRET-LOCAL';
  const t = createMetaTransport({ enabled: true, apiKey: key, fetchImpl: async () => new Response(JSON.stringify({ error: { code: 'rate_limit_exceeded', type: 'rate_limit_error', message: key } }), { status: 429, headers: { 'content-type': 'application/json', 'x-request-id': 'request-fixture' } }) });
  await assert.rejects(t.send(F.semanticPack()));
  const d = t.diagnostics();
  assert.equal(d.httpStatus, 429); assert.equal(d.requestId, 'request-fixture'); assert.equal(d.providerErrorCode, 'rate_limit_exceeded');
  assert.equal(d.failureCode, 'http-error'); assert.ok(d.responseBytes > 0); assert.ok(Number.isFinite(d.elapsedMs));
  assert.ok(!JSON.stringify(d).includes(key)); assert.equal(t.requestsAttempted(), 1);
});

test('Timeout diagnostic stays stable even if an abort-ignoring stub returns late', async () => {
  let resolveLate;
  const t = createMetaTransport({ enabled: true, apiKey: 'FAKE-KEY', timeoutMs: 10, fetchImpl: async () => new Promise(resolve => { resolveLate = resolve; }) });
  await assert.rejects(t.send(F.semanticPack()));
  const before = t.diagnostics(); assert.equal(before.failureCode, 'timeout'); assert.equal(before.httpStatus, null);
  resolveLate(new Response('{}', { headers: { 'content-type': 'application/json', 'x-request-id': 'late' } }));
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(t.diagnostics(), before); assert.equal(t.requestsAttempted(), 1);
});

test('Invalid JSON, media and large responses have distinct failure classifications', async () => {
  for (const [reply, expected] of [
    [() => new Response('{', { headers: { 'content-type': 'application/json' } }), 'invalid-provider-json'],
    [() => new Response('{}', { headers: { 'content-type': 'text/html' } }), 'unexpected-content-type'],
    [() => new Response('x'.repeat(M.MAX_RESPONSE_BYTES + 1), { headers: { 'content-type': 'application/json' } }), 'response-too-large']
  ]) {
    const t = createMetaTransport({ enabled: true, apiKey: 'FAKE-KEY', fetchImpl: async () => reply() });
    await assert.rejects(t.send(F.semanticPack())); assert.equal(t.diagnostics().failureCode, expected);
  }
});

test('The 60-second bound is explicit and invalid timeouts are rejected', () => {
  assert.equal(DEFAULT_TIMEOUT_MS, 60000); assert.equal(createMetaTransport().diagnostics().timeoutMs, 60000);
  for (const timeoutMs of [0, 60001, NaN]) assert.throws(() => createMetaTransport({ timeoutMs }), /Timeout/);
});

test('Redaction does not corrupt numeric usage when a secret resembles a number', () => {
  assert.deepEqual(D.scrub({ outputTokens: 537, note: 'echo 537' }, '537'), { outputTokens: 537, note: 'echo [REDACTED]' });
});
