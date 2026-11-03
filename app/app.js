'use strict';
(() => {
  const C = window.AuditorCore;
  const $ = id => document.getElementById(id);
  const recording = window.AuditorRecording.create(window.AuditorRecordingData);
  const state = { pack: recording.input(), recording: true, audit: null, reviews: {}, notes: {}, reviewer: '', screen: 'evidence' };
  const el = (tag, className, text) => { const e = document.createElement(tag); if (className) e.className = className; if (text !== undefined) e.textContent = text; return e; };
  const announce = message => { $('live-status').textContent = message; };
  function notice(message) { $('notice').textContent = message; $('notice').hidden = !message; }
  function download(name, content, type) {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const a = el('a'); a.href = url; a.download = name; document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    announce(`${name} downloaded.`);
  }
  function sourceButton(id, label) {
    const button = el('button', 'source-link', label || id);
    const source = state.pack.evidence.find(e => e.id === id);
    button.type = 'button';
    button.setAttribute('aria-label', source ? `Read source ${id}: ${source.title}` : `Missing source ${id}`);
    button.addEventListener('click', () => {
      if (!source) { notice(`Source ${id} is absent from this pack.`); return; }
      $('source-meta').textContent = `${source.id} / ${source.kind.toUpperCase()} / ${source.projectId}`;
      $('source-title').textContent = source.title; $('source-text').textContent = source.text;
      $('source-dialog').showModal();
    });
    return button;
  }
  function loadPack(pack, selected, replay = false) {
    C.validatePack(pack);
    state.pack = C.copy(pack); state.recording = replay; state.audit = null; state.reviews = {}; state.notes = {}; state.reviewer = '';
    $('reviewer-name').value = ''; $('sample-select').value = selected || '';
    $('step-review').disabled = true; $('step-export').disabled = true;
    notice(''); renderEvidence(); showScreen('evidence'); announce(`Loaded ${pack.project.name}. Previous audit and review cleared.`);
  }
  function renderEvidence() {
    const p = state.pack;
    $('recording-banner').hidden = !state.recording;
    $('mode-title').textContent = state.recording ? 'Recorded Meta replay' : 'Offline simulation';
    $('mode-description').textContent = state.recording ? 'A saved response on synthetic evidence. No new model call.' : 'Structured checks with simulated findings. No model or external service is called.';
    $('edit-pack').textContent = state.recording ? 'Inspect JSON' : 'Inspect / edit JSON';
    $('audit-copy').textContent = state.recording ? 'Inspect the saved Meta finding, compare its exact quotations with the source, and preview the draft prepared for sharing.' : 'Check whether each claim has the right kind of record. Surface stale references and decisions that disagree.';
    $('audit-hint').textContent = state.recording ? 'Opens a recorded response. No request, retry, credential, or additional charge.' : 'Deterministic checks, not semantic AI analysis. Running again clears the current review.';
    document.querySelectorAll('.audit-check').forEach((item, index) => {
      const labels = state.recording ? ['Saved claim → source text', 'Recorded finding → exact quotations', 'Draft packet → sharing copy'] : ['Claim → evidence stage', 'Current → superseded decisions', 'Source → exact quotation'];
      item.replaceChildren(el('span', '', String(index + 1).padStart(2, '0')), document.createTextNode(labels[index]));
    });
    $('reviewer-fields').hidden = state.recording;
    $('reviewer-name').disabled = state.recording;
    $('review-aside-copy').textContent = state.recording ? 'This is a preserved recording. M-01 stays open, the reviewer stays unrecorded, and the packet stays draft. Inspecting it does not establish owner acceptance.' : 'Acknowledging a finding records your review. It never upgrades the project’s release or acceptance status.';
    $('packet-mode').textContent = state.recording ? 'RECORDED META RESPONSE' : 'OFFLINE SIMULATION';
    $('footer-note').textContent = state.recording ? 'Saved recording · local replay · no new model calls.' : 'Nothing is saved automatically. Export to keep your review.';
    $('project-label').textContent = p.project.id.toUpperCase();
    $('data-label').textContent = p.project.synthetic === true ? 'DECLARED SYNTHETIC' : 'LOCAL INPUT';
    $('handoff-title').textContent = p.handoff.title;
    $('claims-list').replaceChildren();
    p.handoff.claims.forEach(claim => {
      const box = el('article', 'claim'), heading = el('div', 'claim-header');
      heading.append(el('span', '', claim.id), el('span', 'claim-stage', `Claims: ${claim.stage}`));
      const refs = el('div', 'claim-sources');
      if (!claim.evidenceIds.length) refs.append(el('span', 'micro', 'No sources cited'));
      claim.evidenceIds.forEach(id => refs.append(sourceButton(id)));
      box.append(heading, el('p', '', claim.text), refs); $('claims-list').append(box);
    });
    $('source-count').textContent = `${p.evidence.length} sources`; $('source-list').replaceChildren();
    p.evidence.forEach(source => {
      const row = el('details', 'source-row'), summary = el('summary');
      summary.append(el('span', 'source-code', source.id), el('span', 'source-row-title', source.title), el('span', 'source-kind', source.kind));
      row.append(summary, el('div', 'source-body', source.text)); $('source-list').append(row);
    });
    if (!p.evidence.length) $('source-list').append(el('p', 'micro', 'No evidence attached. The audit will keep unsupported claims unresolved.'));
    $('decisions-section').hidden = !p.decisions.length; $('decision-count').textContent = `${p.decisions.length} records`; $('decision-list').replaceChildren();
    p.decisions.forEach(d => {
      const row = el('div', 'decision-row'), description = el('div', '', d.value);
      description.append(el('small', '', d.topic)); row.append(el('span', 'source-code', d.id), description, el('span', `decision-status ${d.status}`, d.status)); $('decision-list').append(row);
    });
    $('run-audit').textContent = state.recording ? 'Replay saved Meta result →' : state.audit ? 'Run audit again →' : 'Run simulated audit →';
  }
  function showScreen(name, moveFocus = false) {
    if (name !== 'evidence' && !state.audit) return;
    state.screen = name;
    for (const id of ['evidence', 'review', 'export']) {
      $(`${id}-screen`).hidden = id !== name;
      const b = $(`step-${id}`); b.classList.toggle('active', id === name);
      if (id === name) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
    }
    if (name === 'review') renderReview();
    if (name === 'export') renderPacket();
    if (moveFocus && name !== 'evidence') $(`${name}-heading`).focus();
  }
  function reviewedCount() { return state.audit.findings.filter(f => state.reviews[f.id] && state.reviews[f.id].disposition !== 'open').length; }
  function refreshProgress() {
    const count = reviewedCount(), total = state.audit.findings.length;
    $('review-progress-label').textContent = `${count} of ${total} findings reviewed`;
    $('review-progress').max = total || 1; $('review-progress').value = total ? count : 1;
  }
  function renderReview() {
    const a = state.audit, findings = a.findings;
    $('review-heading').textContent = state.recording ? 'A claim the source contradicts.' : findings.length ? 'A few things to resolve.' : 'A bounded handoff holds up.';
    $('audit-summary').replaceChildren();
    [[findings.length, state.recording ? 'Recorded findings' : 'Findings to review'], [findings.reduce((n, f) => n + f.citations.length, 0), 'Exact citations checked'], [a.claimChecks.filter(c=>c.status==='evidence-gap').length, state.recording ? 'Missing declared records' : 'Claims missing evidence'], [a.rejected.length, 'Proposals rejected']].forEach(([count, label]) => {
      const cell = el('div', 'summary-cell'); cell.append(el('b', '', String(count)), el('span', '', label)); $('audit-summary').append(cell);
    });
    $('findings-list').replaceChildren();
    if (a.rejected.length) {
      const reject = el('section', 'rejected-box'); reject.append(el('h3', '', 'Some proposed findings failed citation checks.'));
      a.rejected.forEach(r=>reject.append(el('p', '', `${r.id}: ${r.errors.join(' ')}`))); $('findings-list').append(reject);
    }
    if (!findings.length) {
      const empty = el('section', 'empty-result'); empty.append(el('div', 'empty-mark', '✓'), el('h3', '', 'No issues in these structured checks.'), el('p', '', 'The declared records match the supported claim stages, and no active decision conflicts were found. This is not a guarantee of factual correctness, semantic consistency, or production readiness.')); $('findings-list').append(empty);
    }
    for (const f of findings) {
      const disposition = state.reviews[f.id]?.disposition || 'open';
      const article = el('article', `finding ${disposition}`); article.id = `finding-${f.id}`;
      const top = el('div', 'finding-top'); top.append(el('span', '', `${f.id} / ${f.severity.toUpperCase()} PRIORITY`), el('span', '', disposition.toUpperCase()));
      article.append(top, el('h3', '', f.title), el('p', '', f.summary));
      f.citations.forEach(cite => { const block = el('blockquote'); block.append(sourceButton(cite.evidenceId, `↗ ${cite.evidenceId} · exact excerpt`), el('p', '', cite.quote)); article.append(block); });
      const recommendation = el('p', 'recommendation'); recommendation.append(el('strong', '', 'SUGGESTED NEXT STEP'), document.createTextNode(f.recommendation)); article.append(recommendation);
      if (state.recording) {
        article.append(el('p', 'recording-note', 'Saved Meta proposal · read-only replay. This finding remains open; no review has been recorded.'));
        $('findings-list').append(article); continue;
      }
      const label = el('label', 'review-note-label', 'Review note · required to dismiss'); label.htmlFor = `note-${f.id}`;
      const note = el('textarea', 'review-note'); note.id = `note-${f.id}`; note.maxLength = 4000; note.rows = 2; note.placeholder = 'Record your reasoning or the evidence still needed…'; note.value = state.notes[f.id] ?? state.reviews[f.id]?.note ?? '';
      note.addEventListener('input', () => { state.notes[f.id] = note.value; if (state.reviews[f.id]) { state.reviews[f.id] = { disposition: 'open', note: note.value }; top.lastElementChild.textContent = 'OPEN'; article.className = 'finding open'; for (const b of controls.children) b.setAttribute('aria-pressed', 'false'); refreshProgress(); } });
      const error = el('p', 'finding-review-error'); error.id = `error-${f.id}`; error.setAttribute('role','alert'); note.setAttribute('aria-describedby',error.id);
      const controls = el('div', 'review-controls');
      [['acknowledged','Acknowledge finding'],['dismissed','Dismiss with reason'],['open','Reopen']].forEach(([action, title]) => {
        const button = el('button', 'secondary', title); button.setAttribute('aria-label', `${title} ${f.id}`); button.setAttribute('aria-pressed', String(disposition===action));
        button.addEventListener('click',()=>{
          try {
            state.reviews = C.reviewFinding(a,state.reviews,f.id,action,note.value); state.notes[f.id] = note.value;
            top.lastElementChild.textContent = action.toUpperCase(); article.className = `finding ${action}`; error.textContent = '';
            [...controls.children].forEach(b=>b.setAttribute('aria-pressed',String(b===button))); refreshProgress(); announce(`${f.id}: ${action}. Project acceptance has not changed.`);
          } catch(e) { error.textContent=e.message; note.focus(); }
        }); controls.append(button);
      });
      article.append(label,note,error,controls); $('findings-list').append(article);
    }
    refreshProgress();
  }
  function packet() { return state.recording ? recording.packet(state.pack) : C.makePacket(state.pack,state.audit,state.reviews,state.reviewer); }
  function renderPacket() {
    try {
      const p = packet(); $('packet-status').textContent = p.reviewStatus.toUpperCase();
      $('packet-explanation').textContent = state.recording ? 'A sharing copy of the saved draft. Provider tracking and authorization identifiers are removed; the claim, evidence and finding are unchanged. M-01 remains open with no reviewer. This replay adds zero calls.' : p.reviewStatus === 'reviewed' ? 'Every finding has a recorded disposition and reviewer. Missing project evidence remains missing; this review does not establish acceptance.' : 'This is a draft. Open findings, rejected citations, or a missing reviewer remain visible in the export. Nothing is silently resolved.';
      $('packet-preview').textContent = state.recording ? recording.markdown() : C.markdown(p);
    } catch(e) { notice(e.message); }
  }
  $('run-audit').addEventListener('click',()=>{
    try {
      state.audit=state.recording ? recording.audit(state.pack) : C.audit(state.pack); state.reviews={}; state.notes={}; state.reviewer=''; $('reviewer-name').value='';
      $('step-review').disabled=false; $('step-export').disabled=false; notice(''); renderEvidence(); showScreen('review',true);
      announce(state.recording ? 'Saved Meta response replayed. One open finding. Packet remains draft. Zero new model calls.' : `Simulation complete. ${state.audit.findings.length} findings. ${state.audit.rejected.length} rejected proposals. No model was called.`);
    } catch(e) { notice(e.message); }
  });
  for (const name of ['evidence','review','export']) $(`step-${name}`).addEventListener('click',()=>showScreen(name,true));
  $('go-packet').addEventListener('click',()=>showScreen('export',true));
  $('reviewer-name').addEventListener('input',event=>{if(!state.recording)state.reviewer=event.target.value;});
  $('sample-select').addEventListener('change',event=>{if(event.target.value==='meta-recording'){loadPack(recording.input(),'meta-recording',true);return;}const sample=window.AuditorSamples[event.target.value];if(sample)loadPack(sample,event.target.value);});
  $('edit-pack').addEventListener('click',()=>{$('json-editor').value=JSON.stringify(state.pack,null,2);$('json-editor').readOnly=state.recording;$('apply-json').hidden=state.recording;$('json-error').textContent='';$('json-dialog').showModal();});
  $('apply-json').addEventListener('click',()=>{
    try { if(state.recording)throw new Error('The recorded input is read-only. Select another sample or import a new pack to run a separate simulation.'); if($('json-editor').value.length>1000000)throw new Error('The input exceeds the 1 MB limit.'); const parsed=JSON.parse($('json-editor').value);loadPack(parsed);$('json-dialog').close(); }
    catch(e){$('json-error').textContent=`Could not load this pack. ${e.message} Current pack unchanged.`;}
  });
  $('download-sample').addEventListener('click',()=>download('evidence-pack.json',JSON.stringify(state.pack,null,2),'application/json'));
  $('download-json').addEventListener('click',()=>{try{const p=packet();download(state.recording?'recorded-meta-draft.json':'continuation-packet.json',state.recording?recording.json():JSON.stringify(p,null,2),'application/json');}catch(e){notice(e.message);}});
  $('download-markdown').addEventListener('click',()=>{try{const p=packet();download(state.recording?'recorded-meta-draft.md':'continuation-packet.md',state.recording?recording.markdown():C.markdown(p),'text/markdown;charset=utf-8');}catch(e){notice(e.message);}});
  async function importFile(file) {
    if(!file)return;
    try { if(file.size>1000000)throw new Error('The input exceeds the 1 MB limit.'); loadPack(JSON.parse(await file.text())); }
    catch(e){notice(`Could not import this pack. ${e.message} Current pack unchanged.`);}
  }
  $('file-input').addEventListener('change',async event=>{await importFile(event.target.files[0]);event.target.value='';});
  $('dropzone').addEventListener('dragover',event=>{event.preventDefault();$('dropzone').classList.add('dragging');});
  $('dropzone').addEventListener('dragleave',()=>{$('dropzone').classList.remove('dragging');});
  $('dropzone').addEventListener('drop',async event=>{event.preventDefault();$('dropzone').classList.remove('dragging');if(event.dataTransfer.files.length!==1){notice('Drop one JSON pack at a time.');return;}await importFile(event.dataTransfer.files[0]);});
  document.querySelectorAll('[data-close]').forEach(button=>button.addEventListener('click',()=>$(button.dataset.close).close()));
  $('open-evaluation').addEventListener('click',()=>$('evaluation-dialog').showModal());
  $('run-evaluation').addEventListener('click',()=>{
    const results=window.AuditorEvaluation.run(C), passed=results.filter(r=>r.passed).length;
    $('evaluation-results').replaceChildren();
    results.forEach(r=>{const li=el('li');li.append(el('span','',`${String(r.id).padStart(2,'0')} / ${r.name}`),el('strong',r.passed?'passed':'failed',r.passed?'PASS':`FAIL: ${r.error}`));$('evaluation-results').append(li);});
    $('evaluation-summary').textContent=`${passed} of ${results.length} passed · local synthetic checks · no model calls`;
  });
  C.validatePack(state.pack);$('sample-select').value='meta-recording';renderEvidence();
})();
