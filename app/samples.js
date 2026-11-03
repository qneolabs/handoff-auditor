(function (root, factory) {
  const samples = factory();
  if (typeof module === 'object' && module.exports) module.exports = samples;
  else root.AuditorSamples = samples;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const readiness = {
    schemaVersion: 1,
    project: { id: 'demo-atlas', name: 'Atlas / inventory assistant', synthetic: true },
    handoff: { title: 'Ready to pass the baton?', claims: [
      { id: 'C-01', text: 'The inventory assistant is production-ready and accepted by the owner.', stage: 'accepted', evidenceIds: ['E-01'] },
      { id: 'C-02', text: 'The email-only alert route is implemented.', stage: 'implemented', evidenceIds: ['E-02', 'E-03'] }
    ] },
    evidence: [
      { id: 'E-01', projectId: 'demo-atlas', title: 'Local regression results', kind: 'test', text: 'Synthetic run: 24 of 24 local checks passed. Live provider delivery and owner acceptance have not been tested.', verifies: ['C-01'] },
      { id: 'E-02', projectId: 'demo-atlas', title: 'Email route implementation', kind: 'implementation', text: 'Synthetic implementation record: the email-only route was added and exercised with a local fake transport.', verifies: ['C-02'] },
      { id: 'E-03', projectId: 'demo-atlas', title: 'Previous notification decision', kind: 'decision', text: 'Previous decision: use email only for notifications. This decision has been superseded.', verifies: [] },
      { id: 'E-04', projectId: 'demo-atlas', title: 'Current notification decision', kind: 'decision', text: 'Current decision: provide an in-app alert, with email as an optional channel.', verifies: [] }
    ],
    decisions: [
      { id: 'D-01', projectId: 'demo-atlas', topic: 'Notification route', value: 'Email only', status: 'superseded', evidenceIds: ['E-03'] },
      { id: 'D-02', projectId: 'demo-atlas', topic: 'Notification route', value: 'In-app with optional email', status: 'active', evidenceIds: ['E-04'] }
    ]
  };
  const conflict = {
    schemaVersion: 1, project: { id: 'demo-orbit', name: 'Orbit / research notebook', synthetic: true },
    handoff: { title: 'Two decisions, one next step', claims: [{ id: 'C-01', text: 'The export flow passed local regression checks.', stage: 'tested', evidenceIds: ['E-01'] }] },
    evidence: [
      { id: 'E-01', projectId: 'demo-orbit', title: 'Export regression', kind: 'test', text: 'Synthetic test record: JSON and Markdown export checks passed for the notebook workflow.', verifies: ['C-01'] },
      { id: 'E-02', projectId: 'demo-orbit', title: 'Hosting decision A', kind: 'decision', text: 'Decision A: use a local-only installation for the pilot.', verifies: [] },
      { id: 'E-03', projectId: 'demo-orbit', title: 'Hosting decision B', kind: 'decision', text: 'Decision B: use a hosted service for the pilot.', verifies: [] }
    ],
    decisions: [
      { id: 'D-01', projectId: 'demo-orbit', topic: 'Pilot hosting', value: 'Local only', status: 'active', evidenceIds: ['E-02'] },
      { id: 'D-02', projectId: 'demo-orbit', topic: 'Pilot hosting', value: 'Hosted service', status: 'active', evidenceIds: ['E-03'] }
    ]
  };
  const clean = {
    schemaVersion: 1, project: { id: 'demo-paper', name: 'Paper / document sorter', synthetic: true },
    handoff: { title: 'A deliberately bounded handoff', claims: [{ id: 'C-01', text: 'The document sorter passed the stated local test suite. Live acceptance remains a separate next step.', stage: 'tested', evidenceIds: ['E-01'] }] },
    evidence: [{ id: 'E-01', projectId: 'demo-paper', title: 'Local sort verification', kind: 'test', text: 'Synthetic test record: 18 local sort and export cases passed using artificial documents.', verifies: ['C-01'] }], decisions: []
  };
  return { readiness, conflict, clean };
});
