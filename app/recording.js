(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./core.js'));
  else root.AuditorRecording = factory(root.AuditorCore);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (C) {
  'use strict';
  function create(data) {
    const saved = C.copy(data);
    const fail = () => { throw new Error('The saved recording is inconsistent. Replay is unavailable; no model was called.'); };
    if (saved.schemaVersion !== 1 || saved.provenance !== 'recorded-meta-response-offline-replay') fail();
    const packet = JSON.parse(saved.packetJson), receipt = saved.receipt;
    const input = { schemaVersion: 1, project: packet.project, handoff: packet.handoff, evidence: packet.evidence, decisions: packet.decisions };
    C.validatePack(input);
    if (packet.mode !== 'meta-live' || packet.reviewStatus !== 'draft' || packet.reviewer !== null || packet.project.synthetic !== true) fail();
    if (receipt.modelRequestsAttempted !== 1 || receipt.retries !== 0 || receipt.modelProcessingStatus !== 'completed' || receipt.diagnostics.responseStatus !== 'completed') fail();
    if (packet.integration.requestSha256 !== receipt.requestSha256 || packet.integration.inputSha256 !== receipt.inputSha256) fail();
    if (packet.findings.length !== 1 || packet.findings[0].id !== 'M-01' || packet.findings[0].type !== 'semantic-contradiction' || packet.rejectedProposals.length) fail();
    const visible = saved.responseEvidence.visibleOutput;
    if (visible.length !== 1 || visible[0].content.length !== 1) fail();
    const answer = JSON.parse(visible[0].content[0].text);
    if (answer.projectId !== input.project.id || answer.inputSha256 !== receipt.inputSha256 || answer.findings.length !== 1) fail();
    const { origin, review, ...proposal } = packet.findings[0];
    if (origin !== 'meta-model-proposal' || review.disposition !== 'open' || review.note !== '' || JSON.stringify(proposal) !== JSON.stringify(answer.findings[0])) fail();
    if (C.validateProposal(input, { ...proposal, type: 'unsupported-stage' }).length) fail();
    if (JSON.stringify(packet.claimChecks) !== JSON.stringify(input.handoff.claims.map(claim => C.checkClaim(input, claim)))) fail();
    if (!saved.packetMarkdown.includes('Review: **DRAFT**') || !saved.packetMarkdown.includes('Disposition: **open**')) fail();
    const snapshot = JSON.stringify(input);
    function checkInput(candidate) { if (JSON.stringify(candidate) !== snapshot) fail(); }
    return Object.freeze({
      input: () => C.copy(input),
      audit: candidate => {
        checkInput(candidate);
        return { mode: 'recorded-meta-replay', projectId: input.project.id, inputSnapshot: snapshot,
          findings: C.copy(packet.findings), rejected: C.copy(packet.rejectedProposals), claimChecks: C.copy(packet.claimChecks) };
      },
      packet: candidate => { checkInput(candidate); return C.copy(packet); },
      json: () => saved.packetJson,
      markdown: () => saved.packetMarkdown,
      metadata: () => ({ recordedAtUtc: receipt.finishedAtUtc, originalModelRequests: receipt.modelRequestsAttempted,
        newModelCalls: 0, costUsd: receipt.usageCostUsdAtUncachedRates, model: receipt.diagnostics.modelReported })
    });
  }
  return { create };
});
