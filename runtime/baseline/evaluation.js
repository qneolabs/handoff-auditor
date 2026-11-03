(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.AuditorEvaluation = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const assert = (ok, message) => { if (!ok) throw new Error(message || 'Expectation failed.'); };
  function throws(fn, fragment) { let error; try { fn(); } catch (e) { error = e; } assert(error && error.message.includes(fragment), `Expected rejection containing: ${fragment}`); }
  function base() { return { schemaVersion: 1, project: { id: 'eval', name: 'Synthetic evaluation', synthetic: true }, handoff: { title: 'Evaluation', claims: [{ id: 'C1', text: 'The test suite passed.', stage: 'tested', evidenceIds: ['E1'] }] }, evidence: [{ id: 'E1', projectId: 'eval', title: 'Test result', kind: 'test', text: 'Ten synthetic tests passed. Owner acceptance is pending.', verifies: ['C1'] }], decisions: [] }; }
  const cases = [
    ['Tests do not prove acceptance', C => { const p=base();p.handoff.claims[0].stage='accepted';assert(C.audit(p).findings.some(f=>f.type==='unsupported-stage')); }],
    ['Implementation does not prove tests passed', C => { const p=base();p.evidence[0].kind='implementation';assert(C.audit(p).claimChecks[0].status==='evidence-gap'); }],
    ['Matching test record supports a bounded test claim', C => { const a=C.audit(base());assert(a.findings.length===0 && a.claimChecks[0].status==='matching-record'); }],
    ['Deployment does not prove human acceptance', C => { const p=base();p.handoff.claims[0].stage='accepted';p.evidence[0].kind='deployment';assert(C.audit(p).claimChecks[0].status==='evidence-gap'); }],
    ['Acceptance record needs a named reviewer', C => { const p=base();p.handoff.claims[0].stage='accepted';p.evidence[0].kind='acceptance';assert(C.audit(p).claimChecks[0].status==='evidence-gap'); }],
    ['Acceptance record is not independently authenticated', C => { const p=base();p.handoff.claims[0].stage='accepted';p.evidence[0].kind='acceptance';p.evidence[0].reviewer='Synthetic owner';const k=C.makePacket(p,C.audit(p));assert(k.claimChecks[0].status==='matching-record' && k.limitation.includes('not authenticated evidence')); }],
    ['Missing source is retained as an unresolved finding', C => { const p=base();p.handoff.claims[0].evidenceIds=['MISSING'];assert(C.audit(p).findings.some(f=>f.type==='missing-source')); }],
    ['Unlinked record cannot support a claim', C => { const p=base();p.evidence[0].verifies=[];assert(C.audit(p).claimChecks[0].status==='evidence-gap'); }],
    ['Superseded decision is detected', C => { const p=base();p.decisions=[{id:'D1',projectId:'eval',topic:'Route',value:'Old',status:'superseded',evidenceIds:['E1']}];assert(C.audit(p).findings.some(f=>f.type==='stale-decision')); }],
    ['Conflicting active decisions remain unresolved', C => { const p=base();p.decisions=['A','B'].map((v,i)=>({id:'D'+i,projectId:'eval',topic:'Route',value:v,status:'active',evidenceIds:['E1']}));const a=C.audit(p);assert(a.findings.some(f=>f.type==='decision-conflict'));assert(C.makePacket(p,a).continuation.unresolvedFindingIds.length===1); }],
    ['Superseded alternative is not an active conflict', C => { const p=base();p.decisions=['A','B'].map((v,i)=>({id:'D'+i,projectId:'eval',topic:'Route',value:v,status:i?'active':'superseded',evidenceIds:['E1']}));assert(!C.audit(p).findings.some(f=>f.type==='decision-conflict')); }],
    ['Duplicate source IDs are rejected', C => { const p=base();p.evidence.push(C.copy(p.evidence[0]));throws(()=>C.audit(p),'Duplicate evidence'); }],
    ['Cross-project evidence is rejected before audit', C => { const p=base();p.evidence[0].projectId='other';throws(()=>C.audit(p),'different project'); }],
    ['Cross-project decisions are rejected before audit', C => { const p=base();p.decisions=[{id:'D1',projectId:'other',topic:'Route',value:'A',status:'active',evidenceIds:['E1']}];throws(()=>C.audit(p),'different project'); }],
    ['Unknown schema is rejected', C => { const p=base();p.schemaVersion=99;throws(()=>C.audit(p),'schemaVersion'); }],
    ['Invented model citation is rejected', C => { const p=base();p.handoff.claims[0].stage='accepted';const f=C.simulate(p)[0];f.citations[0].evidenceId='INVENTED';const a=C.audit(p,[f]);assert(a.findings.length===0 && a.rejected.length===1); }],
    ['Altered quotation is rejected', C => { const p=base();p.handoff.claims[0].stage='accepted';const f=C.simulate(p)[0];f.citations[0].quote='Owner acceptance is complete.';assert(C.audit(p,[f]).rejected.length===1); }],
    ['Model cannot attach a finding to an unknown claim', C => { const p=base();p.handoff.claims[0].stage='accepted';const f=C.simulate(p)[0];f.claimIds=['FOREIGN'];assert(C.audit(p,[f]).rejected.length===1); }],
    ['Unreviewed export preserves open findings and draft status', C => { const p=base();p.handoff.claims[0].stage='accepted';const a=C.audit(p);const k=C.makePacket(p,a);assert(k.reviewStatus==='draft' && k.findings[0].review.disposition==='open' && C.markdown(k).includes('evidence-gap')); }],
    ['Dismissal requires a reason and never promotes acceptance', C => { const p=base();p.handoff.claims[0].stage='accepted';const a=C.audit(p);const id=a.findings[0].id;throws(()=>C.reviewFinding(a,{},id,'dismissed',''),'reason');const reviews=C.reviewFinding(a,{},id,'dismissed','Synthetic reviewer disagrees; obtain actual acceptance evidence.');const k=C.makePacket(p,a,reviews,'Synthetic reviewer');assert(k.reviewStatus==='reviewed' && k.claimChecks[0].status==='evidence-gap' && k.continuation.acceptance.includes('does not assert')); }]
  ].map(([name, run], i) => ({ id: i+1, name, run }));
  function run(core) { return cases.map(c=>{try{c.run(core);return {id:c.id,name:c.name,passed:true};}catch(e){return {id:c.id,name:c.name,passed:false,error:e.message};}}); }
  return { cases, run, base };
});
