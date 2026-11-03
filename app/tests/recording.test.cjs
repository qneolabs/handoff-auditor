'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const C = require('../core.js');
const R = require('../recording.js');
const app = path.resolve(__dirname, '..');
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(app, 'recording-data.js'), 'utf8'), context);
const data = JSON.parse(JSON.stringify(context.window.AuditorRecordingData));
const hash = value => crypto.createHash('sha256').update(value).digest('hex');

test('Replay downloads reproduce the recorded draft bytes and open finding', () => {
  const replay = R.create(data);
  assert.equal(replay.json(), fs.readFileSync(path.join(app, 'recorded-meta/continuation-packet.json'), 'utf8'));
  assert.equal(replay.markdown(), fs.readFileSync(path.join(app, 'recorded-meta/continuation-packet.md'), 'utf8'));
  assert.equal(hash(replay.json()), data.sourceHashes['continuation-packet.json']);
  assert.equal(hash(replay.markdown()), data.sourceHashes['continuation-packet.md']);
  const packet = replay.packet(replay.input());
  assert.equal(packet.reviewStatus, 'draft'); assert.equal(packet.reviewer, null);
  assert.equal(packet.findings[0].review.disposition, 'open');
  assert.equal(replay.metadata().newModelCalls, 0);
  assert.equal(replay.metadata().originalModelRequests, 1);
});

test('Replay cannot attach a recorded finding to edited evidence', () => {
  const replay = R.create(data), input = replay.input();
  input.evidence[0].text = 'Owner acceptance was granted.';
  assert.throws(() => replay.audit(input), /inconsistent/);
  assert.throws(() => replay.packet(input), /inconsistent/);
});

test('Changes to returned objects cannot acknowledge or rewrite the stored result', () => {
  const replay = R.create(data), input = replay.input(), packet = replay.packet(input);
  packet.reviewStatus = 'reviewed'; packet.findings[0].review.disposition = 'acknowledged';
  replay.audit(input).findings[0].summary = 'replaced';
  const next = replay.packet(input);
  assert.equal(next.reviewStatus, 'draft');
  assert.equal(next.findings[0].review.disposition, 'open');
  assert.notEqual(replay.audit(input).findings[0].summary, 'replaced');
  assert.equal(C.simulate(input).length, 0, 'The saved semantic finding must not be presented as a structured simulation finding');
  assert.equal(replay.audit(input).findings.length, 1);
});

test('Changed review state, source quotes, response binding and failed receipt reject replay', () => {
  const changes = [
    value => { const p = JSON.parse(value.packetJson); p.reviewStatus = 'reviewed'; value.packetJson = JSON.stringify(p); },
    value => { const p = JSON.parse(value.packetJson); p.findings[0].review.disposition = 'acknowledged'; value.packetJson = JSON.stringify(p); },
    value => { const p = JSON.parse(value.packetJson); p.evidence[0].text = 'Something else'; value.packetJson = JSON.stringify(p); },
    value => { value.receipt.inputSha256 = 'wrong'; },
    value => { value.receipt.modelProcessingStatus = 'failed'; }
  ];
  for (const mutate of changes) { const changed = C.copy(data); mutate(changed); assert.throws(() => R.create(changed), /inconsistent/); }
});

test('All copied evidence hashes match the captured source manifest', () => {
  for (const [file, sha256] of Object.entries(data.sourceHashes)) assert.equal(hash(fs.readFileSync(path.join(app, 'recorded-meta', file))), sha256);
});
