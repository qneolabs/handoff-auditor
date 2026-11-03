const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../core.js');
const samples = require('../samples.js');
const evaluation = require('../evaluation.js');
for (const c of evaluation.cases) test(`Synthetic ${String(c.id).padStart(2,'0')}: ${c.name}`, () => c.run(C));

test('The readiness demonstration returns acceptance and supersession findings',()=>{
  const result=C.audit(C.copy(samples.readiness));
  assert.deepEqual(result.findings.map(f=>f.type),['unsupported-stage','stale-decision']);
  assert.equal(result.rejected.length,0);
  assert.deepEqual(result.claimChecks.map(c=>c.status),['evidence-gap','matching-record']);
});
test('Changing input invalidates old review/export state',()=>{
  const pack=C.copy(samples.readiness), a=C.audit(pack);pack.evidence[0].text+=' Changed after audit.';
  assert.throws(()=>C.makePacket(pack,a),/changed/);
});
test('A reviewed packet preserves both acknowledged and dismissed findings with reasons',()=>{
  const pack=C.copy(samples.readiness), a=C.audit(pack);
  let reviews=C.reviewFinding(a,{},a.findings[0].id,'acknowledged','Obtain a real owner acceptance record.');
  reviews=C.reviewFinding(a,reviews,a.findings[1].id,'dismissed','Implementation history intentionally mentions the old route; update the handoff separately.');
  const p=C.makePacket(pack,a,reviews,'Synthetic reviewer');
  assert.equal(p.reviewStatus,'reviewed');assert.equal(p.findings.length,2);assert.equal(p.claimChecks[0].status,'evidence-gap');
  assert.ok(C.markdown(p).includes('Obtain a real owner acceptance record'));
});
test('Review requires a reviewer name even for a zero-finding pack',()=>{
  const p=C.copy(samples.clean),a=C.audit(p);
  assert.equal(C.makePacket(p,a).reviewStatus,'draft');
  assert.equal(C.makePacket(p,a,{},'Synthetic reviewer').reviewStatus,'reviewed');
});
test('Rejected proposals keep the packet in draft and remain visible',()=>{
  const p=C.copy(samples.readiness),f=C.simulate(p)[0];f.citations[0].quote='Fabricated quote';
  const a=C.audit(p,[f]),packet=C.makePacket(p,a,{},'Synthetic reviewer');
  assert.equal(packet.reviewStatus,'draft');assert.equal(packet.rejectedProposals.length,1);
  assert.ok(C.markdown(packet).includes('Rejected proposals'));
});
test('Unknown review IDs cannot be silently introduced',()=>{
  const a=C.audit(samples.readiness);assert.throws(()=>C.reviewFinding(a,{},'FOREIGN','acknowledged'),/does not belong/);
});
test('Exported source text cannot insert raw HTML or Markdown links',()=>{
  const p=C.copy(samples.clean);p.evidence[0].text='<script>alert(1)</script> [open](https://invalid.example)';
  const md=C.markdown(C.makePacket(p,C.audit(p)));
  assert.ok(!md.includes('<script>'));assert.ok(!md.includes('[open](https://'));
  assert.ok(md.includes('\\<script\\>'));
});
test('All bundled samples validate without mutation',()=>{
  for (const pack of Object.values(samples)) { const before=JSON.stringify(pack);C.audit(pack);assert.equal(JSON.stringify(pack),before); }
});
test('Every Markdown citation links to the corresponding source register entry',()=>{
  const p=C.copy(samples.readiness),md=C.markdown(C.makePacket(p,C.audit(p)));
  assert.ok(md.includes('[E-01](#source-1)'));assert.ok(md.includes('[E-03](#source-3)'));
  assert.ok(md.includes('### Source 1\n**E-01'));assert.ok(md.includes('### Source 3\n**E-03'));
});
