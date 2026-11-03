'use strict';
// Only hand-authored fixtures are processed here. No HTTP transport is created.
const fs = require('node:fs');
const path = require('node:path');
const F = require('./fixtures.cjs');
const M = require('./meta-contract.cjs');
const I = require('./integration.cjs');
const D = require('./diagnostics.cjs');
const P = require('./proposal.cjs');
if (process.argv.length !== 2) throw new Error('This command takes no arguments and supports offline rehearsal only.');
const directory = path.join(__dirname, 'examples');
fs.mkdirSync(directory, { recursive: true });
const write = (name, object) => fs.writeFileSync(path.join(directory, name), JSON.stringify(object, null, 2) + '\n');
const pack = F.semanticPack();
write('revision-proposal.json', P.proposal());
write('request-preview.json', { ...M.prepareRequest(pack), previewOnly: true, credentialsIncluded: false, authorizedModelRequests: 0 });
const complete = F.responseFor(pack, [F.semanticFinding()]);
complete.usage = { input_tokens: 537, output_tokens: 3200, total_tokens: 3737, input_tokens_details: { cached_tokens: 0 }, output_tokens_details: { reasoning_tokens: 2600 } };
const cases = [
  { name: 'completed-fixture', response: complete },
  { name: 'output-limit-fixture', response: { id: 'fixture-incomplete', model: M.MODEL, status: 'incomplete', max_output_tokens: 8192, incomplete_details: { reason: 'max_output_tokens' }, usage: { input_tokens: 537, output_tokens: 8192, total_tokens: 8729, output_tokens_details: { reasoning_tokens: 8192 } }, output: [] } },
  { name: 'missing-diagnostics-fixture', response: { id: 'fixture-missing', model: M.MODEL, status: 'incomplete', usage: { input_tokens: 537, output_tokens: 8192, total_tokens: 8729 }, output: [] } }
];
const summary = [];
for (const { name, response } of cases) {
  const audit = I.processResponse(pack, response);
  const packet = I.makePacket(pack, audit);
  write(name + '.diagnostics.json', { evidenceSource: 'hand-authored-fixture-not-model-output', ...D.responseEvidence(response) });
  write(name + '.draft.json', packet);
  fs.writeFileSync(path.join(directory, name + '.draft.md'), I.markdown(packet));
  summary.push({ name, status: audit.integration.modelStatus, classification: audit.diagnostics.classification, modelCalls: 0 });
}
console.log(JSON.stringify({ mode: 'offline-rehearsal', modelCalls: 0, summary }, null, 2));
