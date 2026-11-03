'use strict';
const C = require('./baseline/core.js');
const M = require('./meta-contract.cjs');
const D = require('./diagnostics.cjs');

function processResponse(pack, response, { mode = 'meta-offline-rehearsal', transportError = null, attemptedRequests = 0, transportDiagnostics = null } = {}) {
  if (!['meta-offline-rehearsal', 'meta-live'].includes(mode)) throw new Error('Unknown integration mode.');
  if (!Number.isInteger(attemptedRequests) || attemptedRequests < 0 || attemptedRequests > 1 || (mode === 'meta-offline-rehearsal' && attemptedRequests !== 0)) throw new Error('Invalid model-call accounting.');
  const prepared = M.prepareRequest(pack);
  const audit = C.audit(pack);
  audit.findings.forEach(f => { f.origin = 'structured-check'; });
  let modelStatus = 'completed';
  try {
    if (transportError) throw new Error(transportError);
    const candidates = M.parseResponse(response, prepared);
    const seen = new Set();
    for (const finding of candidates) {
      const errors = M.validateFinding(pack, finding);
      if (seen.has(finding?.id)) errors.push('Duplicate model finding ID.');
      seen.add(finding?.id);
      if (errors.length) audit.rejected.push({ id: /^M-\d{2,3}$/.test(finding?.id) ? finding.id : 'invalid-model-finding', errors });
      else audit.findings.push({ ...C.copy(finding), origin: mode === 'meta-live' ? 'meta-model-proposal' : 'hand-authored-fixture' });
    }
    if (audit.rejected.length) modelStatus = 'rejected-proposals';
  } catch (error) {
    modelStatus = 'failed';
    audit.rejected.push({ id: 'meta-response', errors: [error.message] });
  }
  audit.mode = mode;
  audit.diagnostics = D.responseDiagnostics(response, { transport: transportDiagnostics });
  audit.integration = {
    provider: 'Meta', configuredModel: M.MODEL, endpoint: M.ENDPOINT,
    mode, modelStatus, modelRequestsAttempted: attemptedRequests,
    responseProvenance: mode === 'meta-offline-rehearsal' ? 'hand-authored-fixture-not-model-output' : transportError || !response ? 'none' : 'provider-response',
    promptVersion: M.PROMPT_VERSION, inputSha256: prepared.inputSha256, requestSha256: prepared.requestSha256,
    transportDiagnostics,
    sourceValidation: 'Reference membership and verbatim quotations only; semantic entailment and authenticity require human review.'
  };
  return audit;
}

async function runPreparedAudit(pack, transport) {
  // Snapshot before awaiting; a concurrent edit cannot be attached to an older response.
  const snapshot = C.copy(pack);
  M.prepareRequest(snapshot);
  let response, transportError;
  try { response = await transport.send(snapshot); }
  catch { transportError = 'Meta transport did not complete. No retry was made; no model findings were accepted.'; }
  return processResponse(snapshot, response, { mode: 'meta-live', transportError, attemptedRequests: transport.requestsAttempted(), transportDiagnostics: transport.diagnostics?.() || null });
}

function makePacket(pack, audit, reviews = {}, reviewer = '') {
  if (!audit.integration) throw new Error('An integration audit is required.');
  const packet = C.makePacket(pack, audit, reviews, reviewer);
  packet.mode = audit.mode;
  packet.integration = C.copy(audit.integration);
  packet.diagnostics = C.copy(audit.diagnostics);
  packet.limitation = (audit.mode === 'meta-offline-rehearsal'
    ? 'OFFLINE REHEARSAL: semantic proposals are hand-authored fixtures. Zero model calls; this does not measure model quality. '
    : 'Meta output contains untrusted proposals, not verified facts. ') +
    'Structured claim checks evaluate supplied declarations only. Exact quotes and valid source IDs do not prove semantic entailment, authenticity, freshness or permission. Human review never establishes production acceptance. All original claims, evidence gaps and decisions remain visible.';
  return packet;
}

function markdown(packet) {
  const label = packet.mode === 'meta-offline-rehearsal' ? '> META INTEGRATION REHEARSAL — HAND-AUTHORED FIXTURES — ZERO MODEL CALLS' : '> META MODEL PROPOSALS — HUMAN REVIEW REQUIRED';
  let text = C.markdown(packet).replace('> OFFLINE SIMULATION — NO MODEL CALLS', label);
  text = text.replace('No findings in the supported structured checks. This is not a general correctness or readiness guarantee.', packet.rejectedProposals.length
    ? 'No accepted findings. Response validation failed or rejected proposals; do not interpret this as a clean audit.'
    : 'No accepted findings from these checks. A clean result does not prove semantic correctness or readiness.');
  const provenance = ['## Integration record', '', `Configured model: ${packet.integration.configuredModel}`, `Response processing: ${packet.integration.modelStatus}`, `Response provenance: ${packet.integration.responseProvenance}`, `Model requests attempted: ${packet.integration.modelRequestsAttempted}`, `Input SHA-256: ${packet.integration.inputSha256}`, `Prompt: ${packet.integration.promptVersion}`, '', 'Finding origins:', ...packet.findings.map(f => `- ${f.id}: ${f.origin}`), '', ''];
  return text + '\n' + provenance.join('\n') + '\n' + D.diagnosticMarkdown(packet.diagnostics);
}

module.exports = { processResponse, runPreparedAudit, makePacket, markdown };
