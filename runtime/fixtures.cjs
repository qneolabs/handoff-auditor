'use strict';
// Hand-authored synthetic provider responses. These are not captured model outputs.
const C = require('./baseline/core.js');
const samples = require('./baseline/samples.js');
const M = require('./meta-contract.cjs');

function semanticPack() {
  const pack = C.copy(samples.clean);
  pack.project = { id: 'demo-semantic', name: 'Synthetic acceptance contradiction', synthetic: true };
  pack.handoff.claims[0] = { id: 'C-01', text: 'The owner has accepted this project for live use.', stage: 'accepted', evidenceIds: ['E-01'] };
  pack.evidence[0] = { id: 'E-01', projectId: pack.project.id, title: 'Mislabelled acceptance record', kind: 'acceptance', reviewer: 'Synthetic owner', text: 'Owner approval is still pending. The local checks passed, but live acceptance has not occurred.', verifies: ['C-01'] };
  return pack;
}

function semanticFinding() {
  return { id: 'M-01', type: 'semantic-contradiction', severity: 'high', title: 'The source contradicts the acceptance claim', summary: 'The record is labelled acceptance and names a reviewer, but its prose explicitly says approval is pending.', recommendation: 'Keep acceptance unconfirmed. Ask the owner for a dated acceptance record tied to this project; correct the handoff only after review.', claimIds: ['C-01'], decisionIds: [], citations: [{ evidenceId: 'E-01', quote: 'Owner approval is still pending.' }] };
}

function responseFor(pack, findings = []) {
  const request = M.prepareRequest(pack);
  return { id: 'fixture-response-not-a-provider-id', object: 'response', status: 'completed', model: M.MODEL, output: [{ type: 'message', role: 'assistant', status: 'completed', content: [{ type: 'output_text', text: JSON.stringify({ schemaVersion: 1, projectId: pack.project.id, inputSha256: request.inputSha256, findings }) }] }] };
}

function cases() {
  return [
    ...Object.entries(samples).map(([name, source]) => { const pack = C.copy(source); return { name, pack, response: responseFor(pack), description: 'Empty semantic fixture; deterministic findings must remain intact.' }; }),
    (() => { const pack = semanticPack(); return { name: 'semantic-contradiction', pack, response: responseFor(pack, [semanticFinding()]), description: 'Hand-authored semantic proposal catches prose that contradicts the structured acceptance label.' }; })(),
    (() => { const pack = semanticPack(), f = semanticFinding(); f.citations[0].quote = 'The owner approved everything.'; return { name: 'rejected-quotation', pack, response: responseFor(pack, [f]), description: 'Fabricated quote must be rejected and keep the packet in draft.' }; })()
  ];
}

module.exports = { semanticPack, semanticFinding, responseFor, cases };
