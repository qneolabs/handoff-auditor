/* Standalone offline prototype. No network, model SDK, or Work Core dependency. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.AuditorCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const STAGES = { implemented: 'implementation', tested: 'test', deployed: 'deployment', accepted: 'acceptance' };
  const KINDS = ['note', 'implementation', 'test', 'deployment', 'acceptance', 'decision'];
  const TYPES = ['unsupported-stage', 'missing-source', 'stale-decision', 'decision-conflict'];
  const copy = value => JSON.parse(JSON.stringify(value));
  const nonempty = value => typeof value === 'string' && value.trim().length > 0;
  const fail = message => { throw new Error(message); };
  function validatePack(pack) {
    if (!pack || typeof pack !== 'object' || Array.isArray(pack)) fail('The evidence pack must be a JSON object.');
    if (pack.schemaVersion !== 1) fail('Use schemaVersion: 1.');
    if (!pack.project || !nonempty(pack.project.id) || !nonempty(pack.project.name)) fail('Project ID and name are required.');
    if (!pack.handoff || !nonempty(pack.handoff.title) || !Array.isArray(pack.handoff.claims) || !pack.handoff.claims.length) fail('Provide a handoff title and at least one claim.');
    if (pack.handoff.claims.length > 50) fail('A pack can contain at most 50 claims.');
    if (!Array.isArray(pack.evidence) || pack.evidence.length > 150) fail('Evidence must be an array of at most 150 sources.');
    if (!Array.isArray(pack.decisions) || pack.decisions.length > 50) fail('Decisions must be an array of at most 50 records.');
    const lists = [['claims', pack.handoff.claims], ['evidence', pack.evidence], ['decisions', pack.decisions]];
    for (const [label, records] of lists) {
      const seen = new Set();
      for (const record of records) {
        if (!record || typeof record !== 'object' || !nonempty(record.id) || record.id.length > 80) fail(`Every ${label} record needs an ID of 1–80 characters.`);
        if (seen.has(record.id)) fail(`Duplicate ${label} ID: ${record.id}`);
        seen.add(record.id);
      }
    }
    const claimIDs = new Set(pack.handoff.claims.map(x => x.id));
    const evidenceIDs = new Set(pack.evidence.map(x => x.id));
    const strings = (value, label) => {
      if (!Array.isArray(value) || value.length > 150 || value.some(x => !nonempty(x))) fail(`${label} must be an array of IDs.`);
    };
    for (const claim of pack.handoff.claims) {
      if (!nonempty(claim.text) || claim.text.length > 4000) fail(`Claim ${claim.id} needs text of 1–4,000 characters.`);
      if (!Object.hasOwn(STAGES, claim.stage)) fail(`Claim ${claim.id} has an unknown stage. Use implemented, tested, deployed, or accepted.`);
      strings(claim.evidenceIds, `Claim ${claim.id} evidenceIds`);
    }
    for (const source of pack.evidence) {
      if (source.projectId !== pack.project.id) fail(`Source ${source.id} belongs to a different project. Nothing was audited.`);
      if (!nonempty(source.title) || !nonempty(source.text) || source.text.length > 20000) fail(`Source ${source.id} needs a title and text of 1–20,000 characters.`);
      if (!KINDS.includes(source.kind)) fail(`Source ${source.id} has an unknown evidence kind.`);
      strings(source.verifies, `Source ${source.id} verifies`);
      if (source.verifies.some(id => !claimIDs.has(id))) fail(`Source ${source.id} names a claim outside this pack.`);
      if (source.reviewer !== undefined && typeof source.reviewer !== 'string') fail(`Source ${source.id} reviewer must be text.`);
    }
    for (const decision of pack.decisions) {
      if (decision.projectId !== pack.project.id) fail(`Decision ${decision.id} belongs to a different project. Nothing was audited.`);
      if (!nonempty(decision.topic) || !nonempty(decision.value) || !['active', 'superseded'].includes(decision.status)) fail(`Decision ${decision.id} needs a topic, value, and active/superseded status.`);
      strings(decision.evidenceIds, `Decision ${decision.id} evidenceIds`);
      if (!decision.evidenceIds.length || decision.evidenceIds.some(id => !evidenceIDs.has(id))) fail(`Decision ${decision.id} must cite an existing source.`);
    }
    if (JSON.stringify(pack).length > 1000000) fail('This prototype accepts packs up to 1 MB.');
    return pack;
  }
  function checkClaim(pack, claim) {
    const linked = pack.evidence.filter(e => claim.evidenceIds.includes(e.id));
    const supporting = linked.filter(e => e.kind === STAGES[claim.stage] && e.verifies.includes(claim.id) && (e.kind !== 'acceptance' || nonempty(e.reviewer)));
    return {
      claimId: claim.id, claimedStage: claim.stage,
      status: supporting.length ? 'matching-record' : 'evidence-gap',
      supportingEvidenceIds: supporting.map(e => e.id),
      missingEvidenceIds: claim.evidenceIds.filter(id => !pack.evidence.some(e => e.id === id)),
      note: supporting.length ? 'A matching declared record is present; its authenticity and truth have not been independently verified.' : `No cited ${STAGES[claim.stage]} record explicitly verifies this claim${claim.stage === 'accepted' ? ' with a named reviewer' : ''}.`
    };
  }
  function simulate(pack) {
    validatePack(pack);
    const candidates = [];
    function add(type, severity, title, summary, recommendation, claimIds, decisionIds, evidenceIds) {
      const citations = [...new Set(evidenceIds)].map(id => pack.evidence.find(e => e.id === id)).filter(Boolean).map(e => ({ evidenceId: e.id, quote: e.text.slice(0, 240) }));
      candidates.push({ id: `F-${String(candidates.length + 1).padStart(2, '0')}`, type, severity, title, summary, recommendation, claimIds, decisionIds, citations });
    }
    for (const claim of pack.handoff.claims) {
      const result = checkClaim(pack, claim);
      if (result.missingEvidenceIds.length) add('missing-source', 'high', 'A cited source is missing', `“${claim.text}” refers to ${result.missingEvidenceIds.join(', ')}, which is absent from this pack.`, 'Attach the missing source or remove the unsupported reference. Keep the claim unresolved until reviewed.', [claim.id], [], claim.evidenceIds);
      if (result.status === 'evidence-gap') add('unsupported-stage', claim.stage === 'accepted' ? 'high' : 'medium', claim.stage === 'accepted' ? 'Acceptance has not been evidenced' : `The ${claim.stage} claim needs evidence`, result.note, `Provide ${['acceptance', 'implementation'].includes(STAGES[claim.stage]) ? 'an' : 'a'} ${STAGES[claim.stage]} record explicitly tied to ${claim.id}${claim.stage === 'accepted' ? ', with a named human reviewer' : ''}, or qualify the handoff claim.`, [claim.id], [], claim.evidenceIds);
      const old = pack.decisions.filter(d => d.status === 'superseded' && d.evidenceIds.some(id => claim.evidenceIds.includes(id)));
      if (old.length) add('stale-decision', 'medium', 'The handoff cites a superseded decision', `Claim ${claim.id} relies on ${old.map(d => d.id).join(', ')}, marked superseded in this pack.`, 'Review the current decision and replace the stale reference. Do not silently choose a replacement.', [claim.id], old.map(d => d.id), old.flatMap(d => d.evidenceIds));
    }
    const topics = [...new Set(pack.decisions.filter(d => d.status === 'active').map(d => d.topic))];
    for (const topic of topics) {
      const active = pack.decisions.filter(d => d.status === 'active' && d.topic === topic);
      if (new Set(active.map(d => d.value)).size > 1) add('decision-conflict', 'high', 'Two current decisions disagree', `“${topic}” has conflicting active values: ${active.map(d => `${d.id}: ${d.value}`).join('; ')}.`, 'Ask the decision owner to resolve the conflict. Preserve both records until one is explicitly superseded.', [], active.map(d => d.id), active.flatMap(d => d.evidenceIds));
    }
    return candidates;
  }
  function validateProposal(pack, proposal) {
    const errors = [];
    if (!proposal || typeof proposal !== 'object') return ['Proposal must be an object.'];
    if (!nonempty(proposal.id) || !TYPES.includes(proposal.type) || !['high', 'medium', 'low'].includes(proposal.severity)) errors.push('Invalid finding identity, type, or severity.');
    for (const field of ['title', 'summary', 'recommendation']) if (!nonempty(proposal[field]) || proposal[field].length > 10000) errors.push(`Missing or oversized ${field}.`);
    for (const [field, records] of [['claimIds', pack.handoff.claims], ['decisionIds', pack.decisions]]) {
      if (!Array.isArray(proposal[field]) || proposal[field].some(id => !records.some(r => r.id === id))) errors.push(`Unknown ${field} reference.`);
    }
    if (!Array.isArray(proposal.citations)) errors.push('Citations must be an array.');
    else for (const cite of proposal.citations) {
      const source = pack.evidence.find(e => e.id === cite?.evidenceId);
      if (!source || source.projectId !== pack.project.id) errors.push(`Unknown or out-of-project source: ${cite?.evidenceId}.`);
      else if (!nonempty(cite.quote) || !source.text.includes(cite.quote)) errors.push(`Quotation does not occur verbatim in ${source.id}.`);
    }
    return errors;
  }
  function audit(pack, candidateOverride) {
    validatePack(pack);
    const proposed = candidateOverride === undefined ? simulate(pack) : candidateOverride;
    if (!Array.isArray(proposed) || proposed.length > 500) fail('The simulation returned an invalid finding list.');
    const findings = [], rejected = [], seen = new Set();
    for (const proposal of proposed) {
      const errors = validateProposal(pack, proposal);
      if (seen.has(proposal?.id)) errors.push('Duplicate finding ID.');
      seen.add(proposal?.id);
      if (errors.length) rejected.push({ id: proposal?.id || 'unknown', errors });
      else findings.push(copy(proposal));
    }
    return { mode: 'offline-simulation', projectId: pack.project.id, inputSnapshot: JSON.stringify(pack), findings, rejected, claimChecks: pack.handoff.claims.map(c => checkClaim(pack, c)) };
  }
  function reviewFinding(auditResult, reviews, id, disposition, note = '') {
    if (!auditResult.findings.some(f => f.id === id)) fail('This finding does not belong to the current audit.');
    if (!['open', 'acknowledged', 'dismissed'].includes(disposition)) fail('Unknown review disposition.');
    if (typeof note !== 'string' || note.length > 4000) fail('Review notes must be text of at most 4,000 characters.');
    if (disposition === 'dismissed' && !note.trim()) fail('Add a reason before dismissing a finding.');
    return { ...reviews, [id]: { disposition, note: note.trim() } };
  }
  function makePacket(pack, auditResult, reviews = {}, reviewer = '') {
    validatePack(pack);
    if (!auditResult || auditResult.inputSnapshot !== JSON.stringify(pack)) fail('The evidence pack changed. Run a new audit before exporting.');
    if (typeof reviewer !== 'string' || reviewer.length > 200) fail('Reviewer name must be text of at most 200 characters.');
    const findings = auditResult.findings.map(f => {
      const review = reviews[f.id] || { disposition: 'open', note: '' };
      reviewFinding(auditResult, {}, f.id, review.disposition, review.note);
      return { ...copy(f), review: copy(review) };
    });
    const open = findings.filter(f => f.review.disposition === 'open').length;
    const status = !open && reviewer.trim() && !auditResult.rejected.length ? 'reviewed' : 'draft';
    return {
      schemaVersion: 1, title: 'Handoff Auditor — Continuation Packet', mode: 'offline-simulation',
      reviewStatus: status, reviewer: reviewer.trim() || null, project: copy(pack.project),
      limitation: 'Deterministic simulation only. No language model was called. Record kinds, project IDs, verification links, and reviewer names are supplied declarations, not authenticated evidence. Citation checks establish exact text and reference membership, not truth or semantic entailment. Human review here is not deployment or production acceptance.',
      handoff: copy(pack.handoff), claimChecks: copy(auditResult.claimChecks), findings,
      rejectedProposals: copy(auditResult.rejected), evidence: copy(pack.evidence), decisions: copy(pack.decisions),
      continuation: {
        unresolvedFindingIds: findings.filter(f => f.review.disposition === 'open').map(f => f.id),
        acknowledgedFindingIds: findings.filter(f => f.review.disposition === 'acknowledged').map(f => f.id),
        nextAction: open || auditResult.rejected.length ? 'Review unresolved findings and rejected citations before relying on this packet.' : 'Follow the recorded review decisions; obtain any missing evidence before repeating the original claims.',
        acceptance: 'This tool does not assert release readiness or production acceptance.'
      }
    };
  }
  function markdown(packet) {
    const escape = s => String(s ?? '').replace(/[\\`*_{}\[\]()#+.!<>|]/g, '\\$&');
    const lines = [`# ${packet.title}`, '', `Project: ${escape(packet.project.name)} (${escape(packet.project.id)})`, `Review: **${packet.reviewStatus.toUpperCase()}**`, `Reviewer: ${escape(packet.reviewer || 'Not recorded')}`, '', '> OFFLINE SIMULATION — NO MODEL CALLS', '', packet.limitation, '', '## Original handoff claims', ''];
    for (const claim of packet.handoff.claims) {
      const check = packet.claimChecks.find(c => c.claimId === claim.id);
      lines.push(`- ${escape(claim.id)} — ${escape(claim.text)} | Claimed: ${claim.stage} | Check: ${check.status}`, `  - ${escape(check.note)}`);
    }
    lines.push('', '## Findings and human review', '');
    if (!packet.findings.length) lines.push('No findings in the supported structured checks. This is not a general correctness or readiness guarantee.');
    for (const f of packet.findings) {
      lines.push(`### ${f.id}: ${escape(f.title)}`, `Disposition: **${f.review.disposition}**`, '', escape(f.summary), '', `Next: ${escape(f.recommendation)}`);
      for (const c of f.citations) lines.push('', `Source: [${escape(c.evidenceId)}](#source-${packet.evidence.findIndex(e => e.id === c.evidenceId) + 1})`, `> ${escape(c.quote).replace(/\n/g, '\n> ')}`);
      if (f.review.note) lines.push('', `Reviewer note: ${escape(f.review.note)}`);
      lines.push('');
    }
    lines.push('## Source register', '');
    packet.evidence.forEach((e, i) => lines.push(`### Source ${i + 1}`, `**${escape(e.id)} — ${escape(e.title)}**`, `Kind: ${e.kind} | Project: ${escape(e.projectId)}`, '', ...e.text.split('\n').map(line => `> ${escape(line)}`), ''));
    lines.push('## Decision register', '');
    for (const d of packet.decisions) lines.push(`- ${escape(d.id)}: ${escape(d.topic)} → ${escape(d.value)} [${d.status}]; sources: ${d.evidenceIds.map(escape).join(', ')}`);
    if (packet.rejectedProposals.length) lines.push('', '## Rejected proposals', '', ...packet.rejectedProposals.map(r => `- ${escape(r.id)}: ${r.errors.map(escape).join(' ')}`));
    lines.push('', '## Continue from here', '', packet.continuation.nextAction, '', packet.continuation.acceptance, '');
    return lines.join('\n');
  }
  return { validatePack, simulate, validateProposal, audit, checkClaim, reviewFinding, makePacket, markdown, copy };
});
