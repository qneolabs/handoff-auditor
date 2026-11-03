'use strict';
// Future execution helper. There is deliberately no live CLI or credential prompt in this revision.
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const M = require('./meta-contract.cjs');
const I = require('./integration.cjs');
const D = require('./diagnostics.cjs');
const F = require('./fixtures.cjs');
const P = require('./proposal.cjs');
const { createMetaTransport, DEFAULT_TIMEOUT_MS } = require('./meta-transport.cjs');

function validateAuthorization(authorization, now = Date.now()) {
  const p = P.proposal();
  if (!authorization || authorization.status !== 'explicitly-authorized') throw new Error('Revision 2 is not authorized for a live request. No credentials were read and nothing was sent.');
  const consumed = p.consumedAuthorizationIdSha256;
  if (p.priorAuthorizationConsumed !== true || !Array.isArray(consumed) || consumed.length !== 2 ||
      Array.from(consumed).some(value => typeof value !== 'string' || !/^[a-f0-9]{64}$/.test(value)) || new Set(consumed).size !== 2) {
    throw new Error('Consumed-authorization denylist is invalid. Nothing was sent.');
  }
  const id = D.token(authorization.id);
  if (!id || consumed.includes(createHash('sha256').update(id, 'utf8').digest('hex'))) throw new Error('This authorization is invalid or consumed. A new, separately approved authorization is required.');
  if (authorization.maxRequests !== 1 || authorization.requestSha256 !== p.requestSha256 || authorization.noRetries !== true) throw new Error('Authorization does not match this exact one-request revision.');
  if (!Number.isFinite(authorization.maxSpendUsd) || authorization.maxSpendUsd <= 0 || authorization.maxSpendUsd > 0.1) throw new Error('A valid bounded spending authorization is required.');
  const rates = authorization.pricing;
  const age = now - Date.parse(rates?.checkedAtUtc);
  if (!Number.isFinite(age) || age < 0 || age > 24 * 3600000) throw new Error('Fresh pricing verification is required.');
  if (![rates.inputUsdPerMillion, rates.outputUsdPerMillion].every(v => Number.isFinite(v) && v > 0)) throw new Error('Verified positive token prices are required.');
  const plannedCostUsd = (p.inputTokenAllowance * rates.inputUsdPerMillion + p.maxOutputTokens * rates.outputUsdPerMillion) / 1000000;
  if (plannedCostUsd > authorization.maxSpendUsd) throw new Error('The request exceeds the newly approved budget.');
  return { proposal: p, plannedCostUsd, rates };
}

async function runOnce({ authorization = null, apiKey, fetchImpl = globalThis.fetch, resultDirectory = path.join(__dirname, 'live-result'), now = Date.now() } = {}) {
  const approved = validateAuthorization(authorization, now);
  if (typeof apiKey !== 'string' || !/^[\x21-\x7E]+$/.test(apiKey)) throw new Error('A server-side key is required; nothing was sent.');
  const pack = F.semanticPack(), prepared = M.prepareRequest(pack);
  fs.mkdirSync(resultDirectory, { recursive: true });
  let fd;
  try { fd = fs.openSync(path.join(resultDirectory, 'ONE-ATTEMPT.lock'), 'wx', 0o600); }
  catch (error) { if (error.code === 'EEXIST') throw new Error('This attempt is reserved or consumed. No retry is allowed.'); throw new Error('Could not reserve the attempt. Nothing was sent.'); }
  const startedAtUtc = new Date().toISOString();
  try {
    fs.writeFileSync(fd, JSON.stringify({ revision: 2, authorizationId: authorization.id, startedAtUtc, requestSha256: prepared.requestSha256, state: 'reserved-before-network', note: 'Keep this lock after success, failure, timeout or interruption.' }, null, 2));
    fs.fsyncSync(fd);
  } finally { fs.closeSync(fd); }
  const save = (name, object) => fs.writeFileSync(path.join(resultDirectory, name), JSON.stringify(D.scrub(object, apiKey), null, 2) + '\n');
  save('preflight.json', { revision: 2, authorizationId: authorization.id, approvedMaxSpendUsd: authorization.maxSpendUsd, plannedCostUsd: approved.plannedCostUsd, pricing: approved.rates, timeoutMs: DEFAULT_TIMEOUT_MS, maxOutputTokens: M.MAX_OUTPUT_TOKENS, requestSha256: prepared.requestSha256, inputSha256: prepared.inputSha256, noRetries: true });
  const transport = createMetaTransport({ enabled: true, apiKey, fetchImpl, timeoutMs: DEFAULT_TIMEOUT_MS });
  let response, transportError = null;
  try { response = await transport.send(pack); }
  catch { transportError = 'The single transport attempt failed. See execution diagnostics. No retry was made.'; }
  const transportDiagnostics = transport.diagnostics();
  const diagnostics = D.responseDiagnostics(response, { transport: transportDiagnostics, secret: apiKey });
  const audit = I.processResponse(pack, response, { mode: 'meta-live', transportError, attemptedRequests: transport.requestsAttempted(), transportDiagnostics });
  const packet = I.makePacket(pack, audit);
  const usage = diagnostics.usage;
  const costUsd = usage.inputTokens === null || usage.outputTokens === null ? null : (usage.inputTokens * approved.rates.inputUsdPerMillion + usage.outputTokens * approved.rates.outputUsdPerMillion) / 1000000;
  const receipt = {
    revision: 2, authorizationId: authorization.id, startedAtUtc, finishedAtUtc: new Date().toISOString(),
    state: 'attempt-complete-no-retries', modelRequestsAttempted: transport.requestsAttempted(), retries: 0,
    requestSha256: prepared.requestSha256, inputSha256: prepared.inputSha256, transport: transportDiagnostics,
    diagnostics, modelProcessingStatus: audit.integration.modelStatus,
    modelStepError: audit.integration.modelStatus === 'completed' ? null : 'The model step did not yield a fully accepted response. Inspect diagnostics and rejected proposals.',
    validationErrors: audit.rejected, acceptedFindings: audit.findings.length, packetReviewStatus: packet.reviewStatus,
    usageCostUsdAtUncachedRates: costUsd, approvedMaxSpendUsd: authorization.maxSpendUsd,
    billingCheck: costUsd === null ? 'unknown-usage' : costUsd <= authorization.maxSpendUsd ? 'within-token-cost-ceiling' : 'over-ceiling-stop',
    costNote: 'Based on provider-reported token totals at the separately verified rates; not a final billing receipt. Reasoning tokens are a subset of output and are not added twice.',
    nextAction: 'Review this result. Keep the one-attempt lock. Do not retry without another specific authorization.'
  };
  save('result-receipt.json', receipt);
  save('response-evidence.json', { transport: transportDiagnostics, ...D.responseEvidence(response, { transport: transportDiagnostics, secret: apiKey }) });
  save('continuation-packet.json', packet);
  fs.writeFileSync(path.join(resultDirectory, 'continuation-packet.md'), D.scrub({ text: I.markdown(packet) }, apiKey).text);
  return D.scrub(receipt, apiKey);
}

module.exports = { validateAuthorization, runOnce };
if (require.main === module) {
  console.error('Revision 2 is local preparation only. No live launcher is enabled; do not reuse the first authorization or remove its guard.');
  process.exitCode = 1;
}
