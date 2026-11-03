# Handoff Auditor — standalone hackathon entry

**Current status - November 3, 2026:** [Qneolabs Handoff Auditor](https://github.com/qneolabs/handoff-auditor) is public under the MIT License, Copyright (c) 2026 Krishna Thapa (Qneolabs). Cerebral Valley's submission email confirms **Qneolabs Handoff Auditor, entry #761**. The selected [demo video](https://youtu.be/GFu-Zam6310) is **Unlisted, caption-led and silent**.

**Pre-existing:** Work Core, plus concept, evaluation and storyboard planning. **Built during this hackathon:** this standalone evidence/review interface, structured audit implementation, Meta request and citation-validation pipeline, draft packet export and saved-response replay. No Work Core source or pre-event Git history is included. This entry runs without Work Core, using synthetic data.

The new repository follows Kai's [fresh-repository clarification](https://discord.com/channels/1557169028080869426/1557169028626251802/1564257793945632779). See [origin and event work](ORIGIN-AND-EVENT-WORK.md) for source lineage and the limits of this statement.

Handoff Auditor compares project handoff claims with supplied evidence and keeps unresolved findings visible in a continuation packet. This folder contains the standalone browser demo and the revised Meta request/validation implementation used by the local experiment. It is independent of Work Core.

## Run the offline browser demo

With Python 3, run `python app/serve.py --port 8767`, then open `http://127.0.0.1:8767/`. Choose another free port if necessary. The server binds to loopback only. No account, key or installation is needed. The default sample replays a saved Meta response; the other examples are deterministic simulations.

The saved packet remains DRAFT, reviewer unrecorded and M-01 OPEN. Viewing it makes no model request. Its recorded diagnostics and usage describe a historical experiment, not a new call or current pricing.

## Run the offline checks

With Node.js 22 or newer, run `npm test` from this folder. No npm install is required. Tests preload a network blocker and use hand-authored responses. Runner tests write disposable fixture results under runtime/.test-work/; those results are excluded from the review archive. They are not real Meta attempts or authorizations.

## Source layout

- `app/`: offline replay interface, saved artifacts and local tests, with identifier redactions and explicit sharing-copy labels.
- `runtime/`: actual revised contract, transport, diagnostics and packet pipeline, plus portable fixture tests.
- `AI-TOOL-DISCLOSURE.md`: ChatGPT and Codex development assistance, model experiments and selected silent-video disclosure.
- `SOURCE-PROVENANCE.json`: source paths/hashes and explicit packaging changes.
- `LICENSE`: owner-approved MIT License, Copyright (c) 2026 Krishna Thapa (Qneolabs).
- `LICENSE-DECISION.md`: scope, provenance and external-rights boundaries of the approved grant.

The runtime defaults to disabled. The copied source intentionally contains no approved live launcher, credentials, historic authorization grant or key-entry UI. The direct runner CLI rejects live execution. Tests use fake keys and mock transport. Future live use would require an explicit scoped authorization, current pricing verification and a private key; none is granted here.

## Evidence and limits

Two historical requests were made locally: the first incomplete, the revised one completed with one usable finding. This folder's browser replay contains the successful response. It is one synthetic case, not a general benchmark. Exact source quotes and validated references do not establish authenticity, semantic truth, owner acceptance or production readiness.

All original source and evidence folders, both results and guards, and both demo videos remain unchanged. This candidate does not include Work Core code, Git history, mail, private authorization files, key-entry launchers or billing configuration. Provider request/response and local authorization identifiers have been redacted in this sharing copy. Original private artifacts remain untouched. Claims, source text, finding, request/input hashes, usage and draft/open review state are retained. The app labels the downloads as sharing copies.

The sharing runtime retains only SHA-256 denylist fingerprints for both consumed authorization IDs. Plaintext historical IDs are absent. These fingerprints are matching data, not credentials or new grants; they are not a guarantee of anonymity for a guessed identifier. Missing or malformed denylist data fails closed, and the exclusive one-attempt lock behavior is unchanged. See REDACTION-NOTES.md and VALIDATION.md.

MIT is applied to the published standalone source. The public repository, selected hosted demo and confirmed submission are recorded above. Submission confirmation is not organizer eligibility approval or independently verified waiver acceptance, and does not establish whether an offline replay satisfies the judging expectations.

## Selected demonstration

Watch the selected [Unlisted, caption-led, silent demo](https://youtu.be/GFu-Zam6310). Its local source is `handoff-auditor-caption-led-180s.mp4`: exactly 180 seconds, burned-in English captions, **no audio stream**, SHA-256 `c495596c4d89041f0e309b1ae35f7dc2fbf9610e9e50f7b87d67b7705efc64e1`. This checksum identifies the local source video, not YouTube's transcoded stream. It preserves the opening prior-work disclosure and distinguishes saved real Meta output from deterministic examples. There is **no live inference during the demo**: two historical Meta attempts produced one usable saved result. The packet stays DRAFT, M-01 OPEN, reviewer unrecorded. The video is maintained separately and is not bundled in this source archive. Earlier narrated editions are historical originals, not the selected demo.
